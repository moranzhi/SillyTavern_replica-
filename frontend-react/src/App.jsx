import React, { useState } from 'react';

// 引入各区域组件
import PresetPanel from './components/PresetPanel';
import ChatBox from './components/ChatBox';
import ImageDisplay from './components/ImageDisplay';
import DicePanel from './components/DicePanel';
import RoleSelector from './components/RoleSelector';

function App() {
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);

  const toggleToolbar = () => {
    setIsToolbarExpanded(!isToolbarExpanded);
  };

  // 处理角色选择变化
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    console.log('选择的角色:', role);
    // 这里可以添加其他逻辑，比如加载角色的聊天记录等
  };

  // 处理聊天选择变化
  const handleChatChange = (role, chat) => {
    setSelectedChat(chat);
    console.log('选择的聊天:', role, chat);
    // 这里可以添加其他逻辑，比如加载聊天内容等
  };

  return (
    <div className="app-container">
      {/* 顶部工具栏 */}
      <header className={`toolbar ${isToolbarExpanded ? 'expanded' : ''}`}>
        {/* 工具栏内容区域 */}
        {isToolbarExpanded && (
          <div className="toolbar-content">
            {/* 角色选择器 */}
            <RoleSelector
              onRoleChange={handleRoleChange}
              onChatChange={handleChatChange}
            />
          </div>
        )}

        {/* 工具栏切换按钮 */}
        <button
          className={`toolbar-toggle-btn ${isToolbarExpanded ? 'expanded' : ''}`}
          onClick={toggleToolbar}
          aria-label="Toggle Toolbar"
        >
          {isToolbarExpanded ? '▼' : '▲'}
        </button>
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
