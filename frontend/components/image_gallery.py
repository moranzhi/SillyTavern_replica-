import streamlit as st


def render_image_gallery(backend_url):
    st.subheader("🖼️ 生成画廊")

    # 这里通常轮询后端获取最新生成的图片
    # GET /api/images/latest

    if not st.session_state.generated_images:
        st.info("暂无生成图片，对话中触发绘图后将在此显示。")
    else:
        cols = st.columns(2)
        for idx, img_url in enumerate(st.session_state.generated_images[-4:]):  # 只显示最近4张
            with cols[idx % 2]:
                st.image(img_url, use_container_width=True)
                st.caption(f"Image {idx + 1}")