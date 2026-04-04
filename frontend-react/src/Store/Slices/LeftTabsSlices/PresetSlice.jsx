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
  setSelectedPreset: async (presetId) => {
    try {
      // 从后端获取预设的完整内容
      const response = await fetch(`/api/presets/${presetId}`);
      const presetData = await response.json();

      // 提取参数并更新状态
      const parameters = {
        temperature: presetData.temperature || 1.0,
        frequency_penalty: presetData.frequency_penalty || 0.0,
        presence_penalty: presetData.presence_penalty || 0.0,
        top_p: presetData.top_p || 1.0,
        top_k: presetData.top_k || 0,
        max_context: presetData.openai_max_context || 1000000,
        max_tokens: presetData.openai_max_tokens || 30000,
        max_context_unlocked: presetData.max_context_unlocked || false,
        stream_openai: presetData.stream_openai || true,
        seed: presetData.seed || -1,
        n: presetData.n || 1
      };

      set({
        selectedPreset: presetId,
        parameters
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
      parameters: { ...state.parameters }
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
  }))
}));

export default usePresetStore;
