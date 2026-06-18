import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react"
import { MessageSquare, Plus, LayoutDashboard, FolderOpen, LogOut, Trash2 } from "lucide-react"
import { getConversations, createConversation } from "../api"

const topNav = [
  { icon: LayoutDashboard, label: "Dashboard", active: false },
  { icon: MessageSquare, label: "Chat", active: true },
  { icon: FolderOpen, label: "schedule", active: false },
]

const bottomNav = [
  { icon: LogOut, label: "Logout" },
]

const Sidebar = forwardRef(function Sidebar(
  { activeConversationId, onSelectConversation, onNewConversation, onDeleteConversation },
  ref
) {
  const [conversations, setConversations] = useState([])
  const [contextMenu, setContextMenu] = useState(null)
  const contextMenuRef = useRef(null)

  // Expose refresh() and updateTitle() to parent via ref
  useImperativeHandle(ref, () => ({
    refresh: loadConversations,
    updateTitle: (id, title) => {
      setConversations(prev =>
        prev.map(c => c.id === id ? { ...c, title } : c)
      )
    }
  }))

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    loadConversations()
  }, [activeConversationId])

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  const loadConversations = async () => {
    try {
      const data = await getConversations()
      setConversations(data)
    } catch (e) {
      console.error("Failed to load conversations", e)
    }
  }

  const handleNew = async () => {
    const id = await createConversation()
    await loadConversations()
    onNewConversation(id)
  }

  const handleRightClick = (e, convId) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, convId })
  }

  const handleDelete = async () => {
    if (!contextMenu) return
    await onDeleteConversation(contextMenu.convId)
    await loadConversations()
    setContextMenu(null)
  }

  return (
    <div style={{
      width: "220px", height: "100%", background: "#fff",
      borderRight: "1px solid #e2e8f0", display: "flex",
      flexDirection: "column", padding: "24px 14px", flexShrink: 0,
    }}>
      <div style={{ marginBottom: "24px", paddingLeft: "4px" }}>
        <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>MedAssist AI</div>
        <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "0.06em", marginTop: "2px" }}>ASSISTANT PORTAL</div>
      </div>

      <button onClick={handleNew} style={{
        width: "80%", padding: "10px", borderRadius: "20px",
        background: "#16a34a", color: "#fff", border: "none",
        fontSize: "13px", fontWeight: "500", cursor: "pointer",
        marginBottom: "30px", display: "flex", alignItems: "center",
        justifyContent: "center", gap: "6px",
      }}>
        <Plus size={14} />
        New Chat
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {topNav.map(({ icon: Icon, label, active }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "9px 12px", borderRadius: "10px", cursor: "pointer",
            background: active ? "#f0fdf4" : "transparent",
            color: active ? "#16a34a" : "#64748b",
            fontSize: "13px", fontWeight: active ? "500" : "400",
          }}>
            <Icon size={16} />
            {label}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "24px", flex: 1, overflowY: "auto" }}>
        <div style={{
          fontSize: "10px", fontWeight: "600", color: "#94a3b8",
          letterSpacing: "0.08em", marginBottom: "8px", paddingLeft: "4px"
        }}>
          RECENT CHATS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              onContextMenu={(e) => handleRightClick(e, conv.id)}
              style={{
                padding: "8px 12px", borderRadius: "8px", cursor: "pointer",
                background: activeConversationId === conv.id ? "#f0fdf4" : "transparent",
                color: activeConversationId === conv.id ? "#16a34a" : "#64748b",
                fontSize: "12px",
                fontWeight: activeConversationId === conv.id ? "500" : "400",
                borderLeft: activeConversationId === conv.id ? "2px solid #16a34a" : "2px solid transparent",
                display: "flex", alignItems: "center", gap: "8px", userSelect: "none",
              }}>
              <MessageSquare size={13} style={{ flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {conv.title || `Consultation #${conv.id}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
        {bottomNav.map(({ icon: Icon, label }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "9px 12px", borderRadius: "10px", cursor: "pointer",
            color: "#64748b", fontSize: "13px",
          }}>
            <Icon size={16} />
            {label}
          </div>
        ))}
      </div>

      {contextMenu && (
        <div ref={contextMenuRef} style={{
          position: "fixed", top: contextMenu.y, left: contextMenu.x,
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 1000,
          overflow: "hidden", minWidth: "150px",
        }}>
          <div
            onClick={handleDelete}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 14px", cursor: "pointer", color: "#ef4444",
              fontSize: "13px", fontWeight: "500",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <Trash2 size={14} />
            Delete Conversation
          </div>
        </div>
      )}
    </div>
  )
})

export default Sidebar