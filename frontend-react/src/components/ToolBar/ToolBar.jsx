import React, { useState, useRef } from 'react';
import RoleSelector from '../RoleSelector/RoleSelector';
import './ToolBar.css';

const Toolbar = () => {
  const [activePanel, setActivePanel] = useState(null);
  const panelRef = useRef(null);

  // 点击外部关闭面板
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setActivePanel(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 处理面板切换
  const handlePanelToggle = (panelName) => {
    if (activePanel === panelName) {
      setActivePanel(null);
    } else {
      setActivePanel(panelName);
    }
  };

  // 关闭面板
  const handleClosePanel = () => {
    setActivePanel(null);
  };

  return (
    <>
      <div className="toolbar">
        {/* 左侧工具栏图标 */}
        <div className="toolbar-section">
          <div className="toolbar-icons">
            {/* Logo图标 */}
            <div
              className="toolbar-icon"
              title="首页"
              onClick={() => handlePanelToggle(null)}
            >
              🤖
            </div>
          </div>
        </div>

        {/* 中间操作图标 */}
        <div className="toolbar-section">
          <div className="toolbar-icons">
            {/* 角色选择图标 */}
            <div
              className={`toolbar-icon ${activePanel === 'role' ? 'active' : ''}`}
              title="角色管理"
              onClick={() => handlePanelToggle('role')}
            >
              👤
            </div>
          </div>
        </div>

        {/* 右侧工具栏图标 */}
        <div className="toolbar-section">
          <div className="toolbar-icons" style={{ justifyContent: 'flex-end' }}>
            <div
              className="toolbar-icon"
              title="设置"
              onClick={() => handlePanelToggle('settings')}
            >
              ⚙️
            </div>
            <div
              className="toolbar-icon"
              title="帮助"
              onClick={() => handlePanelToggle('help')}
            >
              ❓
            </div>
          </div>
        </div>
      </div>

      {/* 角色管理面板 */}
      {activePanel === 'role' && (
        <div className="panel-overlay" ref={panelRef}>
          <div className="panel-content">
            <div className="panel-header">
              <h3>角色管理</h3>
              <button className="close-panel-button" onClick={handleClosePanel} title="关闭">
                ✕
              </button>
            </div>
            <div className="panel-body">
              <RoleSelector />
            </div>
          </div>
        </div>
      )}

      {activePanel === 'settings' && (
        <div className="panel-overlay" ref={panelRef}>
          <div className="panel-content">
            <div className="panel-header">
              <h3>设置</h3>
              <button className="close-panel-button" onClick={handleClosePanel} title="关闭">
                ✕
              </button>
            </div>
            <div className="panel-body">
              <p>设置内容...</p>
            </div>
          </div>
        </div>
      )}

      {activePanel === 'help' && (
        <div className="panel-overlay" ref={panelRef}>
          <div className="panel-content">
            <div className="panel-header">
              <h3>帮助</h3>
              <button className="close-panel-button" onClick={handleClosePanel} title="关闭">
                ✕
              </button>
            </div>
            <div className="panel-body">
              <p>帮助内容...</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Toolbar;
