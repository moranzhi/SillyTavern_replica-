import { create } from 'zustand';

// 异步获取角色数据
const fetchRoleData = async () => {
  try {
    const response = await fetch('/api/chats', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    const data = await response.json();

    // 转换数据格式以适应前端需求
    const roleData = {};
    if (data.chats && Array.isArray(data.chats)) {
      data.chats.forEach(chat => {
        if (!roleData[chat.role_name]) {
          roleData[chat.role_name] = [];
        }
        roleData[chat.role_name].push(chat.chat_name);
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
  roleData: {},
  selectedRole: null,
  selectedChat: null,
  hoveredRole: null,
  clickedRole: null,
  isLoading: false,
  searchTerm: '',
  editingRole: null,
  editingChat: null,
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
    }
  },

  setSelectedRole: (role) => set({ selectedRole: role }),

  setSelectedChat: (chat) => set({ selectedChat: chat }),

  setHoveredRole: (role) => set({ hoveredRole: role }),

  setClickedRole: (role) => set({ clickedRole: role }),

  setSearchTerm: (term) => set({ searchTerm: term }),

  setEditingRole: (role) => set({ editingRole: role }),

  setEditingChat: (chat) => set({ editingChat: chat }),

  setShowDeleteConfirm: (name) => set({ showDeleteConfirm: name }),

  setDeleteType: (type) => set({ deleteType: type }),

  // 同时更新角色和聊天
  setSelectedRoleAndChat: (role, chat) => set({ selectedRole: role, selectedChat: chat }),

  // 处理角色重命名
  handleRenameRole: async (oldName, newName) => {
    const { roleData, selectedRole } = get();
    if (newName && newName !== oldName) {
      try {
        // 获取该角色下的所有聊天
        const chats = roleData[oldName] || [];

        // 为每个聊天更新元数据中的角色名称
        for (const chatName of chats) {
          await fetch(`/api/chats/${encodeURIComponent(oldName)}/${encodeURIComponent(chatName)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              metadata: { character_name: newName }
            })
          });
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
        set({ editingRole: null });
      }
    } else {
      set({ editingRole: null });
    }
  },

  // 处理聊天重命名
  handleRenameChat: async (oldName, newName) => {
    const { roleData, selectedRole, selectedChat } = get();
    if (newName && newName !== oldName) {
      try {
        // 更新后端聊天名称
        await fetch(`/api/chats/${encodeURIComponent(selectedRole)}/${encodeURIComponent(oldName)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metadata: { chat_name: newName }
          })
        });

        // 更新本地状态
        const newRoleData = { ...roleData };
        const chatIndex = newRoleData[selectedRole].indexOf(oldName);
        if (chatIndex !== -1) {
          newRoleData[selectedRole][chatIndex] = newName;

          if (selectedChat === oldName) {
            set({
              roleData: newRoleData,
              selectedChat: newName,
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
        set({ editingChat: null });
      }
    } else {
      set({ editingChat: null });
    }
  },

  // 确认删除
  confirmDelete: async () => {
    const { roleData, selectedRole, selectedChat, showDeleteConfirm, deleteType } = get();

    try {
      if (deleteType === 'role') {
        // 删除角色下的所有聊天
        const chats = roleData[showDeleteConfirm] || [];
        for (const chatName of chats) {
          await fetch(`/api/chats/${encodeURIComponent(showDeleteConfirm)}/${encodeURIComponent(chatName)}`, {
            method: 'DELETE'
          });
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
        await fetch(`/api/chats/${encodeURIComponent(selectedRole)}/${encodeURIComponent(showDeleteConfirm)}`, {
          method: 'DELETE'
        });

        const newRoleData = { ...roleData };
        const chatIndex = newRoleData[selectedRole].indexOf(showDeleteConfirm);
        if (chatIndex !== -1) {
          newRoleData[selectedRole].splice(chatIndex, 1);

          if (selectedChat === showDeleteConfirm) {
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
      set({
        showDeleteConfirm: null,
        deleteType: null
      });
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
      await fetch(`/api/chats/${encodeURIComponent(newRole)}`, {
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

      const newRoleData = { ...roleData };
      newRoleData[newRole] = ['默认聊天'];
      set({
        roleData: newRoleData,
        editingRole: newRole
      });
    } catch (error) {
      console.error('添加角色失败:', error);
    }
  },

  // 添加新聊天
  handleAddChat: async () => {
    const { roleData, selectedRole } = get();
    if (!selectedRole) return;

    const newChat = '新聊天';

    try {
      await fetch(`/api/chats/${encodeURIComponent(selectedRole)}`, {
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

      const newRoleData = { ...roleData };
      newRoleData[selectedRole].push(newChat);
      set({
        roleData: newRoleData,
        editingChat: newChat
      });
    } catch (error) {
      console.error('添加聊天失败:', error);
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