// frontend-react/src/components/SideBarLeft/tabs/CharacterCard/CharacterCard.jsx
import React, { useState } from 'react';
import './CharacterCard.css';

const CharacterCard = () => {
  const [characters, setCharacters] = useState([
    { id: 1, name: '冒险者', description: '勇敢的探险家', avatar: '🗡️' },
    { id: 2, name: '魔法师', description: '精通奥术', avatar: '🔮' },
    { id: 3, name: '商人', description: '精明的交易者', avatar: '💰' },
  ]);

  return (
    <div className="character-card-content">
      {/* 标题栏 */}
      <div className="tab-header">
        <span className="title-text">角色卡</span>
      </div>

      {/* 操作按钮 */}
      <div className="tab-actions">
        <button className="action-btn">+ 新建</button>
        <button className="action-btn">📥 导入</button>
      </div>

      {/* 角色列表 */}
      <div className="character-list">
        {characters.map(char => (
          <div key={char.id} className="character-item">
            <span className="character-avatar">{char.avatar}</span>
            <div className="character-info">
              <div className="character-name">{char.name}</div>
              <div className="character-desc">{char.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterCard;
