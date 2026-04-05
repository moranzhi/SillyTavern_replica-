from fastapi import APIRouter, HTTPException, status
from pathlib import Path
import json
from typing import List, Dict
from backend.core.models.PromptList import AIDesignSpec
from backend.core.models.PromptComponent import PromptComponent

router = APIRouter(prefix="/presets", tags=["presets"])


# ========== 预设基础路由 ==========

@router.get("", response_model=Dict[str, List[Dict]])
async def list_presets():
	"""获取所有预设列表及其基本信息"""
	preset_dir = Path("data/preset")
	if not preset_dir.exists():
		return {"presets": []}

	presets = []
	for preset_file in preset_dir.glob("*.json"):
		try:
			with open(preset_file, 'r', encoding='utf-8') as f:
				preset_data = json.load(f)
				presets.append({
					"name": preset_file.stem,
					"description": preset_data.get("description", ""),
					"component_count": len(preset_data.get("prompts", [])),
					"temperature": preset_data.get("temperature", 1.0)
				})
		except Exception as e:
			continue  # 跳过损坏的预设文件
	return {"presets": presets}


@router.get("/{preset_name}")
async def get_preset(preset_name: str):
	"""获取指定预设的完整内容"""
	preset_path = Path("data/preset") / f"{preset_name}.json"
	if not preset_path.exists():
		raise HTTPException(status_code=404, detail="Preset not found")

	try:
		with open(preset_path, 'r', encoding='utf-8') as f:
			preset_data = json.load(f)

		# 转换为AIDesignSpec对象进行验证
		ai_design_spec = AIDesignSpec(**preset_data)
		return ai_design_spec.dict()
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to load preset: {str(e)}")


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_preset(preset_name: str, preset_data: Dict):
	"""创建新预设"""
	preset_dir = Path("data/preset")
	preset_dir.mkdir(parents=True, exist_ok=True)
	preset_path = preset_dir / f"{preset_name}.json"

	if preset_path.exists():
		raise HTTPException(status_code=400, detail="Preset already exists")

	try:
		# 验证并转换为AIDesignSpec对象
		ai_design_spec = AIDesignSpec(**preset_data)

		# 保存到文件
		with open(preset_path, 'w', encoding='utf-8') as f:
			json.dump(ai_design_spec.dict(), f, ensure_ascii=False, indent=2)

		return {"message": "Preset created successfully", "name": preset_name}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to create preset: {str(e)}")


@router.put("/{preset_name}")
async def update_preset(preset_name: str, update_data: Dict):
	"""更新预设配置"""
	preset_path = Path("data/preset") / f"{preset_name}.json"
	if not preset_path.exists():
		raise HTTPException(status_code=404, detail="Preset not found")

	try:
		# 加载现有预设
		with open(preset_path, 'r', encoding='utf-8') as f:
			preset_data = json.load(f)

		# 更新字段
		for key, value in update_data.items():
			preset_data[key] = value

		# 验证并转换为AIDesignSpec对象
		ai_design_spec = AIDesignSpec(**preset_data)

		# 保存更新
		with open(preset_path, 'w', encoding='utf-8') as f:
			json.dump(ai_design_spec.dict(), f, ensure_ascii=False, indent=2)

		return {"message": "Preset updated successfully"}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to update preset: {str(e)}")


@router.delete("/{preset_name}")
async def delete_preset(preset_name: str):
	"""删除指定预设"""
	preset_path = Path("data/preset") / f"{preset_name}.json"
	if not preset_path.exists():
		raise HTTPException(status_code=404, detail="Preset not found")

	try:
		preset_path.unlink()
		return {"message": "Preset deleted successfully"}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to delete preset: {str(e)}")


# ========== 预设组件路由 ==========

@router.get("/{preset_name}/components")
async def list_preset_components(preset_name: str):
	"""获取预设中的所有组件"""
	preset_path = Path("data/preset") / f"{preset_name}.json"
	if not preset_path.exists():
		raise HTTPException(status_code=404, detail="Preset not found")

	try:
		with open(preset_path, 'r', encoding='utf-8') as f:
			preset_data = json.load(f)

		# 获取组件列表
		components = preset_data.get("prompts", [])
		return {"components": components}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to load components: {str(e)}")


