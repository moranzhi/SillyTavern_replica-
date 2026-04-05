import React, { useEffect, useState } from 'react';
import '../tabcss/WorldBook.css';
import useWorldBookStore from '../../../Store/Slices/LeftTabsSlices/WorldBookSlice';

const WorldBook = () => {
  const {
    worldBooks,
    selectedWorldBook,
    showEditPanel,
    editingEntry,
    isLoading,
    isSelecting,
    error,
    showWorldBookDropdown,
    globalWorldBooks,
    fetchWorldBooks,
    toggleWorldBookDropdown,
    addGlobalWorldBook,
    removeGlobalWorldBook,
    createWorldBook,
    deleteWorldBook,
    selectWorldBook,
    addEntry,
    deleteEntry,
    updateEntry,
    toggleEditPanel,
  } = useWorldBookStore();


  const [newEntry, setNewEntry] = useState({
    name: '',
    content: '',
    enabled: true,
    triggerStrategy: 'keyword',
    insertPosition: 'after',
    order: 0,
  });

        useEffect(() => {
          fetchWorldBooks();
        }, [fetchWorldBooks]);



  const handleCreateWorldBook = async () => {
    const name = prompt('请输入世界书名称:');
    if (name) {
      await createWorldBook(name);
    }
  };

  const handleAddEntry = async () => {
    if (!selectedWorldBook) return;
    await addEntry(newEntry);
    setNewEntry({
      name: '',
      content: '',
      enabled: true,
      triggerStrategy: 'keyword',
      insertPosition: 'after',
      order: 0,
    });
  };

  const handleEntryClick = (entry) => {
    toggleEditPanel(true, entry);
  };

  const handleEntryUpdate = async (field, value) => {
    if (!editingEntry) return;
    const updatedEntry = { ...editingEntry, [field]: value };
    await updateEntry(editingEntry.uid, updatedEntry);
  };

  const isGlobalBook = (bookUid) => {
    return globalWorldBooks.some(gb => gb.uid === bookUid);
  };

  const handleToggleGlobalBook = (bookUid) => {
    if (isGlobalBook(bookUid)) {
      removeGlobalWorldBook(bookUid);
    } else {
      addGlobalWorldBook(bookUid);
    }
  };

  const sortedWorldBooks = [...worldBooks].sort((a, b) => {
    const aIsGlobal = isGlobalBook(a.uid);
    const bIsGlobal = isGlobalBook(b.uid);
    if (aIsGlobal && !bIsGlobal) return -1;
    if (!aIsGlobal && bIsGlobal) return 1;
    return 0;
  });

  return (
    <div className="worldbook-content">
            {/* 全局世界书区域 */}
            <div className="global-worldbooks-section">
              <div className="global-worldbooks-slot">
                <div className="global-books-header">
                  <span className="title-text">全局世界书</span>
                  {globalWorldBooks.length > 0 && (
                    <div className="active-books-list">
                      {globalWorldBooks.map(book => (
                        <span
                          key={book.uid}
                          className="active-book-item"
                          onClick={() => selectWorldBook(book.uid)}
                        >
                          {book.name}
                          <span
                            className="remove-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeGlobalWorldBook(book.uid);
                            }}
                          >
                            ✕
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 操作按钮组 */}
              <div className="worldbook-actions">
                <button className="action-btn" onClick={handleCreateWorldBook}>
                  + 新建
                </button>
                <button className="action-btn">
                  📋 复制
                </button>
                <button className="action-btn">
                  📥 导入
                </button>
                <button className="action-btn">
                  📤 导出
                </button>
              </div>
            </div>


      {/* 世界书选择区域 */}
      <div className="worldbook-selector">
        <div className="dropdown" style={{ flex: 1 }}>
          <button className="dropdown-btn" onClick={toggleWorldBookDropdown}>
            {selectedWorldBook ? selectedWorldBook.name : '选择世界书'}
            <span>▼</span>
          </button>
          {showWorldBookDropdown && (
            <div className="dropdown-menu">
              {worldBooks.map(book => (
                <div
                  key={book.uid}
                  className={`dropdown-item ${selectedWorldBook?.uid === book.uid ? 'active' : ''}`}
                  onClick={() => {
                    selectWorldBook(book.uid);
                    toggleWorldBookDropdown(false);
                  }}
                >
                  {book.name}
                </div>
              ))}
            </div>
          )}
        </div>
        {selectedWorldBook && (
          <button
            className="btn btn-danger"
            onClick={() => deleteWorldBook(selectedWorldBook.uid)}
          >
            删除
          </button>
        )}
      </div>

      {/* 条目列表区域 */}
      {isLoading ? (
        <div className="loading">加载中...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : selectedWorldBook ? (
        <div className="entries-container">
          {isSelecting ? (
            <div className="loading">加载条目中...</div>
          ) : selectedWorldBook.entries && selectedWorldBook.entries.length > 0 ? (
            selectedWorldBook.entries.map(entry => (
              <div
                key={entry.uid}
                className={`entry-item ${editingEntry?.uid === entry.uid ? 'active' : ''}`}
                onClick={() => handleEntryClick(entry)}
              >
                <div className="entry-header">
                  <span className="entry-name">{entry.name}</span>
                  <span className={`entry-status ${entry.enabled ? 'enabled' : ''}`}>
                    {entry.enabled ? '启用' : '禁用'}
                  </span>
                </div>
                <div className="entry-meta">
                  <span>策略: {entry.triggerStrategy}</span>
                  <span>位置: {entry.insertPosition}</span>
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

      {/* 编辑面板 */}
      {showEditPanel && editingEntry && (
        <div className={`edit-panel ${showEditPanel ? 'open' : ''}`}>
          <div className="edit-panel-header">
            <h2>编辑条目</h2>
            <button className="close-btn" onClick={() => toggleEditPanel(false)}>
              ✕
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">名称</label>
            <input
              type="text"
              className="form-input"
              value={editingEntry.name}
              onChange={(e) => handleEntryUpdate('name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">内容</label>
            <textarea
              className="form-textarea"
              value={editingEntry.content}
              onChange={(e) => handleEntryUpdate('content', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={editingEntry.enabled}
                onChange={(e) => handleEntryUpdate('enabled', e.target.checked)}
              />
              启用此条目
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">触发策略</label>
            <select
              className="form-select"
              value={editingEntry.triggerStrategy}
              onChange={(e) => handleEntryUpdate('triggerStrategy', e.target.value)}
            >
              <option value="persistent">持久</option>
              <option value="keyword">关键词</option>
              <option value="rag">RAG</option>
              <option value="calculation">运算</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">插入位置</label>
            <select
              className="form-select"
              value={editingEntry.insertPosition}
              onChange={(e) => handleEntryUpdate('insertPosition', e.target.value)}
            >
              <option value="before">之前</option>
              <option value="after">之后</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">顺序</label>
            <input
              type="number"
              className="form-input"
              value={editingEntry.order}
              onChange={(e) => handleEntryUpdate('order', parseInt(e.target.value))}
            />
          </div>

          <button
            className="btn btn-danger"
            onClick={() => deleteEntry(editingEntry.uid)}
          >
            删除条目
          </button>
        </div>
      )}
    </div>
  );
};

export default WorldBook;
