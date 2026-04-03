import React, { useEffect } from 'react';
import './SideBarRight.css';
import DicePanel from '../DicePanel/DicePanel';
import ImageDisplay from '../ImageDisplay/ImageDisplay';
import useSideBarRightStore from '../../Store/Slices/SideBarRightSlice';

const SideBarRight = () => {
  const { selectedTabs, allTabs, handleTabClick, setTabComponent } = useSideBarRightStore();

  // 设置标签组件
  useEffect(() => {
    setTabComponent('dice', DicePanel);
    // 可以在这里设置其他标签的组件
  }, [setTabComponent]);

  return (
    <div className="sidebar-right">
      <div className="sidebar-tabs">
        {allTabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${selectedTabs.includes(tab.id) ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="sidebar-content">
        {selectedTabs.map(tabId => {
          const tab = allTabs.find(t => t.id === tabId);
          return (
            <div key={tabId} className={`tab-content ${selectedTabs.length === 1 ? 'full-height' : ''}`}>
              {tab.component ? <tab.component /> : <div className="tab-content">{tab.label}内容</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SideBarRight;
