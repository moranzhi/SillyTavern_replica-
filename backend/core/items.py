from pydantic import BaseModel, Field
from typing import Optional, List


# 1. 定义请求体模型
class ChatRequest(BaseModel):
    # --- 基础信息 ---
    mes: str = Field(..., description="用户输入的消息内容")
    is_user: bool = Field(..., description="标识发送者是否为用户（True为用户，False为AI）")
    floor_number: int = Field(..., description="当前对话的楼层号，用于判断是否为重试(Regenerate)请求")

    # --- 身份与会话 ---
    name: str = Field("default", description="发送者的显示名称，默认为'default'")
    role_name: Optional[str] = Field(None, description="当前绑定的角色名称")
    chat_name: Optional[str] = Field(None, description="当前会话的标识名称")
    preset: Optional[str] = Field(None, description="预设的提示词或系统指令")

    # --- 功能开关 ---
    stream: bool = Field(False, description="是否开启流式输出")
    img_switch: bool = Field(False, description="是否开启图片生成功能")
    table_switch: bool = Field(False, description="是否开启表格生成功能")

# 其他可能需要的参数，比如历史记录，可以在这里加
    # history: Optional[List[Dict]] = None
