from fastapi import FastAPI
from backend.api.route import router

app = FastAPI()

# 注册API路由
app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Hello World"}
