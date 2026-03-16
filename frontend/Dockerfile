# 使用 Python 3.11 基础镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 复制依赖文件并安装
COPY requirements.txt .
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

# 复制所有代码
COPY . .

# 暴露端口
EXPOSE 8501

# 启动命令（使用 8501 端口，与 docker-compose 映射保持一致）
CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]