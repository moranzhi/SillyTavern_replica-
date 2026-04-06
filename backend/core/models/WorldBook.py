import json
import os
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path
from pydantic import BaseModel, Field, field_validator
from .WorldItem import WorldItem, TriggerStrategy
from backend.core.config import settings

# 配置日志
logger = logging.getLogger(__name__)


class WorldBook(BaseModel):
	"""
	世界书集合模型
	管理多个世界书条目，支持导入导出 SillyTavern 格式
	"""
	# 世界书基本信息
	name: str = Field(..., description="世界书名称")

	# 条目集合
	entries: Dict[str, WorldItem.Entry] = Field(
			default_factory=dict,
			description="世界书条目字典对象 (Key-Value Map)"
	)

	@field_validator('entries')
	@classmethod
	def validate_entries_unique_uid(cls, v):
		"""验证条目 UID 的唯一性"""
		uids = [entry.uid for entry in v.values()]
		if len(uids) != len(set(uids)):
			logger.error("验证失败: 条目 UID 必须唯一")
			raise ValueError("条目 UID 必须唯一")
		return v

	@classmethod
	def get_file_path(cls, name: str) -> str:
		"""
		根据世界书名称获取文件路径

		Args:
			name: 世界书名称

		Returns:
			str: 完整的文件路径
		"""
		# 使用配置中的 WORLDBOOKS_PATH
		return str(settings.WORLDBOOKS_PATH / f"{name}.json")

	@classmethod
	def exists(cls, name: str) -> bool:
		"""
		检查指定名称的世界书文件是否存在

		Args:
			name: 世界书名称

		Returns:
			bool: 文件是否存在
		"""
		file_path = cls.get_file_path(name)
		return os.path.exists(file_path)

	@classmethod
	def create_empty(cls, name: str) -> 'WorldBook':
		"""
		创建并保存一个空白的世界书

		Args:
			name: 世界书名称
		Returns:
			WorldBook: 创建的世界书对象

		Raises:
			ValueError: 世界书已存在
			IOError: 文件写入失败
		"""
		# 检查世界书是否已存在
		if cls.exists(name):
			raise ValueError(f"世界书 '{name}' 已存在")

		# 创建空白世界书对象
		world_book = cls(
				name=name,
		)

		# 保存世界书
		world_book.save()

		logger.info(f"创建空白世界书: {name}")
		return world_book

	def add_entry(self, entry: WorldItem.Entry) -> None:
		"""
		添加世界书条目

		Args:
			entry: 世界书条目对象

		Raises:
			ValueError: 条目 UID 已存在
		"""
		entry_key = str(entry.uid)
		if entry_key in self.entries:
			error_msg = f"添加条目失败: 条目 UID {entry.uid} 已存在于世界书 {self.name}"
			logger.error(error_msg)
			raise ValueError(error_msg)
		self.entries[entry_key] = entry
		logger.debug(f"已添加条目: UID={entry.uid}, 世界书={self.name}")

	def remove_entry(self, uid: int) -> bool:
		"""
		移除世界书条目

		Args:
			uid: 条目 UID

		Returns:
			bool: 是否成功移除
		"""
		entry_key = str(uid)
		if entry_key in self.entries:
			del self.entries[entry_key]
			logger.info(f"已从世界书 {self.name} 移除条目: UID={uid}")
			return True
		logger.warning(f"尝试移除不存在的条目: 世界书 {self.name} 中未找到 UID={uid}")
		return False

	def get_entry(self, uid: int) -> Optional[WorldItem.Entry]:
		"""
		获取指定 UID 的世界书条目

		Args:
			uid: 条目 UID

		Returns:
			Optional[WorldItem.Entry]: 找到的条目，未找到返回 None
		"""
		entry_key = str(uid)
		entry = self.entries.get(entry_key)
		if entry:
			logger.debug(f"从世界书 {self.name} 获取条目: UID={uid}")
		else:
			logger.debug(f"在世界书 {self.name} 中未找到条目: UID={uid}")
		return entry

	def update_entry(self, uid: int, **kwargs) -> bool:
		"""
		更新世界书条目

		Args:
			uid: 条目 UID
			**kwargs: 要更新的字段

		Returns:
			bool: 是否成功更新
		"""
		entry = self.get_entry(uid)
		if entry is None:
			logger.warning(f"更新条目失败: 在世界书 {self.name} 中未找到 UID={uid}")
			return False

		for key, value in kwargs.items():
			if hasattr(entry, key):
				setattr(entry, key, value)
		logger.info(f"已更新世界书 {self.name} 中的条目: UID={uid}, 更新字段={list(kwargs.keys())}")
		return True

	def filter_by_position(self, position: int) -> List[WorldItem.Entry]:
		"""
		根据位置筛选条目

		Args:
			position: 位置值

		Returns:
			List[WorldItem.Entry]: 筛选后的条目列表
		"""
		filtered_entries = [
			entry for entry in self.entries.values()
			if entry.position == position
		]
		logger.debug(
				f"在世界书 {self.name} 中按位置筛选: 值={position}, 结果数量={len(filtered_entries)}")
		return filtered_entries

	def get_summary(self) -> Dict[str, Any]:
		"""
		获取世界书概要信息

		Returns:
			Dict[str, Any]: 概要信息字典
		"""
		summary = {
			"name": self.name,
			"entry_count": len(self.entries),
			"trigger_strategies": {
				strategy.value: sum(1 for e in self.entries.values()
				                    if strategy in e.trigger_config.get_enabled_triggers())
				for strategy in TriggerStrategy
			}
		}
		logger.debug(f"获取世界书 {self.name} 的概要信息")
		return summary

	def to_summary_dict(self) -> Dict[str, Any]:
		"""
		生成世界书摘要信息，用于列表显示

		Returns:
			Dict[str, Any]: 包含基本信息的字典
		"""
		summary = {
			"name": self.name,
			"entry_count": len(self.entries),
		}
		logger.debug(f"生成世界书 {self.name} 的摘要信息")
		return summary

	def to_dict(self) -> Dict:
		"""
		将 WorldBook 转换为字典

		Returns:
			Dict: 世界书数据字典
		"""
		result = {
			'name': self.name,
			'entries': {uid: entry.model_dump() for uid, entry in self.entries.items()}
		}
		logger.debug(f"将世界书 {self.name} 转换为字典")
		return result

	@classmethod
	def load(cls, name: str) -> 'WorldBook':
		"""
		从文件加载世界书（只有 entries 字段的格式）

		Args:
			name: 世界书名称

		Returns:
			WorldBook: 世界书对象

		Raises:
			FileNotFoundError: 文件不存在
			ValueError: 格式不符合标准
			json.JSONDecodeError: JSON 解析错误
		"""
		file_path = cls.get_file_path(name)
		if not os.path.exists(file_path):
			error_msg = f"世界书文件未找到: {file_path}"
			logger.error(error_msg)
			raise FileNotFoundError(error_msg)

		try:
			with open(file_path, 'r', encoding='utf-8') as f:
				raw_data = json.load(f)

			# 世界书名称始终使用文件名（不包括后缀名）
			world_name = name

			# 直接使用 entries 字段
			entries_dict = raw_data.get("entries", {})
			if not isinstance(entries_dict, dict):
				error_msg = "无效的世界书格式：'entries' 字段必须是一个字典。"
				logger.error(error_msg)
				raise ValueError(error_msg)

			# 创建世界书对象
			world_book = cls(
					name=world_name,
			)

			# 转换标准格式的条目
			for uid, entry_data in entries_dict.items():
				try:
					# 先使用 WorldItem 解析数据
					world_item = WorldItem.from_sillytavern_data(entry_data)
					# 然后转换为 Entry
					world_entry = world_item.to_entry()
					world_book.add_entry(world_entry)
				except Exception as e:
					logger.warning(f"跳过条目 {uid}，解析失败: {e}")

			logger.info(
					f"从文件加载世界书: 文件={file_path}, 名称={world_name}, 条目数={len(world_book.entries)}")

			return world_book
		except json.JSONDecodeError as e:
			error_msg = f"JSON 解析错误: {str(e)}"
			logger.error(error_msg)
			raise ValueError(error_msg)
		except Exception as e:
			error_msg = f"从文件加载世界书失败: {str(e)}"
			logger.error(error_msg)
			raise ValueError(error_msg)

	def save(self) -> None:
		"""
		保存世界书到文件（只有 entries 字段的格式）
		如果文件不存在，会创建新文件；如果文件存在，会更新现有文件

		Raises:
			IOError: 文件写入失败
		"""
		file_path = self.get_file_path(self.name)

		# 确保目录存在
		os.makedirs(Path(file_path).parent, exist_ok=True)

		try:
			# 转换为标准格式
			entries_dict = {}
			for uid, entry in self.entries.items():
				entries_dict[uid] = entry.to_sillytavern_dict()

			output_data = {
				"entries": entries_dict
			}

			with open(file_path, 'w', encoding='utf-8') as f:
				json.dump(output_data, f, ensure_ascii=False, indent=2)

			logger.info(
					f"世界书已保存: 文件={file_path}, 名称={self.name}, 条目数={len(self.entries)}")
		except Exception as e:
			error_msg = f"保存世界书失败: {str(e)}"
			logger.error(error_msg)
			raise IOError(error_msg)

	def list_triggers_and_content(self) -> List[Dict[str, Any]]:
		"""
		提取所有条目的触发关键词和内容，用于快速构建向量数据库或索引

		Returns:
			List[Dict[str, Any]]: 包含 trigger (key) 和 content 的列表
		"""
		result = []
		for entry in self.entries.values():
			entry_dict = entry.to_dict()
			# 添加额外的触发相关信息
			enabled_triggers = entry.trigger_config.get_enabled_triggers()
			keyword_enabled, keyword_config = entry.trigger_config.get_trigger(TriggerStrategy.KEYWORD)
			constant_enabled, _ = entry.trigger_config.get_trigger(TriggerStrategy.CONSTANT)

			entry_dict.update({
				"triggers": keyword_config.key if keyword_enabled and keyword_config else [],
				"constant": constant_enabled,
				"trigger_strategies": [strategy.value for strategy in enabled_triggers]
			})
			result.append(entry_dict)

		logger.debug(f"列出世界书 {self.name} 的触发词和内容: 条目数={len(result)}")
		return result

	def get_all_entries(self) -> List[Dict[str, Any]]:
		"""
		获取所有条目的核心信息（包括已禁用的条目）

		Returns:
			List[Dict[str, Any]]: 包含核心信息的条目列表
		"""
		result = [entry.to_dict() for entry in self.entries.values()]
		logger.debug(f"获取世界书 {self.name} 的所有条目: 条目数={len(result)}")
		return result

	def merge_from_book(self, other_book: 'WorldBook') -> None:
		"""
		从另一个世界书合并条目

		Args:
			other_book: 要合并的世界书对象
		"""
		for uid, entry in other_book.entries.items():
			if uid in self.entries:
				# 更新现有条目
				for key, value in entry.dict().items():
					if key != 'uid':  # 不更新 UID
						setattr(self.entries[uid], key, value)
			else:
				# 添加新条目
				self.add_entry(entry)
		logger.info(f"合并世界书: 从 {other_book.name} 合并到 {self.name}")

	def to_sillytavern_json(self, file_path: str) -> None:
		"""
		导出为 SillyTavern 格式的 JSON 文件

		Args:
			file_path: 导出文件路径
		"""
		# 转换为 SillyTavern 格式
		entries_dict = {}
		for uid, entry in self.entries.items():
			entries_dict[uid] = entry.to_sillytavern_dict()

		output_data = {
			"entries": entries_dict,
			"name": self.name
		}

		with open(file_path, 'w', encoding='utf-8') as f:
			json.dump(output_data, f, ensure_ascii=False, indent=2)

		logger.info(f"导出世界书为 SillyTavern 格式: 文件={file_path}")


# --- 使用示例 ---
if __name__ == "__main__":
	try:
		# 创建空白世界书
		world_book = WorldBook.create_empty("test_worldbook")

		# 加载世界书
		world_book = WorldBook.load("test_worldbook")

		# 打印概要
		summary = world_book.get_summary()
		print(f"世界书名称: {summary['name']}")
		print(f"条目数量: {summary['entry_count']}")
		print(f"触发策略分布: {summary['trigger_strategies']}")

		# 列出所有条目的触发词和内容预览
		print("\n--- 条目预览 ---")
		for item in world_book.list_triggers_and_content():
			triggers = item['triggers'] if item['triggers'] else ['(无关键词 - 常驻)']
			content_preview = item['content'][:50].replace('\n', ' ') + "..."
			print(f"[{item['position']}] TRIGGERS: {triggers} -> CONTENT: {content_preview}")

		# 保存世界书
		world_book.save()
		print(f"\n✅ 世界书已保存")

	except Exception as e:
		print(f"❌ 错误: {e}")
