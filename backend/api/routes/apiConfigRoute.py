from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import Dict, Optional, List, Any
import json
import os
from pathlib import Path
from core.config import settings
from cryptography.fernet import Fernet
import base64
from services.comfyui_workflow_manager import workflow_manager
from services.llm_model_service import LLMModelService

router = APIRouter(prefix="/api-config", tags=["API Configuration"])

# 加密密钥（实际项目中应该从环境变量读取）
ENCRYPTION_KEY = os.getenv('API_ENCRYPTION_KEY', Fernet.generate_key().decode())
fernet = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)

# 配置文件路径
CONFIG_DIR = Path(settings.DATA_PATH) / "apiconfig"
CONFIG_DIR.mkdir(parents=True, exist_ok=True)


class ApiConfigItem(BaseModel):
    """单个 API 配置项"""
    id: Optional[str] = None
    name: Optional[str] = ""
    category: Optional[str] = None  # mainLLM, imageModel, secondaryLLM, ragEmbedding
    apiUrl: Optional[str] = ""
    apiKey: Optional[str] = None  # 前端传入的可能是明文或空
    model: Optional[str] = ""
    
    # 生图模型的特殊字段
    mode: Optional[str] = None  # 'local' | 'cloud'
    local: Optional[dict] = None
    cloud: Optional[dict] = None


class ProfileSaveRequest(BaseModel):
    """保存配置文件的请求"""
    profileId: str
    name: Optional[str] = None
    apis: Dict[str, ApiConfigItem]  # key 是 category，value 是配置


class ProfileResponse(BaseModel):
    """配置文件响应（不包含明文 API Key）"""
    id: str
    name: str
    apis: Dict[str, dict]  # apiKey 字段会被移除或脱敏


def encrypt_api_key(api_key: str) -> str:
    """加密 API Key"""
    if not api_key:
        return ""
    encrypted = fernet.encrypt(api_key.encode())
    return base64.urlsafe_b64encode(encrypted).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """解密 API Key（仅在后端内部使用）"""
    if not encrypted_key:
        return ""
    try:
        decoded = base64.urlsafe_b64decode(encrypted_key.encode())
        decrypted = fernet.decrypt(decoded)
        return decrypted.decode()
    except Exception:
        return ""


def mask_api_key(api_key: str) -> str:
    """脱敏 API Key（返回给前端）"""
    if not api_key or len(api_key) < 8:
        return "****"
    return api_key[:4] + "****" + api_key[-4:]


def load_profile(profile_id: str) -> Optional[dict]:
    """加载配置文件"""
    config_file = CONFIG_DIR / f"{profile_id}.json"
    if not config_file.exists():
        return None
    
    with open(config_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_profile(profile_id: str, profile_data: dict):
    """保存配置文件"""
    config_file = CONFIG_DIR / f"{profile_id}.json"
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(profile_data, f, ensure_ascii=False, indent=2)


def list_profiles() -> List[dict]:
    """列出所有配置文件"""
    profiles = []
    for config_file in CONFIG_DIR.glob("*.json"):
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                profile = json.load(f)
                profiles.append({
                    "id": profile.get("id", config_file.stem),
                    "name": profile.get("name", config_file.stem),
                    "createdAt": profile.get("createdAt", "")
                })
        except Exception:
            continue
    return profiles


@router.get("/profiles", response_model=List[dict])
def get_all_profiles():
    """获取所有配置文件列表"""
    return list_profiles()


@router.get("/profiles/{profile_id}", response_model=ProfileResponse)
def get_profile(profile_id: str):
    """获取单个配置文件（API Key 已脱敏）"""
    profile = load_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="配置文件不存在")
    
    # 脱敏所有 API Key
    masked_apis = {}
    for category, api_config in profile.get("apis", {}).items():
        masked_config = api_config.copy()
        if "apiKey" in masked_config and masked_config["apiKey"]:
            masked_config["apiKey"] = mask_api_key(masked_config["apiKey"])
        masked_apis[category] = masked_config
    
    return {
        "id": profile.get("id", profile_id),
        "name": profile.get("name", profile_id),
        "apis": masked_apis
    }


@router.post("/profiles", response_model=ProfileResponse)
def create_or_update_profile(request: ProfileSaveRequest):
    """创建或更新配置文件（增量更新）"""
    # 加载现有配置
    existing_profile = load_profile(request.profileId)
    
    if existing_profile:
        # 更新现有配置：只更新提供的 API 配置
        for category, api_config in request.apis.items():
            api_config_dict = api_config.dict(exclude_none=True)
            
            # 处理 API Key 加密
            if api_config.apiKey and api_config.apiKey != "****":
                # 如果是新的明文 key，加密它
                api_config_dict["apiKey"] = encrypt_api_key(api_config.apiKey)
            elif api_config.apiKey == "****":
                # 如果是脱敏的 key，保留原有的加密 key
                if category in existing_profile.get("apis", {}):
                    api_config_dict["apiKey"] = existing_profile["apis"][category].get("apiKey", "")
                else:
                    api_config_dict.pop("apiKey", None)
            
            # 更新配置
            if "apis" not in existing_profile:
                existing_profile["apis"] = {}
            existing_profile["apis"][category] = api_config_dict
        
        profile_data = existing_profile
    else:
        # 新建配置文件
        from datetime import datetime
        profile_data = {
            "id": request.profileId,
            "name": request.name or request.profileId,
            "createdAt": datetime.now().isoformat(),
            "apis": {}
        }
        
        # 添加所有 API 配置
        for category, api_config in request.apis.items():
            api_config_dict = api_config.dict(exclude_none=True)
            if api_config_dict.get("apiKey"):
                api_config_dict["apiKey"] = encrypt_api_key(api_config_dict["apiKey"])
            profile_data["apis"][category] = api_config_dict
    
    # 保存配置文件
    save_profile(request.profileId, profile_data)
    
    # 返回脱敏后的数据
    masked_apis = {}
    for category, api_config in profile_data.get("apis", {}).items():
        masked_config = api_config.copy()
        if "apiKey" in masked_config and masked_config["apiKey"]:
            masked_config["apiKey"] = mask_api_key(masked_config["apiKey"])
        masked_apis[category] = masked_config
    
    return {
        "id": profile_data.get("id", request.profileId),
        "name": profile_data.get("name", request.profileId),
        "apis": masked_apis
    }


