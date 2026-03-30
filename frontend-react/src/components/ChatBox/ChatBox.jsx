import React, { useState, useEffect, useRef } from 'react';
import useChatBoxStore from '../../Store/Slices/ChatBoxSlice';
import './ChatBox.css';

const ChatBox = () => {
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const messagesEndRef = useRef(null);

  // 从 ChatBoxStore 获取状态和方法
  const {
    messages,
    isLoading,
    error,
    userName,
    characterName,
    updateMessage
  } = useChatBoxStore();

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理编辑消息
  const handleEdit = (message) => {
    setEditingId(message.floor);
    setEditContent(message.mes);
  };

  // 保存编辑
  const handleSaveEdit = (messageId) => {
    // 调用 store 中的 updateMessage 方法
    updateMessage(messageId, editContent);
    setEditingId(null);
    setEditContent('');
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  // 渲染单条消息
  const renderMessage = (message) => {
    const isUser = message.is_user;
    const isEditing = editingId === message.floor;

    // 根据消息类型设置显示名称
    const displayName = isUser ? userName : characterName;

    return (
      <div key={message.floor} className={`message ${isUser ? 'user' : 'ai'}`}>
        <div className="message-container">
          <div className="message-header">
            <span className="message-name">{displayName}</span>
            <span className="message-id">#{message.floor}</span>
            <div className="message-toolbar">
              <div className="toolbar-buttons">
                <button
                  className="toolbar-button"
                  onClick={() => handleEdit(message)}
                  title="编辑"
                >
                  ✎
                </button>
                <button
                  className="toolbar-button"
                  title="更多"
                >
                  •••
                </button>
              </div>
            </div>
          </div>
          <div className="message-content">
            {isEditing ? (
              <div className="edit-container">
                <textarea
                  className="edit-textarea"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
                <div className="edit-buttons">
                  <button
                    className="cancel-button"
                    onClick={handleCancelEdit}
                  >
                    取消
                  </button>
                  <button
                    className="save-button"
                    onClick={() => handleSaveEdit(message.floor)}
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="bubble">
                {message.mes}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-box">
      <div className="chat-messages">
        {isLoading ? (
          <div className="loading">加载中...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : messages.length === 0 ? (
          <div className="loading">暂无消息</div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatBox;
