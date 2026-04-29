// frontend-react/src/components/SideBarRight/tabs/RagRecall/RagRecall.jsx
import React, { useState } from 'react';
import './RagRecall.css';

const RagRecall = () => {
  const [recalls, setRecalls] = useState([
    { id: 1, title: '世界设定', content: '这是一个充满魔法的世界...', score: 0.95 },
    { id: 2, title: '角色背景', content: '主角是一位年轻的魔法师...', score: 0.87 },
  ]);

  return (
    <div className="rag-recall-content">
      {/* 标题栏 */}
      <div className="tab-header">
        <span className="title-text">RAG 召回</span>
        <span className="recall-count">{recalls.length}</span>
      </div>

      {/* 召回列表 - 只显示最后两个 */}
      <div className="recall-list">
        {recalls.slice(-2).map(recall => (
          <div key={recall.id} className="recall-item">
            <div className="recall-header">
              <span className="recall-title">{recall.title}</span>
              <span className="recall-score">{(recall.score * 100).toFixed(0)}%</span>
            </div>
            <div className="recall-content">
              {recall.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RagRecall;
