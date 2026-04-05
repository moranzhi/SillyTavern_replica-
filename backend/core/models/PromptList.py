from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
from pathlib import Path
import json
from .PromptComponent import PromptComponent


class AIDesignSpec(BaseModel):
	"""AI设计规范类，包含模型生成的核心参数和动态结构配置"""

	# [Base] 基础核心参数
	temperature: float = Field(1.0, description="生成温度，控制随机性(0-2)")
	frequency_penalty: float = Field(0.0, description="频率惩罚，降低重复token概率")
	presence_penalty: float = Field(0.0, description="存在惩罚，鼓励谈论新话题")
	top_p: float = Field(1.0, description="核采样，控制词汇选择范围")
	top_k: int = Field(0, description="随机采样范围，从概率最高的K个词中选择")
	top_a: float = Field(0.0, description="基于平方概率分布的采样")
	min_p: float = Field(0.0, description="最小概率阈值")
	repetition_penalty: float = Field(1.0, description="重复惩罚系数(1.0-1.2)")
	max_context: int = Field(2048, description="上下文窗口大小(Token上限)")
	max_tokens: int = Field(250, description="单次回复的最大长度")
	max_context_unlocked: bool = Field(False, description="是否允许超出限制的上下文")
	names_behavior: int = Field(0, description="名字处理行为(0=默认,1=始终包含,2=仅角色)")
	send_if_empty: str = Field("", description="用户发送空消息时自动填充的内容")
	impersonation_prompt: str = Field("", description="模仿模式下使用的提示词")
	new_chat_prompt: str = Field("", description="开启新聊天时自动发送的系统提示")
	new_group_chat_prompt: str = Field("", description="开启新群组聊天时的提示")
	new_example_chat_prompt: str = Field("", description="新示例聊天的提示")
	continue_nudge_prompt: str = Field("", description="续写功能触发的提示词")
	bias_preset_selected: str = Field("", description="选用的偏见预设")
	wi_format: str = Field("{0}", description="世界书条目的格式化字符串")
	scenario_format: str = Field("{{scenario}}", description="场景描述的格式化字符串")
	personality_format: str = Field("", description="角色性格的格式化字符串")
	group_nudge_prompt: str = Field("", description="群组聊天中提示AI仅以特定角色回复的提示词")
	stream: bool = Field(True, description="是否使用流式输出")
	assistant_prefill: str = Field("", description="强制AI回复的开头内容")
	assistant_impersonation: str = Field("", description="模仿模式下强制AI回复的开头内容")
	use_sysprompt: bool = Field(True, description="是否强制将提示词注入系统层")
	squash_system_messages: bool = Field(False, description="是否压缩系统消息")
	media_inlining: bool = Field(False, description="是否内联媒体描述")
	continue_prefill: bool = Field(True, description="续写时是否预填充内容")
	continue_postfix: str = Field(" ", description="续写时添加的后缀")
	seed: int = Field(-1, description="随机种子(-1为随机)")
	n: int = Field(1, description="生成回复的数量")

	# [Dynamic] 动态结构
	prompts: List[PromptComponent] = Field(
			default_factory=list,
			description="组件库，定义所有可用的积木块"
	)
	prompt_order: List[str] = Field(
			default_factory=list,
			description="组装说明书，定义构建最终提示词的顺序"
	)

	@validator('prompts')
	def validate_prompts_unique_identifier(cls, v):
		"""验证组件标识符唯一性"""
		identifiers = [comp.identifier for comp in v]
		if len(identifiers) != len(set(identifiers)):
			raise ValueError("组件标识符必须唯一")
		return v

	@validator('prompt_order')
	def validate_prompt_order_exists(cls, v, values):
		"""验证prompt_order中的组件ID是否存在于prompts中"""
		if 'prompts' in values:
			prompt_ids = {comp.identifier for comp in values['prompts']}
			invalid_ids = set(v) - prompt_ids
			if invalid_ids:
				raise ValueError(f"prompt_order中包含不存在的组件ID: {invalid_ids}")
		return v

	@classmethod
	def get_preset_dir(cls) -> Path:
		"""获取预设目录路径"""
		try:
			from backend.core.config import settings
			preset_dir = settings.DATA_PATH / "preset"
			# 如果路径不存在，尝试使用相对路径
			if not preset_dir.exists():
				# 尝试从当前工作目录构建路径
				cwd_preset_dir = Path.cwd() / "data" / "preset"
				if cwd_preset_dir.exists():
					return cwd_preset_dir
				# 尝试从脚本所在目录构建路径
				script_dir = Path(__file__).resolve().parent.parent.parent
				script_preset_dir = script_dir / "data" / "preset"
				if script_preset_dir.exists():
					return script_preset_dir
				# 如果都不存在，返回默认路径
				return Path("data/preset")
			return preset_dir
		except ImportError:
			# 如果无法导入settings，尝试使用相对路径
			cwd_preset_dir = Path.cwd() / "data" / "preset"
			if cwd_preset_dir.exists():
				return cwd_preset_dir
			# 尝试从脚本所在目录构建路径
			script_dir = Path(__file__).resolve().parent.parent.parent
			script_preset_dir = script_dir / "data" / "preset"
			if script_preset_dir.exists():
				return script_preset_dir
			# 如果都不存在，返回默认路径
			return Path("data/preset")

	@classmethod
	async def list_all_presets(cls) -> Dict[str, List[Dict]]:
		"""获取所有预设列表及其基本信息"""
		preset_dir = cls.get_preset_dir()
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
			except Exception:
				continue  # 跳过损坏的预设文件
		return {"presets": presets}

	@classmethod
	async def get_preset(cls, preset_name: str) -> Dict[str, Any]:
		"""获取指定预设的完整内容"""
		preset_path = cls.get_preset_dir() / f"{preset_name}.json"
		if not preset_path.exists():
			raise FileNotFoundError(f"Preset not found: {preset_name}")

		try:
			with open(preset_path, 'r', encoding='utf-8') as f:
				preset_data = json.load(f)

			# 处理prompt_order，简化为单角色配置
			if 'prompt_order' in preset_data and isinstance(preset_data['prompt_order'], list) and len(
					preset_data['prompt_order']) > 0:
				# 检查第一个元素是否为字典（多角色配置）
				first_item = preset_data['prompt_order'][0]
				if isinstance(first_item, dict) and 'order' in first_item:
					# 提取第一个角色的order配置
					first_role_order = first_item
					if isinstance(first_role_order['order'], list):
						# 简化为只包含enabled为True的identifier列表
						simplified_order = [
							item.get('identifier')
							for item in first_role_order['order']
							if item.get('enabled', True)
						]
						preset_data['prompt_order'] = simplified_order

			# 转换为AIDesignSpec对象进行验证
			ai_design_spec = cls.from_dict(preset_data)

			# 构建返回数据，确保格式与前端期望的一致
			result = {
				# 基础参数
				"temperature": ai_design_spec.temperature,
				"frequency_penalty": ai_design_spec.frequency_penalty,
				"presence_penalty": ai_design_spec.presence_penalty,
				"top_p": ai_design_spec.top_p,
				"top_k": ai_design_spec.top_k,
				"max_context": ai_design_spec.max_context,
				"max_tokens": ai_design_spec.max_tokens,
				"max_context_unlocked": ai_design_spec.max_context_unlocked,
				"stream_openai": ai_design_spec.stream,
				"seed": ai_design_spec.seed,
				"n": ai_design_spec.n,

				# 兼容旧格式
				"openai_max_context": ai_design_spec.max_context,
				"openai_max_tokens": ai_design_spec.max_tokens,

				# 其他参数
				"top_a": ai_design_spec.top_a,
				"min_p": ai_design_spec.min_p,
				"repetition_penalty": ai_design_spec.repetition_penalty,
				"names_behavior": ai_design_spec.names_behavior,
				"send_if_empty": ai_design_spec.send_if_empty,
				"impersonation_prompt": ai_design_spec.impersonation_prompt,
				"new_chat_prompt": ai_design_spec.new_chat_prompt,
				"new_group_chat_prompt": ai_design_spec.new_group_chat_prompt,
				"new_example_chat_prompt": ai_design_spec.new_example_chat_prompt,
				"continue_nudge_prompt": ai_design_spec.continue_nudge_prompt,
				"bias_preset_selected": ai_design_spec.bias_preset_selected,
				"wi_format": ai_design_spec.wi_format,
				"scenario_format": ai_design_spec.scenario_format,
				"personality_format": ai_design_spec.personality_format,
				"group_nudge_prompt": ai_design_spec.group_nudge_prompt,
				"assistant_prefill": ai_design_spec.assistant_prefill,
				"assistant_impersonation": ai_design_spec.assistant_impersonation,
				"use_sysprompt": ai_design_spec.use_sysprompt,
				"squash_system_messages": ai_design_spec.squash_system_messages,
				"media_inlining": ai_design_spec.media_inlining,
				"continue_prefill": ai_design_spec.continue_prefill,
				"continue_postfix": ai_design_spec.continue_postfix,

				# 处理组件
				"prompts": []
			}

			# 处理组件列表
			if ai_design_spec.prompts:
				# 获取当前角色的prompt_order（简化后的字符串列表）
				current_order = ai_design_spec.prompt_order if ai_design_spec.prompt_order else []

				# 构建组件列表
				for prompt in ai_design_spec.prompts:
					# 检查组件是否在order中
					is_in_order = prompt.identifier in current_order

					# 构建组件对象
					component = {
						"identifier": prompt.identifier,
						"name": prompt.name,
						"content": prompt.content if hasattr(prompt, 'content') else "",
						"role": prompt.role if hasattr(prompt, 'role') else (0 if prompt.system_prompt else 1),
						"system_prompt": prompt.system_prompt,
						"marker": prompt.marker,
						"enabled": is_in_order if current_order else True
					}

					result["prompts"].append(component)

				# 按照order排序组件
				if current_order:
					result["prompts"].sort(
							key=lambda x: current_order.index(x["identifier"]) if x[
								                                                      "identifier"] in current_order else len(
									current_order))

			# 添加prompt_order
			result["prompt_order"] = ai_design_spec.prompt_order if ai_design_spec.prompt_order else []

			return result
		except Exception as e:
			raise Exception(f"Failed to load preset: {str(e)}")

	@classmethod
	async def create_preset(cls, preset_name: str, preset_data: Dict) -> Dict[str, str]:
		"""创建新预设"""
		preset_dir = cls.get_preset_dir()
		preset_dir.mkdir(parents=True, exist_ok=True)
		preset_path = preset_dir / f"{preset_name}.json"

		if preset_path.exists():
			raise FileExistsError(f"Preset already exists: {preset_name}")

		try:
			# 验证并转换为AIDesignSpec对象
			ai_design_spec = cls.from_dict(preset_data)

			# 保存到文件
			with open(preset_path, 'w', encoding='utf-8') as f:
				json.dump(ai_design_spec.dict(), f, ensure_ascii=False, indent=2)

			return {"message": "Preset created successfully", "name": preset_name}
		except Exception as e:
			raise Exception(f"Failed to create preset: {str(e)}")

	@classmethod
	async def update_preset(cls, preset_name: str, update_data: Dict) -> Dict[str, str]:
		"""更新预设配置"""
		preset_path = cls.get_preset_dir() / f"{preset_name}.json"
		if not preset_path.exists():
			raise FileNotFoundError(f"Preset not found: {preset_name}")

		try:
			# 加载现有预设
			with open(preset_path, 'r', encoding='utf-8') as f:
				preset_data = json.load(f)

			# 更新字段
			for key, value in update_data.items():
				preset_data[key] = value

			# 验证并转换为AIDesignSpec对象
			ai_design_spec = cls.from_dict(preset_data)

			# 保存更新
			with open(preset_path, 'w', encoding='utf-8') as f:
				json.dump(ai_design_spec.dict(), f, ensure_ascii=False, indent=2)

			return {"message": "Preset updated successfully"}
		except Exception as e:
			raise Exception(f"Failed to update preset: {str(e)}")

	@classmethod
	async def delete_preset(cls, preset_name: str) -> Dict[str, str]:
		"""删除指定预设"""
		preset_path = cls.get_preset_dir() / f"{preset_name}.json"
		if not preset_path.exists():
			raise FileNotFoundError(f"Preset not found: {preset_name}")

		try:
			preset_path.unlink()
			return {"message": "Preset deleted successfully"}
		except Exception as e:
			raise Exception(f"Failed to delete preset: {str(e)}")

	@classmethod
	async def list_components(cls, preset_name: str) -> Dict[str, List[Dict]]:
		"""获取预设中的所有组件"""
		preset_path = cls.get_preset_dir() / f"{preset_name}.json"
		if not preset_path.exists():
			raise FileNotFoundError(f"Preset not found: {preset_name}")

		try:
			with open(preset_path, 'r', encoding='utf-8') as f:
				preset_data = json.load(f)

			# 获取组件列表
			components = preset_data.get("prompts", [])
			return {"components": components}
		except Exception as e:
			raise Exception(f"Failed to load components: {str(e)}")

	@classmethod
	async def get_component(cls, preset_name: str, component_id: str) -> Dict[str, Any]:
		"""获取指定组件的详情"""
		preset_path = cls.get_preset_dir() / f"{preset_name}.json"
		if not preset_path.exists():
			raise FileNotFoundError(f"Preset not found: {preset_name}")

		try:
			with open(preset_path, 'r', encoding='utf-8') as f:
				preset_data = json.load(f)

			# 查找组件
			components = preset_data.get("prompts", [])
			component = next((c for c in components if c.get("identifier") == component_id), None)

			if not component:
				raise FileNotFoundError(f"Component not found: {component_id}")

			return component
		except FileNotFoundError:
			raise
		except Exception as e:
			raise Exception(f"Failed to load component: {str(e)}")

	@classmethod
	async def add_component_to_preset(cls, preset_name: str, component_data: Dict) -> Dict[str, str]:
		"""向预设添加新组件"""
		preset_path = cls.get_preset_dir() / f"{preset_name}.json"
		if not preset_path.exists():
			raise FileNotFoundError(f"Preset not found: {preset_name}")

		try:
			# 加载预设数据
			with open(preset_path, 'r', encoding='utf-8') as f:
				preset_data = json.load(f)

			# 验证组件数据
			component = PromptComponent(**component_data)

			# 检查组件ID是否已存在
			components = preset_data.get("prompts", [])
			if any(c.get("identifier") == component.identifier for c in components):
				raise ValueError(f"Component identifier already exists: {component.identifier}")

			# 添加组件
			components.append(component.dict())
			preset_data["prompts"] = components

			# 保存更新
			with open(preset_path, 'w', encoding='utf-8') as f:
				json.dump(preset_data, f, ensure_ascii=False, indent=2)

			return {"message": "Component added successfully", "identifier": component.identifier}
		except (FileNotFoundError, ValueError):
			raise
		except Exception as e:
			raise Exception(f"Failed to add component: {str(e)}")

	@classmethod
	async def update_component_in_preset(cls, preset_name: str, component_id: str, update_data: Dict) -> Dict[str, str]:
		"""更新指定组件"""
		preset_path = cls.get_preset_dir() / f"{preset_name}.json"
		if not preset_path.exists():
			raise FileNotFoundError(f"Preset not found: {preset_name}")

		try:
			# 加载预设数据
			with open(preset_path, 'r', encoding='utf-8') as f:
				preset_data = json.load(f)

			# 查找并更新组件
			components = preset_data.get("prompts", [])
			component_index = next((i for i, c in enumerate(components) if c.get("identifier") == component_id), None)

			if component_index is None:
				raise FileNotFoundError(f"Component not found: {component_id}")

			# 更新组件字段
			for key, value in update_data.items():
				components[component_index][key] = value

			# 保存更新
			with open(preset_path, 'w', encoding='utf-8') as f:
				json.dump(preset_data, f, ensure_ascii=False, indent=2)

			return {"message": "Component updated successfully"}
		except FileNotFoundError:
			raise
		except Exception as e:
			raise Exception(f"Failed to update component: {str(e)}")

	@classmethod
	async def delete_component_from_preset(cls, preset_name: str, component_id: str) -> Dict[str, str]:
		"""从预设中删除指定组件"""
		preset_path = cls.get_preset_dir() / f"{preset_name}.json"
		if not preset_path.exists():
			raise FileNotFoundError(f"Preset not found: {preset_name}")

		try:
			# 加载预设数据
			with open(preset_path, 'r', encoding='utf-8') as f:
				preset_data = json.load(f)

			# 查找并删除组件
			components = preset_data.get("prompts", [])
			original_length = len(components)
			components = [c for c in components if c.get("identifier") != component_id]

			if len(components) == original_length:
				raise FileNotFoundError(f"Component not found: {component_id}")

			# 更新预设数据
			preset_data["prompts"] = components

			# 保存更新
			with open(preset_path, 'w', encoding='utf-8') as f:
				json.dump(preset_data, f, ensure_ascii=False, indent=2)

			return {"message": "Component deleted successfully"}
		except FileNotFoundError:
			raise
		except Exception as e:
			raise Exception(f"Failed to delete component: {str(e)}")

	# ========== 组件管理方法 ==========

	def add_component(self, component: PromptComponent) -> None:
		"""
		添加新组件

		参数:
			component: 要添加的组件

		异常:
			ValueError: 当组件标识符已存在时抛出
		"""
		if any(c.identifier == component.identifier for c in self.prompts):
			raise ValueError(f"组件标识符 {component.identifier} 已存在")
		self.prompts.append(component)

	def remove_component(self, identifier: str) -> bool:
		"""
		移除指定组件

		参数:
			identifier: 组件标识符

		返回:
			bool: 是否成功移除
		"""
		original_length = len(self.prompts)
		self.prompts = [c for c in self.prompts if c.identifier != identifier]

		# 同时从prompt_order中移除
		self.prompt_order = [id for id in self.prompt_order if id != identifier]

		return len(self.prompts) < original_length

	def get_component(self, identifier: str) -> Optional[PromptComponent]:
		"""
		获取指定组件

		参数:
			identifier: 组件标识符

		返回:
			Optional[PromptComponent]: 找到的组件，未找到返回None
		"""
		for component in self.prompts:
			if component.identifier == identifier:
				return component
		return None

	def update_component(self, identifier: str, **kwargs) -> bool:
		"""
		更新指定组件

		参数:
			identifier: 组件标识符
			**kwargs: 要更新的字段

		返回:
			bool: 是否成功更新
		"""
		component = self.get_component(identifier)
		if component is None:
			return False

		component.update(**kwargs)
		return True

	def list_components(self) -> List[Dict[str, Any]]:
		"""
		列出所有组件

		返回:
			List[Dict[str, Any]]: 组件字典列表
		"""
		return [component.to_dict() for component in self.prompts]

	def reorder_components(self, new_order: List[str]) -> None:
		"""
		重新排序组件

		参数:
			new_order: 新的组件标识符顺序

		异常:
			ValueError: 当包含不存在的组件ID时抛出
		"""
		# 验证所有ID都存在
		existing_ids = {c.identifier for c in self.prompts}
		invalid_ids = set(new_order) - existing_ids

		if invalid_ids:
			raise ValueError(f"包含不存在的组件ID: {invalid_ids}")

		self.prompt_order = new_order

	def get_ordered_components(self) -> List[PromptComponent]:
		"""
		获取按prompt_order排序的组件列表

		返回:
			List[PromptComponent]: 排序后的组件列表
		"""
		component_map = {c.identifier: c for c in self.prompts}
		ordered_components = []

		for identifier in self.prompt_order:
			if identifier in component_map:
				ordered_components.append(component_map[identifier])

		# 添加未在prompt_order中的组件
		ordered_components.extend([
			c for c in self.prompts
			if c.identifier not in self.prompt_order
		])

		return ordered_components

	def to_dict(self) -> Dict[str, Any]:
		"""
		将设计规范转换为字典

		返回:
			Dict[str, Any]: 设计规范的字典表示
		"""
		return self.dict()

	@classmethod
	def from_dict(cls, data: Dict[str, Any]) -> 'AIDesignSpec':
		"""
		从字典创建设计规范实例

		参数:
			data: 包含设计规范数据的字典

		返回:
			AIDesignSpec: 设计规范实例
		"""
		# 处理prompts字段
		if 'prompts' in data:
			data['prompts'] = [
				PromptComponent.from_dict(comp) if isinstance(comp, dict) else comp
				for comp in data['prompts']
			]

		return cls(**data)
