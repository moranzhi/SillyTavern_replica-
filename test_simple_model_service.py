"""
简单测试 LLM 模型服务的提供商检测功能
"""
import sys
import os

# 添加backend目录到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# 直接导入服务模块，避免导入__init__.py
from services.llm_model_service import LLMModelService


def test_detect_provider():
    """测试提供商检测功能"""
    print("=" * 60)
    print("测试提供商检测功能")
    print("=" * 60)
    
    test_cases = [
        ("https://api.openai.com/v1", "openai"),
        ("https://api.anthropic.com/v1", "anthropic"),
        ("http://localhost:11434", "ollama"),
        ("http://127.0.0.1:11434", "ollama"),
        ("https://api.siliconflow.cn/v1", "openai"),
        ("https://api.deepseek.com/v1", "openai"),
        ("https://custom-api.example.com/v1", "openai"),
    ]
    
    all_passed = True
    for url, expected in test_cases:
        result = LLMModelService.detect_provider(url)
        passed = result == expected
        status = "✓" if passed else "✗"
        print(f"  {status} {url}")
        print(f"      结果: {result}, 期望: {expected}")
        if not passed:
            all_passed = False
    
    print("=" * 60)
    if all_passed:
        print("所有测试通过！✓")
    else:
        print("部分测试失败！✗")
    print("=" * 60)
    
    return all_passed


if __name__ == "__main__":
    test_detect_provider()
