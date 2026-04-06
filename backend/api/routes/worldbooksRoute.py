# 标准库导入
import os
import shutil
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

# 第三方库导入
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse

# 本地模块导入
from backend.core.models.WorldBook import WorldBook
from backend.core.models.WorldItem import (
	WorldInfoEntry,
	TriggerConfig,
	KeywordTriggerConfig,
	RAGTriggerConfig,
	ConditionTriggerConfig,
	TriggerStrategy
)
from backend.core.config import settings

# 配置日志
logger = logging.getLogger(__name__)

# 创建路由器
router = APIRouter(prefix="/worldbooks", tags=["worldbooks"])

# 确保世界书目录存在 (由 config.py 中的 settings.ensure_directories() 统一处理，此处保留作为双重保险)
os.makedirs(settings.WORLDBOOKS_PATH, exist_ok=True)


@router.get("/", response_model=List[Dict[str, Any]])
async def list_worldbooks():
	"""
	获取所有世界书的列表
	Returns:
		List[Dict[str, Any]]: 世界书列表
	"""
	try:
		worldbooks = []
		search_dir = settings.WORLDBOOKS_PATH

		# 检查目录是否存在
		if not os.path.exists(search_dir):
			logger.warning(f"目录不存在: {search_dir}")
			return []

		for filename in os.listdir(search_dir):
			if filename.endswith(".json"):
				file_path = os.path.join(search_dir, filename)
				try:
					# 加载世界书基本信息
					# 传入文件名（不带扩展名）
					world_book = WorldBook.load(Path(file_path).stem)
					worldbooks.append(world_book.to_summary_dict())
				except Exception as e:
					logger.warning(f"加载世界书 {filename} 失败: {str(e)}")
					continue

		logger.info(f"获取世界书列表: 共 {len(worldbooks)} 个")
		return worldbooks
	except Exception as e:
		logger.error(f"获取世界书列表失败: {str(e)}")
		raise HTTPException(status_code=500, detail=f"获取世界书列表失败: {str(e)}")


@router.get("/{name}", response_model=Dict[str, Any])
async def get_worldbook(name: str):
	"""
	获取指定名称的世界书

	Args:
		name: 世界书名称

	Returns:
		Dict[str, Any]: 世界书数据
	"""
	try:
		if not WorldBook.exists(name):
			raise HTTPException(status_code=404, detail=f"世界书 '{name}' 不存在")

		world_book = WorldBook.load(name)
		logger.info(f"获取世界书: {name}")
		return world_book.to_dict()
	except HTTPException:
		raise
	except Exception as e:
		logger.error(f"获取世界书 {name} 失败: {str(e)}")
		raise HTTPException(status_code=500, detail=f"获取世界书失败: {str(e)}")


@router.post("/", response_model=Dict[str, Any])
async def create_worldbook(
		name: str = Form(...),
		description: str = Form(""),
		file: Optional[UploadFile] = File(None)
):
	"""
	创建新世界书

	Args:
		name: 世界书名称
		description: 世界书描述
		file: 可选的上传文件（SillyTavern 格式）

	Returns:
		Dict[str, Any]: 创建的世界书数据
	"""
	try:
		# 如果上传了文件，从文件导入
		if file:
			# 保存临时文件
			temp_path = os.path.join(settings.WORLDBOOKS_PATH, f"temp_{file.filename}")
			with open(temp_path, "wb") as buffer:
				shutil.copyfileobj(file.file, buffer)

			try:
				# 从文件加载世界书
				world_book = WorldBook.load(Path(temp_path).stem)
				# 更新名称和描述
				world_book.name = name
				world_book.description = description
				# 保存世界书
				world_book.save()
				logger.info(f"从文件创建世界书: {name}")
			finally:
				# 删除临时文件
				if os.path.exists(temp_path):
					os.remove(temp_path)
		else:
			# 创建空世界书
			world_book = WorldBook.create_empty(name, description)
			logger.info(f"创建空世界书: {name}")

		return world_book.to_dict()
	except HTTPException:
		raise
	except Exception as e:
		logger.error(f"创建世界书 {name} 失败: {str(e)}")
		raise HTTPException(status_code=500, detail=f"创建世界书失败: {str(e)}")


