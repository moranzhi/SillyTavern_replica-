// frontend-react/src/components/TopBar/TopBar.jsx
import React, {useState, useRef, useEffect} from 'react';
import './TopBar.css';
import ThemeToggle from './items/ThemeToggle';
import useWorldBookStore from '../../Store/SideBarLeft/WorldBookSlice';
import useApiConfigStore from '../../Store/SideBarLeft/ApiConfigSlice';

const Toolbar = () => {
  const [activePanel, setActivePanel] = useState(null);
  const panelRef = useRef(null);
  const [currentUserRole, setCurrentUserRole] = useState({ name: '', description: '' });
  
  // 从 Store 获取全局世界书
  const { globalWorldBooks } = useWorldBookStore();
  
  // 从 ApiConfigStore 获取核心和辅助 API 配置
  const { activeMap, fetchProfile } = useApiConfigStore();
  const [coreModel, setCoreModel] = useState('未设置');
  const [assistModel, setAssistModel] = useState('未设置');
  
  // 加载核心和辅助 API 配置的模型名
  useEffect(() => {
    const loadApiModels = async () => {
      // 加载核心配置
      if (activeMap['core']) {
        try {
          const profile = await fetchProfile(activeMap['core']);
          const coreApi = profile?.apis?.find(api => api.category === 'core');
          setCoreModel(coreApi?.model || '未设置');
        } catch (e) {
          console.error('加载核心配置失败:', e);
          setCoreModel('未设置');
        }
      } else {
        setCoreModel('未设置');
      }
      
      // 加载辅助配置
      if (activeMap['assist']) {
        try {
          const profile = await fetchProfile(activeMap['assist']);
          const assistApi = profile?.apis?.find(api => api.category === 'assist');
          setAssistModel(assistApi?.model || '未设置');
        } catch (e) {
          console.error('加载辅助配置失败:', e);
          setAssistModel('未设置');
        }
      } else {
        setAssistModel('未设置');
      }
    };
    
    loadApiModels();
  }, [activeMap, fetchProfile]);

  // 点击外部关闭面板
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setActivePanel(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 加载当前用户角色
  useEffect(() => {
    const savedRole = localStorage.getItem('currentUserRole');
    if (savedRole) {
      try {
        setCurrentUserRole(JSON.parse(savedRole));
      } catch (e) {
        console.error('解析用户角色失败:', e);
      }
    }
  }, []);

  // 处理面板切换
  const handlePanelToggle = (panelName) => {
    if (activePanel === panelName) {
      setActivePanel(null);
    } else {
      setActivePanel(panelName);
    }
  };

  // 关闭面板
  const handleClosePanel = () => {
    setActivePanel(null);
  };

  // 截断文本
  const truncateText = (text, maxLength = 20) => {
    if (!text) return '未选择';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-content">
          {/* 左侧：状态徽章区域 */}
          <div className="status-section">
            {/* 当前玩家角色 */}
            <div 
              className="status-badge" 
              title="当前玩家角色"
              onClick={() => handlePanelToggle('currentRole')}
            >
              <span className="status-icon">😊</span>
              <span className="status-label">{truncateText(currentUserRole.name || '未设置', 15)}</span>
            </div>
            
            {/* 核心配置 */}
            <div className="status-badge" title={`核心配置: ${coreModel}`}>
              <span className="status-icon">🔌</span>
              <span className="status-label">{truncateText(coreModel, 12)}</span>
            </div>
            
            {/* 辅助配置 */}
            <div className="status-badge" title={`辅助配置: ${assistModel}`}>
              <span className="status-icon">🔗</span>
              <span className="status-label">{truncateText(assistModel, 12)}</span>
            </div>
            
            {/* 当前预设 */}
            <div className="status-badge" title="当前预设名">
              <span className="status-icon">⚙️</span>
              <span className="status-label">默认预设</span>
            </div>
            
            {/* 激活的世界书 */}
            <div className="status-badge world-info-badge" title="已激活全局世界书" onClick={() => handlePanelToggle('worldBook')}>
              <span className="status-icon">📚</span>
              <span className="status-label">
                {globalWorldBooks.length > 0 
                  ? globalWorldBooks.map(wb => wb.name).join(', ')
                  : '无'}
              </span>
            </div>
          </div>
          
          {/* 右侧：操作按钮区域 */}
          <div className="actions-section">
            {/* 设置按钮 */}
            <button 
              className="action-btn" 
              title="设置"
              onClick={() => handlePanelToggle('settings')}
            >
              ⚙
            </button>
            
            {/* 扩展按钮 */}
            <button 
              className="action-btn" 
              title="扩展"
              onClick={() => handlePanelToggle('extensions')}
            >
              ⊞
            </button>
            
            {/* 主题切换 */}
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* 全局世界书面板 */}
      {activePanel === 'worldBook' && (
        <div className="panel-overlay" ref={panelRef}>
          <div className="panel-content">
            <div className="panel-header">
              <h3>全局世界书 ({globalWorldBooks.length})</h3>
              <button className="close-panel-button" onClick={handleClosePanel} title="关闭">
                ✕
              </button>
            </div>
            <div className="panel-body">
              {globalWorldBooks.length > 0 ? (
                <div className="global-books-list-topbar">
                  {globalWorldBooks.map(book => (
                    <div key={book.name} className="global-book-item-topbar">
                      <span className="global-book-name-topbar">{book.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-global-books-topbar">暂无全局世界书</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 设置面板 */}
      {activePanel === 'settings' && (
        <div className="panel-overlay" ref={panelRef}>
          <div className="panel-content">
            <div className="panel-header">
              <h3>系统设置</h3>
              <button className="close-panel-button" onClick={handleClosePanel} title="关闭">
                ✕
              </button>
            </div>
            <div className="panel-body">
              <p>系统设置内容...</p>
            </div>
          </div>
        </div>
      )}

      {/* 拓展面板 */}
      {activePanel === 'extensions' && (
        <div className="panel-overlay" ref={panelRef}>
          <div className="panel-content">
            <div className="panel-header">
              <h3>功能拓展</h3>
              <button className="close-panel-button" onClick={handleClosePanel} title="关闭">
                ✕
              </button>
            </div>
            <div className="panel-body">
              <p>功能拓展内容...</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Toolbar;
