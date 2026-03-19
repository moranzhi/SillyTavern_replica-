import os
from pathlib import Path
from dotenv import load_dotenv

# 1. 动态计算项目根目录
# 假设 config.py 位于 backend/ 目录下
# __file__ 指向本文件的绝对路径
# .parent 指向 backend/ 目录
# .parent.parent 指向项目根目录 (即包含 backend/ 和 frontend/ 的目录)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
# 2. 加载 .env 文件
# 假设 .env 文件位于项目根目录下
load_dotenv(PROJECT_ROOT / ".env")


class Settings:
    # --- 主模型配置 ---
    MAIN_LLM_API_KEY = os.getenv("MAIN_LLM_API_KEY")
    MAIN_LLM_MODEL = os.getenv("MAIN_LLM_MODEL", "gpt-3.5-turbo")
    MAIN_LLM_BASE_URL = os.getenv("MAIN_LLM_BASE_URL", "https://api.openai.com/v1")
    MAIN_LLM_MAX_TOKENS = int(os.getenv("MAIN_LLM_MAX_TOKENS", "4096"))
    MAIN_LLM_STREAM = os.getenv("MAIN_LLM_STREAM", "true").lower() == "true"

    # --- 路径配置 (核心修改) ---

    # 强制使用计算出的项目根目录，不再依赖 .env 中的 BASE_PATH
    BASE_PATH = PROJECT_ROOT

    # 数据目录：固定为根目录下的 data 文件夹
    # 即使 .env 里写了 DATA_PATH=/data，这里也会强制指向项目根目录下的 data
    DATA_PATH = BASE_PATH / "data"

    # 其他文件路径：基于 DATA_PATH 拼接
    STATE_FILE = DATA_PATH / "state.json"
    SCHEMA_FILE = DATA_PATH / "schema.json"
    PRESETS_FILE = DATA_PATH / "presets.json"
    REGEX_FILE = DATA_PATH / "regex_rules.json"
    VECTORSTORE_PATH = DATA_PATH / "vectorstore"

settings = Settings()

if __name__ == '__main__':
    settings = Settings()
    print(f"项目根目录: {settings.BASE_PATH}")
    print(f"数据目录: {settings.DATA_PATH}")
    print(f"聊天目录: {settings.DATA_PATH / 'chat'}")


