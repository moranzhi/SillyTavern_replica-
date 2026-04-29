/**
 * 数据转换器
 * 实现 SillyTavern 格式与内部格式之间的转换
 */

import type { 
  STChatHeader, 
  STChatMessage, 
  STChatLog,
  STCharacterCard,
  STGenerationPreset 
} from './sillytavern.types';
import type { 
  ChatHeader, 
  ChatMessage, 
  ChatLog,
  WorldInfo,
  WorldInfoEntry,
  ActivationType,
  CharacterCard,
  GenerationPreset
} from './internal.types';

/**
 * 将 SillyTavern 聊天头转换为内部格式
 */
export function convertSTChatHeaderToInternal(
  stHeader: STChatHeader,
  chatId: string,
  characterId: string
): ChatHeader {
  return {
    id: chatId,
    displayName: `${stHeader.character_name} - ${stHeader.user_name}`,
    characterId,
    userName: stHeader.user_name,
    characterName: stHeader.character_name,
    createdAt: Date.parse(stHeader.create_date) || Date.now(),
    updatedAt: Date.now(),
    messageCount: 0, // 需要在转换消息后更新
    tableData: stHeader.chat_metadata,
  };
}

/**
 * 将 SillyTavern 聊天消息转换为内部格式
 */
export function convertSTMessageToInternal(
  stMessage: STChatMessage,
  chatId: string,
  floor: number
): ChatMessage {
  return {
    id: `${chatId}-${floor}`,
    floor,
    name: stMessage.name,
    is_user: stMessage.is_user,
    is_system: stMessage.is_system,
    sendDate: typeof stMessage.send_date === 'number' 
      ? new Date(stMessage.send_date).toISOString() 
      : stMessage.send_date,
    mes: stMessage.mes,
    chatId,
    swipes: stMessage.swipes,
    swipe_id: stMessage.swipe_id,
    tokenCount: undefined,
    isTemporary: false,
  };
}

/**
 * 将 SillyTavern 完整聊天记录转换为内部格式
 */
export function convertSTChatLogToInternal(
  stChatLog: STChatLog,
  chatId: string,
  characterId: string
): ChatLog {
  const [stHeader, ...stMessages] = stChatLog;
  
  const header = convertSTChatHeaderToInternal(stHeader, chatId, characterId);
  
  const messages = stMessages.map((msg, index) => 
    convertSTMessageToInternal(msg, chatId, index + 1)
  );
  
  // 更新消息数量
  header.messageCount = messages.length;
  
  return {
    header,
    messages,
  };
}

/**
 * 将内部聊天头转换为 SillyTavern 格式
 */
export function convertInternalChatHeaderToST(chatHeader: ChatHeader): STChatHeader {
  return {
    user_name: chatHeader.userName,
    character_name: chatHeader.characterName,
    create_date: new Date(chatHeader.createdAt).toISOString(),
    chat_metadata: chatHeader.tableData,
  };
}

/**
 * 将内部聊天消息转换为 SillyTavern 格式
 */
export function convertInternalMessageToST(message: ChatMessage): STChatMessage {
  return {
    name: message.name,
    is_user: message.is_user,
    is_system: message.is_system,
    send_date: message.sendDate,
    mes: message.mes,
    swipes: message.swipes,
    swipe_id: message.swipe_id,
    is_hidden: message.isTemporary,
  };
}

/**
 * 将内部完整聊天记录转换为 SillyTavern 格式
 */
export function convertInternalChatLogToST(chatLog: ChatLog): STChatLog {
  const stHeader = convertInternalChatHeaderToST(chatLog.header);
  
  const stMessages = chatLog.messages.map(msg => 
    convertInternalMessageToST(msg)
  );
  
  return [stHeader, ...stMessages];
}

/**
 * 生成唯一 ID（简单实现，实际项目中应使用 UUID）
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== 角色卡转换 ====================

/**
 * 将 SillyTavern 角色卡转换为内部格式
 */
export function convertSTCharacterCardToInternal(
  stCard: STCharacterCard,
  characterId: string = generateId()
): CharacterCard {
  const now = Date.now();
  
  return {
    id: characterId,
    name: stCard.data.name,
    description: stCard.data.description,
    personality: stCard.data.personality,
    scenario: stCard.data.scenario,
    first_mes: stCard.data.first_mes,
    mes_example: stCard.data.mes_example,
    categories: [], // 需要手动设置
    worldInfoId: stCard.data.extensions?.world,
    outputSchema: undefined, // 需要手动设置
    avatarPath: undefined, // 需要手动设置
    alternate_greetings: stCard.data.alternate_greetings,
    tags: stCard.data.tags,
    createdAt: now,
    updatedAt: now,
    lastChatAt: undefined,
    isFavorite: stCard.data.extensions?.fav || false,
    version: 1,
  };
}

/**
 * 将内部角色卡转换为 SillyTavern 格式
 */
export function convertInternalCharacterCardToST(
  card: CharacterCard
): STCharacterCard {
  return {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: card.name,
      description: card.description,
      personality: card.personality,
      scenario: card.scenario,
      first_mes: card.first_mes,
      mes_example: card.mes_example,
      alternate_greetings: card.alternate_greetings,
      tags: card.tags,
      extensions: {
        world: card.worldInfoId,
        fav: card.isFavorite,
      },
    },
  };
}

// ==================== 预设转换 ====================

/**
 * 将 SillyTavern 预设转换为内部格式
 */
export function convertSTPresetToInternal(
  stPreset: STGenerationPreset,
  presetId: string = generateId()
): GenerationPreset {
  const now = Date.now();
  
  return {
    id: presetId,
    name: stPreset.name,
    temperature: stPreset.temperature ?? 1.0,
    topP: stPreset.top_p ?? 1.0,
    topK: stPreset.top_k ?? 0,
    repetitionPenalty: stPreset.repetition_penalty ?? 1.0,
    frequencyPenalty: stPreset.frequency_penalty,
    presencePenalty: stPreset.presence_penalty,
    maxLength: stPreset.max_length,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 将内部预设转换为 SillyTavern 格式
 */
export function convertInternalPresetToST(
  preset: GenerationPreset
): STGenerationPreset {
  return {
    name: preset.name,
    temperature: preset.temperature,
    top_p: preset.topP,
    top_k: preset.topK,
    repetition_penalty: preset.repetitionPenalty,
    frequency_penalty: preset.frequencyPenalty,
    presence_penalty: preset.presencePenalty,
    max_length: preset.maxLength,
  };
}
