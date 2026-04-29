# 🎨 API 配置页面 - 生图功能完善总结

## ✅ 已完成的功能

### **1. 数据结构设计**

#### **imageModel 新结构**
```javascript
imageModel: {
  mode: 'local',  // 'local' | 'cloud'
  
  local: {
    apiUrl: 'http://comfyui:8188',
    websocketEnabled: true,
    queueTimeout: 300,
    defaultWorkflow: 'default_txt2img.json'
  },
  
  cloud: {
    provider: 'dall-e',
    apiUrl: 'https://api.openai.com/v1/images/generations',
    apiKey: '',
    model: 'dall-e-3'
  }
}
```

---

### **2. 前端 UI 组件**

#### **模式切换卡片** ✅
- 🖥️ 本地 ComfyUI
  - 图标 + 标题 + 描述
  - 悬停效果（上浮 + 阴影）
  - 选中状态（高亮边框 + 背景色）
  
- ☁️ 在线 API
  - 同样的交互效果
  - 清晰的视觉区分

#### **本地 ComfyUI 配置表单** ✅
- API 地址输入框
  - 提示：Docker vs 本地运行
- WebSocket 开关（Toggle Switch）
- 队列超时设置（数字输入）
- 默认工作流下拉选择
- 测试连接按钮

#### **云端 API 配置表单** ✅
- 服务提供商选择（DALL-E / Stability AI）
- API Key 输入（密码框）
- 模型选择（根据提供商动态显示）
- 测试连接按钮

#### **ComfyUI 工作流管理器** ✅
- 工作流列表显示
  - 文件名
  - 节点数量
  - 文件大小
  - 默认标记
- 上传按钮（导入 JSON）
- 删除按钮（每个工作流）
- 刷新按钮
- 空状态提示
- 使用说明

---

### **3. 响应式设计** ✅

#### **布局策略**
```css
/* 全局禁止页面级滚动 */
html, body {
  height: 100%;
  overflow: hidden;
}

#root {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 三栏独立滚动 */
.sidebar-left, .chat-area, .sidebar-right {
  overflow-y: auto;
  overflow-x: hidden;
}
```

#### **媒体查询**
```css
@media (max-width: 768px) {
  /* 小屏幕下单列布局 */
  .image-mode-selector {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    flex-direction: column;
  }
}
```

#### **防横向滚动**
```css
.api-config-container {
  max-width: 100%;
  overflow-x: hidden;
}

.form-control {
  max-width: 100%;
  box-sizing: border-box;
}
```

---

### **4. 交互逻辑**

#### **handleChange 支持嵌套路径** ✅
```javascript
// 扁平结构（其他 API）
handleChange(e);

// 嵌套结构（生图配置）
handleChange(e, ['imageModel', 'local', 'apiUrl']);
```

#### **模式切换** ✅
```javascript
handleImageModeChange('local');  // 或 'cloud'
```

#### **修改跟踪** ✅
- 自动标记已修改的配置
- 保存按钮显示修改数量
- 标签页红点提示

---

### **5. 样式系统**

#### **模式卡片** ✅
- Grid 布局（2列）
- 悬停动画（transform + shadow）
- 选中状态（border + background + ring）
- Flexbox 垂直居中内容

#### **开关 Toggle** ✅
- CSS-only 实现
- 平滑过渡动画
- Focus 状态（无障碍）
- 自定义颜色主题

#### **工作流列表** ✅
- 卡片式布局
- 悬停高亮
- 徽章样式（默认标记）
- 滚动容器（max-height）

---

## 📋 **待完成的后端功能**

### **1. 测试连接端点** ⚠️

需要添加两个新的 API 端点：

```python
@router.post("/test-comfyui-connection")
def test_comfyui_connection(config: dict):
    """测试 ComfyUI 连接"""
    # 1. 检查连通性
    # 2. 获取系统信息（VRAM、设备）
    # 3. 返回结果

@router.post("/test-cloud-connection")
def test_cloud_connection(config: dict):
    """测试云端 API 连接"""
    # 1. 验证 API Key
    # 2. 测试请求
    # 3. 返回结果
```

---

### **2. 生图服务** ⚠️

创建 `backend/services/image_generator.py`:

```python
class ImageGenerator:
    def generate_image(self, prompt: str, config: dict):
        if config['mode'] == 'local':
            return self._call_comfyui(prompt, config['local'])
        else:
            return self._call_cloud_api(prompt, config['cloud'])
    
    def _call_comfyui(self, prompt: str, local_config: dict):
        # 1. 加载工作流
        # 2. 替换提示词
        # 3. 发送到 ComfyUI
        # 4. 等待完成
        # 5. 返回图片 URL
    
    def _call_cloud_api(self, prompt: str, cloud_config: dict):
        # 1. 调用 OpenAI/Stability API
        # 2. 返回图片 URL
```

---

### **3. Store 更新** ⚠️

`ApiConfigSlice.jsx` 需要：
- 更新 `saveProfile` 以正确处理嵌套的 `imageModel` 结构
- 确保加密只应用于 `cloud.apiKey`

---

## 🎯 **SillyTavern 布局参考**

