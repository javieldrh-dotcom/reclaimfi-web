"use client";
import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export default function AccountingChatWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"datos" | "ayuda">("datos");
  const [question, setQuestion] = useState("");
  const [messagesDatos, setMessagesDatos] = useState<ChatMessage[]>([]);
  const [messagesAyuda, setMessagesAyuda] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const bg = "#0A1628";
  const surface = "#12213B";
  const border = "#1E3A5F";
  const sky = "#FACC15";
  const inkSoft = "#8FA3C4";

  const messages = tab === "datos" ? messagesDatos : messagesAyuda;
  const setMessages = tab === "datos" ? setMessagesDatos : setMessagesAyuda;
  const endpoint = tab === "datos" ? "/api/chat-query" : "/api/help-query";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, tab]);

  async function sendQuestion() {
    const q = question.trim();
    if (!q || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
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
        <div style={{ width: 400, height: 540, background: bg, border: "1px solid " + border, borderRadius: 16, boxShadow: "0 12px 32px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", marginBottom: 12, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px 0", borderBottom: "1px solid " + border }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ color: sky, fontWeight: 800, fontSize: 16 }}>Asistente</span>
              <button onClick={() => setOpen(false)} aria-label="Cerrar" style={{ background: "none", border: "none", cursor: "pointer", color: inkSoft, padding: 4 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
              <button onClick={() => setTab("datos")} style={{ flex: 1, padding: "10px 0", background: tab === "datos" ? sky + "18" : "transparent", color: tab === "datos" ? sky : inkSoft, border: "1px solid " + (tab === "datos" ? sky : border), borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Mis Datos
              </button>
              <button onClick={() => setTab("ayuda")} style={{ flex: 1, padding: "10px 0", background: tab === "ayuda" ? sky + "18" : "transparent", color: tab === "ayuda" ? sky : inkSoft, border: "1px solid " + (tab === "ayuda" ? sky : border), borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Ayuda
              </button>
            </div>
          </div>

          <div style={{ padding: "8px 14px", background: sky + "0C", borderBottom: "1px solid " + border }}>
            <p style={{ fontSize: 11, color: inkSoft, lineHeight: 1.5 }}>
              Estas hablando con un asistente automatizado de inteligencia artificial, no una persona. Verifica los resultados antes de usarlos oficialmente.
            </p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
            {messages.length === 0 && (
              <p style={{ fontSize: 13, color: inkSoft, padding: 8 }}>
                {tab === "datos"
                  ? 'Pregunta sobre tus datos contables, ej: "¿cual es mi saldo en banco?" o "¿cuanto llevo de gastos este ano?"'
                  : 'Pregunta como usar la plataforma, ej: "¿donde registro un asiento?" o "¿como veo el Balance de Comprobacion?"'}
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 10, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%", padding: "10px 14px", borderRadius: 12, fontSize: 14, lineHeight: 1.6,
                  background: m.role === "user" ? sky : surface,
                  color: m.role === "user" ? bg : "#FFFFFF",
                  border: m.role === "user" ? "none" : "1px solid " + border,
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <p style={{ fontSize: 13, color: inkSoft, padding: 8 }}>Pensando...</p>}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: 12, borderTop: "1px solid " + border, display: "flex", gap: 8 }}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta..."
              rows={1}
              style={{ flex: 1, resize: "none", background: surface, border: "1px solid " + border, borderRadius: 10, padding: 10, color: "white", fontSize: 14 }}
            />
            <button onClick={sendQuestion} disabled={loading} aria-label="Enviar" style={{ background: sky, border: "none", borderRadius: 10, padding: "0 16px", color: bg, fontWeight: 800, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </div>
        </div>
      )}
      <div
        onClick={() => setOpen(!open)}
        role="button"
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        style={{ width: 76, height: 76, borderRadius: "50%", background: sky, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 8px 24px " + sky + "60", marginLeft: "auto" }}
      >
        {open ? (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0A1628" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        ) : (
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#0A1628" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
        )}
      </div>
    </div>
  );
}