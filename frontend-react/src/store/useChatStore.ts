import { create } from 'zustand';
import { Message, ChatState, SpliceBlock, GenerationParams } from '@/types';

// --- 辅助函数：生成唯一 ID ---
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// --- 初始状态定义 ---
const initialSpliceBlocks: SpliceBlock[] = [
  { id: 1, name: "[必看] 系统指令", active: true, type: "system" },
  { id: 2, name: "A.U.T.O. 预设设置", active: true, type: "system" },
  { id: 3, name: "世界书：人物关系", active: false, type: "world" },
  { id: 4, name: "Chat History (自动)", active: true, type: "history", editable: false },
];

const initialGenParams: GenerationParams = {
  temperature: 1.0,
  top_p: 0.9,
  frequency_penalty: 1.0,
  presence_penalty: 0.0,
  max_tokens: 500,
  context_length: 30000,
  stream: true,
};

// --- Store 定义 ---
export const useChatStore = create<ChatState>((set, get) => ({
  // --- 状态初始化 ---
  messages: {},
  currentMessageId: null,

  isLoading: false,
  inputMessage: "",

  renderHtml: true, // 默认开启 HTML 渲染，对应原 app.py
  selectedFile: null,

  spliceBlocks: initialSpliceBlocks,
  genParams: initialGenParams,

  // --- Actions (操作方法) ---

  // 1. 设置输入框内容
  setInputMessage: (text: string) => set({ inputMessage: text }),

  // 2. 切换 HTML 渲染开关
  toggleRenderHtml: () => set((state) => ({ renderHtml: !state.renderHtml })),

  // 3. 更新生成参数 (支持部分更新)
  updateGenParams: (newParams: Partial<GenerationParams>) =>
    set((state) => ({
      genParams: { ...state.genParams, ...newParams },
    })),

  // 4. 切换拼接块状态 (即时生效)
  toggleSpliceBlock: (id: string | number) =>
    set((state) => ({
      spliceBlocks: state.spliceBlocks.map((block) =>
        block.id === id ? { ...block, active: !block.active } : block
      ),
    })),

  // 5. 添加新消息 (用户发送或 AI 完整回复后调用)
  addMessage: (role: 'user' | 'assistant', content: string, parentId: string | null = null) => {
    const newMessage: Message = {
      id: generateId(),
      parentId,
      childrenIds: [],
      role,
      content,
      timestamp: Date.now(),
      isStreaming: false, // 初始为非流式状态
    };

    set((state) => {
      const newMessages = { ...state.messages, [newMessage.id]: newMessage };

      // 如果有父节点，更新父节点的 childrenIds
      if (parentId) {
        const parent = state.messages[parentId];
        if (parent) {
          newMessages[parentId] = {
            ...parent,
            childrenIds: [...parent.childrenIds, newMessage.id],
          };
        }
      }

      return {
        messages: newMessages,
        currentMessageId: newMessage.id,
      };
    });

    return newMessage.id; // 返回新消息 ID，方便后续操作
  },

  // 6. 更新流式消息内容 (打字机效果)
  updateStreamingMessage: (messageId: string, contentChunk: string, isComplete: boolean = false) => {
    set((state) => {
      const currentMsg = state.messages[messageId];
      if (!currentMsg) return state;

      return {
        messages: {
          ...state.messages,
          [messageId]: {
            ...currentMsg,
            content: currentMsg.content + contentChunk,
            isStreaming: !isComplete, // 如果完成，则结束流式状态
          },
        },
      };
    });
  },

  // 7. 切换当前消息分支 (点击历史消息时)
  switchBranch: (messageId: string) => {
    set({ currentMessageId: messageId });
  },

  // 8. 设置加载状态
  setLoading: (loading: boolean) => set({ isLoading: loading }),

  // 9. 设置当前选中的文件
  setSelectedFile: (filePath: string | null) => set({ selectedFile: filePath }),
}));
