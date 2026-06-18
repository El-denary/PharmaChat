from langchain_groq import ChatGroq
from langchain_huggingface.embeddings import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from state import State 
from langchain_core.messages import HumanMessage, SystemMessage

import json
import base64
from langchain_google_genai import ChatGoogleGenerativeAI

from prompt import *
from dotenv import load_dotenv
load_dotenv()

llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.6)

vision_llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=0.0)


embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vdb = Chroma(
   embedding_function=embeddings,
   persist_directory="./chroma_db"
    
)

def retriever_agent(state: State) -> str:
    rewritten_query = state.get("rewritten_query")

    retriever = vdb.as_retriever(search_kwargs={"k": 3})
    results = retriever.invoke(rewritten_query)

    content = "\n\n".join([doc.page_content for doc in results])

    return {
        "content": content
    }

def rewritten_query_agent(state: State) -> str:
    user_input = state.get("query")
    chat_history = state.get("messages")

    messages = [
        SystemMessage(content=REWRITE_PROMPT),
        
        HumanMessage(content=query_rewrite_extend(user_input, chat_history))
    ]

    try:
      response = llm.invoke(messages)
      rewritten_query = response.content
      return {
          "rewritten_query": rewritten_query
      }
    except Exception as e:
      print(f"Error in rewritten_query: {e}")
      return None
    

def response_agent(state: State) -> str:
    rewritten_query = state.get("rewritten_query")
    chat_history = state.get("messages")
    content = state.get("content")

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
      
        HumanMessage(content=system_prompt_extend(rewritten_query, chat_history, content))
    ]

    try:
      response = llm.invoke(messages)
      answer = response.content

      return {
          "response": answer }
    except Exception as e:
      print(f"Error in response_agent: {e}")
      return None


def check_input_type(state: State) -> str:
    if state.get("image"):
        return "image"
    return "text"
  
def vision_agent(state: State) -> str:
    image_bytes = state.get("image")
    user_query = state.get("query")

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    message = HumanMessage(
        content=[
            {"type": "text", "text": VISION_PROMPT},
            {"type": "image_url", "image_url": f"data:image/jpeg;base64,{image_b64}"}
        ]
    )

    try:
        response = vision_llm.invoke([message])
        raw_text = response.content.strip()

        if raw_text.startswith("```"):
            raw_text = raw_text.strip("`").replace("json", "", 1).strip()

        parsed = json.loads(raw_text)
        medicine_name = parsed.get("medicine_name")

        if not medicine_name:
            return {"rewritten_query": None, "content": "NOT_FOUND"}

        if user_query and user_query.strip():
            rewritten_query = f"{user_query.strip()} for {medicine_name}"
        else:
            rewritten_query = f"Tell me about {medicine_name}"

        return {"rewritten_query": rewritten_query}

    except Exception as e:
        print(f"Error in vision_agent: {e}")
        return {"rewritten_query": None, "content": "NOT_FOUND"}
    


def generate_title(first_message: str) -> str:
    messages = [
        SystemMessage(content=TITLE_PROMPT),
        HumanMessage(content=first_message)
    ]
    try:
        response = llm.invoke(messages)
        return response.content.strip()[:100]
    except Exception as e:
        print(f"Error in generate_title: {e}")
        return "Medical Consultation"