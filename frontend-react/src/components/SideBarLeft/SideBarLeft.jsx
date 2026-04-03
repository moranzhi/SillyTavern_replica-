// frontend-react/src/components/SideBarLeft/SideBarLeft.jsx
import React, { useState } from 'react';
import './SideBarLeft.css';

const SideBarLeft = () => {
  const [activeTab, setActiveTab] = useState('gallery');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="sidebar-left">
      <div className="sidebar-tabs">
        <button
          className={`tab-button ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => handleTabChange('gallery')}
        >
          🖼️ 画廊
        </button>
        <button
          className={`tab-button ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => handleTabChange('config')}
        >
          ⚙️ 配置
        </button>
        <button
          className={`tab-button ${activeTab === 'worldbook' ? 'active' : ''}`}
          onClick={() => handleTabChange('worldbook')}
        >
          🌍 世界书
        </button>
      </div>

      <div className="sidebar-content">
        {activeTab === 'gallery' && <div className="tab-content">画廊内容</div>}
        {activeTab === 'config' && <div className="tab-content">配置内容</div>}
        {activeTab === 'worldbook' && <div className="tab-content">世界书内容</div>}
      </div>
    </div>
  );
};

export default SideBarLeft;
