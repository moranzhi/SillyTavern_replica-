from fastapi import APIRouter, HTTPException, status
from pathlib import Path
import json
from typing import List, Dict
from backend.core.models.chat_history import ChatHistory, Message

router = APIRouter(prefix="/chats", tags=["chats"])


# ========== 聊天历史基础路由 ==========

@router.get("", response_model=Dict[str, List[Dict]])
async def list_all_chats():
	"""获取所有角色的所有聊天列表"""
	data_dir = Path("data")
	if not data_dir.exists():
		return {"chats": []}

	chats = []
	for role_dir in data_dir.iterdir():
		if role_dir.is_dir():
			for chat_file in role_dir.glob("*.jsonl"):
				try:
					with open(chat_file, 'r', encoding='utf-8') as f:
						# 读取第一行获取元数据
						first_line = f.readline()
						metadata = json.loads(first_line)
						chats.append({
							"role_name": role_dir.name,
							"chat_name": chat_file.stem,
							"user_name": metadata.get("user_name", "User"),
							"character_name": metadata.get("character_name", "Assistant"),
							"last_modified": metadata.get("last_modified", ""),
							"message_count": sum(1 for _ in f)  # 统计剩余行数(消息数)
						})
				except Exception as e:
					continue  # 跳过损坏的聊天文件
	return {"chats": chats}


@router.get("/{role_name}/{chat_name}")
async def get_chat(role_name: str, chat_name: str):
	"""获取指定聊天的完整内容"""
	try:
		chat_history = ChatHistory.load_from_file(role_name, chat_name)
		return {
			"metadata": chat_history.chat_metadata.dict(),
			"messages": chat_history.to_chatbox_format()
		}
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Chat not found")


@router.post("/{role_name}", status_code=status.HTTP_201_CREATED)
async def create_chat(role_name: str, chat_name: str, metadata: Dict = None):
	"""创建新聊天"""
	role_dir = Path("data") / role_name
	role_dir.mkdir(parents=True, exist_ok=True)
	chat_path = role_dir / f"{chat_name}.jsonl"

	if chat_path.exists():
		raise HTTPException(status_code=400, detail="Chat already exists")

	# 创建聊天历史对象
	chat_history = ChatHistory(
			chat_metadata=metadata or {},
			messages=[]
	)

	# 保存到文件
	chat_history.save_to_file(role_name, chat_name)
	return {"message": "Chat created successfully"}


@router.put("/{role_name}/{chat_name}")
async def update_chat(role_name: str, chat_name: str, update_data: Dict):
	"""更新聊天元数据"""
	try:
		chat_history = ChatHistory.load_from_file(role_name, chat_name)

		# 更新元数据
		if "metadata" in update_data:
			for key, value in update_data["metadata"].items():
				if hasattr(chat_history.chat_metadata, key):
					setattr(chat_history.chat_metadata, key, value)

		# 保存更改
		chat_history.save_to_file(role_name, chat_name)
		return {"message": "Chat metadata updated successfully"}
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Chat not found")


@router.delete("/{role_name}/{chat_name}")
async def delete_chat(role_name: str, chat_name: str):
	"""删除指定聊天"""
	chat_path = Path("data") / role_name / f"{chat_name}.jsonl"
	if not chat_path.exists():
		raise HTTPException(status_code=404, detail="Chat not found")
	chat_path.unlink()
	return {"message": "Chat deleted successfully"}


# ========== 聊天消息路由 ==========

@router.get("/{role_name}/{chat_name}/messages")
async def list_messages(role_name: str, chat_name: str):
	"""获取聊天的所有消息"""
	try:
		chat_history = ChatHistory.load_from_file(role_name, chat_name)
		return {"messages": chat_history.to_chatbox_format()}
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Chat not found")


@router.get("/{role_name}/{chat_name}/messages/{floor}")
async def get_message(role_name: str, chat_name: str, floor: int):
	"""获取指定楼层的消息"""
	try:
		chat_history = ChatHistory.load_from_file(role_name, chat_name)
		message = next((msg for msg in chat_history.messages if msg.floor == floor), None)

		if not message:
			raise HTTPException(status_code=404, detail="Message not found")

		return message.dict()
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Chat not found")


@router.post("/{role_name}/{chat_name}/messages", status_code=status.HTTP_201_CREATED)
async def add_message(role_name: str, chat_name: str, message_data: Dict):
	"""向聊天添加新消息"""
	try:
		chat_history = ChatHistory.load_from_file(role_name, chat_name)

		# 创建消息对象
		message = Message(**message_data)

		# 检查楼层是否已存在
		if any(msg.floor == message.floor for msg in chat_history.messages):
			raise HTTPException(status_code=400, detail="Message floor already exists")

		# 添加消息
		chat_history.messages.append(message)

		# 保存更改
		chat_history.save_to_file(role_name, chat_name)
		return {"message": "Message added successfully", "floor": message.floor}
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Chat not found")


@router.put("/{role_name}/{chat_name}/messages/{floor}")
async def update_message(role_name: str, chat_name: str, floor: int, update_data: Dict):
	"""更新指定楼层的消息"""
	try:
		chat_history = ChatHistory.load_from_file(role_name, chat_name)
		message = next((msg for msg in chat_history.messages if msg.floor == floor), None)

		if not message:
			raise HTTPException(status_code=404, detail="Message not found")

		# 更新消息字段
		for key, value in update_data.items():
			if hasattr(message, key):
				setattr(message, key, value)

		# 保存更改
		chat_history.save_to_file(role_name, chat_name)
		return {"message": "Message updated successfully"}
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Chat not found")


@router.delete("/{role_name}/{chat_name}/messages/{floor}")
async def delete_message(role_name: str, chat_name: str, floor: int):
	"""删除指定楼层的消息"""
	try:
		chat_history = ChatHistory.load_from_file(role_name, chat_name)

		# 查找并删除消息
		original_length = len(chat_history.messages)
		chat_history.messages = [msg for msg in chat_history.messages if msg.floor != floor]

		if len(chat_history.messages) == original_length:
			raise HTTPException(status_code=404, detail="Message not found")

		# 保存更改
		chat_history.save_to_file(role_name, chat_name)
		return {"message": "Message deleted successfully"}
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Chat not found")
