import React, { useState, useRef } from 'react';

const ChatBox = () => {
  const [isHtmlRender, setIsHtmlRender] = useState(false);
  const [isImageGen, setIsImageGen] = useState(false);
  const [isDynamicTable, setIsDynamicTable] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

  const textareaRef = useRef(null);

  // 自动调整 Textarea 高度
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // 重置高度以获取正确的 scrollHeight
      // 重新设置高度，限制最大高度由 CSS max-height 控制
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  const handleInput = () => {
    adjustHeight();
  };

  // 生成示例数据
  const generateMessages = () => {
    const messages = [];
    for (let i = 1; i <= 150; i++) {
      const isUser = i % 2 !== 0;
      messages.push({
        id: i,
        role: isUser ? 'user' : 'ai',
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
            <div className="bubble">
              {isHtmlRender ? (
                <div dangerouslySetInnerHTML={{ __html: msg.content }} />
              ) : (
                <div>{msg.content}</div>
              )}
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
            // 关键修改：显式设置初始样式高度，确保可见
            style={{ height: '42px' }}
          />
        </div>
        <button className="send-button">发送</button>
      </div>
    </div>
  );
};

export default ChatBox;
