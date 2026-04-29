# 前端组件目录重构脚本
# 使用方法：在 PowerShell 中运行 .\restructure-components.ps1

$ErrorActionPreference = "Stop"
$rootPath = "D:\progarm\python\llm_workflow_engine\frontend\src\components"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  前端组件目录重构脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否在项目根目录
if (-not (Test-Path "$rootPath\TopBar")) {
    Write-Host "❌ 错误：请先确保已创建基础目录结构" -ForegroundColor Red
    exit 1
}

Set-Location $rootPath

try {
    # ==================== 步骤 1: 移动 TopBar 文件 ====================
    Write-Host "[1/7] 移动 TopBar 文件..." -ForegroundColor Yellow
    
    if (Test-Path "ToolBar\ToolBar.jsx") {
        Move-Item "ToolBar\ToolBar.jsx" "TopBar\TopBar.jsx" -Force
        Write-Host "  ✓ 移动 ToolBar.jsx → TopBar/TopBar.jsx" -ForegroundColor Green
    }
    
    if (Test-Path "ToolBar\ToolBar.css") {
        Move-Item "ToolBar\ToolBar.css" "TopBar\TopBar.css" -Force
        Write-Host "  ✓ 移动 ToolBar.css → TopBar/TopBar.css" -ForegroundColor Green
    }
    
    # 创建 items 目录
    New-Item -ItemType Directory -Path "TopBar\items" -Force | Out-Null
    
    # 移动 CurrentUserRole
    if (Test-Path "ToolBar\CurrentUserRole") {
        New-Item -ItemType Directory -Path "TopBar\items\CurrentUserRole" -Force | Out-Null
        
        Get-ChildItem "ToolBar\CurrentUserRole" -File | ForEach-Object {
            Move-Item $_.FullName "TopBar\items\CurrentUserRole\$($_.Name)" -Force
            Write-Host "  ✓ 移动 CurrentUserRole/$($_.Name)" -ForegroundColor Green
        }
    }
    
    # 移动 RoleSelector（如果存在文件）
    if (Test-Path "ToolBar\RoleSelector") {
        New-Item -ItemType Directory -Path "TopBar\items\RoleSelector" -Force | Out-Null
        
        Get-ChildItem "ToolBar\RoleSelector" -File | ForEach-Object {
            Move-Item $_.FullName "TopBar\items\RoleSelector\$($_.Name)" -Force
            Write-Host "  ✓ 移动 RoleSelector/$($_.Name)" -ForegroundColor Green
        }
    }
    
    Write-Host ""
    
    # ==================== 步骤 2: 重组 SideBarLeft ====================
    Write-Host "[2/7] 重组 SideBarLeft..." -ForegroundColor Yellow
    
    $leftTabs = @("ApiConfig", "Gallery", "Presets", "WorldBook")
    foreach ($tab in $leftTabs) {
        New-Item -ItemType Directory -Path "SideBarLeft\tabs\$tab" -Force | Out-Null
        
        if (Test-Path "SideBarLeft\tab\$tab.jsx") {
            Move-Item "SideBarLeft\tab\$tab.jsx" "SideBarLeft\tabs\$tab\$tab.jsx" -Force
            Write-Host "  ✓ 移动 tab/$tab.jsx → tabs/$tab/" -ForegroundColor Green
        }
        
        if (Test-Path "SideBarLeft\tabcss\$tab.css") {
            Move-Item "SideBarLeft\tabcss\$tab.css" "SideBarLeft\tabs\$tab\$tab.css" -Force
            Write-Host "  ✓ 移动 tabcss/$tab.css → tabs/$tab/" -ForegroundColor Green
        }
    }
    
    # 删除旧目录
    if (Test-Path "SideBarLeft\tab") {
        Remove-Item "SideBarLeft\tab" -Recurse -Force
        Write-Host "  ✓ 删除旧的 tab/ 目录" -ForegroundColor Green
    }
    
    if (Test-Path "SideBarLeft\tabcss") {
        Remove-Item "SideBarLeft\tabcss" -Recurse -Force
        Write-Host "  ✓ 删除旧的 tabcss/ 目录" -ForegroundColor Green
    }
    
    Write-Host ""
    
    # ==================== 步骤 3: 重组 SideBarRight ====================
    Write-Host "[3/7] 重组 SideBarRight..." -ForegroundColor Yellow
    
    $rightTabs = @("Debug", "Dice", "Macros", "Table")
    foreach ($tab in $rightTabs) {
        New-Item -ItemType Directory -Path "SideBarRight\tabs\$tab" -Force | Out-Null
        
        if (Test-Path "SideBarRight\tab\$tab.jsx") {
            Move-Item "SideBarRight\tab\$tab.jsx" "SideBarRight\tabs\$tab\$tab.jsx" -Force
            Write-Host "  ✓ 移动 tab/$tab.jsx → tabs/$tab/" -ForegroundColor Green
        }
        
        # 检查是否有对应的 CSS 文件
        $cssFile = "SideBarRight\tabcss\$tab.css"
        if (Test-Path $cssFile) {
            Move-Item $cssFile "SideBarRight\tabs\$tab\$tab.css" -Force
            Write-Host "  ✓ 移动 tabcss/$tab.css → tabs/$tab/" -ForegroundColor Green
        }
    }
    
    # 删除旧目录
    if (Test-Path "SideBarRight\tab") {
        Remove-Item "SideBarRight\tab" -Recurse -Force
        Write-Host "  ✓ 删除旧的 tab/ 目录" -ForegroundColor Green
    }
    
    if (Test-Path "SideBarRight\tabcss") {
        Remove-Item "SideBarRight\tabcss" -Recurse -Force
        Write-Host "  ✓ 删除旧的 tabcss/ 目录" -ForegroundColor Green
    }
    
    Write-Host ""
    
    # ==================== 步骤 4: 移动 ChatBox 到 Mid ====================
    Write-Host "[4/7] 移动 ChatBox 到 Mid..." -ForegroundColor Yellow
    
    if (Test-Path "ChatBox") {
        Get-ChildItem "ChatBox" -File | ForEach-Object {
            Move-Item $_.FullName "Mid\ChatBox\$($_.Name)" -Force
            Write-Host "  ✓ 移动 ChatBox/$($_.Name) → Mid/ChatBox/" -ForegroundColor Green
        }
        
        Remove-Item "ChatBox" -Recurse -Force
        Write-Host "  ✓ 删除旧的 ChatBox/ 目录" -ForegroundColor Green
    }
    
    Write-Host ""
    
    # ==================== 步骤 5: 移动 Markdown2Html 到 shared ====================
    Write-Host "[5/7] 移动 Markdown2Html 到 shared..." -ForegroundColor Yellow
    
    if (Test-Path "Markdown2Html") {
        New-Item -ItemType Directory -Path "shared\Markdown2Html" -Force | Out-Null
        
        Get-ChildItem "Markdown2Html" -File | ForEach-Object {
            Move-Item $_.FullName "shared\Markdown2Html\$($_.Name)" -Force
            Write-Host "  ✓ 移动 Markdown2Html/$($_.Name) → shared/Markdown2Html/" -ForegroundColor Green
        }
        
        Remove-Item "Markdown2Html" -Recurse -Force
        Write-Host "  ✓ 删除旧的 Markdown2Html/ 目录" -ForegroundColor Green
    }
    
    Write-Host ""
    
    # ==================== 步骤 6: 清理 ToolBar 目录 ====================
    Write-Host "[6/7] 清理 ToolBar 目录..." -ForegroundColor Yellow
    
    if (Test-Path "ToolBar") {
        Remove-Item "ToolBar" -Recurse -Force
        Write-Host "  ✓ 删除 ToolBar/ 目录" -ForegroundColor Green
    }
    
    Write-Host ""
    
    # ==================== 步骤 7: 创建 index.js 文件 ====================
    Write-Host "[7/7] 创建 index.js 导出文件..." -ForegroundColor Yellow
    
    # TopBar
    @"
export { default } from './TopBar';
"@ | Out-File -FilePath "TopBar\index.js" -Encoding utf8
    Write-Host "  ✓ 创建 TopBar/index.js" -ForegroundColor Green
    
    # TopBar items
    if (Test-Path "TopBar\items\CurrentUserRole\CurrentUserRole.jsx") {
        @"
export { default } from './CurrentUserRole';
"@ | Out-File -FilePath "TopBar\items\CurrentUserRole\index.js" -Encoding utf8
        Write-Host "  ✓ 创建 TopBar/items/CurrentUserRole/index.js" -ForegroundColor Green
    }
    
    if (Test-Path "TopBar\items\RoleSelector\RoleSelector.jsx") {
        @"
export { default } from './RoleSelector';
"@ | Out-File -FilePath "TopBar\items\RoleSelector\index.js" -Encoding utf8
        Write-Host "  ✓ 创建 TopBar/items/RoleSelector/index.js" -ForegroundColor Green
    }
    
    # SideBarLeft
    @"
export { default } from './SideBarLeft';
"@ | Out-File -FilePath "SideBarLeft\index.js" -Encoding utf8
    Write-Host "  ✓ 创建 SideBarLeft/index.js" -ForegroundColor Green
    
    # SideBarLeft tabs
    foreach ($tab in $leftTabs) {
        if (Test-Path "SideBarLeft\tabs\$tab\$tab.jsx") {
            @"
export { default } from './$tab';
"@ | Out-File -FilePath "SideBarLeft\tabs\$tab\index.js" -Encoding utf8
            Write-Host "  ✓ 创建 SideBarLeft/tabs/$tab/index.js" -ForegroundColor Green
        }
    }
    
    # SideBarRight
    @"
export { default } from './SideBarRight';
"@ | Out-File -FilePath "SideBarRight\index.js" -Encoding utf8
    Write-Host "  ✓ 创建 SideBarRight/index.js" -ForegroundColor Green
    
    # SideBarRight tabs
    foreach ($tab in $rightTabs) {
        if (Test-Path "SideBarRight\tabs\$tab\$tab.jsx") {
            @"
export { default } from './$tab';
"@ | Out-File -FilePath "SideBarRight\tabs\$tab\index.js" -Encoding utf8
            Write-Host "  ✓ 创建 SideBarRight/tabs/$tab/index.js" -ForegroundColor Green
        }
    }
    
    # Mid
    @"
// Mid 区域主组件
// 目前主要包含 ChatBox
export { default as ChatBox } from './ChatBox';
"@ | Out-File -FilePath "Mid\index.js" -Encoding utf8
    Write-Host "  ✓ 创建 Mid/index.js" -ForegroundColor Green
    
    # Mid/ChatBox
    @"
export { default } from './ChatBox';
"@ | Out-File -FilePath "Mid\ChatBox\index.js" -Encoding utf8
    Write-Host "  ✓ 创建 Mid/ChatBox/index.js" -ForegroundColor Green
    
    # shared/Markdown2Html
    @"
export { default } from './Markdown2Html';
"@ | Out-File -FilePath "shared\Markdown2Html\index.js" -Encoding utf8
    Write-Host "  ✓ 创建 shared/Markdown2Html/index.js" -ForegroundColor Green
    
    Write-Host ""
    
    # ==================== 完成 ====================
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  ✅ 目录结构重构完成！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  下一步：" -ForegroundColor Yellow
    Write-Host "  1. 检查所有导入路径是否正确" -ForegroundColor White
    Write-Host "  2. 更新 App.jsx 中的组件导入" -ForegroundColor White
    Write-Host "  3. 运行 npm run dev 测试项目" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 详细指南请查看: RESTRUCTURE_GUIDE.md" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ 发生错误: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 提示：可以查看 RESTRUCTURE_GUIDE.md 手动执行重构" -ForegroundColor Yellow
    exit 1
}