@router.delete("/profiles/{profile_id}")
def delete_profile(profile_id: str):
    """删除配置文件"""
    config_file = CONFIG_DIR / f"{profile_id}.json"
    if not config_file.exists():
        raise HTTPException(status_code=404, detail="配置文件不存在")
    
    config_file.unlink()
    return {"message": "配置文件已删除"}


@router.post("/test-connection")
def test_connection(api_config: ApiConfigItem):
    """测试 API 连接并获取模型列表"""
    try:
        # 检测提供商类型
        provider = LLMModelService.detect_provider(api_config.apiUrl)
        
        # 获取模型列表
        models = LLMModelService.get_models_by_provider(
            provider=provider,
            api_key=api_config.apiKey or "",
            api_url=api_config.apiUrl
        )
        
        return {
            "success": True,
            "models": models,
            "provider": provider,
            "message": f"成功获取 {len(models)} 个模型"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取模型列表失败: {str(e)}"
        )


# ==================== ComfyUI Workflow Management ====================

@router.get("/comfyui/workflows", response_model=List[Dict[str, Any]])
def get_comfyui_workflows():
    """获取所有可用的 ComfyUI 工作流列表"""
    return workflow_manager.list_workflows()


@router.post("/comfyui/workflows/upload")
async def upload_comfyui_workflow(file: UploadFile = File(...)):
    """上传 ComfyUI 工作流 JSON 文件"""
    return await workflow_manager.upload_workflow(file)


@router.delete("/comfyui/workflows/{filename}")
def delete_comfyui_workflow(filename: str):
    """删除 ComfyUI 工作流文件"""
    return workflow_manager.delete_workflow(filename)


@router.get("/comfyui/workflows/{filename}")
def get_comfyui_workflow(filename: str):
    """获取指定工作流的详细内容"""
    return workflow_manager.load_workflow(filename)


# ==================== Connection Testing ====================

@router.post("/test-comfyui-connection")
def test_comfyui_connection(request: dict):
    """测试 ComfyUI 连接"""
    import requests as req
    
    api_url = request.get("apiUrl", "http://comfyui:8188")
    
    try:
        # 测试基本连通性
        response = req.get(f"{api_url}/system_stats", timeout=5)
        
        if response.status_code != 200:
            return {
                "success": False,
                "message": f"HTTP {response.status_code}"
            }
        
        stats = response.json()
        
        return {
            "success": True,
            "message": "连接成功",
            "stats": {
                "vram_total": stats.get("vram_total", 0),
                "vram_free": stats.get("vram_free", 0),
                "torch_version": stats.get("torch_version", ""),
                "device": stats.get("device", "")
            }
        }
    
    except req.exceptions.ConnectionError:
        return {
            "success": False,
            "message": "无法连接到 ComfyUI，请检查地址和端口"
        }
    except req.exceptions.Timeout:
        return {
            "success": False,
            "message": "连接超时，请检查 ComfyUI 是否正常运行"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"错误: {str(e)}"
        }


@router.post("/test-cloud-connection")
def test_cloud_connection(request: dict):
    """测试云端 API 连接"""
    import openai
    
    provider = request.get("provider", "dall-e")
    api_key = request.get("apiKey", "")
    model = request.get("model", "dall-e-3")
    
    if not api_key:
        return {
            "success": False,
            "message": "API Key 不能为空"
        }
    
    try:
        if provider == "dall-e":
            # 测试 DALL-E
            client = openai.OpenAI(api_key=api_key)
            
            # 尝试获取模型列表（轻量级测试）
            models = client.models.list()
            
            # 检查指定的模型是否存在
            model_exists = any(m.id == model for m in models.data)
            
            if model_exists:
                return {
                    "success": True,
                    "message": f"连接成功，模型 {model} 可用"
                }
            else:
                return {
                    "success": False,
                    "message": f"模型 {model} 不可用"
                }
        
        elif provider == "stability":
            # 测试 Stability AI
            import requests as req
            
            response = req.get(
                "https://api.stability.ai/v1/engines/list",
                headers={
                    "Authorization": f"Bearer {api_key}"
                },
                timeout=5
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "message": "连接成功"
                }
            else:
                return {
                    "success": False,
                    "message": f"HTTP {response.status_code}: {response.text}"
                }
        
        else:
            return {
                "success": False,
                "message": f"不支持的提供商: {provider}"
            }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"连接失败: {str(e)}"
        }
