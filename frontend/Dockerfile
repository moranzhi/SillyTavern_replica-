# 使用 Node.js 18 Alpine 镜像作为基础
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 设置 npm 镜像源（可选，国内推荐使用，加速依赖下载）
RUN npm config set registry https://registry.npmmirror.com/

# 复制 package.json 和 package-lock.json
# 利用 Docker 缓存层，只有依赖变更时才重新安装
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm install

# 暴露 Vite 默认端口 5173
EXPOSE 5173

# 启动命令由 docker-compose.yml 中的 command 覆盖，
# 这里保留默认的 dev 命令作为 fallback
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
