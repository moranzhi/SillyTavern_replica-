@echo off
REM LLM Workflow Engine 启动脚本 (Windows)

echo 🚀 Starting LLM Workflow Engine...

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

REM 检查 Docker Compose 是否安装
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM 检查 .env 文件是否存在
if not exist .env (
    echo ⚠️  .env file not found. Creating from .env.example...
    if exist .env.example (
        copy .env.example .env
        echo ✅ .env file created. Please edit it with your configuration.
    ) else (
        echo ❌ .env.example not found. Please create .env file manually.
        pause
        exit /b 1
    )
)

REM 创建必要的目录
echo 📁 Creating necessary directories...
if not exist data mkdir data
if not exist outputs mkdir outputs

REM 构建并启动服务
echo 🐳 Building and starting services...
docker-compose up --build

echo ✅ Services stopped. Thank you for using LLM Workflow Engine!
pause
