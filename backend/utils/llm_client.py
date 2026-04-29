"""
LLM 客户端工具

提供统一的 LLM 接口,支持多种模型提供商。
使用 LangChain 的 ChatModel 抽象,简化不同厂商 API 的调用。
"""
from typing import Optional
from langchain_core.language_models.chat_models import BaseChatModel
from core.config import settings


def get_llm(
    provider: str = "openai",
    model: Optional[str] = None,
    temperature: float = 0.7,
    streaming: bool = False,
    **kwargs
) -> BaseChatModel:
    """
    获取 LLM 实例
    
    Args:
        provider: 模型提供商 ("openai", "anthropic", "ollama")
        model: 模型名称 (如果不指定则使用配置中的默认值)
        temperature: 温度参数 (0-2)
        streaming: 是否启用流式输出
        **kwargs: 其他参数传递给模型
        
    Returns:
        BaseChatModel: LangChain 的聊天模型实例
    """
    
    if provider == "openai":
        from langchain_openai import ChatOpenAI
        
        return ChatOpenAI(
            model=model or settings.OPENAI_MODEL or "gpt-4",
            temperature=temperature,
            api_key=settings.OPENAI_API_KEY,
            streaming=streaming,
            **kwargs
        )
    
    elif provider == "anthropic":
        from langchain_anthropic import ChatAnthropic
        
        return ChatAnthropic(
            model=model or settings.ANTHROPIC_MODEL or "claude-3-opus-20240229",
            temperature=temperature,
            api_key=settings.ANTHROPIC_API_KEY,
            max_tokens=kwargs.pop("max_tokens", 4096),
            streaming=streaming,
            **kwargs
        )
    
    elif provider == "ollama":
        try:
            from langchain_ollama import ChatOllama
            
            return ChatOllama(
                model=model or settings.OLLAMA_MODEL or "llama3",
                base_url=settings.OLLAMA_BASE_URL or "http://localhost:11434",
                temperature=temperature,
                **kwargs
            )
        except ImportError:
            raise ImportError(
                "langchain-ollama not installed. Run: pip install langchain-ollama"
            )
    
    else:
        raise ValueError(f"Unsupported provider: {provider}. Use 'openai', 'anthropic', or 'ollama'")


# 便捷函数 - 常用配置
def get_fast_llm(provider: str = "openai") -> BaseChatModel:
    """获取快速响应的 LLM (低温度,适合事实性问题)"""
    return get_llm(provider, temperature=0.3)


def get_creative_llm(provider: str = "openai") -> BaseChatModel:
    """获取创造性 LLM (高温度,适合创意写作)"""
    return get_llm(provider, temperature=0.9)


def get_streaming_llm(provider: str = "openai") -> BaseChatModel:
    """获取支持流式输出的 LLM"""
    return get_llm(provider, streaming=True)
