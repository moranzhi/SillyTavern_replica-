import { create } from 'zustand';

// 辅助函数：处理 API 响应
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `请求失败: ${response.status}`);
  }
  return response.json().catch(() => ({}));
};

// 辅助函数：处理文件下载
const handleFileDownload = async (response, filename) => {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// 创建世界书 store
const useWorldBookStore = create((set, get) => ({
  // 状态
  worldBooks: [], // 世界书列表
  globalWorldBooks: [], // 全局世界书列表
  currentWorldBook: null, // 当前选中的世界书
  currentEntries: [], // 当前世界书的条目列表
  currentEntry: null, // 当前选中的条目
  loading: false, // 加载状态
  error: null, // 错误信息
  success: false, // 操作成功状态
  message: '', // 成功或错误消息

  // Actions
  clearError: () => set({ error: null, message: '' }),

  clearSuccess: () => set({ success: false, message: '' }),

  setCurrentWorldBook: (worldBook) => set({
    currentWorldBook: worldBook,
    currentEntries: [],
    currentEntry: null
  }),

  setCurrentEntry: (entry) => set({ currentEntry: entry }),

  resetCurrentWorldBook: () => set({
    currentWorldBook: null,
    currentEntries: [],
    currentEntry: null
  }),

  // 异步操作：切换世界书的全局状态
  toggleGlobalWorldBook: async (name, isGlobal) => {
    set({ loading: true, error: null, success: false });
    try {
      // 先获取当前世界书的信息
      const currentBook = get().worldBooks.find(wb => wb.name === name);
      if (!currentBook) {
        throw new Error(`世界书 "${name}" 不存在`);
      }

      const formData = new FormData();
      formData.append('description', currentBook.description);
      formData.append('is_global', isGlobal);

      const response = await fetch(`/api/worldbooks/${name}`, {
        method: 'PUT',
        body: formData
      });

      const data = await handleResponse(response);

      set(state => {
        const updatedWorldBooks = state.worldBooks.map(wb =>
          wb.name === data.name ? data : wb
        );

        // 更新全局世界书列表
        let updatedGlobalBooks = [...state.globalWorldBooks];
        const globalIndex = updatedGlobalBooks.findIndex(wb => wb.name === data.name);

        if (isGlobal) {
          // 如果是世界书被标记为全局
          if (globalIndex === -1) {
            // 如果不在全局列表中，添加它
            updatedGlobalBooks = [...updatedGlobalBooks, data];
          } else {
            // 如果已经在全局列表中，更新它
            updatedGlobalBooks[globalIndex] = data;
          }
        } else {
          // 如果世界书不再全局，从全局列表中移除
          if (globalIndex !== -1) {
            updatedGlobalBooks = updatedGlobalBooks.filter(wb => wb.name !== data.name);
          }
        }

        return {
          loading: false,
          worldBooks: updatedWorldBooks,
          globalWorldBooks: updatedGlobalBooks,
          currentWorldBook: state.currentWorldBook?.name === data.name
            ? data
            : state.currentWorldBook,
          success: true,
          message: isGlobal ? `已将 "${name}" 设置为全局世界书` : `已取消 "${name}" 的全局世界书状态`
        };
      });

      return data;
    } catch (error) {
      set({
        loading: false,
        error: error.message,
        success: false
      });
      throw error;
    }
  },

  // 异步操作：获取所有世界书
  fetchWorldBooks: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/worldbooks/`);
      const data = await handleResponse(response);

      // 筛选出全局世界书
      const globalBooks = data.filter(book => book.is_global);

      set({
        loading: false,
        worldBooks: data,
        globalWorldBooks: globalBooks,
        error: null
      });
      return data;
    } catch (error) {
      set({
        loading: false,
        error: error.message
      });
      throw error;
    }
  },

  // 异步操作：获取指定世界书
  fetchWorldBook: async (name) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/worldbooks/${name}`);
      const data = await handleResponse(response);
      set({
        loading: false,
        currentWorldBook: data,
        error: null
      });
      return data;
    } catch (error) {
      set({
        loading: false,
        error: error.message
      });
      throw error;
    }
  },

  // 异步操作：创建世界书
  createWorldBook: async ({ name, description, is_global, file }) => {
    set({ loading: true, error: null, success: false });
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description || '');
      if (is_global !== undefined) {
        formData.append('is_global', is_global);
      }
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch(`/api/worldbooks/`, {
        method: 'POST',
        body: formData
      });

      const data = await handleResponse(response);

      set(state => {
        const newWorldBooks = [...state.worldBooks, data];
        const newGlobalBooks = data.is_global
          ? [...state.globalWorldBooks, data]
          : state.globalWorldBooks;

        return {
          loading: false,
          worldBooks: newWorldBooks,
          globalWorldBooks: newGlobalBooks,
          currentWorldBook: data,
          success: true,
          message: '世界书创建成功'
        };
      });

      return data;
    } catch (error) {
      set({
        loading: false,
        error: error.message,
        success: false
      });
      throw error;
    }
  },

  // 异步操作：更新世界书
  updateWorldBook: async ({ name, description, is_global, file }) => {
    set({ loading: true, error: null, success: false });
    try {
      const formData = new FormData();
      if (description !== undefined) {
        formData.append('description', description);
      }
      if (is_global !== undefined) {
        formData.append('is_global', is_global);
      }
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch(`/api/worldbooks/${name}`, {
        method: 'PUT',
        body: formData
      });

      const data = await handleResponse(response);

      set(state => {
        const updatedWorldBooks = state.worldBooks.map(wb =>
          wb.name === data.name ? data : wb
        );

        // 更新全局世界书列表
        let updatedGlobalBooks = [...state.globalWorldBooks];
        const globalIndex = updatedGlobalBooks.findIndex(wb => wb.name === data.name);

        if (data.is_global) {
          // 如果是世界书被标记为全局
          if (globalIndex === -1) {
            // 如果不在全局列表中，添加它
            updatedGlobalBooks = [...updatedGlobalBooks, data];
          } else {
            // 如果已经在全局列表中，更新它
            updatedGlobalBooks[globalIndex] = data;
          }
        } else {
          // 如果世界书不再全局，从全局列表中移除
          if (globalIndex !== -1) {
            updatedGlobalBooks = updatedGlobalBooks.filter(wb => wb.name !== data.name);
          }
        }

        return {
          loading: false,
          worldBooks: updatedWorldBooks,
          globalWorldBooks: updatedGlobalBooks,
          currentWorldBook: state.currentWorldBook?.name === data.name
            ? data
            : state.currentWorldBook,
          success: true,
          message: '世界书更新成功'
        };
      });

      return data;
    } catch (error) {
      set({
        loading: false,
        error: error.message,
        success: false
      });
      throw error;
    }
  },

  // 异步操作：删除世界书
  deleteWorldBook: async (name) => {
    set({ loading: true, error: null, success: false });
    try {
      const response = await fetch(`/api/worldbooks/${name}`, {
        method: 'DELETE'
      });

      await handleResponse(response);

      set(state => {
        const filteredWorldBooks = state.worldBooks.filter(wb => wb.name !== name);
        const filteredGlobalBooks = state.globalWorldBooks.filter(wb => wb.name !== name);

        return {
          loading: false,
          worldBooks: filteredWorldBooks,
          globalWorldBooks: filteredGlobalBooks,
          currentWorldBook: state.currentWorldBook?.name === name
            ? null
            : state.currentWorldBook,
          currentEntries: state.currentWorldBook?.name === name
            ? []
            : state.currentEntries,
          currentEntry: state.currentWorldBook?.name === name
            ? null
            : state.currentEntry,
          success: true,
          message: '世界书删除成功'
        };
      });

      return name;
    } catch (error) {
      set({
        loading: false,
        error: error.message,
        success: false
      });
      throw error;
    }
  },

  // 异步操作：获取世界书的所有条目
  fetchWorldBookEntries: async (name) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/worldbooks/${name}/entries`);
      const data = await handleResponse(response);

      set(state => {
        if (state.currentWorldBook?.name === name) {
          return {
            loading: false,
            currentEntries: data,
            error: null
          };
        }
        return { loading: false, error: null };
      });

      return data;
    } catch (error) {
      set({
        loading: false,
        error: error.message
      });
      throw error;
    }
  },

  // 异步操作：获取世界书的指定条目
  fetchWorldBookEntry: async (name, uid) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/worldbooks/${name}/entries/${uid}`);
      const data = await handleResponse(response);

      set(state => {
        if (state.currentWorldBook?.name === name) {
          return {
            loading: false,
            currentEntry: data,
            error: null
          };
        }
        return { loading: false, error: null };
      });

      return data;
    } catch (error) {
      set({
        loading: false,
        error: error.message
      });
      throw error;
    }
  },

    // 异步操作：创建世界书条目
    createWorldBookEntry: async (name, entryData) => {
      set({ loading: true, error: null, success: false });
      try {
        // 处理触发配置数据
        const processedEntryData = { ...entryData };
        if (processedEntryData.trigger_config && processedEntryData.trigger_config.triggers) {
          // 创建新的触发配置对象
          const triggerConfig = {
            triggers: {}
          };

          // 处理每个触发策略
          for (const [strategy, triggerInfo] of Object.entries(processedEntryData.trigger_config.triggers)) {
            if (Array.isArray(triggerInfo) && triggerInfo.length >= 2) {
              triggerConfig.triggers[strategy] = [
                triggerInfo[0], // 是否启用
                triggerInfo[1]  // 配置对象
              ];
            } else {
              // 如果格式不正确，设置为不启用
              triggerConfig.triggers[strategy] = [false, null];
            }
          }

          processedEntryData.trigger_config = triggerConfig;
        }

        const response = await fetch(`/api/worldbooks/${name}/entries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(processedEntryData)
        });

        const data = await handleResponse(response);

        set(state => {
          if (state.currentWorldBook?.name === name) {
            return {
              loading: false,
              currentEntries: [...state.currentEntries, data],
              success: true,
              message: '条目创建成功'
            };
          }
          return {
            loading: false,
            success: true,
            message: '条目创建成功'
          };
        });

        return data;
      } catch (error) {
        set({
          loading: false,
          error: error.message,
          success: false
        });
        throw error;
      }
    },


    // 异步操作：更新世界书条目
    updateWorldBookEntry: async (name, uid, entryData) => {
      set({ loading: true, error: null, success: false });
      try {
        // 处理触发配置数据
        const processedEntryData = { ...entryData };
        if (processedEntryData.trigger_config && processedEntryData.trigger_config.triggers) {
          // 创建新的触发配置对象
          const triggerConfig = {
            triggers: {}
          };

          // 处理每个触发策略
          for (const [strategy, triggerInfo] of Object.entries(processedEntryData.trigger_config.triggers)) {
            if (Array.isArray(triggerInfo) && triggerInfo.length >= 2) {
              triggerConfig.triggers[strategy] = [
                triggerInfo[0], // 是否启用
                triggerInfo[1]  // 配置对象
              ];
            } else {
              // 如果格式不正确，设置为不启用
              triggerConfig.triggers[strategy] = [false, null];
            }
          }

          processedEntryData.trigger_config = triggerConfig;
        }

        const response = await fetch(`/api/worldbooks/${name}/entries/${uid}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(processedEntryData)
        });

        const data = await handleResponse(response);

        set(state => {
          if (state.currentWorldBook?.name === name) {
            const updatedEntries = state.currentEntries.map(entry =>
              entry.uid === data.uid ? data : entry
            );

            return {
              loading: false,
              currentEntries: updatedEntries,
              currentEntry: state.currentEntry?.uid === data.uid
                ? data
                : state.currentEntry,
              success: true,
              message: '条目更新成功'
            };
          }
          return {
            loading: false,
            success: true,
            message: '条目更新成功'
          };
        });

        return data;
      } catch (error) {
        set({
          loading: false,
          error: error.message,
          success: false
        });
        throw error;
      }
    },


  // 异步操作：删除世界书条目
  deleteWorldBookEntry: async (name, uid) => {
    set({ loading: true, error: null, success: false });
    try {
      const response = await fetch(`/api/worldbooks/${name}/entries/${uid}`, {
        method: 'DELETE'
      });

      await handleResponse(response);

      set(state => {
        if (state.currentWorldBook?.name === name) {
          const filteredEntries = state.currentEntries.filter(entry => entry.uid !== uid);

          return {
            loading: false,
            currentEntries: filteredEntries,
            currentEntry: state.currentEntry?.uid === uid
              ? null
              : state.currentEntry,
            success: true,
            message: '条目删除成功'
          };
        }
        return {
          loading: false,
          success: true,
          message: '条目删除成功'
        };
      });

      return { name, uid };
    } catch (error) {
      set({
        loading: false,
        error: error.message,
        success: false
      });
      throw error;
    }
  },

  // 异步操作：导入世界书
  importWorldBook: async (name, file) => {
    set({ loading: true, error: null, success: false });
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/worldbooks/${name}/import`, {
        method: 'POST',
        body: formData
      });

      const data = await handleResponse(response);

      set(state => {
        const existingIndex = state.worldBooks.findIndex(wb => wb.name === data.name);
        let updatedWorldBooks;
        let updatedGlobalBooks = [...state.globalWorldBooks];

        if (existingIndex !== -1) {
          updatedWorldBooks = [...state.worldBooks];
          updatedWorldBooks[existingIndex] = data;

          // 更新全局世界书列表
          const globalIndex = updatedGlobalBooks.findIndex(wb => wb.name === data.name);
          if (data.is_global) {
            if (globalIndex === -1) {
              updatedGlobalBooks = [...updatedGlobalBooks, data];
            } else {
              updatedGlobalBooks[globalIndex] = data;
            }
          } else {
            if (globalIndex !== -1) {
              updatedGlobalBooks = updatedGlobalBooks.filter(wb => wb.name !== data.name);
            }
          }
        } else {
          updatedWorldBooks = [...state.worldBooks, data];

          // 如果是世界书被标记为全局，添加到全局列表
          if (data.is_global) {
            updatedGlobalBooks = [...updatedGlobalBooks, data];
          }
        }

        return {
          loading: false,
          worldBooks: updatedWorldBooks,
          globalWorldBooks: updatedGlobalBooks,
          currentWorldBook: state.currentWorldBook?.name === data.name
            ? data
            : state.currentWorldBook,
          success: true,
          message: '世界书导入成功'
        };
      });

      return data;
    } catch (error) {
      set({
        loading: false,
        error: error.message,
        success: false
      });
      throw error;
    }
  },

  // 异步操作：导出世界书
  exportWorldBook: async (name) => {
    set({ loading: true, error: null, success: false });
    try {
      const response = await fetch(`/api/worldbooks/${name}/export`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `请求失败: ${response.status}`);
      }

      // 处理文件下载
      await handleFileDownload(response, `${name}.json`);

      set({
        loading: false,
        success: true,
        message: '世界书导出成功'
      });

      return { name };
    } catch (error) {
      set({
        loading: false,
        error: error.message,
        success: false
      });
      throw error;
    }
  },
}));

export default useWorldBookStore;
