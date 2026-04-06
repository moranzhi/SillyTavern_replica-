import logging
from enum import Enum
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, field_validator, ConfigDict

# 配置日志
logger = logging.getLogger(__name__)


class WorldInfoPosition(Enum):
	"""
	SillyTavern 世界书条目插入位置枚举

	注意：枚举值的顺序（0-4）并不完全代表物理顺序！
	以下是按照 Prompt 从上到下的真实物理顺序排列的：
	"""

	# --- 1. 顶部区域 ---
	# (System Prompt 在这里，不可插入)

	# --- 2. 核心指令区 (Position 4 实际上在这里) ---
	SYSTEM_PROMPT = 4
	"""
	物理位置：紧跟在系统提示词之后，角色定义之前。
	语境：最高优先级的规则。
	用途：作者注释、核心系统规则。AI 在读人设前就会先读到这个。
	"""

	# --- 3. 角色人设区 (Position 0 实际上在这里) ---
	# (Character Definition 在这里)

	CHAR_AFTER = 0
	"""
	物理位置：紧跟在角色定义之后。
	语境：角色固有属性。
	用途：性格、外貌、长期设定。
	"""

	# --- 4. 示例对话区 ---
	EXAMPLE_BEFORE = 2
	"""
	物理位置：在示例对话块之前。
	"""

	EXAMPLE_AFTER = 3
	"""
	物理位置：在示例对话块之后。
	"""

	# --- 5. 底部区域 ---
	# (Chat History 在这里)
	# (User Input 在这里 - 最新输入)

	# --- 6. 动态深度区 (Depth / d0-d99) ---
	# 这是你强调的"第 6 个插入区"
	# 它不是一个固定的物理点，而是一个动态区域

	DEPTH_HISTORY = 4
	"""
	物理位置：
	- d0: 在 [用户最新输入] 之前，[AI 回复] 之前。
	- d0~d99: 在 [Chat History] 内部，倒数第 N 条消息之前。

	语境：
	- d0: 即时状态（"现在正在发生"）。
	- d1+: 历史背景（"当时就在那里"）。

	用途：
	这是最灵活的插入区，利用 Depth 字段来精确控制条目在对话流中的位置。
	"""

	@classmethod
	def get_description(cls, position: int) -> str:
		"""
		获取位置描述

		Args:
			position: 位置值

		Returns:
			str: 位置描述
		"""
		position_map = {
			0: "角色定义之后",
			1: "角色定义之后 (最常用)",
			2: "示例对话之前",
			3: "示例对话之后",
			4: "系统提示 / 作者注释 (底部) 或 历史记录深度插入"
		}
		return position_map.get(position, "未知位置")

	@classmethod
	def is_depth_position(cls, position: int) -> bool:
		"""
		判断是否为深度插入位置

		Args:
			position: 位置值

		Returns:
			bool: 是否为深度插入位置
		"""
		return position == cls.DEPTH_HISTORY.value


class TriggerStrategy(str, Enum):
	"""
	触发策略枚举
	"""
	CONSTANT = "constant"  # 永久触发
	KEYWORD = "keyword"  # 关键词匹配触发
	RAG = "rag"  # 向量检索触发
	CONDITION = "condition"  # 逻辑条件触发


class RAGTriggerConfig(BaseModel):
	"""
	RAG触发配置
	"""
	threshold: float = Field(0.75, description="RAG 相似度阈值")
	top_k: int = Field(5, description="返回的匹配条目数")
	query_template: Optional[str] = Field(None, description="检索用的查询模板")


class KeywordTriggerConfig(BaseModel):
	"""
	关键词触发配置
	"""
	key: List[str] = Field(default_factory=list, description="主关键词数组")
	keysecondary: List[str] = Field(default_factory=list, description="次要关键词数组")
	selective: bool = Field(True, description="是否开启选择性匹配")
	selectiveLogic: int = Field(0, description="逻辑模式 (0=OR, 1=AND)")
	matchWholeWords: bool = Field(False, description="是否全词匹配")
	caseSensitive: bool = Field(False, description="是否区分大小写")


