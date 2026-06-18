import streamlit as st
from state import State
from workflow import Workflow
from langchain_core.messages import HumanMessage


st.title("Medicine Information Assistant")

if "messages" not in st.session_state:
    st.session_state.messages = []

if "workflow" not in st.session_state:
    st.session_state.workflow = Workflow()

if "uploader_key" not in st.session_state:
    st.session_state.uploader_key = 0

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.write(msg["content"])

uploaded_image = st.file_uploader(
    "Upload a photo of your medicine ",
    type=["jpg", "jpeg", "png", "jfif"],
    key=f"uploader_{st.session_state.uploader_key}"
)

query = st.chat_input("Enter your question here...")

if query or uploaded_image:
    display_text = query if query else "[Image uploaded]"
    st.session_state.messages.append({"role": "user", "content": display_text})

    with st.chat_message("user"):
        if uploaded_image:
            st.image(uploaded_image, width=200)
        if query:
            st.write(query)

    with st.chat_message("assistant"):
        with st.spinner("thinking..."):

            image_bytes = uploaded_image.read() if uploaded_image else None

            initial_state = State(
                query=query,
                image=image_bytes,
                messages=st.session_state.messages,
                content=None,
                rewritten_query=None,
                response=None
            )

            result = st.session_state.workflow.run(initial_state)
            response = result.get("response")
            st.write(response)

    st.session_state.messages.append({"role": "assistant", "content": response})

    if uploaded_image:
        st.session_state.uploader_key += 1
        st.rerun()