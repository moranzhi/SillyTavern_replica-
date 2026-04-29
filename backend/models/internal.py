"""
项目内部数据结构定义

这是本项目真正使用的核心数据模型,所有业务逻辑都基于这些类型。
与 sillytavern.py 不同,这里的模型不参与导入导出兼容,而是专注于:
- 内部业务逻辑处理
- API 响应数据结构
- 数据存储格式
- 工作流引擎数据交换

所有从 SillyTavern 导入的数据都会转换为这些内部模型进行处理,
导出时再从内部模型转换回 SillyTavern 格式。
"""
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


# ==================== 世界书 (World Info) ====================

class ActivationType(str, Enum):
    """
    自定义激活方式类型（4种枚举）
    
    这是项目的核心创新点之一,相比 SillyTavern 的简单 constant/selective 标志,
    我们提供了更灵活的激活机制。
    """
    PERMANENT = 'permanent'    # 永久激活 - 始终包含在上下文中
    KEYWORD = 'keyword'        # 关键词触发 - 匹配关键词时激活
    RAG = 'rag'               # RAG 检索激活 - 基于向量相似度检索
    LOGIC = 'logic'           # 逻辑表达式激活 - 基于变量条件判断


class LogicOperator(str, Enum):
    """逻辑运算符（用于 LOGIC 激活类型）"""
    EQUALS = 'equals'              # 等于
    NOT_EQUALS = 'not_equals'      # 不等于
    CONTAINS = 'contains'          # 包含
    NOT_CONTAINS = 'not_contains'  # 不包含
    GREATER = 'greater'            # 大于
    LESS = 'less'                  # 小于


class LogicExpression(BaseModel):
    """
    逻辑表达式结构（用于 LOGIC 激活类型）
    
    示例: variable1="mood", operator="equals", variable2="happy"
    表示当 mood 变量等于 happy 时激活该条目
    """
    variable1: str = Field(..., description="第一个变量名")
    operator: LogicOperator = Field(..., description="比较运算符")
    variable2: str = Field(..., description="第二个变量名或值")


class RAGConfig(BaseModel):
    """
    RAG 配置（用于 RAG 激活类型）
    
    控制如何从向量数据库中检索相关内容
    """
    libraryId: str = Field(..., description="绑定的 RAG 库 ID")
    threshold: Optional[float] = Field(0.7, ge=0, le=1, description="相似度阈值 (0-1)")
    maxEntries: Optional[int] = Field(5, gt=0, description="最大返回条目数")


class WorldInfoEntry(BaseModel):
    """
    项目内部世界书条目结构
    
    这是世界书的核心单元,每个条目代表一段可以被动态注入到对话上下文中的知识。
    相比 SillyTavern,我们添加了 activationType、logicExpression、ragConfig 等高级功能。
    """
    uid: str = Field(..., description="条目唯一标识符 (UUID)")
    key: Optional[List[str]] = Field(None, description="主关键词列表 (用于 KEYWORD 激活)")
    keysecondary: Optional[List[str]] = Field(None, description="次要关键词列表 (可选过滤)")
    content: str = Field(..., description="条目内容 - 激活时注入的文本")
    activationType: ActivationType = Field(..., description="激活方式")
    logicExpression: Optional[LogicExpression] = Field(None, description="逻辑表达式 (LOGIC 类型使用)")
    ragConfig: Optional[RAGConfig] = Field(None, description="RAG 配置 (RAG 类型使用)")
    order: int = Field(0, description="插入顺序 - 数值越大越靠近末尾")
    position: Optional[str] = Field('after_char', description="插入位置")
    depth: Optional[int] = Field(None, description="插入深度 (当 position='at_depth' 时使用)")
    probability: Optional[float] = Field(100, ge=0, le=100, description="激活概率 (0-100)")
    group: Optional[List[str]] = Field(None, description="所属组标签")
    disable: bool = Field(False, description="是否禁用")
    createdAt: int = Field(default_factory=lambda: int(datetime.now().timestamp()), description="创建时间戳")
    updatedAt: int = Field(default_factory=lambda: int(datetime.now().timestamp()), description="最后更新时间戳")


class WorldInfo(BaseModel):
    """
    项目内部世界书结构
    
    世界书是角色知识的集合,可以绑定到角色卡上,在对话中动态提供背景信息。
    """
    id: str = Field(..., description="世界书唯一标识符 (UUID)")
    name: str = Field(..., description="世界书名称")
    description: Optional[str] = Field(None, description="世界书描述")
    entries: List[WorldInfoEntry] = Field(default_factory=list, description="条目数组")
    createdAt: int = Field(default_factory=lambda: int(datetime.now().timestamp()), description="创建时间戳")
    updatedAt: int = Field(default_factory=lambda: int(datetime.now().timestamp()), description="最后更新时间戳")
    version: int = Field(1, description="版本号 (用于数据迁移)")