class ConditionTriggerConfig(BaseModel):
	"""
	条件触发配置
	"""
	variable_a: str = Field(..., description="变量a")
	operator: str = Field(..., description="运算符 (>, <, =, >=, <=, !=)")
	variable_b: str = Field(..., description="变量b")


class TriggerConfig(BaseModel):
	"""
	触发配置
	使用字典结构，键为触发策略，值为[是否启用, 对应配置]的列表
	"""
	triggers: Dict[TriggerStrategy, List[
		Union[bool, Optional[Union[KeywordTriggerConfig, RAGTriggerConfig, ConditionTriggerConfig]]]]] = Field(
			default_factory=lambda: {
				TriggerStrategy.CONSTANT: [True, None],
				TriggerStrategy.KEYWORD: [False, None],
				TriggerStrategy.RAG: [False, None],
				TriggerStrategy.CONDITION: [False, None]
			},
			description="触发配置字典，键为触发策略，值为[是否启用, 对应配置]"
	)

	model_config = ConfigDict(extra='forbid')

	def set_trigger(self, strategy: TriggerStrategy, enabled: bool,
	                config: Optional[Union[KeywordTriggerConfig, RAGTriggerConfig, ConditionTriggerConfig]] = None
	                ):
		"""
		设置触发策略

		Args:
			strategy: 触发策略
			enabled: 是否启用
			config: 对应的配置对象
		"""
		self.triggers[strategy] = [enabled, config]

	def get_trigger(self, strategy: TriggerStrategy) -> List[
		Union[bool, Optional[Union[KeywordTriggerConfig, RAGTriggerConfig, ConditionTriggerConfig]]]]:
		"""
		获取触发策略

		Args:
			strategy: 触发策略

		Returns:
			List: [是否启用, 对应配置]
		"""
		return self.triggers.get(strategy, [False, None])

	def get_enabled_triggers(self) -> List[TriggerStrategy]:
		"""
		获取所有启用的触发策略

		Returns:
			List[TriggerStrategy]: 启用的触发策略列表
		"""
		return [strategy for strategy, (enabled, _) in self.triggers.items() if enabled]


