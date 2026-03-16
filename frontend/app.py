import requests
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
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
print(f"DEBUG BACKEND_URL: {BACKEND_URL}", flush=True)  # 看 docker logs

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

    /* 可折叠工具栏 */
    .collapsible-toolbar {
        background-color: #FFFFFF;
        border-bottom: 1px solid #D1D9E6;
        padding: 10px;
        margin-bottom: 10px;
    }

    /* 隐藏工具栏时的样式 */
    .toolbar-hidden {
        display: none;
    }

    /* 工具栏切换按钮 */
    .toolbar-toggle {
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 999;
        background-color: #FFFFFF;
        border: 1px solid #D1D9E6;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    /* 三栏布局 - 修改部分 */
    .main-container {
        display: flex;
        flex-direction: column;
        height: calc(100vh - 60px);
    }

    .three-column-layout {
        display: flex;
        flex-direction: row;
        height: 100%;
        overflow: hidden;
    }

    .left-column, .middle-column, .right-column {
        padding: 10px;
        overflow-y: auto;
        height: 100%;
    }

    .left-column {
        flex: 1;
        border-right: 1px solid #D1D9E6;
    }

    .middle-column {
        flex: 3;
        border-right: 1px solid #D1D9E6;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .right-column {
        flex: 1;
    }

    /* 中间列的聊天区域 */
    .chat-area {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        height: calc(100% - 80px); /* 减去输入区域的高度 */
    }

    /* 中间列的输入区域 */
    .input-area {
        flex: 0 0 auto;
        padding: 10px;
        border-top: 1px solid #D1D9E6;
        background-color: #F0F4F8;
        height: 80px; /* 固定高度 */
    }

    /* 隐藏Streamlit默认的滚动条样式 */
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    ::-webkit-scrollbar-track {
        background: #f1f1f1;
    }
    ::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: #555;
    }
</style>

<script>
    // 动态调整布局高度
    function adjustLayout() {
        // 获取三个列容器
        const leftColumn = document.querySelector('.left-column');
        const middleColumn = document.querySelector('.middle-column');
        const rightColumn = document.querySelector('.right-column');

        // 设置高度为视口高度减去顶部工具栏高度
        const height = window.innerHeight - 60; // 减去顶部工具栏的高度

        if (leftColumn) leftColumn.style.height = `${height}px`;
        if (middleColumn) middleColumn.style.height = `${height}px`;
        if (rightColumn) rightColumn.style.height = `${height}px`;

        // 调整聊天区域高度
        const chatArea = document.querySelector('.chat-area');
        if (chatArea) {
            const inputArea = document.querySelector('.input-area');
            const inputHeight = inputArea ? inputArea.offsetHeight : 80;
            chatArea.style.height = `${height - inputHeight}px`;
        }
    }

    // 页面加载时调整布局
    window.addEventListener('load', adjustLayout);

    // 窗口大小改变时重新调整布局
    window.addEventListener('resize', adjustLayout);

    // 每次Streamlit重新渲染后调整布局
    document.addEventListener('newElementRendered', adjustLayout);
</script>
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
if "toolbar_visible" not in st.session_state:
    st.session_state.toolbar_visible = True

# --- 顶部工具栏 ---
# 工具栏切换按钮
st.markdown("""
<div class="toolbar-toggle" onclick="toggleToolbar()">
    <span id="toolbar-icon">▼</span>
</div>
<script>
    function toggleToolbar() {
        var toolbar = document.querySelector('.collapsible-toolbar');
        var icon = document.getElementById('toolbar-icon');
        if (toolbar.style.display === 'none') {
            toolbar.style.display = 'block';
            icon.textContent = '▼';
        } else {
            toolbar.style.display = 'none';
            icon.textContent = '▲';
        }
    }
</script>
""", unsafe_allow_html=True)

# 工具栏内容
if st.session_state.toolbar_visible:
    with st.container():
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
    # 使用自定义容器类
    st.markdown('<div class="left-column">', unsafe_allow_html=True)

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

    st.markdown('</div>', unsafe_allow_html=True)

