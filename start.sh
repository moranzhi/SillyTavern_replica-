#!/bin/bash

# LLM Workflow Engine 启动脚本

echo "🚀 Starting LLM Workflow Engine..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env file created. Please edit it with your configuration."
    else
        echo "❌ .env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# 创建必要的目录
echo "📁 Creating necessary directories..."
mkdir -p data outputs

# 构建并启动服务
echo "🐳 Building and starting services..."
docker-compose up --build

echo "✅ Services stopped. Thank you for using LLM Workflow Engine!"
