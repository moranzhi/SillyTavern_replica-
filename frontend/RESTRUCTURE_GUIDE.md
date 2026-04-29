# 前端组件目录重构指南

## 📋 重构目标

将现有的按技术类型分类的组件结构，重构为按**布局区域 + 从属关系**分类的结构。

---

## 🎯 当前结构 vs 目标结构

### 当前结构
```
components/
├── ChatBox/
│   ├── ChatBox.css
│   └── ChatBox.jsx
├── Markdown2Html/
│   ├── Markdown2Html.jsx
│   └── MarkdownRender.js
├── SideBarLeft/
│   ├── SideBarLeft.css
│   ├── SideBarLeft.jsx
│   ├── tab/
│   │   ├── ApiConfig.jsx
│   │   ├── Gallery.jsx
│   │   ├── Presets.jsx
│   │   └── WorldBook.jsx
│   └── tabcss/
│       ├── ApiConfig.css
│       ├── Gallery.css
│       ├── Presets.css
│       └── WorldBook.css
├── SideBarRight/
│   ├── SideBarRight.css
│   ├── SideBarRight.jsx
│   └── tab/
│       ├── Debug.jsx
│       ├── Dice.jsx
│       ├── Macros.jsx
│       └── Table.jsx
└── ToolBar/
    ├── CurrentUserRole/
    │   └── CurrentUserRole.css
    ├── RoleSelector/
    ├── ToolBar.css
    └── ToolBar.jsx
```

### 目标结构
```
components/
├── TopBar/                      # 顶部工具栏
│   ├── TopBar.jsx              (原 ToolBar.jsx)
│   ├── TopBar.css              (原 ToolBar.css)
│   ├── index.js                (新建)
│   └── items/                  (新建)
│       ├── RoleSelector/       (原 ToolBar/RoleSelector/)
│       │   ├── RoleSelector.jsx
│       │   ├── RoleSelector.css
│       │   └── index.js
│       └── CurrentUserRole/    (原 ToolBar/CurrentUserRole/)
│           ├── CurrentUserRole.jsx
│           ├── CurrentUserRole.css
│           └── index.js
│
├── SideBarLeft/                 # 左侧边栏
│   ├── SideBarLeft.jsx         (保留)
│   ├── SideBarLeft.css         (保留)
│   ├── index.js                (新建)
│   └── tabs/                   (原 tab/ + tabcss/ 合并)
│       ├── ApiConfig/
│       │   ├── ApiConfig.jsx   (原 tab/ApiConfig.jsx)
│       │   ├── ApiConfig.css   (原 tabcss/ApiConfig.css)
│       │   └── index.js
│       ├── Gallery/
│       │   ├── Gallery.jsx
│       │   ├── Gallery.css
│       │   └── index.js
│       ├── Presets/
│       │   ├── Presets.jsx
│       │   ├── Presets.css
│       │   └── index.js
│       └── WorldBook/
│           ├── WorldBook.jsx
│           ├── WorldBook.css
│           └── index.js
│
├── SideBarRight/                # 右侧边栏
│   ├── SideBarRight.jsx        (保留)
│   ├── SideBarRight.css        (保留)
│   ├── index.js                (新建)
│   └── tabs/                   (原 tab/)
│       ├── Debug/
│       │   ├── Debug.jsx
│       │   ├── Debug.css
│       │   └── index.js
│       ├── Dice/
│       │   ├── Dice.jsx
│       │   ├── Dice.css
│       │   └── index.js
│       ├── Macros/
│       │   ├── Macros.jsx
│       │   ├── Macros.css
│       │   └── index.js
│       └── Table/
│           ├── Table.jsx
│           ├── Table.css
│           └── index.js
│
├── Mid/                         # 中间主内容区
│   ├── Mid.jsx                 (新建，可选)
│   ├── Mid.css                 (新建，可选)
│   ├── index.js                (新建)
│   └── ChatBox/                (原 ChatBox/)
│       ├── ChatBox.jsx         (保留)
│       ├── ChatBox.css         (保留)
│       ├── index.js            (新建)
│       └── subcomponents/      (新建，为未来扩展预留)
│
└── shared/                      # 共享组件
    └── Markdown2Html/          (原 Markdown2Html/)
        ├── Markdown2Html.jsx   (保留)
        ├── MarkdownRender.js   (保留)
        └── index.js            (新建)
```

---

## 🔧 重构步骤

### 步骤 1: 备份当前代码（重要！）

```powershell
# 在 project 根目录执行
git add .
git commit -m "backup: before component restructuring"
```

### 步骤 2: 创建新目录结构

已执行 ✅

### 步骤 3: 移动 TopBar 相关组件

#### 3.1 移动 ToolBar 主文件
```powershell
Move-Item "components\ToolBar\ToolBar.jsx" "components\TopBar\TopBar.jsx"
Move-Item "components\ToolBar\ToolBar.css" "components\TopBar\TopBar.css"
```

