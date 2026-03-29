from fastapi import APIRouter
from ..core.items import ChatRequest
from ..tools.get_all_role_and_chat import get_all_role_and_chat
from ..core.models import chat_history

router = APIRouter()

# 1. 从本地读取所有的data内容
@router.get("/tool_bar/get_all_role_and_chat")
def get_all_role_and_chat_endpoint():
    # 正确调用函数并返回结果
    return get_all_role_and_chat()

# 2. 根据rolename和chatname读取特定聊天记录
@router.post("/chat_box/get_chat_history")
async def get_chat_history_endpoint(role_name: str, chat_name: str):
    # 实例化工具类
    reader = chat_history.load_from_file(role_name, chat_name)

    return reader.to_chatbox_format()
