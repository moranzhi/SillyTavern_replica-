import React, { useState, useEffect } from 'react';
import { Dice1, Image as ImageIcon, Table } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';

// --- 子组件：本地图库 ---
const LocalGallery: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 模拟加载图片数据
  useEffect(() => {
    setLoading(true);
    // TODO: 替换为真实的 API 调用
    // import { getLocalImages } from '@/api/client';
    // const data = await getLocalImages('/assets/images');
    // setImages(data);

    // 模拟延迟
    setTimeout(() => {
      setImages([
        'placeholder1.jpg',
        'placeholder2.jpg',
        'placeholder3.jpg',
        'placeholder4.jpg'
      ]);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center space-x-2 mb-3">
        <ImageIcon size={16} />
        <h3 className="text-sm font-bold text-gray-700">🖼️ 本地图库</h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {loading ? (
          <div className="text-center text-xs text-gray-400 py-4">加载中...</div>
        ) : images.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-4">文件夹为空</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="bg-white p-1 border border-gray-200 rounded shadow-sm">
                {/* 图片占位符 */}
                <div className="aspect-square bg-gray-100 rounded mb-1 flex items-center justify-center text-gray-400 text-xs">
                  {img}
                </div>
                <div className="text-[10px] text-center text-gray-500 truncate">{img}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- 子组件：骰子检定 ---
const DiceTool: React.FC = () => {
  const [result, setResult] = useState<number | null>(null);
  const [rollType, setRollType] = useState<'difficulty' | 'opposed'>('difficulty');
  const [difficulty, setDifficulty] = useState<number>(50); // 默认普通难度

  const handleRoll = () => {
    // 生成 1-100 随机数
    const res = Math.floor(Math.random() * 100) + 1;
    setResult(res);
  };

  return (
    <div className="flex flex-col h-full pt-4 border-t border-gray-100">
      <div className="flex items-center space-x-2 mb-3">
        <Dice1 size={16} />
        <h3 className="text-sm font-bold text-gray-700">🎲 检定工具</h3>
      </div>

      {/* Tab 切换 */}
      <div className="flex border-b border-gray-200 mb-3">
        <button
          onClick={() => setRollType('difficulty')}
          className={`flex-1 py-1 text-xs font-medium transition-colors ${
            rollType === 'difficulty'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          难度检定
        </button>
        <button
          onClick={() => setRollType('opposed')}
          className={`flex-1 py-1 text-xs font-medium transition-colors ${
            rollType === 'opposed'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          对抗骰
        </button>
      </div>

      {/* 难度选择 (仅在难度检定模式下显示) */}
      {rollType === 'difficulty' && (
        <div className="mb-4 space-y-2">
          <label className="text-xs text-gray-500">选择难度</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '极难', val: 95 },
              { label: '困难', val: 75 },
              { label: '普通', val: 50 }
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => setDifficulty(opt.val)}
                className={`text-xs py-1 px-2 rounded border transition-colors ${
                  difficulty === opt.val
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label} ({opt.val})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 投掷区域 */}
      <div className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 shadow-sm">
        <div className="flex-1">
          <div className="text-xs text-gray-400 mb-1">
            {rollType === 'difficulty' ? `目标: ${difficulty}` : '对抗检定'}
          </div>
          {result !== null && (
            <div
              className={`text-2xl font-bold ${
                rollType === 'difficulty' && result > difficulty
                  ? 'text-red-500' // 失败
                  : 'text-green-500' // 成功
              }`}
            >
              {result}
            </div>
          )}
        </div>
        <button
          onClick={handleRoll}
          className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition shadow-sm active:transform active:scale-95"
        >
          投掷
        </button>
      </div>
    </div>
  );
};

// --- 主组件：右侧面板 ---
const RightPanel: React.FC = () => {
  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto custom-scrollbar">
      {/* 上半部分：图库 */}
      <div className="flex-1 min-h-0 mb-4">
        <LocalGallery />
      </div>

      {/* 下半部分：骰子 */}
      <div className="flex-none h-auto">
        <DiceTool />
      </div>
    </div>
  );
};

export default RightPanel;
