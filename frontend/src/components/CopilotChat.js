import React, { useState, useRef, useEffect, useCallback } from "react";

const API = "http://127.0.0.1:5000";

const SUGGESTIONS = [
  "What is diabetes?",
  "Normal blood pressure range?",
  "COVID-19 symptoms",
  "What is a heart attack?",
  "Explain hypertension",
];

function MarkdownText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          p.split("\n").map((line, j) => (
            <React.Fragment key={j}>{j > 0 && <br />}{line}</React.Fragment>
          ))
        )
      )}
    </span>
  );
}

export default function CopilotChat({ token }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "👋 Hello! I'm **Nova**, your AI medical copilot. Ask me about symptoms, conditions, medications, or anything medical!",
      time: new Date().toISOString(),
    },
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId]         = useState(() => "s_" + Date.now());
  const bottomRef           = useRef(null);
  const inputRef            = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (msg) => {
    const text = (msg || input).trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role:"user", content: text, time: new Date().toISOString() }]);
    setLoading(true);
    try {
      const res  = await fetch(`${API}/copilot/chat`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });
      const data = await res.json();
      setMessages((m) => [...m, {
        role: "assistant",
        content: data.response || "Sorry, I couldn't process that.",
        time: new Date().toISOString(),
      }]);
    } catch {
      setMessages((m) => [...m, {
        role: "assistant",
        content: "⚠ Connection error. Make sure the backend is running on port 5000.",
        time: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, sessionId, token]);

  const clearChat = () => setMessages([{
    role: "assistant",
    content: "Chat cleared. What medical question can I help with?",
    time: new Date().toISOString(),
  }]);

  const fmtTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });

  return (
    <div className="copilot-wrap">
      {/* Header */}
      <div className="copilot-header">
        <div className="copilot-header-left">
          <div className="copilot-avatar">🤖</div>
          <div>
            <p className="copilot-name">Nova — AI Medical Copilot</p>
            <p className="copilot-status-line">
              <span className="status-dot" />
              Powered by MedNova Multi-Agent AI
            </p>
          </div>
        </div>
        <button className="icon-btn" onClick={clearChat} title="Clear chat">🗑</button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble-row ${m.role}`}>
            {m.role === "assistant" && (
              <div className="chat-avatar-sm">N</div>
            )}
            <div className={`chat-bubble ${m.role}`}>
              <MarkdownText text={m.content} />
              <span className="bubble-time">{fmtTime(m.time)}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble-row assistant">
            <div className="chat-avatar-sm">N</div>
            <div className="chat-bubble assistant typing">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className="chat-suggestions">
        {SUGGESTIONS.map((s, i) => (
          <button key={i} className="suggestion-chip" onClick={() => send(s)}>{s}</button>
        ))}
      </div>

      {/* Input */}
      <div className="chat-input-row">
        <input ref={inputRef} className="chat-input"
          placeholder="Ask Nova anything medical..."
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          disabled={loading} />
        <button className="chat-send-btn"
          onClick={() => send()} disabled={!input.trim() || loading}>
          {loading ? <span className="mini-spinner" /> : "→"}
        </button>
      </div>
    </div>
  );
}
