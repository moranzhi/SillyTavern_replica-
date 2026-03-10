import base64
from core.node_base import BaseNode
from typing import Any, Dict


class StartNode(BaseNode):
    name = "开始节点"
    inputs = {}  # 没有输入参数
    outputs = {
        "text": "string",  # 文本内容
        "image": "string"  # 图片以 Base64 编码的字符串传递
    }

    async def run(self, text: str = None, image: bytes = None, **kwargs) -> Dict[str, Any]:
        # 查空：文本不能为空字符串
        if not text or text.strip() == "":
            raise ValueError("文本输入不能为空")

        # 查空：图片数据不能为空
        if image is None or len(image) == 0:
            raise ValueError("图片输入不能为空")

        # 将图片字节转换为 Base64 字符串，便于在节点间传递
        image_base64 = base64.b64encode(image).decode('utf-8')

        return {
            "text": text,
            "image": image_base64
        }