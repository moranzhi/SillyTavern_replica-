from fastapi import APIRouter, HTTPException, status
from pathlib import Path
from typing import Dict, List
from backend.core.models.WorldBook import WorldBook
from backend.core.models.WorldItem import WorldInfoEntry

router = APIRouter(prefix="/worldbooks", tags=["worldbooks"])


# ========== 世界书基础路由 ==========

@router.get("", response_model=Dict[str, List[Dict]])
async def list_worldbooks():
	"""获取所有世界书列表"""
	worldbook_dir = Path("data/worldbooks")
	if not worldbook_dir.exists():
		return {"worldbooks": []}

	worldbooks = []
	for wb_file in worldbook_dir.glob("*.json"):
		try:
			worldbook = WorldBook.from_sillytavern_json(str(wb_file))
			worldbooks.append(worldbook.to_summary_dict())
		except Exception as e:
			print(f"警告: 跳过文件 {wb_file.name}，加载失败: {e}")
			continue

	return {"worldbooks": worldbooks}


@router.get("/{worldbook_uid}")
async def get_worldbook(worldbook_uid: str):
	"""获取指定世界书完整内容"""
	worldbook_path = Path("data/worldbooks") / f"{worldbook_uid}.json"
	if not worldbook_path.exists():
		raise HTTPException(status_code=404, detail="WorldBook not found")

	try:
		worldbook = WorldBook.from_sillytavern_json(str(worldbook_path))
		return worldbook.to_dict()
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to load worldbook: {str(e)}")


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_worldbook(worldbook_data: Dict):
	"""创建新世界书"""
	worldbook_dir = Path("data/worldbooks")
	worldbook_dir.mkdir(parents=True, exist_ok=True)

	worldbook = WorldBook.from_dict(worldbook_data)
	worldbook_path = worldbook_dir / f"{worldbook.uid}.json"

	if worldbook_path.exists():
		raise HTTPException(status_code=400, detail="WorldBook already exists")

	worldbook.to_sillytavern_json(str(worldbook_path))
	return {"message": "WorldBook created successfully", "uid": worldbook.uid}


@router.put("/{worldbook_uid}")
async def update_worldbook(worldbook_uid: str, update_data: Dict):
	"""更新世界书基本信息"""
	worldbook_path = Path("data/worldbooks") / f"{worldbook_uid}.json"
	if not worldbook_path.exists():
		raise HTTPException(status_code=404, detail="WorldBook not found")

	try:
		worldbook = WorldBook.from_sillytavern_json(str(worldbook_path))
		for key, value in update_data.items():
			if hasattr(worldbook, key):
				setattr(worldbook, key, value)
		worldbook.to_sillytavern_json(str(worldbook_path))
		return {"message": "WorldBook updated successfully"}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to update worldbook: {str(e)}")


@router.delete("/{worldbook_uid}")
async def delete_worldbook(worldbook_uid: str):
	"""删除世界书"""
	worldbook_path = Path("data/worldbooks") / f"{worldbook_uid}.json"
	if not worldbook_path.exists():
		raise HTTPException(status_code=404, detail="WorldBook not found")
	worldbook_path.unlink()
	return {"message": "WorldBook deleted successfully"}


# ========== 世界书条目路由 ==========

@router.get("/{worldbook_uid}/entries")
async def list_worldbook_entries(worldbook_uid: str):
	"""获取世界书所有条目列表"""
	worldbook_path = Path("data/worldbooks") / f"{worldbook_uid}.json"
	if not worldbook_path.exists():
		raise HTTPException(status_code=404, detail="WorldBook not found")

	try:
		worldbook = WorldBook.from_sillytavern_json(str(worldbook_path))
		return {"entries": [entry.dict() for entry in worldbook.entries]}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to load entries: {str(e)}")


@router.get("/{worldbook_uid}/entries/{entry_uid}")
async def get_worldbook_entry(worldbook_uid: str, entry_uid: str):
	"""获取指定条目详情"""
	worldbook_path = Path("data/worldbooks") / f"{worldbook_uid}.json"
	if not worldbook_path.exists():
		raise HTTPException(status_code=404, detail="WorldBook not found")

	try:
		worldbook = WorldBook.from_sillytavern_json(str(worldbook_path))
		entry = worldbook.get_entry(entry_uid)
		if not entry:
			raise HTTPException(status_code=404, detail="Entry not found")
		return entry.dict()
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to load entry: {str(e)}")


@router.post("/{worldbook_uid}/entries", status_code=status.HTTP_201_CREATED)
async def add_worldbook_entry(worldbook_uid: str, entry_data: Dict):
	"""向世界书添加新条目"""
	worldbook_path = Path("data/worldbooks") / f"{worldbook_uid}.json"
	if not worldbook_path.exists():
		raise HTTPException(status_code=404, detail="WorldBook not found")

	try:
		worldbook = WorldBook.from_sillytavern_json(str(worldbook_path))
		entry = WorldInfoEntry(**entry_data)
		worldbook.add_entry(entry)
		worldbook.to_sillytavern_json(str(worldbook_path))
		return {"message": "Entry added successfully", "entry_uid": entry.uid}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to add entry: {str(e)}")


@router.put("/{worldbook_uid}/entries/{entry_uid}")
async def update_worldbook_entry(worldbook_uid: str, entry_uid: str, update_data: Dict):
	"""更新指定条目"""
	worldbook_path = Path("data/worldbooks") / f"{worldbook_uid}.json"
	if not worldbook_path.exists():
		raise HTTPException(status_code=404, detail="WorldBook not found")

	try:
		worldbook = WorldBook.from_sillytavern_json(str(worldbook_path))
		if not worldbook.update_entry(entry_uid, **update_data):
			raise HTTPException(status_code=404, detail="Entry not found")
		worldbook.to_sillytavern_json(str(worldbook_path))
		return {"message": "Entry updated successfully"}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to update entry: {str(e)}")


@router.delete("/{worldbook_uid}/entries/{entry_uid}")
async def delete_worldbook_entry(worldbook_uid: str, entry_uid: str):
	"""从世界书删除指定条目"""
	worldbook_path = Path("data/worldbooks") / f"{worldbook_uid}.json"
	if not worldbook_path.exists():
		raise HTTPException(status_code=404, detail="WorldBook not found")

	try:
		worldbook = WorldBook.from_sillytavern_json(str(worldbook_path))
		if not worldbook.remove_entry(entry_uid):
			raise HTTPException(status_code=404, detail="Entry not found")
		worldbook.to_sillytavern_json(str(worldbook_path))
		return {"message": "Entry deleted successfully"}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to delete entry: {str(e)}")
