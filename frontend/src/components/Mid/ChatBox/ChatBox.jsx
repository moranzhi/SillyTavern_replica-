// frontend-react/src/components/ChatBox/ChatBox.jsx
import React, { useState, useEffect, useRef } from 'react';
import useChatBoxStore from '../../../Store/Mid/ChatBoxSlice';
import './ChatBox.css';

const ChatBox = () => {
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const messagesEndRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef(null);

  // 新增：管理每条消息的当前显示的swipe版本
  const [currentSwipeId, setCurrentSwipeId] = useState({});

  // 从 ChatBoxStore 获取状态和方法
  const {
    messages,
    isLoading,
    error,
    userName,
    characterName,
    updateMessage,
    isGenerating,
    sendMessage,
    stopGeneration,
    options,
    toggleOption
  } = useChatBoxStore();

  const [inputHeight, setInputHeight] = useState(42);

  // 点击外部关闭选项面板
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target) &&
          !event.target.closest('.options-button')) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptions]);

  const handleInputHeight = (e) => {
    const textarea = e.target;
    
    // 标准方案：先重置为 auto，再设置为 scrollHeight
    // 这是业界公认的最佳实践，确保高度计算准确
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  // 处理发送或终止
  const handleSendOrStop = () => {
    if (isGenerating) {
      stopGeneration();
    } else {
      sendMessage(inputValue);
      setInputValue('');
      setInputHeight(24); // 重置为一行高度
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendOrStop();
    }
  };

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

  // 新增：处理swipe切换
  const handleSwipeChange = (messageId, direction) => {
    const message = messages.find(m => m.floor === messageId);
    if (message && message.swipes && message.swipes.length > 0) {
      const currentIndex = currentSwipeId[messageId] !== undefined
        ? currentSwipeId[messageId]
        : message.swipe_id;
      const newIndex = currentIndex + direction;

      if (newIndex >= 0 && newIndex < message.swipes.length) {
        setCurrentSwipeId(prev => ({
          ...prev,
          [messageId]: newIndex
        }));
      }
    }
  };

  // 切换选项显示
  const toggleOptionsPanel = () => {
    setShowOptions(!showOptions);
  };

  // 渲染单条消息
  const renderMessage = (message) => {
    const isUser = message.is_user;
    const isEditing = editingId === message.floor;

    // 判断是否为最新消息
    const isLatestMessage = messages.length > 0 && message.floor === messages[messages.length - 1].floor;

    // 根据消息类型设置显示名称
    const displayName = isUser ? userName : characterName;

    // 确定当前显示的消息内容
    let currentMes = message.mes;
    let hasSwipes = message.swipes && message.swipes.length > 0;
    let currentSwipeIndex = message.swipe_id;

    if (hasSwipes) {
      // 如果有swipes数组
      if (currentSwipeId[message.floor] !== undefined) {
        // 如果用户已经切换过版本，使用用户选择的版本
        currentSwipeIndex = currentSwipeId[message.floor];
      } else {
        // 否则使用默认的swipe_id
        currentSwipeIndex = message.swipe_id;
      }

      if (currentSwipeIndex >= 0 && currentSwipeIndex < message.swipes.length) {
        currentMes = message.swipes[currentSwipeIndex];
      }
    }

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
                {options.htmlRender && !isUser ? (
                  <div dangerouslySetInnerHTML={{ __html: currentMes }} />
                ) : (
                  currentMes
                )}
                {hasSwipes && isLatestMessage && !isUser && (
                  <div className="swipe-controls">
                    <button
                      className="swipe-button"
                      onClick={() => handleSwipeChange(message.floor, -1)}
                      disabled={currentSwipeIndex === 0}
                    >
                      ◀
                    </button>
                    <span className="swipe-counter">
                      {currentSwipeIndex + 1}/{message.swipes.length}
                    </span>
                    <button
                      className="swipe-button"
                      onClick={() => handleSwipeChange(message.floor, 1)}
                      disabled={currentSwipeIndex === message.swipes.length - 1}
                    >
                      ▶
                    </button>
                  </div>
                )}
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
      <div className="chat-input-wrapper">
        <div className="input-container">
          <div className="options-wrapper" ref={optionsRef}>
            <button
              className={`options-toggle ${showOptions ? 'active' : ''}`}
              title="Toggle Options"
              onClick={() => setShowOptions(!showOptions)}
            >
              {showOptions ? '×' : '≡'}
            </button>
            {showOptions && (
              <div className="chat-options">
                <label className="option-checkbox">
                  <input
                    type="checkbox"
                    checked={options.htmlRender}
                    onChange={() => toggleOption('htmlRender')}
                  />
                  <span className="checkmark"></span>
                  <span className="option-label">HTML渲染</span>
                </label>
                <label className="option-checkbox">
                  <input
                    type="checkbox"
                    checked={options.streamOutput}
                    onChange={() => toggleOption('streamOutput')}
                  />
                  <span className="checkmark"></span>
                  <span className="option-label">流式输出</span>
                </label>
                <label className="option-checkbox">
                  <input
                    type="checkbox"
                    checked={options.dynamicTable}
                    onChange={() => toggleOption('dynamicTable')}
                  />
                  <span className="checkmark"></span>
                  <span className="option-label">动态表格</span>
                </label>
                
                {/* 生图工作流选项 */}
                <label className="option-checkbox">
                  <input
                    type="checkbox"
                    checked={options.imageWorkflow}
                    onChange={() => toggleOption('imageWorkflow')}
                  />
                  <span className="checkmark"></span>
                  <span className="option-label">🎨 生图工作流</span>
                </label>
              </div>
            )}
          </div>
          <div className="chat-input-area">
            <textarea
              className="message-input"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                handleInputHeight(e);
              }}
              onKeyDown={handleKeyDown}
              style={{
                height: `${inputHeight}px`,
                overflowY: inputHeight >= 300 ? 'auto' : 'hidden'
              }}
              placeholder="Type your message..."
            />
          </div>
          <button
            className={`send-button ${isGenerating ? 'stopping' : ''}`}
            onClick={handleSendOrStop}
            disabled={!inputValue.trim() && !isGenerating}
            title="Send Message"
          >
            {isGenerating ? '■' : '>'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