#### 3.2 创建 items 目录并移动子组件
```powershell
# 创建 RoleSelector 组件目录
New-Item -ItemType Directory -Path "components\TopBar\items\RoleSelector" -Force
# 如果 RoleSelector 有文件，移动它们
# Move-Item "components\ToolBar\RoleSelector\*" "components\TopBar\items\RoleSelector\"

# 移动 CurrentUserRole
New-Item -ItemType Directory -Path "components\TopBar\items\CurrentUserRole" -Force
Move-Item "components\ToolBar\CurrentUserRole\CurrentUserRole.css" "components\TopBar\items\CurrentUserRole\CurrentUserRole.css"
# 注意：需要找到 CurrentUserRole.jsx 并移动
```

### 步骤 4: 重组 SideBarLeft

#### 4.1 合并 tab/ 和 tabcss/ 到 tabs/
```powershell
# 为每个标签页创建独立目录
$tabs = @("ApiConfig", "Gallery", "Presets", "WorldBook")
foreach ($tab in $tabs) {
    New-Item -ItemType Directory -Path "components\SideBarLeft\tabs\$tab" -Force
    Move-Item "components\SideBarLeft\tab\$tab.jsx" "components\SideBarLeft\tabs\$tab\$tab.jsx"
    if (Test-Path "components\SideBarLeft\tabcss\$tab.css") {
        Move-Item "components\SideBarLeft\tabcss\$tab.css" "components\SideBarLeft\tabs\$tab\$tab.css"
    }
}
```

#### 4.2 删除旧的 tab/ 和 tabcss/ 目录
```powershell
Remove-Item "components\SideBarLeft\tab" -Recurse -Force
Remove-Item "components\SideBarLeft\tabcss" -Recurse -Force
```

### 步骤 5: 重组 SideBarRight

```powershell
$tabs = @("Debug", "Dice", "Macros", "Table")
foreach ($tab in $tabs) {
    New-Item -ItemType Directory -Path "components\SideBarRight\tabs\$tab" -Force
    Move-Item "components\SideBarRight\tab\$tab.jsx" "components\SideBarRight\tabs\$tab\$tab.jsx"
    # 如果有 CSS 文件也移动
}

Remove-Item "components\SideBarRight\tab" -Recurse -Force
```

### 步骤 6: 移动 Mid/ChatBox

```powershell
# 移动 ChatBox 到 Mid 下
Move-Item "components\ChatBox\*" "components\Mid\ChatBox\"
Remove-Item "components\ChatBox" -Recurse -Force
```

### 步骤 7: 移动 shared 组件

```powershell
Move-Item "components\Markdown2Html\*" "components\shared\Markdown2Html\"
Remove-Item "components\Markdown2Html" -Recurse -Force
```

### 步骤 8: 清理空的 ToolBar 目录

```powershell
Remove-Item "components\ToolBar" -Recurse -Force
```

### 步骤 9: 为每个组件创建 index.js

为每个组件目录创建 `index.js` 文件，例如：

```javascript
// components/TopBar/index.js
export { default } from './TopBar';
export * from './TopBar';

// components/TopBar/items/RoleSelector/index.js
export { default } from './RoleSelector';

// components/SideBarLeft/tabs/ApiConfig/index.js
export { default } from './ApiConfig';

// ... 依此类推
```

### 步骤 10: 更新所有导入路径

需要更新的文件：
1. `App.jsx` - 主应用入口
2. 所有组件文件中的相互引用
3. Store 文件中可能引用的组件

#### 导入路径映射表

| 原路径 | 新路径 |
|--------|--------|
| `@/components/ToolBar/ToolBar` | `@/components/TopBar` |
| `@/components/ToolBar/items/RoleSelector` | `@/components/TopBar/items/RoleSelector` |
| `@/components/SideBarLeft/tab/ApiConfig` | `@/components/SideBarLeft/tabs/ApiConfig` |
| `@/components/SideBarLeft/tab/Presets` | `@/components/SideBarLeft/tabs/Presets` |
| `@/components/SideBarLeft/tab/WorldBook` | `@/components/SideBarLeft/tabs/WorldBook` |
| `@/components/ChatBox/ChatBox` | `@/components/Mid/ChatBox` |
| `@/components/Markdown2Html/Markdown2Html` | `@/components/shared/Markdown2Html` |

---

## ⚠️ 注意事项

### 1. CSS 导入路径
如果组件内部通过 `import './Component.css'` 导入样式，移动后无需修改。
如果使用绝对路径或别名，需要更新。

### 2. 相对路径导入
检查所有组件间的相对路径导入，例如：
```javascript
// 之前
import ApiConfig from '../tab/ApiConfig';

// 之后
import ApiConfig from './tabs/ApiConfig';
```

### 3. Vite 配置
确保 `vite.config.js` 中的路径别名仍然有效：
```javascript
resolve: {
  alias: {
    '@': '/src',
  }
}
```

