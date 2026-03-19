import React, { useState, useEffect, useRef } from 'react';
import './ToolBar.css';

const Toolbar = ({
  onRoleChange,
  onChatChange
}) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [roleData, setRoleData] = useState({});
  const [hoveredRole, setHoveredRole] = useState(null);
  const [clickedRole, setClickedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRole, setEditingRole] = useState(null);
  const [editingChat, setEditingChat] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const panelRef = useRef(null);

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

  // 点击外部关闭面板
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setActivePanel(null);
        setHoveredRole(null);
        setClickedRole(null);
        setEditingRole(null);
        setEditingChat(null);
        setShowDeleteConfirm(null);
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
      if (panelName === 'role') {
        fetchRoleData();
      }
      setActivePanel(panelName);
    }
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
    setActivePanel(null);
    setHoveredRole(null);
    setClickedRole(null);
    if (onChatChange) {
      onChatChange(selectedRole, chat);
    }
  };

  // 处理角色卡片点击
  const handleRoleCardClick = (role) => {
    if (clickedRole === role) {
      setClickedRole(null);
    } else {
      setClickedRole(role);
      handleRoleSelect(role);
    }
  };

  // 处理搜索
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 处理角色编辑
  const handleEditRole = (e, role) => {
    e.stopPropagation();
    setEditingRole(role);
  };

  // 处理角色重命名
  const handleRenameRole = (e, oldName) => {
    e.stopPropagation();
    const newName = e.target.value;
    if (newName && newName !== oldName) {
      // 这里应该调用API更新角色名
      console.log('重命名角色:', oldName, '->', newName);

      // 更新本地状态
      const newRoleData = { ...roleData };
      const chats = newRoleData[oldName];
      delete newRoleData[oldName];
      newRoleData[newName] = chats;
      setRoleData(newRoleData);

      // 如果当前选中的是被重命名的角色，更新选中状态
      if (selectedRole === oldName) {
        setSelectedRole(newName);
        if (onRoleChange) {
          onRoleChange(newName);
        }
      }
    }
    setEditingRole(null);
  };

  // 处理聊天编辑
  const handleEditChat = (e, chat) => {
    e.stopPropagation();
    setEditingChat(chat);
  };

  // 处理聊天重命名
  const handleRenameChat = (e, oldName) => {
    e.stopPropagation();
    const newName = e.target.value;
    if (newName && newName !== oldName) {
      // 这里应该调用API更新聊天名
      console.log('重命名聊天:', oldName, '->', newName);

      // 更新本地状态
      const newRoleData = { ...roleData };
      const chatIndex = newRoleData[selectedRole].indexOf(oldName);
      if (chatIndex !== -1) {
        newRoleData[selectedRole][chatIndex] = newName;
        setRoleData(newRoleData);

        // 如果当前选中的是被重命名的聊天，更新选中状态
        if (selectedChat === oldName) {
          setSelectedChat(newName);
          if (onChatChange) {
            onChatChange(selectedRole, newName);
          }
        }
      }
    }
    setEditingChat(null);
  };

  // 处理删除确认
  const handleDeleteClick = (e, type, name) => {
    e.stopPropagation();
    setDeleteType(type);
    setShowDeleteConfirm(name);
  };

  // 确认删除
  const confirmDelete = () => {
    if (deleteType === 'role') {
      // 这里应该调用API删除角色
      console.log('删除角色:', showDeleteConfirm);

      // 更新本地状态
      const newRoleData = { ...roleData };
      delete newRoleData[showDeleteConfirm];
      setRoleData(newRoleData);

      // 如果删除的是当前选中的角色，清空选中状态
      if (selectedRole === showDeleteConfirm) {
        setSelectedRole(null);
        setSelectedChat(null);
        if (onRoleChange) {
          onRoleChange(null);
        }
      }
    } else if (deleteType === 'chat') {
      // 这里应该调用API删除聊天
      console.log('删除聊天:', showDeleteConfirm);

      // 更新本地状态
      const newRoleData = { ...roleData };
      const chatIndex = newRoleData[selectedRole].indexOf(showDeleteConfirm);
      if (chatIndex !== -1) {
        newRoleData[selectedRole].splice(chatIndex, 1);
        setRoleData(newRoleData);

        // 如果删除的是当前选中的聊天，清空选中状态
        if (selectedChat === showDeleteConfirm) {
          setSelectedChat(null);
          if (onChatChange) {
            onChatChange(selectedRole, null);
          }
        }
      }
    }
    setShowDeleteConfirm(null);
    setDeleteType(null);
  };

  // 取消删除
  const cancelDelete = () => {
    setShowDeleteConfirm(null);
    setDeleteType(null);
  };

  // 处理新增角色
  const handleAddRole = () => {
    // 这里应该调用API创建新角色
    const newRole = '新角色';
    console.log('创建新角色:', newRole);

    // 更新本地状态
    const newRoleData = { ...roleData };
    newRoleData[newRole] = [];
    setRoleData(newRoleData);

    // 自动进入编辑模式
    setEditingRole(newRole);
  };

  // 处理新增聊天
  const handleAddChat = () => {
    if (!selectedRole) return;

    // 这里应该调用API创建新聊天
    const newChat = '新聊天';
    console.log('创建新聊天:', newChat);

    // 更新本地状态
    const newRoleData = { ...roleData };
    newRoleData[selectedRole].push(newChat);
    setRoleData(newRoleData);

    // 自动进入编辑模式
    setEditingChat(newChat);
  };

  // 过滤角色
  const filteredRoles = Object.keys(roleData).filter(role =>
    role.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="panel-content role-panel">
            <div className="panel-header">
              <h3>角色管理</h3>
              <div className="current-info">
                <span>当前角色: {selectedRole || '未选择'}</span>
                <span>当前聊天: {selectedChat || '未选择'}</span>
              </div>
            </div>

            <div className="panel-body">
              <div className="panel-controls">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="搜索角色..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
                <button className="add-button" onClick={handleAddRole}>
                  <span className="icon">+</span>
                  <span>新增角色</span>
                </button>
              </div>

              <div className="panel-list-container">
                {isLoading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <span>加载中...</span>
                  </div>
                ) : filteredRoles.length === 0 ? (
                  <div className="empty-state">
                    <p>没有找到匹配的角色</p>
                  </div>
                ) : (
                  <div className="role-cards-grid">
                    {filteredRoles.map(role => (
                      <div
                        key={role}
                        className={`role-card ${selectedRole === role ? 'selected' : ''} ${hoveredRole === role ? 'hovered' : ''} ${clickedRole === role ? 'clicked' : ''}`}
                        onClick={() => handleRoleCardClick(role)}
                        onMouseEnter={() => setHoveredRole(role)}
                        onMouseLeave={() => setHoveredRole(null)}
                      >
                        <div className="role-card-header">
                          {editingRole === role ? (
                            <input
                              type="text"
                              defaultValue={role}
                              autoFocus
                              onBlur={(e) => handleRenameRole(e, role)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleRenameRole(e, role);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div className="role-name">{role}</div>
                          )}

                          <div className="role-chat-count">
                            {roleData[role] ? roleData[role].length : 0} 个聊天
                          </div>
                        </div>

                        <div className="role-card-actions">
                          {editingRole !== role && (
                            <>
                              <button
                                className="action-button edit-button"
                                title="编辑"
                                onClick={(e) => handleEditRole(e, role)}
                              >
                                ✏️
                              </button>
                              <button
                                className="action-button delete-button"
                                title="删除"
                                onClick={(e) => handleDeleteClick(e, 'role', role)}
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>

                        {/* 聊天列表 */}
                        {(hoveredRole === role || clickedRole === role) && roleData[role] && roleData[role].length > 0 && (
                          <div className="chat-list">
                            <div className="chat-list-header">
                              <span>聊天记录</span>
                              <button
                                className="add-chat-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddChat();
                                }}
                              >
                                <span className="icon">+</span>
                                <span>新建聊天</span>
                              </button>
                            </div>

                            {roleData[role].map(chat => (
                              <div
                                key={chat}
                                className={`chat-item ${selectedChat === chat ? 'selected' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleChatSelect(chat);
                                }}
                              >
                                <div className="chat-content">
                                  {editingChat === chat ? (
                                    <input
                                      type="text"
                                      defaultValue={chat}
                                      autoFocus
                                      onBlur={(e) => handleRenameChat(e, chat)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleRenameChat(e, chat);
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <div className="chat-name">{chat}</div>
                                  )}
                                </div>

                                <div className="chat-actions">
                                  {editingChat !== chat && (
                                    <>
                                      <button
                                        className="action-button edit-button"
                                        title="编辑"
                                        onClick={(e) => handleEditChat(e, chat)}
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        className="action-button delete-button"
                                        title="删除"
                                        onClick={(e) => handleDeleteClick(e, 'chat', chat)}
                                      >
                                        🗑️
                                      </button>
                                    </>
                                  )}
                                </div>
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
        </div>
      )}

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>确认删除</h3>
            <p>确定要删除{deleteType === 'role' ? '角色' : '聊天'} "{showDeleteConfirm}" 吗？</p>
            <div className="modal-actions">
              <button className="modal-button cancel-button" onClick={cancelDelete}>
                取消
              </button>
              <button className="modal-button confirm-button" onClick={confirmDelete}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {activePanel === 'settings' && (
        <div className="panel-overlay" ref={panelRef}>
          <div className="panel-content">
            <div className="panel-header">
              <h3>设置</h3>
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
