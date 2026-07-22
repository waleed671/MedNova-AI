import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import AuroraBackground from "./components/AuroraBackground";
import AuthPage         from "./components/AuthPage";
import CopilotChat      from "./components/CopilotChat";
import VoiceInput       from "./components/VoiceInput";
import ImageAnalysis    from "./components/ImageAnalysis";
import XAIDashboard     from "./components/XAIDashboard";
import PDFReport        from "./components/PDFReport";
import Analytics        from "./components/Analytics";

const API = "http://127.0.0.1:5000";

const URGENCY = {
  critical: { label:"CRITICAL", color:"#ef4444", bg:"rgba(239,68,68,0.09)",   border:"rgba(239,68,68,0.28)",   icon:"🚨" },
  high:     { label:"HIGH",     color:"#f97316", bg:"rgba(249,115,22,0.09)",  border:"rgba(249,115,22,0.28)",  icon:"⚠️" },
  medium:   { label:"MEDIUM",   color:"#f59e0b", bg:"rgba(245,158,11,0.09)",  border:"rgba(245,158,11,0.28)",  icon:"📋" },
  low:      { label:"LOW",      color:"#10b981", bg:"rgba(16,185,129,0.09)",  border:"rgba(16,185,129,0.28)",  icon:"💊" },
};
const VITAL_STATUS = {
  critical: { color:"#ef4444", icon:"🔴" },
  high:     { color:"#f97316", icon:"🟠" },
  elevated: { color:"#f59e0b", icon:"🟡" },
  low:      { color:"#3b82f6", icon:"🔵" },
  normal:   { color:"#10b981", icon:"🟢" },
};

const NAV_ITEMS = [
  { id:"diagnose",  label:"Diagnose",    icon:"🩺" },
  { id:"copilot",   label:"AI Copilot",  icon:"🤖" },
  { id:"imaging",   label:"Imaging",     icon:"🖼" },
  { id:"analytics", label:"Analytics",   icon:"📊" },
  { id:"history",   label:"History",     icon:"📋" },
  { id:"voice",     label:"Voice Input", icon:"🎙" },
  { id:"xai",       label:"XAI",         icon:"🔬" },
  { id:"report",    label:"Reports",     icon:"📄" },
];

