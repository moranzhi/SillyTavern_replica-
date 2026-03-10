import streamlit as st


def render_toolbar(backend_url):
    col1, col2, col3 = st.columns([1, 2, 1])

    with col1:
        st.logo("https://streamlit.io/images/brand/streamlit-logo-primary-colormark-darktext.png",
                size="large")  # 可替换为项目Logo

    with col2:
        st.title("AI Tavern 工作流引擎")

    with col3:
        if st.button("🔄 重置会话", use_container_width=True):
            st.session_state.messages = []
            st.rerun()
        # 这里可以添加更多工具栏按钮，如：知识库管理、系统状态等