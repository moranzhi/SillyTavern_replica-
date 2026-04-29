/**
 * 项目内部使用的数据结构定义
 * 这是前端真正使用的数据类型，与后端 internal.py 保持一致
 */

import type { STChatHeader, STChatMessage } from './sillytavern.types';

// ==================== 世界书 (World Info) ====================

/**
 * 激活方式类型（4种枚举）
 */
export enum ActivationType {
  /** 永久激活 - 始终包含在上下文中 */
  PERMANENT = 'permanent',
  /** 关键词触发 - 匹配关键词时激活 */
  KEYWORD = 'keyword',
  /** RAG 检索激活 - 基于向量相似度检索 */
  RAG = 'rag',
  /** 逻辑表达式激活 - 基于变量条件判断 */
  LOGIC = 'logic',
}

/**
 * 逻辑运算符（用于 LOGIC 激活类型）
 */
export enum LogicOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  GREATER = 'greater',
  LESS = 'less',
}

/**
 * 逻辑表达式结构（用于 LOGIC 激活类型）
 */
export interface LogicExpression {
  /** 第一个变量名 */
  variable1: string;
  /** 比较运算符 */
  operator: LogicOperator;
  /** 第二个变量名或值 */
  variable2: string;
}

/**
 * RAG 配置（用于 RAG 激活类型）
 */
export interface RAGConfig {
  /** 绑定的 RAG 库 ID */
  libraryId: string;
  /** 相似度阈值 (0-1) */
  threshold?: number;
  /** 最大返回条目数 */
  maxEntries?: number;
}

/**
 * 项目内部世界书条目结构
 */
export interface WorldInfoEntry {
  /** 条目唯一标识符 (UUID) */
  uid: string;
  /** 主关键词列表 (用于 KEYWORD 激活) */
  key?: string[];
  /** 次要关键词列表 (可选过滤) */
  keysecondary?: string[];
  /** 条目内容 - 激活时注入的文本 */
  content: string;
  /** 激活方式 */
  activationType: ActivationType;
  /** 逻辑表达式 (LOGIC 类型使用) */
  logicExpression?: LogicExpression;
  /** RAG 配置 (RAG 类型使用) */
  ragConfig?: RAGConfig;
  /** 插入顺序 - 数值越大越靠近末尾 */
  order: number;
  /** 插入位置 */
  position?: string;
  /** 插入深度 (当 position='at_depth' 时使用) */
  depth?: number;
  /** 激活概率 (0-100) */
  probability?: number;
  /** 所属组标签 */
  group?: string[];
  /** 是否禁用 */
  disable: boolean;
  /** 创建时间戳 */
  createdAt: number;
  /** 最后更新时间戳 */
  updatedAt: number;
}

/**
 * 项目内部世界书结构
 */
export interface WorldInfo {
  /** 世界书唯一标识符 (UUID) */
  id: string;
  /** 世界书名称 */
  name: string;
  /** 世界书描述 */
  description?: string;
  /** 条目数组 */
  entries: WorldInfoEntry[];
  /** 创建时间戳 */
  createdAt: number;
  /** 最后更新时间戳 */
  updatedAt: number;
  /** 版本号 (用于数据迁移) */
  version: number;
}

// ==================== 聊天记录 (Chat Log) ====================

/**
 * 项目内部聊天记录头
 */
export interface ChatHeader {
  /** 聊天唯一标识符 */
  id: string;
  
  /** 显示名称（聊天标题） */
  displayName: string;
  
  /** 关联的角色卡 ID */
  characterId: string;
  
  /** 用户角色名 */
  userName: string;
  
  /** AI 角色名称 */
  characterName: string;
  
  /** 表格内容（对应角色卡的 outputSchema 字段的值） */
  tableData?: Record<string, unknown>;
  
  /** 创建时间戳 */
  createdAt: number;
  
  /** 最后更新时间戳 */
  updatedAt: number;
  
  /** 消息数量 */
  messageCount: number;
  
  /** 关联的RAG历史消息库ID（用于向量化存储） */
  ragLibraryId?: string;
}

/**
 * 项目内部聊天消息
 */
export interface ChatMessage {
  /** 消息唯一标识符 */
  id: string;
  
  /** 楼层号 */
  floor: number;
  
  /** 发送者名称 */
  name: string;
  
  /** 是否为用户消息 */
  is_user: boolean;
  
  /** 是否为系统消息 */
  is_system?: boolean;
  
  /** 发送日期 ISO 字符串 */
  sendDate: string;
  
