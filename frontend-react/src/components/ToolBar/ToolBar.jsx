// frontend-react/src/components/ToolBar/ToolBar.jsx
import React, { useState, useRef, useEffect } from 'react';
import RoleSelector from '../RoleSelector/RoleSelector';
import useRoleSelectorStore from '../../Store/Slices/RoleSelectorSlice';
import './ToolBar.css';

const Toolbar = () => {
  const [activePanel, setActivePanel] = useState(null);
  const panelRef = useRef(null);
  const selectedRole = useRoleSelectorStore((state) => state.selectedRole);
  const selectedChat = useRoleSelectorStore((state) => state.selectedChat);

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

  // 监听selectedRole和selectedChat的变化
  useEffect(() => {
    console.log('当前选中的角色:', selectedRole);
    console.log('当前选中的聊天:', selectedChat);
    // 这里可以添加其他需要响应角色变化的逻辑
  }, [selectedRole, selectedChat]);

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

  // 截断文本
  const truncateText = (text, maxLength = 20) => {
    if (!text) return '未选择';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // 构建显示文本
  const getDisplayText = () => {
    if (!selectedRole) return '未选择';
    return selectedChat ? `${selectedRole} / ${selectedChat}` : selectedRole;
  };

  return (
    <>
      <div className="toolbar">
        {/* 左侧：当前角色 */}
        <div className="toolbar-section">
          <div className="toolbar-icons">
            <div
              className="toolbar-icon"
              title="当前角色"
              onClick={() => handlePanelToggle('currentRole')}
            >
              👤
              <span className="icon-label">当前角色</span>
            </div>
            <div className="toolbar-display-box">
              {truncateText(getDisplayText())}
            </div>
          </div>
        </div>

        {/* 中间：角色管理 */}
        <div className="toolbar-section">
          <div className="toolbar-icons">
            <div
              className={`toolbar-icon ${activePanel === 'role' ? 'active' : ''}`}
              title="角色管理"
              onClick={() => handlePanelToggle('role')}
            >
              🎭
              <span className="icon-label">全局世界书</span>
            </div>
            <div className="toolbar-display-box">
              {truncateText(getDisplayText())}
            </div>
          </div>
        </div>

        {/* 全局世界书 */}
        <div className="toolbar-section">
          <div className="toolbar-icons">
            <div
              className="toolbar-icon"
              title="全局世界书"
              onClick={() => handlePanelToggle('worldBook')}
            >
              📚
              <span className="icon-label">全局世界书</span>
            </div>
            <div className="toolbar-display-box">
              全局世界书
            </div>
          </div>
        </div>

        {/* 右侧：设置和拓展 */}
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
              title="拓展"
              onClick={() => handlePanelToggle('extensions')}
            >
              ➕
            </div>
          </div>
        </div>
      </div>

      {/* 角色管理面板 */}
      {activePanel === 'role' && (
        <div className="panel-overlay" ref={panelRef}>
          <div className="panel-content">
            <div className="panel-header">
              <h3>用户角色管理</h3>
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

      {/* 当前角色面板（暂时留空） */}
      {activePanel === 'currentRole' && (
        <div className="panel-overlay" ref={panelRef}>
          <div className="panel-content">
            <div className="panel-header">
              <h3>当前ai角色</h3>
              <button className="close-panel-button" onClick={handleClosePanel} title="关闭">
                ✕
              </button>
            </div>
            <div className="panel-body">
              <p>当前角色详情...</p>
            </div>
          </div>
        </div>
      )}

      {/* 全局世界书面板 */}
      {activePanel === 'worldBook' && (
        <div className="panel-overlay" ref={panelRef}>
          <div className="panel-content">
            <div className="panel-header">
              <h3>全局世界书</h3>
              <button className="close-panel-button" onClick={handleClosePanel} title="关闭">
                ✕
              </button>
            </div>
            <div className="panel-body">
              <p>全局世界书内容...</p>
            </div>
          </div>
        </div>
      )}

      {/* 设置面板 */}
      {activePanel === 'settings' && (
        <div className="panel-overlay" ref={panelRef}>
          <div className="panel-content">
            <div className="panel-header">
              <h3>系统设置</h3>
              <button className="close-panel-button" onClick={handleClosePanel} title="关闭">
                ✕
              </button>
            </div>
            <div className="panel-body">
              <p>系统设置内容...</p>
            </div>
          </div>
        </div>
      )}

      {/* 拓展面板 */}
      {activePanel === 'extensions' && (
        <div className="panel-overlay" ref={panelRef}>
          <div className="panel-content">
            <div className="panel-header">
              <h3>功能拓展</h3>
              <button className="close-panel-button" onClick={handleClosePanel} title="关闭">
                ✕
              </button>
            </div>
            <div className="panel-body">
              <p>功能拓展内容...</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Toolbar;