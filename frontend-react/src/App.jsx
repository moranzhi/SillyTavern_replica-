import React, { useState } from 'react';
import Toolbar from './components/Toolbar/Toolbar';
import ChatBox from './components/ChatBox/ChatBox';
import DicePanel from './components/DicePanel/DicePanel';
import ImageDisplay from './components/ImageDisplay/ImageDisplay';
import PresetPanel from './components/PresetPanel/PresetPanel';
import './index.css';

function App() {
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    console.log('角色已更改:', role);
  };

  const handleChatChange = (role, chat) => {
    setSelectedChat(chat);
    console.log('聊天已更改:', role, chat);
  };

  return (
    <div className="app">
      <Toolbar
        isExpanded={isToolbarExpanded}
        onToggle={() => setIsToolbarExpanded(!isToolbarExpanded)}
        onRoleChange={handleRoleChange}
        onChatChange={handleChatChange}
        selectedRole={selectedRole}
      />

      {/* 主内容容器 */}
      <div className="main-container">
        {/* 左侧栏 - 预设面板 */}
        <div className="sidebar-left">
          <PresetPanel />
        </div>

        {/* 中间栏：聊天框 */}
        <div className="chat-area">
          <ChatBox
            selectedRole={selectedRole}
            selectedChat={selectedChat}
          />
        </div>

        {/* 右侧栏 */}
        <div className="sidebar-right">
          <div className="right-top">
            <ImageDisplay />  {/* 图片展示放在顶部 */}
          </div>
          <div className="right-bottom">
            <DicePanel />  {/* 骰子面板放在底部 */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
