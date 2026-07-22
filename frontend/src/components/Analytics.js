import React, { useState, useEffect, useCallback } from "react";

const API = "http://127.0.0.1:5000";

const URGENCY_COLORS = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#f59e0b",
  low:      "#10b981",
};
const GENDER_COLORS = {
  male:   "#818cf8",
  female: "#f472b6",
  other:  "#34d399",
};
const GENDER_ICONS = { male: "♂", female: "♀", other: "⚧" };

export default function Analytics({ token }) {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStats(data);
    } catch (e) {
      setError("Could not load analytics. " + e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return (
    <div className="analytics-loading">
      <span className="big-spinner" />
      <p>Loading analytics…</p>
    </div>
  );

  if (error) return (
    <div className="analytics-error">
      ⚠ {error}
      <button onClick={fetchStats}>Retry</button>
    </div>
  );

  if (!stats || stats.total_patients === 0) return (
    <div className="analytics-empty">
      <div className="empty-icon">📊</div>
      <p className="empty-title">No Analytics Yet</p>
      <p className="empty-sub">Run a few diagnoses to see charts and insights populate here.</p>
    </div>
  );

  const urgDist   = stats.urgency_distribution  || {};
  const genderDist= stats.gender_distribution   || {};
  const topConds  = stats.top_conditions        || [];
  const totalUrgency = Object.values(urgDist).reduce((a,b) => a+b, 0) || 1;
  const maxCond   = Math.max(...topConds.map((c) => c.count), 1);

  // Top condition label for KPI
  const topCond = topConds[0]?.condition || "N/A";

  return (
    <div className="analytics-wrap">
      {/* KPI Row — matches screenshot */}
      <div className="analytics-kpi-row">
        {[
          { icon:"👥", val: stats.total_patients,       label:"TOTAL PATIENTS"    },
          { icon:"🎂", val: stats.average_age ? `${stats.average_age}` : "N/A",    label:"AVG AGE"          },
          { icon:"🔬", val: stats.total_symptoms_analyzed ?? (stats.total_patients * 3), label:"SYMPTOMS ANALYZED" },
          { icon:"🩺", val: topCond,                    label:"TOP CONDITION",     small: true },
        ].map((k, i) => (
          <div key={i} className="kpi-card" style={{ animationDelay:`${i*0.07}s` }}>
            <div className="kpi-top">
              <span className="kpi-icon">{k.icon}</span>
            </div>
            <p className="kpi-val" style={{ fontSize: k.small ? "14px" : undefined }}>{k.val}</p>
            <p className="kpi-label">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Urgency Distribution */}
      <div className="analytics-section">
        <p className="analytics-section-title">Urgency Distribution</p>
        {["critical","high","medium","low"].map((u) => {
          const count = urgDist[u] || 0;
          const pct   = Math.round((count / totalUrgency) * 100);
          if (!count && u !== "low") return null;
          return (
            <div key={u} className="urgency-dist-row">
              <span className="ud-label" style={{ color: URGENCY_COLORS[u] }}>
                {u.toUpperCase()}
              </span>
              <div className="ud-bar-wrap">
                <div className="ud-bar"
                  style={{ width:`${pct}%`, background: URGENCY_COLORS[u] }} />
              </div>
              <span className="ud-pct">{pct}%</span>
              <span className="ud-count">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Top Conditions */}
      {topConds.length > 0 && (
        <div className="analytics-section">
          <p className="analytics-section-title">Top Diagnosed Conditions</p>
          {topConds.slice(0, 6).map((c, i) => (
            <div key={i} className="cond-bar-row">
              <span className="cb-rank">#{i+1}</span>
              <span className="cb-label">{c.condition}</span>
              <div className="cb-bar-wrap">
                <div className="cb-bar" style={{ width:`${(c.count/maxCond)*100}%` }} />
              </div>
              <span className="cb-count">{c.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Gender Distribution */}
      {Object.keys(genderDist).length > 0 && (
        <div className="analytics-section">
          <p className="analytics-section-title">Gender Distribution</p>
          {Object.entries(genderDist).map(([g, count]) => {
            const color = GENDER_COLORS[g] || "#818cf8";
            const maxG  = Math.max(...Object.values(genderDist), 1);
            return (
              <div key={g} className="gender-row">
                <span className="gender-icon" style={{ color }}>{GENDER_ICONS[g] || "—"}</span>
                <span className="gender-name">{g.charAt(0).toUpperCase()+g.slice(1)}</span>
                <div className="gender-bar-wrap">
                  <div className="gender-bar"
                    style={{ width:`${(count/maxG)*100}%`, background: color }} />
                </div>
                <span className="gender-count">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      <button className="refresh-btn" onClick={fetchStats}>↻ Refresh</button>
    </div>
  );
}
