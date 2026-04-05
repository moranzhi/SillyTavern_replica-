from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, validator


class TriggerStrategy(str, Enum):
	"""
	触发策略枚举
	"""
	ALL = "all"  # 全部触发
	KEYWORD = "keyword"  # 传统关键词匹配
	RAG = "rag"  # 向量检索触发
	CONDITION = "condition"  # 逻辑条件触发


class PositionMode(str, Enum):
	"""
	位置模式枚举
	"""
	ANCHOR = "anchor"  # 锚点模式 (0-5)
	ABSOLUTE_DEPTH = "dx"  # 绝对深度模式 (Dx)


class WorldInfoEntry(BaseModel):
	"""
	世界书条目模型 v2.0
	支持 RAG、条件触发及 Dx 绝对位置
	兼容 SillyTavern 格式
	"""
	# --- 核心身份 ---
	uid: str
	key: List[str] = []
	keysecondary: List[str] = []
	comment: str = ""
	content: str

	# --- 策略配置 ---
	trigger_strategy: TriggerStrategy = TriggerStrategy.KEYWORD
	condition_expr: Optional[str] = None  # 条件表达式
	rag_threshold: float = 0.75  # RAG 相似度阈值

	# --- 位置与扫描 ---
	position_mode: PositionMode = PositionMode.ANCHOR
	position_anchor: int = 0  # 锚点值 (0-5)
	position_dx: Optional[int] = None  # 绝对深度值
	scan_depth: int = 4  # 向前扫描 N 条消息

	# --- 其他配置 ---
	constant: bool = False
	selective: bool = True
	order: int = 100
	probability: int = 100
	useProbability: bool = False

	# 高级过滤
	group: Optional[str] = None
	match_whole_words: bool = False
	use_regex: bool = False
	vectorized: bool = False  # 是否已生成向量 embedding

	# SillyTavern 特定字段
	enabled: bool = True
	position: str = "after_char"  # SillyTavern 位置字符串
	insertion_order: int = 100  # SillyTavern 插入顺序

	@validator('position_dx')
	def validate_dx(cls, v, values):
		if values.get('position_mode') == PositionMode.ABSOLUTE_DEPTH and v is None:
			raise ValueError("当 position_mode 为 ABSOLUTE_DEPTH 时，必须指定 position_dx")
		return v
