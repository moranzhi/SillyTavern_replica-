"""
数据模型转换器

提供 SillyTavern 格式与内部格式之间的双向转换功能。
所有导入/导出操作都应该通过转换器进行,确保数据格式的一致性。
"""
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

from models.internal import (
    WorldInfo,
    WorldInfoEntry,
    ActivationType,
)


class WorldBookConverter:
    """世界书数据转换器
    
    负责 SillyTavern 格式和项目内部格式之间的转换。
    
    SillyTavern 格式特点:
    - entries 是 dict (key 为 uid)
    - 使用 constant 字段表示常驻激活
    - position 是字符串 (如 "after_char")
    
    项目内部格式特点:
    - entries 是 list
    - 使用 activationType 枚举
    - position 是数字 (0-5)
    - 包含 trigger_config 结构(前端需要)
    """
    
    @staticmethod
    def detect_format(data: Dict[str, Any]) -> str:
        """
        智能检测世界书数据格式
        
        Args:
            data: 世界书数据
            
        Returns:
            'sillytavern' | 'internal' | 'unknown'
        """
        # 检查 entries 类型
        entries = data.get("entries")
        if not entries:
            return "unknown"
        
        # SillyTavern 特征: entries 是 dict
        if isinstance(entries, dict):
            return "sillytavern"
        
        # 内部格式特征: entries 是 list
        if isinstance(entries, list):
            # 进一步检查是否有 trigger_config
            if len(entries) > 0 and isinstance(entries[0], dict):
                first_entry = entries[0]
                if "trigger_config" in first_entry:
                    return "internal"
                # 也可能是简化的内部格式
                if "activationType" in first_entry or "position" in first_entry:
                    return "internal"
        
        return "unknown"
    
    # 位置映射: SillyTavern 字符串 -> 内部数字
    POSITION_MAP_ST_TO_INTERNAL = {
        "after_char": 0,
        "before_char": 1,
        "before_example": 2,
        "after_example": 3,
        "author_note": 4,
        "system_prompt": 5,
    }
    
    # 位置映射: 内部数字 -> SillyTavern 字符串
    POSITION_MAP_INTERNAL_TO_ST = {
        0: "after_char",
        1: "before_char",
        2: "before_example",
        3: "after_example",
        4: "author_note",
        5: "system_prompt",
    }
    
    @staticmethod
    def st_to_internal(st_data: Dict[str, Any], name: str = None) -> Dict[str, Any]:
        """
        将 SillyTavern 格式的世界书转换为内部格式
        
        Args:
            st_data: SillyTavern 格式的世界书数据
            name: 世界书名称(可选,优先使用 st_data 中的 name)
            
        Returns:
            内部格式的世界书字典(包含 trigger_config)
        """
        now = int(datetime.now().timestamp())
        
        # 转换条目
        entries = []
        st_entries = st_data.get("entries", {})
        
        # SillyTavern 的 entries 可能是 dict 或 list
        if isinstance(st_entries, dict):
            entries_list = list(st_entries.values())
        elif isinstance(st_entries, list):
            entries_list = st_entries
        else:
            entries_list = []
        
        for st_entry in entries_list:
            if not isinstance(st_entry, dict):
                continue
            
            # 判断激活类型
            is_constant = st_entry.get("constant", False)
            activation_type = ActivationType.PERMANENT if is_constant else ActivationType.KEYWORD
            
            # 转换位置
            st_position = st_entry.get("position", "after_char")
            internal_position = WorldBookConverter.POSITION_MAP_ST_TO_INTERNAL.get(st_position, 0)
            
            # 构建 trigger_config (前端期望的格式)
            trigger_config = WorldBookConverter._build_trigger_config(
                is_constant=is_constant,
                key=st_entry.get("key", []),
                keysecondary=st_entry.get("keysecondary", []),
                selective=st_entry.get("selective", True)
            )
            
            # 创建内部格式的条目
            entry_dict = {
                "uid": st_entry.get("uid", str(uuid.uuid4())),
                "key": st_entry.get("key", []),
                "keysecondary": st_entry.get("keysecondary", []),
                "content": st_entry.get("content", ""),
                "comment": st_entry.get("comment", ""),
                "activationType": activation_type.value,
                "trigger_config": trigger_config,
                "order": st_entry.get("order", 100),
                "position": internal_position,
                "depth": st_entry.get("depth", 4),
                "role": st_entry.get("role", 0),
                "probability": st_entry.get("probability", 100),
                "group": st_entry.get("group", []),
                "disable": st_entry.get("disable", False),
                "createdAt": now,
                "updatedAt": now
            }
            
            entries.append(entry_dict)
        
        # 创建内部格式的世界书
        worldbook_data = {
            "id": str(uuid.uuid4()),
            "name": name or st_data.get("name", "Unnamed"),
            "description": st_data.get("description", ""),
            "entries": entries,
            "createdAt": now,
            "updatedAt": now,
            "version": 1
        }
        
        return worldbook_data
    
    @staticmethod
    def internal_to_st(worldbook_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        将内部格式的世界书转换为 SillyTavern 格式
        
        Args:
            worldbook_data: 内部格式的世界书字典
            
        Returns:
            SillyTavern 格式的世界书数据
        """
        # 转换条目
        st_entries = {}
        
        for entry_data in worldbook_data.get("entries", []):
            if not isinstance(entry_data, dict):
                continue
            
            uid = entry_data.get("uid", str(uuid.uuid4()))
            
            # 从 trigger_config 或 activationType 判断是否常驻
            is_constant = WorldBookConverter._is_constant_entry(entry_data)
            
            # 提取关键词
            key, keysecondary = WorldBookConverter._extract_keywords(entry_data)
            
            # 转换位置
            internal_position = entry_data.get("position", 0)
            st_position = WorldBookConverter.POSITION_MAP_INTERNAL_TO_ST.get(internal_position, "after_char")
            
            # 创建 SillyTavern 格式的条目
            st_entry = {
                "uid": uid,
                "key": key,
                "keysecondary": keysecondary,
                "content": entry_data.get("content", ""),
                "comment": entry_data.get("comment", ""),
                "constant": is_constant,
                "selective": not is_constant,
                "order": entry_data.get("order", 100),
                "position": st_position,
                "depth": entry_data.get("depth", 4),
                "probability": entry_data.get("probability", 100),
                "group": entry_data.get("group", []),
                "disable": entry_data.get("disable", False)
            }
            
            st_entries[uid] = st_entry
        
        # 创建 SillyTavern 格式的世界书
        st_data = {
            "name": worldbook_data.get("name", ""),
            "description": worldbook_data.get("description", ""),
            "entries": st_entries
        }
        
        return st_data
    
    @staticmethod
    def normalize_entry(entry_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        规范化条目数据,确保包含所有必需字段和 trigger_config
        
        Args:
            entry_data: 条目数据(可能来自不同来源)
            
        Returns:
            规范化后的条目数据
        """
        now = int(datetime.now().timestamp())
        
        # 如果已经有 trigger_config,直接返回
        if "trigger_config" in entry_data and entry_data["trigger_config"]:
            return entry_data
        
        # 否则从其他字段构建 trigger_config
        is_constant = WorldBookConverter._is_constant_entry(entry_data)
        key, keysecondary = WorldBookConverter._extract_keywords(entry_data)
        
        trigger_config = WorldBookConverter._build_trigger_config(
            is_constant=is_constant,
            key=key,
            keysecondary=keysecondary,
            selective=entry_data.get("selective", True)
        )
        
        # 添加缺失的字段
        normalized = {
            "uid": entry_data.get("uid", str(uuid.uuid4())),
            "key": key,
            "keysecondary": keysecondary,
            "content": entry_data.get("content", ""),
            "comment": entry_data.get("comment", ""),
            "activationType": entry_data.get("activationType", 
                                            ActivationType.PERMANENT.value if is_constant 
                                            else ActivationType.KEYWORD.value),
            "trigger_config": trigger_config,
            "order": entry_data.get("order", 100),
            "position": entry_data.get("position", 0),
            "depth": entry_data.get("depth", 4),
            "role": entry_data.get("role", 0),
            "probability": entry_data.get("probability", 100),
            "group": entry_data.get("group", []),
            "disable": entry_data.get("disable", False),
            "createdAt": entry_data.get("createdAt", now),
            "updatedAt": entry_data.get("updatedAt", now)
        }
        
        return normalized
    
    @staticmethod
    def _build_trigger_config(
        is_constant: bool,
        key: List[str],
        keysecondary: List[str],
        selective: bool = True
    ) -> Dict[str, Any]:
        """
        构建 trigger_config 结构
        
        Args:
            is_constant: 是否常驻激活
            key: 主关键词列表
            keysecondary: 次要关键词列表
            selective: 是否选择性匹配
            
        Returns:
            trigger_config 字典
        """
        return {
            "triggers": {
                "constant": [is_constant, None],
                "keyword": [
                    not is_constant,
                    {
                        "key": key,
                        "keysecondary": keysecondary,
                        "selective": selective,
                        "selectiveLogic": 0,
                        "matchWholeWords": False,
                        "caseSensitive": False
                    }
                ],
                "rag": [False, {
                    "threshold": 0.75,
                    "top_k": 5,
                    "query_template": None
                }],
                "condition": [False, {
                    "variable_a": "",
                    "operator": "=",
                    "variable_b": ""
                }]
            }
        }
    
    @staticmethod
    def _is_constant_entry(entry_data: Dict[str, Any]) -> bool:
        """
        判断条目是否为常驻激活
        
        Args:
            entry_data: 条目数据
            
        Returns:
            是否常驻激活
        """
        # 优先从 trigger_config 判断
        if "trigger_config" in entry_data and entry_data["trigger_config"]:
            try:
                return entry_data["trigger_config"]["triggers"]["constant"][0]
            except (KeyError, IndexError, TypeError):
                pass
        
        # 其次从 activationType 判断
        if "activationType" in entry_data:
            return entry_data["activationType"] == ActivationType.PERMANENT.value
        
        # 最后从 constant 字段判断
        if "constant" in entry_data:
            return entry_data["constant"]
        
        return False
    
    @staticmethod
    def _extract_keywords(entry_data: Dict[str, Any]) -> tuple:
        """
        从条目数据中提取关键词
        
        Args:
            entry_data: 条目数据
            
        Returns:
            (key, keysecondary) 元组
        """
        # 优先从 trigger_config 提取
        if "trigger_config" in entry_data and entry_data["trigger_config"]:
            try:
                keyword_config = entry_data["trigger_config"]["triggers"]["keyword"][1]
                if keyword_config:
                    key = keyword_config.get("key", [])
                    keysecondary = keyword_config.get("keysecondary", [])
                    return key, keysecondary
            except (KeyError, IndexError, TypeError):
                pass
        
        # 否则从顶层字段提取
        key = entry_data.get("key", [])
        keysecondary = entry_data.get("keysecondary", [])
        
        return key, keysecondary
