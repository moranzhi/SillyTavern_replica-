import React, { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { Message } from '@/types';
import ReactMarkdown from 'react-markdown';

// --- 组件：单条消息气泡 ---
const MessageBubble: React.FC<{ message: Message; renderHtml: boolean }> = ({ message, renderHtml }) => {
  // 根据角色决定样式
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[80%] rounded-lg p-3 shadow-sm
          ${isUser
            ? 'bg-blue-50 text-gray-800 border border-blue-100'
            : 'bg-white text-gray-800 border border-gray-200'
          }
        `}
      >
        {/* 消息头部：角色名（可选） */}
        <div className="text-xs font-bold mb-1 text-gray-500">
          {isUser ? 'User' : 'Assistant'}
        </div>

        {/* 消息内容 */}
        <div className="prose prose-sm max-w-none">
          {renderHtml && !isUser ? (
            // 如果开启 HTML 渲染且是 AI，使用 ReactMarkdown 解析
            <ReactMarkdown>{message.content}</ReactMarkdown>
          ) : (
            // 否则纯文本显示（注意：实际项目中应防范 XSS，这里仅作演示）
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 主组件：聊天窗口 ---
const ChatWindow: React.FC = () => {
  // 1. 从 Store 获取状态
  const { messages, currentMessageId, renderHtml } = useChatStore();

  // 2. 滚动容器引用
  const scrollRef = useRef<HTMLDivElement>(null);

  // 3. 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentMessageId]); // 当消息更新或切换分支时滚动

  // 4. 构建当前显示的消息链
  // 这是一个简化逻辑：从 currentMessageId 开始回溯 parentId 直到根节点
  // 实际项目中可能需要更复杂的树遍历逻辑
  const displayMessages: Message[] = React.useMemo(() => {
    if (!currentMessageId) return [];

    const chain: Message[] = [];
    let currId: string | null = currentMessageId;

    // 向上回溯 (最多回溯 100 条防止死循环)
    let safetyCount = 0;
    while (currId && safetyCount < 100) {
      const msg = messages[currId];
      if (msg) {
        chain.unshift(msg); // 添加到数组开头
        currId = msg.parentId;
      } else {
        break;
      }
      safetyCount++;
    }

    return chain;
  }, [messages, currentMessageId]);

  return (
    <div className="flex flex-col h-full bg-[#F0F4F8]">

      {/* --- 顶部控制栏 (数据集/文件选择) --- */}
      {/* 注意：这部分逻辑可能需要移到 Layout 或单独的 Header 组件中 */}
      <div className="flex-none h-12 border-b border-[#D1D9E6] bg-white flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-500">当前会话：</span>
          <span className="font-semibold text-gray-700">Active_Session_01</span>
        </div>

        {/* HTML 渲染开关 */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">HTML 渲染</span>
          <button
            onClick={() => {/* TODO: 调用 store.toggleRenderHtml() */}}
            className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 ease-in-out ${
              renderHtml ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                renderHtml ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* --- 消息列表区域 (可滚动) --- */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 custom-scrollbar scroll-smooth"
      >
        {displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p>暂无消息，请开始对话</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                renderHtml={renderHtml}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default ChatWindow;
