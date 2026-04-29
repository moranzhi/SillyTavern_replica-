"""
ComfyUI Workflow Manager
管理工作流 JSON 文件的上传、删除和加载
"""
import json
import os
from pathlib import Path
from typing import List, Dict, Optional
from fastapi import UploadFile, HTTPException
import shutil
from core.config import settings

# 工作流目录 - 使用统一的数据目录
WORKFLOW_DIR = settings.COMFYUI_WORKFLOWS_PATH
WORKFLOW_DIR.mkdir(parents=True, exist_ok=True)


class WorkflowManager:
    """ComfyUI 工作流管理器"""
    
    @staticmethod
    def list_workflows() -> List[Dict[str, str]]:
        """列出所有可用的工作流"""
        workflows = []
        
        for json_file in WORKFLOW_DIR.glob("*.json"):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    workflow_data = json.load(f)
                
                workflows.append({
                    "filename": json_file.name,
                    "name": json_file.stem,
                    "nodes_count": len(workflow_data),
                    "size": json_file.stat().st_size
                })
            except Exception as e:
                print(f"Error loading workflow {json_file.name}: {e}")
                continue
        
        return workflows
    
    @staticmethod
    def load_workflow(filename: str) -> Dict:
        """加载指定工作流"""
        filepath = WORKFLOW_DIR / filename
        
        if not filepath.exists():
            raise HTTPException(status_code=404, detail=f"Workflow '{filename}' not found")
        
        if not filepath.suffix == '.json':
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=500, detail=f"Invalid JSON: {str(e)}")
    
    @staticmethod
    async def upload_workflow(file: UploadFile) -> Dict[str, str]:
        """上传工作流文件"""
        # 验证文件名
        if not file.filename or not file.filename.endswith('.json'):
            raise HTTPException(status_code=400, detail="File must be a JSON file")
        
        # 安全检查：防止路径遍历攻击
        safe_filename = os.path.basename(file.filename)
        if not safe_filename:
            raise HTTPException(status_code=400, detail="Invalid filename")
        
        filepath = WORKFLOW_DIR / safe_filename
        
        # 如果文件已存在，先备份
        if filepath.exists():
            backup_path = WORKFLOW_DIR / f"{safe_filename}.bak"
            shutil.copy2(filepath, backup_path)
        
        # 保存文件
        try:
            content = await file.read()
            
            # 验证 JSON 格式
            try:
                workflow_data = json.loads(content)
                
                # 基本验证：检查是否是 ComfyUI 工作流
                if not isinstance(workflow_data, dict):
                    raise ValueError("Workflow must be a JSON object")
                
                # 检查是否包含必要的节点类型
                has_sampler = any(
                    node.get("class_type") == "KSampler" 
                    for node in workflow_data.values()
                    if isinstance(node, dict)
                )
                
                if not has_sampler:
                    raise ValueError("Invalid ComfyUI workflow: missing KSampler node")
                
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid JSON format")
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            
            # 写入文件
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content.decode('utf-8'))
            
            return {
                "message": "Workflow uploaded successfully",
                "filename": safe_filename,
                "size": len(content)
            }
        
        except HTTPException:
            raise
        except Exception as e:
            # 如果出错，恢复备份
            backup_path = WORKFLOW_DIR / f"{safe_filename}.bak"
            if backup_path.exists():
                shutil.move(backup_path, filepath)
            raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    
    @staticmethod
    def delete_workflow(filename: str) -> Dict[str, str]:
        """删除工作流文件"""
        # 安全检查
        safe_filename = os.path.basename(filename)
        if not safe_filename or not safe_filename.endswith('.json'):
            raise HTTPException(status_code=400, detail="Invalid filename")
        
        filepath = WORKFLOW_DIR / safe_filename
        
        if not filepath.exists():
            raise HTTPException(status_code=404, detail=f"Workflow '{filename}' not found")
        
        # 不允许删除默认工作流
        if safe_filename == "default_txt2img.json":
            raise HTTPException(
                status_code=403, 
                detail="Cannot delete default workflow"
            )
        
        try:
            filepath.unlink()
            return {"message": f"Workflow '{safe_filename}' deleted successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")
    
    @staticmethod
    def replace_prompt_in_workflow(workflow: Dict, prompt: str) -> Dict:
        """
        在工作流中替换提示词
        找到第一个 CLIPTextEncode 节点，替换其 text 字段
        """
        import copy
        workflow_copy = copy.deepcopy(workflow)
        
        # 查找 CLIPTextEncode 节点（通常是正向提示词）
        for node_id, node in workflow_copy.items():
            if isinstance(node, dict) and node.get("class_type") == "CLIPTextEncode":
                if "text" in node.get("inputs", {}):
                    # 替换提示词
                    node["inputs"]["text"] = prompt
                    return workflow_copy
        
        # 如果没有找到 CLIPTextEncode 节点，抛出错误
        raise ValueError("No CLIPTextEncode node found in workflow")


# 全局实例
workflow_manager = WorkflowManager()