@router.put("/{name}", response_model=Dict[str, Any])
async def update_worldbook(
		name: str,
		description: Optional[str] = Form(None),
		file: Optional[UploadFile] = File(None)
):
	"""
	更新世界书

	Args:
		name: 世界书名称
		description: 世界书描述（可选）
		file: 可选的上传文件（SillyTavern 格式）

	Returns:
		Dict[str, Any]: 更新后的世界书数据
	"""
	try:
		# 检查世界书是否存在
		if not WorldBook.exists(name):
			raise HTTPException(status_code=404, detail=f"世界书 '{name}' 不存在")

		# 加载世界书
		world_book = WorldBook.load(name)

		# 如果上传了文件，从文件导入并合并
		if file:
			# 保存临时文件
			temp_path = os.path.join(settings.WORLDBOOKS_PATH, f"temp_{file.filename}")
			with open(temp_path, "wb") as buffer:
				shutil.copyfileobj(file.file, buffer)

			try:
				# 从文件加载世界书
				imported_book = WorldBook.load(Path(temp_path).stem)
				# 合并条目
				world_book.merge_from_book(imported_book)
				logger.info(f"从文件更新世界书: {name}")
			finally:
				# 删除临时文件
				if os.path.exists(temp_path):
					os.remove(temp_path)

		# 更新描述（如果提供）
		if description is not None:
			world_book.description = description

		# 保存世界书
		world_book.save()
		logger.info(f"更新世界书: {name}")

		return world_book.to_dict()
	except HTTPException:
		raise
	except Exception as e:
		logger.error(f"更新世界书 {name} 失败: {str(e)}")
		raise HTTPException(status_code=500, detail=f"更新世界书失败: {str(e)}")


@router.delete("/{name}")
async def delete_worldbook(name: str):
	"""
	删除世界书

	Args:
		name: 世界书名称

	Returns:
		Dict[str, Any]: 删除结果
	"""
	try:
		# 检查世界书是否存在
		if not WorldBook.exists(name):
			raise HTTPException(status_code=404, detail=f"世界书 '{name}' 不存在")

		# 获取文件路径
		file_path = WorldBook.get_file_path(name)

		# 删除文件
		os.remove(file_path)

		logger.info(f"删除世界书: {name}")
		return {"success": True, "message": f"世界书 '{name}' 已删除"}
	except HTTPException:
		raise
	except Exception as e:
		logger.error(f"删除世界书 {name} 失败: {str(e)}")
		raise HTTPException(status_code=500, detail=f"删除世界书失败: {str(e)}")


@router.get("/{name}/entries", response_model=List[Dict[str, Any]])
async def list_worldbook_entries(name: str):
	"""
	获取世界书的所有条目（包括已禁用的条目）

	Args:
		name: 世界书名称

	Returns:
		List[Dict[str, Any]]: 条目列表
	"""
	try:
		# 检查世界书是否存在
		if not WorldBook.exists(name):
			raise HTTPException(status_code=404, detail=f"世界书 '{name}' 不存在")

		# 加载世界书
		world_book = WorldBook.load(name)

		# 获取所有条目的核心信息
		entries = world_book.get_all_entries()

		logger.info(f"获取世界书 {name} 的所有条目: 共 {len(entries)} 个")
		return entries
	except HTTPException:
		raise
	except Exception as e:
		logger.error(f"获取世界书 {name} 的条目失败: {str(e)}")
		raise HTTPException(status_code=500, detail=f"获取世界书条目失败: {str(e)}")


@router.get("/{name}/entries/{uid}", response_model=Dict[str, Any])
async def get_worldbook_entry(name: str, uid: int):
	"""
	获取世界书的指定条目

	Args:
		name: 世界书名称
		uid: 条目 UID

	Returns:
		Dict[str, Any]: 条目数据
	"""
	try:
		# 检查世界书是否存在
		if not WorldBook.exists(name):
			raise HTTPException(status_code=404, detail=f"世界书 '{name}' 不存在")

		# 加载世界书
		world_book = WorldBook.load(name)

		# 获取条目
		entry = world_book.get_entry(uid)
		if entry is None:
			raise HTTPException(status_code=404, detail=f"条目 UID {uid} 不存在")

		logger.info(f"获取世界书 {name} 的条目: UID={uid}")
		return entry.dict()
	except HTTPException:
		raise
	except Exception as e:
		logger.error(f"获取世界书 {name} 的条目 {uid} 失败: {str(e)}")
		raise HTTPException(status_code=500, detail=f"获取世界书条目失败: {str(e)}")