  /** 消息内容文本 */
  mes: string;
  
  /** 关联的聊天 ID */
  chatId: string;
  
  /** 替换回答数组（swipe 功能） */
  swipes?: string[];
  
  /** 当前选择的 swipe ID */
  swipe_id?: number;
  
  /** Token 数量（用于统计） */
  tokenCount?: number;
  
  /** 是否为临时消息（未保存） */
  isTemporary?: boolean;
}

/**
 * 项目内部完整聊天记录
 */
export interface ChatLog {
  /** 聊天头 */
  header: ChatHeader;
  
  /** 消息列表 */
  messages: ChatMessage[];
}

// ==================== 角色数据 ====================

/**
 * 前端角色数据结构
 * 简化版，用于角色选择器
 */
export interface RoleInfo {
  /** 角色名称 */
  role_name: string;
  
  /** 该角色下的聊天列表 */
  chats: ChatSummary[];
}

/**
 * 聊天摘要信息
 */
export interface ChatSummary {
  /** 聊天名称 */
  chat_name: string;
  
  /** 用户名称 */
  user_name: string;
  
  /** 角色名称 */
  character_name: string;
  
  /** 最后修改时间 */
  last_modified: string;
  
  /** 消息数量 */
  message_count: number;
}

// ==================== API 配置 ====================

/**
 * API 配置接口
 */
export interface ApiConfig {
  /** 配置唯一标识符 */
  id: string;
  
  /** API 类别（text/image/audio等） */
  category: string;
  
  /** API URL */
  apiUrl: string;
  
  /** API Key */
  apiKey: string;
  
  /** 模型名称 */
  model: string;
  
  /** 温度参数 */
  temperature: number;
  
  /** 最大 Token 数 */
  maxTokens: number;
  
  /** 系统提示词 */
  systemPrompt?: string;
  
  /** 是否激活 */
  isActive?: boolean;
  
  /** 创建时间戳 */
  createdAt?: number;
  
  /** 更新时间戳 */
  updatedAt?: number;
}

// ==================== 预设配置 ====================

/**
 * 生成预设参数
 */
export interface GenerationPreset {
  /** 预设 ID */
  id: string;
  
  /** 预设名称 */
  name: string;
  
  /** 温度 */
  temperature: number;
  
  /** Top P */
  topP: number;
  
  /** Top K */
  topK: number;
  
  /** 重复惩罚 */
  repetitionPenalty: number;
  
  /** 频率惩罚 */
  frequencyPenalty?: number;
  
  /** 存在惩罚 */
  presencePenalty?: number;
  
  /** 最大长度 */
  maxLength?: number;
  
  /** 是否默认预设 */
  isDefault: boolean;
}

/**
 * Prompt 组件（提示词预设的一部分）
 */
export interface PromptComponent {
  /** 唯一标识符 */
  identifier: string;
  
  /** 名称 */
  name: string;
  
  /** 是否系统提示 */
  system_prompt: boolean;
  
  /** 是否为标记节点 */
  marker: boolean;
  
  /** 是否启用 */
  enabled: boolean;
  
  /** 角色类型 (0=system, 1=user, 2=assistant) */
  role: number;
  
  /** 内容 */
  content?: string;
}

// ==================== WebSocket 消息 ====================

/**
 * WebSocket 请求消息
 */
export interface WSRequestMessage {
  /** 楼层号 */
  floor: number;
  
  /** 消息内容 */
  mes: string;
  
  /** 是否为用户消息 */
  is_user: boolean;
  
  /** 当前角色 */
  currentRole: string;
  
  /** 当前聊天 */
  currentChat: string;
  
  /** 选项配置 */
  options: {
    dynamicTable: boolean;
    streamOutput: boolean;
    imageWorkflow: boolean;
    htmlRender: boolean;
  };
  
  /** API 配置 */
  apiConfig: {
    api_url: string;
    api_key: string;
  };
  
  /** 预设配置 */
  presetConfig: {
    selectedPreset: string;
    parameters: any;
    promptComponents: PromptComponent[];
  };
  
  /** 是否流式输出 */
  stream: boolean;
}

/**
 * WebSocket 响应消息类型
 */
export type WSResponseType = 'chunk' | 'complete' | 'error';

/**
 * WebSocket 响应消息
 */
export interface WSResponseMessage {
  /** 消息类型 */
  type: WSResponseType;
  
  /** 内容（chunk 类型时） */
  content?: string;
  
  /** 错误信息（error 类型时） */
  message?: string;
}
