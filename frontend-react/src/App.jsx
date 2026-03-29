import React from 'react';
import Toolbar from './components/ToolBar/ToolBar';
import ChatBox from './components/ChatBox/ChatBox';
import DicePanel from './components/DicePanel/DicePanel';
import ImageDisplay from './components/ImageDisplay/ImageDisplay';
import PresetPanel from './components/PresetPanel/PresetPanel';
import './index.css';

function App() {
  return (
    <div className="app">
      <Toolbar />

      {/* 主内容容器 */}
      <div className="main-container">
        {/* 左侧栏 - 预设面板 */}
        <div className="sidebar-left">
          <PresetPanel />
        </div>

        {/* 中间栏：聊天框 */}
        <div className="chat-area">
          <ChatBox />
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
