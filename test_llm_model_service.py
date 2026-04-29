"""
测试 LLM 模型服务
"""
import sys
sys.path.insert(0, 'backend')

from backend.services.llm_model_service import LLMModelService


def test_detect_provider():
    """测试提供商检测功能"""
    print("测试提供商检测...")
    
    test_cases = [
        ("https://api.openai.com/v1", "openai"),
        ("https://api.anthropic.com/v1", "anthropic"),
        ("http://localhost:11434", "ollama"),
        ("http://127.0.0.1:11434", "ollama"),
        ("https://api.siliconflow.cn/v1", "openai"),
        ("https://api.deepseek.com/v1", "openai"),
    ]
    
    for url, expected in test_cases:
        result = LLMModelService.detect_provider(url)
        status = "✓" if result == expected else "✗"
        print(f"  {status} {url} -> {result} (期望: {expected})")


def test_get_openai_models():
    """测试获取 OpenAI 模型列表（需要有效的 API Key）"""
    print("\n测试 OpenAI 模型列表获取...")
    
    # 这里需要一个有效的 API Key 才能测试
    api_key = "sk-test-key"  # 替换为实际的 API Key
    try:
        models = LLMModelService.get_openai_models(api_key)
        print(f"  ✓ 成功获取 {len(models)} 个模型")
        print(f"  前5个模型: {models[:5]}")
    except Exception as e:
        print(f"  ✗ 失败: {str(e)}")


def test_get_ollama_models():
    """测试获取 Ollama 模型列表（需要本地运行 Ollama）"""
    print("\n测试 Ollama 模型列表获取...")
    
    try:
        models = LLMModelService.get_ollama_models()
        print(f"  ✓ 成功获取 {len(models)} 个模型")
        print(f"  模型列表: {models}")
    except Exception as e:
        print(f"  ✗ 失败: {str(e)}")


if __name__ == "__main__":
    print("=" * 60)
    print("LLM 模型服务测试")
    print("=" * 60)
    
    test_detect_provider()
    # test_get_openai_models()  # 需要有效的 API Key
    # test_get_ollama_models()  # 需要本地运行 Ollama
    
    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)
