"use client";
import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export default function AccountingChatWidget() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendQuestion() {
    const q = question.trim();
    if (!q || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const json = await res.json();
      const answer = json.success ? json.answer : "Error: " + json.error;
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", text: "Error de conexion: " + err.message }]);
    }
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  }

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100 }}>
      {open && (
        <div style={{ width: 360, height: 460, background: "#0d1117", border: "1px solid #1a3050", borderRadius: 16, boxShadow: "0 12px 32px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", marginBottom: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #1a3050", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#818CF8", fontWeight: 700, fontSize: 14 }}>Pregunta a tus Numeros</span>
            <span onClick={() => setOpen(false)} style={{ cursor: "pointer", color: "#8B93A7", fontSize: 18 }}>✕</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            {messages.length === 0 && (
              <p style={{ fontSize: 13, color: "#8B93A7", padding: 8 }}>
                Pregunta sobre tus datos contables, ej: "¿cual es mi saldo en banco?" o "¿cuanto llevo de gastos este ano?"
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 10, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%", padding: "8px 12px", borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                  background: m.role === "user" ? "#818CF8" : "#161b22",
                  color: m.role === "user" ? "#0B0E14" : "#e5e7eb",
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <p style={{ fontSize: 13, color: "#8B93A7", padding: 8 }}>Pensando...</p>}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: 10, borderTop: "1px solid #1a3050", display: "flex", gap: 8 }}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta..."
              rows={1}
              style={{ flex: 1, resize: "none", background: "#000a16", border: "1px solid #1a3050", borderRadius: 10, padding: 8, color: "white", fontSize: 13 }}
            />
            <button onClick={sendQuestion} disabled={loading} style={{ background: "#818CF8", border: "none", borderRadius: 10, padding: "0 14px", color: "#0B0E14", fontWeight: 700, cursor: "pointer" }}>
              ➤
            </button>
          </div>
        </div>
      )}
      <div
        onClick={() => setOpen(!open)}
        style={{ width: 56, height: 56, borderRadius: "50%", background: "#818CF8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 8px 20px rgba(129,140,248,0.4)", marginLeft: "auto" }}
      >
        <span style={{ fontSize: 24 }}>{open ? "✕" : "💬"}</span>
      </div>
    </div>
  );
}