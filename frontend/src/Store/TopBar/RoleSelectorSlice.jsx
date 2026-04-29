import { create } from 'zustand';

// 异步获取角色数据
const fetchRoleData = async () => {
  try {
    const response = await fetch('/api/chat', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 转换数据格式以适应前端需求
    const roleData = {};
    if (data.chat && Array.isArray(data.chat)) {
      data.chat.forEach(chat => {
        if (!roleData[chat.role_name]) {
          roleData[chat.role_name] = [];
        }
        // 保存完整的聊天信息
        roleData[chat.role_name].push({
          chat_name: chat.chat_name,
          user_name: chat.user_name,
          character_name: chat.character_name,
          last_modified: chat.last_modified,
          message_count: chat.message_count
        });
      });
    }

    return roleData;
  } catch (error) {
    console.error('获取角色数据失败:', error);
    throw error;
  }
};


const useRoleSelectorStore = create((set, get) => ({
  // 状态
  roleData: {}, // 格式: {role_name: [{chat_name, user_name, character_name, last_modified, message_count}, ...]}
  selectedRole: null,
  selectedChat: null, // 现在存储完整的聊天对象
  hoveredRole: null,
  clickedRole: null,
  isLoading: false,
  searchTerm: '',
  editingRole: null,
  editingChat: null, // 现在存储聊天名称字符串
  showDeleteConfirm: null,
  deleteType: null,


  // 操作
  fetchRoleData: async () => {
    set({ isLoading: true });
    try {
      const data = await fetchRoleData();
      set({ roleData: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('获取角色数据失败:', error);
      // 可以在这里添加用户提示，例如显示一个toast通知
    }
  },

  setSelectedRole: (role) => set({ selectedRole: role }),

  setSelectedChat: (chat) => set({ selectedChat: chat }), // chat现在是对象

  setHoveredRole: (role) => set({ hoveredRole: role }),

  setClickedRole: (role) => set({ clickedRole: role }),

  setSearchTerm: (term) => set({ searchTerm: term }),

  setEditingRole: (role) => set({ editingRole: role }),

  setEditingChat: (chat) => set({ editingChat: chat }), // chat现在是字符串(聊天名称)

  setShowDeleteConfirm: (name) => set({ showDeleteConfirm: name }),

  setDeleteType: (type) => set({ deleteType: type }),

  // 同时更新角色和聊天
  setSelectedRoleAndChat: (role, chat) => set({ selectedRole: role, selectedChat: chat }),

  // 处理角色重命名
  // 处理角色重命名
  handleRenameRole: async (oldName, newName) => {
    const { roleData, selectedRole } = get();
    if (newName && newName !== oldName) {
      // 保存原始状态以便在失败时回滚
      const originalRoleData = JSON.parse(JSON.stringify(roleData));
      const originalSelectedRole = selectedRole;

      try {
        // 获取该角色下的所有聊天
        const chats = roleData[oldName] || [];

        // 为每个聊天更新元数据中的角色名称
        for (const chat of chats) {
          const response = await fetch(`/api/chat/${encodeURIComponent(oldName)}/${encodeURIComponent(chat.chat_name)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              metadata: { character_name: newName }
            })
          });

          if (!response.ok) {
            throw new Error(`Failed to update chat: ${response.status}`);
          }
        }

        // 更新本地状态
        const newRoleData = { ...roleData };
        newRoleData[newName] = chats;
        delete newRoleData[oldName];

        if (selectedRole === oldName) {
          set({
            roleData: newRoleData,
            selectedRole: newName,
            editingRole: null
          });
        } else {
          set({
            roleData: newRoleData,
            editingRole: null
          });
        }
      } catch (error) {
        console.error('重命名角色失败:', error);
        // 回滚到原始状态
        set({
          roleData: originalRoleData,
          selectedRole: originalSelectedRole,
          editingRole: null
        });
        // 可以在这里添加用户提示
      }
    } else {
      set({ editingRole: null });
    }
  },

  // 处理聊天重命名
  handleRenameChat: async (oldChatName, newName) => {
    const { roleData, selectedRole, selectedChat } = get();
    if (newName && newName !== oldChatName) {
      // 保存原始状态以便在失败时回滚
      const originalRoleData = JSON.parse(JSON.stringify(roleData));
      const originalSelectedChat = selectedChat;

      try {
        // 更新后端聊天名称
        const response = await fetch(`/api/chat/${encodeURIComponent(selectedRole)}/${encodeURIComponent(oldChatName)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metadata: { chat_name: newName }
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to rename chat: ${response.status}`);
        }

        // 更新本地状态
        const newRoleData = { ...roleData };
        const chatIndex = newRoleData[selectedRole].findIndex(chat => chat.chat_name === oldChatName);
        if (chatIndex !== -1) {
          // 创建一个新的聊天对象，只更新chat_name
          const updatedChat = { ...newRoleData[selectedRole][chatIndex], chat_name: newName };
          newRoleData[selectedRole][chatIndex] = updatedChat;

          if (selectedChat && selectedChat.chat_name === oldChatName) {
            set({
              roleData: newRoleData,
              selectedChat: updatedChat,
              editingChat: null
            });
          } else {
            set({
              roleData: newRoleData,
              editingChat: null
            });
          }
        } else {
          set({ editingChat: null });
        }
      } catch (error) {
        console.error('重命名聊天失败:', error);
        // 回滚到原始状态
        set({
          roleData: originalRoleData,
          selectedChat: originalSelectedChat,
          editingChat: null
        });
        // 可以在这里添加用户提示
      }
    } else {
      set({ editingChat: null });
    }
  },

  // 确认删除
  // 确认删除
  confirmDelete: async () => {
    const { roleData, selectedRole, selectedChat, showDeleteConfirm, deleteType } = get();

    // 保存原始状态以便在失败时回滚
    const originalRoleData = JSON.parse(JSON.stringify(roleData));
    const originalSelectedRole = selectedRole;
    const originalSelectedChat = selectedChat;

    try {
      if (deleteType === 'role') {
        // 删除角色下的所有聊天
        const chats = roleData[showDeleteConfirm] || [];
        for (const chat of chats) {
          const response = await fetch(`/api/chat/${encodeURIComponent(showDeleteConfirm)}/${encodeURIComponent(chat.chat_name)}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            throw new Error(`Failed to delete chat: ${response.status}`);
          }
        }

        const newRoleData = { ...roleData };
        delete newRoleData[showDeleteConfirm];

        if (selectedRole === showDeleteConfirm) {
          set({
            roleData: newRoleData,
            selectedRole: null,
            selectedChat: null,
            showDeleteConfirm: null,
            deleteType: null
          });
        } else {
          set({
            roleData: newRoleData,
            showDeleteConfirm: null,
            deleteType: null
          });
        }
      } else if (deleteType === 'chat') {
        // 删除单个聊天
        const response = await fetch(`/api/chat/${encodeURIComponent(selectedRole)}/${encodeURIComponent(showDeleteConfirm)}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error(`Failed to delete chat: ${response.status}`);
        }

        const newRoleData = { ...roleData };
        const chatIndex = newRoleData[selectedRole].findIndex(chat => chat.chat_name === showDeleteConfirm);
        if (chatIndex !== -1) {
          newRoleData[selectedRole].splice(chatIndex, 1);

          if (selectedChat && selectedChat.chat_name === showDeleteConfirm) {
            set({
              roleData: newRoleData,
              selectedChat: null,
              showDeleteConfirm: null,
              deleteType: null
            });
          } else {
            set({
              roleData: newRoleData,
              showDeleteConfirm: null,
              deleteType: null
            });
          }
        } else {
          set({
            showDeleteConfirm: null,
            deleteType: null
          });
        }
      }
    } catch (error) {
      console.error('删除失败:', error);
      // 回滚到原始状态
      set({
        roleData: originalRoleData,
        selectedRole: originalSelectedRole,
        selectedChat: originalSelectedChat,
        showDeleteConfirm: null,
        deleteType: null
      });
      // 可以在这里添加用户提示
    }
  },

  // 取消删除
  cancelDelete: () => set({ showDeleteConfirm: null, deleteType: null }),

  // 添加新角色
  handleAddRole: async () => {
    const { roleData } = get();
    const newRole = '新角色';

    try {
      // 创建新角色（通过创建一个默认聊天）
      const response = await fetch(`/api/chat/${encodeURIComponent(newRole)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_name: '默认聊天',
          metadata: {
            user_name: 'User',
            character_name: newRole
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create role: ${response.status}`);
      }

      const newRoleData = { ...roleData };
      newRoleData[newRole] = [{
        chat_name: '默认聊天',
        user_name: 'User',
        character_name: newRole,
        last_modified: '',
        message_count: 0
      }];
      set({
        roleData: newRoleData,
        editingRole: newRole
      });
    } catch (error) {
      console.error('添加角色失败:', error);
      // 可以在这里添加用户提示
    }
  },

  // 添加新聊天
  handleAddChat: async () => {
    const { roleData, selectedRole } = get();
    if (!selectedRole) return;

    const newChat = '新聊天';

    try {
      const response = await fetch(`/api/chat/${encodeURIComponent(selectedRole)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_name: newChat,
          metadata: {
            user_name: 'User',
            character_name: selectedRole
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create chat: ${response.status}`);
      }

      const newRoleData = { ...roleData };
      newRoleData[selectedRole].push({
        chat_name: newChat,
        user_name: 'User',
        character_name: selectedRole,
        last_modified: '',
        message_count: 0
      });
      set({
        roleData: newRoleData,
        editingChat: newChat
      });
    } catch (error) {
      console.error('添加聊天失败:', error);
      // 可以在这里添加用户提示
    }
  },

  // 重置面板状态
  resetPanel: () => set({
    hoveredRole: null,
    clickedRole: null,
    editingRole: null,
    editingChat: null,
    showDeleteConfirm: null
  })
}));

export default useRoleSelectorStore;
