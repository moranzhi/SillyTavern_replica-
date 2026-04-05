from fastapi import APIRouter, HTTPException, status
from backend.core.models.PromptList import AIDesignSpec
from backend.core.models.PromptComponent import PromptComponent

router = APIRouter(prefix="/presets", tags=["presets"])


# ========== 预设基础路由 ==========

@router.get("", response_model=dict)
async def list_presets():
	"""获取所有预设列表及其基本信息"""
	return await AIDesignSpec.list_all_presets()


@router.get("/{preset_name}")
async def get_preset(preset_name: str):
	"""获取指定预设的完整内容"""
	try:
		return await AIDesignSpec.get_preset(preset_name)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Preset not found")


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_preset(preset_name: str, preset_data: dict):
	"""创建新预设"""
	try:
		return await AIDesignSpec.create_preset(preset_name, preset_data)
	except FileExistsError:
		raise HTTPException(status_code=400, detail="Preset already exists")


@router.put("/{preset_name}")
async def update_preset(preset_name: str, update_data: dict):
	"""更新预设配置"""
	try:
		return await AIDesignSpec.update_preset(preset_name, update_data)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Preset not found")


@router.delete("/{preset_name}")
async def delete_preset(preset_name: str):
	"""删除指定预设"""
	try:
		return await AIDesignSpec.delete_preset(preset_name)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Preset not found")


# ========== 预设组件路由 ==========

@router.get("/{preset_name}/components")
async def list_preset_components(preset_name: str):
	"""获取预设中的所有组件"""
	try:
		return await AIDesignSpec.list_components(preset_name)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Preset not found")


@router.get("/{preset_name}/components/{component_id}")
async def get_preset_component(preset_name: str, component_id: str):
	"""获取指定组件的详情"""
	try:
		return await AIDesignSpec.get_component(preset_name, component_id)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Preset not found")


@router.post("/{preset_name}/components", status_code=status.HTTP_201_CREATED)
async def add_preset_component(preset_name: str, component_data: dict):
	"""向预设添加新组件"""
	try:
		return await AIDesignSpec.add_component_to_preset(preset_name, component_data)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Preset not found")
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.put("/{preset_name}/components/{component_id}")
async def update_preset_component(preset_name: str, component_id: str, update_data: dict):
	"""更新指定组件"""
	try:
		return await AIDesignSpec.update_component_in_preset(preset_name, component_id, update_data)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Preset not found")


@router.delete("/{preset_name}/components/{component_id}")
async def delete_preset_component(preset_name: str, component_id: str):
	"""从预设中删除指定组件"""
	try:
		return await AIDesignSpec.delete_component_from_preset(preset_name, component_id)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Preset not found")
