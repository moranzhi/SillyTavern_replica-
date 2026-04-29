"""
World Book Service
世界书服务层 - 处理世界书及条目的 CRUD 操作
"""
import json
import os
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

from models.internal import WorldInfo, WorldInfoEntry, ActivationType
from models.converters import WorldBookConverter
from core.config import settings


class WorldBookService:
    """世界书服务类"""
    
    @staticmethod
    def _get_worldbook_path(name: str) -> Path:
        """获取世界书文件路径"""
        return settings.WORLDBOOKS_PATH / f"{name}.json"
    
    @staticmethod
    def _load_worldbook(name: str) -> Optional[Dict[str, Any]]:
        """加载世界书 JSON 文件"""
        path = WorldBookService._get_worldbook_path(name)
        if not path.exists():
            return None
        
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            raise ValueError(f"Failed to load worldbook '{name}': {str(e)}")
    
    @staticmethod
    def _save_worldbook(name: str, data: Dict[str, Any]):
        """保存世界书到 JSON 文件"""
        path = WorldBookService._get_worldbook_path(name)
        try:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            raise ValueError(f"Failed to save worldbook '{name}': {str(e)}")
    
    @staticmethod
    def list_worldbooks() -> List[Dict[str, Any]]:
        """
        获取所有世界书的列表（仅基本信息）
        
        Returns:
            世界书列表，每个包含 name, description, entries_count 等
        """
        worldbooks = []
        
        for json_file in settings.WORLDBOOKS_PATH.glob("*.json"):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                worldbooks.append({
                    "name": data.get("name", json_file.stem),
                    "description": data.get("description", ""),
                    "entries_count": len(data.get("entries", [])),
                    "createdAt": data.get("createdAt", 0),
                    "updatedAt": data.get("updatedAt", 0)
                })
            except Exception as e:
                print(f"Error loading worldbook {json_file.name}: {e}")
                continue
        
        # 按更新时间排序
        worldbooks.sort(key=lambda x: x.get("updatedAt", 0), reverse=True)
        return worldbooks
    
    @staticmethod
    def get_worldbook(name: str) -> Dict[str, Any]:
        """
        获取指定世界书的完整数据
        
        Args:
            name: 世界书名称
            
        Returns:
            世界书完整数据
        """
        data = WorldBookService._load_worldbook(name)
        if not data:
            raise FileNotFoundError(f"Worldbook '{name}' not found")
        
        return data
    
    @staticmethod
    def create_worldbook(name: str, description: str = "") -> Dict[str, Any]:
        """
        创建新世界书
        
        Args:
            name: 世界书名称
            description: 世界书描述
            
        Returns:
            创建的世界书数据
        """
        # 检查是否已存在
        if WorldBookService._get_worldbook_path(name).exists():
            raise ValueError(f"Worldbook '{name}' already exists")
        
        now = int(datetime.now().timestamp())
        worldbook_data = {
            "id": str(uuid.uuid4()),
            "name": name,
            "description": description,
            "entries": [],
            "createdAt": now,
            "updatedAt": now,
            "version": 1
        }
        
        WorldBookService._save_worldbook(name, worldbook_data)
        return worldbook_data
    
    @staticmethod
    def update_worldbook(name: str, description: Optional[str] = None) -> Dict[str, Any]:
        """
        更新世界书基本信息
        
        Args:
            name: 世界书名称
            description: 新的描述（可选）
            
        Returns:
            更新后的世界书数据
        """
        data = WorldBookService._load_worldbook(name)
        if not data:
            raise FileNotFoundError(f"Worldbook '{name}' not found")
        
        if description is not None:
            data["description"] = description
        
        data["updatedAt"] = int(datetime.now().timestamp())
        WorldBookService._save_worldbook(name, data)
        
        return data
    
    @staticmethod
    def delete_worldbook(name: str) -> bool:
        """
        删除世界书
        
        Args:
            name: 世界书名称
            
        Returns:
            是否删除成功
        """
        path = WorldBookService._get_worldbook_path(name)
        if not path.exists():
            raise FileNotFoundError(f"Worldbook '{name}' not found")
        
        path.unlink()
        return True
    
    @staticmethod
    def list_entries(name: str) -> List[Dict[str, Any]]:
        """
        获取世界书的所有条目
        
        Args:
            name: 世界书名称
            
        Returns:
            条目列表
        """
        data = WorldBookService._load_worldbook(name)
        if not data:
            raise FileNotFoundError(f"Worldbook '{name}' not found")
        
        return data.get("entries", [])
    
    @staticmethod
    def get_entry(name: str, uid: str) -> Dict[str, Any]:
        """
        获取世界书的指定条目
        
        Args:
            name: 世界书名称
            uid: 条目 UID
            
        Returns:
            条目数据
        """
        data = WorldBookService._load_worldbook(name)
        if not data:
            raise FileNotFoundError(f"Worldbook '{name}' not found")
        
        for entry in data.get("entries", []):
            if entry.get("uid") == uid:
                return entry
        
        raise FileNotFoundError(f"Entry '{uid}' not found in worldbook '{name}'")
    
    @staticmethod
    def create_entry(name: str, entry_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        在世界书中创建新条目
        
        Args:
            name: 世界书名称
            entry_data: 条目数据（不包含 uid, createdAt, updatedAt）
            
        Returns:
            创建的条目数据
        """
        data = WorldBookService._load_worldbook(name)
        if not data:
            raise FileNotFoundError(f"Worldbook '{name}' not found")
        
        # 生成 UID 和时间戳
        now = int(datetime.now().timestamp())
        new_entry = {
            "uid": str(uuid.uuid4()),
            "key": entry_data.get("key", []),
            "keysecondary": entry_data.get("keysecondary", []),
            "content": entry_data.get("content", ""),
            "activationType": entry_data.get("activationType", ActivationType.KEYWORD.value),
            "logicExpression": entry_data.get("logicExpression"),
            "ragConfig": entry_data.get("ragConfig"),
            "order": entry_data.get("order", 0),
            "position": entry_data.get("position", "after_char"),
            "depth": entry_data.get("depth"),
            "probability": entry_data.get("probability", 100),
            "group": entry_data.get("group", []),
            "disable": entry_data.get("disable", False),
            "createdAt": now,
            "updatedAt": now
        }
        
        data["entries"].append(new_entry)
        data["updatedAt"] = now
        WorldBookService._save_worldbook(name, data)
        
        return new_entry
    
    @staticmethod
    def update_entry(name: str, uid: str, entry_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        更新世界书的指定条目
        
        Args:
            name: 世界书名称
            uid: 条目 UID
            entry_data: 更新的字段
            
        Returns:
            更新后的条目数据
        """
        data = WorldBookService._load_worldbook(name)
        if not data:
            raise FileNotFoundError(f"Worldbook '{name}' not found")
        
        for i, entry in enumerate(data.get("entries", [])):
            if entry.get("uid") == uid:
                # 更新字段
                for key, value in entry_data.items():
                    if key not in ["uid", "createdAt"]:  # 不修改 UID 和创建时间
                        entry[key] = value
                
                # 更新时间戳
                entry["updatedAt"] = int(datetime.now().timestamp())
                data["entries"][i] = entry
                data["updatedAt"] = entry["updatedAt"]
                
                WorldBookService._save_worldbook(name, data)
                return entry
        
        raise FileNotFoundError(f"Entry '{uid}' not found in worldbook '{name}'")
    
    @staticmethod
    def delete_entry(name: str, uid: str) -> bool:
        """
        删除世界书的指定条目
        
        Args:
            name: 世界书名称
            uid: 条目 UID
            
        Returns:
            是否删除成功
        """
        data = WorldBookService._load_worldbook(name)
        if not data:
            raise FileNotFoundError(f"Worldbook '{name}' not found")
        
        original_length = len(data.get("entries", []))
        data["entries"] = [e for e in data.get("entries", []) if e.get("uid") != uid]
        
        if len(data["entries"]) == original_length:
            raise FileNotFoundError(f"Entry '{uid}' not found in worldbook '{name}'")
        
        data["updatedAt"] = int(datetime.now().timestamp())
        WorldBookService._save_worldbook(name, data)
        
        return True
    
    @staticmethod
    def import_from_sillytavern(name: str, st_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        从 SillyTavern 格式导入世界书
        
        Args:
            name: 世界书名称
            st_data: SillyTavern 格式的世界书数据
            
        Returns:
            转换后的内部格式世界书数据
        """
        # 使用转换器进行转换
        worldbook_data = WorldBookConverter.st_to_internal(st_data, name)
        
        # 保存到文件
        WorldBookService._save_worldbook(name, worldbook_data)
        
        return worldbook_data
    
    @staticmethod
    def import_internal_format(name: str, internal_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        直接导入内部格式的世界书(无需转换)
        
        Args:
            name: 世界书名称
            internal_data: 内部格式的世界书数据
            
        Returns:
            内部格式世界书数据
        """
        # 确保包含必要的字段
        if "name" not in internal_data:
            internal_data["name"] = name
        
        # 规范化所有条目,确保有 trigger_config
        if "entries" in internal_data and isinstance(internal_data["entries"], list):
            normalized_entries = []
            for entry in internal_data["entries"]:
                if isinstance(entry, dict):
                    normalized_entry = WorldBookConverter.normalize_entry(entry)
                    normalized_entries.append(normalized_entry)
            internal_data["entries"] = normalized_entries
        
        # 保存文件
        WorldBookService._save_worldbook(name, internal_data)
        
        return internal_data
    
    @staticmethod
    def export_to_sillytavern(name: str) -> Dict[str, Any]:
        """
        导出为 SillyTavern 格式
        
        Args:
            name: 世界书名称
            
        Returns:
            SillyTavern 格式的世界书数据
        """
        data = WorldBookService._load_worldbook(name)
        if not data:
            raise FileNotFoundError(f"Worldbook '{name}' not found")
        
        # 使用转换器进行转换
        st_data = WorldBookConverter.internal_to_st(data)
        
        return st_data


# 全局实例
worldbook_service = WorldBookService()
