import json
from datetime import datetime
from backend.core import config as cfg
from pathlib import Path
from ..core.items import ChatRequest

# 假设 ChatRequest 定义在这里或者从其他地方导入
# from backend.app.core.items import ChatRequest

async def save_input_to_json(chat_request: ChatRequest):
    """
    保存消息到JSONL文件或处理重roll请求

    参数:
        chat_request: 包含消息详情的请求对象
    """
    # 1. 从对象中提取属性
    mes = chat_request.mes
    role_name = chat_request.role_name
    chat_name = chat_request.chat_name
    name = chat_request.name
    is_user = chat_request.is_user
    floor_number = chat_request.floor_number
    # stream, img_switch, table_switch 等虽然在这个函数逻辑中没用到，
    # 但如果 ChatRequest 中有，也可以提取出来备用
    # stream = chat_request.stream
    # ...

    config = cfg.settings
    # 注意：这里要确保 role_name 和 chat_name 不为 None，否则路径拼接会报错
    # 建议在函数入口处增加校验，或者在 Pydantic 模型中设置为必填项
    if not role_name or not chat_name:
        raise ValueError("role_name and chat_name cannot be empty")

    file_path = config.BASE_PATH / "data" / "chat" / role_name / f"{chat_name}.jsonl"

    # 确保目录存在
    Path(file_path).parent.mkdir(parents=True, exist_ok=True)

    # 读取文件内容
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except FileNotFoundError:
        lines = []

    # 判断是否为重roll请求
    is_regenerate = False
    target_index = -1

    if lines and floor_number > 0:
        # 计算当前楼层号
        current_floor = len(lines)

        # 如果floor_number与当前楼层号相同，则为重roll请求
        if floor_number == current_floor:
            # 找到最后一条非用户消息
            for i in range(len(lines) - 1, -1, -1):
                try:
                    line_data = json.loads(lines[i])
                    if not line_data.get('is_user', False):
                        is_regenerate = True
                        target_index = i
                        break
                except json.JSONDecodeError:
                    continue

    # 处理重roll逻辑
    if is_regenerate:
        # 解析目标消息
        try:
            target_message = json.loads(lines[target_index])
        except json.JSONDecodeError:
            raise ValueError(f"无法解析楼层 {floor_number} 的JSON数据")

        # 初始化swipes数组
        if target_message.get('swipes') is None:
            target_message['swipes'] = []

        # 将新回复添加到swipes数组
        target_message['swipes'].append(mes)

        # 更新swipe_id和content
        target_message['swipes_id'] = len(target_message['swipes']) - 1
        target_message['content'] = mes

        # 更新文件内容
        lines[target_index] = json.dumps(target_message, ensure_ascii=False) + '\n'

        # 写回文件
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)

        return target_message

    # 处理普通消息保存逻辑
    else:
        # 获取当前时间
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 构建消息对象
        message = {
            "role": role_name,
            "chat": chat_name,
            "content": mes,
            "name": name,
            "is_user": is_user,
            "send_date": current_time,
            "floor_number": len(lines) + 1,  # 记录楼层号
            "swipes": [],
            "swipes_id": 0
        }

        # 追加到文件
        with open(file_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(message, ensure_ascii=False) + '\n')

        return message


if __name__ == '__main__':
    # 注意：为了在本地运行测试，你需要手动构造一个 ChatRequest 对象
    # 或者临时修改函数签名以便直接传参测试

    # 示例：假设 ChatRequest 是一个简单的类或 Pydantic 模型
    class MockChatRequest:
        def __init__(self, **kwargs):
            self.mes = kwargs.get('mes')
            self.role_name = kwargs.get('role_name')
            self.chat_name = kwargs.get('chat_name')
            self.name = kwargs.get('name')
            self.is_user = kwargs.get('is_user')
            self.floor_number = kwargs.get('floor_number')


    # 测试重roll最后一条AI消息
    import asyncio


    async def test():
        req = MockChatRequest(
            mes="这是重roll后的新回复2",
            role_name="test",
            chat_name="111",
            name="AI",
            is_user=False,
            floor_number=2
        )
        await save_input_to_json(req)


    asyncio.run(test())
