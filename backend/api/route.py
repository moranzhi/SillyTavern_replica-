from fastapi import APIRouter
from ..core.items import ChatRequest
from ..tools.get_all_role_and_chat import get_all_role_and_chat
from ..tools.save_input_to_json import save_input_to_json

router = APIRouter()

# 1. 将输入内容持久化存储到本地jsonl方便前端读
@router.post("/generate_reply")
async def save_chat_to_json(chat_request: ChatRequest):
    # 调用实际的保存函数
    return await save_input_to_json(chat_request)

# 2. 从本地jsonl中读取历史对话
@router.get("/tool_bar/get_all_role_and_chat")
def get_all_role_and_chat_endpoint():
    # 正确调用函数并返回结果
    return get_all_role_and_chat()