# =======================
# 2. 中间：流式对话区 (动态读取历史)
# =======================
with col_mid:
    # 使用自定义容器类
    st.markdown('<div class="middle-column">', unsafe_allow_html=True)

    # --- 控制区域 ---
    c_ctrl1, c_ctrl2, c_ctrl3 = st.columns([3, 2, 1])

    with c_ctrl1:
        # --- 数据集选择下拉框 ---
        try:
            response = requests.get(f"{BACKEND_URL}/get_all_role_and_chat")
            if response.status_code == 200:
                datasets = response.json()
                dataset_options = list(datasets.keys())
            else:
                st.error(f"获取数据集失败: {response.status_code}")
                dataset_options = []
        except requests.exceptions.RequestException as e:
            st.error(f"请求数据集时出错: {e}")
            dataset_options = []

        selected_dataset = st.selectbox(
            "选择数据集",
            dataset_options,
            index=0 if dataset_options else None,
            key="dataset_selector"
        )

    with c_ctrl2:
        # --- 文件路径选择下拉框 ---
        # 初始化两层下拉框的数据结构
        chat_history_options = {}
        file_options = []

        if selected_dataset:
            # 使用已经获取的数据集数据
            chat_history_options = datasets
            # 获取当前选中数据集对应的文件列表
            file_options = chat_history_options.get(selected_dataset, [])

        # 第一层下拉框：选择聊天会话（这里应该直接使用selected_dataset）
        # 不需要再创建一个selectbox，因为已经选择了数据集
        selected_chat_session = selected_dataset

        # 第二层下拉框：选择文件路径（value列表）
        if selected_chat_session:
            file_options = chat_history_options.get(selected_chat_session, [])
            if file_options:
                # 提取文件名并去除.jsonl后缀，用于显示
                display_names = [os.path.basename(f).replace('.jsonl', '') for f in file_options]

                # 创建文件名到完整路径的映射
                file_name_to_path = {os.path.basename(f).replace('.jsonl', ''): f for f in file_options}

                selected_file_display = st.selectbox(
                    "选择聊天",
                    display_names,
                    index=0 if display_names else None,
                    key="file_selector"
                )

                if selected_file_display:
                    # 保存完整路径到session_state
                    st.session_state.selected_file_path = file_name_to_path[selected_file_display]
            else:
                # 如果没有文件路径，清空选择
                if "file_selector" in st.session_state:
                    del st.session_state["file_selector"]
        else:
            # 如果没有选择会话，清空选择
            if "file_selector" in st.session_state:
                del st.session_state["file_selector"]

    with c_ctrl3:
        # HTML 渲染切换
        toggle_html = st.toggle("HTML 渲染", value=st.session_state.render_html, key="html_toggle")
        if toggle_html != st.session_state.render_html:
            st.session_state.render_html = toggle_html
            st.rerun()

        # 显示当前会话信息
        if selected_dataset and 'selected_file_path' in st.session_state:
            file_name = os.path.basename(st.session_state.selected_file_path).replace('.jsonl', '')
            st.caption(f"当前会话：{selected_dataset} - {file_name}")
        else:
            st.caption("当前会话：Active_Session_01")

    # --- 核心：动态渲染历史记录 ---
    # 使用自定义容器类包裹聊天区域
    st.markdown('<div class="chat-area">', unsafe_allow_html=True)

    # 如果选择了聊天记录，则显示该记录
    if hasattr(st.session_state, 'selected_chat_data') and st.session_state.selected_chat_data:
        # 显示选中的聊天记录
        msg = st.session_state.selected_chat_data
        with st.chat_message(msg["role"]):
            content = msg["content"]

            # 根据开关决定是否解析 HTML
            if st.session_state.render_html and msg["role"] == "assistant":
                st.markdown(content, unsafe_allow_html=True)
            else:
                st.markdown(content)

            # 显示其他信息
            with st.expander("详细信息", expanded=False):
                st.json(msg)
    else:
        # 否则显示session_state中的消息历史
        for i, msg in enumerate(st.session_state.messages):
            with st.chat_message(msg["role"]):
                content = msg["content"]

                if st.session_state.render_html and msg["role"] == "assistant":
                    st.markdown(content, unsafe_allow_html=True)
                else:
                    st.markdown(content)

    st.markdown('</div>', unsafe_allow_html=True)

    # --- 输入区域 ---
    # 使用自定义容器类包裹输入区域
    st.markdown('<div class="input-area">', unsafe_allow_html=True)

    # 聊天输入框
    user_input = st.chat_input("输入消息... (支持 /命令)")

    if user_input:
        # 1. 将用户输入加入历史
        st.session_state.messages.append({"role": "user", "content": user_input})

        # 2. 触发重新渲染
        with st.chat_message("assistant"):
            message_placeholder = st.empty()
            message_placeholder.markdown("*思考中...*")

            # === 模拟后端流式响应 ===
            full_response = ""
            simulated_text = f"收到您的指令：**{user_input}**。\n\n这是一个测试回复，如果您开启了 **HTML 渲染**，下方将显示彩色文本和表格：<br><span style='color:#0056B3; font-weight:bold;'>蓝色高亮文本</span><br><table border='1' style='border-collapse:collapse; width:100%;'><tr><th>属性</th><th>值</th></tr><tr><td>状态</td><td>正常</td></tr></table>"

            chunks = simulated_text.split(" ")
            for chunk in chunks:
                full_response += chunk + " "
                time.sleep(0.1)

                if st.session_state.render_html:
                    message_placeholder.markdown(full_response, unsafe_allow_html=True)
                else:
                    message_placeholder.markdown(full_response)

            # 3. 将完整的助手回复存入历史
            st.session_state.messages.append({"role": "assistant", "content": full_response})

        # 强制刷新以确保持久化显示
        st.rerun()

    st.markdown('</div>', unsafe_allow_html=True)

    st.markdown('</div>', unsafe_allow_html=True)

# =======================
# 3. 右侧：图片与骰子 (蓝白风格)
# =======================
with col_right:
    # 使用自定义容器类
    st.markdown('<div class="right-column">', unsafe_allow_html=True)

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

    st.markdown('</div>', unsafe_allow_html=True)
