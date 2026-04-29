import sys
from pathlib import Path
import os
import time

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from backend.core.models.chat_history import ChatHistory

# 导入 LangChain
try:
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import HumanMessage
except ImportError:
    print("⚠️  未安装 langchain 库，请先运行: pip install langchain-openai langchain-core")
    sys.exit(1)


def test_api_key(api_key: str, base_url: str = None, model: str = "gpt-3.5-turbo") -> dict:
    """
    使用 LangChain 测试 API Key

    Args:
        api_key: API密钥
        base_url: API基础URL（可选）
        model: 模型名称

    Returns:
        dict: 测试结果
    """
    try:
        # 创建 LLM 实例
        llm_kwargs = {
            "model": model,
            "api_key": api_key,
            "temperature": 0,
            "max_tokens": 5
        }

        if base_url:
            llm_kwargs["base_url"] = base_url

        llm = ChatOpenAI(**llm_kwargs)

        # 发送测试消息
        start_time = time.time()
        response = llm.invoke([HumanMessage(content="Hi")])
        end_time = time.time()

        return {
            "valid": True,
            "message": f"✅ API Key 有效！响应时间: {end_time - start_time:.2f}秒",
            "response_time": end_time - start_time,
            "content": response.content
        }

    except Exception as e:
        return {
            "valid": False,
            "message": f"❌ API Key 无效: {str(e)}",
            "error": str(e)
        }


def check_api_status():
    """检查 API Key 状态"""
    print("\n" + "=" * 60)
    print("API Key 检测 (LangChain)")
    print("=" * 60)

    # 从环境变量读取配置
    API_KEY = os.getenv("MAIN_LLM_API_KEY", "")
    BASE_URL = os.getenv("MAIN_LLM_BASE_URL", "")
    MODEL = os.getenv("MAIN_LLM_MODEL", "gpt-3.5-turbo")

    print(f"\n配置信息:")
    print(f"  模型: {MODEL}")
    if BASE_URL:
        print(f"  API地址: {BASE_URL}")

    if not API_KEY:
        print("\n❌ 未找到 API Key!")
        print("\n请在 .env 文件中设置 MAIN_LLM_API_KEY")
        return False

    print(f"  API密钥: {'*' * 8}{API_KEY[-4:]}")
    print(f"\n正在测试...")

    # 执行测试
    result = test_api_key(API_KEY, BASE_URL if BASE_URL else None, MODEL)

    print(f"\n{result['message']}")

    if result["valid"]:
        print(f"  响应时间: {result['response_time']:.2f}秒")
        print(f"\n💡 API Key 可以正常使用！")
        return True
    else:
        print(f"\n💡 请检查:")
        print("  1. API Key 是否正确")
        print("  2. API 端点地址是否正确")
        print("  3. 网络连接是否正常")
        return False


def quick_test():
    """快速测试"""
    API_KEY = os.getenv("MAIN_LLM_API_KEY", "")
    BASE_URL = os.getenv("MAIN_LLM_BASE_URL", "")
    MODEL = os.getenv("MAIN_LLM_MODEL", "gpt-3.5-turbo")

    if not API_KEY:
        print("❌ 未配置 API Key")
        return False

    result = test_api_key(API_KEY, BASE_URL if BASE_URL else None, MODEL)
    print(result['message'])
    return result['valid']


def test_list_all_chats():
    """测试聊天历史"""
    try:
        result = ChatHistory.list_all_chats()
        print(f"\n获取到 {len(result.get('chat', []))} 个聊天")
        return result
    except Exception as e:
        print(f"错误: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


# 运行测试
if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "--check":
            check_api_status()
        elif sys.argv[1] == "--quick":
            quick_test()
        elif sys.argv[1] == "--chat":
            test_list_all_chats()
        else:
            print("用法:")
            print("  python test.py --check   # 检查 API Key")
            print("  python test.py --quick   # 快速验证")
            print("  python test.py --chat    # 测试聊天历史")
    else:
        check_api_status()
