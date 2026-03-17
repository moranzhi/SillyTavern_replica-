from fastapi import FastAPI
# 假设这些函数已经在其他地方定义
from backend.core.items import ChatRequest
from backend.tools.get_all_role_and_chat import get_all_role_and_chat as get_chat_file

app = FastAPI()

# 1. 将输入内容持久化存储到本地jsonl方便前端读
@app.post("/generate_reply")
async def save_input_to_json(chat_request: ChatRequest):
    return 0

# 2. 从本地jsonl中读取历史对话
@app.get("/api/get_all_role_and_chat")
def get_all_role_and_chat():
    # 直接调用导入的函数
    result = get_chat_file()
    return result