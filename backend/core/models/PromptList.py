from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
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
