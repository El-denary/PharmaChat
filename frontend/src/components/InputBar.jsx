import { useState, useRef } from "react"
import { Paperclip, Mic, Send, X } from "lucide-react"

export default function InputBar({ onSend, loading }) {
  const [text, setText] = useState("")
  const [image, setImage] = useState(null)
  const fileRef = useRef(null)

  const handleSend = () => {
    if (!text.trim() && !image) return
    if (loading) return
    onSend(text.trim(), image)
    setText("")
    setImage(null)
  }

  return (
    <div style={{
      padding: "14px 24px 20px",
      background: "#fff",
      borderTop: "1px solid #e2e8f0",
      flexShrink: 0,
    }}>
      {image && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "10px",
          padding: "7px 12px",
          background: "#f0fdf4",
          borderRadius: "8px",
          fontSize: "12px",
          color: "#16a34a",
          border: "1px solid #bbf7d0",
        }}>
          <Paperclip size={13} />
          {image.name}
          <X size={13} onClick={() => setImage(null)}
            style={{ marginLeft: "auto", cursor: "pointer", color: "#94a3b8" }} />
        </div>
      )}

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "#fff",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        padding: "8px 8px 8px 16px",
      }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Type a clinical note or question…"
          disabled={loading}
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            fontSize: "14px",
            outline: "none",
            color: "#0f172a",
          }}
        />

        <input ref={fileRef} type="file" accept="image/*"
          style={{ display: "none" }}
          onChange={e => setImage(e.target.files[0] || null)} />

        <button onClick={() => fileRef.current.click()}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: "6px" }}>
          <Paperclip size={18} />
        </button>

        
      

        <button onClick={handleSend} disabled={loading} style={{
          width: "38px", height: "38px", borderRadius: "10px",
          background: loading ? "#94a3b8" : "#16a34a",
          border: "none", cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Send size={16} color="#fff" />
        </button>
      </div>
    </div>
  )
}