@router.post("/{name}/entries", response_model=Dict[str, Any])
async def create_worldbook_entry(name: str, entry_data: Dict[str, Any]):
	"""
	在世界书中创建新条目

	Args:
		name: 世界书名称
		entry_data: 条目数据

	Returns:
		Dict[str, Any]: 创建的条目数据
	"""
	try:
		# 检查世界书是否存在
		if not WorldBook.exists(name):
			raise HTTPException(status_code=404, detail=f"世界书 '{name}' 不存在")

		# 加载世界书
		world_book = WorldBook.load(name)

		# 处理触发配置数据
		trigger_data = entry_data.pop("trigger_config", None)
		if trigger_data and "triggers" in trigger_data:
			# 创建新的触发配置对象
			trigger_config = TriggerConfig()

			# 处理每个触发策略
			for strategy_str, trigger_info in trigger_data["triggers"].items():
				try:
					strategy = TriggerStrategy(strategy_str)
					enabled = trigger_info[0] if isinstance(trigger_info, list) and len(trigger_info) > 0 else False
					config_data = trigger_info[1] if isinstance(trigger_info, list) and len(trigger_info) > 1 else None

					# 根据触发策略创建对应的配置对象
					if strategy == TriggerStrategy.KEYWORD and config_data:
						config = KeywordTriggerConfig(**config_data)
					elif strategy == TriggerStrategy.RAG and config_data:
						config = RAGTriggerConfig(**config_data)
					elif strategy == TriggerStrategy.CONDITION and config_data:
						config = ConditionTriggerConfig(**config_data)
					else:
						config = None

					# 设置触发策略
					trigger_config.set_trigger(strategy, enabled, config)
				except Exception as e:
					logger.warning(f"处理触发策略 {strategy_str} 失败: {str(e)}")
					continue

			# 设置触发配置
			entry_data["trigger_config"] = trigger_config

		# 创建条目
		entry = WorldInfoEntry(**entry_data)

		# 添加条目
		world_book.add_entry(entry)

		# 保存世界书
		world_book.save()

		logger.info(f"在世界书 {name} 中创建条目: UID={entry.uid}")
		return entry.dict()
	except HTTPException:
		raise
	except Exception as e:
		logger.error(f"在世界书 {name} 中创建条目失败: {str(e)}")
		raise HTTPException(status_code=500, detail=f"创建世界书条目失败: {str(e)}")


@router.put("/{name}/entries/{uid}", response_model=Dict[str, Any])
async def update_worldbook_entry(name: str, uid: int, entry_data: Dict[str, Any]):
	"""
	更新世界书的指定条目

	Args:
		name: 世界书名称
		uid: 条目 UID
		entry_data: 条目数据

	Returns:
		Dict[str, Any]: 更新后的条目数据
	"""
	try:
		# 检查世界书是否存在
		if not WorldBook.exists(name):
			raise HTTPException(status_code=404, detail=f"世界书 '{name}' 不存在")

		# 加载世界书
		world_book = WorldBook.load(name)

		# 检查条目是否存在
		if world_book.get_entry(uid) is None:
			raise HTTPException(status_code=404, detail=f"条目 UID {uid} 不存在")

		# 处理触发配置数据
		trigger_data = entry_data.pop("trigger_config", None)
		if trigger_data and "triggers" in trigger_data:
			# 创建新的触发配置对象
			trigger_config = TriggerConfig()

			# 处理每个触发策略
			for strategy_str, trigger_info in trigger_data["triggers"].items():
				try:
					strategy = TriggerStrategy(strategy_str)
					enabled = trigger_info[0] if isinstance(trigger_info, list) and len(trigger_info) > 0 else False
					config_data = trigger_info[1] if isinstance(trigger_info, list) and len(trigger_info) > 1 else None

					# 根据触发策略创建对应的配置对象
					if strategy == TriggerStrategy.KEYWORD and config_data:
						config = KeywordTriggerConfig(**config_data)
					elif strategy == TriggerStrategy.RAG and config_data:
						config = RAGTriggerConfig(**config_data)
					elif strategy == TriggerStrategy.CONDITION and config_data:
						config = ConditionTriggerConfig(**config_data)
					else:
						config = None

					# 设置触发策略
					trigger_config.set_trigger(strategy, enabled, config)
				except Exception as e:
					logger.warning(f"处理触发策略 {strategy_str} 失败: {str(e)}")
					continue

			# 设置触发配置
			entry_data["trigger_config"] = trigger_config

		# 过滤无效字段，只保留 WorldInfoEntry 中存在的字段
		valid_fields = WorldInfoEntry.__fields__.keys()
		filtered_data = {k: v for k, v in entry_data.items() if k in valid_fields}

		# 更新条目
		success = world_book.update_entry(uid, **filtered_data)
		if not success:
			raise HTTPException(status_code=500, detail="更新条目失败")

		# 保存世界书
		world_book.save()

		# 获取更新后的条目
		entry = world_book.get_entry(uid)

		logger.info(f"更新世界书 {name} 的条目: UID={uid}")
		return entry.dict()
	except HTTPException:
		raise
	except Exception as e:
		logger.error(f"更新世界书 {name} 的条目 {uid} 失败: {str(e)}")
		raise HTTPException(status_code=500, detail=f"更新世界书条目失败: {str(e)}")


