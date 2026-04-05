import { create } from 'zustand';

const useWorldBookStore = create((set, get) => ({
  // 世界书列表
  worldBooks: [],
  // 当前选中的世界书（用于编辑）
  selectedWorldBook: null,
  // 全局激活的世界书列表（在槽位中显示）
  globalWorldBooks: [],
  // 是否显示编辑面板
  showEditPanel: false,
  // 当前编辑的条目
  editingEntry: null,
  // 加载状态
  isLoading: false,
  // 选中世界书的加载状态
  isSelecting: false,
  // 错误信息
  error: null,
  // 是否显示世界书下拉框
  showWorldBookDropdown: false,
  // 是否显示添加世界书下拉框
  showAddWorldBookDropdown: false,

  // 从后端获取世界书列表
  fetchWorldBooks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/worldbooks');
      if (!response.ok) {
        throw new Error('获取世界书列表失败');
      }
      const data = await response.json();
      set({
        worldBooks: data.worldbooks,
        globalWorldBooks: data.worldbooks.filter(book => book.enabled),
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error('获取世界书列表失败:', error);
    }
  },

  // 切换世界书选择下拉框显示
  toggleWorldBookDropdown: () => set((state) => ({
    showWorldBookDropdown: !state.showWorldBookDropdown
  })),

  // 切换添加世界书下拉框显示
  toggleAddWorldBookDropdown: () => set((state) => ({
    showAddWorldBookDropdown: !state.showAddWorldBookDropdown
  })),

  // 添加世界书到全局槽位
  addGlobalWorldBook: async (uid) => {
    try {
      const response = await fetch(`/api/worldbooks/${uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: true
        }),
      });

      if (!response.ok) {
        throw new Error('添加全局世界书失败');
      }

      // 更新本地状态
      set((state) => ({
        worldBooks: state.worldBooks.map(b =>
          b.uid === uid ? { ...b, enabled: true } : b
        ),
        globalWorldBooks: [...state.globalWorldBooks, state.worldBooks.find(b => b.uid === uid)]
      }));
    } catch (error) {
      console.error('添加全局世界书失败:', error);
      throw error;
    }
  },

  // 从全局槽位移除世界书
  removeGlobalWorldBook: async (uid) => {
    try {
      const response = await fetch(`/api/worldbooks/${uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: false
        }),
      });

      if (!response.ok) {
        throw new Error('移除全局世界书失败');
      }

      // 更新本地状态
      set((state) => ({
        worldBooks: state.worldBooks.map(b =>
          b.uid === uid ? { ...b, enabled: false } : b
        ),
        globalWorldBooks: state.globalWorldBooks.filter(b => b.uid !== uid)
      }));
    } catch (error) {
      console.error('移除全局世界书失败:', error);
      throw error;
    }
  },

  // 创建新世界书
  createWorldBook: async (name, description) => {
    try {
      const response = await fetch('/api/worldbooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description: description || '',
          enabled: false // 新建的世界书默认不全局激活
        }),
      });

      if (!response.ok) {
        throw new Error('创建世界书失败');
      }

      // 重新获取世界书列表
      await get().fetchWorldBooks();

      return await response.json();
    } catch (error) {
      console.error('创建世界书失败:', error);
      throw error;
    }
  },

  // 删除世界书
  deleteWorldBook: async (id) => {
    try {
      const response = await fetch(`/api/worldbooks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除世界书失败');
      }

      // 更新状态
      set((state) => ({
        worldBooks: state.worldBooks.filter(book => book.uid !== id),
        selectedWorldBook: state.selectedWorldBook?.uid === id ? null : state.selectedWorldBook,
        globalWorldBooks: state.globalWorldBooks.filter(book => book.uid !== id)
      }));
    } catch (error) {
      console.error('删除世界书失败:', error);
      throw error;
    }
  },

  // 选择世界书（用于编辑）
  selectWorldBook: async (id) => {
    set({ isSelecting: true, error: null });
    try {
      const response = await fetch(`/api/worldbooks/${id}`);
      if (!response.ok) {
        throw new Error('获取世界书详情失败');
      }
      const data = await response.json();
      set({
        selectedWorldBook: data,
        isSelecting: false
      });
    } catch (error) {
      set({ error: error.message, isSelecting: false });
      console.error('获取世界书详情失败:', error);
      throw error;
    }
  },

  // 添加条目
  addEntry: async (entry) => {
    const state = get();
    if (!state.selectedWorldBook) return;

    try {
      const response = await fetch(`/api/worldbooks/${state.selectedWorldBook.uid}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error('添加条目失败');
      }

      // 重新获取选中的世界书
      await get().selectWorldBook(state.selectedWorldBook.uid);
    } catch (error) {
      console.error('添加条目失败:', error);
      throw error;
    }
  },

  // 删除条目
  deleteEntry: async (entryId) => {
    const state = get();
    if (!state.selectedWorldBook) return;

    try {
      const response = await fetch(`/api/worldbooks/${state.selectedWorldBook.uid}/entries/${entryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除条目失败');
      }

      // 重新获取选中的世界书
      await get().selectWorldBook(state.selectedWorldBook.uid);
    } catch (error) {
      console.error('删除条目失败:', error);
      throw error;
    }
  },

  // 更新条目
  updateEntry: async (entryId, updatedEntry) => {
    const state = get();
    if (!state.selectedWorldBook) return;

    try {
      const response = await fetch(`/api/worldbooks/${state.selectedWorldBook.uid}/entries/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEntry),
      });

      if (!response.ok) {
        throw new Error('更新条目失败');
      }

      // 重新获取选中的世界书
      await get().selectWorldBook(state.selectedWorldBook.uid);
    } catch (error) {
      console.error('更新条目失败:', error);
      throw error;
    }
  },

  // 切换编辑面板显示
  toggleEditPanel: (show, entry = null) => set({
    showEditPanel: show !== undefined ? show : !get().showEditPanel,
    editingEntry: entry
  })
}));

export default useWorldBookStore;
