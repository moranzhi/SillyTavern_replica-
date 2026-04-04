from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from backend.core.models.PromptList import AIDesignSpec
from backend.core.models.PromptComponent import PromptComponent
from enum import Enum

from enum import Enum


class SpecialIdentifier(str, Enum):
	"""
	特殊组件标识符枚举
	定义所有提示词组件的类型及其在最终 Prompt 中的默认物理流向
	顺序大致遵循：系统层 -> 角色层 -> 动态层 -> 历史层 -> 尾部指令
	"""

	WORLD_INFO_BEFORE = "worldInfoBefore"
	"""前置世界书：通常用于全局设定（如物理法则），紧接在 Main Prompt 之后，拥有最高优先级"""

	PERSONA_DESCRIPTION = "personaDescription"
	"""用户设定：告诉 AI {{user}} 是谁，通常放在场景之后，完成“谁在对谁说话”的闭环"""

	ENHANCE_DEFINITIONS = "enhanceDefinitions"
	"""增强定义：通常是 "If you have more knowledge..."，用于补充 AI 的知识库，这里用rag获取"""

	WORLD_INFO_AFTER = "worldInfoAfter"
	"""后置世界书：通常用于特定场景规则，位于中间层底部，用于覆盖或补充前面的全局设定"""

	CHAT_HISTORY = "chatHistory"
	"""聊天历史：包含用户与 AI 的过往对话，占据提示词的下半部分"""

	JAILBREAK = "jailbreak"
	"""后置指令/注释，也即d0层：通常位于聊天记录之后、AI 生成之前，用于最后时刻的强调（如“不要重复”）"""

class PresetAssemblyNode(BaseModel):
	"""预设组装节点类，负责根据组装指令动态组装提示词内容"""

	# 输入数据
	design_spec: AIDesignSpec = Field(
			...,
			description="AI设计规范，包含组件库和组装顺序"
	)
	target_character_id: int = Field(
			...,
			description="目标角色ID，用于选择对应的组装指令"
	)

	# 内部状态（不参与序列化）
	_component_map: Dict[str, PromptComponent] = Field(
			default_factory=dict,
			description="组件标识符到组件对象的映射"
	)

	def __init__(self, **data):
		"""初始化方法，构建组件映射"""
		super().__init__(**data)
		# 构建组件映射字典，提高查找效率
		self._component_map = {
			comp.identifier: comp
			for comp in self.design_spec.prompts
		}

	def _process_special_component(self, component: PromptComponent) -> Optional[Dict[str, Any]]:
		"""
		处理特殊组件（marker为True的组件）

		参数:
			component: 要处理的组件

		返回:
			Optional[Dict[str, Any]]: 处理后的消息，如果组件无法处理则返回None
		"""
		try:
			# 尝试将标识符转换为枚举
			special_id = SpecialIdentifier(component.identifier)

			# 根据不同标识符执行不同处理逻辑
			if special_id == SpecialIdentifier.CHAT_HISTORY:
				return self._handle_chat_history(component)
			elif special_id == SpecialIdentifier.WORLD_INFO_BEFORE:
				return self._handle_world_info_before(component)
			elif special_id == SpecialIdentifier.WORLD_INFO_AFTER:
				return self._handle_world_info_after(component)
			elif special_id == SpecialIdentifier.CHAR_DESCRIPTION:
				return self._handle_char_description(component)
			else:
				# 未知特殊组件，使用默认处理
				return self._process_regular_component(component)
		except ValueError:
			# 不是特殊标识符，使用默认处理
			return self._process_regular_component(component)

	def _process_special_component(self, component: PromptComponent) -> Optional[Dict[str, Any]]:
		"""
		处理特殊组件（marker为True的组件）

		参数:
			component: 要处理的组件

		返回:
			Optional[Dict[str, Any]]: 处理后的消息，如果组件无法处理则返回None
		"""
		try:
			# 尝试将标识符转换为枚举
			special_id = SpecialIdentifier(component.identifier)

			# 根据不同标识符执行不同处理逻辑
			if special_id == SpecialIdentifier.CHAT_HISTORY:
				return self._handle_chat_history(component)
			elif special_id == SpecialIdentifier.WORLD_INFO_BEFORE:
				return self._handle_world_info_before(component)
			elif special_id == SpecialIdentifier.WORLD_INFO_AFTER:
				return self._handle_world_info_after(component)
			elif special_id == SpecialIdentifier.DIALOGUE_EXAMPLES:
				return self._handle_dialogue_examples(component)
			elif special_id == SpecialIdentifier.CHAR_DESCRIPTION:
				return self._handle_char_description(component)
			elif special_id == SpecialIdentifier.CHAR_PERSONALITY:
				return self._handle_char_personality(component)
			elif special_id == SpecialIdentifier.SCENARIO:
				return self._handle_scenario(component)
			elif special_id == SpecialIdentifier.PERSONA_DESCRIPTION:
				return self._handle_persona_description(component)
			else:
				# 未知特殊组件，使用默认处理
				return self._process_regular_component(component)
		except ValueError:
			# 不是特殊标识符，使用默认处理
			return self._process_regular_component(component)

	def _process_regular_component(self, component: PromptComponent) -> Dict[str, Any]:
		"""
		处理普通组件（marker为False的组件）

		参数:
			component: 要处理的组件

		返回:
			Dict[str, Any]: 处理后的消息
		"""
		# 角色映射表
		role_map = {0: "system", 1: "user", 2: "assistant"}

		# 构建消息
		message = {
			"role": role_map.get(component.role, "system"),
			"content": component.content
		}

		# 添加系统提示词标记
		if component.system_prompt:
			message["system_prompt"] = True

		return message

	# 以下为特殊组件处理方法

	def _handle_chat_history(self, component: PromptComponent) -> Dict[str, Any]:
		"""
		处理聊天历史组件

		参数:
			component: 聊天历史组件

		返回:
			Dict[str, Any]: 处理后的消息
		"""
		# 这里应该从外部获取实际的聊天历史
		# 示例实现，实际需要根据业务逻辑调整
		return {
			"role": "system",
			"content": "聊天历史内容...",
			"marker": True,
			"type": "chat_history"
		}

	def _handle_world_info_before(self, component: PromptComponent) -> Dict[str, Any]:
		"""
		处理前置世界信息组件

		参数:
			component: 世界信息组件

		返回:
			Dict[str, Any]: 处理后的消息
		"""
		# 这里应该从外部获取实际的世界信息
		return {
			"role": "system",
			"content": "前置世界信息...",
			"marker": True,
			"type": "world_info_before"
		}

	def _handle_world_info_after(self, component: PromptComponent) -> Dict[str, Any]:
		"""
		处理后置世界信息组件

		参数:
			component: 世界信息组件

		返回:
			Dict[str, Any]: 处理后的消息
		"""
		# 这里应该从外部获取实际的世界信息
		return {
			"role": "system",
			"content": "后置世界信息...",
			"marker": True,
			"type": "world_info_after"
		}


	def _handle_char_description(self, component: PromptComponent) -> Dict[str, Any]:
		"""
		处理角色描述组件

		参数:
			component: 角色描述组件

		返回:
			Dict[str, Any]: 处理后的消息
		"""
		# 这里应该从外部获取实际的角色描述
		return {
			"role": "system",
			"content": "角色描述内容...",
			"marker": True,
			"type": "char_description"
		}