@router.get("/{preset_name}/components/{component_id}")
async def get_preset_component(preset_name: str, component_id: str):
	"""获取指定组件的详情"""
	preset_path = Path("data/preset") / f"{preset_name}.json"
	if not preset_path.exists():
		raise HTTPException(status_code=404, detail="Preset not found")

	try:
		with open(preset_path, 'r', encoding='utf-8') as f:
			preset_data = json.load(f)

		# 查找组件
		components = preset_data.get("prompts", [])
		component = next((c for c in components if c.get("identifier") == component_id), None)

		if not component:
			raise HTTPException(status_code=404, detail="Component not found")

		return component
	except HTTPException:
		raise
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to load component: {str(e)}")


@router.post("/{preset_name}/components", status_code=status.HTTP_201_CREATED)
async def add_preset_component(preset_name: str, component_data: Dict):
	"""向预设添加新组件"""
	preset_path = Path("data/preset") / f"{preset_name}.json"
	if not preset_path.exists():
		raise HTTPException(status_code=404, detail="Preset not found")

	try:
		# 加载预设数据
		with open(preset_path, 'r', encoding='utf-8') as f:
			preset_data = json.load(f)

		# 验证组件数据
		component = PromptComponent(**component_data)

		# 检查组件ID是否已存在
		components = preset_data.get("prompts", [])
		if any(c.get("identifier") == component.identifier for c in components):
			raise HTTPException(status_code=400, detail="Component identifier already exists")

		# 添加组件
		components.append(component.dict())
		preset_data["prompts"] = components

		# 保存更新
		with open(preset_path, 'w', encoding='utf-8') as f:
			json.dump(preset_data, f, ensure_ascii=False, indent=2)

		return {"message": "Component added successfully", "identifier": component.identifier}
	except HTTPException:
		raise
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to add component: {str(e)}")


@router.put("/{preset_name}/components/{component_id}")
async def update_preset_component(preset_name: str, component_id: str, update_data: Dict):
	"""更新指定组件"""
	preset_path = Path("data/preset") / f"{preset_name}.json"
	if not preset_path.exists():
		raise HTTPException(status_code=404, detail="Preset not found")

	try:
		# 加载预设数据
		with open(preset_path, 'r', encoding='utf-8') as f:
			preset_data = json.load(f)

		# 查找并更新组件
		components = preset_data.get("prompts", [])
		component_index = next((i for i, c in enumerate(components) if c.get("identifier") == component_id), None)

		if component_index is None:
			raise HTTPException(status_code=404, detail="Component not found")

		# 更新组件字段
		for key, value in update_data.items():
			components[component_index][key] = value

		# 保存更新
		with open(preset_path, 'w', encoding='utf-8') as f:
			json.dump(preset_data, f, ensure_ascii=False, indent=2)

		return {"message": "Component updated successfully"}
	except HTTPException:
		raise
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to update component: {str(e)}")


@router.delete("/{preset_name}/components/{component_id}")
async def delete_preset_component(preset_name: str, component_id: str):
	"""从预设中删除指定组件"""
	preset_path = Path("data/preset") / f"{preset_name}.json"
	if not preset_path.exists():
		raise HTTPException(status_code=404, detail="Preset not found")

	try:
		# 加载预设数据
		with open(preset_path, 'r', encoding='utf-8') as f:
			preset_data = json.load(f)

		# 查找并删除组件
		components = preset_data.get("prompts", [])
		original_length = len(components)
		components = [c for c in components if c.get("identifier") != component_id]

		if len(components) == original_length:
			raise HTTPException(status_code=404, detail="Component not found")

		# 更新预设数据
		preset_data["prompts"] = components

		# 保存更新
		with open(preset_path, 'w', encoding='utf-8') as f:
			json.dump(preset_data, f, ensure_ascii=False, indent=2)

		return {"message": "Component deleted successfully"}
	except HTTPException:
		raise
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to delete component: {str(e)}")
