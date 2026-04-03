import React, { useEffect, useRef } from 'react';
import useRoleSelectorStore from '../../Store/Slices/RoleSelectorSlice';
import useChatBoxStore from '../../Store/Slices/ChatBoxSlice';

import './RoleSelector.css';

const RoleSelector = () => {
  const panelRef = useRef(null);

  // 从 Zustand store 中获取状态和操作
  const {
    roleData,
    selectedRole,
    selectedChat,
    hoveredRole,
    clickedRole,
    isLoading,
    searchTerm,
    editingRole,
    editingChat,
    showDeleteConfirm,
    deleteType,
    fetchRoleData,
    setSelectedRole,
    setSelectedChat,
    setSelectedRoleAndChat,
    setHoveredRole,
    setClickedRole,
    setSearchTerm,
    setEditingRole,
    setEditingChat,
    setShowDeleteConfirm,
    setDeleteType,
    handleRenameRole,
    handleRenameChat,
    confirmDelete,
    cancelDelete,
    handleAddRole,
    handleAddChat,
    resetPanel
  } = useRoleSelectorStore();

  // 从 ChatBoxStore 获取状态更新方法
  const chatBoxStore = useChatBoxStore();
  const { setCurrentRole, setCurrentChat } = chatBoxStore;
  const setChatBoxRoleAndChat = chatBoxStore.setChatBoxRoleAndChat;


  // 组件挂载时获取数据
  useEffect(() => {
    fetchRoleData();
  }, [fetchRoleData]);

  // 点击外部关闭面板
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        resetPanel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [resetPanel]);

  // 处理角色选择
  const handleRoleSelect = (role) => {
    // 如果该角色有聊天记录，默认选择第一个
    if (roleData[role] && roleData[role].length > 0) {
      const firstChat = roleData[role][0];
      // 使用新的原子操作方法同时更新角色和聊天
      setSelectedRoleAndChat(role, firstChat);
      // 同步更新 ChatBoxStore 中的状态
      setChatBoxRoleAndChat(role, firstChat);
    } else {
      // 清空角色和聊天
      setSelectedRoleAndChat(null, null);
      // 同步更新 ChatBoxStore 中的状态
      setChatBoxRoleAndChat(null, null);
    }
  };

  // 处理聊天选择
  const handleChatSelect = (chat) => {
    // 获取当前展开的角色（聊天所属的角色）
    const currentRole = hoveredRole || clickedRole;

    // 使用新的原子操作方法同时更新角色和聊天
    setSelectedRoleAndChat(currentRole, chat);
    // 同步更新 ChatBoxStore 中的状态
    setChatBoxRoleAndChat(currentRole, chat);
    setHoveredRole(null);
    setClickedRole(null);
  };

  // 处理角色卡片点击
  const handleRoleCardClick = (role) => {
    if (clickedRole === role) {
      setClickedRole(null);
      // 取消选择角色时，更新 selectedRole 和 selectedChat
      setSelectedRoleAndChat(null, null);
      // 同步更新 ChatBoxStore 中的状态
      setChatBoxRoleAndChat(null, null);
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
  const handleRenameRoleWrapper = (e, oldName) => {
    e.stopPropagation();
    const newName = e.target.value;
    handleRenameRole(oldName, newName);
    if (selectedRole === oldName && newName && newName !== oldName) {
      // 更新 ChatBoxStore 中的当前角色
      setCurrentRole(newName);
    }
  };

  // 处理聊天编辑
  const handleEditChat = (e, chat) => {
    e.stopPropagation();
    setEditingChat(chat);
  };

  // 处理聊天重命名
  const handleRenameChatWrapper = (e, oldName) => {
    e.stopPropagation();
    const newName = e.target.value;
    handleRenameChat(oldName, newName);
    if (selectedChat === oldName && newName && newName !== oldName) {
      // 更新 ChatBoxStore 中的当前聊天
      setCurrentChat(selectedRole, newName);
    }
  };

  // 处理删除确认
  const handleDeleteClick = (e, type, name) => {
    e.stopPropagation();
    setDeleteType(type);
    setShowDeleteConfirm(name);
  };

  // 确认删除
  const confirmDeleteWrapper = () => {
    confirmDelete();
    if (deleteType === 'role' && selectedRole === showDeleteConfirm) {
      // 清除 ChatBoxStore 中的当前角色和聊天
      setChatBoxRoleAndChat(null, null);
    } else if (deleteType === 'chat' && selectedChat === showDeleteConfirm) {
      // 清除 ChatBoxStore 中的当前聊天
      setChatBoxRoleAndChat(selectedRole, null);
    }
  };

  // 过滤角色
  const filteredRoles = Object.keys(roleData).filter(role =>
    role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="role-selector" ref={panelRef}>
      <div className="selected-role-display">
        {selectedRole ? (
          <div className="role-badge">
            <span className="role-label">当前角色/聊天:</span>
            <span className="role-name">{selectedRole}</span>
            {selectedChat && <span className="chat-name">/ {selectedChat}</span>}
          </div>
        ) : (
          <div className="role-badge empty">
            <span>未选择角色</span>
          </div>
        )}
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="搜索角色..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      <div className="role-list">
        {isLoading ? (
          <div className="loading">加载中...</div>
        ) : filteredRoles.length === 0 ? (
          <div className="empty-state">
            <p>没有找到匹配的角色</p>
          </div>
        ) : (
          filteredRoles.map(role => (
            <div
              key={role}
              className={`role-item ${selectedRole === role ? 'active' : ''}`}
              onClick={() => handleRoleCardClick(role)}
              onMouseEnter={() => setHoveredRole(role)}
              onMouseLeave={() => setHoveredRole(null)}
            >
              <div className="role-header">
                {editingRole === role ? (
                  <input
                    type="text"
                    defaultValue={role}
                    autoFocus
                    onBlur={(e) => handleRenameRoleWrapper(e, role)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRenameRoleWrapper(e, role);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="role-name">{role}</div>
                )}

                <div className="role-actions">
                  <button
                    className="icon-btn"
                    title="编辑"
                    onClick={(e) => handleEditRole(e, role)}
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-btn delete"
                    title="删除"
                    onClick={(e) => handleDeleteClick(e, 'role', role)}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* 聊天列表 */}
              {(hoveredRole === role || clickedRole === role) && roleData[role] && roleData[role].length > 0 && (
                <div className="chat-list">
                  {roleData[role].map(chat => (
                    <div
                      key={chat}
                      className={`chat-item ${selectedChat === chat ? 'active' : ''}`}
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
                            onBlur={(e) => handleRenameChatWrapper(e, chat)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameChatWrapper(e, chat);
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
                              className="icon-btn"
                              title="编辑"
                              onClick={(e) => handleEditChat(e, chat)}
                            >
                              ✏️
                            </button>
                            <button
                              className="icon-btn delete"
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
          ))
        )}
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="delete-confirm-modal">
          <div className="modal-content">
            <h3>确认删除</h3>
            <p>确定要删除{deleteType === 'role' ? '角色' : '聊天'} "{showDeleteConfirm}" 吗？</p>
            <div className="modal-actions">
              <button className="modal-button cancel-button" onClick={cancelDelete}>
                取消
              </button>
              <button className="modal-button danger" onClick={confirmDeleteWrapper}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSelector;
