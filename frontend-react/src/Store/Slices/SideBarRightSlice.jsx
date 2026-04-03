import { create } from 'zustand';

const useSideBarRightStore = create((set) => ({
  selectedTabs: ['dice', 'macros'],

  allTabs: [
    { id: 'dice', label: '🎲 骰子与工具', component: null },
    { id: 'debug', label: '🔍 上下文调试', component: null },
    { id: 'macros', label: '🔧 快捷宏', component: null },
    { id: 'table', label: '📊 动态表格', component: null }
  ],

  handleTabClick: (tabId) => set((state) => {
    if (state.selectedTabs.includes(tabId)) {
      // 如果已选中，则取消选中
      return { selectedTabs: state.selectedTabs.filter(id => id !== tabId) };
    } else if (state.selectedTabs.length < 2) {
      // 如果未选中且少于2个，则添加
      return { selectedTabs: [...state.selectedTabs, tabId] };
    } else {
      // 如果已有2个，则替换最早选中的
      return { selectedTabs: [...state.selectedTabs.slice(1), tabId] };
    }
  }),

  // 设置特定标签的组件
  setTabComponent: (tabId, component) => set((state) => ({
    allTabs: state.allTabs.map(tab =>
      tab.id === tabId ? { ...tab, component } : tab
    )
  }))
}));

export default useSideBarRightStore;
