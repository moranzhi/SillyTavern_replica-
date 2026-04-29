# 🎨 ComfyUI API 配置使用指南

## 📋 目录
- [快速开始](#快速开始)
- [工作流管理](#工作流管理)
- [API 配置](#api-配置)
- [测试连接](#测试连接)
- [常见问题](#常见问题)

---

## 🚀 快速开始

### **1. 准备工作**

确保你已经：
- ✅ 安装了 ComfyUI（本地或 Docker）
- ✅ ComfyUI 正在运行并监听 `0.0.0.0:8188`
- ✅ 下载了至少一个 checkpoint 模型文件

### **2. 访问 API 配置页面**

1. 打开应用
2. 点击左侧边栏的"⚙️ API配置"
3. 选择"🎨 生图"标签

---

## 📁 工作流管理

### **默认工作流**

系统已预装一个标准的文生图工作流：
- 文件位置：`backend/data/comfyui_workflows/default_txt2img.json`
- 格式：ComfyUI API Format（标准 JSON）
- 节点数：7个（KSampler、CheckpointLoader、EmptyLatentImage、CLIPTextEncode x2、VAEDecode、SaveImage）

### **工作流结构**

```json
{
  "3": {
    "inputs": {
      "seed": 0,
      "steps": 20,
      "cfg": 8,
      "sampler_name": "euler",
      ...
    },
    "class_type": "KSampler",
    "_meta": {
      "title": "K采样器"
    }
  },
  ...
}
```

**关键字段**：
- `class_type`: 节点类型
- `inputs`: 节点参数
- `_meta.title`: 节点显示名称（可选）

---

### **上传自定义工作流**

#### **步骤 1: 在 ComfyUI 中设计工作流**

1. 打开 ComfyUI Web UI (`http://localhost:8188`)
2. 拖拽节点，搭建你的工作流
3. 连接节点之间的数据流
4. 配置节点参数（模型、提示词、采样器等）
5. 点击 "Queue Prompt" 测试是否能正常生成图像

#### **步骤 2: 导出 API 格式的 JSON**

1. 点击顶部菜单栏的 **"工作流" (Workflow)**
2. 选择 **"导出(API)" (Export API)** 或 **"Save (API Format)"**
3. 浏览器会自动下载 `workflow_api.json` 文件

**重要提示**：
- ⚠️ 必须使用 **"Save (API Format)"**，而不是普通的 "Save"
- ⚠️ API 格式的 JSON 包含节点 ID 和连接关系，是 API 调用的核心

#### **步骤 3: 上传到本项目**

1. 在本项目的 API 配置页面
2. 滚动到"ComfyUI 工作流管理"区域
3. 点击 **"+ 导入工作流"** 按钮
4. 选择刚才导出的 JSON 文件
5. 看到"上传成功"提示

#### **验证上传**

上传成功后，你会在工作流列表中看到：
- 文件名（例如：`my_custom_workflow.json`）
- 节点数量
- 文件大小

---

### **删除工作流**

1. 在工作流列表中找到要删除的工作流
2. 点击右侧的 🗑️ 删除按钮
3. 确认删除

**注意**：
- ❌ `default_txt2img.json` 不可删除（受保护）
- ✅ 其他所有工作流都可以删除

---

## ⚙️ API 配置

### **本地 ComfyUI 模式**

#### **配置项**

| 字段 | 说明 | 示例值 |
|------|------|--------|
| API 地址 | ComfyUI 的服务地址 | `http://comfyui:8188` (Docker)<br>`http://localhost:8188` (本地) |
| 启用 WebSocket | 是否使用 WebSocket 监听进度 | ✓ / ✗ |
| 队列超时 | 等待生成的最大时间（秒） | `300` (5分钟) |
| 默认工作流 | 使用的预设工作流文件 | `default_txt2img.json` |

#### **Docker 环境配置**

如果使用 Docker Compose：

```yaml
# docker-compose.yml
services:
  comfyui:
    image: ghcr.io/comfyanonymous/comfyui:latest
    ports:
      - "8188:8188"
    networks:
      - ai-network
    command: --listen 0.0.0.0 --port 8188

  llm-workflow-engine:
    # ...
    networks:
      - ai-network
```

**API 地址填写**：`http://comfyui:8188`（Docker 内部网络 DNS）

#### **本地运行配置**

如果 ComfyUI 运行在宿主机：

```bash
# 启动 ComfyUI
python main.py --listen 0.0.0.0 --port 8188
```

**API 地址填写**：`http://localhost:8188`

---

### **在线 API 模式**

#### **支持的提供商**

1. **DALL-E (OpenAI)**
   - 模型：`dall-e-3`, `dall-e-2`
   - 质量：最高
   - 价格：较贵

2. **Stable Diffusion (Stability AI)**
   - 模型：`sd-xl-1024`, `sd-2-1`
   - 质量：高
   - 价格：中等

#### **配置项**

| 字段 | 说明 | 示例值 |
|------|------|--------|
| 服务提供商 | 选择 API 提供商 | DALL-E / Stability AI |
| API Key | 你的 API 密钥 | `sk-...` |
| 模型 | 选择具体模型 | `dall-e-3` |

#### **获取 API Key**

**DALL-E**:
1. 访问 https://platform.openai.com/
2. 注册/登录账号
3. 进入 API Keys 页面
4. 创建新的 Secret Key
5. 复制并粘贴到配置中

**Stability AI**:
1. 访问 https://platform.stability.ai/
2. 注册/登录账号
3. 进入 API Keys 页面
4. 创建新的 Key
5. 复制并粘贴到配置中

---

## 🔌 测试连接

### **测试 ComfyUI 连接**

1. 填写 API 地址
2. 点击"测试连接"按钮
3. 查看结果

**成功响应**：
```json
{
  "success": true,
  "message": "连接成功",
  "stats": {
    "vram_total": 25769803776,
    "vram_free": 24696061952,
    "torch_version": "2.1.0+cu121",
    "device": "cuda"
  }
}
```

**失败响应**：
```json
{
  "success": false,
  "message": "无法连接到 ComfyUI，请检查地址和端口"
}
```

---

### **测试云端 API 连接**

1. 填写 API Key
2. 选择模型
3. 点击"测试连接"按钮
4. 查看结果

**成功响应**：
```json
{
  "success": true,
  "message": "连接成功，模型 dall-e-3 可用"
}
```

**失败响应**：
```json
{
  "success": false,
  "message": "连接失败: Invalid API key"
}
```

---

## 💾 保存配置

### **保存流程**

1. 完成所有配置后
2. 点击底部的"保存配置"按钮
3. 在弹出的对话框中勾选要保存的配置
4. 点击"保存选中的配置"

### **配置文件存储**

- 位置：`backend/data/apiconfig/`
- 格式：JSON
- 加密：API Key 使用 Fernet 加密存储

### **加载配置**

1. 从下拉框选择已保存的配置文件
2. 自动加载所有配置
3. 可以修改后重新保存

---

## ❓ 常见问题

### **Q1: 上传工作流时提示"Invalid ComfyUI workflow"**

**原因**：上传的不是 API 格式的 JSON

**解决**：
1. 在 ComfyUI 中使用 "Save (API Format)" 导出
2. 不要使用普通的 "Save" 功能
3. 确保 JSON 包含节点定义（有 `class_type` 字段）

---

### **Q2: 测试连接时提示"Connection refused"**

**可能原因**：
1. ComfyUI 未启动
2. 地址或端口错误
3. Docker 网络配置问题

**解决**：
```bash
# 检查 ComfyUI 是否运行
curl http://localhost:8188/system_stats

# Docker 环境下
docker ps | grep comfyui
docker logs comfyui

# 确认监听地址
docker exec comfyui netstat -tlnp | grep 8188
# 应该看到: 0.0.0.0:8188
```

---

### **Q3: 工作流中的提示词会被替换吗？**

**是的**！后端会自动：
1. 加载工作流 JSON
2. 找到第一个 `CLIPTextEncode` 节点
3. 将其 `text` 字段替换为用户输入的提示词
4. 发送到 ComfyUI

**示例**：
```json
// 工作流中的原始提示词
"6": {
  "inputs": {
    "text": "beautiful scenery nature glass bottle landscape..."
  }
}

// 运行时会被替换为
"6": {
  "inputs": {
    "text": "用户输入的提示词，例如：画一只猫"
  }
}
```

---

### **Q4: 如何添加 LoRA 或 ControlNet？**

**方法 1: 在 ComfyUI 中添加节点**
1. 在 ComfyUI Web UI 中加载 LoRA Loader 或 ControlNet 节点
2. 连接到工作流
3. 配置参数
4. 导出为 API 格式
5. 上传到本项目

**方法 2: 手动编辑 JSON**
```json
"10": {
  "inputs": {
    "lora_name": "cyberpunk_style.safetensors",
    "strength_model": 0.7,
    "strength_clip": 0.7,
    "model": ["4", 0],
    "clip": ["4", 1]
  },
  "class_type": "LoraLoader"
}
```

---

### **Q5: 支持批量生图吗？**

当前版本不支持批量生图，但可以通过以下方式实现：

**方案 A: 多次调用**
```python
for prompt in prompts:
    result = generate_image(prompt, config)
    save_result(result)
```

**方案 B: ComfyUI 批量节点**
在工作流中使用 Batch Size > 1：
```json
"5": {
  "inputs": {
    "width": 512,
    "height": 512,
    "batch_size": 4  // 一次生成4张
  }
}
```

---

### **Q6: 如何优化生图速度？**

**本地 ComfyUI**：
1. 使用更快的采样器（如 `euler_ancestral`）
2. 减少步数（Steps: 15-20）
3. 降低分辨率（512x512 而非 1024x1024）
4. 使用 GPU 加速

**云端 API**：
1. 选择更快的模型（DALL-E 2 比 DALL-E 3 快）
2. 使用较小的尺寸
3. 考虑付费套餐（更高的优先级）

---

## 📊 工作流示例

### **基础文生图**

```json
{
  "3": {"class_type": "KSampler", ...},
  "4": {"class_type": "CheckpointLoaderSimple", ...},
  "5": {"class_type": "EmptyLatentImage", ...},
  "6": {"class_type": "CLIPTextEncode", ...},
  "7": {"class_type": "CLIPTextEncode", ...},
  "8": {"class_type": "VAEDecode", ...},
  "9": {"class_type": "SaveImage", ...}
}
```

### **带 LoRA 的文生图**

额外添加：
```json
"10": {
  "class_type": "LoraLoader",
  "inputs": {
    "lora_name": "style.safetensors",
    "strength_model": 0.7,
    "model": ["4", 0],
    "clip": ["4", 1]
  }
}
```

### **图生图**

需要添加：
```json
"10": {
  "class_type": "LoadImage",
  "inputs": {
    "image": "reference.png"
  }
},
"11": {
  "class_type": "VAEEncode",
  "inputs": {
    "pixels": ["10", 0],
    "vae": ["4", 2]
  }
}
```

---

## 🔗 相关资源

- **ComfyUI 官方文档**: https://github.com/comfyanonymous/ComfyUI
- **ComfyUI API 示例**: https://github.com/zer0Black/ComfyUI-Api-Demo
- **工作流分享社区**: https://comfyworkflows.com/
- **模型下载**: https://civitai.com/

---

## 📝 更新日志

### **v1.0.0** (2026-04-28)
- ✅ 初始版本发布
- ✅ 支持 ComfyUI 本地部署
- ✅ 支持云端 API（DALL-E、Stability AI）
- ✅ 工作流管理（上传、删除、列表）
- ✅ 连接测试功能
- ✅ 默认工作流模板

---

**如有问题，请查看日志或联系开发者！**
