import React, { useState, useRef } from 'react';

const ChatBox = () => {
  const [isHtmlRender, setIsHtmlRender] = useState(false);
  const [isImageGen, setIsImageGen] = useState(false);
  const [isDynamicTable, setIsDynamicTable] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const textareaRef = useRef(null);

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

  // 生成示例数据
  const generateMessages = () => {
    const messages = [];
    for (let i = 1; i <= 150; i++) {
      const isUser = i % 2 !== 0;
      messages.push({
        id: i,
        role: isUser ? 'user' : 'ai',
        name: isUser ? '我' : 'AI助手',
        content: isUser
          ? `这是第 ${i} 条用户消息。这是一段比较长的文本，用来测试气泡的换行效果以及滚动条的表现。`
          : `这是第 ${i} 条 AI 回复。<b>包含 HTML 标签</b>的内容。如果渲染开关开启，这里应该显示粗体字。如果不开启，应该显示原始标签。`
      });
    }
    return messages;
  };

  const messages = generateMessages();

  return (
    <div className="chat-box">
      {/* 上方：消息列表区域 */}
      <div className="chat-messages">

        {/* 右上角：可折叠设置面板 */}
        <div className={`settings-panel ${isSettingsExpanded ? 'expanded' : 'collapsed'}`}>
          <div
            className="settings-header"
            onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
          >
            {isSettingsExpanded ? '▼' : '⚙'}
          </div>

          {isSettingsExpanded && (
            <div className="settings-options">
              <div className="setting-item">
                <label>HTML 渲染</label>
                <input
                  type="checkbox"
                  checked={isHtmlRender}
                  onChange={() => setIsHtmlRender(!isHtmlRender)}
                />
              </div>
              <div className="setting-item">
                <label>开启生图</label>
                <input
                  type="checkbox"
                  checked={isImageGen}
                  onChange={() => setIsImageGen(!isImageGen)}
                />
              </div>
              <div className="setting-item">
                <label>动态表格</label>
                <input
                  type="checkbox"
                  checked={isDynamicTable}
                  onChange={() => setIsDynamicTable(!isDynamicTable)}
                />
              </div>
            </div>
          )}
        </div>

        {/* 消息列表 */}
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-container">
              {/* 消息名称和工具栏在同一行 */}
              <div className="message-header">
                <div className="message-name">{msg.name}</div>

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