### 4. 测试
重构完成后，运行以下命令验证：
```bash
npm run dev
# 检查是否有导入错误
# 检查页面是否正常显示
```

---

## 📝 PowerShell 自动化脚本

将以下脚本保存为 `restructure-components.ps1` 并执行：

```powershell
# 设置工作目录
$rootPath = "D:\progarm\python\llm_workflow_engine\frontend\src\components"
Set-Location $rootPath

Write-Host "开始重构组件目录结构..." -ForegroundColor Green

# 1. 移动 TopBar 文件
Write-Host "移动 TopBar 文件..." -ForegroundColor Yellow
Move-Item "ToolBar\ToolBar.jsx" "TopBar\TopBar.jsx" -Force
Move-Item "ToolBar\ToolBar.css" "TopBar\TopBar.css" -Force

# 2. 移动 CurrentUserRole
Write-Host "移动 CurrentUserRole..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "TopBar\items\CurrentUserRole" -Force | Out-Null
if (Test-Path "ToolBar\CurrentUserRole\CurrentUserRole.jsx") {
    Move-Item "ToolBar\CurrentUserRole\CurrentUserRole.jsx" "TopBar\items\CurrentUserRole\CurrentUserRole.jsx" -Force
}
if (Test-Path "ToolBar\CurrentUserRole\CurrentUserRole.css") {
    Move-Item "ToolBar\CurrentUserRole\CurrentUserRole.css" "TopBar\items\CurrentUserRole\CurrentUserRole.css" -Force
}

# 3. 重组 SideBarLeft
Write-Host "重组 SideBarLeft..." -ForegroundColor Yellow
$leftTabs = @("ApiConfig", "Gallery", "Presets", "WorldBook")
foreach ($tab in $leftTabs) {
    New-Item -ItemType Directory -Path "SideBarLeft\tabs\$tab" -Force | Out-Null
    if (Test-Path "SideBarLeft\tab\$tab.jsx") {
        Move-Item "SideBarLeft\tab\$tab.jsx" "SideBarLeft\tabs\$tab\$tab.jsx" -Force
    }
    if (Test-Path "SideBarLeft\tabcss\$tab.css") {
        Move-Item "SideBarLeft\tabcss\$tab.css" "SideBarLeft\tabs\$tab\$tab.css" -Force
    }
}
Remove-Item "SideBarLeft\tab" -Recurse -Force
Remove-Item "SideBarLeft\tabcss" -Recurse -Force

# 4. 重组 SideBarRight
Write-Host "重组 SideBarRight..." -ForegroundColor Yellow
$rightTabs = @("Debug", "Dice", "Macros", "Table")
foreach ($tab in $rightTabs) {
    New-Item -ItemType Directory -Path "SideBarRight\tabs\$tab" -Force | Out-Null
    if (Test-Path "SideBarRight\tab\$tab.jsx") {
        Move-Item "SideBarRight\tab\$tab.jsx" "SideBarRight\tabs\$tab\$tab.jsx" -Force
    }
}
Remove-Item "SideBarRight\tab" -Recurse -Force

# 5. 移动 ChatBox 到 Mid
Write-Host "移动 ChatBox 到 Mid..." -ForegroundColor Yellow
Move-Item "ChatBox\*" "Mid\ChatBox\" -Force
Remove-Item "ChatBox" -Recurse -Force

# 6. 移动 Markdown2Html 到 shared
Write-Host "移动 Markdown2Html 到 shared..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "shared\Markdown2Html" -Force | Out-Null
Move-Item "Markdown2Html\*" "shared\Markdown2Html\" -Force
Remove-Item "Markdown2Html" -Recurse -Force

# 7. 清理 ToolBar
Write-Host "清理 ToolBar 目录..." -ForegroundColor Yellow
Remove-Item "ToolBar" -Recurse -Force

Write-Host "✅ 目录结构重构完成！" -ForegroundColor Green
Write-Host "⚠️  请手动创建 index.js 文件并更新导入路径" -ForegroundColor Yellow
```

---

## ✅ 验证清单

重构完成后，检查以下项目：

- [ ] 所有文件都已移动到正确位置
- [ ] 旧目录已删除
- [ ] 每个组件目录都有 `index.js`
- [ ] 所有导入路径已更新
- [ ] 项目可以正常启动 (`npm run dev`)
- [ ] 没有控制台错误
- [ ] 所有功能正常工作

---

## 🆘 遇到问题？

如果重构过程中遇到问题：

1. **Git 回滚**
   ```bash
   git reset --hard HEAD
   ```

2. **检查文件位置**
   ```powershell
   Get-ChildItem -Recurse -Filter "*.jsx" | Select-Object FullName
   ```

3. **查找未更新的导入**
   ```powershell
   Select-String -Path "*.jsx" -Pattern "from.*ToolBar"
   ```

---

## 📞 需要帮助？

如果需要我帮你执行具体的移动操作或更新导入路径，请告诉我！
