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
      key: [],
      keysecondary: [],
      content: '',
      comment: '',
      constant: false,
      position: 0,
      order: 100,
      depth:4,
      selective: true,
      selectiveLogic: 0,
      probability: 100,
      useProbability: false,
      role: 0,
      caseSensitive: false,
      matchWholeWords: false,
      useGroupScoring: false,
      group: '',
      groupOverride: false,
      groupWeight: 100,
      excludeRecursion: true,
      preventRecursion: true,
      delayUntilRecursion: false,
      disable: false,
      ignoreBudget: false,
      outletName: '',
      automationId: '',
      sticky: 0,
      cooldown: 0,
      delay: 0,
      triggers: [],
      displayIndex: 0,
      vectorized: false,
      // 新的触发配置结构
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
  const [showGlobalDropdown, setShowGlobalDropdown] = useState(false);

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

  const handleCreateWorldBook = async () => {
    const name = prompt('请输入世界书名称:');
    const description = prompt('请输入世界书描述（可选）:') || '';
    if (name) {
      try {
        await createWorldBook({ name, description });
        // 创建成功后自动选择新创建的世界书
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

      // 生成新的UID
      const maxUid = currentEntries.reduce((max, entry) => Math.max(max, entry.uid), 0);
      const newUid = maxUid + 1;

      // 处理触发配置数据
      const triggerConfig = {
        triggers: {
          constant: [newEntry.constant, null],
          keyword: [!newEntry.constant && newEntry.key.length > 0, {
            key: newEntry.key,
            keysecondary: newEntry.keysecondary,
            selective: newEntry.selective,
            selectiveLogic: newEntry.selectiveLogic,
            matchWholeWords: newEntry.matchWholeWords,
            caseSensitive: newEntry.caseSensitive
          }],
          rag: [false, {
            threshold: newEntry.rag_threshold || 0.75,
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
        disable: newEntry.disable,
        ignoreBudget: newEntry.ignoreBudget,
        outletName: newEntry.outletName,
        automationId: newEntry.automationId,
        sticky: newEntry.sticky,
        cooldown: newEntry.cooldown,
        delay: newEntry.delay,
        triggers: newEntry.triggers,
        displayIndex: newEntry.displayIndex,
        vectorized: newEntry.vectorized,
        useGroupScoring: newEntry.useGroupScoring,
        group: newEntry.group,
        groupOverride: newEntry.groupOverride,
        groupWeight: newEntry.groupWeight,
        excludeRecursion: newEntry.excludeRecursion,
        preventRecursion: newEntry.preventRecursion,
        delayUntilRecursion: newEntry.delayUntilRecursion,
        probability: newEntry.probability,
        useProbability: newEntry.useProbability,
        trigger_config: triggerConfig
      };

      try {
        await createWorldBookEntry(currentWorldBook.name, entryData);
        // 重置新条目表单
        setNewEntry({
          uid: 0,
          key: [],
          keysecondary: [],
          content: '',
          comment: '',
          constant: false,
          position: 0,
          order: 100,
          depth:4,
          selective: true,
          selectiveLogic: 0,
          probability: 100,
          useProbability: false,
          role: 0,
          caseSensitive: false,
          matchWholeWords: false,
          useGroupScoring: false,
          group: '',
          groupOverride: false,
          groupWeight: 100,
          excludeRecursion: true,
          preventRecursion: true,
          delayUntilRecursion: false,
          disable: false,
          ignoreBudget: false,
          outletName: '',
          automationId: '',
          sticky: 0,
          cooldown: 0,
          delay: 0,
          triggers: [],
          displayIndex: 0,
          vectorized: false,
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
        // 导入成功后选择新导入的世界书
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

  return (
    <div className="worldbook-content">
      {/* 全局世界书区域 */}
      <div className="worldbook-selector-section">
        {/* 全局世界书展示区域 */}
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
                        // 防止点击复选框时触发选择世界书
                        if (e.target.type !== 'checkbox') {
                          handleSelectWorldBook(book);
                        }
                      }}
                    >
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={book.is_global}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleGlobal(book.name, e.target.checked);
                          }}
                        />
                        <span className="book-name">{book.name}</span>
                        {book.description && (
                          <span className="book-desc">{book.description}</span>
                        )}
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
            <div className="entries-container" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>

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
                      <span className={`entry-status ${!entry.disable ? 'enabled' : ''}`}>
                        {!entry.disable ? '启用' : '禁用'}
                      </span>
                    </div>
                    <div className="entry-meta">
                      <span>策略: {entry.trigger_strategy}</span>
                      <span>位置: {entry.position}</span>
                      <span>顺序: {entry.order}</span>
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
                                currentEntry.trigger_config?.triggers?.keyword?.[0] || false,
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
                                currentEntry.trigger_config?.triggers?.keyword?.[0] || false,
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
                                  currentEntry.trigger_config?.triggers?.keyword?.[0] || false,
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
                                  currentEntry.trigger_config?.triggers?.keyword?.[0] || false,
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
                                  currentEntry.trigger_config?.triggers?.keyword?.[0] || false,
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


          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={currentEntry.useProbability}
                onChange={(e) => handleEntryUpdate('useProbability', e.target.checked)}
              />
              使用概率判定
            </label>
          </div>

          {currentEntry.useProbability && (
            <div className="form-group">
              <label className="form-label">触发概率 (%)</label>
              <input
                type="number"
                className="form-input"
                min="0"
                max="100"
                value={currentEntry.probability}
                onChange={(e) => handleEntryUpdate('probability', parseInt(e.target.value))}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">分组</label>
            <input
              type="text"
              className="form-input"
              value={currentEntry.group || ''}
              onChange={(e) => handleEntryUpdate('group', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">分组权重</label>
            <input
              type="number"
              className="form-input"
              value={currentEntry.groupWeight}
              onChange={(e) => handleEntryUpdate('groupWeight', parseInt(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={currentEntry.groupOverride}
                onChange={(e) => handleEntryUpdate('groupOverride', e.target.checked)}
              />
              覆盖分组限制
            </label>
          </div>

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
