import json
import os
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, validator
from .WorldItem import WorldInfoEntry, TriggerStrategy, PositionMode


class WorldBook(BaseModel):
	"""
	世界书集合模型
	管理多个世界书条目，支持导入导出 SillyTavern 格式
	"""
	# 世界书基本信息
	uid: str = Field(..., description="世界书唯一标识符")
	name: str = Field(..., description="世界书名称")
	description: str = Field("", description="世界书描述")

	# 条目集合
	entries: List[WorldInfoEntry] = Field(
			default_factory=list,
			description="世界书条目列表"
	)

	# 全局配置
	enabled: bool = Field(True, description="是否启用")
	scan_depth: int = Field(4, description="默认扫描深度")
	rag_threshold: float = Field(0.75, description="默认RAG相似度阈值")

	@validator('entries')
	def validate_entries_unique_uid(cls, v):
		uids = [entry.uid for entry in v]
		if len(uids) != len(set(uids)):
			raise ValueError("条目 UID 必须唯一")
		return v

	def add_entry(self, entry: WorldInfoEntry) -> None:
		"""
		添加世界书条目

		Args:
			entry: 世界书条目对象
		"""
		if any(e.uid == entry.uid for e in self.entries):
			raise ValueError(f"条目 UID {entry.uid} 已存在")
		self.entries.append(entry)

	def remove_entry(self, uid: str) -> bool:
		"""
		移除世界书条目

		Args:
			uid: 条目 UID

		Returns:
			bool: 是否成功移除
		"""
		original_length = len(self.entries)
		self.entries = [e for e in self.entries if e.uid != uid]
		return len(self.entries) < original_length

	def get_entry(self, uid: str) -> Optional[WorldInfoEntry]:
		"""
		获取指定 UID 的世界书条目

		Args:
			uid: 条目 UID

		Returns:
			Optional[WorldInfoEntry]: 找到的条目，未找到返回 None
		"""
		for entry in self.entries:
			if entry.uid == uid:
				return entry
		return None

	def update_entry(self, uid: str, **kwargs) -> bool:
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
			return False

		for key, value in kwargs.items():
			if hasattr(entry, key):
				setattr(entry, key, value)
		return True

	def filter_by_position(self, position_mode: PositionMode, position_value: int) -> List[WorldInfoEntry]:
		"""
		根据位置筛选条目

		Args:
			position_mode: 位置模式
			position_value: 位置值

		Returns:
			List[WorldInfoEntry]: 筛选后的条目列表
		"""
		return [
			entry for entry in self.entries
			if entry.position_mode == position_mode and
			   (entry.position_anchor == position_value or
			    (position_mode == PositionMode.ABSOLUTE_DEPTH and entry.position_dx == position_value))
		]

	def get_summary(self) -> Dict[str, Any]:
		"""
		获取世界书概要信息

		Returns:
			Dict[str, Any]: 概要信息字典
		"""
		return {
			"uid": self.uid,
			"name": self.name,
			"description": self.description,
			"entry_count": len(self.entries),
			"enabled": self.enabled,
			"scan_depth": self.scan_depth,
			"rag_threshold": self.rag_threshold,
			"trigger_strategies": {
				strategy.value: sum(1 for e in self.entries if e.trigger_strategy == strategy)
				for strategy in TriggerStrategy
			}
		}

	def to_summary_dict(self) -> Dict[str, Any]:
		"""
		生成世界书摘要信息，用于列表显示

		Returns:
			Dict[str, Any]: 包含基本信息的字典
		"""
		return {
			"uid": self.uid,
			"name": self.name,
			"description": self.description,
			"entry_count": len(self.entries),
			"enabled": self.enabled
		}

	@classmethod
	def from_dict(cls, data: Dict) -> 'WorldBook':
		"""
		从字典创建 WorldBook 对象，支持多种数据格式

		Args:
			data: 包含世界书数据的字典

		Returns:
			WorldBook: 世界书对象

		Raises:
			ValueError: 数据格式无效
		"""
		# 处理包含 originalData 的格式
		if 'originalData' in data:
			original_data = data['originalData']
			return cls(
					uid=data.get('uid') or original_data.get('name', 'unknown'),
					name=original_data.get('name', 'Unknown'),
					description=original_data.get('description', ''),
					enabled=data.get('enabled', True),
					entries=[WorldInfoEntry(**entry) for entry in data.get('entries', {}).values()]
			)

		# 处理标准格式
		return cls(**data)

	def to_dict(self) -> Dict:
		"""
		将 WorldBook 转换为字典，兼容多种格式

		Returns:
			Dict: 世界书数据字典
		"""
		return {
			'uid': self.uid,
			'name': self.name,
			'description': self.description,
			'enabled': self.enabled,
			'entries': {entry.uid: entry.dict() for entry in self.entries}
		}

	@classmethod
	def from_sillytavern_json(cls, file_path: str) -> 'WorldBook':
		"""
		从 SillyTavern 格式的 JSON 文件加载世界书

		Args:
			file_path: JSON 文件路径

		Returns:
			WorldBook: 世界书对象

		Raises:
			FileNotFoundError: 文件不存在
			ValueError: 格式不符合 SillyTavern 标准
			json.JSONDecodeError: JSON 解析错误
		"""
		if not os.path.exists(file_path):
			raise FileNotFoundError(f"世界书文件未找到: {file_path}")

		with open(file_path, 'r', encoding='utf-8') as f:
			raw_data = json.load(f)

		# 创建世界书对象
		world_name = raw_data.get("name", "")
		if not world_name:
			# 如果 name 字段不存在或为空，从文件名中提取
			file_name = os.path.splitext(os.path.basename(file_path))[0]
			world_name = file_name

		# 检查是否有 originalData 字段
		if "originalData" in raw_data:
			# 使用 originalData 格式
			original_data = raw_data["originalData"]
			world_book = cls(
					uid=f"st_{os.path.basename(file_path)}_{int(os.path.getmtime(file_path))}",
					name=world_name,
					description=f"从 SillyTavern 导入: {file_path}"
			)

			# 转换 originalData 中的条目
			for entry_data in original_data.get("entries", []):
				try:
					world_entry = WorldInfoEntry(
							uid=str(entry_data.get("id", "")),
							key=entry_data.get("keys", []),
							keysecondary=entry_data.get("secondary_keys", []),
							comment=entry_data.get("comment", ""),
							content=entry_data.get("content", ""),
							trigger_strategy=TriggerStrategy.KEYWORD,
							position_mode=PositionMode.ANCHOR if entry_data.get(
								"position") == "after_char" else PositionMode.ABSOLUTE_DEPTH,
							position_anchor=0,
							position_dx=None,
							constant=entry_data.get("constant", False),
							selective=entry_data.get("selective", True),
							order=entry_data.get("insertion_order", 100),
							probability=entry_data.get("extensions", {}).get("probability", 100),
							useProbability=entry_data.get("extensions", {}).get("useProbability", False),
							group=entry_data.get("extensions", {}).get("group", None),
							match_whole_words=entry_data.get("use_regex", False),
							use_regex=entry_data.get("use_regex", False),
							vectorized=False
					)
					world_book.add_entry(world_entry)
				except Exception as e:
					print(f"警告: 跳过条目，解析失败: {e}")
		else:
			# 使用标准 SillyTavern 格式
			entries_dict = raw_data.get("entries", {})
			if not isinstance(entries_dict, dict):
				raise ValueError("无效的世界书格式：'entries' 字段必须是一个字典。")

			if not any(key.isdigit() for key in entries_dict.keys()):
				raise ValueError("无效的世界书格式：'entries' 中未找到条目。请确认是 SillyTavern 导出的格式。")

			world_book = cls(
					uid=f"st_{os.path.basename(file_path)}_{int(os.path.getmtime(file_path))}",
					name=world_name,
					description=f"从 SillyTavern 导入: {file_path}"
			)

			# 转换标准格式的条目
			for uid, entry_data in entries_dict.items():
				try:
					position = entry_data.get("position", 0)
					position_mode = PositionMode.ANCHOR if position < 6 else PositionMode.ABSOLUTE_DEPTH

					world_entry = WorldInfoEntry(
							uid=uid,
							key=entry_data.get("key", []),
							keysecondary=entry_data.get("keysecondary", []),
							comment=entry_data.get("comment", ""),
							content=entry_data.get("content", ""),
							trigger_strategy=TriggerStrategy.KEYWORD,
							position_mode=position_mode,
							position_anchor=position if position < 6 else 0,
							position_dx=position if position >= 6 else None,
							constant=entry_data.get("constant", False),
							selective=entry_data.get("selective", True),
							order=entry_data.get("order", 100),
							probability=entry_data.get("probability", 100),
							useProbability=entry_data.get("useProbability", False),
							group=entry_data.get("group", None),
							match_whole_words=entry_data.get("matchWholeWords", False),
							use_regex=entry_data.get("useRegex", False),
							vectorized=False
					)
					world_book.add_entry(world_entry)
				except Exception as e:
					print(f"警告: 跳过条目 {uid}，解析失败: {e}")

		return world_book

	def to_sillytavern_json(self, file_path: str) -> None:
		"""
		导出为 SillyTavern 格式的 JSON 文件

		Args:
			file_path: 要保存的文件路径
		"""
		entries_dict = {}

		for entry in self.entries:
			# 映射 WorldInfoEntry 到 SillyTavern 格式
			position = entry.position_anchor if entry.position_mode == PositionMode.ANCHOR else entry.position_dx

			entries_dict[entry.uid] = {
				"uid": entry.uid,
				"key": entry.key,
				"keysecondary": entry.keysecondary,
				"comment": entry.comment,
				"content": entry.content,
				"constant": entry.constant,
				"selective": entry.selective,
				"position": position,
				"order": entry.order,
				"probability": entry.probability,
				"useProbability": entry.useProbability,
				"group": entry.group,
				"matchWholeWords": entry.match_whole_words,
				"useRegex": entry.use_regex,
				"preventRecursion": True,
				"excludeRecursion": True
			}

		output_data = {
			"entries": entries_dict,
			"name": self.name
		}

		with open(file_path, 'w', encoding='utf-8') as f:
			json.dump(output_data, f, ensure_ascii=False, indent=2)

	def list_triggers_and_content(self) -> List[Dict[str, Any]]:
		"""
		提取所有条目的触发关键词和内容，用于快速构建向量数据库或索引

		Returns:
			List[Dict[str, Any]]: 包含 trigger (key) 和 content 的列表
		"""
		result = []
		for entry in self.entries:
			result.append({
				"uid": entry.uid,
				"comment": entry.comment,
				"triggers": entry.key,
				"content": entry.content,
				"position": entry.position_anchor if entry.position_mode == PositionMode.ANCHOR else entry.position_dx,
				"constant": entry.constant,
				"trigger_strategy": entry.trigger_strategy.value
			})
		return result


# --- 使用示例 ---
if __name__ == "__main__":
	try:
		# 从 SillyTavern 格式导入
		world_book = WorldBook.from_sillytavern_json('entries.json')

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

		# 导出为 SillyTavern 格式
		world_book.to_sillytavern_json('exported_world.json')
		print("\n✅ 世界书已导出为 exported_world.json")

	except Exception as e:
		print(f"❌ 错误: {e}")
