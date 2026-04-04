import React, { useEffect } from 'react';
import './SideBarRight.css';
import Dice from './tab/Dice';
import Debug from './tab/Debug';
import Macros from './tab/Macros';
import Table from './tab/Table';
import useSideBarRightStore from '../../Store/Slices/RightTabsSlices/SideBarRightSlice';

const SideBarRight = () => {
  const { selectedTabs, allTabs, handleTabClick, setTabComponent } = useSideBarRightStore();

  // 设置标签组件
  useEffect(() => {
    setTabComponent('dice', Dice);
    setTabComponent('debug', Debug);
    setTabComponent('macros', Macros);
    setTabComponent('table', Table);
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
