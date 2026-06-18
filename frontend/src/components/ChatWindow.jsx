import { useEffect, useRef } from "react"
import { Bot, User } from "lucide-react"

export default function ChatWindow({ messages, loading }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  })

  return (
    <div style={{
      flex: 1,
      overflowY: "auto",
      padding: "24px 28px",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      background: "#f8fafc",
    }}>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <span style={{
          fontSize: "12px",
          color: "#64748b",
          background: "#e2e8f0",
          padding: "4px 14px",
          borderRadius: "20px",
        }}>
          Today, {today}
        </span>
      </div>

      {messages.map((msg, i) => (
        <div key={i} style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "10px",
          flexDirection: msg.role === "user" ? "row-reverse" : "row",
        }}>
          

          <div style={{
            maxWidth: "62%",
            padding: "12px 16px",
            borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            background: msg.role === "user" ? "#1B4332" : "#ffffff",
            color: msg.role === "user" ? "#ffffff" : "#0f172a",
            fontSize: "14px",
            lineHeight: "1.65",
            border: msg.role === "bot" ? "1px solid #e2e8f0" : "none",
          }}>
            {msg.imageUrl && (
              <img
                src={msg.imageUrl}
                alt="uploaded medicine"
                style={{
                  maxWidth: "100%",
                  borderRadius: "10px",
                  marginBottom: msg.text ? "8px" : 0,
                  display: "block",
                }}
              />
            )}
            {msg.text && <span>{msg.text}</span>}
          </div>
        </div>
      ))}

      {loading && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: "#16a34a", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Bot size={15} color="#fff" />
          </div>
          <div style={{
            padding: "12px 16px",
            borderRadius: "16px 16px 16px 4px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            display: "flex",
            gap: "4px",
            alignItems: "center",
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: "#94a3b8",
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>

      <div ref={bottomRef} />
    </div>
  )
} 