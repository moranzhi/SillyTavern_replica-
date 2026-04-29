// frontend-react/src/Store/Mid/ChatBoxSlice.jsx
import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import useApiConfigStore from '../SideBarLeft/ApiConfigSlice';
import usePresetStore from '../SideBarLeft/PresetSlice';

const useChatBoxStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // WebSocket连接实例
        wsConnection: null,
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

        // 选项状态
        options: {
          dynamicTable: false,  // 动态表格
          streamOutput: false,  // 流式输出
          imageWorkflow: false, // 生图工作流
          htmlRender: false,    // HTML渲染
        },

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

        // 切换选项状态
        toggleOption: (optionName) => set((state) => ({
          options: {
            ...state.options,
            [optionName]: !state.options[optionName]
          }
        })),

        // 设置选项状态
        setOption: (optionName, value) => set((state) => ({
          options: {
            ...state.options,
            [optionName]: value
          }
        })),

        // 重置所有选项
        resetOptions: () => set({
          options: {
            dynamicTable: false,
            streamOutput: false,
            imageWorkflow: false,
            htmlRender: false
          }
        }),

        // 同时设置角色和聊天
        setChatBoxRoleAndChat: (role, chat) => {
          console.log('[ChatBoxStore] setChatBoxRoleAndChat called with:', { role, chat });
          set({
            currentRole: role,
            currentChat: typeof chat === 'object' && chat !== null ? chat.chat_name : chat
          });
        },

        // 设置生成状态
        setIsGenerating: (status) => set({ isGenerating: status }),

        // 计算下一个楼层号
        getNextFloor: (messages) => {
          if (messages.length === 0) return 1;
          const maxFloor = Math.max(...messages.map(msg => msg.floor));
          return maxFloor + 1;
        },

        // 发送消息
        sendMessage: async (content) => {
          const { messages, userName, characterName, currentRole, currentChat, options, wsConnection } = get();

          // 获取 API 配置
          const apiConfigStore = useApiConfigStore.getState();

          // 获取预设配置
          const presetStore = usePresetStore.getState();

          // 关闭之前的WebSocket连接
          if (wsConnection) {
            wsConnection.close();
          }

          // 计算下一个楼层号
          const nextFloor = get().getNextFloor(messages);

          set({
            isGenerating: true,
            wsConnection: null,  // 重置连接
            messages: [...messages, {
              id: Date.now(),
              floor: messages.length + 1,
              mes: content,
              is_user: true
            }]
          });

          try {
            // 统一使用WebSocket处理流式和非流式输出
            const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:23337';
            const wsUrl = `${backendUrl.replace(/^http/, 'ws')}/api/chat/${encodeURIComponent(currentRole)}/${encodeURIComponent(currentChat)}/ws`;
            const ws = new WebSocket(wsUrl);
            console.log('[WebSocket] 正在建立连接...', { url: wsUrl });

            // 添加连接超时处理
            const connectionTimeout = setTimeout(() => {
              if (ws.readyState === WebSocket.CONNECTING) {
                console.error('[WebSocket] 连接超时');
                ws.close();
                set({
                  error: 'WebSocket connection timeout',
                  isGenerating: false,
                  wsConnection: null
                });
              }
            }, 5000); // 5秒超时

            // 保存WebSocket连接到store
            set({ wsConnection: ws });

            // 添加一个空的助手消息，稍后会更新
            const newMessageId = Date.now();
            const assistantFloor = nextFloor + 1; // 助手消息的楼层是用户消息楼层+1
            set((state) => ({
              messages: [...state.messages, {
                id: newMessageId,
                floor: state.messages.length + 1,
                mes: '',
                is_user: false
              }]
            }));

            let assistantMessage = '';
            let isStreamComplete = false;

            ws.onopen = () => {
              clearTimeout(connectionTimeout); // 清除超时定时器
              console.log('[WebSocket] 连接已建立', { readyState: ws.readyState });
            };

            ws.onclose = (event) => {
              console.log('[WebSocket] 连接已关闭', {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean
              });
            };

            // 处理WebSocket消息
            ws.onmessage = (event) => {
              const data = JSON.parse(event.data);
              console.log('[WebSocket] 收到消息', { type: data.type, content: data.content });

              if (data.type === 'chunk') {
                // 处理流式数据块
                assistantMessage += data.content;
                set((state) => ({
                  messages: state.messages.map((msg) =>
                    msg.id === newMessageId ? { ...msg, mes: assistantMessage } : msg
                  )
                }));
              } else if (data.type === 'complete') {
                // 完成响应
                isStreamComplete = true;
                ws.close();
                set({ wsConnection: null, isGenerating: false });
              } else if (data.type === 'error') {
                // 错误处理
                set({
                  error: data.message,
                  isGenerating: false,
                  wsConnection: null
                });
                ws.close();
              }
            };

            // 处理连接错误
            ws.onerror = (error) => {
              console.error('[WebSocket] 连接错误', { error, readyState: ws.readyState });
              set({
                error: 'WebSocket connection failed',
                isGenerating: false,
                wsConnection: null
              });
            };

            // 处理连接关闭（非流式模式下会自动关闭）
            ws.onclose = () => {
              set({ wsConnection: null });
              if (!isStreamComplete && !options.streamOutput) {
                // 非流式模式下，一次性完成后自动关闭
                set({ isGenerating: false });
              }
            };

            // 发送请求到WebSocket（确保连接已建立）
            // 发送请求到WebSocket（确保连接已建立）
            const sendAfterConnect = () => {
              if (ws.readyState === WebSocket.OPEN) {
                console.log('[WebSocket] 发送消息', { readyState: ws.readyState });
                ws.send(JSON.stringify({
                  floor: nextFloor,
                  mes: content,
                  is_user: true,
                  currentRole: currentRole,
                  currentChat: currentChat,
                  options: options,
                  apiConfig: {
                    api_url: apiConfigStore.allApis.find(api => api.category === 'text' && api.id === apiConfigStore.activeMap.text)?.api_url || '',
                    api_key: apiConfigStore.allApis.find(api => api.category === 'text' && api.id === apiConfigStore.activeMap.text)?.api_key || ''
                  },
                  presetConfig: {
                    selectedPreset: presetStore.selectedPreset,
                    parameters: presetStore.parameters,
                    promptComponents: presetStore.promptComponents
                  },
                  stream: options.streamOutput
                }));
              } else if (ws.readyState === WebSocket.CONNECTING) {
                // 如果正在连接，继续等待
                console.log('[WebSocket] 等待连接...', { readyState: ws.readyState });
                setTimeout(sendAfterConnect, 100);
              } else {
                // 连接失败或已关闭
                console.error('[WebSocket] 连接失败', { readyState: ws.readyState });
                set({
                  error: 'WebSocket connection failed',
                  isGenerating: false,
                  wsConnection: null
                });
              }
            };
            // 等待连接建立后发送
            sendAfterConnect();
          } catch (error) {
            set({
              error: error.message,
              isGenerating: false
            });
          }
        },

        // 终止生成
        stopGeneration: () => set((state) => {
          if (state.wsConnection) {
            state.wsConnection.close();
          }
          return {
            isGenerating: false,
            wsConnection: null
          };
        }),

        // 加载聊天历史
        fetchChatHistory: async (roleName, chatName) => {
          set({ isLoading: true, error: null });
          try {
            // 确保chatName是字符串
            const actualChatName = typeof chatName === 'object' && chatName !== null ? chatName.chat_name : chatName;
            const response = await fetch(`/api/chat/${encodeURIComponent(roleName)}/${encodeURIComponent(actualChatName)}`);
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
            const response = await fetch(`/api/chat/${encodeURIComponent(currentRole)}/${encodeURIComponent(currentChat)}/messages/${floor}`, {
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
            const response = await fetch(`/api/chat/${encodeURIComponent(currentRole)}/${encodeURIComponent(currentChat)}/messages/${floor}`, {
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
            const response = await fetch(`/api/chat/${encodeURIComponent(roleName)}`, {
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
            const response = await fetch(`/api/chat/${encodeURIComponent(roleName)}/${encodeURIComponent(chatName)}`, {
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
            const response = await fetch(`/api/chat/${encodeURIComponent(roleName)}/${encodeURIComponent(chatName)}`, {
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
      }),
      {
        name: 'chat-box-storage', // localStorage 中的键名
        partialize: (state) => ({
          // 只持久化选项状态，不持久化聊天历史等
          options: state.options
        })
      }
    )
  )
);

// 监听角色和聊天变化，自动加载聊天历史
useChatBoxStore.subscribe(
  (state) => ({ role: state.currentRole, chat: state.currentChat }),
  ({ role, chat }, prev) => {
    // 只有当角色或聊天发生变化时才处理
    if (role !== prev.role || chat !== prev.chat) {
      // 确保角色和聊天都存在且不为null
      if (role && chat) {
        // 确保chat是字符串，如果是对象则提取chat_name
        const actualChat = typeof chat === 'object' && chat !== null ? chat.chat_name : chat;
        useChatBoxStore.getState().fetchChatHistory(role, actualChat);
      } else {
        useChatBoxStore.getState().clearChatHistory();
      }
    }
  },
  { equalityFn: (a, b) => a.role === b.role && a.chat === b.chat }
);

export default useChatBoxStore;