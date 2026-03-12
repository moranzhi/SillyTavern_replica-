import base64
from typing import Any, Dict
from IPython.core.magic_arguments import defaults
from  .. import nodes

class StartNode():
    name = "开始节点"
    inputs = {
        "user_input": "string",  # 用户输入文本
        "stream": "boolean",  # 是否流式输出
        "img_switch": "boolean",  # 是否处理图片
        "table_switch": "boolean",  # 是否处理表格
        "role_name": "string",  # 角色名称
        "chat_name": "string"  # 会话名称
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

async def run(is_user,floor_number,mes: str = None, stream: bool = False, img_switch: bool = False,name = "default",
              table_switch: bool = False, role_name: str = None, chat_name: str = None,preset: str = None):
    # 将输入内容持久化存储到本地json方便前端读
    nodes.save_input_to_json(mes=mes, role_name=role_name, chat_name=chat_name, name=name, is_user=is_user, floor_number=floor_number)
    # 对上一条输入内容（已确定不变的内容）调用向量化，根据role和chat嵌入到对应本地数据库
    embed_input(user_input, role_name, chat_name)
    # 根据role和chat去读取绑定的世界书
    # 读取预设，进行拼接
    # 调用模型，返回结果
    # 将结果持久化存储到本地json方便前端读（用JSONL）
    # 如果img_switch是开的，那么异步调用生图，并存储到目标文件夹里
    # 如果table_switch是开的，那么异步调用表格生成，并存储到目标文件夹里
    # 将结果返回给前端