/**
 * SillyTavern 兼容的数据结构定义
 * 这些类型严格遵循 SillyTavern 官方规范，仅用于导入导出兼容
 */

// ==================== 聊天记录 (Chat Log) ====================

/**
 * SillyTavern 聊天记录头（JSONL 第一行）
 */
export interface STChatHeader {
  /** 用户名称 */
  user_name: string;
  
  /** 角色名称 */
  character_name: string;
  
  /** 创建日期 */
  create_date: string;
  
  /** 聊天元数据 */
  chat_metadata?: {
    /** 完整性校验哈希 */
    integrity?: string;
    
    /** 其他元数据 */
    [key: string]: unknown;
  };
  
  /** 其他可能的头部字段 */
  [key: string]: unknown;
}

/**
 * SillyTavern 聊天消息记录
 */
export interface STChatMessage {
  /** 发送者名称 */
  name: string;
  
  /** 是否为用户消息 */
  is_user: boolean;
  
  /** 是否为系统消息 */
  is_system?: boolean;
  
  /** 发送日期时间戳或 ISO 字符串 */
  send_date: number | string;
  
  /** 实际对话消息文本 */
  mes: string;
  
  /** 替换回答数组（swipe 功能） */
  swipes?: string[];
  
  /** 当前选择的 swipe ID */
  swipe_id?: number;
  
  /** 是否为隐藏消息 */
  is_hidden?: boolean;
  
  /** 扩展字段 */
  extra?: Record<string, unknown>;
}

/**
 * SillyTavern 聊天记录文件（JSONL 格式）
 * 第一行是 STChatHeader，后续每行是 STChatMessage
 */
export type STChatLog = [STChatHeader, ...STChatMessage[]];

// ==================== 角色卡 (Character Card) ====================

/**
 * SillyTavern 角色卡规范版本
 */
export enum STCharacterCardSpec {
  V1 = 'chara_card_v1',
  V2 = 'chara_card_v2',
  V3 = 'chara_card_v3',
}

/**
 * SillyTavern 角色卡 V2/V3 数据结构
 */
export interface STCharacterCardData {
  /** 角色名称 */
  name: string;
  
  /** 角色描述 */
  description: string;
  
  /** 角色性格特征 */
  personality: string;
  
  /** 场景设定 */
  scenario: string;
  
  /** 首条开场消息 */
  first_mes: string;
  
  /** 对话示例 */
  mes_example: string;
  
  /** 替代问候语数组 */
  alternate_greetings?: string[];
  
  /** 角色创建者备注 */
  creator_notes?: string;
  
  /** 系统级别指令 */
  system_prompt?: string;
  
  /** 历史后指令 */
  post_history_instructions?: string;
  
  /** 标签数组 */
  tags?: string[];
  
  /** 扩展字段 */
  extensions?: {
    /** 绑定的世界书文件名 */
    world?: string;
    
    /** 健谈程度 0-1 */
    talkativeness?: number;
    
    /** 收藏状态 */
    fav?: boolean;
    
    /** 其他扩展字段 */
    [key: string]: unknown;
  };
}

/**
 * SillyTavern 角色卡完整结构（V2/V3）
 */
export interface STCharacterCard {
  /** 规范标识 */
  spec: STCharacterCardSpec;
  
  /** 规范版本 */
  spec_version?: string;
  
  /** 角色数据 */
  data: STCharacterCardData;
}

// ==================== 预设 (Preset) ====================

/**
 * SillyTavern 采样参数预设
 */
export interface STGenerationPreset {
  /** 预设名称 */
  name: string;
  
  /** 温度 */
  temperature?: number;
  
  /** Top P */
  top_p?: number;
  
  /** Top K */
  top_k?: number;
  
  /** 重复惩罚 */
  repetition_penalty?: number;
  
  /** 频率惩罚 */
  frequency_penalty?: number;
  
  /** 存在惩罚 */
  presence_penalty?: number;
  
  /** 最大生成长度 */
  max_length?: number;
  
  /** 其他采样参数 */
  [key: string]: unknown;
}
