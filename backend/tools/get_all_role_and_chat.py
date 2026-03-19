from ..core import config
from typing import Dict, List

# 使用配置中的 DATA_PATH 并添加 "chat" 子目录
ROOT_DIR = config.settings.DATA_PATH / "chat"

def get_all_role_and_chat() -> Dict[str, List[str]]:
    """
    读取配置目录下的所有子文件夹，并收集每个子文件夹中的 JSONL 文件

    返回:
        dict: 字典结构，键是文件夹名称，值是该文件夹中的 JSONL 文件列表
    """
    result = {}

    # 确保目标目录存在
    if not ROOT_DIR.exists():
        print(f"警告: 目录 {ROOT_DIR} 不存在")
        return result

    # 打印根目录路径和内容（调试用）
    print(f"正在扫描目录: {ROOT_DIR}")
    print(f"根目录内容: {list(ROOT_DIR.iterdir())}")

    # 遍历根目录下的所有条目
    for entry in ROOT_DIR.iterdir():
        try:
            # 只处理文件夹
            if entry.is_dir():
                print(f"处理文件夹: {entry.name}")  # 调试信息
                jsonl_files = []

                # 遍历子文件夹中的所有文件
                for file in entry.iterdir():
                    if file.is_file() and file.suffix == '.jsonl':
                        jsonl_files.append(str(file))
                        print(f"  找到文件: {file.name}")  # 调试信息

                # 如果该文件夹中有 JSONL 文件，则添加到结果中
                if jsonl_files:
                    result[entry.name] = jsonl_files
        except Exception as e:
            print(f"处理文件夹 {entry.name} 时出错: {str(e)}")
            continue

    return result