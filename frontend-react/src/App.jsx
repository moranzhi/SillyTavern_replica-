// frontend-react/src/App.jsx
import React from 'react';
import Toolbar from './components/ToolBar/ToolBar';
import ChatBox from './components/ChatBox/ChatBox';
import SideBarLeft from './components/SideBarLeft/SideBarLeft';
import SideBarRight from './components/SideBarRight/SideBarRight';
import './index.css';

function App() {
  return (
    <div className="app">
      <Toolbar />

      {/* 主内容容器 */}
      <div className="main-container">
        {/* 左侧栏 - 预设面板 */}
        <div className="sidebar-left">
          <SideBarLeft />
        </div>

        {/* 中间栏：聊天框 */}
        <div className="chat-area">
          <ChatBox />
        </div>

        {/* 右侧栏 */}
        <div className="sidebar-right">
          <SideBarRight />
        </div>
      </div>
    </div>
  );
}

export default App;