class WorldItem(BaseModel):
	"""
	世界书条目完整模型
	包含所有 SillyTavern 世界书条目属性，用于导入导出
	"""

	class Entry(BaseModel):
		"""
		世界书条目模型
		精简版，只包含必要字段，用于实际使用
		"""
		# 基础定义
		uid: int = Field(..., description="唯一标识符")
		content: str = Field(..., description="注入到 Prompt 的实际文本内容")
		comment: str = Field("", description="条目名、备注")

		# 注入与排序
		position: int = Field(0,
		                      description="插入位置 (0=角色定义之前, 1=角色定义之后, 2=示例对话之前, 3=示例对话之后, 4=系统提示/作者注释)")
		order: int = Field(100, description="注入顺序权重，数字越小优先级越高")
		depth: int = Field(4, description="扫描深度，0为最深/最高，4为标准")

		# 触发配置
		trigger_config: Optional[TriggerConfig] = Field(
				default_factory=TriggerConfig,
				description="触发配置，为空表示无需触发配置"
		)
		# 角色匹配
		role: int = Field(0, description="角色匹配 (0=Both, 1=User, 2=Assistant)")

		# 条目启用状态
		enabled: bool = Field(True, description="条目是否启用（启用才会被插入到LLM）")

		@field_validator('position')
		@classmethod
		def validate_position(cls, v):
			"""验证 position 值是否在有效范围内"""
			if v not in [0, 1, 2, 3, 4]:
				logger.warning(f"无效的 position 值: {v}，将使用默认值 1")
				return 1
			return v

		def to_dict(self) -> Dict[str, Any]:
			"""
			转换为字典

			Returns:
				Dict[str, Any]: 字典数据
			"""
			return self.dict()

		def get_trigger_params(self) -> Dict[str, Any]:
			"""
			获取触发策略所需的参数

			Returns:
				Dict[str, Any]: 触发参数字典
			"""
			params = {}

			try:
				# 获取所有启用的触发策略
				enabled_triggers = self.trigger_config.get_enabled_triggers()

				# 处理 RAG 触发
				if TriggerStrategy.RAG in enabled_triggers:
					_, rag_config = self.trigger_config.get_trigger(TriggerStrategy.RAG)
					if rag_config:
						params["threshold"] = rag_config.threshold
						params["top_k"] = rag_config.top_k
						params["query_template"] = rag_config.query_template
						params["vectorized"] = True

				# 处理关键词触发
				if TriggerStrategy.KEYWORD in enabled_triggers:
					_, keyword_config = self.trigger_config.get_trigger(TriggerStrategy.KEYWORD)
					if keyword_config:
						params["key"] = keyword_config.key
						params["keysecondary"] = keyword_config.keysecondary
						params["selective"] = keyword_config.selective
						params["selectiveLogic"] = keyword_config.selectiveLogic
						params["matchWholeWords"] = keyword_config.matchWholeWords
						params["caseSensitive"] = keyword_config.caseSensitive

				# 处理条件触发
				if TriggerStrategy.CONDITION in enabled_triggers:
					_, condition_config = self.trigger_config.get_trigger(TriggerStrategy.CONDITION)
					if condition_config:
						params["variable_a"] = condition_config.variable_a
						params["operator"] = condition_config.operator
						params["variable_b"] = condition_config.variable_b
			except Exception as e:
				# 如果获取触发参数失败，返回空字典，表示使用默认的永久触发
				logger.warning(f"条目 {self.uid} 的触发参数获取失败: {str(e)}，使用默认的永久触发")

			return params

	# 基础定义
	uid: int = Field(..., description="唯一标识符")
	content: str = Field(..., description="注入到 Prompt 的实际文本内容")
	comment: str = Field("", description="条目名、备注")

	# 注入与排序
	position: int = Field(0,
	                      description="插入位置 (0=角色定义之前, 1=角色定义之后, 2=示例对话之前, 3=示例对话之后, 4=系统提示/作者注释)")
	order: int = Field(100, description="注入顺序权重，数字越小优先级越高")
	depth: int = Field(4, description="扫描深度，0为最深/最高，4为标准")

	# 触发配置
	trigger_config: TriggerConfig = Field(
			default_factory=TriggerConfig,
			description="触发配置"
	)

	# 角色匹配
	role: int = Field(0, description="角色匹配 (0=Both, 1=User, 2=Assistant)")

	# 条目启用状态
	enabled: bool = Field(True, description="条目是否启用（启用才会被插入到LLM）")

	# 触发相关属性
	vectorized: bool = Field(False, description="是否使用向量检索（RAG触发）")
	selective: bool = Field(True, description="是否开启选择性匹配（关键词触发）")
	selectiveLogic: int = Field(0, description="逻辑模式 (0=OR, 1=AND)")
	constant: bool = Field(False, description="是否永久触发")

	# 关键词相关
	key: List[str] = Field(default_factory=list, description="主关键词数组")
	keysecondary: List[str] = Field(default_factory=list, description="次要关键词数组")
	matchWholeWords: Optional[bool] = Field(None, description="是否全词匹配")
	caseSensitive: Optional[bool] = Field(None, description="是否区分大小写")

	# RAG相关
	rag_threshold: Optional[float] = Field(None, description="RAG 相似度阈值")
	top_k: Optional[int] = Field(None, description="返回的匹配条目数")
	query_template: Optional[str] = Field(None, description="检索用的查询模板")

	# 条目控制
	addMemo: bool = Field(True, description="是否添加备忘")
	disable: bool = Field(False, description="是否禁用")
	ignoreBudget: bool = Field(False, description="是否忽略预算")
	excludeRecursion: bool = Field(True, description="是否排除递归")
	preventRecursion: bool = Field(True, description="是否阻止递归")
	matchPersonaDescription: bool = Field(False, description="是否匹配人设描述")
	matchCharacterDescription: bool = Field(False, description="是否匹配角色描述")
	matchCharacterPersonality: bool = Field(False, description="是否匹配角色性格")
	matchCharacterDepthPrompt: bool = Field(False, description="是否匹配深度提示")
	matchScenario: bool = Field(False, description="是否匹配场景")
	matchCreatorNotes: bool = Field(False, description="是否匹配作者笔记")
	delayUntilRecursion: bool = Field(False, description="是否延迟递归")

	# 概率相关
	probability: int = Field(100, description="触发概率 (0-100)")
	useProbability: bool = Field(True, description="是否使用概率")

	# 分组相关
	group: str = Field("", description="分组名称")
	groupOverride: bool = Field(False, description="是否覆盖分组")
	groupWeight: int = Field(100, description="分组权重")
	useGroupScoring: bool = Field(False, description="是否使用分组评分")

	# 其他属性
	scanDepth: Optional[int] = Field(None, description="扫描深度")
	automationId: str = Field("", description="自动化ID")
	sticky: int = Field(0, description="粘性")
	cooldown: int = Field(0, description="冷却时间（秒）")
	delay: int = Field(0, description="延迟时间（秒）")
	displayIndex: int = Field(0, description="显示索引")

	# 角色过滤器
	characterFilter: Dict[str, Any] = Field(
			default_factory=lambda: {"isExclude": False, "names": [], "tags": []},
			description="角色过滤器"
	)

	# 验证器
	@field_validator('position')
	@classmethod
	def validate_position(cls, v):
		"""验证 position 值是否在有效范围内"""
		if v not in [0, 1, 2, 3, 4]:
			logger.warning(f"无效的 position 值: {v}，将使用默认值 1")
			return 1
		return v

	@field_validator('role')
	@classmethod
	def validate_role(cls, v):
		"""验证 role 值是否在有效范围内"""
		if v not in [0, 1, 2]:
			logger.warning(f"无效的 role 值: {v}，将使用默认值 2")
			return 2
		return v

	@classmethod
	def from_dict(cls, data: Dict[str, Any]) -> 'WorldItem':
		"""
		从字典创建 WorldItem 对象

		Args:
			data: 字典数据

		Returns:
			WorldItem: WorldItem 对象
		"""
		return cls(**data)

	def to_dict(self) -> Dict[str, Any]:
		"""
		转换为字典

		Returns:
			Dict[str, Any]: 字典数据
		"""
		return self.dict()

	def to_entry(self) -> Entry:
		"""
		转换为 Entry 对象

		Returns:
			Entry: Entry 对象
		"""
		# 转换为 SillyTavern 格式的字典
		sillytavern_dict = self.to_sillytavern_dict()
		# 创建 Entry 对象
		return self.Entry(**sillytavern_dict)

	def to_sillytavern_dict(self) -> Dict[str, Any]:
		"""
		转换为 SillyTavern 格式的字典

		Returns:
			Dict[str, Any]: SillyTavern 格式的条目数据
		"""
		result = {
			"uid": self.uid,
			"content": self.content,
			"comment": self.comment,
			"position": self.position,
			"order": self.order,
			"depth": self.depth,
			"role": self.role,
			"enabled": self.enabled,
			"vectorized": self.vectorized,
			"selective": self.selective,
			"selectiveLogic": self.selectiveLogic,
			"constant": self.constant,
			"key": self.key,
			"keysecondary": self.keysecondary,
			"matchWholeWords": self.matchWholeWords,
			"caseSensitive": self.caseSensitive,
			"addMemo": self.addMemo,
			"disable": self.disable,
			"ignoreBudget": self.ignoreBudget,
			"excludeRecursion": self.excludeRecursion,
			"preventRecursion": self.preventRecursion,
			"matchPersonaDescription": self.matchPersonaDescription,
			"matchCharacterDescription": self.matchCharacterDescription,
			"matchCharacterPersonality": self.matchCharacterPersonality,
			"matchCharacterDepthPrompt": self.matchCharacterDepthPrompt,
			"matchScenario": self.matchScenario,
			"matchCreatorNotes": self.matchCreatorNotes,
			"delayUntilRecursion": self.delayUntilRecursion,
			"probability": self.probability,
			"useProbability": self.useProbability,
			"group": self.group,
			"groupOverride": self.groupOverride,
			"groupWeight": self.groupWeight,
			"scanDepth": self.scanDepth,
			"automationId": self.automationId,
			"sticky": self.sticky,
			"cooldown": self.cooldown,
			"delay": self.delay,
			"displayIndex": self.displayIndex,
			"characterFilter": self.characterFilter
		}

		# 添加 RAG 相关字段
		if self.vectorized:
			result["rag_threshold"] = self.rag_threshold
			result["top_k"] = self.top_k
			result["query_template"] = self.query_template

		# 添加条件触发相关字段
		if TriggerStrategy.CONDITION in self.trigger_config.get_enabled_triggers():
			condition_config = self.trigger_config.get_trigger(TriggerStrategy.CONDITION)[1]
			if condition_config:
				result["variable_a"] = condition_config.variable_a
				result["operator"] = condition_config.operator
				result["variable_b"] = condition_config.variable_b

		return result

	@classmethod
	def from_sillytavern_data(cls, data: Dict[str, Any]) -> 'WorldItem':
		"""
		从 SillyTavern 格式的数据创建 WorldItem 对象

		Args:
			data: SillyTavern 格式的条目数据

		Returns:
			WorldItem: WorldItem 对象
		"""

		constant = data.get("constant", False)
		if isinstance(constant, str):
			constant = constant.lower() in ('true', '1', 'yes')

		enabled = data.get("enabled", True)
		if isinstance(enabled, str):
			enabled = enabled.lower() in ('true', '1', 'yes')

		try:
			# 提取必要字段
			uid = int(data.get("uid", data.get("id", 0)))
			content = data.get("content", "")
			comment = data.get("comment", "")
			position = data.get("position", 0)
			order = data.get("order", 100)
			depth = data.get("depth", 4)
			role = data.get("role", 0)
			enabled = data.get("enabled", True)

			# 处理 position 字段，确保为整数类型
			if isinstance(position, str):
				try:
					position = int(position)
				except ValueError:
					logger.warning(f"条目 {uid} 的 position 字段值 '{position}' 无法转换为整数，使用默认值 0")
					position = 0

			# 初始化触发配置
			trigger_config = TriggerConfig()

			# 读取触发相关字段，并进行类型转换
			vectorized = data.get("vectorized", False)
			if isinstance(vectorized, str):
				vectorized = vectorized.lower() in ('true', '1', 'yes')

			selective = data.get("selective", True)
			if isinstance(selective, str):
				selective = selective.lower() in ('true', '1', 'yes')

			constant = data.get("constant", False)
			if isinstance(constant, str):
				constant = constant.lower() in ('true', '1', 'yes')

			# 初始化变量，确保它们始终有值
			key = []
			keysecondary = []
			selectiveLogic = 0
			matchWholeWords = False
			caseSensitive = False

			# 判断触发策略并设置对应的触发配置
			# 优先级：vectorized > constant > selective
			if vectorized:
				# RAG 触发
				rag_config = RAGTriggerConfig(
						threshold=float(data.get("rag_threshold", 0.75)),
						top_k=int(data.get("top_k", 5)),
						query_template=data.get("query_template", None)
				)
				trigger_config.set_trigger(TriggerStrategy.RAG, True, rag_config)
			elif constant:
				# 永久触发
				trigger_config.set_trigger(TriggerStrategy.CONSTANT, True)
			elif selective:
				# 关键词触发
				key = data.get("key", [])
				keysecondary = data.get("keysecondary", data.get("secondary_keys", []))
				selectiveLogic = int(data.get("selectiveLogic", 0))

				# 处理 matchWholeWords 字段
				matchWholeWords = data.get("matchWholeWords", False)
				if matchWholeWords is None:
					matchWholeWords = False
				elif isinstance(matchWholeWords, str):
					matchWholeWords = matchWholeWords.lower() in ('true', '1', 'yes')

				# 处理 caseSensitive 字段
				caseSensitive = data.get("caseSensitive", False)
				if caseSensitive is None:
					caseSensitive = False
				elif isinstance(caseSensitive, str):
					caseSensitive = caseSensitive.lower() in ('true', '1', 'yes')

				keyword_config = KeywordTriggerConfig(
						key=key,
						keysecondary=keysecondary,
						selective=selective,
						selectiveLogic=selectiveLogic,
						matchWholeWords=matchWholeWords,
						caseSensitive=caseSensitive
				)
				trigger_config.set_trigger(TriggerStrategy.KEYWORD, True, keyword_config)
			else:
				# 默认使用永久触发
				trigger_config.set_trigger(TriggerStrategy.CONSTANT, True)

			# 检查是否有条件触发（虽然 JSON 中没有对应字段，但需要保留兼容性）
			if "variable_a" in data and "operator" in data and "variable_b" in data:
				condition_config = ConditionTriggerConfig(
						variable_a=data.get("variable_a", ""),
						operator=data.get("operator", "="),
						variable_b=data.get("variable_b", "")
				)
				trigger_config.set_trigger(TriggerStrategy.CONDITION, True, condition_config)

			# 创建 WorldItem 对象
			return cls(
					uid=uid,
					content=content,
					comment=comment,
					position=position,
					order=order,
					depth=depth,
					trigger_config=trigger_config,
					role=role,
					enabled=enabled,
					vectorized=vectorized,
					selective=selective,
					selectiveLogic=selectiveLogic,
					constant=constant,
					key=key,
					keysecondary=keysecondary,
					matchWholeWords=matchWholeWords,
					caseSensitive=caseSensitive,
					rag_threshold=float(data.get("rag_threshold", None)) if vectorized else None,
					top_k=int(data.get("top_k", None)) if vectorized else None,
					query_template=data.get("query_template", None),
					addMemo=data.get("addMemo", True),
					disable=data.get("disable", False),
					ignoreBudget=data.get("ignoreBudget", False),
					excludeRecursion=data.get("excludeRecursion", True),
					preventRecursion=data.get("preventRecursion", True),
					matchPersonaDescription=data.get("matchPersonaDescription", False),
					matchCharacterDescription=data.get("matchCharacterDescription", False),
					matchCharacterPersonality=data.get("matchCharacterPersonality", False),
					matchCharacterDepthPrompt=data.get("matchCharacterDepthPrompt", False),
					matchScenario=data.get("matchScenario", False),
					matchCreatorNotes=data.get("matchCreatorNotes", False),
					delayUntilRecursion=data.get("delayUntilRecursion", False),
					probability=data.get("probability", 100),
					useProbability=data.get("useProbability", True),
					group=data.get("group", ""),
					groupOverride=data.get("groupOverride", False),
					groupWeight=data.get("groupWeight", 100),
					useGroupScoring=data.get("useGroupScoring", False),
					scanDepth=data.get("scanDepth", None),
					automationId=data.get("automationId", ""),
					sticky=data.get("sticky", 0),
					cooldown=data.get("cooldown", 0),
					delay=data.get("delay", 0),
					displayIndex=data.get("displayIndex", 0),
					characterFilter=data.get("characterFilter", {"isExclude": False, "names": [], "tags": []})
			)
		except Exception as e:
			logger.error(f"从 SillyTavern 数据创建 WorldItem 失败: {str(e)}")
			raise ValueError(f"从 SillyTavern 数据创建 WorldItem 失败: {str(e)}")


