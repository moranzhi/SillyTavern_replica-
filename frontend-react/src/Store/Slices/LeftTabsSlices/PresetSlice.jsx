import { create } from 'zustand';

const usePresetStore = create((set, get) => ({
  // 预设选择
  selectedPreset: '',

  // 核心参数
  parameters: {
    temperature: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    top_p: 1.0,
    top_k: 0,
    max_context: 1000000,
    max_tokens: 30000,
    max_context_unlocked: false,
    stream_openai: true,
    seed: -1,
    n: 1
  },

  // 可用的预设列表 - 初始为空，将从后端加载
  presets: [],

  // 是否正在加载预设列表
  isLoadingPresets: false,

  // 参数设置折叠状态
  isParametersExpanded: true,

  // 预设组件列表
  promptComponents: [],

  // 从后端加载预设列表
  fetchPresets: async () => {
    set({ isLoadingPresets: true });
    try {
      const response = await fetch('/api/presets/list');
      const data = await response.json();

      // 转换为预设对象数组
      const presetList = data.presets.map(name => ({
        id: name,
        name,
        parameters: {} // 参数将在选择预设时加载
      }));

      set({ presets: presetList, isLoadingPresets: false });
    } catch (error) {
      console.error('Failed to fetch presets:', error);
      set({ isLoadingPresets: false });
    }
  },

  // 设置选中的预设
  // 设置选中的预设
  // 设置选中的预设
  setSelectedPreset: async (presetId) => {
    try {
      // 从后端获取预设的完整内容
      const response = await fetch(`/api/presets/${presetId}`);
      const presetData = await response.json();

      // 记录原始数据用于调试
      console.log('从后端获取的预设数据:', presetData);

      // 提取参数并更新状态，确保所有参数都有默认值
      const parameters = {
        temperature: presetData.temperature !== undefined ? presetData.temperature : 1.0,
        frequency_penalty: presetData.frequency_penalty !== undefined ? presetData.frequency_penalty : 0.0,
        presence_penalty: presetData.presence_penalty !== undefined ? presetData.presence_penalty : 0.0,
        top_p: presetData.top_p !== undefined ? presetData.top_p : 1.0,
        top_k: presetData.top_k !== undefined ? presetData.top_k : 0,
        max_context: presetData.openai_max_context !== undefined ? presetData.openai_max_context :
                     (presetData.max_context !== undefined ? presetData.max_context : 1000000),
        max_tokens: presetData.openai_max_tokens !== undefined ? presetData.openai_max_tokens :
                    (presetData.max_tokens !== undefined ? presetData.max_tokens : 30000),
        max_context_unlocked: presetData.max_context_unlocked !== undefined ? presetData.max_context_unlocked : false,
        stream_openai: presetData.stream_openai !== undefined ? presetData.stream_openai : true,
        seed: presetData.seed !== undefined ? presetData.seed : -1,
        n: presetData.n !== undefined ? presetData.n : 1
      };

      // 记录映射后的参数用于调试
      console.log('映射后的参数:', parameters);

      // 处理预设组件
      let components = [];
      if (presetData.prompts && Array.isArray(presetData.prompts)) {
        // 获取当前角色的prompt_order
        const currentOrder = presetData.prompt_order && presetData.prompt_order.length > 0
          ? presetData.prompt_order[0].order
          : [];

        // 根据prompt_order排序组件
        components = presetData.prompts.map(prompt => {
          const orderItem = currentOrder.find(item => item.identifier === prompt.identifier);
          return {
            ...prompt,
            enabled: orderItem ? orderItem.enabled : true,
            role: prompt.role !== undefined ? prompt.role : (prompt.system_prompt ? 0 : 1)
          };
        });

        // 如果有prompt_order，按照它排序
        if (currentOrder.length > 0) {
          components.sort((a, b) => {
            const indexA = currentOrder.findIndex(item => item.identifier === a.identifier);
            const indexB = currentOrder.findIndex(item => item.identifier === b.identifier);
            return indexA - indexB;
          });
        }
      }

      // 更新状态，确保参数容器展开
      set({
        selectedPreset: presetId,
        parameters,
        promptComponents: components,
        isParametersExpanded: true  // 确保参数容器展开
      });
    } catch (error) {
      console.error('Failed to load preset:', error);
    }
  },



  // 更新参数
  updateParameter: ({ name, value }) => set((state) => ({
    parameters: { ...state.parameters, [name]: value }
  })),

  // 添加预设
  addPreset: (preset) => set((state) => ({
    presets: [...state.presets, preset]
  })),

  // 保存当前设置为预设
  saveCurrentAsPreset: ({ name }) => set((state) => {
    const newPreset = {
      id: `preset_${Date.now()}`,
      name,
      parameters: { ...state.parameters },
      promptComponents: [...state.promptComponents]
    };
    return {
      presets: [...state.presets, newPreset],
      selectedPreset: newPreset.id
    };
  }),

  // 编辑预设名称
  editPresetName: (presetId, newName) => set((state) => ({
    presets: state.presets.map(preset =>
      preset.id === presetId ? { ...preset, name: newName } : preset
    )
  })),

  // 切换参数设置折叠状态
  toggleParametersExpanded: () => set((state) => ({
    isParametersExpanded: !state.isParametersExpanded
  })),

  // 设置预设组件列表
  setPromptComponents: (components) => set({ promptComponents: components }),

  // 更新组件
  updateComponent: (index, updatedComponent) => set((state) => {
    const newComponents = [...state.promptComponents];
    newComponents[index] = { ...newComponents[index], ...updatedComponent };
    return { promptComponents: newComponents };
  }),

  // 切换组件启用状态
  toggleComponentEnabled: (index) => set((state) => {
    const newComponents = [...state.promptComponents];
    newComponents[index] = {
      ...newComponents[index],
      enabled: !newComponents[index].enabled
    };
    return { promptComponents: newComponents };
  }),

  // 添加新组件
  addComponent: (component) => set((state) => ({
    promptComponents: [...state.promptComponents, component]
  })),

  // 删除组件
  removeComponent: (index) => set((state) => {
    const newComponents = [...state.promptComponents];
    newComponents.splice(index, 1);
    return { promptComponents: newComponents };
  }),

  // 移动组件位置
  moveComponent: (fromIndex, toIndex) => set((state) => {
    const newComponents = [...state.promptComponents];
    const [movedComponent] = newComponents.splice(fromIndex, 1);
    newComponents.splice(toIndex, 0, movedComponent);
    return { promptComponents: newComponents };
  }),

  // 获取当前预设的prompt_order
  getPromptOrder: () => {
    const { promptComponents } = get();
    return promptComponents.map(component => ({
      identifier: component.identifier,
      enabled: component.enabled !== false
    }));
  }
}));

export default usePresetStore;
