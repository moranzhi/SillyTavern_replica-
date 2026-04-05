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

    // 是否正在生成
    isGenerating: false,

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
    setChatBoxRoleAndChat: (role, chat) => {
      console.log('[ChatBoxStore] setChatBoxRoleAndChat called with:', { role, chat });
      set({
        currentRole: role,
        currentChat: chat
      });
    },

    // 设置生成状态
    setIsGenerating: (status) => set({ isGenerating: status }),

    // 发送消息
    sendMessage: async (content) => {
      const { messages, userName, characterName, currentRole, currentChat } = get();

      set({
        isGenerating: true,
        messages: [...messages, {
          id: Date.now(),
          floor: messages.length + 1,
          mes: content,
          is_user: true
        }]
      });

      try {
        const response = await fetch(`/api/chats/${encodeURIComponent(currentRole)}/${encodeURIComponent(currentChat)}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            floor: messages.length + 1,
            mes: content,
            is_user: true
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();
        set((state) => ({
          messages: [...state.messages, {
            id: Date.now(),
            floor: state.messages.length + 1,
            mes: data.response,
            is_user: false
          }],
          isGenerating: false
        }));
      } catch (error) {
        set({
          error: error.message,
          isGenerating: false
        });
      }
    },

    // 终止生成
    stopGeneration: () => set({ isGenerating: false }),

    // 加载聊天历史
    fetchChatHistory: async (roleName, chatName) => {
      set({ isLoading: true, error: null });
      try {
        const response = await fetch(`/api/chats/${encodeURIComponent(roleName)}/${encodeURIComponent(chatName)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch chat history');
        }
        const data = await response.json();

        set({
          messages: data.messages || [],
          userName: data.metadata?.user_name || 'User',
          characterName: data.metadata?.character_name || roleName || 'Assistant',
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
    updateMessage: async (floor, content) => {
      const { currentRole, currentChat } = get();
      try {
        const response = await fetch(`/api/chats/${encodeURIComponent(currentRole)}/${encodeURIComponent(currentChat)}/messages/${floor}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mes: content })
        });

        if (!response.ok) {
          throw new Error('Failed to update message');
        }

        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.floor === floor ? { ...msg, mes: content } : msg
          )
        }));
      } catch (error) {
        set({ error: error.message });
      }
    },

    // 删除特定消息
    deleteMessage: async (floor) => {
      const { currentRole, currentChat } = get();
      try {
        const response = await fetch(`/api/chats/${encodeURIComponent(currentRole)}/${encodeURIComponent(currentChat)}/messages/${floor}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to delete message');
        }

        set((state) => ({
          messages: state.messages.filter((msg) => msg.floor !== floor)
        }));
      } catch (error) {
        set({ error: error.message });
      }
    },

    // 创建新聊天
    createChat: async (roleName, chatName, metadata = {}) => {
      try {
        const response = await fetch(`/api/chats/${encodeURIComponent(roleName)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_name: chatName,
            metadata: {
              user_name: 'User',
              character_name: roleName,
              ...metadata
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create chat');
        }

        return await response.json();
      } catch (error) {
        set({ error: error.message });
        throw error;
      }
    },

    // 更新聊天元数据
    updateChatMetadata: async (roleName, chatName, metadata) => {
      try {
        const response = await fetch(`/api/chats/${encodeURIComponent(roleName)}/${encodeURIComponent(chatName)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ metadata })
        });

        if (!response.ok) {
          throw new Error('Failed to update chat metadata');
        }

        return await response.json();
      } catch (error) {
        set({ error: error.message });
        throw error;
      }
    },

    // 删除聊天
    deleteChat: async (roleName, chatName) => {
      try {
        const response = await fetch(`/api/chats/${encodeURIComponent(roleName)}/${encodeURIComponent(chatName)}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to delete chat');
        }

        return await response.json();
      } catch (error) {
        set({ error: error.message });
        throw error;
      }
    }
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
