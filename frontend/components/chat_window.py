import streamlit as st
import requests


def render_chat_window(backend_url):
    st.subheader("💬 流式对话")

    # 聊天历史显示
    chat_container = st.container()
    with chat_container:
        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])
                # 如果有关联图片，也可以在这里显示
                if "images" in message:
                    for img_url in message["images"]:
                        st.image(img_url, width=200)

    # 输入框
    if prompt := st.chat_input("输入消息..."):
        # 1. 显示用户消息
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        # 2. 调用后端流式接口
        with st.chat_message("assistant"):
            message_placeholder = st.empty()
            full_response = ""

            # 模拟流式接收 (实际需使用 requests stream 或 websocket)
            # POST /api/role/stream
            try:
                # 伪代码示例：
                # with requests.post(f"{backend_url}/api/chat/stream", json={"message": prompt}, stream=True) as r:
                #     for chunk in r.iter_content(chunk_size=None):
                #         if chunk:
                #             full_response += chunk.decode('utf-8')
                #             message_placeholder.markdown(full_response + "▌")

                # 演示用静态延迟
                import time
                response_text = "这是一个流式响应的演示。后端正在处理您的请求..."
                for char in response_text:
                    full_response += char
                    message_placeholder.markdown(full_response + "▌")
                    time.sleep(0.05)

                message_placeholder.markdown(full_response)
                st.session_state.messages.append({"role": "assistant", "content": full_response})

            except Exception as e:
                st.error(f"连接后端失败: {e}")