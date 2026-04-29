"""
数据模型包

导出项目内部真正使用的数据结构 (Internal Models)。
SillyTavern 兼容模型将在需要导入/导出时单独引用。
"""

# 内部业务模型 (项目核心使用)
from .internal import (
    # 世界书
    ActivationType,
    LogicOperator,
    LogicExpression,
    RAGConfig,
    WorldInfoEntry,
    WorldInfo,
    
    # 角色卡
    OutputSchemaField,
    CharacterCard,
    
    # 聊天记录
    ChatHeader,
    ChatMessage,
    ChatLog,
    
    # 预设
    GenerationPreset,
    
    # 提示词预设
    PromptRole,
    PromptEntry,
    PromptPresetView,
    
    # RAG 配置
    RAGSearchConfig,
    CharacterRAGConfig,
    ChatRAGConfig,
)

__all__ = [
    # 内部模型
    'ActivationType',
    'LogicOperator',
    'LogicExpression',
    'RAGConfig',
    'WorldInfoEntry',
    'WorldInfo',
    'OutputSchemaField',
    'CharacterCard',
    'ChatHeader',
    'ChatMessage',
    'ChatLog',
    'GenerationPreset',
    'PromptRole',
    'PromptEntry',
    'PromptPresetView',
    'RAGSearchConfig',
    'CharacterRAGConfig',
    'ChatRAGConfig',
]
