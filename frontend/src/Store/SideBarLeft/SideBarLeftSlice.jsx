import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSideBarLeftStore = create(
  persist(
    (set) => ({
      activeTab: 'gallery',

      tabs: [
        { id: 'gallery', label: '画廊', title: '查看和管理生成的图片' },
        { id: 'character', label: '角色', title: '管理AI角色卡' },
        { id: 'api', label: 'API', title: '配置LLM和生图、向量化API连接' },
        { id: 'presets', label: '预设', title: '管理对话预设和系统提示词' },
        { id: 'worldbook', label: '世界', title: '管理世界观设定和背景知识' }
      ],

      setActiveTab: (tab) => set({ activeTab: tab })
    }),
    {
      name: 'sidebar-left-storage', // localStorage key
      partialize: (state) => ({ activeTab: state.activeTab }) // 只保存 activeTab
    }
  )
);

export default useSideBarLeftStore;
