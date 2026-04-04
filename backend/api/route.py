from fastapi import APIRouter
from ..core.items import ChatRequest
from ..tools.get_all_role_and_chat import get_all_role_and_chat
from ..core.models.chat_history import ChatHistory  # 修改导入语句

router = APIRouter()

#  从本地读取所有的data内容
@router.get("/tool_bar/get_all_role_and_chat")
def get_all_role_and_chat_endpoint():
    # 正确调用函数并返回结果
    return get_all_role_and_chat()

#  根据rolename和chatname读取特定聊天记录
@router.get("/chat_box/get_chat_history")
async def get_chat_history_endpoint(role_name: str, chat_name: str):
    # 实例化工具类
    reader = ChatHistory.load_from_file(role_name, chat_name)

    return reader.to_chatbox_format()


#  从本地读取所有的预设列表内容
@router.get("/presets/list")
async def get_presets_list():
	"""
	获取所有可用的预设列表
	返回预设名称列表
	"""
	import os
	from pathlib import Path

	# 预设文件存储目录
	preset_dir = Path("data/preset")

	# 确保目录存在
	if not preset_dir.exists():
		return {"presets": []}

	# 获取所有.json文件
	preset_files = list(preset_dir.glob("*.json"))

	# 提取文件名(不带扩展名)作为预设名称
	presets = [file.stem for file in preset_files]

	return {"presets": presets}


#  从本地读取特定预设
@router.get("/presets/{preset_name}")
async def get_preset_content(preset_name: str):
	"""
	获取特定预设的完整内容
	"""
	import os
	from pathlib import Path
	import json

	preset_path = Path("data/preset") / f"{preset_name}.json"

	if not preset_path.exists():
		raise HTTPException(status_code=404, detail="Preset not found")

	with open(preset_path, 'r', encoding='utf-8') as f:
		preset_data = json.load(f)

	return preset_data

