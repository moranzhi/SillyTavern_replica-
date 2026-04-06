from fastapi import APIRouter, HTTPException, status
from backend.core.models.chat_history import ChatHistory, Message

router = APIRouter(prefix="/chat", tags=["chat"])


# ========== 聊天历史基础路由 ==========

@router.get("", response_model=dict)
async def list_all_chats():
	"""获取所有角色的所有聊天列表"""
	return await ChatHistory.list_all_chats()


@router.get("/{role_name}/{chat_name}")
async def get_chat(role_name: str, chat_name: str):
	"""获取指定聊天的完整内容"""
	try:
		return await ChatHistory.get_chat(role_name, chat_name)
	except FileNotFoundError as e:
		raise HTTPException(status_code=404, detail="Chat not found")


@router.post("/{role_name}", status_code=status.HTTP_201_CREATED)
async def create_chat(role_name: str, chat_name: str, metadata: dict = None):
	"""创建新聊天"""
	try:
		return await ChatHistory.create_chat(role_name, chat_name, metadata)
	except FileExistsError:
		raise HTTPException(status_code=400, detail="Chat already exists")


@router.put("/{role_name}/{chat_name}")
async def update_chat(role_name: str, chat_name: str, update_data: dict):
	"""更新聊天元数据"""
	try:
		return await ChatHistory.update_chat(role_name, chat_name, update_data)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Chat not found")


@router.delete("/{role_name}/{chat_name}")
async def delete_chat(role_name: str, chat_name: str):
	"""删除指定聊天"""
	try:
		return await ChatHistory.delete_chat(role_name, chat_name)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Chat not found")


# ========== 聊天消息路由 ==========

@router.get("/{role_name}/{chat_name}/messages")
async def list_messages(role_name: str, chat_name: str):
	"""获取聊天的所有消息"""
	try:
		return await ChatHistory.list_messages(role_name, chat_name)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Chat not found")


@router.get("/{role_name}/{chat_name}/messages/{floor}")
async def get_message(role_name: str, chat_name: str, floor: int):
	"""获取指定楼层的消息"""
	try:
		return await ChatHistory.get_message(role_name, chat_name, floor)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Chat not found")


@router.post("/{role_name}/{chat_name}/messages", status_code=status.HTTP_201_CREATED)
async def add_message(role_name: str, chat_name: str, message_data: dict):
	"""向聊天添加新消息"""
	try:
		return await ChatHistory.add_message(role_name, chat_name, message_data)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Chat not found")
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.put("/{role_name}/{chat_name}/messages/{floor}")
async def update_message(role_name: str, chat_name: str, floor: int, update_data: dict):
	"""更新指定楼层的消息"""
	try:
		return await ChatHistory.update_message(role_name, chat_name, floor, update_data)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Chat not found")


@router.delete("/{role_name}/{chat_name}/messages/{floor}")
async def delete_message(role_name: str, chat_name: str, floor: int):
	"""删除指定楼层的消息"""
	try:
		return await ChatHistory.delete_message(role_name, chat_name, floor)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Chat not found")
