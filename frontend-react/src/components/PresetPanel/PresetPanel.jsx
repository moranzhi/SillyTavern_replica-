import React from 'react';
import './PresetPanel.css';

const PresetPanel = () => {
  return (
    <div className="preset-panel">
      {/* 顶部：预设选择与输入 */}
      <div className="preset-header">
        {/* 下拉框 */}
        <select className="preset-select">
          <option>选择预设...</option>
        </select>
        {/* 输入框组（待定） */}
        <div className="preset-inputs">
          {/* inputs here */}
        </div>
      </div>

      {/* 下方：大槽位区域 */}
      <div className="preset-slots">
        {/* 槽位列表 */}
        <div className="slot-item">槽位 1</div>
        <div className="slot-item">槽位 2</div>
        {/* ... */}
      </div>
    </div>
  );
};

export default PresetPanel;
