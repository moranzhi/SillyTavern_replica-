import { create } from 'zustand';

// 异步获取角色数据
const fetchRoleData = async () => {
  try {
    const response = await fetch('/api/tool_bar/get_all_role_and_chat', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    const data = await response.json();
    return data;
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

  handleRenameRole: (oldName, newName) => {
    const { roleData, selectedRole } = get();
    if (newName && newName !== oldName) {
      const newRoleData = { ...roleData };
      const chats = newRoleData[oldName];
      delete newRoleData[oldName];
      newRoleData[newName] = chats;

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
    } else {
      set({ editingRole: null });
    }
  },

  handleRenameChat: (oldName, newName) => {
    const { roleData, selectedRole, selectedChat } = get();
    if (newName && newName !== oldName) {
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
    } else {
      set({ editingChat: null });
    }
  },

  confirmDelete: () => {
    const { roleData, selectedRole, selectedChat, showDeleteConfirm, deleteType } = get();
    const newRoleData = { ...roleData };

    if (deleteType === 'role') {
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
  },

  cancelDelete: () => set({ showDeleteConfirm: null, deleteType: null }),

  handleAddRole: () => {
    const { roleData } = get();
    const newRole = '新角色';
    const newRoleData = { ...roleData };
    newRoleData[newRole] = [];
    set({
      roleData: newRoleData,
      editingRole: newRole
    });
  },

  handleAddChat: () => {
    const { roleData, selectedRole } = get();
    if (!selectedRole) return;

    const newChat = '新聊天';
    const newRoleData = { ...roleData };
    newRoleData[selectedRole].push(newChat);
    set({
      roleData: newRoleData,
      editingChat: newChat
    });
  },

  resetPanel: () => set({
    hoveredRole: null,
    clickedRole: null,
    editingRole: null,
    editingChat: null,
    showDeleteConfirm: null
  })
}));

export default useRoleSelectorStore;