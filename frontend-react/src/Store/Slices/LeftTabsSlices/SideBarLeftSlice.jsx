import { create } from 'zustand';

const useSideBarLeftStore = create((set) => ({
  activeTab: 'gallery',

  tabs: [
    { id: 'gallery', label: '🖼️ 画廊' },
    { id: 'api', label: '🔌 API' },
    { id: 'presets', label: '📋 预设' },
    { id: 'worldbook', label: '🌍 世界书' }
  ],

  setActiveTab: (tab) => set({ activeTab: tab })
}));

export default useSideBarLeftStore;
