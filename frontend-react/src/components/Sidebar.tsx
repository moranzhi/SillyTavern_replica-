import React from 'react';
import { useChatStore } from '@/store/useChatStore';
import { Slider } from '@/components/ui/slider'; // 假设您有这个组件，或者用原生 input[type=range]
import { Switch } from '@/components/ui/switch'; // 假设您有这个组件，或者用原生 input[type=checkbox]
import { Label } from '@/components/ui/label';   // 假设您有这个组件，或者用原生 label

// --- 类型定义 ---
// 这里复用 Store 中的类型，或者从 types/index.ts 导入
type SpliceBlockType = 'system' | 'world' | 'history' | 'character';

const Sidebar: React.FC = () => {
  // 1. 从 Store 获取状态和方法
  const {
    genParams,
    spliceBlocks,
    updateGenParams,
    toggleSpliceBlock,
  } = useChatStore();

  // 2. 处理参数变更
  const handleParamChange = (key: keyof typeof genParams, value: number | boolean) => {
    updateGenParams({ [key]: value });
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-6 overflow-y-auto custom-scrollbar">

      {/* --- 标题：全局预设 --- */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
          📜 全局预设
        </h3>
        <div className="flex gap-2">
          <select className="flex-1 p-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500">
            <option>Default</option>
            <option>A.U.T.O. v1.47</option>
            <option>Roleplay Pro</option>
          </select>
          <button className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm">
            📥
          </button>
        </div>
      </div>

      {/* --- 标题：生成参数 --- */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-700">⚙️ 生成参数</h3>

        {/* 参数网格布局 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 温度 */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <label>温度</label>
              <span>{genParams.temperature.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={genParams.temperature}
              onChange={(e) => handleParamChange('temperature', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Top P */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <label>Top P</label>
              <span>{genParams.top_p.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={genParams.top_p}
              onChange={(e) => handleParamChange('top_p', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* 频率惩罚 */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <label>频率惩罚</label>
              <span>{genParams.frequency_penalty.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={genParams.frequency_penalty}
              onChange={(e) => handleParamChange('frequency_penalty', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* 存在惩罚 */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <label>存在惩罚</label>
              <span>{genParams.presence_penalty.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={genParams.presence_penalty}
              onChange={(e) => handleParamChange('presence_penalty', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* 上下文长度 */}
          <div className="col-span-1">
            <label className="text-xs text-gray-500">上下文长度</label>
            <input
              type="number"
              value={genParams.context_length}
              onChange={(e) => handleParamChange('context_length', parseInt(e.target.value))}
              className="w-full mt-1 p-1 text-sm border border-gray-300 rounded"
            />
          </div>

          {/* 最大回复 */}
          <div className="col-span-1">
            <label className="text-xs text-gray-500">最大回复</label>
            <input
              type="number"
              value={genParams.max_tokens}
              onChange={(e) => handleParamChange('max_tokens', parseInt(e.target.value))}
              className="w-full mt-1 p-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>

        {/* 流式传输开关 */}
        <div className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            id="stream-check"
            checked={genParams.stream}
            onChange={(e) => handleParamChange('stream', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="stream-check" className="text-sm text-gray-700 select-none">
            ✅ 流式传输
          </label>
        </div>
      </div>

      {/* --- 标题：内容拼接块 --- */}
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-sm font-bold text-gray-700 mb-2">🧩 内容拼接块</h3>
        <p className="text-xs text-gray-500 mb-3">控制发送至后端的上下文组成</p>

        {/* 拼接块列表 */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {spliceBlocks.map((block) => (
            <div
              key={block.id}
              className={`flex items-center justify-between p-2 rounded border transition-colors ${
                block.active
                  ? 'bg-white border-[#D1D9E6] shadow-sm'
                  : 'bg-gray-50 border-gray-200 opacity-70'
              }`}
            >
              {/* 左侧：图标和名称 */}
              <div className="flex items-center space-x-2 overflow-hidden">
                <span className="text-lg shrink-0">
                  {block.type === 'world' ? '🌍' : block.type === 'history' ? '💬' : '📄'}
                </span>
                <span
                  className={`text-sm truncate ${
                    block.active ? 'text-gray-900 font-medium' : 'text-gray-500 line-through'
                  }`}
                >
                  {block.name}
                </span>
              </div>

              {/* 右侧：操作按钮 */}
              <div className="flex items-center space-x-2 shrink-0">
                {/* 编辑按钮 (如果不可编辑则置灰) */}
                <button
                  className={`text-xs p-1 rounded ${
                    block.editable === false ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-blue-600'
                  }`}
                  disabled={block.editable === false}
                  title="编辑"
                >
                  ✏️
                </button>

                {/* 激活开关 */}
                <input
                  type="checkbox"
                  checked={block.active}
                  onChange={() => toggleSpliceBlock(block.id)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>
          ))}
        </div>

        {/* 添加按钮 */}
        <button className="mt-3 w-full py-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition">
          + 添加拼接块
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
