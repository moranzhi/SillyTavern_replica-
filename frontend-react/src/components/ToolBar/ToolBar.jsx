import React, { useState } from 'react';
import './Toolbar.css';

const Toolbar = ({
  isExpanded,
  onToggle,
  onRoleChange,
  onChatChange
}) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [roleData, setRoleData] = useState({});

  // 获取角色和聊天数据
  React.useEffect(() => {
    const fetchRoleData = async () => {
      try {
        const response = await fetch('/api/get_all_role_and_chat');
        const data = await response.json();
        setRoleData(data);
      } catch (error) {
        console.error('获取角色数据失败:', error);
      }
    };

    fetchRoleData();
  }, []);

  // 处理角色选择
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setSelectedChat(null);
    if (onRoleChange) {
      onRoleChange(role);
    }
  };

  // 处理聊天选择
  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setIsDropdownOpen(false);
    if (onChatChange) {
      onChatChange(selectedRole, chat);
    }
  };

  return (
    <div className={`toolbar ${isExpanded ? 'expanded' : ''}`}>
      <button
        className="toolbar-toggle-btn"
        onClick={onToggle}
      >
        {isExpanded ? '▼' : '▲'}
      </button>

      {isExpanded && (
        <div className="toolbar-content">
          <div className="toolbar-dropdown">
            <label>选择角色</label>
            <div className="dropdown-container">
              <div
                className="dropdown-trigger"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {selectedRole || '选择角色'}
                <span className="dropdown-arrow">▼</span>
              </div>

              {isDropdownOpen && (
                <div className="dropdown-menu">
                  {Object.keys(roleData).map(role => (
                    <div
                      key={role}
                      className={`dropdown-item ${selectedRole === role ? 'selected' : ''}`}
                      onClick={() => handleRoleSelect(role)}
                    >
                      {role}
                      {selectedRole === role && (
                        <div className="nested-dropdown">
                          {roleData[role].map(chat => (
                            <div
                              key={chat}
                              className={`dropdown-item ${selectedChat === chat ? 'selected' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChatSelect(chat);
                              }}
                            >
                              {chat}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;