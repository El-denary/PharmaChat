import { useState, useEffect, useRef } from "react"
import Sidebar from "./components/Sidebar"
import ChatWindow from "./components/ChatWindow"
import InputBar from "./components/InputBar"
import { sendMessage, createConversation, getMessages, deleteConversation } from "./api"

const WELCOME_MESSAGE = {
  role: "bot",
  text: "Hello! I'm your medicine assistant. How can I help you today?",
}

export default function App() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const conversationIdRef = useRef(null)
  const sidebarRef = useRef(null)
  const isFirstMessageRef = useRef(true)

  useEffect(() => {
    initConversation()
  }, [])

  const initConversation = async () => {
    try {
      const id = await createConversation()
      setConversationId(id)
      conversationIdRef.current = id
      isFirstMessageRef.current = true
    } catch (e) {
      console.error("Failed to create conversation", e)
    }
  }

  const handleNewConversation = async (id) => {
    const newId = id || await createConversation()
    setConversationId(newId)
    conversationIdRef.current = newId
    isFirstMessageRef.current = true
    setMessages([WELCOME_MESSAGE])
  }

  const handleSelectConversation = async (id) => {
    setConversationId(id)
    conversationIdRef.current = id
    isFirstMessageRef.current = false
    try {
      const data = await getMessages(id)
      const formatted = data.map(msg => ({
        role: msg.role,
        text: msg.text,
        imageUrl: msg.image_path || null,
      }))
      setMessages([WELCOME_MESSAGE, ...formatted])
    } catch (e) {
      console.error("Failed to load messages", e)
    }
  }

  const handleDeleteConversation = async (id) => {
    try {
      await deleteConversation(id)
      if (id === conversationId) {
        await initConversation()
        setMessages([WELCOME_MESSAGE])
      }
    } catch (e) {
      console.error("Failed to delete conversation", e)
    }
  }

  const handleSend = async (text, image) => {
    const currentId = conversationIdRef.current
    if (!currentId) return

    const imageUrl = image ? URL.createObjectURL(image) : null
    setMessages(prev => [...prev, { role: "user", text: text || "", imageUrl }])
    setLoading(true)

    // Optimistic title: first 5 words instantly
    if (isFirstMessageRef.current && text && text.trim()) {
      const optimisticTitle = text.trim().split(" ").slice(0, 5).join(" ")
      sidebarRef.current?.updateTitle(currentId, optimisticTitle)
    }

    try {
      const response = await sendMessage(text, image, currentId)
      setMessages(prev => [...prev, { role: "bot", text: response }])

      // After response, refresh sidebar to replace with real AI title
      if (isFirstMessageRef.current) {
        sidebarRef.current?.refresh()
        isFirstMessageRef.current = false
      }
    } catch (error) {
      console.error("Send error:", error)
      setMessages(prev => [...prev, {
        role: "bot",
        text: "Sorry, I couldn't connect to the server. Make sure the backend is running.",
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", overflow: "hidden" }}>
      <Sidebar
        ref={sidebarRef}
        activeConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", overflow: "hidden" }}>
        <ChatWindow messages={messages} loading={loading} />
        <InputBar onSend={handleSend} loading={loading} />
      </div>
    </div>
  )
}