import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { Send } from 'lucide-react'; // 图标库

// --- 主组件：输入框 ---
const InputBox: React.FC = () => {
  // 1. 状态管理
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 2. 从 Store 获取状态和方法
  const {
    addMessage,
    updateStreamingMessage,
    isLoading,
    messages,
    genParams,
    currentMessageId
  } = useChatStore();

  // 3. 自动调整 Textarea 高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // 重置高度
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // 设置为内容高度
    }
  }, [inputValue]);

  // 4. 处理发送逻辑
  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    // --- A. 更新前端 UI ---
    setInputValue(''); // 清空输入框

    // 1. 添加用户消息到 Store
    const userMsgId = addMessage('user', text, currentMessageId);

    // 2. 创建一个空的 AI 消息占位符
    const aiMsgId = addMessage('assistant', '', userMsgId);

    // --- B. 准备请求数据 ---
    // 预期后端接收格式：
    // {
    //   "prompt": text,
    //   "history": Object.values(messages).filter(...), // 发送当前上下文
    //   "params": genParams
    // }
    const payload = {
      prompt: text,
      history: Object.values(messages), // 简化处理：发送所有消息
      params: genParams,
    };

    try {
      // --- C. 发起请求 (模拟) ---
      // TODO: 替换为实际的 API 调用，例如：
      // import { generateReplyStream } from '@/api/client';
      // await generateReplyStream(payload, (chunk) => { updateStreamingMessage(aiMsgId, chunk); });

      // 这里仅模拟流式效果
      const simulatedResponse = "这是一个模拟的 AI 回复。在实际项目中，这里将替换为真实的后端流式数据。";

      // 模拟逐字显示
      for (let i = 0; i < simulatedResponse.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50)); // 模拟延迟
        updateStreamingMessage(aiMsgId, simulatedResponse[i]);
      }

    } catch (error) {
      console.error('发送消息失败:', error);
      // 错误处理：可以更新消息内容显示错误信息
      updateStreamingMessage(aiMsgId, "\n[错误: 无法连接到服务器]", true);
    }
  };

  // 5. 处理键盘事件 (Ctrl+Enter 发送)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-none bg-[#F0F4F8] p-4 border-t border-[#D1D9E6]">
      <div className="relative flex items-end w-full bg-white border border-[#0056B3] rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-200 transition-all">

        {/* 文本输入区域 */}
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (支持 /命令，Ctrl+Enter 发送)"
          className="w-full max-h-48 min-h-[60px] p-3 pr-12 bg-transparent resize-none outline-none text-[#1A1A1A] text-sm custom-scrollbar"
          disabled={isLoading}
        />

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={isLoading || !inputValue.trim()}
          className={`
            absolute right-2 bottom-2 p-2 rounded-md transition-colors
            ${isLoading || !inputValue.trim()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }
          `}
          title="发送 (Ctrl+Enter)"
        >
          {isLoading ? (
            // 加载图标 (简单的 CSS 动画)
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>

      {/* 底部提示 */}
      <div className="mt-2 text-xs text-gray-400 text-right">
        {isLoading ? 'AI 正在思考...' : 'Enter 换行，Ctrl+Enter 发送'}
      </div>
    </div>
  );
};

export default InputBox;
