from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path
from pydantic import BaseModel, Field
import json


class Message(BaseModel):
    """消息类，代表JSONL文件中的一行消息内容"""
    name: str = Field(..., description="发送者名称")
    is_user: bool = Field(..., description="是否为用户消息")
    is_system: bool = Field(False, description="是否为系统消息")
    send_date: str = Field(
        default_factory=lambda: str(int(datetime.now().timestamp() * 1000)),
        description="消息发送时间戳"
    )
    floor: int = Field(0, description="对话楼层数")
    mes: str = Field(..., description="消息内容文本")
    extra: Dict[str, Any] = Field(
        default_factory=dict,
        description="额外信息，包含推理内容、API、模型等"
    )
    force_avatar: Optional[str] = Field(None, description="强制头像URL")
    variables: List[Any] = Field(default_factory=list, description="消息变量列表")
    variables_initialized: List[bool] = Field(default_factory=list, description="变量初始化状态数组")
    is_ejs_processed: List[bool] = Field(default_factory=list, description="EJS处理状态数组")

    # 以下属性仅在is_user为False时有值
    api: Optional[str] = Field(None, description="使用的API提供商")
    model: Optional[str] = Field(None, description="使用的AI模型")
    reasoning: Optional[str] = Field(None, description="推理内容")
    reasoning_duration: Optional[float] = Field(None, description="推理耗时")
    reasoning_signature: Optional[str] = Field(None, description="推理签名")
    time_to_first_token: Optional[float] = Field(None, description="首Token响应时间")
    bias: Optional[float] = Field(None, description="偏差值")


class ChatMetadata(BaseModel):
    """聊天元数据类，包含整个聊天的共享属性"""
    user_name: str = Field("User", description="用户名称")
    character_name: str = Field("Assistant", description="角色名称")

    # 完整性校验相关
    integrity: str = Field("", description="完整性校验值")
    chat_id_hash: str = Field("", description="聊天ID哈希值")

    # 笔记相关
    note_prompt: str = Field("", description="作者笔记提示词")
    note_interval: int = Field(0, description="笔记插入间隔数")
    note_position: int = Field(0, description="笔记插入位置")
    note_depth: int = Field(0, description="笔记插入深度")
    # 0：System，1：User，2：Assistant
    note_role: int = Field("", description="笔记使用角色类型")

    # 扩展信息
    extensions: Dict[str, Any] = Field(
        default_factory=dict,
        description="扩展信息，如LittleWhiteBox等"
    )
    # 世界信息
    timedWorldInfo: Dict[str, Any] = Field(
        default_factory=dict,
        description="定时世界信息"
    )
    # 变量
    variables: Dict[str, Any] = Field(
        default_factory=dict,
        description="变量字典"
    )
    # 状态标记
    tainted: bool = Field(False, description="是否被修改标记")
    lastInContextMessageId: int = Field(-1, description="最后上下文消息ID")


class ChatHistory(BaseModel):
    """聊天文件类，包含完整的聊天记录"""
    chat_metadata: ChatMetadata = Field(..., description="聊天元数据，包含基本信息和配置")
    messages: List[Message] = Field(default_factory=list, description="消息列表")

    class Config:
        arbitrary_types_allowed = True

    @classmethod  # 类方法装饰器，表示这是一个类方法，可以通过类名直接调用
    def load_from_file(cls, role_name: str, chat_name: str, base_path: Path = None) -> 'ChatHistory':
        """
        从JSONL文件加载聊天历史

        参数:
            role_name: 角色名称（文件夹名）
            chat_name: 聊天名称（文件名，不含扩展名）
            base_path: 基础路径，默认为配置中的DATA_PATH/chat

        返回:
            ChatHistory: 加载的聊天历史对象

        异常:
            FileNotFoundError: 当文件不存在时抛出
            json.JSONDecodeError: 当JSON解析失败时抛出
        """
        # 设置默认基础路径 - 如果未提供base_path，则从配置中获取默认路径
        if base_path is None:
            from backend.core.config import settings  # 延迟导入配置模块
            base_path = settings.DATA_PATH / "chat"  # 构建默认路径

        # 构建文件路径
        file_path = base_path / role_name / f"{chat_name}.jsonl"

        # 检查文件是否存在
        if not file_path.exists():
            raise FileNotFoundError(f"聊天文件不存在: {file_path}")

        # 初始化结果数据
        messages = []
        metadata = None

        # 读取文件内容
        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f):
                try:
                    line_data = json.loads(line.strip())

                    # 第一行是元数据
                    if line_num == 0:
                        metadata = ChatMetadata(**line_data)
                    else:
                        # 后续行是消息
                        messages.append(Message(**line_data))
                except json.JSONDecodeError:
                    continue

        # 创建并返回ChatHistory对象
        return cls(
            chat_metadata=metadata or ChatMetadata(),
            messages=messages
        )

    @classmethod
    def load_from_jsonl(cls, file_path: Path) -> 'ChatHistory':
        """
        从JSONL文件加载聊天历史

        参数:
            file_path: JSONL文件路径

        返回:
            ChatHistory: 加载的聊天历史对象

        异常:
            FileNotFoundError: 当文件不存在时抛出
            json.JSONDecodeError: 当JSON解析失败时抛出
        """
        # 检查文件是否存在
        if not file_path.exists():
            raise FileNotFoundError(f"聊天文件不存在: {file_path}")

        # 初始化结果数据
        messages = []
        metadata = None

        # 读取文件内容
        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f):
                try:
                    line_data = json.loads(line.strip())

                    # 第一行是元数据
                    if line_num == 0:
                        # 处理元数据中的嵌套结构
                        if 'chat_metadata' in line_data:
                            metadata_dict = line_data['chat_metadata']
                            # 合并顶层字段和chat_metadata中的字段
                            metadata_dict.update(line_data)
                            metadata = ChatMetadata(**metadata_dict)
                        else:
                            metadata = ChatMetadata(**line_data)
                    else:
                        # 后续行是消息
                        # 处理extra字段中的内容
                        extra_data = line_data.get('extra', {})

                        # 如果是AI消息(is_user=False)，将extra中的某些字段提升到顶层
                        if not line_data.get('is_user', True):
                            ai_fields = ['api', 'model', 'reasoning', 'reasoning_duration',
                                         'reasoning_signature', 'time_to_first_token', 'bias']
                            for field in ai_fields:
                                if field in extra_data:
                                    line_data[field] = extra_data.pop(field)

                        # 创建Message实例
                        message = Message(**line_data)
                        # 将剩余的extra数据保存回extra字段
                        message.extra = extra_data
                        messages.append(message)

                except json.JSONDecodeError:
                    continue

        # 创建并返回ChatHistory对象
        return cls(
            chat_metadata=metadata or ChatMetadata(),
            messages=messages
        )

    def to_chatbox_format(self) -> List[Dict[str, Any]]:
        """
        将聊天历史转换为适合前端chatbox显示的格式

        返回:
            List[Dict[str, Any]]: 按floor排序的消息字典列表，每个字典包含:
            {
                "name": str,
                "is_user": bool,
                "floor": int,
                "mes": str
            }
        """
        # 创建消息字典列表
        messages_list = []
        for msg in self.messages:
            msg_dict = {
                "name": msg.name,
                "is_user": msg.is_user,
                "floor": msg.floor,
                "mes": msg.mes
            }
            messages_list.append(msg_dict)

        # 按floor排序
        messages_list.sort(key=lambda x: x["floor"])

        return messages_list
