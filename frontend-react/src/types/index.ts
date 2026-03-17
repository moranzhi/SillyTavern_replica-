// --- 1. 消息与聊天状态 (核心树形结构) ---

export interface Message {
  id: string;
  parentId: string | null;
  childrenIds: string[];
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  // 新增：流式状态标记，对应原 app.py 的 message_placeholder 逻辑
  isStreaming?: boolean;
  // 新增：是否允许 HTML 渲染（虽然通常由全局开关控制，但单条消息也可以强制）
  allowHtml?: boolean;
}

export interface ChatState {
  messages: Record<string, Message>;
  currentMessageId: string | null;

  // UI 状态
  isLoading: boolean;
  inputMessage: string;

  // 设置
  renderHtml: boolean;             // 对应原 app.py 的 st.toggle("HTML 渲染")
  selectedFile: string | null;      // 对应原 app.py 的 selected_file_path

  // 左侧栏状态
  spliceBlocks: SpliceBlock[];      // 对应原 app.py 的 st.session_state.splice_blocks
  genParams: GenerationParams;      // 对应原 app.py 的滑块参数
}

// --- 2. 左侧栏：预设与参数 ---

export interface SpliceBlock {
  id: string | number;
  name: string;
  active: boolean;
  type: 'system' | 'world' | 'history' | 'character';
  editable?: boolean;
  content?: string;
}

export interface GenerationParams {
  temperature: number;             // 对应 slider_temp
  top_p: number;                   // 对应 slider_top_p
  frequency_penalty: number;       // 对应 slider_freq
  presence_penalty: number;        // 对应 slider_pres
  max_tokens: number;              // 对应 input_max
  context_length: number;          // 对应 input_ctx
  stream: boolean;                 // 对应 chk_stream
}

// --- 3. API 请求/响应 ---

// 对应 GET /get_all_role_and_chat
// 结构: { "DatasetName": ["file1.jsonl", "file2.jsonl"] }
export interface DatasetResponse {
  [datasetName: string]: string[];
}

// 对应 POST /generate_reply (预留)
export interface GenerateRequest {
  prompt: string;                  // 组装后的完整 Prompt
  history: Message[];              // 当前上下文
  params: GenerationParams;
}

export interface GenerateResponse {
  content: string;
  finish_reason: string;
}
