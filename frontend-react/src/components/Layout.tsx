import React, { ReactNode } from 'react';

// --- 1. 定义 Props 接口 ---
interface LayoutProps {
  left?: ReactNode;
  middle?: ReactNode;
  right?: ReactNode;
}

// --- 2. 占位符组件 (当未传入 props 时显示) ---
const SidebarPlaceholder = () => (
  <div className="p-4 space-y-4">
    <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
    <div className="h-32 bg-gray-100 rounded border border-gray-300"></div>
    <div className="h-32 bg-gray-100 rounded border border-gray-300"></div>
  </div>
);

const ChatPlaceholder = () => (
  <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
    <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
    <p>聊天区域加载中...</p>
  </div>
);

const InputPlaceholder = () => (
  <div className="h-full w-full border border-[#0056B3] rounded-lg bg-white p-2 opacity-50">
    <div className="h-full bg-gray-100 rounded animate-pulse"></div>
  </div>
);

const RightPanelPlaceholder = () => (
  <div className="p-4 space-y-4">
    <div className="h-32 bg-gray-100 rounded border border-gray-300"></div>
    <div className="h-32 bg-gray-100 rounded border border-gray-300"></div>
  </div>
);

// --- 3. 主布局组件 ---
const Layout: React.FC<LayoutProps> = ({ left, middle, right }) => {
  return (
    // 1. 最外层容器：全屏高度，浅蓝灰背景，Flex 列布局
    <div className="flex flex-col h-screen bg-[#F0F4F8] text-[#1A1A1A] font-sans overflow-hidden">

      {/* --- 顶部工具栏 --- */}
    <header className="h-14 bg-white border-b border-[#D1D9E6] flex items-center justify-between px-4 shrink-0 z-20 shadow-sm">

      {/* --- 左侧：双层下拉框 (替换原来的 打开/保存按钮) --- */}
      <div className="flex items-center space-x-2">

        {/* 1. 第一层：角色选择 */}
        <select
          value={currentRole || ''}
          onChange={(e) => selectRole(e.target.value)}
          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 bg-white"
        >
          <option value="" disabled>选择角色</option>
          {Object.keys(datasets).map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>

        {/* 2. 第二层：文件选择 (仅在选择角色后显示) */}
        {currentRole && datasets[currentRole] && (
          <div className="flex items-center space-x-1 relative"> {/* relative 用于定位菜单 */}

            <select
              value={currentChatFile || ''}
              onChange={(e) => selectChatFile(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="" disabled>选择记录</option>
              {datasets[currentRole].map((file) => {
                // 去掉 .jsonl 后缀用于显示
                const displayName = file.replace('.jsonl', '');
                return <option key={file} value={file}>{displayName}</option>;
              })}
            </select>

            {/* 3. 操作按钮 (重命名/删除) */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-500 hover:text-blue-600 px-1"
              title="操作"
            >
              ⋮
            </button>

            {/* 悬浮菜单 */}
            {showMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg py-1 z-50 min-w-[100px]">
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  onClick={() => {
                    console.log('重命名功能待实现');
                    setShowMenu(false);
                  }}
                >
                  重命名
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => {
                    console.log('删除功能待实现');
                    setShowMenu(false);
                  }}
                >
                  删除
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- 中间：标题 (替换原来的 AI WorkFlow Engine) --- */}
      {/* 这里留空，或者您可以放一个小的 Logo/图标 */}
      <div className="text-lg font-bold text-[#0056B3]">
        {/* 可以在这里放图标，或者直接留空让布局更紧凑 */}
      </div>

      {/* --- 右侧：设置 (保留原来的代码) --- */}
      <div className="flex items-center space-x-4">
        <button className="text-[#0056B3] font-semibold hover:bg-blue-50 px-3 py-1 rounded transition">
          ⚙️ 设置
        </button>
      </div>
    </header>


      {/* --- 主体区域：三栏布局 --- */}
      <main className="flex-1 flex overflow-hidden">

        {/* --- 左侧栏 (1份) --- */}
        <aside className="w-1/4 bg-white border-r border-[#D1D9E6] overflow-y-auto shrink-0 custom-scrollbar">
          {left || <SidebarPlaceholder />}
        </aside>

        {/* --- 中间栏 (3份) --- */}
        {/* 注意：这里我们假设 middle prop 包含了 ChatWindow 和 InputBox */}
        {/* 如果 middle 为空，我们显示占位符 */}
        <section className="flex-1 flex flex-col border-r border-[#D1D9E6] bg-white relative">
          {middle ? (
            middle
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 bg-[#F0F4F8] custom-scrollbar scroll-smooth">
                <ChatPlaceholder />
              </div>
              <div className="flex-none h-32 border-t border-[#D1D9E6] bg-[#F0F4F8] p-4 shrink-0">
                <InputPlaceholder />
              </div>
            </>
          )}
        </section>

        {/* --- 右侧栏 (1份) --- */}
        <aside className="w-1/4 bg-white overflow-y-auto shrink-0 custom-scrollbar">
          {right || <RightPanelPlaceholder />}
        </aside>

      </main>

      {/* --- 全局滚动条样式 --- */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default Layout;
