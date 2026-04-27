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
try:
    from backend.api.route import router
except ImportError:
    from api.route import router
app = FastAPI(title="LLM Workflow Engine")

# 注册路由
app.include_router(router, prefix="/api")

# 添加健康检查端点
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# 添加根路径
@app.get("/")
async def root():
    return {"message": "LLM Workflow Engine", "status": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
