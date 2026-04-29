// frontend-react/src/components/SideBarLeft/SideBarLeft.jsx
import React from 'react';
import './SideBarLeft.css';
import { useSideBarLeftStore } from '../../Store/indexStore';
import useSideBarRightStore from '../../Store/SideBarLeft/SideBarLeftSlice';
import Gallery from './tabs/Gallery';
import CharacterCard from './tabs/CharacterCard';
import ApiConfig from './tabs/ApiConfig';
import Presets from './tabs/Presets';
import WorldBook from './tabs/WorldBook';

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
            title={tab.title}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="sidebar-content">
        {activeTab === 'gallery' && <Gallery />}
        {activeTab === 'character' && <CharacterCard />}
        {activeTab === 'api' && <ApiConfig />}
        {activeTab === 'presets' && <Presets />}
        {activeTab === 'worldbook' && <WorldBook />}
      </div>
    </div>
  );
};

export default SideBarLeft;
