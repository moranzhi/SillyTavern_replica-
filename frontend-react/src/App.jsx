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
          <SideBarLeft />

        {/* 中间栏：聊天框 */}
        <div className="chat-area">
          <ChatBox />
        </div>

        {/* 右侧栏 */}
          <SideBarRight />
      </div>
    </div>
  );
}

export default App;
