// frontend-react/src/components/SideBarRight/SideBarRight.jsx
import React, { useState } from 'react';
import './SideBarRight.css';
import DicePanel from '../DicePanel/DicePanel';
import ImageDisplay from '../ImageDisplay/ImageDisplay';

const SideBarRight = () => {
  const [topActiveTab, setTopActiveTab] = useState('dice');
  const [bottomActiveTab, setBottomActiveTab] = useState('macros');

  const handleTopTabChange = (tab) => {
    setTopActiveTab(tab);
  };

  const handleBottomTabChange = (tab) => {
    setBottomActiveTab(tab);
  };

  return (
    <div className="sidebar-right">
      <div className="right-top">
        <div className="sidebar-tabs">
          <button
            className={`tab-button ${topActiveTab === 'dice' ? 'active' : ''}`}
            onClick={() => handleTopTabChange('dice')}
          >
            🎲 骰子与工具
          </button>
          <button
            className={`tab-button ${topActiveTab === 'debug' ? 'active' : ''}`}
            onClick={() => handleTopTabChange('debug')}
          >
            🔍 上下文调试
          </button>
        </div>

        <div className="sidebar-content">
          {topActiveTab === 'dice' && <DicePanel />}
          {topActiveTab === 'debug' && <div className="tab-content">上下文调试内容</div>}
        </div>
      </div>

      <div className="right-bottom">
        <div className="sidebar-tabs">
          <button
            className={`tab-button ${bottomActiveTab === 'macros' ? 'active' : ''}`}
            onClick={() => handleBottomTabChange('macros')}
          >
            🔧 快捷宏
          </button>
          <button
            className={`tab-button ${bottomActiveTab === 'table' ? 'active' : ''}`}
            onClick={() => handleBottomTabChange('table')}
          >
            📊 动态表格
          </button>
        </div>

        <div className="sidebar-content">
          {bottomActiveTab === 'macros' && <div className="tab-content">快捷宏内容</div>}
          {bottomActiveTab === 'table' && <div className="tab-content">动态表格内容</div>}
        </div>
      </div>
    </div>
  );
};

export default SideBarRight;
