import React, {useEffect, useState} from 'react';
import './WorldBook.css';
import useWorldBookStore from '../../../../Store/SideBarLeft/WorldBookSlice';
import useSideBarLeftStore from '../../../../Store/SideBarLeft/SideBarLeftSlice';

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
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20); // 默认每页20条
  
  // 获取当前激活的分页
  const { activeTab } = useSideBarLeftStore();
  
  // 记录上一次的分页状态
  const prevActiveTabRef = React.useRef(activeTab);

  // 每次切换到世界书分页时重新加载列表
  useEffect(() => {
    // 检测是否从其他分页切换到世界书分页
    if (activeTab === 'worldbook' && prevActiveTabRef.current !== 'worldbook') {
      fetchWorldBooks();
    }
    // 更新上一次的分页状态
    prevActiveTabRef.current = activeTab;
  }, [activeTab, fetchWorldBooks]);

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
        await createWorldBook({name});
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

    const updatedEntry = {...currentEntry, [field]: value};
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
        // 读取文件内容并在控制台显示
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const fileContent = JSON.parse(event.target.result);
            
            // 智能检测格式
            let formatType = 'unknown';
            if (fileContent.entries) {
              if (typeof fileContent.entries === 'object' && !Array.isArray(fileContent.entries)) {
                formatType = 'sillytavern';
              } else if (Array.isArray(fileContent.entries)) {
                formatType = 'internal';
              }
            }
            
            console.group('📥 世界书导入详情');
            console.log('📄 文件名:', file.name);
            console.log('🏷️ 世界书名称:', name);
            console.log('🔍 检测到格式:', formatType === 'sillytavern' ? 'SillyTavern' : formatType === 'internal' ? '内部格式' : '未知');
            console.log('📦 文件大小:', (file.size / 1024).toFixed(2), 'KB');
            console.log('📋 文件类型:', file.type || 'application/json');
            console.log('📝 文件内容预览:', fileContent);
            console.log('🔧 发送到后端的数据:');
            console.log('  - URL: /api/worldbooks/${name}/import');
            console.log('  - Method: POST');
            console.log('  - Content-Type: multipart/form-data');
            console.log('  - FormData:');
            console.log('    • file:', file);
            
            // 显示条目信息
            if (fileContent.entries) {
              const entriesArray = Array.isArray(fileContent.entries) 
                ? fileContent.entries 
                : Object.values(fileContent.entries);
              console.log('📚 条目数量:', entriesArray.length);
              console.log('📚 条目列表:', entriesArray.map(entry => ({
                uid: entry.uid,
                comment: entry.comment || entry.key?.join(', ') || '未命名',
                content: entry.content?.substring(0, 50) + '...' || '无内容'
              })));
            }
            
            console.groupEnd();
          } catch (parseError) {
            console.error('❌ 文件解析失败:', parseError);
          }
        };
        reader.readAsText(file);

        await useWorldBookStore.getState().importWorldBook(name, file);
        await fetchWorldBooks();
        const importedBook = worldBooks.find(wb => wb.name === name);
        if (importedBook) {
          handleSelectWorldBook(importedBook);
          // 导入成功后自动加载条目
          await fetchWorldBookEntries(name);
          console.log('✅ 世界书导入成功，已加载条目');
        }
      } catch (err) {
        console.error('❌ 导入世界书失败:', err);
      }
    };
    input.click();
  };

  const handleExportWorldBook = async () => {
    if (!currentWorldBook) return;

    // 让用户选择导出格式
    const formatChoice = confirm(
      '选择导出格式:\n\n' +
      '确定 - 导出为内部格式(保留所有设置)\n' +
      '取消 - 导出为 SillyTavern 格式(可能丢失特殊设置)'
    );
    
    const format = formatChoice ? 'internal' : 'sillytavern';
    const formatName = formatChoice ? '内部格式' : 'SillyTavern 格式';
    
    console.log(`📤 导出世界书: ${currentWorldBook.name} (${formatName})`);

    try {
      await useWorldBookStore.getState().exportWorldBook(currentWorldBook.name, format);
      console.log('✅ 导出成功');
    } catch (err) {
      console.error('❌ 导出世界书失败:', err);
    }
  };

  const getPositionInfo = (position) => {
    const positions = {
      0: {
        label: '角色定义之后',
        weight: '高',
        desc: 'AI读完人设紧接着就读到这里，非常适合补充角色的详细设定、性格细节或特殊规则'
      },
      1: {
        label: '角色定义之前',
        weight: '中',
        desc: '在角色卡内容的最上方，通常用于定义角色的基础背景，让人设部分来解释这些背景'
      },
      2: {label: '示例对话之前', weight: '低', desc: '在对话示例的最上方'},
      3: {label: '示例对话之后', weight: '低', desc: '用于在对话开始前提供最后的上下文补充'},
      4: {
        label: '系统提示/作者注释',
        weight: '极高',
        desc: 'AI对最近看到的信息记忆最清晰，适合动态信息、当前场景描述或临时规则'
      },
      5: {label: '作为系统消息', weight: '最高', desc: '强制作为System Prompt插入，通常用于强制指令'}
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
              <div className="dropdown" style={{flex: 1}}>
                <button className="dropdown-btn"
                        onClick={() => setShowWorldBookDropdown(!showWorldBookDropdown)}>
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
                      currentEntries.map(entry => {
                        // 计算 token 数(估算)
                        const tokenCount = Math.ceil((entry.content?.length || 0) / 4);
                        
                        // 判断是否启用
                        const isDisabled = entry.disable === true;
                        const isEnabled = !isDisabled;
                        
                        return (
                          <div
                              key={entry.uid}
                              className={`entry-item-compact ${currentEntry?.uid === entry.uid ? 'active' : ''}`}
                              onClick={() => handleEntryClick(entry)}
                          >
                            {/* 第一行：条目名称 + Token数 + 开关 */}
                            <div className="entry-row-top">
                              <span className="entry-name-compact">
                                {entry.comment || entry.key?.join(', ') || `条目 #${entry.uid.substring(0, 8)}`}
                              </span>
                              
                              <span className="entry-tokens">
                                {tokenCount} tokens
                              </span>
                              
                              {/* 启用开关 */}
                              <label 
                                className="toggle-switch"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleEntryUpdate('disable', !e.target.checked);
                                  }}
                                />
                                <span className="toggle-slider"></span>
                              </label>
                            </div>
                            
                            {/* 第二行：插入位置下拉框 */}
                            <div className="entry-row-bottom" onClick={(e) => e.stopPropagation()}>
                              <select
                                className="position-select"
                                value={entry.position || 0}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleEntryUpdate('position', parseInt(e.target.value));
                                }}
                              >
                                {[0, 1, 2, 3, 4, 5].map(pos => {
                                  const info = getPositionInfo(pos);
                                  return (
                                    <option key={pos} value={pos}>
                                      {info.label}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          </div>
                        );
                      })
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

        {/* 编辑面板遮罩层 */}
        <div className={`edit-panel-overlay ${showEditPanel ? 'open' : ''}`}
             onClick={() => setShowEditPanel(false)}/>

        {/* 编辑面板 */}
        {showEditPanel && currentEntry && (
            <div className={`edit-panel ${showEditPanel ? 'open' : ''}`}>
              {/* 头部 */}
              <div className="edit-panel-header">
                <h2>编辑条目 - UID: {currentEntry.uid}</h2>
                <button className="close-btn" onClick={() => setShowEditPanel(false)}>
                  ✕
                </button>
              </div>

              {/* 内容区 */}
              <div className="edit-panel-content">
                {/* 上部设置区 */}
                <div className="form-row">
                  <div className="form-group compact" style={{flex: 2}}>
                    <label className="form-label">条目名称</label>
                    <input
                        type="text"
                        className="form-input"
                        value={currentEntry.comment || ''}
                        onChange={(e) => handleEntryUpdate('comment', e.target.value)}
                        placeholder="可选的备注名称"
                    />
                  </div>

                  <div className="form-group compact">
                    <label className="form-label">插入位置</label>
                    <select
                        className="form-input"
                        value={currentEntry.position || 0}
                        onChange={(e) => handleEntryUpdate('position', parseInt(e.target.value))}
                    >
                      {[0, 1, 2, 3, 4, 5].map(pos => {
                        const info = getPositionInfo(pos);
                        return (
                            <option key={pos} value={pos}>
                              {info.label} ({info.weight})
                            </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="form-group compact">
                    <label className="form-label">顺序权重</label>
                    <input
                        type="number"
                        className="form-input"
                        value={currentEntry.order || 100}
                        onChange={(e) => handleEntryUpdate('order', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="form-group compact">
                    <label className="form-label">扫描深度</label>
                    <input
                        type="number"
                        className="form-input"
                        value={currentEntry.depth || 4}
                        onChange={(e) => handleEntryUpdate('depth', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                {/* 主体内容区 */}
                <div className="form-group" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                  <label className="form-label">条目内容</label>
                  <textarea
                      className="form-input content-textarea"
                      value={currentEntry.content || ''}
                      onChange={(e) => handleEntryUpdate('content', e.target.value)}
                      placeholder="在此输入世界书条目的内容..."
                  />
                </div>

                {/* 触发策略配置 */}
                <div className="form-group">
                  <div className="trigger-config-row">
                    <div className="trigger-selector">
                      <label className="form-label">触发策略</label>
                      <select
                          className="form-input"
                          value={activeTriggerStrategy}
                          onChange={(e) => handleTriggerStrategyChange(e.target.value)}
                      >
                        <option value="constant">常驻触发</option>
                        <option value="keyword">关键词触发</option>
                        <option value="rag">RAG触发</option>
                        <option value="condition">条件触发</option>
                      </select>
                    </div>

                    {/* 根据选择的触发策略显示对应的配置表单 */}
                    <div className="trigger-config-panel">
                      {activeTriggerStrategy === 'keyword' && (
                          <div className="keyword-config">
                            <div className="form-group compact">
                              <label className="form-label">主关键词（用逗号分隔）</label>
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
                                            key: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                                          }
                                        ]
                                      }
                                    };
                                    handleEntryUpdate('trigger_config', updatedTriggerConfig);
                                  }}
                                    placeholder="例如：魔法, 火焰, 冰霜"
                                    />
                                    </div>

                                    <div className="form-group compact">
                                    <label className="form-label">次要关键词（用逗号分隔）</label>
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
                                            keysecondary: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                                          }
                                        ]
                                      }
                                    };
                                    handleEntryUpdate('trigger_config', updatedTriggerConfig);
                                  }}
                                    placeholder="可选的过滤关键词"
                                    />
                                    </div>

                                    <div className="checkbox-group">
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
                        </div>
                        )}

                      {activeTriggerStrategy === 'rag' && (
                          <div className="rag-config">
                            <div className="form-group compact">
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

                                    <div className="form-group compact">
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

                                    <div className="form-group compact">
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
                                    rows={2}
                                    />
                                    </div>
                                    </div>
                                    )}

                                  {activeTriggerStrategy === 'condition' && (
                                      <div className="condition-config">
                                        <div className="form-group compact">
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

                                                <div className="form-group compact">
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

                                                <div className="form-group compact">
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
                                                </div>
                                                )}
                                        </div>
                                      </div>
                                    </div>
                                    </div>

                                  {/* 底部操作栏 */}
                              <div className="edit-panel-footer">
                                <button
                                    className="btn btn-danger"
                                    onClick={() => {
                                      if (window.confirm('确定要删除这个条目吗？')) {
                                        handleDeleteEntry();
                                      }
                                    }}
                                >
                                  删除条目
                                </button>
                                <div style={{flex: 1}}/>
                                <button
                                    className="btn"
                                    onClick={() => setShowEditPanel(false)}
                                >
                                  取消
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowEditPanel(false)}
                                >
                                  保存并关闭
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    };

export default WorldBook;
