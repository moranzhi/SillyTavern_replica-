// frontend-react/src/components/SideBarLeft/SideBarLeft.jsx
import React from 'react';
import './SideBarLeft.css';
import { useSideBarLeftStore } from '../../Store/indexStore';
import useSideBarRightStore from '../../Store/Slices/SideBarLeftSlice';
import Gallery from './tab/Gallery';
import ApiConfig from './tab/ApiConfig';
import Presets from './tab/Presets';
import WorldBook from './tab/WorldBook';

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
        {activeTab === 'gallery' && <Gallery />}
        {activeTab === 'api' && <ApiConfig />}
        {activeTab === 'presets' && <Presets />}
        {activeTab === 'worldbook' && <WorldBook />}
      </div>
    </div>
  );
};

export default SideBarLeft;
