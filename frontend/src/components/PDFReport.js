import React, { useState } from "react";

const API = "http://127.0.0.1:5000";

const URGENCY_COLORS = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#f59e0b",
  low:      "#10b981",
};

export default function PDFReport({ result, token }) {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!result) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/report/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          record_id: result.record_id,
          patient: result.patient,
          analysis: result.analysis,
          diagnosis: result.diagnosis,
          timestamp: result.timestamp,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGenerated(data.report);
    } catch (e) {
      setError(e.message || "Report generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!generated) return;
    const blob = new Blob([generated], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MedNova_Report_${
      result?.patient?.name?.replace(/\s+/g, "_") || "Patient"
    }_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    if (!generated) return;
    const w = window.open("", "_blank");
    w.document.write(`
      <html>
      <head>
        <title>MedNova AI Report</title>
        <style>
          body { font-family: 'Courier New', monospace; background: #050b10; color: #e2e8f0;
                 padding: 2.5rem; white-space: pre-wrap; }
          pre  { font-size: 13px; line-height: 1.7; }
        </style>
      </head>
      <body><pre>${generated.replace(/</g, "&lt;")}</pre></body>
      </html>
    `);
    w.document.close();
    w.print();
  };

  if (!result) {
    return (
      <div className="report-empty">
        <div className="report-empty-icon">📄</div>
        <p className="report-empty-title">No Report Available</p>
        <p className="report-empty-sub">
          Run a diagnosis first, then come back here to generate and download a
          professional medical report.
        </p>
      </div>
    );
  }

  const urg = result.diagnosis?.overall_urgency || "low";
  const urgColor = URGENCY_COLORS[urg] || "#10b981";

  return (
    <div className="report-wrap">
      {/* Summary card */}
      <div className="report-summary">
        {/* Logo + Report ID */}
        <div className="report-summary-header">
          <div className="report-logo">
            <span className="report-logo-icon">⚕</span>
            <div>
              <p className="report-logo-name">MedNova AI</p>
              <p className="report-logo-sub">Medical Intelligence Platform · 2026</p>
            </div>
          </div>
          <div className="report-id">Report #{result.record_id}</div>
        </div>

        {/* Patient row */}
        <div className="report-patient-row">
          <div className="report-avatar">
            {result.patient?.name?.[0]?.toUpperCase() || "P"}
          </div>
          <div className="report-patient-info">
            <p className="report-patient-name">
              {result.patient?.name || "Anonymous"}
            </p>
            <p className="report-patient-meta">
              {result.patient?.age ? `Age ${result.patient.age}` : "Age N/A"} ·{" "}
              {result.patient?.gender || "N/A"} · {result.timestamp}
            </p>
          </div>
          <div
            className="report-urgency-badge"
            style={{
              background: urgColor + "20",
              borderColor: urgColor + "50",
              color: urgColor,
            }}
          >
            {urg.toUpperCase()}
          </div>
        </div>

        {/* Stats row */}
        <div className="report-stats-row">
          {[
            { val: result.analysis?.symptom_count || 0,                        lbl: "Symptoms"   },
            { val: result.diagnosis?.possible_conditions?.length || 0,         lbl: "Conditions" },
            {
              val: result.health_score,
              lbl: "Health Score",
              color: result.health_score > 70 ? "#10b981" : result.health_score > 40 ? "#f59e0b" : "#ef4444",
              suffix: "/100",
            },
            { val: result.analysis?.affected_systems?.length || 0,             lbl: "Systems"    },
          ].map((s, i) => (
            <div key={i} className="report-stat">
              <p className="rs-val" style={{ color: s.color || undefined }}>
                {s.val}{s.suffix || ""}
              </p>
              <p className="rs-label">{s.lbl}</p>
            </div>
          ))}
        </div>

        {/* Top conditions */}
        {result.diagnosis?.possible_conditions?.length > 0 && (
          <div className="report-conditions">
            <p className="rc-title">Top Conditions</p>
            <div className="rc-list">
              {result.diagnosis.possible_conditions.slice(0, 4).map((c, i) => (
                <span key={i} className="rc-chip">
                  #{i + 1} {c.condition}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Urgency action */}
        <div className="report-action">
          <p className="ra-urgency" style={{ color: urgColor }}>
            {result.diagnosis?.urgency_action}
          </p>
        </div>
      </div>

      {error && <div className="report-error">⚠ {error}</div>}

      {/* Action buttons */}
      <div className="report-btns">
        <button className="report-gen-btn" onClick={generate} disabled={loading}>
          <span className="btn-shine" />
          <span>
            {loading ? (
              <><span className="spinner" /> Generating…</>
            ) : (
              <><span>📄</span> Generate Full Report</>
            )}
          </span>
        </button>
        {generated && (
          <>
            <button className="report-dl-btn" onClick={download}>
              <span>⬇</span> Download .txt
            </button>
            <button className="report-print-btn" onClick={printReport}>
              <span>🖨</span> Print
            </button>
          </>
        )}
      </div>

      {/* Preview */}
      {generated && (
        <div className="report-preview">
          <p className="preview-title">📋 Report Preview</p>
          <pre className="preview-content">{generated}</pre>
        </div>
      )}

      <p className="report-disclaimer">
        ⚠ This AI-generated report is for educational purposes only and does not
        constitute a medical diagnosis. Always consult a licensed healthcare professional.
      </p>
    </div>
  );
}