# ==================== 角色卡 (Character Card) ====================

class OutputSchemaField(BaseModel):
    """
    Vercel AI SDK Output.object() 的表头定义
    
    用于结构化输出,让 LLM 按照指定格式返回数据。
    这是项目的特色功能,支持动态表格生成。
    """
    name: str = Field(..., description="字段名称")
    type: str = Field(..., description="字段类型 (string/number/boolean/array/object)")
    description: str = Field(..., description="字段描述")
    required: Optional[bool] = Field(None, description="是否必需")
    enum: Optional[List[str]] = Field(None, description="枚举值 (字符串固定选项)")
    fields: Optional[List['OutputSchemaField']] = Field(None, description="嵌套字段 (object 类型)")


class CharacterCard(BaseModel):
    """
    项目内部角色卡结构
    
    角色卡是对话 AI 的核心定义,包含人设、场景、开场白等。
    相比 SillyTavern,我们添加了 categories、outputSchema、worldInfoId 等功能。
    """
    id: str = Field(..., description="角色唯一标识符 (UUID)")
    name: str = Field(..., description="角色名称")
    description: str = Field(..., description="角色详细描述")
    personality: str = Field(..., description="角色性格特征")
    scenario: str = Field(..., description="场景设定")
    first_mes: str = Field(..., description="首条开场消息")
    mes_example: str = Field(..., description="对话示例")
    categories: List[str] = Field(default_factory=list, description="分类标签 (用于前端筛选)")
    worldInfoId: Optional[str] = Field(None, description="绑定的世界书 ID")
    outputSchema: Optional[List[OutputSchemaField]] = Field(None, description="输出 schema 定义 (结构化输出)")
    avatarPath: Optional[str] = Field(None, description="角色头像路径")
    alternate_greetings: Optional[List[str]] = Field(None, description="替代问候语数组")
    tags: Optional[List[str]] = Field(None, description="标签数组")
    createdAt: int = Field(default_factory=lambda: int(datetime.now().timestamp()), description="创建时间戳")
    updatedAt: int = Field(default_factory=lambda: int(datetime.now().timestamp()), description="最后更新时间戳")
    lastChatAt: Optional[int] = Field(None, description="最后聊天时间戳")
    isFavorite: bool = Field(False, description="收藏状态")
    version: int = Field(1, description="版本号")


# ==================== 聊天记录 (Chat Log) ====================

class ChatHeader(BaseModel):
    """
    项目内部聊天记录头
    
    包含聊天的元数据,如参与角色、创建时间等。
    """
    id: str = Field(..., description="聊天唯一标识符 (UUID)")
    displayName: str = Field(..., description="显示名称 (聊天标题)")
    characterId: str = Field(..., description="关联的角色卡 ID")
    userName: str = Field("User", description="用户角色名")
    characterName: str = Field(..., description="AI 角色名称")
    tableData: Optional[Dict[str, Any]] = Field(None, description="表格数据 (对应 outputSchema)")
    createdAt: int = Field(default_factory=lambda: int(datetime.now().timestamp()), description="创建时间戳")
    updatedAt: int = Field(default_factory=lambda: int(datetime.now().timestamp()), description="最后更新时间戳")
    messageCount: int = Field(0, description="消息数量")
    ragLibraryId: Optional[str] = Field(None, description="关联的 RAG 历史消息库 ID")


class ChatMessage(BaseModel):
    """
    项目内部聊天消息
    
    单条对话消息,支持多版本 (swipes)、token 统计等功能。
    """
    id: str = Field(..., description="消息唯一标识符 (UUID)")
    name: str = Field(..., description="发送者名称")
    is_user: bool = Field(..., description="是否为用户消息")
    is_system: Optional[bool] = Field(None, description="是否为系统消息")
    sendDate: str = Field(..., description="发送日期 ISO 字符串")
    mes: str = Field(..., description="消息内容文本")
    chatId: str = Field(..., description="关联的聊天 ID")
    swipes: Optional[List[str]] = Field(None, description="替换回答数组 (多版本)")
    swipe_id: Optional[int] = Field(0, description="当前选择的版本索引")
    tokenCount: Optional[int] = Field(None, description="Token 数量 (用于统计)")
    isTemporary: Optional[bool] = Field(None, description="是否为临时消息 (未保存)")


class ChatLog(BaseModel):
    """
    项目内部完整聊天记录
    
    包含聊天头和所有消息,是完整的对话历史。
    """
    header: ChatHeader = Field(..., description="聊天头")
    messages: List[ChatMessage] = Field(default_factory=list, description="消息列表")


# ==================== 预设 (Preset) ====================

