import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSideBarRightStore = create(
  persist(
    (set) => ({
      selectedTabs: ['dice', 'rag'],

      allTabs: [
        { id: 'dice', label: '骰子', title: '掷骰子和随机数生成工具', component: null },
        { id: 'debug', label: '调试', title: '查看具体发送了哪些上下文', component: null },
        { id: 'macros', label: '宏', title: '主要为快捷输入', component: null },
        { id: 'table', label: '表格', title: '动态数据表格展示与编辑，可直接影响后端', component: null },
        { id: 'rag', label: 'RAG', title: '查看具体召回了哪些条目', component: null }
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
    }),
    {
      name: 'sidebar-right-storage', // localStorage key
      partialize: (state) => ({ selectedTabs: state.selectedTabs }) // 只保存 selectedTabs
    }
  )
);

export default useSideBarRightStore;
