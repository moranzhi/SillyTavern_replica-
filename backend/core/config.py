import os
from pathlib import Path
from dotenv import load_dotenv

# 1. 动态计算项目根目录
# 假设 config.py 位于 backend/core/ 目录下
# __file__ 指向本文件的绝对路径
# .parent 指向 backend/core/ 目录
# .parent.parent 指向 backend/ 目录
# .parent.parent.parent 指向项目根目录 (即包含 backend/ 和 frontend/ 的目录)
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
	DATA_PATH = BASE_PATH / "data"

	# --- 核心数据文件路径 ---
	STATE_FILE = DATA_PATH / "state.json"
	SCHEMA_FILE = DATA_PATH / "schema.json"
	PRESETS_FILE = DATA_PATH / "presets.json"
	REGEX_FILE = DATA_PATH / "regex_rules.json"
	VECTORSTORE_PATH = DATA_PATH / "vectorstore"

	# --- 业务数据目录 ---

	# 世界书目录
	WORLDBOOKS_PATH = DATA_PATH / "worldbooks"

	# 预设目录
	PRESET_PATH = DATA_PATH / "preset"

	# 聊天记录目录
	CHAT_PATH = DATA_PATH / "chat"

	# 临时文件目录
	TEMP_PATH = DATA_PATH / "temp"

	# ComfyUI 工作流目录
	COMFYUI_WORKFLOWS_PATH = DATA_PATH / "comfyui_workflows"

	def ensure_directories(self):
		"""确保所有配置的目录存在，如果不存在则创建"""
		directories = [
			self.DATA_PATH,
			self.WORLDBOOKS_PATH,
			self.PRESET_PATH,
			self.CHAT_PATH,
			self.TEMP_PATH,
			self.COMFYUI_WORKFLOWS_PATH,
		]
		for directory in directories:
			directory.mkdir(parents=True, exist_ok=True)


settings = Settings()

# 初始化时自动创建必要的目录
settings.ensure_directories()

if __name__ == '__main__':
	settings = Settings()
	print(f"项目根目录: {settings.BASE_PATH}")
	print(f"数据目录: {settings.DATA_PATH}")
	print(f"世界书目录: {settings.WORLDBOOKS_PATH}")
	print(f"预设目录: {settings.PRESETS_PATH}")
	print(f"聊天目录: {settings.CHAT_PATH}")