class GenerationPreset(BaseModel):
    """
    项目内部采样参数预设
    
    控制 LLM 生成的参数配置,如温度、top_p 等。
    """
    id: str = Field(..., description="预设唯一标识符 (UUID)")
    name: str = Field(..., description="预设名称")
    temperature: float = Field(1.0, ge=0, le=2, description="温度 (控制随机性)")
    topP: float = Field(1.0, ge=0, le=1, description="Top P (核采样)")
    topK: int = Field(0, ge=0, description="Top K")
    repetitionPenalty: float = Field(1.0, ge=0, description="重复惩罚")
    frequencyPenalty: Optional[float] = Field(None, description="频率惩罚")
    presencePenalty: Optional[float] = Field(None, description="存在惩罚")
    maxLength: Optional[int] = Field(None, gt=0, description="最大生成长度")
    isDefault: bool = Field(False, description="是否为默认预设")
    createdAt: int = Field(default_factory=lambda: int(datetime.now().timestamp()), description="创建时间戳")
    updatedAt: int = Field(default_factory=lambda: int(datetime.now().timestamp()), description="最后更新时间戳")


# ==================== 提示词预设 (Prompt Preset) ====================

class PromptRole(str, Enum):
    """
    Prompt 角色类型
    
    内部业务层只保留三种角色,简化了 SillyTavern 的复杂角色系统。
    """
    SYSTEM = 'system'  # 系统指令
    AI = 'ai'         # AI 助手
    USER = 'user'     # 用户


class PromptEntry(BaseModel):
    """
    内部业务层 - Prompt 条目
    
    提示词模板的基本单元,可以组合成完整的提示词预设。
    这是基于某个 character_id 生成的"当前视图"。
    """
    identifier: str = Field(..., description="稳定关联键 (用于回写)")
    name: str = Field(..., description="条目名 (前端显示)")
    enabled: bool = Field(True, description="是否启用 (当前作用域下的业务状态)")
    content: str = Field(..., description="条目内容 (静态内容视图)")
    order: int = Field(..., description="条目顺序 (前端展示和拖拽排序)")
    role: PromptRole = Field(..., description="角色类型")
    tokenCount: int = Field(0, description="总 token 数 (派生显示字段)")
    isSystemNode: bool = Field(False, description="是否固有节点 (不可删除)")


class PromptPresetView(BaseModel):
    """
    内部业务层 - Prompt 预设视图
    
    基于某个 character_id 的"当前视图",包含已排序、已过滤的条目列表。
    """
    characterId: str = Field(..., description="关联的角色 ID")
    entries: List[PromptEntry] = Field(default_factory=list, description="当前视图的条目列表")
    updatedAt: int = Field(default_factory=lambda: int(datetime.now().timestamp()), description="最后更新时间戳")
    version: int = Field(1, description="版本号")


# ==================== RAG 配置 ====================

class RAGSearchConfig(BaseModel):
    """RAG 搜索配置"""
    topK: int = Field(5, gt=0, description="每次检索返回的结果数")
    threshold: float = Field(0.7, ge=0, le=1, description="相似度阈值 (0-1)")
    maxContextLength: int = Field(2000, gt=0, description="最大上下文长度 (字符数)")


class CharacterRAGConfig(BaseModel):
    """
    角色卡 RAG 世界书库配置
    
    记录角色卡关联的 RAG 知识库,用于动态检索相关知识。
    """
    characterId: str = Field(..., description="角色卡ID")
    ragLibraryIds: List[str] = Field(default_factory=list, description="关联的RAG库ID列表")
    enabled: bool = Field(True, description="是否启用")
    searchConfig: Optional[RAGSearchConfig] = Field(None, description="搜索配置")
    position: str = Field('after_char', description="RAG内容插入位置")
    createdAt: int = Field(default_factory=lambda: int(datetime.now().timestamp()), description="创建时间戳")
    updatedAt: int = Field(default_factory=lambda: int(datetime.now().timestamp()), description="最后更新时间戳")


class ChatRAGConfig(BaseModel):
    """
    聊天会话 RAG 历史消息配置
    
    记录聊天会话关联的 RAG 历史消息库,用于智能检索历史对话。
    """
    chatId: str = Field(..., description="聊天会话ID")
    ragLibraryId: Optional[str] = Field(None, description="关联的RAG历史消息库ID")
    enabled: bool = Field(True, description="是否启用")
    searchConfig: Optional[Dict[str, Any]] = Field(None, description="搜索配置")
    autoIndex: bool = Field(True, description="是否自动索引新消息")
    indexConfig: Optional[Dict[str, Any]] = Field(None, description="索引配置")
    createdAt: int = Field(default_factory=lambda: int(datetime.now().timestamp()), description="创建时间戳")
    updatedAt: int = Field(default_factory=lambda: int(datetime.now().timestamp()), description="最后更新时间戳")
