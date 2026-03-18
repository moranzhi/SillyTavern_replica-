import React from 'react';

const ChatBox = () => {
  return (
    <div className="chat-box">
      <div className="chat-messages">
        {/* 消息列表占位 */}
        <div>历史消息区域</div>
      </div>
      <div className="chat-input-area">
        {/* 输入框占位 */}
        <input type="text" placeholder="输入消息..." disabled />
      </div>
    </div>
  );
};

export default ChatBox;
