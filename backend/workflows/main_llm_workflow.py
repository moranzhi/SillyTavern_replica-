# backend/app/workflows/llm_workflow.py
from typing import Dict, Any, List, Callable
from dataclasses import dataclass
from enum import Enum


class WorkflowStatus(Enum):
    """工作流状态枚举"""
    INITIALIZED = "initialized"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"


@dataclass
class WorkflowContext:
    """工作流上下文"""
    data: Dict[str, Any]
    status: WorkflowStatus = WorkflowStatus.INITIALIZED
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class WorkflowNode:
    """工作流节点声明"""

    def __init__(
            self,
            name: str,
            handler: Callable,
            enabled: bool = True,
            config: Dict[str, Any] = None
    ):
        self.name = name  # 节点的唯一标识符，用于区分不同的节点。
        self.handler = handler  # 一个可调用对象（函数或方法），这是节点实际执行的处理逻辑。
        self.enabled = enabled  # 布尔值，控制节点是否启用。默认为 True，如果设置为 False，节点将被跳过。
        self.config = config or {} # 一个字典，用于存储节点的配置信息。默认为空字典。
        self.next_nodes: List['WorkflowNode'] = [] # 一个节点列表，用于指定当前节点执行完成后应跳转到的下一个节点。默认为空列表，可能指向多分支。

    def execute(self, context: WorkflowContext) -> WorkflowContext:
        """执行节点处理"""
        if not self.enabled:
            return context

        try:
            context = self.handler(context, self.config)
            return context
        except Exception as e:
            context.status = WorkflowStatus.FAILED
            context.metadata["error"] = str(e)
            raise


class LLMWorkflow:
    """LLM工作流声明"""

    def __init__(self):
        self.nodes: List[WorkflowNode] = []
        self._initialize_workflow()

    def _initialize_workflow(self):
        """初始化工作流节点（仅声明，不实现）"""
        # 输入节点
        input_node = WorkflowNode(
            name="input",
            handler=self._input_handler
        )

        # 输入预处理节点（可开关）
        preprocessing_node = WorkflowNode(
            name="preprocessing",
            handler=self._preprocessing_handler,
            enabled=False
        )

        # RAG处理节点
        rag_node = WorkflowNode(
            name="rag",
            handler=self._rag_handler
        )

        # 提示词组装节点
        prompt_assembly_node = WorkflowNode(
            name="prompt_assembly",
            handler=self._prompt_assembly_handler
        )

        # LLM请求节点
        llm_request_node = WorkflowNode(
            name="llm_request",
            handler=self._llm_request_handler
        )

        # 图像生成节点（可开关）
        image_generation_node = WorkflowNode(
            name="image_generation",
            handler=self._image_generation_handler,
            enabled=False
        )

        # 动态表格更新节点（可开关）
        dynamic_table_node = WorkflowNode(
            name="dynamic_table",
            handler=self._dynamic_table_handler,
            enabled=False
        )

        # 输出过滤节点
        output_filter_node = WorkflowNode(
            name="output_filter",
            handler=self._output_filter_handler
        )

        # 输出节点
        output_node = WorkflowNode(
            name="output",
            handler=self._output_handler
        )

        # 设置节点顺序（构建工作流）
        self.nodes = [
            input_node,
            preprocessing_node,
            rag_node,
            prompt_assembly_node,
            llm_request_node,
            image_generation_node,
            dynamic_table_node,
            output_filter_node,
            output_node
        ]

    def execute(self, context: WorkflowContext) -> WorkflowContext:
        """执行工作流"""
        context.status = WorkflowStatus.RUNNING

        for node in self.nodes:
            try:
                context = node.execute(context)

                # 如果工作流失败，停止执行
                if context.status == WorkflowStatus.FAILED:
                    break
            except Exception as e:
                context.status = WorkflowStatus.FAILED
                context.metadata["error"] = str(e)
                break

        if context.status != WorkflowStatus.FAILED:
            context.status = WorkflowStatus.COMPLETED

        return context

    def enable_node(self, node_name: str, enabled: bool = True):
        """启用或禁用特定节点"""
        for node in self.nodes:
            if node.name == node_name:
                node.enabled = enabled
                return True
        return False

    # 以下是节点处理函数声明（仅声明，不实现）
    def _input_handler(self, context: WorkflowContext, config: Dict[str, Any]) -> WorkflowContext:
        """输入节点处理函数"""
        pass

    def _preprocessing_handler(self, context: WorkflowContext, config: Dict[str, Any]) -> WorkflowContext:
        """输入预处理节点处理函数"""
        pass

    def _rag_handler(self, context: WorkflowContext, config: Dict[str, Any]) -> WorkflowContext:
        """RAG处理节点处理函数"""
        pass

    def _prompt_assembly_handler(self, context: WorkflowContext, config: Dict[str, Any]) -> WorkflowContext:
        """提示词组装节点处理函数"""
        pass

    def _llm_request_handler(self, context: WorkflowContext, config: Dict[str, Any]) -> WorkflowContext:
        """LLM请求节点处理函数"""
        pass

    def _image_generation_handler(self, context: WorkflowContext, config: Dict[str, Any]) -> WorkflowContext:
        """图像生成节点处理函数"""
        pass

    def _dynamic_table_handler(self, context: WorkflowContext, config: Dict[str, Any]) -> WorkflowContext:
        """动态表格更新节点处理函数"""
        pass

    def _output_filter_handler(self, context: WorkflowContext, config: Dict[str, Any]) -> WorkflowContext:
        """输出过滤节点处理函数"""
        pass

    def _output_handler(self, context: WorkflowContext, config: Dict[str, Any]) -> WorkflowContext:
        """输出节点处理函数"""
        pass