// ── VitalsPanel ──────────────────────────────────────────
function VitalsPanel({ vitals, setVitals }) {
  const fields = [
    { key:"blood_pressure",    label:"Blood Pressure", placeholder:"120/80", unit:"mmHg", icon:"🫀" },
    { key:"heart_rate",        label:"Heart Rate",      placeholder:"72",     unit:"bpm",  icon:"💓" },
    { key:"temperature",       label:"Temperature",     placeholder:"37.0",   unit:"°C",   icon:"🌡️" },
    { key:"oxygen_saturation", label:"SpO₂",            placeholder:"98",     unit:"%",    icon:"🫁" },
    { key:"blood_sugar",       label:"Blood Sugar",     placeholder:"90",     unit:"mg/dL",icon:"🩸" },
  ];
  return (
    <div className="vitals-grid">
      {fields.map((f) => (
        <div key={f.key} className="vital-field">
          <label className="vital-label"><span>{f.icon}</span> {f.label}</label>
          <div className="vital-input-wrap">
            <input type="text" className="vital-input" placeholder={f.placeholder}
              value={vitals[f.key] || ""}
              onChange={(e) => setVitals((v) => ({ ...v, [f.key]: e.target.value }))} />
            <span className="vital-unit">{f.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── VitalsResult ─────────────────────────────────────────
function VitalsResult({ items }) {
  if (!items || !items.length) return null;
  return (
    <div className="vitals-result-grid">
      {items.map((item, i) => {
        const cfg = VITAL_STATUS[item.status] || VITAL_STATUS.normal;
        return (
          <div key={i} className="vital-result-card" style={{ "--vc": cfg.color }}>
            <div className="vrc-top">
              <span>{cfg.icon}</span>
              <span className="vrc-vital">{item.vital}</span>
              <span className="vrc-value" style={{ color: cfg.color }}>{item.value}</span>
            </div>
            <p className="vrc-note">{item.note}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── DiagnosisResult ──────────────────────────────────────
function DiagnosisResult({ result, onReset }) {
  const [copied, setCopied] = useState(false);
  const urg = URGENCY[result.diagnosis.overall_urgency] || URGENCY.low;
  const symText = result.analysis.symptoms_recognized.join(", ") || "—";

  const copyReport = () => {
    const lines = [
      `MedNova AI — ${result.timestamp}`,
      `Patient: ${result.patient.name}, Age: ${result.patient.age || "N/A"}, Gender: ${result.patient.gender}`,
      `Urgency: ${result.diagnosis.overall_urgency.toUpperCase()}`,
      `Symptoms: ${symText}`,
      `Conditions: ${result.diagnosis.possible_conditions.map((c) => c.condition).join(", ")}`,
      `\n⚠ AI-generated. Not medical advice.`,
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="diagnosis-result">
      <div className="urgency-banner" style={{ background: urg.bg, borderColor: urg.border }}>
        <div className="urgency-left">
          <span className="urgency-icon">{urg.icon}</span>
          <div>
            <p className="urgency-level" style={{ color: urg.color }}>{urg.label} URGENCY</p>
            <p className="urgency-action">{result.diagnosis.urgency_action}</p>
          </div>
        </div>
        <div className="urgency-actions">
          <button className="icon-btn" onClick={copyReport} title="Copy">{copied ? "✓" : "📋"}</button>
          <button className="icon-btn" onClick={onReset} title="New patient">↺</button>
        </div>
      </div>

      <div className="result-meta-row">
        <div className="meta-box">
          <span className="meta-icon">👤</span>
          <div>
            <p className="meta-title">{result.patient.name}</p>
            <p className="meta-sub">{result.patient.age ? `${result.patient.age} yrs` : "Age N/A"} · {result.patient.gender}</p>
          </div>
        </div>
        <div className="meta-box">
          <span className="meta-icon">🔬</span>
          <div>
            <p className="meta-title">{result.analysis.symptom_count} Symptoms</p>
            <p className="meta-sub">{result.analysis.recognition_rate}% recognized</p>
          </div>
        </div>
        <div className="meta-box">
          <span className="meta-icon">🏥</span>
          <div>
            <p className="meta-title">{result.analysis.affected_systems.length} System(s)</p>
            <p className="meta-sub">{result.analysis.affected_systems.slice(0,2).join(", ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ConditionsList ───────────────────────────────────────
function ConditionsList({ conditions }) {
  const max = conditions[0]?.mentions || 1;
  return (
    <div className="conditions-list">
      <h3 className="section-heading"><span>🩺</span> Possible Conditions</h3>
      {conditions.map((c, i) => (
        <div key={i} className="condition-row">
          <div className="cond-rank">#{i+1}</div>
          <div className="cond-info">
            <span className="cond-name">{c.condition}</span>
            <div className="cond-bar-wrap">
              <div className="cond-bar" style={{ width: `${(c.mentions/max)*100}%` }} />
            </div>
          </div>
          <span className="cond-count">{c.mentions} signal{c.mentions > 1 ? "s" : ""}</span>
        </div>
      ))}
    </div>
  );
}

// ── SymptomTags ──────────────────────────────────────────
function SymptomTags({ recognized, entered }) {
  const parts = entered.split(/[,;\n]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
  return (
    <div className="symptoms-section">
      <h3 className="section-heading"><span>🔍</span> Symptom Recognition</h3>
      <div className="symptom-tags">
        {parts.map((s, i) => {
          const matched = recognized.some((r) => s.includes(r) || r.includes(s));
          return <span key={i} className={`symptom-tag ${matched ? "matched" : "unmatched"}`}>{s}</span>;
        })}
      </div>
      {recognized.length > 0 && <p className="sym-note">✓ Matched: {recognized.join(" · ")}</p>}
    </div>
  );
}

// ── Recommendations ──────────────────────────────────────
function Recommendations({ general, vital }) {
  const all = [...general, ...(vital || [])];
  return (
    <div className="recs-section">
      <h3 className="section-heading"><span>💡</span> Recommendations</h3>
      <ul className="recs-list">
        {all.map((r, i) => (
          <li key={i} className="rec-item"><span className="rec-bullet">→</span>{r}</li>
        ))}
      </ul>
    </div>
  );
}

// ── HistoryPanel ─────────────────────────────────────────
function HistoryPanel({ records, onClear }) {
  if (!records.length) return (
    <div className="empty-state">
      <span className="empty-icon">📂</span>
      <p>No patient records yet</p>
    </div>
  );
  return (
    <div className="history-panel">
      <div className="history-header">
        <span>{records.length} Record{records.length > 1 ? "s" : ""}</span>
        <button className="clear-btn" onClick={onClear}>Clear All</button>
      </div>
      {records.map((r) => {
        const urg = URGENCY[r.overall_urgency] || URGENCY.low;
        return (
          <div key={r.id} className="history-card">
            <div className="hc-left">
              <span className="hc-id">#{r.id}</span>
              <div>
                <p className="hc-name">{r.patient_name}</p>
                <p className="hc-meta">{r.age ? `${r.age}y` : "—"} · {r.gender} · {r.timestamp.split(" ")[1]}</p>
              </div>
            </div>
            <div className="hc-right">
              <span className="urgency-chip" style={{ color: urg.color, borderColor: urg.border, background: urg.bg }}>
                {urg.icon} {urg.label}
              </span>
              <p className="hc-cond">{r.possible_conditions.slice(0,2).join(", ") || "—"}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//   SIDEBAR
// ═══════════════════════════════════════════════════════
function Sidebar({ tab, setTab, user, onLogout }) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⚕</div>
        <div className="sidebar-logo-text">
          <span className="sidebar-brand">Med<span>Nova</span> AI</span>
          <span className="sidebar-version">v4.0</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${tab === item.id ? "active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span className="nav-item-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-user">
        <div className="sidebar-user-card">
          <div className="sidebar-avatar">
            {user?.avatar || user?.name?.[0]?.toUpperCase() || "D"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="sidebar-user-name">{user?.name || user?.username || "Doctor"}</p>
            <p className="sidebar-user-role">{user?.role || "Doctor"}</p>
          </div>
          <button className="sidebar-logout-btn" onClick={onLogout} title="Logout">⏻</button>
        </div>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════
//   MAIN APP
// ═══════════════════════════════════════════════════════
export default function App() {
  const [user, setUser]   = useState(() => { try { return JSON.parse(localStorage.getItem("mn_user")); } catch { return null; } });
  const [token, setToken] = useState(() => localStorage.getItem("mn_token") || "");
  const [tab, setTab]     = useState("diagnose");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [result, setResult]   = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm]       = useState({ patient_name:"", age:"", gender:"", notes:"" });
  const [symptoms, setSymptoms] = useState("");
  const [vitals, setVitals]   = useState({});

  const handleLogin = (u, t) => { setUser(u); setToken(t); };

  const handleLogout = () => {
    localStorage.removeItem("mn_token");
    localStorage.removeItem("mn_user");
    fetch(`${API}/auth/logout`, { method:"POST", headers:{ Authorization:`Bearer ${token}` } }).catch(()=>{});
    setUser(null); setToken(""); setResult(null);
  };

  const loadHistory = useCallback(async () => {
    try {
      const r = await fetch(`${API}/patients`, { headers:{ Authorization:`Bearer ${token}` } });
      const d = await r.json();
      if (d.status === "success") setHistory(d.records);
    } catch {}
  }, [token]);

  useEffect(() => { if (tab === "history") loadHistory(); }, [tab, loadHistory]);

  const handleDiagnose = async () => {
    if (!symptoms.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API}/diagnose`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ ...form, symptoms, vitals }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e.message || "Connection failed. Make sure backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null); setSymptoms(""); setVitals({}); setError(null);
    setForm({ patient_name:"", age:"", gender:"", notes:"" });
  };

  const handleClearHistory = async () => {
    await fetch(`${API}/patients`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } }).catch(()=>{});
    setHistory([]);
  };

  const handleVoiceTranscript = (text) => {
    setSymptoms((prev) => prev ? prev + ", " + text : text);
    setTab("diagnose");
  };

  // ── Auth gate ──
  if (!user) return (
    <>
      <AuroraBackground />
      <div className="grid-overlay" />
      <AuthPage onLogin={handleLogin} />
    </>
  );

  const canSubmit = symptoms.trim().length > 0 && !loading;

  // Page titles per tab
  const PAGE_META = {
    diagnose:  { title:"AI Diagnosis",         sub:"Enter symptoms for multi-agent analysis",          icon:"🩺" },
    copilot:   { title:"AI Copilot",            sub:"Powered by MedNova Multi-Agent AI",               icon:"🤖" },
    imaging:   { title:"Medical Image Analysis",sub:"AI-powered radiological interpretation",          icon:"🖼" },
    analytics: { title:"Analytics Dashboard",   sub:"Patient data insights & trends",                  icon:"📊" },
    history:   { title:"Patient History",       sub:"All past diagnoses",                              icon:"📋" },
    voice:     { title:"Voice Input",           sub:"Speak your symptoms naturally",                   icon:"🎙" },
    xai:       { title:"Explainable AI",        sub:"AI reasoning & factor analysis",                  icon:"🔬" },
    report:    { title:"PDF Reports",           sub:"Generate & download clinical reports",            icon:"📄" },
  };
  const meta = PAGE_META[tab] || PAGE_META.diagnose;

  return (
    <>
      <AuroraBackground />
      <div className="grid-overlay" />
      <div className="app-shell">
        <Sidebar tab={tab} setTab={setTab} user={user} onLogout={handleLogout} />

        <main className="main-content">
          <div className="page-area">
            {/* Page header */}
            <div className="page-header">
              <div>
                <h1 className="page-title">
                  <span className="page-title-icon">{meta.icon}</span>
                  {meta.title}
                </h1>
                <p className="page-subtitle">{meta.sub}</p>
              </div>
            </div>

            {/* ════ DIAGNOSE FORM ════ */}
            {tab === "diagnose" && !result && (
              <div className="glass-card" style={{ animation:"cardIn 0.5s ease both" }}>
                <div className="form-section">
                  <h2 className="form-section-title"><span>👤</span> Patient Information</h2>
                  <div className="patient-grid">
                    <div className="field-group">
                      <label className="field-label">FULL NAME</label>
                      <input className="neuro-input" placeholder="e.g. Ahmed Khan"
                        value={form.patient_name}
                        onChange={(e) => setForm((f) => ({ ...f, patient_name: e.target.value }))} />
                    </div>
                    <div className="field-group">
                      <label className="field-label">AGE</label>
                      <input className="neuro-input" type="number" placeholder="35"
                        value={form.age}
                        onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} />
                    </div>
                    <div className="field-group">
                      <label className="field-label">GENDER</label>
                      <select className="neuro-select" value={form.gender}
                        onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h2 className="form-section-title">
                    <span>🔍</span> Symptoms
                    <button className="icon-btn" style={{ marginLeft:"auto", fontSize:"12px", width:"auto", padding:"4px 10px", borderRadius:"7px" }}
                      onClick={() => setTab("voice")} title="Use voice input">
                      🎙 Voice
                    </button>
                  </h2>
                  <div className="field-group">
                    <div className="field-top-row">
                      <label className="field-label">DESCRIBE SYMPTOMS</label>
                      <span className="field-hint">Separate with commas</span>
                    </div>
                    <textarea className="neuro-textarea" rows={3}
                      placeholder="e.g. chest pain, shortness of breath, fatigue, headache..."
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)} />
                  </div>
                  <div className="quick-symptoms">
                    <p className="quick-label">Quick:</p>
                    {["fever","headache","cough","fatigue","chest pain","nausea","dizziness","back pain","shortness of breath","joint pain"].map((s) => (
                      <button key={s} className="quick-tag"
                        onClick={() => setSymptoms((p) => p ? p+", "+s : s)}>{s}</button>
                    ))}
                  </div>
                </div>

                <div className="form-section">
                  <h2 className="form-section-title"><span>📊</span> Vital Signs <span className="optional-tag">Optional</span></h2>
                  <VitalsPanel vitals={vitals} setVitals={setVitals} />
                </div>

                <div className="form-section">
                  <h2 className="form-section-title"><span>📝</span> Clinical Notes <span className="optional-tag">Optional</span></h2>
                  <textarea className="neuro-textarea" rows={2}
                    placeholder="Medical history, medications, allergies..."
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
                </div>

                {error && (
                  <div className="error-card">
                    <span>⚠</span>
                    <div><p className="error-title">Error</p><p className="error-msg">{error}</p></div>
                  </div>
                )}

                <button className="submit-btn" onClick={handleDiagnose} disabled={!canSubmit}>
                  <span className="btn-shine" />
                  <span className="btn-content">
                    {loading ? <><span className="spinner" />Analyzing…</> : <><span>⚡</span> Run AI Analysis</>}
                  </span>
                </button>
                <p className="disclaimer">⚠ AI-generated results for educational purposes only. Not a substitute for professional medical advice.</p>
              </div>
            )}

            {/* ════ DIAGNOSIS RESULT ════ */}
            {tab === "diagnose" && result && (
              <div className="glass-card" style={{ animation:"cardIn 0.5s ease both" }}>
                <DiagnosisResult result={result} onReset={handleReset} />
                <VitalsResult items={result.vitals_analysis} />
                <ConditionsList conditions={result.diagnosis.possible_conditions} />
                <SymptomTags recognized={result.analysis.symptoms_recognized} entered={result.analysis.symptoms_entered} />
                <Recommendations general={result.diagnosis.general_recommendations} vital={result.diagnosis.vital_recommendations} />
                {result.notes && <div className="notes-box"><span>📝</span> {result.notes}</div>}
                <button className="submit-btn secondary" onClick={handleReset}>
                  <span className="btn-content"><span>+</span> New Patient Analysis</span>
                </button>
              </div>
            )}

            {tab === "copilot"   && <div className="glass-card"><CopilotChat token={token} /></div>}
            {tab === "voice"     && <div className="glass-card"><VoiceInput onTranscript={handleVoiceTranscript} /></div>}
            {tab === "imaging"   && <div className="glass-card"><ImageAnalysis token={token} /></div>}
            {tab === "xai"       && <div className="glass-card"><XAIDashboard xai={result?.xai} conditions={result?.diagnosis?.possible_conditions} healthScore={result?.health_score} /></div>}
            {tab === "report"    && <div className="glass-card"><PDFReport result={result} token={token} /></div>}
            {tab === "analytics" && <div className="glass-card"><Analytics token={token} /></div>}
            {tab === "history"   && <div className="glass-card"><HistoryPanel records={history} onClear={handleClearHistory} /></div>}
          </div>
        </main>
      </div>
    </>
  );
}
