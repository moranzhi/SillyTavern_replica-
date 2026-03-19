import React, { useState, useEffect } from 'react';
import './RoleSelector.css';

const RoleSelector = ({ onRoleChange, onChatChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [roleData, setRoleData] = useState({});
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);

  // 获取角色和聊天数据
  useEffect(() => {
    const fetchRoleData = async () => {
      try {
        console.log('开始获取角色数据...');
        const response = await fetch('/api/get_all_role_and_chat');
        console.log('响应状态:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('获取到的数据:', data);
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
    <div className="role-selector">
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
  );
};

export default RoleSelector;
