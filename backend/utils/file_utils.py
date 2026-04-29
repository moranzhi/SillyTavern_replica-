"""
文件操作工具函数

提供文件和目录操作的通用工具
"""
from pathlib import Path
from typing import Dict, List
import json
import logging

logger = logging.getLogger(__name__)


def get_all_roles_and_chats(data_path: Path) -> Dict[str, List[str]]:
    """
    获取所有角色和聊天列表
    
    Args:
        data_path: 数据目录路径
        
    Returns:
        Dict[str, List[str]]: 字典结构，键是角色名称，值是该角色的聊天列表
    """
    chat_dir = data_path / "chat"
    result = {}
    
    if not chat_dir.exists():
        logger.warning(f"聊天目录不存在: {chat_dir}")
        return result
    
    for entry in chat_dir.iterdir():
        try:
            if entry.is_dir():
                jsonl_files = []
                
                for file in entry.iterdir():
                    if file.is_file() and file.suffix == '.jsonl':
                        jsonl_files.append(file.stem)
                
                if jsonl_files:
                    result[entry.name] = jsonl_files
                    
        except Exception as e:
            logger.error(f"处理文件夹 {entry.name} 时出错: {str(e)}")
            continue
    
    return result


def ensure_directory_exists(path: Path) -> None:
    """
    确保目录存在,如果不存在则创建
    
    Args:
        path: 目录路径
    """
    path.mkdir(parents=True, exist_ok=True)


def read_json_file(file_path: Path) -> dict:
    """
    读取 JSON 文件
    
    Args:
        file_path: 文件路径
        
    Returns:
        dict: JSON 数据
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def write_json_file(file_path: Path, data: dict) -> None:
    """
    写入 JSON 文件
    
    Args:
        file_path: 文件路径
        data: 要写入的数据
    """
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def read_jsonl_file(file_path: Path) -> List[dict]:
    """
    读取 JSONL 文件
    
    Args:
        file_path: 文件路径
        
    Returns:
        List[dict]: JSONL 数据列表
    """
    lines = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    lines.append(json.loads(line))
                except json.JSONDecodeError as e:
                    logger.warning(f"解析 JSONL 行失败: {e}")
    return lines


def append_to_jsonl_file(file_path: Path, data: dict) -> None:
    """
    追加数据到 JSONL 文件
    
    Args:
        file_path: 文件路径
        data: 要追加的数据
    """
    with open(file_path, 'a', encoding='utf-8') as f:
        f.write(json.dumps(data, ensure_ascii=False) + '\n')


def write_jsonl_file(file_path: Path, data_list: List[dict]) -> None:
    """
    写入 JSONL 文件 (覆盖模式)
    
    Args:
        file_path: 文件路径
        data_list: 数据列表
    """
    with open(file_path, 'w', encoding='utf-8') as f:
        for data in data_list:
            f.write(json.dumps(data, ensure_ascii=False) + '\n')
