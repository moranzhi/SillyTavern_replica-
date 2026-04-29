# 标准库导入
import os
import json
import shutil
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

# 第三方库导入
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse

# 本地模块导入
from models.internal import WorldInfo, WorldInfoEntry
from core.config import settings
from services.worldbook_service import worldbook_service

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
		return worldbook_service.list_worldbooks()
	except Exception as e:
		logger.error(f"Failed to list worldbooks: {str(e)}")
		raise HTTPException(status_code=500, detail=str(e))

@router.get("/{name}", response_model=Dict[str, Any])
async def get_worldbook(name: str):
	"""
	获取指定名称的世界书
	"""
	try:
		return worldbook_service.get_worldbook(name)
	except FileNotFoundError as e:
		raise HTTPException(status_code=404, detail=str(e))
	except Exception as e:
		logger.error(f"Failed to get worldbook '{name}': {str(e)}")
		raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Dict[str, Any])
async def create_worldbook(
		name: str = Form(...),
		description: str = Form(""),
		file: Optional[UploadFile] = File(None)
):
	"""
	创建新世界书（可选择导入文件）
	"""
	try:
		# 如果提供了文件，从 SillyTavern 格式导入
		if file:
			content = await file.read()
			st_data = json.loads(content.decode('utf-8'))
			return worldbook_service.import_from_sillytavern(name, st_data)
		else:
			# 创建空世界书
			return worldbook_service.create_worldbook(name, description)
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))
	except Exception as e:
		logger.error(f"Failed to create worldbook '{name}': {str(e)}")
		raise HTTPException(status_code=500, detail=str(e))

@router.put("/{name}", response_model=Dict[str, Any])
async def update_worldbook(
		name: str,
		description: Optional[str] = Form(None)
):
	"""
	更新世界书基本信息
	"""
	try:
		return worldbook_service.update_worldbook(name, description)
	except FileNotFoundError as e:
		raise HTTPException(status_code=404, detail=str(e))
	except Exception as e:
		logger.error(f"Failed to update worldbook '{name}': {str(e)}")
		raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{name}")
async def delete_worldbook(name: str):
	"""
	删除世界书
	"""
	try:
		worldbook_service.delete_worldbook(name)
		return {"message": f"Worldbook '{name}' deleted successfully"}
	except FileNotFoundError as e:
		raise HTTPException(status_code=404, detail=str(e))
	except Exception as e:
		logger.error(f"Failed to delete worldbook '{name}': {str(e)}")
		raise HTTPException(status_code=500, detail=str(e))

@router.get("/{name}/entries", response_model=List[Dict[str, Any]])
async def list_worldbook_entries(name: str):
	"""
	获取世界书的所有条目
	"""
	try:
		return worldbook_service.list_entries(name)
	except FileNotFoundError as e:
		raise HTTPException(status_code=404, detail=str(e))
	except Exception as e:
		logger.error(f"Failed to list entries for worldbook '{name}': {str(e)}")
		raise HTTPException(status_code=500, detail=str(e))

@router.get("/{name}/entries/{uid}", response_model=Dict[str, Any])
async def get_worldbook_entry(name: str, uid: str):
	"""
	获取世界书的指定条目
	"""
	try:
		return worldbook_service.get_entry(name, uid)
	except FileNotFoundError as e:
		raise HTTPException(status_code=404, detail=str(e))
	except Exception as e:
		logger.error(f"Failed to get entry '{uid}' from worldbook '{name}': {str(e)}")
		raise HTTPException(status_code=500, detail=str(e))

@router.post("/{name}/entries", response_model=Dict[str, Any])
async def create_worldbook_entry(name: str, entry_data: Dict[str, Any]):
	"""
	在世界书中创建新条目
	"""
	try:
		return worldbook_service.create_entry(name, entry_data)
	except FileNotFoundError as e:
		raise HTTPException(status_code=404, detail=str(e))
	except Exception as e:
		logger.error(f"Failed to create entry in worldbook '{name}': {str(e)}")
		raise HTTPException(status_code=500, detail=str(e))

@router.put("/{name}/entries/{uid}", response_model=Dict[str, Any])
async def update_worldbook_entry(name: str, uid: str, entry_data: Dict[str, Any]):
	"""
	更新世界书的指定条目
	"""
	try:
		return worldbook_service.update_entry(name, uid, entry_data)
	except FileNotFoundError as e:
		raise HTTPException(status_code=404, detail=str(e))
	except Exception as e:
		logger.error(f"Failed to update entry '{uid}' in worldbook '{name}': {str(e)}")
		raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{name}/entries/{uid}")
async def delete_worldbook_entry(name: str, uid: str):
	"""
	删除世界书的指定条目
	"""
	try:
		worldbook_service.delete_entry(name, uid)
		return {"message": f"Entry '{uid}' deleted successfully"}
	except FileNotFoundError as e:
		raise HTTPException(status_code=404, detail=str(e))
	except Exception as e:
		logger.error(f"Failed to delete entry '{uid}' from worldbook '{name}': {str(e)}")
		raise HTTPException(status_code=500, detail=str(e))

@router.post("/{name}/import", response_model=Dict[str, Any])
async def import_worldbook(name: str, file: UploadFile = File(...)):
	"""
	从文件导入世界书(自动检测 SillyTavern 或内部格式)
	"""
	try:
		content = await file.read()
		data = json.loads(content.decode('utf-8'))
		
		# 智能检测格式
		from models.converters import WorldBookConverter
		format_type = WorldBookConverter.detect_format(data)
		
		logger.info(f"检测到世界书格式: {format_type}")
		
		if format_type == "sillytavern":
			# SillyTavern 格式,需要转换
			logger.info(f"正在转换 SillyTavern 格式为内部格式")
			return worldbook_service.import_from_sillytavern(name, data)
		elif format_type == "internal":
			# 已经是内部格式,直接保存
			logger.info(f"检测到内部格式,直接保存")
			return worldbook_service.import_internal_format(name, data)
		else:
			raise HTTPException(status_code=400, detail="无法识别的世界书格式")
			
	except json.JSONDecodeError:
		raise HTTPException(status_code=400, detail="Invalid JSON format")
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))
	except Exception as e:
		logger.error(f"Failed to import worldbook '{name}': {str(e)}")
		raise HTTPException(status_code=500, detail=str(e))

@router.get("/{name}/export")
async def export_worldbook(name: str, format: str = "internal"):
	"""
	导出世界书(支持 internal 和 sillytavern 两种格式)
	
	Args:
		name: 世界书名称
		format: 导出格式 ('internal' 或 'sillytavern'),默认 internal
	"""
	try:
		if format.lower() == "sillytavern":
			# 导出为 SillyTavern 格式(可能丢失特殊设置)
			logger.info(f"导出世界书 '{name}' 为 SillyTavern 格式")
			st_data = worldbook_service.export_to_sillytavern(name)
			
			return JSONResponse(
				content=st_data,
				headers={
					"Content-Disposition": f"attachment; filename={name}_sillytavern.json"
				}
			)
		else:
			# 导出为内部格式(保留所有设置)
			logger.info(f"导出世界书 '{name}' 为内部格式")
			internal_data = worldbook_service.get_worldbook(name)
			
			return JSONResponse(
				content=internal_data,
				headers={
					"Content-Disposition": f"attachment; filename={name}.json"
				}
			)
	except FileNotFoundError as e:
		raise HTTPException(status_code=404, detail=str(e))
	except Exception as e:
		logger.error(f"Failed to export worldbook '{name}': {str(e)}")
		raise HTTPException(status_code=500, detail=str(e))
