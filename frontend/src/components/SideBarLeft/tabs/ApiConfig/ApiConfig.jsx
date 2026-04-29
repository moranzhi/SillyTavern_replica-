// frontend-react/src/components/SideBarLeft/tabs/ApiConfig/ApiConfig.jsx
import React, { useEffect, useState } from 'react';
import useApiConfigStore from '../../../../Store/SideBarLeft/ApiConfigSlice';
import useSideBarLeftStore from '../../../../Store/SideBarLeft/SideBarLeftSlice';
import ComfyUIWorkflowManager from './ComfyUIWorkflowManager';
import './ApiConfig.css';

const ApiConfig = () => {
  // 从store中获取状态和方法
  const {
    profiles,
    currentProfile,
    activeMap,
    loading,
    error,
    fetchProfiles,
    fetchProfile,
    saveProfile,
    deleteProfile,
    setActiveConfig,
    testConnection,
    notification
  } = useApiConfigStore();

  // 本地表单状态 - 包含 4 个 API 配置
  const [formData, setFormData] = useState({
    mainLLM: { id: '', name: '', apiUrl: '', apiKey: '', model: '' },
    
    // 生图配置 - 支持本地和云端两种模式
    imageModel: {
      mode: 'local',  // 'local' | 'cloud'
      
      // 本地 ComfyUI 配置
      local: {
        apiUrl: 'http://comfyui:8188',
        websocketEnabled: true,
        queueTimeout: 300,
        defaultWorkflow: 'default_txt2img.json'
      },
      
      // 云端 API 配置
      cloud: {
        provider: 'dall-e',
        apiUrl: 'https://api.openai.com/v1/images/generations',
        apiKey: '',
        model: 'dall-e-3'
      }
    },
    
    secondaryLLM: { id: '', name: '', apiUrl: '', apiKey: '', model: '' },
    ragEmbedding: { id: '', name: '', apiUrl: '', apiKey: '', model: '' }
  });

  // 当前选中的配置文件 ID
  const [selectedProfileId, setSelectedProfileId] = useState('');
  
  // 当前编辑的类别
  const [currentCategory, setCurrentCategory] = useState('mainLLM');
  
  // 可用模型列表
  const [availableModels, setAvailableModels] = useState([]);
  
  // 显示保存对话框
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  // 新配置文件名称
  const [newProfileName, setNewProfileName] = useState('');
  
  // 要保存的 API 类别（勾选状态）
  const [apisToSave, setApisToSave] = useState({
    mainLLM: false,
    imageModel: false,
    secondaryLLM: false,
    ragEmbedding: false
  });
  
  // 跟踪哪些 API 有修改
  const [modifiedApis, setModifiedApis] = useState({});
  
  // 获取当前激活的分页
  const { activeTab } = useSideBarLeftStore();
  
  // 记录上一次的分页状态
  const prevActiveTabRef = React.useRef(activeTab);

  // 组件加载时获取配置文件列表 - 只在切换到API分页时刷新
  useEffect(() => {
    // 检测是否从其他分页切换到API分页
    if (activeTab === 'api' && prevActiveTabRef.current !== 'api') {
      fetchProfiles();
    }
    // 更新上一次的分页状态
    prevActiveTabRef.current = activeTab;
  }, [activeTab, fetchProfiles]);

  // 当选中配置文件时，加载该配置
  useEffect(() => {
    if (selectedProfileId) {
      loadProfile(selectedProfileId);
    }
  }, [selectedProfileId]);

  // 加载配置文件
  const loadProfile = async (profileId) => {
    try {
      const profile = await fetchProfile(profileId);
      
      // 合并到本地状态（服务器提供的覆盖，未提供的保留本地）
      setFormData(prev => ({
        ...prev,
        ...profile.apis
      }));
      
      // 清除修改标记
      setModifiedApis({});
    } catch (err) {
      console.error('加载配置文件失败:', err);
    }
  };

  // 处理输入变化 - 支持嵌套路径
  const handleChange = (e, path = null) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    if (path) {
      // 嵌套路径更新，例如: ['imageModel', 'local', 'apiUrl']
      setFormData(prev => {
        const updated = { ...prev };
        let current = updated;
        
        // 导航到倒数第二层
        for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]];
        }
        
        // 更新最后一层
        current[path[path.length - 1]] = newValue;
        
        return updated;
      });
      
      // 标记 imageModel 为已修改
      setModifiedApis(prev => ({
        ...prev,
        imageModel: true
      }));
    } else {
      // 扁平结构更新（用于其他 API）
      setFormData(prev => ({
        ...prev,
        [currentCategory]: {
          ...prev[currentCategory],
          [name]: newValue
        }
      }));
      
      // 标记当前类别的 API 已被修改
      setModifiedApis(prev => ({
        ...prev,
        [currentCategory]: true
      }));
    }
  };

  // 切换生图模式
  const handleImageModeChange = (mode) => {
    setFormData(prev => ({
      ...prev,
      imageModel: {
        ...prev.imageModel,
        mode
      }
    }));
    
    setModifiedApis(prev => ({
      ...prev,
      imageModel: true
    }));
  };

  // 处理类别切换
  const handleTabChange = (categoryId) => {
    setCurrentCategory(categoryId);
    setAvailableModels([]);
  };

  // 打开保存/新建配置文件对话框
  const handleOpenSaveModal = () => {
    // 默认选中所有有修改的 API
    setApisToSave(modifiedApis);
    
    // 如果是新建，清空名称；如果是更新，加载现有名称
    if (!selectedProfileId) {
      setNewProfileName('');
    } else {
      const currentProfile = profiles.find(p => p.id === selectedProfileId);
      setNewProfileName(currentProfile?.name || '');
    }
    
    setShowSaveModal(true);
  };

  // 处理保存配置文件
  const handleSave = async () => {
    // 收集要保存的 API 配置
    const apisToSaveData = {};
    Object.keys(apisToSave).forEach(category => {
      if (apisToSave[category]) {
        apisToSaveData[category] = formData[category];
      }
    });

    if (Object.keys(apisToSaveData).length === 0) {
      alert('请至少选择一个 API 配置进行保存');
      return;
    }

    // 判断是新建还是更新
    const isNewProfile = !selectedProfileId;
    const profileId = selectedProfileId || `profile-${Date.now()}`;
    const profileName = isNewProfile ? newProfileName : (profiles.find(p => p.id === selectedProfileId)?.name || profileId);

    try {
      await saveProfile(profileId, profileName, apisToSaveData);
      setSelectedProfileId(profileId);
      setShowSaveModal(false);
      
      // 清除修改标记
      setModifiedApis(prev => {
        const newModified = { ...prev };
        Object.keys(apisToSave).forEach(category => {
          if (apisToSave[category]) {
            delete newModified[category];
          }
        });
        return newModified;
      });
    } catch (err) {
      console.error('保存失败:', err);
    }
  };

  // 处理重置
  const handleReset = () => {
    if (selectedProfileId) {
      loadProfile(selectedProfileId);
    } else {
      // 清空当前类别的配置
      setFormData(prev => ({
        ...prev,
        [currentCategory]: { id: '', name: '', apiUrl: '', apiKey: '', model: '' }
      }));
      setModifiedApis(prev => {
        const newModified = { ...prev };
        delete newModified[currentCategory];
        return newModified;
      });
    }
  };

  // 处理连接测试并获取模型列表
  const handleConnect = async () => {
    const currentApi = formData[currentCategory];
    if (!currentApi.apiUrl) {
      alert('请先填写 API 地址');
      return;
    }
    
    if (!currentApi.apiKey) {
      alert('请先填写 API 密钥');
      return;
    }
    
    try {
      const response = await fetch('/api/api-config/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: currentApi.apiUrl,
          apiKey: currentApi.apiKey,
          category: currentCategory,
          model: currentApi.model || ''
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '获取模型列表失败');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setAvailableModels(result.models);
        if (result.models.length === 0) {
          alert('未找到可用模型');
        } else {
          // 显示成功消息
          console.log(`成功获取 ${result.models.length} 个模型`);
        }
      } else {
        alert(`获取失败: ${result.message}`);
      }
    } catch (err) {
      console.error('获取模型列表失败:', err);
      alert('获取模型列表失败: ' + err.message);
    }
  };

  // 处理模型选择
  const handleModelSelect = (selectedModel) => {
    setFormData(prev => ({
      ...prev,
      [currentCategory]: {
        ...prev[currentCategory],
        model: selectedModel
      }
    }));
  };

  // 测试 ComfyUI 连接
  const testComfyUIConnection = async (apiUrl) => {
    if (!apiUrl) {
      alert('请先填写 API 地址');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/api-config/test-comfyui-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiUrl })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`连接成功！\n\nVRAM: ${(result.stats.vram_free / 1024 / 1024 / 1024).toFixed(2)} GB 可用\n设备: ${result.stats.device}`);
      } else {
        alert(`连接失败: ${result.message}`);
      }
    } catch (err) {
      alert('测试失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 测试云端 API 连接
  const testCloudConnection = async (cloudConfig) => {
    if (!cloudConfig.apiKey) {
      alert('请先填写 API Key');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/api-config/test-cloud-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloudConfig)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('连接成功！');
      } else {
        alert(`连接失败: ${result.message}`);
      }
    } catch (err) {
      alert('测试失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理从列表中选择配置文件
  const handleSelectProfile = (e) => {
    const profileId = e.target.value;
    setSelectedProfileId(profileId);
  };

  // 处理删除配置文件
  const handleDelete = async () => {
    if (selectedProfileId && confirm('确定要删除此配置文件吗？')) {
      await deleteProfile(selectedProfileId);
      setSelectedProfileId('');
      handleCreateNew();
    }
  };

  // 处理设为默认配置
  const handleSetActive = async () => {
    if (!selectedProfileId) {
      alert('请先保存配置文件');
      return;
    }
    await setActiveConfig(currentCategory, selectedProfileId);
  };

  // 配置区域标签（简短名称 + Tooltip）
  const configTabs = [
    { id: 'mainLLM', label: '核心', tooltip: '主 LLM 模型 - 用于主要对话和推理' },
    { id: 'imageModel', label: '生图', tooltip: '图像生成模型 - 本地 ComfyUI 或云端 API' },
    { id: 'secondaryLLM', label: '辅助', tooltip: '副 LLM 模型 - 用于二次校验或特殊任务' },
    { id: 'ragEmbedding', label: '向量', tooltip: 'RAG 嵌入模型 - 用于文本向量化和检索' }
  ];

  // 判断当前 API 密钥是否是脱敏的
  const isApiKeyMasked = formData[currentCategory].apiKey && formData[currentCategory].apiKey.endsWith('****');

  // 计算有修改的 API 数量
  const modifiedCount = Object.keys(modifiedApis).filter(k => modifiedApis[k]).length;

  return (
    <div className="api-config-container">
      {/* 移除标题，节省空间 */}

      {error && <div className="notification notification-error">{error}</div>}
      {notification.show && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="api-config-form">
        {/* 配置管理区域 - 移到顶部 */}
        <div className="profile-manager">
          <div className="profile-header">
            <label htmlFor="profileSelect">配置文件</label>
            <div className="profile-controls">
              <select
                id="profileSelect"
                value={selectedProfileId}
                onChange={handleSelectProfile}
                className="form-control profile-select-input"
              >
                <option value="">新建配置文件...</option>
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
              <div className="profile-buttons">
                {!selectedProfileId ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleOpenSaveModal}
                  >
                    + 新建
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleSetActive}
                      disabled={activeMap[currentCategory] === selectedProfileId}
                    >
                      设为默认
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={handleDelete}
                    >
                      删除
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 配置区域标签 */}
        <div className="config-tabs">
          {configTabs.map(tab => (
            <button
              key={tab.id}
              className={`config-tab ${currentCategory === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
              title={tab.tooltip}
            >
              {tab.label}
              {modifiedApis[tab.id] && <span className="modified-indicator">●</span>}
            </button>
          ))}
        </div>

        {/* 生图模式选择 - 紧凑版 */}
        {currentCategory === 'imageModel' && (
          <div className="mode-toggle">
            <button
              type="button"
              className={`mode-btn ${formData.imageModel.mode === 'local' ? 'active' : ''}`}
              onClick={() => handleImageModeChange('local')}
            >
              🖥️ 本地
            </button>
            <button
              type="button"
              className={`mode-btn ${formData.imageModel.mode === 'cloud' ? 'active' : ''}`}
              onClick={() => handleImageModeChange('cloud')}
            >
              ☁️ 云端
            </button>
          </div>
        )}

        {/* API配置表单 */}
        <div className="form-section">
          {/* 生图模型 - 本地 ComfyUI 模式 */}
          {currentCategory === 'imageModel' && formData.imageModel.mode === 'local' ? (
            <>
              <div className="form-group">
                <label htmlFor="local-apiUrl">API 地址</label>
                <input
                  type="text"
                  id="local-apiUrl"
                  value={formData.imageModel.local.apiUrl}
                  onChange={(e) => handleChange(e, ['imageModel', 'local', 'apiUrl'])}
                  placeholder="http://comfyui:8188"
                  className="form-control"
                />
                <span className="form-hint">
                  Docker 环境使用 http://comfyui:8188，本地运行使用 http://localhost:8188
                </span>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="local-websocket">启用 WebSocket</label>
                  <label className="switch-label">
                    <input
                      type="checkbox"
                      id="local-websocket"
                      checked={formData.imageModel.local.websocketEnabled}
                      onChange={(e) => handleChange(e, ['imageModel', 'local', 'websocketEnabled'])}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>

                <div className="form-group half">
                  <label htmlFor="local-timeout">队列超时（秒）</label>
                  <input
                    type="number"
                    id="local-timeout"
                    value={formData.imageModel.local.queueTimeout}
                    onChange={(e) => handleChange(e, ['imageModel', 'local', 'queueTimeout'])}
                    min="30"
                    max="600"
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="local-workflow">默认工作流</label>
                <select
                  id="local-workflow"
                  value={formData.imageModel.local.defaultWorkflow}
                  onChange={(e) => handleChange(e, ['imageModel', 'local', 'defaultWorkflow'])}
                  className="form-control"
                >
                  <option value="default_txt2img.json">文生图（默认）</option>
                </select>
                <span className="form-hint">
                  可上传自定义工作流文件
                </span>
              </div>

              <div className="form-group">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => testComfyUIConnection(formData.imageModel.local.apiUrl)}
                  disabled={loading}
                >
                  {loading ? '测试中...' : '测试连接'}
                </button>
              </div>
            </>
          ) : currentCategory === 'imageModel' && formData.imageModel.mode === 'cloud' ? (
            /* 生图模型 - 云端 API 模式 */
            <>
              <div className="form-group">
                <label htmlFor="cloud-provider">服务提供商</label>
                <select
                  id="cloud-provider"
                  value={formData.imageModel.cloud.provider}
                  onChange={(e) => handleChange(e, ['imageModel', 'cloud', 'provider'])}
                  className="form-control"
                >
                  <option value="dall-e">DALL-E 3 (OpenAI)</option>
                  <option value="stability">Stable Diffusion (Stability AI)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="cloud-apiKey">API Key</label>
                <input
                  type="password"
                  id="cloud-apiKey"
                  value={formData.imageModel.cloud.apiKey}
                  onChange={(e) => handleChange(e, ['imageModel', 'cloud', 'apiKey'])}
                  placeholder="sk-..."
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="cloud-model">模型</label>
                <select
                  id="cloud-model"
                  value={formData.imageModel.cloud.model}
                  onChange={(e) => handleChange(e, ['imageModel', 'cloud', 'model'])}
                  className="form-control"
                >
                  {formData.imageModel.cloud.provider === 'dall-e' && (
                    <>
                      <option value="dall-e-3">DALL-E 3</option>
                      <option value="dall-e-2">DALL-E 2</option>
                    </>
                  )}
                  {formData.imageModel.cloud.provider === 'stability' && (
                    <>
                      <option value="sd-xl-1024">SD-XL 1024</option>
                      <option value="sd-2-1">SD 2.1</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-group">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => testCloudConnection(formData.imageModel.cloud)}
                  disabled={loading}
                >
                  {loading ? '测试中...' : '测试连接'}
                </button>
              </div>
            </>
          ) : (
            /* 其他 API 类型（主LLM、副LLM、嵌入模型）*/
            <>
              <div className="form-group">
                <label htmlFor="apiUrl">API 地址</label>
                <input
                  type="text"
                  id="apiUrl"
                  name="apiUrl"
                  value={formData[currentCategory].apiUrl}
                  onChange={handleChange}
                  placeholder="https://api.openai.com/v1"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="apiKey">密钥</label>
                <input
                  type="password"
                  id="apiKey"
                  name="apiKey"
                  value={isApiKeyMasked ? '' : formData[currentCategory].apiKey}
                  onChange={handleChange}
                  placeholder={isApiKeyMasked ? '已保存（留空保持不变）' : 'sk-...'}
                  className="form-control"
                />
                {isApiKeyMasked && (
                  <span className="form-hint">当前密钥已加密存储</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label htmlFor="model">模型</label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    value={formData[currentCategory].model}
                    onChange={handleChange}
                    placeholder="gpt-3.5-turbo"
                    className="form-control"
                  />
                </div>
                <div className="form-group flex-auto">
                  <label>&nbsp;</label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-full"
                    onClick={handleConnect}
                    disabled={loading}
                  >
                    {loading ? '连接中...' : '获取模型列表'}
                  </button>
                </div>
              </div>

              {availableModels.length > 0 && (
                <div className="form-group">
                  <label htmlFor="modelSelect">选择模型</label>
                  <select
                    id="modelSelect"
                    value={formData[currentCategory].model}
                    onChange={(e) => handleModelSelect(e.target.value)}
                    className="form-control"
                  >
                    <option value="">从列表中选择...</option>
                    {availableModels.map((model, index) => (
                      <option key={index} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        {/* ComfyUI 工作流管理器 - 仅在选择生图模型时显示 */}
        {currentCategory === 'imageModel' && formData.imageModel.mode === 'local' && (
          <ComfyUIWorkflowManager apiUrl={formData.imageModel.local?.apiUrl} />
        )}

        {/* 底部操作栏 */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-text"
            onClick={handleReset}
            disabled={loading}
          >
            重置
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenSaveModal}
            disabled={loading || modifiedCount === 0}
          >
            {loading ? '保存中...' : modifiedCount > 0 ? `保存配置 (${modifiedCount})` : '保存配置'}
          </button>
        </div>
      </div>

      {/* 保存/更新配置文件对话框 */}
      {showSaveModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              {selectedProfileId ? '更新配置文件' : '新建配置文件'}
            </h3>
            
            {/* 如果是新建，显示名称输入框 */}
            {!selectedProfileId && (
              <div className="form-group" style={{ padding: 'var(--spacing-lg) var(--spacing-lg) 0' }}>
                <label htmlFor="newProfileName">配置文件名称</label>
                <input
                  type="text"
                  id="newProfileName"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="例如：我的默认配置"
                  className="form-control"
                  autoFocus
                />
              </div>
            )}
            
            <p className="modal-hint">
              {selectedProfileId 
                ? '选择要更新的 API 配置（未选中的将保持不变）：'
                : '选择要包含在此配置文件中的 API 配置：'}
            </p>
            <div className="modal-body">
              {configTabs.map(tab => (
                <label key={tab.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={apisToSave[tab.id] || false}
                    onChange={(e) => setApisToSave(prev => ({
                      ...prev,
                      [tab.id]: e.target.checked
                    }))}
                  />
                  <span className="checkbox-text">
                    {tab.label}
                    {modifiedApis[tab.id] && <span className="modified-badge">已修改</span>}
                  </span>
                </label>
              ))}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-text"
                onClick={() => setShowSaveModal(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
              >
                {selectedProfileId ? '保存更新' : '创建配置文件'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiConfig;
