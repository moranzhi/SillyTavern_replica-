import { create } from 'zustand';
import type { Message, SpliceBlock, GenerationParams } from '@/types';

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

// --- 状态接口定义 ---
export interface ChatState {
  // 1. 消息树状态
  messages: Record<string, Message>;
  currentMessageId: string | null;
  isLoading: boolean;
  inputMessage: string;

  // 2. 设置状态
  renderHtml: boolean;
  selectedFile: string | null;
  spliceBlocks: SpliceBlock[];
  genParams: GenerationParams;

  // 3. 角色与文件状态
  datasets: Record<string, string[]>; // 存储角色列表字典
  currentRole: string | null;
  currentChatFile: string | null;
}

// --- Store 定义 ---
export const useChatStore = create<ChatState>((set, get) => ({

  // --- 状态初始化 ---
  messages: {},
  currentMessageId: null,
  isLoading: false,
  inputMessage: "",
  renderHtml: true,
  selectedFile: null,
  spliceBlocks: initialSpliceBlocks,
  genParams: initialGenParams,

  // --- 角色和文件列表 ---
  datasets: {},         // 初始为空字典
  currentRole: null,    // 初始未选中
  currentChatFile: null, // 初始未选中

  // --- Actions (操作方法) ---

  // 1. 加载数据集列表
  loadDatasets: (data: Record<string, string[]>) => set({ datasets: data }),

  // 2. 选择角色
  selectRole: (roleName: string) => set((state) => ({
    currentRole: roleName,
    currentChatFile: null // 切换角色时，必须清空文件选择
  })),

  // 3. 选择聊天文件
  selectChatFile: (fileName: string) => set({ currentChatFile: fileName }),

  // 4. 设置输入框内容
  setInputMessage: (text: string) => set({ inputMessage: text }),

  // 5. 切换 HTML 渲染开关
  toggleRenderHtml: () => set((state) => ({ renderHtml: !state.renderHtml })),

  // 6. 更新生成参数
  updateGenParams: (newParams: Partial<GenerationParams>) =>
    set((state) => ({
      genParams: { ...state.genParams, ...newParams },
    })),

  // 7. 切换拼接块状态
  toggleSpliceBlock: (id: string | number) =>
    set((state) => ({
      spliceBlocks: state.spliceBlocks.map((block) =>
        block.id === id ? { ...block, active: !block.active } : block
      ),
    })),

  // 8. 添加新消息
  addMessage: (role: 'user' | 'assistant', content: string, parentId: string | null = null) => {
    const newMessage: Message = {
      id: generateId(),
      parentId,
      childrenIds: [],
      role,
      content,
      timestamp: Date.now(),
      isStreaming: false,
    };

    set((state) => {
      const newMessages = { ...state.messages, [newMessage.id]: newMessage };

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

    return newMessage.id;
  },

  // 9. 更新流式消息内容
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
            isStreaming: !isComplete,
          },
        },
      };
    });
  },

  // 10. 切换当前消息分支
  switchBranch: (messageId: string) => {
    set({ currentMessageId: messageId });
  },

  // 11. 设置加载状态
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));
