import logging
import sys

# 配置日志
logging.basicConfig(
		level=logging.INFO,
		format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
		handlers=[
			logging.StreamHandler(sys.stdout)
		]
)

# 确保所有模块的日志都能被捕获
for logger_name in ['uvicorn', 'uvicorn.access', 'fastapi']:
	logging_logger = logging.getLogger(logger_name)
	logging_logger.setLevel(logging.INFO)

# backend/app/main.py
from fastapi import FastAPI
from .api.route import router
app = FastAPI(title="LLM Workflow Engine")

# 注册路由
app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
