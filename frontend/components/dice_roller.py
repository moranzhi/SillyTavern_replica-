import streamlit as st
import random


def render_dice_roller():
    st.subheader("🎲 命运骰子")

    col1, col2 = st.columns(2)

    with col1:
        d20 = st.button("D20", use_container_width=True)
        if d20:
            roll = random.randint(1, 20)
            st.metric("结果", roll, delta=None)

    with col2:
        d6 = st.button("D6", use_container_width=True)
        if d6:
            roll = random.randint(1, 6)
            st.metric("结果", roll, delta=None)

    # 自定义骰子
    sides = st.number_input("面数", min_value=2, max_value=100, value=10)
    if st.button(f"投掷 D{sides}", use_container_width=True):
        roll = random.randint(1, sides)
        st.success(f"🎲 结果是: **{roll}**")