// frontend-react/src/components/SideBarLeft/tabs/ApiConfig/ComfyUIWorkflowManager.jsx
import React, { useState, useEffect } from 'react';
import './ApiConfig.css';

const ComfyUIWorkflowManager = ({ apiUrl }) => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 加载工作流列表
  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/api-config/comfyui/workflows');
      if (!response.ok) throw new Error('Failed to load workflows');
      const data = await response.json();
      setWorkflows(data);
    } catch (err) {
      console.error('加载工作流失败:', err);
      alert('加载工作流失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  // 上传工作流文件
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      alert('请上传 JSON 文件');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await fetch('/api/api-config/comfyui/workflows/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }

      const result = await response.json();
      alert(`上传成功: ${result.filename}`);
      
      // 重新加载列表
      await loadWorkflows();
    } catch (err) {
      console.error('上传失败:', err);
      alert('上传失败: ' + err.message);
    } finally {
      setUploading(false);
      // 清空文件输入
      e.target.value = '';
    }
  };

  // 删除工作流
  const handleDelete = async (filename) => {
    if (!confirm(`确定要删除工作流 "${filename}" 吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/api-config/comfyui/workflows/${filename}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Delete failed');
      }

      const result = await response.json();
      alert(result.message);
      
      // 重新加载列表
      await loadWorkflows();
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败: ' + err.message);
    }
  };

  // 格式化文件大小
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="workflow-manager-compact">
      <div className="workflow-header-compact">
        <span className="workflow-label">工作流</span>
        <div className="workflow-actions-compact">
          <label className="btn-icon" title="导入工作流">
            <input
              type="file"
              accept=".json"
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
            {uploading ? '⏳' : '📤'}
          </label>
          <button
            className="btn-icon"
            onClick={loadWorkflows}
            disabled={loading}
            title="刷新"
          >
            {loading ? '⏳' : '🔄'}
          </button>
        </div>
      </div>
  
      <div className="workflow-list-compact">
        {workflows.length === 0 ? (
          <div className="empty-hint">无工作流</div>
        ) : (
          workflows.map((workflow) => (
            <div key={workflow.filename} className="workflow-item-compact">
              <span className="workflow-name-compact">
                {workflow.filename === 'default_txt2img.json' && (
                  <span className="badge-default">默认</span>
                )}
                {workflow.name}
              </span>
                
              {workflow.filename !== 'default_txt2img.json' && (
                <button
                  className="btn-icon-danger"
                  onClick={() => handleDelete(workflow.filename)}
                  title="删除"
                >
                  🗑️
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ComfyUIWorkflowManager;
