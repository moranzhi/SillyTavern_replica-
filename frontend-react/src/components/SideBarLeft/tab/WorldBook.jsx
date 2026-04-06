import React, { useEffect, useState } from 'react';
import '../tabcss/WorldBook.css';
import useWorldBookStore from '../../../Store/Slices/LeftTabsSlices/WorldBookSlice';

const WorldBook = () => {
  const {
    worldBooks,
    globalWorldBooks,
    currentWorldBook,
    currentEntries,
    currentEntry,
    loading,
    error,
    success,
    message,
    fetchWorldBooks,
    fetchWorldBook,
    createWorldBook,
    deleteWorldBook,
    fetchWorldBookEntries,
    createWorldBookEntry,
    updateWorldBookEntry,
    deleteWorldBookEntry,
    toggleGlobalWorldBook,
    setCurrentWorldBook,
    setCurrentEntry,
    resetCurrentWorldBook,
    clearError,
    clearSuccess,
  } = useWorldBookStore();

  const [newEntry, setNewEntry] = useState({
    uid: 0,
    content: '',
    comment: '',
    position: 0,
    order: 100,
    depth: 4,
    role: 0,
    trigger_config: {
      triggers: {
        constant: [true, null],
        keyword: [false, {
          key: [],
          keysecondary: [],
          selective: true,
          selectiveLogic: 0,
          matchWholeWords: false,
          caseSensitive: false
        }],
        rag: [false, {
          threshold: 0.75,
          top_k: 5,
          query_template: null
        }],
        condition: [false, {
          variable_a: '',
          operator: '=',
          variable_b: ''
        }]
      }
    }
  });

  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showWorldBookDropdown, setShowWorldBookDropdown] = useState(false);
  const [activeTriggerStrategy, setActiveTriggerStrategy] = useState('constant');

  useEffect(() => {
    fetchWorldBooks();
  }, [fetchWorldBooks]);

  useEffect(() => {
    if (success && message) {
      alert(message);
      clearSuccess();
    }
  }, [success, message, clearSuccess]);

  useEffect(() => {
    if (error) {
      alert(error);
      clearError();
    }
  }, [error, clearError]);

  useEffect(() => {
    if (currentEntry && currentEntry.trigger_config) {
      const triggers = currentEntry.trigger_config.triggers;
      if (triggers.constant[0]) {
        setActiveTriggerStrategy('constant');
      } else if (triggers.keyword[0]) {
        setActiveTriggerStrategy('keyword');
      } else if (triggers.rag[0]) {
        setActiveTriggerStrategy('rag');
      } else if (triggers.condition[0]) {
        setActiveTriggerStrategy('condition');
      }
    }
  }, [currentEntry]);

  const handleCreateWorldBook = async () => {
    const name = prompt('请输入世界书名称:');
    if (name) {
      try {
        await createWorldBook({ name });
        const newBook = worldBooks.find(wb => wb.name === name);
        if (newBook) {
          handleSelectWorldBook(newBook);
        }
      } catch (err) {
        console.error('创建世界书失败:', err);
      }
    }
  };

  const handleSelectWorldBook = async (book) => {
    setCurrentWorldBook(book);
    setShowWorldBookDropdown(false);
    try {
      await fetchWorldBookEntries(book.name);
    } catch (err) {
      console.error('加载世界书条目失败:', err);
    }
  };

  const handleToggleGlobal = async (name, isGlobal) => {
    try {
      await toggleGlobalWorldBook(name, isGlobal);
    } catch (err) {
      console.error('切换全局世界书状态失败:', err);
    }
  };

  const handleAddEntry = async () => {
    if (!currentWorldBook) return;

    const maxUid = currentEntries.reduce((max, entry) => Math.max(max, entry.uid), 0);
    const newUid = maxUid + 1;

    const triggerConfig = {
      triggers: {
        constant: [newEntry.trigger_config.triggers.constant[0], null],
        keyword: [!newEntry.trigger_config.triggers.constant[0] && newEntry.trigger_config.triggers.keyword[1].key.length > 0, {
          key: newEntry.trigger_config.triggers.keyword[1].key,
          keysecondary: newEntry.trigger_config.triggers.keyword[1].keysecondary,
          selective: newEntry.trigger_config.triggers.keyword[1].selective,
          selectiveLogic: newEntry.trigger_config.triggers.keyword[1].selectiveLogic,
          matchWholeWords: newEntry.trigger_config.triggers.keyword[1].matchWholeWords,
          caseSensitive: newEntry.trigger_config.triggers.keyword[1].caseSensitive
        }],
        rag: [false, {
          threshold: 0.75,
          top_k: 5,
          query_template: null
        }],
        condition: [false, {
          variable_a: '',
          operator: '=',
          variable_b: ''
        }]
      }
    };

    const entryData = {
      uid: newUid,
      content: newEntry.content,
      comment: newEntry.comment,
      position: newEntry.position,
      order: newEntry.order,
      depth: newEntry.depth,
      role: newEntry.role,
      trigger_config: triggerConfig
    };

    try {
      await createWorldBookEntry(currentWorldBook.name, entryData);
      setNewEntry({
        uid: 0,
        content: '',
        comment: '',
        position: 0,
        order: 100,
        depth: 4,
        role: 0,
        trigger_config: {
          triggers: {
            constant: [true, null],
            keyword: [false, {
              key: [],
              keysecondary: [],
              selective: true,
              selectiveLogic: 0,
              matchWholeWords: false,
              caseSensitive: false
            }],
            rag: [false, {
              threshold: 0.75,
              top_k: 5,
              query_template: null
            }],
            condition: [false, {
              variable_a: '',
              operator: '=',
              variable_b: ''
            }]
          }
        }
      });
    } catch (err) {
      console.error('添加条目失败:', err);
    }
  };

  const handleEntryClick = (entry) => {
    setCurrentEntry(entry);
    setShowEditPanel(true);
  };

  const handleEntryUpdate = async (field, value) => {
    if (!currentEntry || !currentWorldBook) return;

    const updatedEntry = { ...currentEntry, [field]: value };
    try {
      await updateWorldBookEntry(currentWorldBook.name, currentEntry.uid, updatedEntry);
      setCurrentEntry(updatedEntry);
    } catch (err) {
      console.error('更新条目失败:', err);
    }
  };

  const handleTriggerStrategyChange = async (strategy) => {
    if (!currentEntry || !currentWorldBook) return;

    setActiveTriggerStrategy(strategy);

    const updatedTriggers = {
      constant: [false, null],
      keyword: [false, {
        key: [],
        keysecondary: [],
        selective: true,
        selectiveLogic: 0,
        matchWholeWords: false,
        caseSensitive: false
      }],
      rag: [false, {
        threshold: 0.75,
        top_k: 5,
        query_template: null
      }],
      condition: [false, {
        variable_a: '',
        operator: '=',
        variable_b: ''
      }]
    };

    if (strategy !== 'constant') {
      updatedTriggers[strategy][0] = true;
    } else {
      updatedTriggers.constant[0] = true;
    }

    const updatedTriggerConfig = {
      ...currentEntry.trigger_config,
      triggers: updatedTriggers
    };

    try {
      await updateWorldBookEntry(currentWorldBook.name, currentEntry.uid, {
        ...currentEntry,
        trigger_config: updatedTriggerConfig
      });
      setCurrentEntry({
        ...currentEntry,
        trigger_config: updatedTriggerConfig
      });
    } catch (err) {
      console.error('更新触发策略失败:', err);
    }
  };

  const handleDeleteEntry = async () => {
    if (!currentEntry || !currentWorldBook) return;

    if (confirm('确定要删除此条目吗？')) {
      try {
        await deleteWorldBookEntry(currentWorldBook.name, currentEntry.uid);
        setShowEditPanel(false);
        setCurrentEntry(null);
      } catch (err) {
        console.error('删除条目失败:', err);
      }
    }
  };

  const handleDeleteWorldBook = async () => {
    if (!currentWorldBook) return;

    if (confirm(`确定要删除世界书 "${currentWorldBook.name}" 吗？`)) {
      try {
        await deleteWorldBook(currentWorldBook.name);
        resetCurrentWorldBook();
      } catch (err) {
        console.error('删除世界书失败:', err);
      }
    }
  };

  const handleImportWorldBook = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const name = prompt('请输入世界书名称:', file.name.replace('.json', ''));
      if (!name) return;

      try {
        await useWorldBookStore.getState().importWorldBook(name, file);
        await fetchWorldBooks();
        const importedBook = worldBooks.find(wb => wb.name === name);
        if (importedBook) {
          handleSelectWorldBook(importedBook);
        }
      } catch (err) {
        console.error('导入世界书失败:', err);
      }
    };
    input.click();
  };

  const handleExportWorldBook = async () => {
    if (!currentWorldBook) return;

    try {
      await useWorldBookStore.getState().exportWorldBook(currentWorldBook.name);
    } catch (err) {
      console.error('导出世界书失败:', err);
    }
  };

  const getPositionInfo = (position) => {
    const positions = {
      0: { label: '角色定义之后', weight: '高', desc: 'AI读完人设紧接着就读到这里，非常适合补充角色的详细设定、性格细节或特殊规则' },
      1: { label: '角色定义之前', weight: '中', desc: '在角色卡内容的最上方，通常用于定义角色的基础背景，让人设部分来解释这些背景' },
      2: { label: '示例对话之前', weight: '低', desc: '在对话示例的最上方' },
      3: { label: '示例对话之后', weight: '低', desc: '用于在对话开始前提供最后的上下文补充' },
      4: { label: '系统提示/作者注释', weight: '极高', desc: 'AI对最近看到的信息记忆最清晰，适合动态信息、当前场景描述或临时规则' },
      5: { label: '作为系统消息', weight: '最高', desc: '强制作为System Prompt插入，通常用于强制指令' }
    };
    return positions[position] || positions[0];
  };

  return (
    <div className="worldbook-content">
      {/* 全局世界书区域 */}
      <div className="worldbook-selector-section">
        <div className="global-books-display">
          <div className="global-books-header">
            <span className="title-text">全局世界书</span>
          </div>
          {globalWorldBooks.length > 0 ? (
            <div className="global-books-list">
              {globalWorldBooks.map(book => (
                <div key={book.name} className="global-book-item">
                  <span className="global-book-name">{book.name}</span>
                  <button
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleGlobal(book.name, false);
                    }}
                    title="取消全局"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-global-books">暂无全局世界书</div>
          )}
        </div>

        {/* 世界书管理区域 */}
        <div className="worldbook-management">
          <div className="worldbook-header">
            <span className="title-text">世界书管理</span>
          </div>

          {/* 操作按钮组 */}
          <div className="worldbook-actions">
            <button className="action-btn" onClick={handleCreateWorldBook}>
              + 新建
            </button>
            <button className="action-btn" onClick={handleImportWorldBook}>
              📥 导入
            </button>
            {currentWorldBook && (
              <button className="action-btn" onClick={handleExportWorldBook}>
                📤 导出
              </button>
            )}
          </div>

          {/* 世界书选择区域 */}
          <div className="worldbook-selector">
            <div className="dropdown" style={{ flex: 1 }}>
              <button className="dropdown-btn" onClick={() => setShowWorldBookDropdown(!showWorldBookDropdown)}>
                {currentWorldBook ? currentWorldBook.name : '选择世界书'}
                <span>▼</span>
              </button>
              {showWorldBookDropdown && (
                <div className="dropdown-menu">
                  {worldBooks.map(book => (
                    <div
                      key={book.name}
                      className={`dropdown-item ${currentWorldBook?.name === book.name ? 'active' : ''}`}
                      onClick={(e) => {
                        if (e.target.type !== 'checkbox') {
                          handleSelectWorldBook(book);
                        }
                      }}
                    >
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={globalWorldBooks.some(wb => wb.name === book.name)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleGlobal(book.name, e.target.checked);
                          }}
                        />
                        <span className="book-name">{book.name}</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {currentWorldBook && (
              <button
                className="btn btn-danger"
                onClick={handleDeleteWorldBook}
              >
                删除
              </button>
            )}
          </div>

          {/* 条目列表区域 */}
          {loading ? (
            <div className="loading">加载中...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : currentWorldBook ? (
            <div className="entries-container">
              {currentEntries.length > 0 ? (
                currentEntries.map(entry => (
                  <div
                    key={entry.uid}
                    className={`entry-item ${currentEntry?.uid === entry.uid ? 'active' : ''}`}
                    onClick={() => handleEntryClick(entry)}
                  >
                    <div className="entry-header">
                      <span className="entry-name">
                        {entry.comment || `条目 #${entry.uid}`}
                      </span>
                      <span className="entry-status">
                        {entry.trigger_config.triggers.constant[0] ? '常驻' : '触发'}
                      </span>
                    </div>
                    <div className="compact-params">
                      <div className="param-item">
                        <span className="param-label">位置:</span>
                        <span className="param-value">{getPositionInfo(entry.position).label}</span>
                      </div>
                      <div className="param-item">
                        <span className="param-label">权重:</span>
                        <span className="param-value">{getPositionInfo(entry.position).weight}</span>
                      </div>
                      <div className="param-item">
                        <span className="param-label">顺序:</span>
                        <span className="param-value">{entry.order}</span>
                      </div>
                      <div className="param-item">
                        <span className="param-label">深度:</span>
                        <span className="param-value">{entry.depth}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="loading">暂无条目</div>
              )}
              <button className="btn btn-primary" onClick={handleAddEntry}>
                + 添加条目
              </button>
            </div>
          ) : (
            <div className="loading">请选择一个世界书</div>
          )}
        </div>
      </div>

      {/* 编辑面板 */}
      {showEditPanel && currentEntry && (
        <div className={`edit-panel ${showEditPanel ? 'open' : ''}`}>
          <div className="edit-panel-header">
            <h2>编辑条目</h2>
            <button className="close-btn" onClick={() => setShowEditPanel(false)}>
              ✕
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">条目名称</label>
            <input
              type="text"
              className="form-input"
              value={currentEntry.comment || ''}
              onChange={(e) => handleEntryUpdate('comment', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">内容</label>
            <textarea
              className="form-input"
              value={currentEntry.content || ''}
              onChange={(e) => handleEntryUpdate('content', e.target.value)}
              rows={10}
            />
          </div>

          <div className="form-group">
            <label className="form-label">插入位置</label>
            <div className="position-selector">
              {[0, 1, 2, 3, 4, 5].map(pos => {
                const info = getPositionInfo(pos);
                return (
                  <div
                    key={pos}
                    className={`position-option ${currentEntry.position === pos ? 'active' : ''}`}
                    onClick={() => handleEntryUpdate('position', pos)}
                  >
                    <div className="position-tooltip" data-tooltip={info.desc}>
                      <span className="position-label">{info.label}</span>
                      <span className="position-weight">{info.weight}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">顺序权重</label>
            <input
              type="number"
              className="form-input"
              value={currentEntry.order || 100}
              onChange={(e) => handleEntryUpdate('order', parseInt(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">扫描深度</label>
            <input
              type="number"
              className="form-input"
              value={currentEntry.depth || 4}
              onChange={(e) => handleEntryUpdate('depth', parseInt(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">角色匹配</label>
            <select
              className="form-input"
              value={currentEntry.role || 0}
              onChange={(e) => handleEntryUpdate('role', parseInt(e.target.value))}
            >
              <option value={0}>Both</option>
              <option value={1}>User</option>
              <option value={2}>Assistant</option>
            </select>
          </div>

          {/* 触发策略选择器 */}
          <div className="form-group">
            <label className="form-label">触发策略</label>
            <div className="trigger-strategy-selector">
              <button
                className={`trigger-strategy-btn ${activeTriggerStrategy === 'constant' ? 'active' : ''}`}
                onClick={() => handleTriggerStrategyChange('constant')}
              >
                常驻触发
              </button>
              <button
                className={`trigger-strategy-btn ${activeTriggerStrategy === 'keyword' ? 'active' : ''}`}
                onClick={() => handleTriggerStrategyChange('keyword')}
              >
                关键词触发
              </button>
              <button
                className={`trigger-strategy-btn ${activeTriggerStrategy === 'rag' ? 'active' : ''}`}
                onClick={() => handleTriggerStrategyChange('rag')}
              >
                RAG触发
              </button>
              <button
                className={`trigger-strategy-btn ${activeTriggerStrategy === 'condition' ? 'active' : ''}`}
                onClick={() => handleTriggerStrategyChange('condition')}
              >
                条件触发
              </button>
            </div>
          </div>

          {/* 根据选择的触发策略显示对应的配置表单 */}
          {activeTriggerStrategy === 'keyword' && (
            <>
              <div className="form-group">
                <label className="form-label">主关键词</label>
                <input
                  type="text"
                  className="form-input"
                  value={currentEntry.trigger_config?.triggers?.keyword?.[1]?.key?.join(', ') || ''}
                  onChange={(e) => {
                    const updatedTriggerConfig = {
                      ...currentEntry.trigger_config,
                      triggers: {
                        ...currentEntry.trigger_config?.triggers,
                        keyword: [
                          true,
                          {
                            ...currentEntry.trigger_config?.triggers?.keyword?.[1],
                            key: e.target.value.split(',').map(k => k.trim())
                          }
                        ]
                      }
                    };
                    handleEntryUpdate('trigger_config', updatedTriggerConfig);
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">次要关键词</label>
                <input
                  type="text"
                  className="form-input"
                  value={currentEntry.trigger_config?.triggers?.keyword?.[1]?.keysecondary?.join(', ') || ''}
                  onChange={(e) => {
                    const updatedTriggerConfig = {
                      ...currentEntry.trigger_config,
                      triggers: {
                        ...currentEntry.trigger_config?.triggers,
                        keyword: [
                          true,
                          {
                            ...currentEntry.trigger_config?.triggers?.keyword?.[1],
                            keysecondary: e.target.value.split(',').map(k => k.trim())
                          }
                        ]
                      }
                    };
                    handleEntryUpdate('trigger_config', updatedTriggerConfig);
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={currentEntry.trigger_config?.triggers?.keyword?.[1]?.selective || false}
                    onChange={(e) => {
                      const updatedTriggerConfig = {
                        ...currentEntry.trigger_config,
                        triggers: {
                          ...currentEntry.trigger_config?.triggers,
                          keyword: [
                            true,
                            {
                              ...currentEntry.trigger_config?.triggers?.keyword?.[1],
                              selective: e.target.checked
                            }
                          ]
                        }
                      };
                      handleEntryUpdate('trigger_config', updatedTriggerConfig);
                    }}
                  />
                  选择性匹配
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={currentEntry.trigger_config?.triggers?.keyword?.[1]?.matchWholeWords || false}
                    onChange={(e) => {
                      const updatedTriggerConfig = {
                        ...currentEntry.trigger_config,
                        triggers: {
                          ...currentEntry.trigger_config?.triggers,
                          keyword: [
                            true,
                            {
                              ...currentEntry.trigger_config?.triggers?.keyword?.[1],
                              matchWholeWords: e.target.checked
                            }
                          ]
                        }
                      };
                      handleEntryUpdate('trigger_config', updatedTriggerConfig);
                    }}
                  />
                  全词匹配
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={currentEntry.trigger_config?.triggers?.keyword?.[1]?.caseSensitive || false}
                    onChange={(e) => {
                      const updatedTriggerConfig = {
                        ...currentEntry.trigger_config,
                        triggers: {
                          ...currentEntry.trigger_config?.triggers,
                          keyword: [
                            true,
                            {
                              ...currentEntry.trigger_config?.triggers?.keyword?.[1],
                              caseSensitive: e.target.checked
                            }
                          ]
                        }
                      };
                      handleEntryUpdate('trigger_config', updatedTriggerConfig);
                    }}
                  />
                  区分大小写
                </label>
              </div>
            </>
          )}

          {activeTriggerStrategy === 'rag' && (
            <>
              <div className="form-group">
                <label className="form-label">相似度阈值</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  className="form-input"
                  value={currentEntry.trigger_config?.triggers?.rag?.[1]?.threshold || 0.75}
                  onChange={(e) => {
                    const updatedTriggerConfig = {
                      ...currentEntry.trigger_config,
                      triggers: {
                        ...currentEntry.trigger_config?.triggers,
                        rag: [
                          true,
                          {
                            ...currentEntry.trigger_config?.triggers?.rag?.[1],
                            threshold: parseFloat(e.target.value)
                          }
                        ]
                      }
                    };
                    handleEntryUpdate('trigger_config', updatedTriggerConfig);
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">返回条目数</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={currentEntry.trigger_config?.triggers?.rag?.[1]?.top_k || 5}
                  onChange={(e) => {
                    const updatedTriggerConfig = {
                      ...currentEntry.trigger_config,
                      triggers: {
                        ...currentEntry.trigger_config?.triggers,
                        rag: [
                          true,
                          {
                            ...currentEntry.trigger_config?.triggers?.rag?.[1],
                            top_k: parseInt(e.target.value)
                          }
                        ]
                      }
                    };
                    handleEntryUpdate('trigger_config', updatedTriggerConfig);
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">查询模板</label>
                <textarea
                  className="form-input"
                  value={currentEntry.trigger_config?.triggers?.rag?.[1]?.query_template || ''}
                  onChange={(e) => {
                    const updatedTriggerConfig = {
                      ...currentEntry.trigger_config,
                      triggers: {
                        ...currentEntry.trigger_config?.triggers,
                        rag: [
                          true,
                          {
                            ...currentEntry.trigger_config?.triggers?.rag?.[1],
                            query_template: e.target.value
                          }
                        ]
                      }
                    };
                    handleEntryUpdate('trigger_config', updatedTriggerConfig);
                  }}
                  rows={3}
                />
              </div>
            </>
          )}

          {activeTriggerStrategy === 'condition' && (
            <>
              <div className="form-group">
                <label className="form-label">变量A</label>
                <input
                  type="text"
                  className="form-input"
                  value={currentEntry.trigger_config?.triggers?.condition?.[1]?.variable_a || ''}
                  onChange={(e) => {
                    const updatedTriggerConfig = {
                      ...currentEntry.trigger_config,
                      triggers: {
                        ...currentEntry.trigger_config?.triggers,
                        condition: [
                          true,
                          {
                            ...currentEntry.trigger_config?.triggers?.condition?.[1],
                            variable_a: e.target.value
                          }
                        ]
                      }
                    };
                    handleEntryUpdate('trigger_config', updatedTriggerConfig);
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">运算符</label>
                <select
                  className="form-input"
                  value={currentEntry.trigger_config?.triggers?.condition?.[1]?.operator || '='}
                  onChange={(e) => {
                    const updatedTriggerConfig = {
                      ...currentEntry.trigger_config,
                      triggers: {
                        ...currentEntry.trigger_config?.triggers,
                        condition: [
                          true,
                          {
                            ...currentEntry.trigger_config?.triggers?.condition?.[1],
                            operator: e.target.value
                          }
                        ]
                      }
                    };
                    handleEntryUpdate('trigger_config', updatedTriggerConfig);
                  }}
                >
                  <option value="等于">等于</option>
                  <option value="大于">大于</option>
                  <option value="小于">小于</option>
                  <option value="不小于">不小于</option>
                  <option value="不大于">不大于</option>
                  <option value="不等于">不等于</option>
                  <option value="包括">包括</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">变量B</label>
                <input
                  type="text"
                  className="form-input"
                  value={currentEntry.trigger_config?.triggers?.condition?.[1]?.variable_b || ''}
                  onChange={(e) => {
                    const updatedTriggerConfig = {
                      ...currentEntry.trigger_config,
                      triggers: {
                        ...currentEntry.trigger_config?.triggers,
                        condition: [
                          true,
                          {
                            ...currentEntry.trigger_config?.triggers?.condition?.[1],
                            variable_b: e.target.value
                          }
                        ]
                      }
                    };
                    handleEntryUpdate('trigger_config', updatedTriggerConfig);
                  }}
                />
              </div>
            </>
          )}

          <button
            className="btn btn-danger"
            onClick={handleDeleteEntry}
          >
            删除条目
          </button>
        </div>
      )}
    </div>
  );
};

export default WorldBook;