if __name__ == "__main__":
	"""
	测试入口：用于调试 WorldItem 的解析和转换功能
	可以像断点调试一样查看内部执行过程
	"""
	import json
	import sys
	from pathlib import Path

	# 测试用例1：基本条目
	test_data_1 = {
		"uid": 0,
		"content": "测试内容",
		"comment": "测试条目",
		"position": 0,
		"order": 100,
		"depth": 4,
		"role": 0,
		"vectorized": False,
		"selective": True,
		"selectiveLogic": 0,
		"constant": False,
		"key": ["测试关键词"],
		"keysecondary": [],
		"matchWholeWords": False,
		"caseSensitive": False,
		"addMemo": True,
		"disable": False,
		"ignoreBudget": False,
		"excludeRecursion": True,
		"preventRecursion": True
	}

	# 测试用例2：RAG触发
	test_data_2 = {
		"uid": 1,
		"content": "RAG测试内容",
		"comment": "RAG测试条目",
		"position": 4,
		"order": 50,
		"depth": 0,
		"role": 0,
		"vectorized": True,
		"rag_threshold": 0.8,
		"top_k": 10,
		"query_template": "测试模板"
	}

	# 测试用例3：条件触发
	test_data_3 = {
		"uid": 2,
		"content": "条件触发测试",
		"comment": "条件触发条目",
		"position": 1,
		"order": 75,
		"depth": 2,
		"role": 0,
		"variable_a": "好感度",
		"operator": ">",
		"variable_b": "50"
	}

	print("=" * 60)
	print("开始测试 WorldItem 解析功能")
	print("=" * 60)

	try:
		# 测试1：解析基本条目
		print("\n【测试1】解析基本条目...")
		item1 = WorldItem.from_sillytavern_data(test_data_1)
		print(f"✓ 解析成功: {item1.comment}")
		print(f"  - UID: {item1.uid}")
		print(f"  - Position: {item1.position}")
		print(f"  - 触发策略和配置:")
		for strategy in item1.trigger_config.get_enabled_triggers():
			enabled, config = item1.trigger_config.get_trigger(strategy)
			print(f"    * {strategy.value}: 启用={enabled}, 配置={config}")

		# 测试2：解析RAG触发条目
		print("\n【测试2】解析RAG触发条目...")
		item2 = WorldItem.from_sillytavern_data(test_data_2)
		print(f"✓ 解析成功: {item2.comment}")
		print(f"  - UID: {item2.uid}")
		print(f"  - Position: {item2.position}")
		print(f"  - 触发策略和配置:")
		for strategy in item2.trigger_config.get_enabled_triggers():
			enabled, config = item2.trigger_config.get_trigger(strategy)
			print(f"    * {strategy.value}: 启用={enabled}, 配置={config}")
		if item2.rag_threshold:
			print(f"  - RAG阈值: {item2.rag_threshold}")

		# 测试3：解析条件触发条目
		print("\n【测试3】解析条件触发条目...")
		item3 = WorldItem.from_sillytavern_data(test_data_3)
		print(f"✓ 解析成功: {item3.comment}")
		print(f"  - UID: {item3.uid}")
		print(f"  - Position: {item3.position}")
		print(f"  - 触发策略和配置:")
		for strategy in item3.trigger_config.get_enabled_triggers():
			enabled, config = item3.trigger_config.get_trigger(strategy)
			print(f"    * {strategy.value}: 启用={enabled}, 配置={config}")

		# 测试4：从文件读取实际数据
		print("\n【测试4】从实际JSON文件读取...")
		# 从当前文件位置向上查找项目根目录
		current_file = Path(__file__).resolve()
		project_root = current_file
		while project_root.name != "llm_workflow_engine" and project_root.parent != project_root:
			project_root = project_root.parent

		# 构建正确的文件路径
		json_path = project_root / "data" / "worldbooks" / "卡立创-v5.json"
		print(f"查找文件路径: {json_path}")

		if json_path.exists():
			with open(json_path, 'r', encoding='utf-8') as f:
				worldbook_data = json.load(f)
				entries = worldbook_data.get('entries', {})
				print(f"找到 {len(entries)} 个条目")

				# 只测试前3个条目
				for uid, entry_data in list(entries.items())[:3]:
					try:
						item = WorldItem.from_sillytavern_data(entry_data)
						print(f"\n✓ 条目 {uid} 解析成功:")
						print(f"  - 备注: {item.comment}")
						print(f"  - UID: {item.uid}")
						print(f"  - Position: {item.position}")
						print(f"  - 触发策略和配置:")
						for strategy in item.trigger_config.get_enabled_triggers():
							enabled, config = item.trigger_config.get_trigger(strategy)
							print(f"    * {strategy.value}: 启用={enabled}, 配置={config}")
					except Exception as e:
						print(f"\n✗ 条目 {uid} 解析失败: {str(e)}")
						import traceback

						traceback.print_exc()
		else:
			print(f"⚠ 文件不存在: {json_path}")
			print(f"请确认文件路径是否正确")
			# 列出可能的文件位置
			possible_paths = [
				project_root / "data" / "worldbooks",
				project_root / "backend" / "data" / "worldbooks",
				current_file.parent.parent.parent / "data" / "worldbooks"
			]
			print("\n可能的文件位置:")
			for path in possible_paths:
				if path.exists():
					print(f"  ✓ {path}")
					for file in path.glob("*.json"):
						print(f"    - {file.name}")

		print("\n" + "=" * 60)
		print("所有测试完成！")
		print("=" * 60)

	except Exception as e:
		print(f"\n✗ 测试失败: {str(e)}")
		import traceback

		traceback.print_exc()
		sys.exit(1)
