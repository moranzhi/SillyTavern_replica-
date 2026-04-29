// frontend-react/src/App.jsx
import React from 'react';
import TopBar from './components/TopBar';
import { ChatBox } from './components/Mid';
import SideBarLeft from './components/SideBarLeft';
import SideBarRight from './components/SideBarRight';
import './index.css';

function App() {
  return (
    <div className="app">
      <TopBar />

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
