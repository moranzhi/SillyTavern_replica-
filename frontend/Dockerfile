# 1. 基础镜像变更
# 原本是 Python 3.11，现在改为 Node.js 18 (Alpine 版本体积更小)
# 分为两个阶段：builder (构建阶段) 和 production (运行阶段)
FROM node:18-alpine as builder

# 2. 设置工作目录
WORKDIR /app

# 3. 依赖安装变更
# 原本是复制 requirements.txt 并用 pip 安装 Python 库
# 现在是复制 package.json 并用 npm 安装 Node.js 库
COPY package.json package-lock.json* ./
RUN npm ci

# 4. 复制源代码
# 保持不变，复制当前目录所有文件到容器
COPY . .

# 5. 构建步骤
# 原本没有这一步，Streamlit 是解释型语言，直接运行
# React 需要编译打包成静态文件 (HTML/CSS/JS)
RUN npm run build

# --- 生产环境运行阶段 ---
FROM nginx:alpine

# 6. 部署静态文件
# 将上面构建好的 /app/build (React 默认构建目录) 复制到 Nginx 的默认目录
COPY --from=builder /app/build /usr/share/nginx/html

# 7. 端口变更
# 原本是 Streamlit 的 8501 端口
# 现在改为 Nginx 的标准 80 端口
EXPOSE 80

# 8. 启动命令变更
# 原本是 streamlit run app.py
# 现在是启动 Nginx 服务器
CMD ["nginx", "-g", "daemon off;"]
