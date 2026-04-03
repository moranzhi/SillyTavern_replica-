// frontend-react/src/components/SideBarLeft/SideBarLeft.jsx
import React from 'react';
import './SideBarLeft.css';
import { useSideBarLeftStore } from '../../Store/indexStore';
import useSideBarRightStore from '../../Store/Slices/SideBarLeftSlice';

const SideBarLeft = () => {
  const { activeTab, tabs, setActiveTab } = useSideBarLeftStore();

  return (
    <div className="sidebar-left">
      <div className="sidebar-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="sidebar-content">
        {activeTab === 'gallery' && <div className="tab-content">画廊内容</div>}
        {activeTab === 'api' && <div className="tab-content">API配置内容</div>}
        {activeTab === 'presets' && <div className="tab-content">预设配置内容</div>}
        {activeTab === 'worldbook' && <div className="tab-content">世界书内容</div>}
      </div>
    </div>
  );
};

export default SideBarLeft;
