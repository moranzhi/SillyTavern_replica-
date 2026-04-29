# LLM Workflow Engine

一个基于 React + TypeScript + FastAPI 的 AI 聊天工作流引擎，支持流式对话、动态表格生成、图片生成等功能。

## 🚀 技术栈

### 前端
- **React 18** - 用户界面框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 现代化的前端构建工具
- **Zustand** - 轻量级状态管理
- **React Markdown** - Markdown 渲染
- **Tailwind CSS** - 实用优先的 CSS 框架

### 后端
- **FastAPI** - 现代化的 Python Web 框架
- **Python 3.11** - 编程语言
- **Uvicorn** - ASGI 服务器
- **WebSockets** - 实时通信

## 📁 项目结构

```
llm_workflow_engine/
├── backend/                 # 后端服务
│   ├── api/                # API 路由
│   ├── core/               # 核心模型和配置
│   ├── tools/              # 工具函数
│   ├── workflows/          # 工作流定义
│   ├── Dockerfile          # 后端 Docker 配置
│   ├── main.py             # 后端入口
│   └── requirements.txt    # Python 依赖
├── frontend/               # 前端服务
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── Store/          # 状态管理
│   │   ├── services/       # API 服务
│   │   ├── types/          # TypeScript 类型定义
│   │   ├── App.tsx         # 主应用组件
│   │   └── main.tsx        # 入口文件
│   ├── Dockerfile          # 前端 Docker 配置
│   ├── nginx.conf          # Nginx 配置（生产环境）
│   ├── package.json        # Node.js 依赖
│   └── tsconfig.json       # TypeScript 配置
├── data/                   # 数据存储
├── docker-compose.yml      # Docker Compose 配置
└── README.md              # 项目文档
```

## 🛠️ 安装和运行

### 使用 Docker Compose（推荐）

这是最简单的运行方式，适合开发和生产环境。

1. **克隆项目**
```bash
git clone <repository-url>
cd llm_workflow_engine
```

2. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env

# 根据需要编辑 .env 文件
```

3. **启动服务**
```bash
# 构建并启动所有服务
docker-compose up --build

# 或者在后台运行
docker-compose up -d --build
```

4. **访问应用**
- 前端界面: http://localhost:23338
- 后端 API: http://localhost:23337
- API 文档: http://localhost:23337/docs

5. **停止服务**
```bash
docker-compose down
```

### 本地开发

如果你想分别运行前后端进行开发：

#### 后端开发

1. **安装 Python 依赖**
```bash
cd backend
pip install -r requirements.txt
```

2. **启动后端服务**
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 前端开发

1. **安装 Node.js 依赖**
```bash
cd frontend
npm install
```

2. **启动前端开发服务器**
```bash
npm run dev
```

3. **访问应用**
- 前端界面: http://localhost:5173
- 确保后端在 http://localhost:8000 运行

## 🔧 配置说明

### 环境变量

#### 前端环境变量 (frontend/.env)
```
VITE_API_URL=http://localhost:23337/api
VITE_WS_URL=ws://localhost:23337/api
```

#### 后端环境变量
```
PYTHONUNBUFFERED=1
PYTHONDONTWRITEBYTECODE=1
```

### API 配置

在前端界面中配置你的 API 密钥和端点：
1. 打开左侧栏的 "API 配置" 标签
2. 添加你的 API 配置（URL 和密钥）
3. 选择要使用的 API

## 📖 功能特性

- ✅ **流式对话** - 实时显示 AI 回复
- ✅ **多角色支持** - 支持多个聊天角色和会话
- ✅ **消息编辑** - 可以编辑和删除历史消息
- ✅ **HTML 渲染** - 支持 Markdown 和 HTML 渲染
- ✅ **动态表格** - 自动生成和更新数据表格
- ✅ **图片生成** - 集成图片生成工作流
- ✅ **世界书** - 管理角色和世界设定
- ✅ **预设管理** - 保存和加载不同的对话预设

## 🐳 Docker 命令参考

```bash
# 构建并启动
docker-compose up --build

# 后台运行
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 进入容器
docker-compose exec backend bash
docker-compose exec frontend sh

# 清理所有容器和卷
docker-compose down -v
```

## 🔍 开发工具

### 前端
```bash
# 类型检查
npm run type-check

# 构建
npm run build

# 预览生产构建
npm run preview
```

### 后端
```bash
# 运行测试（如果有的话）
cd backend
pytest

# 代码格式化
black .
```

## 📝 待办事项

- [ ] 添加单元测试
- [ ] 完善错误处理
- [ ] 添加用户认证
- [ ] 优化性能
- [ ] 添加更多语言支持
- [ ] 完善文档

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 联系方式

如有问题，请提交 Issue 或联系维护者。