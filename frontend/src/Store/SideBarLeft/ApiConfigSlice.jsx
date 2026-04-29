// frontend-react/src/Store/SideBarLeft/ApiConfigSlice.jsx
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// 定义初始状态
const initialState = {
  profiles: [], // 所有配置文件列表
  currentProfile: null, // 当前加载的配置文件
  activeMap: {}, // 当前激活的配置映射 { category: profileId }
  loading: false,
  error: null,
  notification: {
    show: false,
    message: '',
    type: 'info' // 'success', 'error', 'info'
  }
};

// 创建 Store
const useApiConfigStore = create(
  devtools(
    (set, get) => ({
      ...initialState,

      // Action: 获取所有配置文件列表
      fetchProfiles: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/api-config/profiles');
          if (!response.ok) {
            throw new Error('Failed to fetch profiles');
          }
          const data = await response.json();
          set({ profiles: data, loading: false });
        } catch (err) {
          set({ error: err.message, loading: false });
          get().showNotification('error', `获取配置文件列表失败: ${err.message}`);
        }
      },

      // Action: 获取单个配置文件
      fetchProfile: async (profileId) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/api-config/profiles/${profileId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch profile');
          }
          const data = await response.json();
          set({ currentProfile: data, loading: false });
          return data;
        } catch (err) {
          set({ error: err.message, loading: false });
          get().showNotification('error', `获取配置文件失败: ${err.message}`);
          throw err;
        }
      },

      // Action: 保存配置文件（批量、增量）
      saveProfile: async (profileId, name, apisToSave) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/api-config/profiles', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              profileId,
              name,
              apis: apisToSave  // 只包含要保存的 API
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to save profile');
          }

          const result = await response.json();
          
          // 更新本地状态
          set(state => {
            const existingIndex = state.profiles.findIndex(p => p.id === profileId);
            let newProfiles = [...state.profiles];
            
            if (existingIndex >= 0) {
              // 更新现有配置文件
              newProfiles[existingIndex] = {
                id: result.id,
                name: result.name
              };
            } else {
              // 添加新配置文件
              newProfiles.push({
                id: result.id,
                name: result.name
              });
            }
            
            return {
              profiles: newProfiles,
              currentProfile: result,
              loading: false
            };
          });

          get().showNotification('success', '配置文件已保存');
          return result;
        } catch (err) {
          set({ error: err.message, loading: false });
          get().showNotification('error', `保存失败: ${err.message}`);
          throw err;
        }
      },

      // Action: 删除配置文件
      deleteProfile: async (profileId) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/api-config/profiles/${profileId}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            throw new Error('Failed to delete profile');
          }

          set(state => ({
            profiles: state.profiles.filter(p => p.id !== profileId),
            currentProfile: state.currentProfile?.id === profileId ? null : state.currentProfile,
            loading: false
          }));

          get().showNotification('success', '配置文件已删除');
        } catch (err) {
          set({ error: err.message, loading: false });
          get().showNotification('error', `删除失败: ${err.message}`);
          throw err;
        }
      },

      // Action: 测试连接并获取模型列表
      testConnection: async (apiUrl, apiKey, category) => {
        try {
          const response = await fetch('/api/api-config/test-connection', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ apiUrl, apiKey, category, model: '' })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Connection test failed');
          }

          const data = await response.json();
          
          if (data.success) {
            return data.models || [];
          } else {
            throw new Error(data.message || '获取模型列表失败');
          }
        } catch (err) {
          get().showNotification('error', `连接测试失败: ${err.message}`);
          throw err;
        }
      },

      // Action: 设置激活配置
      setActiveConfig: async (category, profileId) => {
        try {
          set(state => ({
            activeMap: { ...state.activeMap, [category]: profileId }
          }));
          get().showNotification('success', '已设置为默认配置');
        } catch (err) {
          get().showNotification('error', `设置失败: ${err.message}`);
          throw err;
        }
      },

      // Action: 显示通知
      showNotification: (type, message) => {
        set({ notification: { show: true, type, message } });
        setTimeout(() => {
          set({ notification: { ...get().notification, show: false } });
        }, 3000);
      },
    }),
    {
      name: 'ApiConfigStore',
      partialize: (state) => ({
        activeMap: state.activeMap
      })
    }
  )
);

// 导出 Hook
export default useApiConfigStore;