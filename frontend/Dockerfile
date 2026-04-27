# 多阶段构建 - 开发环境
FROM node:20-alpine AS development

# 设置工作目录
WORKDIR /app

# 设置 npm 镜像源（可选，国内推荐使用，加速依赖下载）
RUN npm config set registry https://registry.npmmirror.com/

# 复制 package.json 和 package-lock.json
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm install

# 复制源代码到容器
COPY . .

# 暴露 Vite 默认端口 5173
EXPOSE 5173

# 设置环境变量
ENV NODE_ENV=development
ENV VITE_API_URL=http://backend:8000/api

# 启动 Vite 开发服务器
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# 多阶段构建 - 生产环境
FROM node:20-alpine AS build

WORKDIR /app

# 设置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com/

# 复制依赖文件
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# 生产环境镜像
FROM nginx:alpine AS production

# 复制构建产物到 Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# 复制 Nginx 配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]