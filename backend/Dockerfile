# 使用 Python 3.11 基础镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装依赖
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

# 复制所有代码
# 修改点：把当前目录（即 backend/）的内容复制到 /app/backend/ 下
# 这样镜像内的结构就是 /app/backend/api/route.py
COPY . /app/backend/

# 暴露端口
EXPOSE 8000

# 启动命令
# 修改点：路径改为 backend.api.route (对应 /app/backend/api/route.py)
CMD ["uvicorn", "backend.api.route:app", "--host", "0.0.0.0", "--port", "8000"]
