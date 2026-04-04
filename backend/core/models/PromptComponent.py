from pydantic import BaseModel, Field


class PromptComponent(BaseModel):
	"""预设组件类，代表一个独立的提示词模块"""

	identifier: str = Field(..., description="唯一标识符，用于引用和定位组件")
	name: str = Field(..., description="组件显示名称")
	content: str = Field("", description="组件内容文本")
	# 0：System，1：User，2：Assistant
	role: int = Field(0, description="角色身份(0：System，1：User，2：Assistant)")
	system_prompt: bool = Field(False, description="是否强制作为系统提示词处理")
	marker: bool = Field(False, description="是否为动态插入点占位符")


