# 🧪 API 配置功能测试指南

## 📋 测试前准备

### **1. 启动后端服务**

```bash
cd backend
uvicorn main:app --reload --port 8000
```

确保看到：
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

### **2. （可选）启动 ComfyUI**

如果要测试 ComfyUI 连接：

```bash
# 本地运行
python comfyui/main.py --listen 0.0.0.0 --port 8188

# 或 Docker
docker-compose up -d comfyui
```

---

## 🚀 运行测试

### **方法 1: 使用 Python 脚本（推荐）**

```bash
# 在项目根目录运行
python test_api_config.py
```

**预期输出**：
```
============================================================
  ComfyUI API 配置测试
============================================================

============================================================
  测试 1: 列出工作流
============================================================

✅ 成功获取 1 个工作流

  📄 default_txt2img.json
     节点数: 7, 大小: 1234 bytes

...

============================================================
  测试总结
============================================================

  ✅ 通过 - 列出工作流
  ✅ 通过 - 获取工作流详情
  ✅ 通过 - 上传工作流
  ✅ 通过 - 删除工作流
  ✅ 通过 - 测试 ComfyUI 连接
  ✅ 通过 - 测试云端 API 连接

  总计: 6/6 通过

🎉 所有测试通过！
```

---

### **方法 2: 使用 cURL 手动测试**

#### **测试 1: 列出工作流**

```bash
curl http://localhost:8000/api/api-config/comfyui/workflows | jq
```

**预期响应**：
```json
[
  {
    "filename": "default_txt2img.json",
    "name": "default_txt2img",
    "nodes_count": 7,
    "size": 1234
  }
]
```

---

#### **测试 2: 获取工作流详情**

```bash
curl http://localhost:8000/api/api-config/comfyui/workflows/default_txt2img.json | jq
```

**预期响应**：
```json
{
  "3": {
    "inputs": {...},
    "class_type": "KSampler",
    "_meta": {"title": "K采样器"}
  },
  ...
}
```

---

#### **测试 3: 上传工作流**

创建一个测试文件 `test_workflow.json`：

```bash
cat > test_workflow.json << 'EOF'
{
  "3": {
    "inputs": {
      "seed": 42,
      "steps": 20,
      "cfg": 8,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1,
      "model": ["4", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0]
    },
    "class_type": "KSampler"
  },
  "4": {
    "inputs": {"ckpt_name": "test.safetensors"},
    "class_type": "CheckpointLoaderSimple"
  },
  "5": {
    "inputs": {"width": 512, "height": 512, "batch_size": 1},
    "class_type": "EmptyLatentImage"
  },
  "6": {
    "inputs": {"text": "test", "clip": ["4", 1]},
    "class_type": "CLIPTextEncode"
  },
  "7": {
    "inputs": {"text": "bad", "clip": ["4", 1]},
    "class_type": "CLIPTextEncode"
  },
  "8": {
    "inputs": {"samples": ["3", 0], "vae": ["4", 2]},
    "class_type": "VAEDecode"
  },
  "9": {
    "inputs": {"images": ["8", 0], "filename_prefix": "Test"},
    "class_type": "SaveImage"
  }
}
EOF
```

上传：

```bash
curl -X POST http://localhost:8000/api/api-config/comfyui/workflows/upload \
  -F "file=@test_workflow.json" | jq
```

**预期响应**：
```json
{
  "message": "Workflow uploaded successfully",
  "filename": "test_workflow.json",
  "size": 1234
}
```

---

#### **测试 4: 删除工作流**

```bash
curl -X DELETE http://localhost:8000/api/api-config/comfyui/workflows/test_workflow.json | jq
```

**预期响应**：
```json
{
  "message": "Workflow 'test_workflow.json' deleted successfully"
}
```

---

#### **测试 5: 测试 ComfyUI 连接**

```bash
curl -X POST http://localhost:8000/api/api-config/test-comfyui-connection \
  -H "Content-Type: application/json" \
  -d '{"apiUrl": "http://localhost:8188"}' | jq
```

**如果 ComfyUI 正在运行**：
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

**如果 ComfyUI 未运行**：
```json
{
  "success": false,
  "message": "无法连接到 ComfyUI，请检查地址和端口"
}
```

---

#### **测试 6: 测试云端 API 连接**

```bash
curl -X POST http://localhost:8000/api/api-config/test-cloud-connection \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "dall-e",
    "apiKey": "sk-your-api-key-here",
    "model": "dall-e-3"
  }' | jq
```

