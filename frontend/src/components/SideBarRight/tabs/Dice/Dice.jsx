// frontend-react/src/components/SideBarRight/tabs/Dice/Dice.jsx
import React, { useState } from 'react';
import './Dice.css';

const Dice = () => {
  // 从 localStorage 加载上次的输入
  const [leftInput, setLeftInput] = useState(() => {
    return localStorage.getItem('dice_left_input') || '';
  });
  
  const [rightInput, setRightInput] = useState(() => {
    return localStorage.getItem('dice_right_input') || '';
  });
  
  // 当前结果
  const [currentResult, setCurrentResult] = useState(null);
  
  // 动画状态
  const [isAnimating, setIsAnimating] = useState(false);

  // 解析骰子表达式
  const parseDiceExpression = (expression) => {
    if (!expression || expression.trim() === '') return null;
    
    const expr = expression.trim();
    
    // 纯数字(固定值)
    if (/^\d+$/.test(expr)) {
      return {
        type: 'fixed',
        value: parseInt(expr),
        display: expr
      };
    }
    
    // 解析多个骰子组合,如 "1d4+1d3"
    const parts = expr.split(/(?=[+-])/);
    const components = [];
    let total = 0;
    let detail = [];
    
    for (const part of parts) {
      // 匹配 NdM 格式
      const diceMatch = part.match(/^(\d*)d(\d+)$/i);
      if (diceMatch) {
        const count = diceMatch[1] ? parseInt(diceMatch[1]) : 1;
        const sides = parseInt(diceMatch[2]);
        
        // 掷骰子
        const rolls = [];
        for (let i = 0; i < count; i++) {
          rolls.push(Math.floor(Math.random() * sides) + 1);
        }
        
        const sum = rolls.reduce((a, b) => a + b, 0);
        total += sum;
        
        components.push({
          type: 'dice',
          count,
          sides,
          rolls,
          sum
        });
        
        detail.push(`${count}d${sides}=[${rolls.join(',')}]`);
      } else {
        // 匹配固定数值(带符号)
        const fixedMatch = part.match(/^([+-])(\d+)$/);
        if (fixedMatch) {
          const sign = fixedMatch[1] === '+' ? 1 : -1;
          const value = parseInt(fixedMatch[2]);
          total += sign * value;
          detail.push(`${sign > 0 ? '+' : '-'}${value}`);
        }
      }
    }
    
    return {
      type: 'mixed',
      value: total,
      components,
      display: expr,
      detail: detail.join(' ')
    };
  };

  // 掷骰子
  const handleRoll = () => {
    if (!leftInput && !rightInput) return;
    
    const leftResult = parseDiceExpression(leftInput);
    const rightResult = parseDiceExpression(rightInput);
    
    const result = {
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      left: leftResult,
      right: rightResult
    };
    
    // 触发动画
    setIsAnimating(true);
    setCurrentResult(result);
    
    // 300ms 后结束动画
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  // 清空结果
  const handleClear = () => {
    setCurrentResult(null);
  };

  // 清空输入
  const handleClearInputs = () => {
    setLeftInput('');
    setRightInput('');
    localStorage.removeItem('dice_left_input');
    localStorage.removeItem('dice_right_input');
  };

  // 渲染当前结果
  const renderCurrentResult = () => {
    if (!currentResult) {
      return (
        <div className="dice-result-empty">
          输入骰子表达式后点击掷骰子
        </div>
      );
    }
    
    const { left, right, timestamp } = currentResult;
    
    // 如果只有一边有值,直接显示
    if (!left || !right) {
      const single = left || right;
      return (
        <div className={`dice-result-item ${isAnimating ? 'animate-result' : ''}`}>
          <div className="dice-result-time">{timestamp}</div>
          <div className="dice-result-side">
            <div className="dice-result-label">{left ? '左侧' : '右侧'}</div>
            <div className="dice-result-value">{single.value}</div>
            {single.detail && <div className="dice-result-detail">{single.detail}</div>}
          </div>
        </div>
      );
    }
    
    // 比较两边结果
    let winnerText = '';
    let winnerClass = '';
    
    if (left.value > right.value) {
      winnerText = '左侧胜出';
      winnerClass = 'dice-result-winner';
    } else if (right.value > left.value) {
      winnerText = '右侧胜出';
      winnerClass = 'dice-result-winner';
    } else {
      winnerText = '平局';
      winnerClass = 'dice-result-tie';
    }
    
    return (
      <div className={`dice-result-item ${isAnimating ? 'animate-result' : ''}`}>
        <div className="dice-result-time">{timestamp}</div>
        <div className="dice-result-comparison">
          <div className="dice-result-side">
            <div className="dice-result-label">左侧</div>
            <div className="dice-result-value">{left.value}</div>
            {left.detail && <div className="dice-result-detail">{left.detail}</div>}
          </div>
          <div className="dice-result-side">
            <div className="dice-result-label">右侧</div>
            <div className="dice-result-value">{right.value}</div>
            {right.detail && <div className="dice-result-detail">{right.detail}</div>}
          </div>
        </div>
        <div className={winnerClass}>{winnerText}</div>
      </div>
    );
  };

  return (
    <div className="dice-panel">
      {/* 标题栏 */}
      <div className="dice-header">
        <span className="dice-title">骰子</span>
        <span className="dice-help" title="支持格式: 6, 1d4, 2d8-1, 1d4+1d3">?</span>
      </div>

      {/* 主内容区 */}
      <div className="dice-content">
        {/* 输入区域 */}
        <div className="dice-inputs">
          <div className="dice-input-wrapper">
            <label className="dice-input-label">左侧</label>
            <input
              type="text"
              className="dice-input"
              placeholder="例如: 1d20"
              value={leftInput}
              onChange={(e) => {
                setLeftInput(e.target.value);
                localStorage.setItem('dice_left_input', e.target.value);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleRoll()}
            />
          </div>
          
          <div className="dice-vs">VS</div>
          
          <div className="dice-input-wrapper">
            <label className="dice-input-label">右侧</label>
            <input
              type="text"
              className="dice-input"
              placeholder="例如: 1d20+3"
              value={rightInput}
              onChange={(e) => {
                setRightInput(e.target.value);
                localStorage.setItem('dice_right_input', e.target.value);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleRoll()}
            />
          </div>
        </div>

        {/* 按钮区域 */}
        <div className="dice-actions">
          <button className="dice-roll-btn" onClick={handleRoll}>
            🎲 掷骰子
          </button>
          <button className="dice-clear-btn" onClick={handleClearInputs} title="清空输入">
            ✕
          </button>
          <button className="dice-clear-btn" onClick={handleClear} title="清空历史">
            🗑
          </button>
        </div>

        {/* 结果展示区 */}
        <div className="dice-result">
          {renderCurrentResult()}
        </div>
      </div>
    </div>
  );
};

export default Dice;
