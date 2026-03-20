from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path
from pydantic import BaseModel, Field
import json


class Message(BaseModel):
    """消息类，代表JSONL文件中的一行消息内容"""
    name: str = Field(..., description="发言者名称")
    is_user: bool = Field(..., description="是否为用户消息（true=用户，false=AI/角色）")
    is_system: bool = Field(False, description="是否为系统消息（系统消息在文本导出时会被排除）")
    send_date: str = Field(default_factory=lambda: str(int(datetime.now().timestamp() * 1000)),
                           description="发送时间戳（Unix毫秒数）")
    mes: str = Field(..., description="消息正文内容")
    extra: Dict[str, Any] = Field(default_factory=dict, description="额外信息，包含推理内容、API、模型等")
    swipes: List[str] = Field(default_factory=list, description="备选回复列表")
    swipe_id: int = Field(0, description="当前选中的备选索引（0=第一条）")
    swipe_info: List[Dict[str, Any]] = Field(default_factory=list, description="每个备选回复的生成信息")
    title: str = Field("", description="消息标题，用于消息摘要或分支标记")
    force_avatar: Optional[str] = Field(None, description="强制头像路径")
    variables: List[Any] = Field(default_factory=list, description="变量值数组")
    variables_initialized: List[bool] = Field(default_factory=list, description="变量初始化状态数组")
    is_ejs_processed: List[bool] = Field(default_factory=list, description="EJS模板处理状态数组")
    gen_started: Optional[str] = Field(None, description="生成开始时间戳（Unix毫秒数）")
    gen_finished: Optional[str] = Field(None, description="生成结束时间戳（Unix毫秒数）")


class ChatMetadata(BaseModel):
    """聊天元数据模型，代表JSONL文件的第一行内容"""
    integrity: str = Field("", description="完整性校验哈希值（UUID格式）")
    chat_id_hash: str = Field("", description="聊天ID哈希值")
    note_prompt: str = Field("", description="笔记提示词")
    note_interval: int = Field(0, description="笔记间隔（整数）")
    note_position: int = Field(0, description="笔记位置（整数）")
    note_depth: int = Field(0, description="笔记深度（整数）")
    note_role: int = Field(0, description="笔记角色（整数，0=用户，1=助手）")
    extensions: Dict[str, Any] = Field(default_factory=dict, description="扩展信息，如LittleWhiteBox等")
    timedWorldInfo: Dict[str, Any] = Field(default_factory=dict, description="定时世界信息")
    variables: Dict[str, Any] = Field(default_factory=dict, description="变量字典")
    tainted: bool = Field(False, description="是否被污染")
    lastInContextMessageId: int = Field(-1, description="上下文中最后一条消息的ID")


class ChatFile(BaseModel):
    """聊天文件类，包含元数据和消息列表"""
    user_name: str = Field("User", description="用户名")
    character_name: str = Field("Assistant", description="角色名")
    create_date: str = Field(default_factory=lambda: datetime.now().isoformat(), description="创建日期（ISO 8601格式）")
    chat_metadata: ChatMetadata = Field(default_factory=ChatMetadata, description="聊天元数据")
    messages: List[Message] = Field(default_factory=list, description="消息列表")

    class Config:
        arbitrary_types_allowed = True


def load_chat_file_data(chat_name: str, role_name: str, base_path: Path = None) -> Dict[str, Any]:
    """
    从文件系统加载聊天原始数据

    参数:
        chat_name: 聊天名称
        role_name: 角色名称
        base_path: 基础路径，默认为项目数据目录

    返回:
        dict: 包含元数据和消息列表的原始数据字典
    """
    # 设置默认基础路径
    if base_path is None:
        from backend.core.config import settings
        base_path = settings.DATA_PATH / "chat"

    # 构建文件路径
    file_path = base_path / role_name / f"{chat_name}.jsonl"

    # 检查文件是否存在
    if not file_path.exists():
        raise FileNotFoundError(f"聊天文件不存在: {file_path}")

    # 读取文件内容
    result = {
        "user_name": "User",
        "character_name": role_name,
        "create_date": datetime.now().isoformat(),
        "chat_metadata": {},
        "messages": []
    }

    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                # 解析JSON行
                line_data = json.loads(line.strip())

                # 添加到消息列表
                result["messages"].append(line_data)
            except json.JSONDecodeError:
                continue

    return result


def create_chat_file_from_data(data: Dict[str, Any]) -> ChatFile:
    """
    从原始数据创建ChatFile对象

    参数:
        data: 包含元数据和消息列表的原始数据字典

    返回:
        ChatFile: 创建的聊天文件对象
    """
    # 提取元数据
    metadata = data.get("chat_metadata", {})
    chat_metadata = ChatMetadata(**metadata)

    # 处理消息列表
    messages = []
    for msg_data in data.get("messages", []):
        # 转换为Message对象
        message = Message(
            name=msg_data.get('name', ''),
            is_user=msg_data.get('is_user', False),
            send_date=msg_data.get('send_date', ''),
            mes=msg_data.get('content', ''),
            swipes=msg_data.get('swipes', []),
            swipe_id=msg_data.get('swipes_id', 0)
        )
        messages.append(message)

    # 创建并返回ChatFile对象
    return ChatFile(
        user_name=data.get("user_name", "User"),
        character_name=data.get("character_name", "Assistant"),
        create_date=data.get("create_date", datetime.now().isoformat()),
        chat_metadata=chat_metadata,
        messages=messages
    )


def load_chat_file(chat_name: str, role_name: str, base_path: Path = None) -> ChatFile:
    """
    从文件系统加载聊天数据并创建ChatFile对象

    参数:
        chat_name: 聊天名称
        role_name: 角色名称
        base_path: 基础路径，默认为项目数据目录

    返回:
        ChatFile: 加载的聊天文件对象
    """
    # 加载原始数据
    data = load_chat_file_data(chat_name, role_name, base_path)

    # 创建ChatFile对象
    return create_chat_file_from_data(data)
