from fastapi import APIRouter, HTTPException, status
# TODO: 实现 ChatService 来替代旧的 ChatHistory 逻辑
# from services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("", response_model=dict)
async def list_all_chats():
	"""获取所有角色的所有聊天列表"""
	# return await ChatService.list_all_chats()
	return {"chats": []}

@router.get("/{role_name}/{chat_name}")
async def get_chat(role_name: str, chat_name: str):
	"""获取指定聊天的完整内容"""
	raise HTTPException(status_code=501, detail="Not Implemented")

@router.post("/{role_name}", status_code=status.HTTP_201_CREATED)
async def create_chat(role_name: str, chat_name: str, metadata: dict = None):
	"""创建新聊天"""
	raise HTTPException(status_code=501, detail="Not Implemented")

@router.put("/{role_name}/{chat_name}")
async def update_chat(role_name: str, chat_name: str, update_data: dict):
	"""更新聊天元数据"""
	raise HTTPException(status_code=501, detail="Not Implemented")

@router.delete("/{role_name}/{chat_name}")
async def delete_chat(role_name: str, chat_name: str):
	"""删除指定聊天"""
	raise HTTPException(status_code=501, detail="Not Implemented")

@router.get("/{role_name}/{chat_name}/messages")
async def list_messages(role_name: str, chat_name: str):
	"""获取聊天的所有消息"""
	raise HTTPException(status_code=501, detail="Not Implemented")

@router.get("/{role_name}/{chat_name}/messages/{floor}")
async def get_message(role_name: str, chat_name: str, floor: int):
	"""获取指定楼层的消息"""
	raise HTTPException(status_code=501, detail="Not Implemented")

@router.post("/{role_name}/{chat_name}/messages", status_code=status.HTTP_201_CREATED)
async def add_message(role_name: str, chat_name: str, message_data: dict):
	"""向聊天添加新消息"""
	raise HTTPException(status_code=501, detail="Not Implemented")

@router.put("/{role_name}/{chat_name}/messages/{floor}")
async def update_message(role_name: str, chat_name: str, floor: int, update_data: dict):
	"""更新指定楼层的消息"""
	raise HTTPException(status_code=501, detail="Not Implemented")

@router.delete("/{role_name}/{chat_name}/messages/{floor}")
async def delete_message(role_name: str, chat_name: str, floor: int):
	"""删除指定楼层的消息"""
	raise HTTPException(status_code=501, detail="Not Implemented")
