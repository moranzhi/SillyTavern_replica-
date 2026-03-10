import streamlit as st
import requests


def render_settings_panel(backend_url):
    st.subheader("⚙️ 预设设置")

    # 模拟获取预设列表 (实际应调用后端 API)
    # GET /api/presets
    try:
        # response = requests.get(f"{backend_url}/api/presets")
        # presets = response.json()
        presets = ["角色扮演-奇幻", "项目管理", "旅行规划", "自定义"]  # 占位数据
    except:
        presets = ["默认预设"]

    selected_preset = st.selectbox("选择预设模板", presets, index=0)

    st.text_area("系统指令 (System)", height=100, placeholder="在此输入系统级指令...")

    st.checkbox("启用状态记忆", value=True)
    st.checkbox("启用异步生图", value=True)
    st.checkbox("启用输入预处理", value=False)

    st.info("💡 修改配置后自动生效，无需重启。")

    # 保存按钮 (调用后端更新配置)
    if st.button("💾 保存配置", use_container_width=True):
        st.success("配置已保存！")
        # requests.post(f"{backend_url}/api/config", json={...})