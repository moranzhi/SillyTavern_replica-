import logging
from enum import Enum
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, validator
from pydantic import Extra

# 配置日志
logger = logging.getLogger(__name__)


class TriggerStrategy(str, Enum):
	"""
	触发策略枚举
	"""
	CONSTANT = "constant"  # 永久触发
	KEYWORD = "keyword"  # 关键词匹配触发
	RAG = "rag"  # 向量检索触发
	CONDITION = "condition"  # 逻辑条件触发


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


class RAGTriggerConfig(BaseModel):
	"""
	RAG触发配置
	"""
	threshold: float = Field(0.75, description="RAG 相似度阈值")
	top_k: int = Field(5, description="返回的匹配条目数")
	query_template: Optional[str] = Field(None, description="检索用的查询模板")


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

	class Config:
		extra = Extra.forbid  # 禁止额外字段

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


class WorldInfoEntry(BaseModel):
	"""
	世界书条目模型
	完整兼容所有可能的属性字段
	"""
	# A. 基础定义 (Base Fields)
	uid: int = Field(..., description="唯一标识符")
	key: List[str] = Field(default_factory=list, description="条目名")
	content: str = Field(..., description="注入到 Prompt 的实际文本内容")
	comment: str = Field("", description="备注")

	# B. 注入与排序 (Injection & Order)
	position: int = Field(0, description="插入位置")
	order: int = Field(100, description="注入顺序权重")
	depth: int = Field(4, description="扫描深度")
	scanDepth: Optional[int] = Field(None, description="显式扫描深度")
	addMemo: bool = Field(False, description="是否添加备忘录标记")

	# C. 触发配置 (Trigger Configuration)
	trigger_config: TriggerConfig = Field(
			default_factory=TriggerConfig,
			description="触发配置"
	)

	# D. 高级匹配 (Advanced Matching)
	role: int = Field(0, description="角色匹配 (0=Both, 1=User, 2=Assistant)")
	useGroupScoring: bool = Field(False, description="是否使用分组评分")

	# E. 分组设置 (Grouping)
	group: Optional[str] = Field(None, description="分组名称")
	groupOverride: bool = Field(False, description="是否覆盖分组限制")
	groupWeight: int = Field(100, description="分组权重")

	# F. 递归与防抖 (Recursion)
	excludeRecursion: bool = Field(True, description="排除递归")
	preventRecursion: bool = Field(True, description="防止递归")
	delayUntilRecursion: bool = Field(False, description="延迟直到递归发生")

	# G. 状态与元数据 (State & Metadata)
	disable: bool = Field(False, description="是否禁用该条目")
	ignoreBudget: bool = Field(False, description="忽略 Token 预算")
	outletName: Optional[str] = Field(None, description="出口名称")
	automationId: Optional[str] = Field(None, description="自动化 ID")
	sticky: int = Field(0, description="粘性值")
	cooldown: int = Field(0, description="冷却时间")
	delay: int = Field(0, description="延迟触发")
	triggers: List[str] = Field(default_factory=list, description="触发器数组")
	displayIndex: int = Field(0, description="UI 显示索引")
	vectorized: bool = Field(False, description="是否已向量化")

	# H. 兼容性字段 (Compatibility)
	matchPersonaDescription: bool = Field(False, description="匹配人设描述")
	matchCharacterDescription: bool = Field(False, description="匹配角色描述")
	matchCharacterPersonality: bool = Field(False, description="匹配角色性格")
	matchCharacterDepthPrompt: bool = Field(False, description="匹配深度提示词")
	matchScenario: bool = Field(False, description="匹配场景")
	matchCreatorNotes: bool = Field(False, description="匹配作者注释")

	# I. 嵌套对象 (Nested Objects)
	characterFilter: Optional[Dict[str, Any]] = Field(None, description="角色过滤器配置")
	extensions: Optional[Dict[str, Any]] = Field(None, description="扩展属性")

	@classmethod
	def from_sillytavern_data(cls, data: Dict[str, Any]) -> 'WorldInfoEntry':
		"""
		从 SillyTavern 格式的数据创建条目

		Args:
			data: SillyTavern 格式的条目数据

		Returns:
			WorldInfoEntry: 世界书条目对象

		Raises:
			ValueError: 数据格式无效
		"""
		try:
			# 提取基本字段
			uid = int(data.get("uid", data.get("id", 0)))  # 条目唯一标识符
			key = data.get("key", data.get("keys", []))  # 条目触发关键词数组，用于匹配和触发该条目
			keysecondary = data.get("keysecondary", data.get("secondary_keys", []))  # 次要关键词数组，用于扩展触发条件
			comment = data.get("comment", "")  # 条目备注说明，用于描述条目的用途和特点
			content = data.get("content", "")  # 条目的实际内容，将被注入到提示词中
			constant = data.get("constant", False)  # 是否常驻注入，true表示始终注入
			selective = data.get("selective", True)  # 是否启用选择性匹配，true表示仅关键词匹配时注入
			order = data.get("order", data.get("insertion_order", 100))  # 条目注入顺序权重，数字越小越优先

			# 处理 position 字段，确保为整数类型
			position = data.get("position", 0)
			if isinstance(position, str):
				# 如果是字符串，尝试转换为整数
				try:
					position = int(position)
				except ValueError:
					# 如果转换失败，使用默认值
					logger.warning(f"条目 {uid} 的 position 字段值 '{position}' 无法转换为整数，使用默认值 0")
					position = 0

			# 处理触发配置，默认使用永久触发
			try:
				trigger_config = TriggerConfig()

				# 设置永久触发
				trigger_config.set_trigger(TriggerStrategy.CONSTANT, constant)

				# 设置关键词触发
				if not constant and key:
					keyword_config = KeywordTriggerConfig(
							key=key,
							keysecondary=keysecondary,
							selective=selective,
							selectiveLogic=data.get("selectiveLogic", 0),
							matchWholeWords=data.get("matchWholeWords", False),
							caseSensitive=data.get("caseSensitive", False)
					)
					trigger_config.set_trigger(TriggerStrategy.KEYWORD, True, keyword_config)

				# 设置RAG触发
				if "rag_threshold" in data or "top_k" in data or "query_template" in data:
					rag_config = RAGTriggerConfig(
							threshold=data.get("rag_threshold", 0.75),
							top_k=data.get("top_k", 5),
							query_template=data.get("query_template", None)
					)
					trigger_config.set_trigger(TriggerStrategy.RAG, True, rag_config)

				# 设置条件触发
				if "variable_a" in data and "operator" in data and "variable_b" in data:
					condition_config = ConditionTriggerConfig(
							variable_a=data.get("variable_a", ""),
							operator=data.get("operator", "="),
							variable_b=data.get("variable_b", "")
					)
					trigger_config.set_trigger(TriggerStrategy.CONDITION, True, condition_config)
			except Exception as e:
				# 如果触发配置解析失败，使用默认的永久触发配置
				logger.warning(f"条目 {uid} 的触发配置解析失败: {str(e)}，使用默认的永久触发配置")
				trigger_config = TriggerConfig()
				trigger_config.set_trigger(TriggerStrategy.CONSTANT, True)

			# 处理其他字段
			probability = data.get("probability", 100)
			useProbability = data.get("useProbability", False)
			group = data.get("group", None)
			use_regex = data.get("useRegex", False)

			# 处理 extensions 字段（如果存在）
			extensions = data.get("extensions", {})
			if extensions:
				probability = extensions.get("probability", probability)
				useProbability = extensions.get("useProbability", useProbability)
				group = extensions.get("group", group)

			# 创建条目对象
			entry = cls(
					uid=uid,
					key=key,  # 保留key字段用于兼容
					comment=comment,
					content=content,
					position=position,
					order=order,
					trigger_config=trigger_config,
					group=group,
					probability=probability,
					useProbability=useProbability,
					use_regex=use_regex
			)

			# 复制其他字段（如果存在）
			for key, value in data.items():
				if hasattr(entry, key) and key not in ["uid", "key", "comment", "content",
				                                       "constant", "position", "order", "probability",
				                                       "useProbability", "group", "use_regex",
				                                       "keysecondary", "selective", "selectiveLogic",
				                                       "matchWholeWords", "caseSensitive"]:
					setattr(entry, key, value)

			return entry
		except Exception as e:
			logger.error(f"从 SillyTavern 数据创建条目失败: {str(e)}")
			raise ValueError(f"从 SillyTavern 数据创建条目失败: {str(e)}")

	def to_sillytavern_dict(self) -> Dict[str, Any]:
		"""
		转换为 SillyTavern 格式的字典

		Returns:
			Dict[str, Any]: SillyTavern 格式的条目数据
		"""
		result = {
			"uid": self.uid,
			"key": self.key,
			"comment": self.comment,
			"content": self.content,
			"position": self.position,
			"order": self.order,
			"probability": self.probability,
			"useProbability": self.useProbability,
			"group": self.group,
			"useRegex": getattr(self, 'use_regex', False),
			"preventRecursion": self.preventRecursion,
			"excludeRecursion": self.excludeRecursion
		}

		# 根据触发策略设置对应的字段
		try:
			# 检查永久触发是否启用
			constant_enabled, _ = self.trigger_config.get_trigger(TriggerStrategy.CONSTANT)
			result["constant"] = constant_enabled

			# 检查关键词触发是否启用
			keyword_enabled, keyword_config = self.trigger_config.get_trigger(TriggerStrategy.KEYWORD)
			if keyword_enabled and keyword_config:
				result["selective"] = keyword_config.selective
				result["keysecondary"] = keyword_config.keysecondary
				result["selectiveLogic"] = keyword_config.selectiveLogic
				result["matchWholeWords"] = keyword_config.matchWholeWords
				result["caseSensitive"] = keyword_config.caseSensitive

			# 检查RAG触发是否启用
			rag_enabled, rag_config = self.trigger_config.get_trigger(TriggerStrategy.RAG)
			if rag_enabled and rag_config:
				result["rag_threshold"] = rag_config.threshold
				result["top_k"] = rag_config.top_k
				result["query_template"] = rag_config.query_template

			# 检查条件触发是否启用
			condition_enabled, condition_config = self.trigger_config.get_trigger(TriggerStrategy.CONDITION)
			if condition_enabled and condition_config:
				result["variable_a"] = condition_config.variable_a
				result["operator"] = condition_config.operator
				result["variable_b"] = condition_config.variable_b
		except Exception as e:
			# 如果触发配置导出失败，使用默认的永久触发配置
			logger.warning(f"条目 {self.uid} 的触发配置导出失败: {str(e)}，使用默认的永久触发配置")
			result["constant"] = True

		return result

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

			# 处理RAG触发
			if TriggerStrategy.RAG in enabled_triggers:
				_, rag_config = self.trigger_config.get_trigger(TriggerStrategy.RAG)
				if rag_config:
					params["threshold"] = rag_config.threshold
					params["top_k"] = rag_config.top_k
					params["query_template"] = rag_config.query_template
					params["vectorized"] = self.vectorized

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