### **核心原则**
1. ✅ **无页面级滚动条** - `overflow: hidden` on body
2. ✅ **三栏独立滚动** - 每栏 `overflow-y: auto`
3. ✅ **无横向滚动** - `overflow-x: hidden` everywhere
4. ✅ **Flexbox 布局** - 弹性自适应
5. ✅ **视口高度** - `100vh` / `100dvh`

### **实现细节**

```
┌─────────────────────────────────────────┐
│          TopBar (固定高度)               │
├──────────┬──────────────┬───────────────┤
│          │              │               │
│  Left    │   Center     │   Right       │
│  Panel   │   Panel      │   Panel       │
│          │              │               │
│ scroll ↓ │   scroll ↓   │  scroll ↓     │
│          │              │               │
└──────────┴──────────────┴───────────────┘
```

**CSS 关键代码**:
```css
/* App 根容器 */
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 主布局 */
.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 每个面板 */
.panel {
  overflow-y: auto;
  overflow-x: hidden;
}
```

---

## 🔧 **测试清单**

### **前端测试**
- [ ] 打开 API 配置页面
- [ ] 切换到"🎨 生图"标签
- [ ] 看到模式切换卡片
- [ ] 点击"本地 ComfyUI"卡片
  - [ ] 显示本地配置表单
  - [ ] 显示工作流管理器
- [ ] 点击"在线 API"卡片
  - [ ] 显示云端配置表单
  - [ ] 隐藏工作流管理器
- [ ] 测试表单输入
  - [ ] API 地址输入
  - [ ] WebSocket 开关
  - [ ] 超时设置
  - [ ] 工作流选择
- [ ] 测试上传工作流
  - [ ] 点击"+ 导入工作流"
  - [ ] 选择 JSON 文件
  - [ ] 看到上传成功提示
  - [ ] 列表中显示新工作流
- [ ] 测试删除工作流
  - [ ] 点击删除按钮
  - [ ] 确认删除
  - [ ] 看到删除成功提示
- [ ] 测试响应式
  - [ ] 缩小浏览器窗口
  - [ ] 模式卡片变为单列
  - [ ] 表单行变为垂直排列
- [ ] 检查滚动条
  - [ ] 页面无滚动条
  - [ ] 左侧边栏可垂直滚动
  - [ ] 无横向滚动条

### **后端测试**
```bash
# 测试列出工作流
curl http://localhost:8000/api/api-config/comfyui/workflows

# 测试上传
curl -X POST http://localhost:8000/api/api-config/comfyui/workflows/upload \
  -F "file=@test_workflow.json"

# 测试删除
curl -X DELETE http://localhost:8000/api/api-config/comfyui/workflows/test.json
```

---

## 📝 **使用流程**

### **用户配置 ComfyUI**

1. **选择模式**
   - 点击"🎨 生图"标签
   - 点击"🖥️ 本地 ComfyUI"卡片

2. **填写配置**
   - API 地址：`http://comfyui:8188`（Docker）
   - 启用 WebSocket：✓
   - 队列超时：300 秒
   - 默认工作流：文生图（默认）

3. **管理工作流**
   - 查看默认工作流列表
   - （可选）上传自定义工作流
     - 在 ComfyUI 中设计工作流
     - 导出为 JSON（API Format）
     - 点击"+ 导入工作流"上传

4. **测试连接**
   - 点击"测试连接"按钮
   - 查看 VRAM 和设备信息

5. **保存配置**
   - 点击底部"保存配置"按钮
   - 勾选"🎨 生图"
   - 确认保存

---

### **运行时生图**

```
用户输入："画一只猫"
    ↓
聊天接口检测生图意图
    ↓
读取 imageModel 配置
    ↓
调用 ImageGenerator.generate_image()
    ↓
如果 mode === 'local':
  - 加载工作流 JSON
  - 替换提示词为"画一只猫"
  - 发送到 ComfyUI
  - 等待完成
  - 返回图片 URL
否则:
  - 调用 DALL-E API
  - 返回图片 URL
    ↓
在聊天界面显示图片
```

---

## 🎊 **总结**

### **已完成** ✅
- ✅ 数据结构设计（嵌套结构）
- ✅ 模式切换 UI（Radio 卡片）
- ✅ 本地配置表单（完整字段）
- ✅ 云端配置表单（完整字段）
- ✅ 工作流管理器（CRUD）
- ✅ 响应式设计（移动端适配）
- ✅ 无页面级滚动（SillyTavern 风格）
- ✅ 嵌套路径更新逻辑
- ✅ 修改跟踪系统
- ✅ 测试连接函数（占位）

### **待完成** ⚠️
- ⚠️ 后端测试连接端点
- ⚠️ 生图服务实现
- ⚠️ Store 保存逻辑更新
- ⚠️ 聊天集成

### **架构优势** ✅
- ✅ 清晰的职责分离（前端配置 vs 后端执行）
- ✅ 灵活的模式切换（本地/云端）
- ✅ 工作流由后端管理（易于维护）
- ✅ 响应式布局（多设备支持）
- ✅ 无滚动冲突（SillyTavern 最佳实践）

---

**当前状态**: 🟢 **前端 UI 完成，等待后端服务集成**
