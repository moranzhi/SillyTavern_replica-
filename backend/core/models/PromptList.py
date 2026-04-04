from pydantic import BaseModel, Field
import PromptComponent
from typing import List, Dict, Any


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
	openai_max_context: int = Field(2048, description="上下文窗口大小(Token上限)")
	openai_max_tokens: int = Field(250, description="单次回复的最大长度")
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
	stream_openai: bool = Field(True, description="是否使用流式输出")
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
