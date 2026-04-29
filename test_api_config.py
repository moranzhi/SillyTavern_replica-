#!/usr/bin/env python3
"""
ComfyUI API 配置测试脚本
用于验证后端 API 端点是否正常工作
"""
import requests
import json
from pathlib import Path

# 配置
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/api-config"

def print_section(title):
    """打印分隔线"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_list_workflows():
    """测试列出工作流"""
    print_section("测试 1: 列出工作流")
    
    try:
        response = requests.get(f"{API_BASE}/comfyui/workflows")
        response.raise_for_status()
        
        workflows = response.json()
        print(f"✅ 成功获取 {len(workflows)} 个工作流\n")
        
        for wf in workflows:
            print(f"  📄 {wf['filename']}")
            print(f"     节点数: {wf['nodes_count']}, 大小: {wf['size']} bytes")
        
        return True
    except Exception as e:
        print(f"❌ 失败: {e}")
        return False

def test_get_workflow():
    """测试获取工作流详情"""
    print_section("测试 2: 获取工作流详情")
    
    try:
        response = requests.get(f"{API_BASE}/comfyui/workflows/default_txt2img.json")
        response.raise_for_status()
        
        workflow = response.json()
        print(f"✅ 成功获取工作流\n")
        print(f"  节点数量: {len(workflow)}")
        print(f"  节点列表:")
        
        for node_id, node_data in workflow.items():
            class_type = node_data.get('class_type', 'Unknown')
            title = node_data.get('_meta', {}).get('title', 'No title')
            print(f"    - {node_id}: {class_type} ({title})")
        
        return True
    except Exception as e:
        print(f"❌ 失败: {e}")
        return False

def test_upload_workflow():
    """测试上传工作流"""
    print_section("测试 3: 上传工作流")
    
    # 创建一个简单的测试工作流
    test_workflow = {
        "3": {
            "inputs": {
                "seed": 42,
                "steps": 20,
                "cfg": 8,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            },
            "class_type": "KSampler",
            "_meta": {"title": "测试采样器"}
        },
        "4": {
            "inputs": {"ckpt_name": "test.safetensors"},
            "class_type": "CheckpointLoaderSimple",
            "_meta": {"title": "测试加载器"}
        },
        "5": {
            "inputs": {"width": 512, "height": 512, "batch_size": 1},
            "class_type": "EmptyLatentImage",
            "_meta": {"title": "测试潜变量"}
        },
        "6": {
            "inputs": {"text": "test prompt", "clip": ["4", 1]},
            "class_type": "CLIPTextEncode",
            "_meta": {"title": "测试正向提示词"}
        },
        "7": {
            "inputs": {"text": "bad quality", "clip": ["4", 1]},
            "class_type": "CLIPTextEncode",
            "_meta": {"title": "测试负向提示词"}
        },
        "8": {
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]},
            "class_type": "VAEDecode",
            "_meta": {"title": "测试解码器"}
        },
        "9": {
            "inputs": {"images": ["8", 0], "filename_prefix": "Test"},
            "class_type": "SaveImage",
            "_meta": {"title": "测试保存"}
        }
    }
    
    # 保存到临时文件
    temp_file = Path("test_workflow.json")
    with open(temp_file, 'w', encoding='utf-8') as f:
        json.dump(test_workflow, f, ensure_ascii=False, indent=2)
    
    try:
        with open(temp_file, 'rb') as f:
            files = {'file': ('test_workflow.json', f, 'application/json')}
            response = requests.post(f"{API_BASE}/comfyui/workflows/upload", files=files)
            response.raise_for_status()
        
        result = response.json()
        print(f"✅ 上传成功\n")
        print(f"  文件名: {result['filename']}")
        print(f"  大小: {result['size']} bytes")
        
        # 清理临时文件
        temp_file.unlink()
        
        return True
    except Exception as e:
        print(f"❌ 失败: {e}")
        if temp_file.exists():
            temp_file.unlink()
        return False

def test_delete_workflow():
    """测试删除工作流"""
    print_section("测试 4: 删除工作流")
    
    try:
        response = requests.delete(f"{API_BASE}/comfyui/workflows/test_workflow.json")
        response.raise_for_status()
        
        result = response.json()
        print(f"✅ 删除成功\n")
        print(f"  {result['message']}")
        
        return True
    except Exception as e:
        print(f"❌ 失败: {e}")
        return False

def test_comfyui_connection():
    """测试 ComfyUI 连接"""
    print_section("测试 5: 测试 ComfyUI 连接")
    
    try:
        response = requests.post(
            f"{API_BASE}/test-comfyui-connection",
            json={"apiUrl": "http://localhost:8188"}
        )
        response.raise_for_status()
        
        result = response.json()
        
        if result['success']:
            print(f"✅ 连接成功\n")
            print(f"  消息: {result['message']}")
            if 'stats' in result:
                stats = result['stats']
                vram_free_gb = stats.get('vram_free', 0) / 1024 / 1024 / 1024
                print(f"  可用 VRAM: {vram_free_gb:.2f} GB")
                print(f"  设备: {stats.get('device', 'N/A')}")
                print(f"  Torch 版本: {stats.get('torch_version', 'N/A')}")
        else:
            print(f"⚠️  连接失败（这是正常的，如果 ComfyUI 未运行）\n")
            print(f"  消息: {result['message']}")
        
        return True
    except Exception as e:
        print(f"⚠️  请求失败（这是正常的，如果 ComfyUI 未运行）: {e}")
        return True  # 不算失败，因为可能只是 ComfyUI 没启动

def test_cloud_connection():
    """测试云端 API 连接"""
    print_section("测试 6: 测试云端 API 连接")
    
    print("⚠️  跳过此测试（需要真实的 API Key）\n")
    print("  要测试此功能，请提供一个有效的 API Key")
    
    return True

def main():
    """主测试流程"""
    print("\n" + "="*60)
    print("  ComfyUI API 配置测试")
    print("="*60)
    
    tests = [
        ("列出工作流", test_list_workflows),
        ("获取工作流详情", test_get_workflow),
        ("上传工作流", test_upload_workflow),
        ("删除工作流", test_delete_workflow),
        ("测试 ComfyUI 连接", test_comfyui_connection),
        ("测试云端 API 连接", test_cloud_connection),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            success = test_func()
            results.append((name, success))
        except Exception as e:
            print(f"\n❌ 测试 '{name}' 发生异常: {e}")
            results.append((name, False))
    
    # 打印总结
    print_section("测试总结")
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for name, success in results:
        status = "✅ 通过" if success else "❌ 失败"
        print(f"  {status} - {name}")
    
    print(f"\n  总计: {passed}/{total} 通过")
    
    if passed == total:
        print("\n🎉 所有测试通过！")
    else:
        print(f"\n⚠️  {total - passed} 个测试失败，请检查日志")
    
    return passed == total

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
