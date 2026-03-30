import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useChatBoxStore = create(
  subscribeWithSelector((set, get) => ({
    // 聊天历史消息列表
    messages: [],

    // 用户名称
    userName: '',

    // 角色名称
    characterName: '',

    // 当前选中的角色
    currentRole: null,

    // 当前选中的聊天
    currentChat: null,

    // 是否正在加载
    isLoading: false,

    // 错误信息
    error: null,

    // 设置消息列表
    setMessages: (messages) => set({ messages }),

    // 设置用户名称
    setUserName: (userName) => set({ userName }),

    // 设置角色名称
    setCharacterName: (characterName) => set({ characterName }),

    // 设置当前角色
    setCurrentRole: (role) => set({ currentRole: role }),

    // 设置当前聊天
    setCurrentChat: (chat) => set({ currentChat: chat }),

    // 同时设置角色和聊天
    setChatBoxRoleAndChat: (role, chat) => set({
      currentRole: role,
      currentChat: chat
    }),


    // 加载聊天历史
    fetchChatHistory: async (roleName, chatName) => {
      set({ isLoading: true, error: null });
      try {
        const response = await fetch(`/api/chat_box/get_chat_history?role_name=${encodeURIComponent(roleName)}&chat_name=${encodeURIComponent(chatName)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch chat history');
        }
        const data = await response.json();
        // 修改数据处理逻辑，适配API返回的数据结构
        set({
          messages: data || [], // 直接使用返回的数组
          userName: 'User', // 固定用户名
          characterName: roleName || 'Assistant', // 使用角色名作为角色名称
          isLoading: false
        });
      } catch (error) {
        set({
          error: error.message,
          isLoading: false
        });
      }
    },


    // 清空聊天历史
    clearChatHistory: () => set({
      messages: [],
      userName: '',
      characterName: '',
      error: null
    }),

    // 更新特定消息的内容
    updateMessage: (id, content) => set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg
      )
    })),
  }))
);

// 监听角色和聊天变化，自动加载聊天历史
useChatBoxStore.subscribe(
  (state) => ({ role: state.currentRole, chat: state.currentChat }),
  ({ role, chat }, prev) => {
    // 只有当角色或聊天发生变化时才处理
    if (role !== prev.role || chat !== prev.chat) {
      // 确保角色和聊天都存在且不为null
      if (role && chat) {
        useChatBoxStore.getState().fetchChatHistory(role, chat);
      } else {
        useChatBoxStore.getState().clearChatHistory();
      }
    }
  },
  { equalityFn: (a, b) => a.role === b.role && a.chat === b.chat }
);




export default useChatBoxStore;
