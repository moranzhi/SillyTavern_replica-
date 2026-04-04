import React, { useState, useEffect } from 'react';
import usePresetStore from '../../../Store/Slices/LeftTabsSlices/PresetSlice';
import '../tabcss/Presets.css';

const PresetPanel = () => {
  const {
    selectedPreset,
    parameters,
    presets,
    isLoadingPresets,
    promptComponents,
    setSelectedPreset,
    updateParameter,
    saveCurrentAsPreset,
    editPresetName: updatePresetName,
    isParametersExpanded,
    toggleParametersExpanded,
    fetchPresets,
    setPromptComponents,
    toggleComponentEnabled,
    updateComponent,
    addComponent,
    removeComponent,
    moveComponent
  } = usePresetStore();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showComponentEditDialog, setShowComponentEditDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [editPresetId, setEditPresetId] = useState('');
  const [editPresetName, setEditPresetName] = useState('');
  const [importPresetData, setImportPresetData] = useState('');
  const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });

  // 组件编辑状态
  const [editingComponentIndex, setEditingComponentIndex] = useState(-1);
  const [editComponentContent, setEditComponentContent] = useState('');
  const [isEditing, setIsEditing] = useState(false); // 添加编辑状态标志

  // 拖拽状态
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  // 参数描述映射
  const parameterDescriptions = {
    temperature: "生成温度，控制随机性(0-2)",
    frequency_penalty: "频率惩罚，降低重复token概率",
    presence_penalty: "存在惩罚，鼓励谈论新话题",
    top_p: "核采样，控制词汇选择范围",
    top_k: "随机采样范围，从概率最高的K个词中选择",
    max_context: "上下文窗口大小(Token上限)",
    max_tokens: "单次回复的最大长度",
    max_context_unlocked: "是否允许超出限制的上下文",
    stream_openai: "是否使用流式输出",
    seed: "随机种子(-1为随机)",
    n: "生成回复的数量"
  };

  // 显示工具提示
  const showTooltip = (event, content) => {
    setTooltip({
      visible: true,
      content,
      x: event.clientX,
      y: event.clientY
    });
  };

  // 隐藏工具提示
  const hideTooltip = () => {
    setTooltip({ ...tooltip, visible: false });
  };

  // 处理参数更新
  const handleParameterChange = (name, value) => {
    // 根据参数类型转换值
    let convertedValue = value;
    if (name === 'temperature' || name === 'frequency_penalty' || name === 'presence_penalty' || name === 'top_p') {
      convertedValue = parseFloat(value);
    } else if (name === 'top_k' || name === 'max_context' || name === 'max_tokens' || name === 'seed' || name === 'n') {
      convertedValue = parseInt(value, 10);
    } else if (name === 'max_context_unlocked' || name === 'stream_openai') {
      convertedValue = value;
    }

    updateParameter({ name, value: convertedValue });
  };

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  // 保存当前设置为预设
  const handleSavePreset = () => {
    if (newPresetName.trim()) {
      saveCurrentAsPreset({ name: newPresetName });
      setNewPresetName('');
      setShowSaveDialog(false);
    }
  };

  // 编辑预设名称
  const handleEditPreset = () => {
    if (editPresetId && editPresetName.trim()) {
      updatePresetName(editPresetId, editPresetName);
      setEditPresetId('');
      setEditPresetName('');
      setShowEditDialog(false);
    }
  };

  // 导入预设
  const handleImportPreset = () => {
    try {
      const importedPreset = JSON.parse(importPresetData);
      if (importedPreset.name && importedPreset.parameters) {
        saveCurrentAsPreset({ name: importedPreset.name });
        // 更新参数
        Object.keys(importedPreset.parameters).forEach(key => {
          updateParameter({ name: key, value: importedPreset.parameters[key] });
        });

        // 更新组件列表
        if (importedPreset.promptComponents) {
          setPromptComponents(importedPreset.promptComponents);
        }

        setImportPresetData('');
        setShowImportDialog(false);
      }
    } catch (error) {
      console.error('导入预设失败:', error);
    }
  };

  // 导出预设
  const handleExportPreset = () => {
    if (selectedPreset) {
      const preset = presets.find(p => p.id === selectedPreset);
      if (preset) {
        const exportData = {
          ...preset,
          parameters,
          promptComponents
        };
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${preset.name}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  // 添加新组件
  const handleAddNewComponent = () => {
    const newComponent = {
      identifier: `component_${Date.now()}`,
      name: '新组件',
      content: '',
      role: 0,
      system_prompt: false,
      marker: false,
      enabled: true
    };
    addComponent(newComponent);
  };

  // 开始编辑组件
  const handleStartEditComponent = (index) => {
    setEditingComponentIndex(index);
    setEditComponentContent(promptComponents[index].content);
    setIsEditing(true); // 设置为编辑模式
    setShowComponentEditDialog(true);
  };

  // 查看组件内容
  const handleViewComponent = (index) => {
    setEditingComponentIndex(index);
    setEditComponentContent(promptComponents[index].content);
    setIsEditing(false); // 设置为查看模式
    setShowComponentEditDialog(true);
  };

  // 保存组件编辑
  const handleSaveComponentEdit = () => {
    if (editingComponentIndex >= 0 && isEditing) { // 只在编辑模式下保存
      updateComponent(editingComponentIndex, { content: editComponentContent });
    }
    setEditingComponentIndex(-1);
    setEditComponentContent('');
    setShowComponentEditDialog(false);
  };

  // 取消组件编辑
  const handleCancelComponentEdit = () => {
    setEditingComponentIndex(-1);
    setEditComponentContent('');
    setShowComponentEditDialog(false);
  };

  // 关闭组件查看对话框
  const handleCloseComponentView = () => {
    setEditingComponentIndex(-1);
    setEditComponentContent('');
    setShowComponentEditDialog(false);
  };

  // 切换组件启用状态
  const handleToggleComponentEnabled = (index) => {
    toggleComponentEnabled(index);
  };

  // 删除组件
  const handleDeleteComponent = (index) => {
    if (window.confirm('确定要删除这个组件吗？')) {
      removeComponent(index);
    }
  };

  // 拖拽开始
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    // 添加拖拽时的样式
    setTimeout(() => {
      e.target.classList.add('dragging');
    }, 0);
  };

  // 拖拽结束
  const handleDragEnd = (e) => {
    setDraggedItem(null);
    setDragOverItem(null);
    e.target.classList.remove('dragging');
  };

  // 拖拽经过
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItem === null || draggedItem === index) return;
    setDragOverItem(index);
  };

  // 放置
  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    // 移动组件
    moveComponent(draggedItem, index);

    // 重置拖拽状态
    setDraggedItem(null);
    setDragOverItem(null);
  };

  return (
    <div className="preset-panel">
      {/* 工具提示 */}
      {tooltip.visible && (
        <div
          className="tooltip"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          {tooltip.content}
        </div>
      )}

      {/* 顶部：预设选择与操作 */}
      <div className="preset-header">
        {/* 预设选择下拉框 */}
        <div className="preset-select-container">
          <label
            className="preset-label"
            onMouseEnter={(e) => showTooltip(e, "选择预设配置")}
            onMouseLeave={hideTooltip}
          >
            预设:
          </label>
          <select
            className="preset-select"
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            disabled={isLoadingPresets}
          >
            <option value="">{isLoadingPresets ? "加载中..." : "选择预设..."}</option>
            {presets.map(preset => (
              <option key={preset.id} value={preset.id}>{preset.name}</option>
            ))}
          </select>
        </div>

        {/* 操作按钮 */}
        <div className="preset-actions">
          <button
            className="preset-action-btn"
            onClick={() => setShowSaveDialog(true)}
            onMouseEnter={(e) => showTooltip(e, "保存当前设置为新预设")}
            onMouseLeave={hideTooltip}
          >
            💾
          </button>
          <button
            className="preset-action-btn"
            onClick={() => {
              if (selectedPreset) {
                const preset = presets.find(p => p.id === selectedPreset);
                if (preset) {
                  setEditPresetId(selectedPreset);
                  setEditPresetName(preset.name);
                  setShowEditDialog(true);
                }
              }
            }}
            onMouseEnter={(e) => showTooltip(e, "编辑当前预设")}
            onMouseLeave={hideTooltip}
          >
            ✏️
          </button>
          <button
            className="preset-action-btn"
            onClick={() => setShowImportDialog(true)}
            onMouseEnter={(e) => showTooltip(e, "导入预设")}
            onMouseLeave={hideTooltip}
          >
            📥
          </button>
          <button
            className="preset-action-btn"
            onClick={handleExportPreset}
            onMouseEnter={(e) => showTooltip(e, "导出当前预设")}
            onMouseLeave={hideTooltip}
          >
            📤
          </button>
        </div>
      </div>

      {/* 保存预设对话框 */}
      {showSaveDialog && (
        <div className="preset-save-dialog">
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="预设名称"
          />
          <div className="dialog-buttons">
            <button onClick={handleSavePreset}>保存</button>
            <button onClick={() => setShowSaveDialog(false)}>取消</button>
          </div>
        </div>
      )}

      {/* 编辑预设对话框 */}
      {showEditDialog && (
        <div className="preset-edit-dialog">
          <input
            type="text"
            value={editPresetName}
            onChange={(e) => setEditPresetName(e.target.value)}
            placeholder="预设名称"
          />
          <div className="dialog-buttons">
            <button onClick={handleEditPreset}>保存</button>
            <button onClick={() => setShowEditDialog(false)}>取消</button>
          </div>
        </div>
      )}

      {/* 导入预设对话框 */}
      {showImportDialog && (
        <div className="preset-import-dialog">
          <textarea
            value={importPresetData}
            onChange={(e) => setImportPresetData(e.target.value)}
            placeholder="粘贴预设JSON数据"
            rows="5"
          />
          <div className="dialog-buttons">
            <button onClick={handleImportPreset}>导入</button>
            <button onClick={() => setShowImportDialog(false)}>取消</button>
          </div>
        </div>
      )}

      {/* 编辑/查看组件内容对话框 */}
      {showComponentEditDialog && (
        <div className="component-edit-dialog">
          <div className="dialog-header">
            <h3>{isEditing ? '编辑' : '查看'}组件: {editingComponentIndex >= 0 && promptComponents[editingComponentIndex].name}</h3>
            <button className="close-btn" onClick={handleCloseComponentView}>×</button>
          </div>
          <div className="dialog-content">
            <textarea
              value={editComponentContent}
              onChange={(e) => setEditComponentContent(e.target.value)}
              className="component-textarea"
              readOnly={!isEditing} // 根据模式设置是否只读
              rows={20}
            />
          </div>
          <div className="dialog-footer">
            <span className="token-count">
              字符数: {editComponentContent ? editComponentContent.length : 0}
            </span>
            {isEditing && (
              <div className="dialog-buttons">
                <button onClick={handleSaveComponentEdit}>保存</button>
                <button onClick={handleCancelComponentEdit}>取消</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 参数设置区域 */}
      <div className="preset-parameters-container">
        <div
          className="parameters-header"
          onClick={toggleParametersExpanded}
        >
          <span>参数设置</span>
          <span className={`expand-icon ${isParametersExpanded ? 'expanded' : ''}`}>▼</span>
        </div>

        {isParametersExpanded && (
          <div className="preset-parameters">
            {/* 温度滑块 */}
            <div className="parameter-row">
              <label
                className="parameter-label"
                onMouseEnter={(e) => showTooltip(e, parameterDescriptions.temperature)}
                onMouseLeave={hideTooltip}
              >
                Temperature
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={parameters.temperature}
                onChange={(e) => handleParameterChange('temperature', e.target.value)}
                className="parameter-slider"
              />
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={parameters.temperature}
                onChange={(e) => handleParameterChange('temperature', e.target.value)}
                className="parameter-number"
              />
            </div>

            {/* 频率惩罚滑块 */}
            <div className="parameter-row">
              <label
                className="parameter-label"
                onMouseEnter={(e) => showTooltip(e, parameterDescriptions.frequency_penalty)}
                onMouseLeave={hideTooltip}
              >
                Frequency Penalty
              </label>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={parameters.frequency_penalty}
                onChange={(e) => handleParameterChange('frequency_penalty', e.target.value)}
                className="parameter-slider"
              />
              <input
                type="number"
                min="-2"
                max="2"
                step="0.1"
                value={parameters.frequency_penalty}
                onChange={(e) => handleParameterChange('frequency_penalty', e.target.value)}
                className="parameter-number"
              />
            </div>

            {/* 存在惩罚滑块 */}
            <div className="parameter-row">
              <label
                className="parameter-label"
                onMouseEnter={(e) => showTooltip(e, parameterDescriptions.presence_penalty)}
                onMouseLeave={hideTooltip}
              >
                Presence Penalty
              </label>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={parameters.presence_penalty}
                onChange={(e) => handleParameterChange('presence_penalty', e.target.value)}
                className="parameter-slider"
              />
              <input
                type="number"
                min="-2"
                max="2"
                step="0.1"
                value={parameters.presence_penalty}
                onChange={(e) => handleParameterChange('presence_penalty', e.target.value)}
                className="parameter-number"
              />
            </div>

            {/* Top P 滑块 */}
            <div className="parameter-row">
              <label
                className="parameter-label"
                onMouseEnter={(e) => showTooltip(e, parameterDescriptions.top_p)}
                onMouseLeave={hideTooltip}
              >
                Top P
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={parameters.top_p}
                onChange={(e) => handleParameterChange('top_p', e.target.value)}
                className="parameter-slider"
              />
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={parameters.top_p}
                onChange={(e) => handleParameterChange('top_p', e.target.value)}
                className="parameter-number"
              />
            </div>

            {/* Top K 输入框 */}
            <div className="parameter-row">
              <label
                className="parameter-label"
                onMouseEnter={(e) => showTooltip(e, parameterDescriptions.top_k)}
                onMouseLeave={hideTooltip}
              >
                Top K
              </label>
              <input
                type="number"
                min="0"
                value={parameters.top_k}
                onChange={(e) => handleParameterChange('top_k', e.target.value)}
                className="parameter-input"
              />
            </div>

            {/* 最大上下文输入框 */}
            <div className="parameter-row">
              <label
                className="parameter-label"
                onMouseEnter={(e) => showTooltip(e, parameterDescriptions.max_context)}
                onMouseLeave={hideTooltip}
              >
                Max Context
              </label>
              <input
                type="number"
                min="1"
                max="10000000"
                defaultValue="1000000"
                value={parameters.max_context}
                onChange={(e) => handleParameterChange('max_context', e.target.value)}
                className="parameter-input"
              />
            </div>

            {/* 最大Token输入框 */}
            <div className="parameter-row">
              <label
                className="parameter-label"
                onMouseEnter={(e) => showTooltip(e, parameterDescriptions.max_tokens)}
                onMouseLeave={hideTooltip}
              >
                Max Tokens
              </label>
              <input
                type="number"
                min="1"
                max="100000"
                defaultValue="30000"
                value={parameters.max_tokens}
                onChange={(e) => handleParameterChange('max_tokens', e.target.value)}
                className="parameter-input"
              />
            </div>

            {/* 随机种子输入框 */}
            <div className="parameter-row">
              <label
                className="parameter-label"
                onMouseEnter={(e) => showTooltip(e, parameterDescriptions.seed)}
                onMouseLeave={hideTooltip}
              >
                Seed
              </label>
              <input
                type="number"
                value={parameters.seed}
                onChange={(e) => handleParameterChange('seed', e.target.value)}
                className="parameter-input"
              />
            </div>

            {/* 生成数量输入框 */}
            <div className="parameter-row">
              <label
                className="parameter-label"
                onMouseEnter={(e) => showTooltip(e, parameterDescriptions.n)}
                onMouseLeave={hideTooltip}
              >
                N (生成数量)
              </label>
              <input
                type="number"
                min="1"
                value={parameters.n}
                onChange={(e) => handleParameterChange('n', e.target.value)}
                className="parameter-input"
              />
            </div>

            {/* 开关选项 */}
            <div className="parameter-toggles">
              <div className="toggle-row">
                <label
                  className="toggle-label"
                  onMouseEnter={(e) => showTooltip(e, parameterDescriptions.max_context_unlocked)}
                  onMouseLeave={hideTooltip}
                >
                  Max Context Unlocked
                </label>
                <input
                  type="checkbox"
                  checked={parameters.max_context_unlocked}
                  onChange={(e) => handleParameterChange('max_context_unlocked', e.target.checked)}
                  className="toggle-checkbox"
                />
              </div>

              <div className="toggle-row">
                <label
                  className="toggle-label"
                  onMouseEnter={(e) => showTooltip(e, parameterDescriptions.stream_openai)}
                  onMouseLeave={hideTooltip}
                >
                  Stream Output
                </label>
                <input
                  type="checkbox"
                  checked={parameters.stream_openai}
                  onChange={(e) => handleParameterChange('stream_openai', e.target.checked)}
                  className="toggle-checkbox"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 预设组件列表 */}
      <div className="preset-components-section">
        <div className="components-header">
          <h3>预设组件</h3>
          <button
            onClick={handleAddNewComponent}
            className="add-component-btn"
            onMouseEnter={(e) => showTooltip(e, "添加新组件")}
            onMouseLeave={hideTooltip}
          >
            + 添加组件
          </button>
        </div>

        <div className="components-list draggable-container">
          {promptComponents.map((component, index) => (
            <React.Fragment key={component.identifier}>
              {/* 拖拽指示器 - 在组件上方 */}
              <div
                className={`drag-indicator ${dragOverItem === index ? 'visible' : ''}`}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
              />

              {/* 组件项 */}
              <div
                className={`prompt-component-item ${!component.enabled ? 'disabled' : ''} ${component.marker ? 'marker' : ''} ${draggedItem === index ? 'dragging' : ''}`}
                draggable={!component.marker}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <div className="component-header">
                  <div className="component-controls">
                    <div className="drag-handle">⋮⋮</div>
                    <button
                      className={`toggle-btn ${component.enabled ? 'enabled' : 'disabled'}`}
                      onClick={() => handleToggleComponentEnabled(index)}
                      onMouseEnter={(e) => showTooltip(e, component.enabled ? "禁用组件" : "启用组件")}
                      onMouseLeave={hideTooltip}
                    >
                      {component.enabled ? '✓' : '○'}
                    </button>
                    <span className="component-name">{component.name}</span>
                    {component.marker && (
                      <span className="component-marker-badge">固定</span>
                    )}
                  </div>
                  <div className="component-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleStartEditComponent(index)}
                      onMouseEnter={(e) => showTooltip(e, "编辑/查看组件")}
                      onMouseLeave={hideTooltip}
                    >
                      编辑
                    </button>
                    {!component.marker && (
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteComponent(index)}
                        onMouseEnter={(e) => showTooltip(e, "删除组件")}
                        onMouseLeave={hideTooltip}
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>

                <div className="component-footer">
                  <span className="token-count">
                    字符数: {component.content ? component.content.length : 0}
                  </span>
                </div>
              </div>
            </React.Fragment>
          ))}

          {/* 最后一个拖拽指示器 - 在列表末尾 */}
          <div
            className={`drag-indicator ${dragOverItem === promptComponents.length ? 'visible' : ''}`}
            onDragOver={(e) => handleDragOver(e, promptComponents.length)}
            onDrop={(e) => handleDrop(e, promptComponents.length)}
          />
        </div>

      </div>
    </div>
  );
};

export default PresetPanel;
