import React, { useState, useEffect, useRef } from 'react';
import './ToolBar.css';

const Toolbar = ({
  onRoleChange,
  onChatChange
}) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [roleData, setRoleData] = useState({});
  const [hoveredRole, setHoveredRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  // 获取角色和聊天数据
  const fetchRoleData = async () => {
    setIsLoading(true);
    console.log('开始获取角色数据...');
    try {
      const response = await fetch('/api/tool_bar/get_all_role_and_chat', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      console.log('响应状态:', response.status);
      const data = await response.json();
      console.log('获取到的数据:', data);
      setRoleData(data);
    } catch (error) {
      console.error('获取角色数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setHoveredRole(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 处理下拉框展开/收起
  const handleDropdownToggle = () => {
    // 每次点击都重新获取数据
    fetchRoleData();
    setIsDropdownOpen(!isDropdownOpen);
  };

  // 处理角色选择
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (onRoleChange) {
      onRoleChange(role);
    }

    // 如果该角色有聊天记录，默认选择第一个
    if (roleData[role] && roleData[role].length > 0) {
      const firstChat = roleData[role][0];
      setSelectedChat(firstChat);
      if (onChatChange) {
        onChatChange(role, firstChat);
      }
    } else {
      setSelectedChat(null);
    }
  };

  // 处理聊天选择
  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setIsDropdownOpen(false);
    setHoveredRole(null);
    if (onChatChange) {
      onChatChange(selectedRole, chat);
    }
  };

  // 处理角色项悬停
  const handleRoleHover = (role) => {
    setHoveredRole(role);
  };

  // 处理角色项离开
  const handleRoleLeave = () => {
    // 不立即清除hoveredRole，以便用户可以移动到二级菜单
  };

  // 处理二级菜单进入
  const handleNestedMenuEnter = () => {
    // 防止鼠标移动时菜单消失
  };

  // 处理二级菜单离开
  const handleNestedMenuLeave = () => {
    setHoveredRole(null);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-icons">
        {/* Logo图标 */}
        <div className="toolbar-icon" title="首页">
          🤖
        </div>

        {/* 角色选择下拉框 */}
        <div className="dropdown-container" ref={dropdownRef}>
          <div
            className="toolbar-icon"
            onClick={handleDropdownToggle}
            title="选择角色"
          >
            👤
          </div>

          {isDropdownOpen && (
            <div className="dropdown-menu visible">
              {isLoading ? (
                <div className="dropdown-item">
                  加载中...
                </div>
              ) : (
                Object.keys(roleData).map(role => (
                  <div
                    key={role}
                    className={`dropdown-item ${selectedRole === role ? 'selected' : ''} ${roleData[role] && roleData[role].length > 0 ? 'has-children' : ''}`}
                    onClick={() => handleRoleSelect(role)}
                    onMouseEnter={() => handleRoleHover(role)}
                    onMouseLeave={handleRoleLeave}
                  >
                    {role}
                    {/* 当悬停在角色上时显示二级菜单 */}
                    {hoveredRole === role && roleData[role] && roleData[role].length > 0 && (
                      <div
                        className={`nested-dropdown visible`}
                        onMouseEnter={handleNestedMenuEnter}
                        onMouseLeave={handleNestedMenuLeave}
                      >
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
                ))
              )}
            </div>
          )}
        </div>

        {/* 其他工具栏图标 */}
        <div className="toolbar-icon" title="设置">
          ⚙️
        </div>
        <div className="toolbar-icon" title="帮助">
          ❓
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