@router.delete("/{name}/entries/{uid}")
async def delete_worldbook_entry(name: str, uid: int):
	"""
	删除世界书的指定条目

	Args:
		name: 世界书名称
		uid: 条目 UID

	Returns:
		Dict[str, Any]: 删除结果
	"""
	try:
		# 检查世界书是否存在
		if not WorldBook.exists(name):
			raise HTTPException(status_code=404, detail=f"世界书 '{name}' 不存在")

		# 加载世界书
		world_book = WorldBook.load(name)

		# 删除条目
		success = world_book.remove_entry(uid)
		if not success:
			raise HTTPException(status_code=404, detail=f"条目 UID {uid} 不存在")

		# 保存世界书
		world_book.save()

		logger.info(f"删除世界书 {name} 的条目: UID={uid}")
		return {"success": True, "message": f"条目 UID {uid} 已删除"}
	except HTTPException:
		raise
	except Exception as e:
		logger.error(f"删除世界书 {name} 的条目 {uid} 失败: {str(e)}")
		raise HTTPException(status_code=500, detail=f"删除世界书条目失败: {str(e)}")


@router.post("/{name}/import", response_model=Dict[str, Any])
async def import_worldbook(name: str, file: UploadFile = File(...)):
	"""
	从文件导入世界书

	Args:
		name: 世界书名称
		file: 上传的文件（SillyTavern 格式）

	Returns:
		Dict[str, Any]: 导入的世界书数据
	"""
	try:
		# 保存临时文件
		temp_path = os.path.join(settings.WORLDBOOKS_PATH, f"temp_{file.filename}")
		with open(temp_path, "wb") as buffer:
			shutil.copyfileobj(file.file, buffer)

		try:
			# 从文件加载世界书
			world_book = WorldBook.load(Path(temp_path).stem)

			# 如果世界书已存在，合并条目
			if WorldBook.exists(name):
				existing_book = WorldBook.load(name)
				existing_book.merge_from_book(world_book)
				# 保存合并后的世界书
				existing_book.save()
				world_book = existing_book
				logger.info(f"导入并合并世界书: {name}")
			else:
				# 设置名称并保存
				world_book.name = name
				world_book.save()
				logger.info(f"导入新世界书: {name}")

			return world_book.to_dict()
		finally:
			# 删除临时文件
			if os.path.exists(temp_path):
				os.remove(temp_path)
	except Exception as e:
		logger.error(f"导入世界书 {name} 失败: {str(e)}")
		raise HTTPException(status_code=500, detail=f"导入世界书失败: {str(e)}")


@router.get("/{name}/export")
async def export_worldbook(name: str):
	"""
	导出世界书为 SillyTavern 格式

	Args:
		name: 世界书名称

	Returns:
		FileResponse: 导出的文件
	"""
	try:
		# 检查世界书是否存在
		if not WorldBook.exists(name):
			raise HTTPException(status_code=404, detail=f"世界书 '{name}' 不存在")

		# 加载世界书
		world_book = WorldBook.load(name)

		# 创建导出文件路径
		export_path = os.path.join(settings.WORLDBOOKS_PATH, f"export_{name}.json")

		# 导出为 SillyTavern 格式
		world_book.to_sillytavern_json(export_path)

		logger.info(f"导出世界书: {name}")

		# 返回文件
		return FileResponse(
				path=export_path,
				filename=f"{name}.json",
				media_type="application/json"
		)
	except HTTPException:
		raise
	except Exception as e:
		logger.error(f"导出世界书 {name} 失败: {str(e)}")
		raise HTTPException(status_code=500, detail=f"导出世界书失败: {str(e)}")
