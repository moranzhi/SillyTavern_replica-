"""
LLM 模型管理服务

提供获取不同 LLM 提供商可用模型列表的功能
"""
from typing import List, Dict, Any, Optional
import requests


class LLMModelService:
    """LLM 模型管理服务"""
    
    @staticmethod
    def get_openai_models(api_key: str, base_url: Optional[str] = None) -> List[str]:
        """
        获取 OpenAI 兼容 API 的模型列表
        
        Args:
            api_key: API Key
            base_url: API 基础 URL，默认为 OpenAI 官方 API
            
        Returns:
            模型名称列表
        """
        try:
            # 默认使用 OpenAI 官方 API
            if not base_url:
                base_url = "https://api.openai.com/v1"
            
            # 确保 base_url 以 /v1 结尾
            if not base_url.endswith('/v1'):
                base_url = base_url.rstrip('/') + '/v1'
            
            response = requests.get(
                f"{base_url}/models",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                timeout=10
            )
            
            if response.status_code != 200:
                raise Exception(f"HTTP {response.status_code}: {response.text}")
            
            data = response.json()
            models = [model['id'] for model in data.get('data', [])]
            
            # 过滤出聊天模型（可选）
            chat_models = [
                m for m in models 
                if any(keyword in m.lower() for keyword in ['gpt', 'chat'])
            ]
            
            # 如果没有找到聊天模型，返回所有模型
            return chat_models if chat_models else models
            
        except Exception as e:
            raise Exception(f"获取 OpenAI 模型列表失败: {str(e)}")
    
    @staticmethod
    def get_anthropic_models(api_key: str) -> List[str]:
        """
        获取 Anthropic Claude 模型列表
        
        Args:
            api_key: API Key
            
        Returns:
            模型名称列表
        """
        try:
            # Anthropic 没有公开的模型列表 API，返回已知模型
            return [
                "claude-3-5-sonnet-20241022",
                "claude-3-5-haiku-20241022",
                "claude-3-opus-20240229",
                "claude-3-sonnet-20240229",
                "claude-3-haiku-20240307",
                "claude-2.1",
                "claude-2.0",
                "claude-instant-1.2"
            ]
            
        except Exception as e:
            raise Exception(f"获取 Anthropic 模型列表失败: {str(e)}")
    
    @staticmethod
    def get_ollama_models(base_url: str = "http://localhost:11434") -> List[str]:
        """
        获取 Ollama 本地模型列表
        
        Args:
            base_url: Ollama API 地址
            
        Returns:
            模型名称列表
        """
        try:
            response = requests.get(
                f"{base_url}/api/tags",
                timeout=10
            )
            
            if response.status_code != 200:
                raise Exception(f"HTTP {response.status_code}: {response.text}")
            
            data = response.json()
            models = [model['name'] for model in data.get('models', [])]
            
            return models
            
        except Exception as e:
            raise Exception(f"获取 Ollama 模型列表失败: {str(e)}")
    
    @staticmethod
    def detect_provider(api_url: str) -> str:
        """
        根据 API URL 检测提供商类型
        
        Args:
            api_url: API 地址
            
        Returns:
            提供商类型: 'openai', 'anthropic', 'ollama', 'unknown'
        """
        api_url_lower = api_url.lower()
        
        if 'openai' in api_url_lower or 'api.openai.com' in api_url_lower:
            return 'openai'
        elif 'anthropic' in api_url_lower or 'api.anthropic.com' in api_url_lower:
            return 'anthropic'
        elif 'ollama' in api_url_lower or 'localhost:11434' in api_url_lower or '127.0.0.1:11434' in api_url_lower:
            return 'ollama'
        elif 'siliconflow' in api_url_lower or 'silicon.cloud' in api_url_lower:
            # SiliconFlow 等兼容 OpenAI API 的服务
            return 'openai'
        elif 'deepseek' in api_url_lower:
            # DeepSeek 等兼容 OpenAI API 的服务
            return 'openai'
        else:
            # 默认尝试 OpenAI 兼容 API
            return 'openai'
    
    @staticmethod
    def get_models_by_provider(
        provider: str,
        api_key: str,
        api_url: Optional[str] = None
    ) -> List[str]:
        """
        根据提供商类型获取模型列表
        
        Args:
            provider: 提供商类型 ('openai', 'anthropic', 'ollama')
            api_key: API Key
            api_url: API 地址（可选）
            
        Returns:
            模型名称列表
        """
        if provider == 'openai':
            return LLMModelService.get_openai_models(api_key, api_url)
        elif provider == 'anthropic':
            return LLMModelService.get_anthropic_models(api_key)
        elif provider == 'ollama':
            base_url = api_url or "http://localhost:11434"
            # 移除 /v1 后缀（如果有）
            base_url = base_url.replace('/v1', '').replace('/v1/', '')
            return LLMModelService.get_ollama_models(base_url)
        else:
            raise Exception(f"不支持的提供商: {provider}")
