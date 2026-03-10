import streamlit as st
import os
from pathlib import Path
import time
import random

# --- 页面配置 ---
st.set_page_config(
    page_title="AI WorkFlow Engine",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- 自定义 CSS (蓝白清晰风格) ---
st.markdown("""
<style>
    /* 全局背景与字体 */
    .stApp {
        background-color: #F0F4F8; /* 浅蓝灰背景，护眼且清晰 */
        color: #1A1A1A; /* 深黑色字体 */
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    /* 隐藏默认菜单 */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;} /* 隐藏顶部默认栏，使用自定义工具栏 */

    /* 侧边栏样式 */
    section[data-testid="stSidebar"] {
        background-color: #FFFFFF;
        border-right: 1px solid #D1D9E6;
        color: #1A1A1A;
    }
    section[data-testid="stSidebar"] .stMarkdown, 
    section[data-testid="stSidebar"] .stNumberInput, 
    section[data-testid="stSidebar"] .stSlider {
        color: #1A1A1A;
    }

    /* 聊天容器背景 (白色卡片感) */
    .stChatMessage {
        background-color: #FFFFFF;
        border: 1px solid #E1E8F0;
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    /* 用户消息特殊样式 */
    .stChatMessage[data-testid="stChatMessage"]:has(.stMarkdown p) {
        /* 这里很难直接针对 user/assistant 做不同背景，通过 JS 或特定类名较难，
           Streamlit 原生 chat_message 会自动处理头像，我们主要靠边框和布局区分 */
    }

    /* 输入框样式 */
    .stTextInput > div > div > input, 
    .stTextArea > div > div > textarea {
        background-color: #FFFFFF;
        color: #1A1A1A;
        border: 1px solid #0056B3; /* 蓝色边框 */
        border-radius: 6px;
    }
    .stTextInput > div > div > input:focus, 
    .stTextArea > div > div > textarea:focus {
        border-color: #003D80;
        box-shadow: 0 0 0 2px rgba(0, 86, 179, 0.2);
    }

    /* 按钮样式 */
    .stButton > button {
        background-color: #FFFFFF;
        color: #0056B3;
        border: 1px solid #0056B3;
        border-radius: 6px;
        font-weight: 600;
    }
    .stButton > button:hover {
        background-color: #0056B3;
        color: #FFFFFF;
    }
    .stButton > button[kind="primary"] {
        background-color: #0056B3;
        color: #FFFFFF;
        border: 1px solid #0056B3;
    }
    .stButton > button[kind="primary"]:hover {
        background-color: #003D80;
        border-color: #003D80;
    }

    /* 拼接块列表样式优化 */
    .splice-item {
        background-color: #FFFFFF;
        border: 1px solid #D1D9E6;
        border-radius: 6px;
        padding: 8px;
        margin-bottom: 6px;
        display: flex;
        align-items: center;
    }
    .splice-name-active { color: #1A1A1A; font-weight: 500; }
    .splice-name-inactive { color: #8898AA; text-decoration: line-through; }

    /* 顶部工具栏 */
    .top-bar {
        background-color: #FFFFFF;
        padding: 10px 20px;
        border-bottom: 1px solid #D1D9E6;
        margin: -10px -10px 10px -10px; /* 抵消默认 padding */
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
</style>
""", unsafe_allow_html=True)

# --- 状态初始化 ---
if "messages" not in st.session_state:
    # 初始化一些示例数据，方便查看效果
    st.session_state.messages = [
        {"role": "assistant", "content": "你好！我是你的 AI 工作流助手。系统已就绪，请开始对话。"},
        {"role": "user", "content": "帮我生成一个角色卡，需要包含姓名、年龄和背景故事。"},
        {"role": "assistant",
         "content": "好的，这是一个示例角色卡：<br><b>姓名</b>: 艾莉娅<br><b>年龄</b>: 24<br><b>背景</b>: 一位来自北方边境的流浪法师。<br><i>(这是 HTML 渲染测试)</i>"}
    ]
if "render_html" not in st.session_state:
    st.session_state.render_html = True  # 默认开启 HTML 渲染以展示效果
if "image_folder" not in st.session_state:
    st.session_state.image_folder = "./assets/images"
if "splice_blocks" not in st.session_state:
    st.session_state.splice_blocks = [
        {"id": 1, "name": "[必看] 系统指令", "active": True, "type": "system"},
        {"id": 2, "name": "A.U.T.O. 预设设置", "active": True, "type": "system"},
        {"id": 3, "name": "世界书：人物关系", "active": False, "type": "world"},
        {"id": 4, "name": "Chat History (自动)", "active": True, "type": "history", "editable": False},
    ]

# --- 顶部工具栏 ---
c_top1, c_top2, c_top3 = st.columns([1, 6, 1])
with c_top1:
    if st.button("📂 打开", key="btn_open"):
        st.toast("打开会话功能预留")
    if st.button("💾 保存", key="btn_save"):
        st.toast("会话已保存")
with c_top2:
    st.markdown("<h3 style='margin:0; color:#0056B3;'>AI WorkFlow Engine</h3>", unsafe_allow_html=True)
with c_top3:
    if st.button("⚙️ 设置", key="btn_settings"):
        st.toast("全局设置预留")

st.divider()

# --- 三栏布局 ---
col_left, col_mid, col_right = st.columns([1, 3, 1], gap="small")

# =======================
# 1. 左侧：预设与拼接管理 (蓝白风格适配)
# =======================
with col_left:
    st.markdown("#### 📜 全局预设")
    c_pre1, c_pre2 = st.columns([4, 1])
    with c_pre1:
        preset_options = ["Default", "A.U.T.O. v1.47", "Roleplay Pro"]
        st.selectbox("选择预设", preset_options, label_visibility="collapsed")
    with c_pre2:
        if st.button("📥", key="btn_import", help="导入预设"):
            st.toast("导入功能预留")

    st.markdown("#### ⚙️ 生成参数")
    c_p1, c_p2 = st.columns(2)
    with c_p1:
        st.slider("温度", 0.0, 2.0, 1.0, key="slider_temp")
        st.slider("Top P", 0.0, 1.0, 0.9, key="slider_top_p")
    with c_p2:
        st.slider("频率惩罚", 0.0, 2.0, 1.0, key="slider_freq")
        st.slider("存在惩罚", 0.0, 2.0, 0.0, key="slider_pres")

    c_l1, c_l2 = st.columns(2)
    with c_l1:
        st.number_input("上下文长度", value=30000, key="input_ctx")
    with c_l2:
        st.number_input("最大回复", value=500, key="input_max")

    st.checkbox("✅ 流式传输", value=True, key="chk_stream")

    st.markdown("#### 🧩 内容拼接块")
    st.caption("控制发送至后端的上下文组成")

    # 渲染拼接块列表
    for block in st.session_state.splice_blocks:
        with st.container():
            # 自定义行布局模拟列表项
            cols = st.columns([0.5, 3, 0.5, 0.5])
            with cols[0]:
                icon = "🌍" if block['type'] == 'world' else ("💬" if block['type'] == 'history' else "📄")
                st.write(icon)
            with cols[1]:
                name_class = "splice-name-active" if block['active'] else "splice-name-inactive"
                st.markdown(f"<div class='{name_class}' style='font-size:0.85em;'>{block['name']}</div>",
                            unsafe_allow_html=True)
            with cols[2]:
                disabled = not block.get('editable', True)
                if st.button("✏️", key=f"edit_{block['id']}", disabled=disabled):
                    st.toast(f"编辑：{block['name']}")
            with cols[3]:
                is_active = st.checkbox("✓", value=block['active'], key=f"act_{block['id']}",
                                        label_visibility="collapsed")
                if is_active != block['active']:
                    block['active'] = is_active
                    st.rerun()
            st.markdown("<div style='height:1px; background:#E1E8F0; margin:4px 0;'></div>", unsafe_allow_html=True)

    if st.button("+ 添加拼接块", use_container_width=True):
        st.toast("添加新功能预留")

# =======================
# 2. 中间：流式对话区 (动态读取历史)
# =======================
with col_mid:
    # 顶部控制条
    c_ctrl1, c_ctrl2 = st.columns([4, 1])
    with c_ctrl1:
        st.caption("当前会话：Active_Session_01")
    with c_ctrl2:
        # HTML 渲染切换
        toggle_html = st.toggle("HTML 渲染", value=st.session_state.render_html, key="html_toggle")
        if toggle_html != st.session_state.render_html:
            st.session_state.render_html = toggle_html
            st.rerun()

    # --- 核心：动态渲染历史记录 ---
    # 使用 st.container 包裹，确保每次 rerun 都能完整重绘
    chat_container = st.container()

    with chat_container:
        # 遍历 session_state 中的消息历史
        for i, msg in enumerate(st.session_state.messages):
            with st.chat_message(msg["role"]):
                content = msg["content"]

                # 根据开关决定是否解析 HTML
                if st.session_state.render_html and msg["role"] == "assistant":
                    # 允许 HTML 标签
                    st.markdown(content, unsafe_allow_html=True)
                else:
                    # 纯文本/Markdown 模式
                    st.markdown(content)

                # 可选：在每条消息下添加操作按钮 (编辑/复制/重试) - 预留
                # with st.expander("...", expanded=False): ...

    # --- 输入区域 ---
    st.markdown("---")

    # 聊天输入框
    user_input = st.chat_input("输入消息... (支持 /命令)")

    if user_input:
        # 1. 将用户输入加入历史
        st.session_state.messages.append({"role": "user", "content": user_input})

        # 2. 触发重新渲染，此时上方循环会立即显示用户消息
        # 注意：Streamlit 是同步执行的，要模拟“流式”通常需要后端配合 yield
        # 这里为了演示前端动态读取，我们先显示用户消息，然后模拟一个后台任务

        # 占位符用于显示正在生成的状态或流式内容
        with st.chat_message("assistant"):
            message_placeholder = st.empty()
            message_placeholder.markdown("*思考中...*")

            # === 模拟后端流式响应 (实际项目中此处替换为 requests.post(stream=True)) ===
            full_response = ""
            # 构造一个包含 HTML 的回复用于测试
            simulated_text = f"收到您的指令：**{user_input}**。\n\n这是一个测试回复，如果您开启了 **HTML 渲染**，下方将显示彩色文本和表格：<br><span style='color:#0056B3; font-weight:bold;'>蓝色高亮文本</span><br><table border='1' style='border-collapse:collapse; width:100%;'><tr><th>属性</th><th>值</th></tr><tr><td>状态</td><td>正常</td></tr></table>"

            # 简单的逐字模拟 (实际应来自后端 chunk)
            chunks = simulated_text.split(" ")
            for chunk in chunks:
                full_response += chunk + " "
                time.sleep(0.1)  # 模拟网络延迟

                if st.session_state.render_html:
                    message_placeholder.markdown(full_response, unsafe_allow_html=True)
                else:
                    message_placeholder.markdown(full_response)

            # 3. 将完整的助手回复存入历史
            st.session_state.messages.append({"role": "assistant", "content": full_response})

        # 强制刷新以确保持久化显示
        st.rerun()

# =======================
# 3. 右侧：图片与骰子 (蓝白风格)
# =======================
with col_right:
    st.markdown("#### 🖼️ 本地图库")
    img_path = Path(st.session_state.image_folder)
    img_path.mkdir(parents=True, exist_ok=True)

    try:
        images = [f for f in os.listdir(img_path) if f.endswith(('.png', '.jpg', '.jpeg', '.webp'))]
        if images:
            cols = st.columns(2)
            for idx, img_name in enumerate(images[:8]):
                with cols[idx % 2]:
                    # 增加白色背景和边框，使图片在浅灰底上更突出
                    st.markdown(
                        f"<div style='background:white; padding:5px; border-radius:4px; border:1px solid #ddd;'>",
                        unsafe_allow_html=True)
                    st.image(str(img_path / img_name), use_container_width=True)
                    st.caption(img_name)
                    st.markdown("</div>", unsafe_allow_html=True)
        else:
            st.info("图片文件夹为空")
    except Exception as e:
        st.error(f"读取错误：{e}")

    st.divider()

    st.markdown("#### 🎲 检定工具")
    tab_table, tab_dice = st.tabs(["📊 表格", "🎲 骰子"])

    with tab_table:
        st.markdown("**动态数据表**")
        st.dataframe(
            {"属性": ["力量", "敏捷", "智力"], "数值": [50, 60, 70]},
            hide_index=True,
            use_container_width=True
        )

    with tab_dice:
        roll_type = st.radio("类型", ["难度检定", "对抗骰"], horizontal=True)
        diff_opts = ["极难 (95)", "困难 (75)", "普通 (50)"]
        selected_diff = st.selectbox("难度", diff_opts)

        c_r1, c_r2 = st.columns(2)
        with c_r1:
            if st.button("🎲 投掷", type="primary", use_container_width=True):
                res = random.randint(1, 100)
                color = "#d9534f" if res > int(selected_diff.split('(')[1].strip(')')) else "#5cb85c"
                st.markdown(
                    f"<div style='text-align:center; font-size:1.5em; color:{color}; font-weight:bold;'>{res}</div>",
                    unsafe_allow_html=True)
        with c_r2:
            st.caption(f"目标：{selected_diff.split('(')[1].strip(')')}")