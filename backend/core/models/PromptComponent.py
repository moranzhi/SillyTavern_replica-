from pydantic import BaseModel, Field, validator
from typing import Dict, Any


class PromptComponent(BaseModel):
	"""预设组件类，代表一个独立的提示词模块"""

	identifier: str = Field(..., description="唯一标识符，用于引用和定位组件")
	name: str = Field(..., description="组件显示名称")
	content: str = Field("", description="组件内容文本")
	# 0：System，1：User，2：Assistant
	role: int = Field(0, description="角色身份(0：System，1：User，2：Assistant)")
	system_prompt: bool = Field(False, description="是否强制作为系统提示词处理")
	marker: bool = Field(False, description="是否为动态插入点占位符")

	@validator('role')
	def validate_role(cls, v):
		"""验证角色值是否在有效范围内"""
		if v not in [0, 1, 2]:
			raise ValueError("角色值必须是0(System)、1(User)或2(Assistant)")
		return v

	def update(self, **kwargs) -> None:
		"""
		更新组件属性

		参数:
			**kwargs: 要更新的字段和值

		异常:
			ValueError: 当尝试更新identifier时抛出
		"""
		if 'identifier' in kwargs:
			raise ValueError("组件标识符不可修改")

		for key, value in kwargs.items():
			if hasattr(self, key):
				setattr(self, key, value)

	def to_dict(self) -> Dict[str, Any]:
		"""
		将组件转换为字典

		返回:
			Dict[str, Any]: 组件的字典表示
		"""
		return self.dict()

	@classmethod
	def from_dict(cls, data: Dict[str, Any]) -> 'PromptComponent':
		"""
		从字典创建组件实例

		参数:
			data: 包含组件数据的字典

		返回:
			PromptComponent: 组件实例
		"""
		return cls(**data)
