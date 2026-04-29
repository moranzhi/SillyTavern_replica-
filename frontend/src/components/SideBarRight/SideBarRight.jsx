import React, { useEffect, useState, useRef } from 'react';
import './SideBarRight.css';
import Dice from './tabs/Dice';
import Debug from './tabs/Debug';
import Macros from './tabs/Macros';
import Table from './tabs/Table';
import RagRecall from './tabs/RagRecall';
import useSideBarRightStore from '../../Store/SideBarRight/SideBarRightSlice';

const SideBarRight = () => {
  const { selectedTabs, allTabs, handleTabClick, setTabComponent } = useSideBarRightStore();
  
  // 从 localStorage 加载分割线位置，默认 50%
  const [splitPosition, setSplitPosition] = useState(() => {
    const saved = localStorage.getItem('sidebar_right_split');
    return saved ? parseFloat(saved) : 50;
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // 设置标签组件
  useEffect(() => {
    setTabComponent('dice', Dice);
    setTabComponent('debug', Debug);
    setTabComponent('macros', Macros);
    setTabComponent('table', Table);
    setTabComponent('rag', RagRecall);
  }, [setTabComponent]);
  
  // 保存分割线位置到 localStorage
  useEffect(() => {
    localStorage.setItem('sidebar_right_split', splitPosition.toString());
  }, [splitPosition]);
  
  // 处理拖动
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const percentage = (offsetY / rect.height) * 100;
    
    // 限制在 20% - 80% 之间
    const clampedPercentage = Math.min(Math.max(percentage, 20), 80);
    setSplitPosition(clampedPercentage);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // 添加全局事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  return (
    <div className="sidebar-right" ref={containerRef}>
      <div className="sidebar-tabs">
        {allTabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${selectedTabs.includes(tab.id) ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
            title={tab.title}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="sidebar-content">
        {selectedTabs.length === 0 ? (
          <div className="no-tabs-selected">请选择一个分页</div>
        ) : selectedTabs.length === 1 ? (
          // 单个分页时占满全部空间
          <div className="tab-content full-height">
            {(() => {
              const tab = allTabs.find(t => t.id === selectedTabs[0]);
              return tab.component ? <tab.component /> : <div>{tab.label}内容</div>;
            })()}
          </div>
        ) : (
          // 两个分页时显示分割线
          <>
            <div 
              className="tab-content split-top" 
              style={{ height: `${splitPosition}%` }}
            >
              {(() => {
                const tab = allTabs.find(t => t.id === selectedTabs[0]);
                return tab.component ? <tab.component /> : <div>{tab.label}内容</div>;
              })()}
            </div>
            
            <div 
              className={`resize-handle ${isDragging ? 'dragging' : ''}`}
              onMouseDown={handleMouseDown}
              title="拖动调整上下比例"
            >
              <div className="resize-handle-line"></div>
            </div>
            
            <div 
              className="tab-content split-bottom" 
              style={{ height: `${100 - splitPosition}%` }}
            >
              {(() => {
                const tab = allTabs.find(t => t.id === selectedTabs[1]);
                return tab.component ? <tab.component /> : <div>{tab.label}内容</div>;
              })()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SideBarRight;
