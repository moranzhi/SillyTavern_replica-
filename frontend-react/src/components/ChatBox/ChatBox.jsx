import React, { useState, useRef } from 'react';
import useChatBoxStore from '../../Store/Slices/ChatBoxSlice';
import './ChatBox.css';

const ChatBox = () => {
  const [isHtmlRender, setIsHtmlRender] = useState(false);
  const [isImageGen, setIsImageGen] = useState(false);
  const [isDynamicTable, setIsDynamicTable] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const textareaRef = useRef(null);

  // 从 store 获取状态
  const { messages, userName, characterName, isLoading, error } = useChatBoxStore();

  // 自动调整 Textarea 高度
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    const wrapper = textarea?.closest('.chat-input-wrapper');

    if (textarea && wrapper) {
      textarea.style.height = '42px';
      wrapper.style.height = 'auto';
      const newHeight = textarea.scrollHeight;

      if (newHeight > 42) {
        textarea.style.height = newHeight + 'px';
      } else {
        textarea.style.height = '42px';
      }
    }
  };

  const handleInput = () => {
    adjustHeight();
  };

  // 开始编辑消息
  const startEdit = (id, content) => {
    setEditingId(id);
    setEditContent(content);
  };

  // 保存编辑的消息
  const saveEdit = (id) => {
    // 这里可以添加向后端发送请求的代码
    console.log(`保存消息 ${id} 的编辑内容: ${editContent}`);

    // 更新前端显示
    const messageIndex = messages.findIndex(msg => msg.id === id);
    if (messageIndex !== -1) {
      messages[messageIndex].content = editContent;
    }

    // 退出编辑模式
    setEditingId(null);
    setEditContent('');
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  return (
    <div className="chat-box">
      {/* 上方：消息列表区域 */}
      <div className="chat-messages">
        {/* 加载状态和错误信息 */}
        {isLoading && <div className="loading">加载中...</div>}
        {error && <div className="error">{error}</div>}

        {/* 消息列表 */}
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-container">
              {/* 消息名称和工具栏在同一行 */}
              <div className="message-header">
                <div className="message-name">{msg.role === 'user' ? userName : characterName}</div>

                {/* 消息工具栏 */}
                <div className="message-toolbar">
                  <span className="message-id">ID: {msg.id}</span>
                  <div className="toolbar-buttons">
                    <button
                      className="toolbar-button edit-button"
                      onClick={() => startEdit(msg.id, msg.content)}
                    >
                      编辑
                    </button>
                    <button className="toolbar-button expand-button">
                      ⋮
                    </button>
                  </div>
                </div>
              </div>

              {/* 消息内容 */}
              <div className="message-content">
                <div className="bubble">
                  {editingId === msg.id ? (
                    <div className="edit-container">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="edit-textarea"
                      />
                      <div className="edit-buttons">
                        <button
                          className="save-button"
                          onClick={() => saveEdit(msg.id)}
                        >
                          保存
                        </button>
                        <button
                          className="cancel-button"
                          onClick={cancelEdit}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    isHtmlRender ? (
                      <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                    ) : (
                      <div>{msg.content}</div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 下方：输入框区域 */}
      <div className="chat-input-wrapper">
        <div className="chat-input-area">
          <textarea
            ref={textareaRef}
            placeholder="输入消息..."
            onInput={handleInput}
            rows="1"
            style={{ height: '42px' }}
          />
        </div>
        <button className="send-button">发送</button>
      </div>
    </div>
  );
};

export default ChatBox;