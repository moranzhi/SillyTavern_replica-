import React, { useState } from 'react';

// 引入各区域组件（后续创建）
import PresetPanel from './components/PresetPanel';
import ChatBox from './components/ChatBox';
import ImageDisplay from './components/ImageDisplay';
import DicePanel from './components/DicePanel';

function App() {
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);

  const toggleToolbar = () => {
    setIsToolbarExpanded(!isToolbarExpanded);
  };

  return (
    <div className="app-container">
      {/* 顶部工具栏 */}
      <header className={`toolbar ${isToolbarExpanded ? 'expanded' : ''}`}>
        <div className="toolbar-title">AI Chat Studio</div>
        <button
          className="toolbar-toggle-btn"
          onClick={toggleToolbar}
          aria-label="Toggle Toolbar"
        >
          {isToolbarExpanded ? '▼' : '▲'}
        </button>
        {/* 展开后的内容区域（预留） */}
        {isToolbarExpanded && (
          <div className="toolbar-content">
            {/* 工具栏内容待定 */}
          </div>
        )}
      </header>

      {/* 主体内容区域 */}
      <main className="main-container">

        {/* 左侧：预设栏 (仿AI酒馆) */}
        <section className="sidebar-left">
          <PresetPanel />
        </section>

        {/* 中间：历史对话框 + 输入框 */}
        <section className="chat-area">
          <ChatBox />
        </section>

        {/* 右侧：上下布局 */}
        <section className="sidebar-right">
          {/* 上方：图片展示区 */}
          <div className="right-top">
            <ImageDisplay />
          </div>
          {/* 下方：骰子区 */}
          <div className="right-bottom">
            <DicePanel />
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;
