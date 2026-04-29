"""
提示词组装器 (Prompt Assembler)

负责根据 SillyTavern 规范将角色卡、世界书、聊天历史等组件
拼装成最终的 LLM 消息列表。
"""
import re
from typing import List, Dict, Optional
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage

from models.internal import CharacterCard, ChatMessage, WorldInfoEntry


class PromptConfig:
    """提示词组装配置"""
    def __init__(
        self,
        an_position: str = "after_history", # "before_history" or "after_history"
        an_depth: int = 4,
        post_history_instructions: Optional[str] = None
    ):
        self.an_position = an_position
        self.an_depth = an_depth
        self.post_history_instructions = post_history_instructions


class PromptAssembler:
    """
    轻量级提示词组装核心
    
    不依赖复杂的框架，只负责纯粹的文本拼接和位置插入。
    """

    # SillyTavern 的位置枚举映射
    POS_WI_BEFORE = 0
    POS_WI_AFTER = 1
    POS_EXAMPLES_BEFORE = 2
    POS_EXAMPLES_AFTER = 3
    POS_AN_TOP = 4
    POS_AN_BOTTOM = 5
    POS_DEPTH = 6
    POS_OUTLET = 7

    def assemble(
        self,
        character: CharacterCard,
        chat_history: List[ChatMessage],
        user_input: str,
        active_entries: List[WorldInfoEntry],
        config: PromptConfig = PromptConfig()
    ) -> List[BaseMessage]:
        """
        执行完整的提示词组装流程
        
        Returns:
            List[BaseMessage]: 准备好发送给 LLM 的消息列表
        """
        # 1. 按位置分组世界书条目
        grouped_entries = self._group_entries_by_position(active_entries)

        # 2. 组装 Story String (包含 Pos 0-3)
        story_string = self._build_story_string(character, grouped_entries)

        # 3. 组装 Author's Note (包含 Pos 4-5)
        authors_note_content = self._build_authors_note(grouped_entries, config.an_depth)

        # 4. 处理 Chat History 并注入 Depth 条目 (Pos 6)
        processed_history = self._inject_depth_entries(chat_history, grouped_entries.get(self.POS_DEPTH, []))

        # 5. 准备 Outlet 替换字典 (Pos 7)
        outlet_map = {entry.uid: entry.content for entry in grouped_entries.get(self.POS_OUTLET, [])}

        # 6. 最终封装为 Messages
        return self._wrap_to_messages(
            story_string, 
            authors_note_content, 
            processed_history, 
            user_input, 
            outlet_map,
            config
        )

    def _group_entries_by_position(self, entries: List[WorldInfoEntry]) -> Dict[int, List[WorldInfoEntry]]:
        """将激活的条目按 position 分组"""
        grouped = {}
        for entry in entries:
            # 这里假设 entry.position 存储的是我们定义的 0-7 整数
            pos = entry.position if isinstance(entry.position, int) else 1 # 默认为 wiAfter
            if pos not in grouped:
                grouped[pos] = []
            grouped[pos].append(entry)
        
        # 对每个组内的条目按 order 排序
        for pos in grouped:
            grouped[pos].sort(key=lambda x: x.order)
        return grouped

    def _build_story_string(self, character: CharacterCard, grouped: Dict) -> str:
        """组装故事字符串 (Story String)"""
        parts = []
        
        # Pos 0: wiBefore
        for entry in grouped.get(self.POS_WI_BEFORE, []):
            parts.append(entry.content)
            
        # 角色核心信息
        parts.append(f"[Character('{character.name}')]\n{character.description}\n")
        parts.append(f"Personality: {character.personality}\n")
        parts.append(f"Scenario: {character.scenario}\n")
        
        # Pos 1: wiAfter
        for entry in grouped.get(self.POS_WI_AFTER, []):
            parts.append(entry.content)
            
        # Pos 2: Examples Before
        for entry in grouped.get(self.POS_EXAMPLES_BEFORE, []):
            parts.append(entry.content)
            
        # 示例对话
        if character.mes_example:
            parts.append(f"<START>\n{character.mes_example}")
            
        # Pos 3: Examples After
        for entry in grouped.get(self.POS_EXAMPLES_AFTER, []):
            parts.append(entry.content)
            
        return "\n".join(parts)

    def _build_authors_note(self, grouped: Dict, depth: int) -> str:
        """组装作者笔记 (Author's Note)"""
        parts = []
        
        # Pos 4: AN Top
        for entry in grouped.get(self.POS_AN_TOP, []):
            parts.append(entry.content)
            
        # AN 核心内容 (这里简化为一个占位，实际应从角色卡或设置获取)
        parts.append(f"[Author's note at depth {depth}]")
        
        # Pos 5: AN Bottom
        for entry in grouped.get(self.POS_AN_BOTTOM, []):
            parts.append(entry.content)
            
        return "\n".join(parts)

    def _inject_depth_entries(self, history: List[ChatMessage], depth_entries: List[WorldInfoEntry]) -> List[Dict]:
        """
        在聊天历史的指定深度插入条目 (Pos 6)
        返回一个包含 role 和 content 的字典列表，方便后续转换
        """
        # 先将历史转换为中间格式
        msg_list = []
        for msg in history:
            msg_list.append({"role": "user" if msg.is_user else "assistant", "content": msg.mes})
        
        # 按 depth 分组插入
        # d0 通常指最新用户输入之前，即列表末尾
        for entry in depth_entries:
            depth = entry.depth if entry.depth is not None else 0
            # 计算插入索引 (从后往前数)
            insert_index = max(0, len(msg_list) - depth)
            
            # 确定角色
            role_map = {"system": "system", "user": "user", "assistant": "assistant"}
            role = role_map.get(str(entry.position).split('_')[-1] if '_' in str(entry.position) else "system", "system")
            
            msg_list.insert(insert_index, {"role": "system", "content": entry.content})
            
        return msg_list

    def _replace_outlets(self, text: str, outlet_map: Dict[str, str]) -> str:
        """执行 Outlet 宏替换 (Pos 7)"""
        def replacer(match):
            uid = match.group(1)
            return outlet_map.get(uid, "")
        
        # 匹配 {{outlet::UID}}
        return re.sub(r"\{\{outlet::([^}]+)\}\}", replacer, text)

    def _wrap_to_messages(
        self, 
        story_string: str, 
        an_content: str, 
        history: List[Dict], 
        user_input: str,
        outlet_map: Dict[str, str],
        config: PromptConfig
    ) -> List[BaseMessage]:
        """将组装好的文本块封装为 LangChain Messages"""
        messages = []
        
        # 1. System Message (Story String + Outlet 替换)
        final_story = self._replace_outlets(story_string, outlet_map)
        if final_story:
            messages.append(SystemMessage(content=final_story))
            
        # 2. Author's Note (根据配置位置插入)
        if an_content and config.an_position == "before_history":
            messages.append(SystemMessage(content=self._replace_outlets(an_content, outlet_map)))
            
        # 3. Chat History
        for msg_data in history:
            if msg_data["role"] == "user":
                messages.append(HumanMessage(content=msg_data["content"]))
            elif msg_data["role"] == "assistant":
                messages.append(AIMessage(content=msg_data["content"]))
            else:
                messages.append(SystemMessage(content=msg_data["content"]))
                
        # 4. Author's Note (如果在 History 之后)
        if an_content and config.an_position == "after_history":
            messages.append(SystemMessage(content=self._replace_outlets(an_content, outlet_map)))
            
        # 5. Post-History Instructions & User Input
        final_input = user_input
        if config.post_history_instructions:
            final_input = f"{config.post_history_instructions}\n\n{user_input}"
            
        messages.append(HumanMessage(content=final_input))
        
        return messages
