import re
from core.node_base import BaseNode
from typing import List, Dict, Any


class TextSplitterNode(BaseNode):
    name = "文本分割节点"
    inputs = {"text": "string"}
    outputs = {
        "outline": "list",  # 大纲部分列表
        "requirement": "list",  # 要求部分列表
        "dialogue": "list",  # 对话部分列表
        "weak_guidance": "list"  # 弱指引部分列表
    }

    async def run(self, text: str) -> Dict[str, List[str]]:
        # 正则匹配三种括号内的内容
        # 注意：此正则假设括号不嵌套，且没有转义字符
        pattern = r'\{([^{}]*)\}|\(([^()]*)\)|“([^”]*)”'

        outline = []
        requirement = []
        dialogue = []
        weak_guidance = []

        pos = 0
        for match in re.finditer(pattern, text):
            start, end = match.span()
            # 处理匹配前的普通文本（弱指引）
            if start > pos:
                weak_part = text[pos:start].strip()
                if weak_part:
                    weak_guidance.append(weak_part)

            # 根据捕获组确定类型
            if match.group(1) is not None:  # 大括号
                outline.append(match.group(1).strip())
            elif match.group(2) is not None:  # 小括号
                requirement.append(match.group(2).strip())
            elif match.group(3) is not None:  # 中文引号
                dialogue.append(match.group(3).strip())

            pos = end

        # 处理剩余的普通文本
        if pos < len(text):
            weak_part = text[pos:].strip()
            if weak_part:
                weak_guidance.append(weak_part)

        return {
            "outline": outline,
            "requirement": requirement,
            "dialogue": dialogue,
            "weak_guidance": weak_guidance
        }