import json
from typing import Dict, Any
from datetime import datetime
import config as cfg
from pathlib import Path


def save_input_to_json(
        mes: str,
        role_name: str,
        chat_name: str,
        name: str,
        is_user: bool,
        floor_number: int = 0
) -> Dict[str, Any]:
    """
    保存消息到JSONL文件或处理重roll请求

    参数:
        mes: 消息内容
        role_name: 角色名称
        chat_name: 对话名称
        name: 发送者名称
        is_user: 是否为用户消息
        floor_number: 楼层号(对话中的第几次回复)，用于判断是否为重roll请求

    返回:
        更新后的消息对象
    """
    config = cfg.settings
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
    # 测试普通消息保存
    # save_input_to_json(
    #     mes="你好",
    #     role_name="test",
    #     chat_name="111",
    #     name="用户",
    #     is_user=True,
    #     floor_number=0
    # )
    #
    # save_input_to_json(
    #     mes="你好，我是AI助手",
    #     role_name="test",
    #     chat_name="111",
    #     name="AI",
    #     is_user=False,
    #     floor_number=1
    # )

    # 测试重roll最后一条AI消息
    save_input_to_json(
        mes="这是重roll后的新回复2",
        role_name="test",
        chat_name="111",
        name="AI",
        is_user=False,
        floor_number=2  # 与当前楼层号相同，表示重roll
    )
