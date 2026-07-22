import React, { useState } from "react";

const API = "http://127.0.0.1:5000";

const ROLES = ["Doctor", "Nurse", "Specialist", "Researcher", "Student"];

export default function AuthPage({ onLogin }) {
  const [mode, setMode]       = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [role, setRole]       = useState("Doctor");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const switchMode = (m) => { setMode(m); setError(""); };

  const submit = async () => {
    if (!username.trim() || !password) { setError("Username and password are required."); return; }
    setLoading(true); setError("");
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login"
        ? { username, password }
        : { username, password, email, name: name || username, role: role.toLowerCase() };
      const res  = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      localStorage.setItem("mn_token", data.token);
      localStorage.setItem("mn_user",  JSON.stringify(data.user));
      onLogin(data.user, data.token);
    } catch (e) {
      setError(e.message || "Connection failed. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => e.key === "Enter" && submit();

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">⚕</div>
          <h1 className="auth-title">
            Medi<span className="accent">Nova</span> <span className="accent2">AI</span>
          </h1>
          <p className="auth-subtitle">Medical Intelligence Platform 2026</p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => switchMode("login")}>Login</button>
          <button className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => switchMode("register")}>Register</button>
        </div>

        {/* Form */}
        <div className="auth-form">
          {/* Register-only fields */}
          {mode === "register" && (
            <>
              <div className="auth-field">
                <label>FULL NAME</label>
                <input className="auth-input" placeholder="Dr. Sarah Ahmed"
                  value={name} onChange={(e) => setName(e.target.value)} onKeyDown={onKey} />
              </div>
              <div className="auth-field">
                <label>ROLE</label>
                <select className="auth-select" value={role}
                  onChange={(e) => setRole(e.target.value)}>
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="auth-field">
                <label>EMAIL</label>
                <input className="auth-input" type="email" placeholder="doctor@hospital.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={onKey} />
              </div>
            </>
          )}

          <div className="auth-field">
            <label>USERNAME</label>
            <input className="auth-input" placeholder="Enter your username"
              value={username} onChange={(e) => setUsername(e.target.value)}
              onKeyDown={onKey} autoComplete="username" />
          </div>

          <div className="auth-field">
            <label>PASSWORD</label>
            <input className="auth-input" type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onKey} autoComplete="current-password" />
          </div>

          {error && <div className="auth-error">⚠ {error}</div>}

          <button className="auth-submit" onClick={submit} disabled={loading}>
            {loading
              ? <span className="auth-spinner" />
              : mode === "login" ? "Enter MedNova AI →" : "Create Account →"}
          </button>
        </div>

        {/* Demo hint */}
        <p className="auth-demo-hint">
          Demo: username <strong>demo</strong> / password <strong>demo123</strong>
        </p>
      </div>
    </div>
  );
}
