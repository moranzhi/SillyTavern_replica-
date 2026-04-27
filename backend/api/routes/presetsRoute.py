from fastapi import APIRouter, HTTPException, status
# TODO: 实现 PresetService 来替代旧的 AIDesignSpec 逻辑
# from services.preset_service import PresetService

router = APIRouter(prefix="/presets", tags=["presets"])

@router.get("", response_model=dict)
async def list_presets():
	"""获取所有预设列表及其基本信息"""
	# return await PresetService.list_all_presets()
	return {"presets": []}

@router.get("/{preset_name}")
async def get_preset(preset_name: str):
	"""获取指定预设的完整内容"""
	# try:
	# 	return await PresetService.get_preset(preset_name)
	# except FileNotFoundError:
	# 	raise HTTPException(status_code=404, detail="Preset not found")
	raise HTTPException(status_code=501, detail="Not Implemented")

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_preset(preset_name: str, preset_data: dict):
	"""创建新预设"""
	raise HTTPException(status_code=501, detail="Not Implemented")

@router.put("/{preset_name}")
async def update_preset(preset_name: str, update_data: dict):
	"""更新预设配置"""
	raise HTTPException(status_code=501, detail="Not Implemented")

@router.delete("/{preset_name}")
async def delete_preset(preset_name: str):
	"""删除指定预设"""
	raise HTTPException(status_code=501, detail="Not Implemented")

@router.get("/{preset_name}/components")
async def list_preset_components(preset_name: str):
	"""获取预设中的所有组件"""
	raise HTTPException(status_code=501, detail="Not Implemented")

@router.get("/{preset_name}/components/{component_id}")
async def get_preset_component(preset_name: str, component_id: str):
	"""获取指定组件的详情"""
	raise HTTPException(status_code=501, detail="Not Implemented")

@router.post("/{preset_name}/components", status_code=status.HTTP_201_CREATED)
async def add_preset_component(preset_name: str, component_data: dict):
	"""向预设添加新组件"""
	raise HTTPException(status_code=501, detail="Not Implemented")

@router.put("/{preset_name}/components/{component_id}")
async def update_preset_component(preset_name: str, component_id: str, update_data: dict):
	"""更新指定组件"""
	raise HTTPException(status_code=501, detail="Not Implemented")

@router.delete("/{preset_name}/components/{component_id}")
async def delete_preset_component(preset_name: str, component_id: str):
	"""从预设中删除指定组件"""
	raise HTTPException(status_code=501, detail="Not Implemented")