**预期响应**（如果 API Key 有效）：
```json
{
  "success": true,
  "message": "连接成功，模型 dall-e-3 可用"
}
```

---

## ✅ 测试检查清单

### **后端 API**
- [ ] 列出工作流返回正确的列表
- [ ] 获取工作流详情返回完整的 JSON
- [ ] 上传工作流成功保存文件
- [ ] 上传的工作流可以通过列表看到
- [ ] 删除工作流成功移除文件
- [ ] 默认工作流不可删除（返回 403）
- [ ] ComfyUI 连接测试正确检测状态
- [ ] 云端 API 连接测试验证 Key

### **前端 UI**
- [ ] 可以切换到"🎨 生图"标签
- [ ] 模式切换卡片正常显示
- [ ] 点击"本地 ComfyUI"显示本地配置
- [ ] 点击"在线 API"显示云端配置
- [ ] 表单输入正常工作
- [ ] 工作流管理器显示默认工作流
- [ ] 可以上传工作流文件
- [ ] 可以删除工作流（非默认）
- [ ] 测试连接按钮正常工作
- [ ] 保存配置功能正常

### **响应式设计**
- [ ] 大屏幕（>768px）双列布局
- [ ] 小屏幕（<768px）单列布局
- [ ] 无页面级滚动条
- [ ] 侧边栏可独立滚动
- [ ] 无横向滚动

---

## 🐛 常见问题

### **Q1: 测试脚本提示"Connection refused"**

**原因**：后端服务未启动

**解决**：
```bash
cd backend
uvicorn main:app --reload --port 8000
```

---

### **Q2: 上传工作流提示"Invalid ComfyUI workflow"**

**原因**：JSON 格式不正确或缺少必要节点

**解决**：
- 确保包含 `KSampler` 节点
- 使用 ComfyUI 的 "Save (API Format)" 导出
- 检查 JSON 语法是否正确

---

### **Q3: 删除工作流提示"Cannot delete default workflow"**

**这是正常的**！默认工作流受保护，不可删除。

要测试删除功能，请先上传一个自定义工作流，然后删除它。

---

### **Q4: ComfyUI 连接测试失败**

**可能原因**：
1. ComfyUI 未启动
2. 地址或端口错误
3. Docker 网络问题

**解决**：
```bash
# 检查 ComfyUI 是否运行
curl http://localhost:8188/system_stats

# Docker 环境下
docker ps | grep comfyui
docker logs comfyui
```

---

## 📊 测试结果解读

### **全部通过** ✅
```
总计: 6/6 通过
🎉 所有测试通过！
```
→ API 配置功能完全正常，可以开始使用

### **部分失败** ⚠️
```
总计: 4/6 通过
⚠️  2 个测试失败，请检查日志
```
→ 查看失败的测试项，根据错误信息排查

### **全部失败** ❌
```
总计: 0/6 通过
```
→ 检查后端服务是否正常运行
→ 检查端口是否正确（8000）
→ 查看后端日志

---

## 🎯 下一步

测试通过后，你可以：

1. **启动前端**
   ```bash
   cd frontend
   npm run dev
   ```

2. **访问应用**
   - 打开浏览器访问 `http://localhost:5173`
   - 进入 API 配置页面
   - 配置你的生图服务

3. **开始生图**
   - 配置完成后
   - 在聊天界面输入生图请求
   - 等待图片生成

---

## 📝 附录

### **工作流文件格式**

必须是 ComfyUI API 格式的 JSON：

```json
{
  "node_id": {
    "inputs": {...},
    "class_type": "NodeType",
    "_meta": {"title": "Display Name"}
  }
}
```

### **必需的节点类型**

- `KSampler` - 采样器（必需）
- `CheckpointLoaderSimple` - 模型加载器
- `EmptyLatentImage` - 潜变量图像
- `CLIPTextEncode` - 文本编码器（正向和负向）
- `VAEDecode` - VAE 解码器
- `SaveImage` - 保存图像

### **API 端点列表**

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/api-config/comfyui/workflows` | 列出工作流 |
| POST | `/api/api-config/comfyui/workflows/upload` | 上传工作流 |
| DELETE | `/api/api-config/comfyui/workflows/{filename}` | 删除工作流 |
| GET | `/api/api-config/comfyui/workflows/{filename}` | 获取工作流详情 |
| POST | `/api/api-config/test-comfyui-connection` | 测试 ComfyUI |
| POST | `/api/api-config/test-cloud-connection` | 测试云端 API |

---

**祝测试顺利！** 🎉
