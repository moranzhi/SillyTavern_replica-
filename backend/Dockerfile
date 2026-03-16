# 使用 Python 3.11 基础镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 复制依赖文件
# 注意：这里的 requirements.txt 在 backend/ 目录下
COPY requirements.txt .

# 安装依赖
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

# 复制所有代码
# 关键修改：把 backend/ 目录下的内容复制到 /app/backend/ 下
# 这样镜像内的结构就是 /app/backend/app/...
COPY . ./backend/

# 暴露端口
EXPOSE 8000

# 启动命令
# 关键修改：路径改为 backend.app.api.route
CMD ["uvicorn", "backend.app.api.route:app", "--host", "0.0.0.0", "--port", "8000"]
