import React from "react";

const IMPACT_COLORS = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#f59e0b",
  low:      "#10b981",
};

function FactorBar({ factor, index }) {
  const color = IMPACT_COLORS[factor.impact] || "#8b5cf6";
  const pct = Math.round(factor.weight * 100);
  return (
    <div className="xai-factor" style={{ animationDelay: `${index * 0.07}s` }}>
      <div className="xai-factor-top">
        <span className="xai-factor-name">{factor.factor}</span>
        <div className="xai-factor-right">
          <span
            className="xai-system-badge"
            style={{ borderColor: color + "44", color }}
          >
            {factor.system}
          </span>
          <span className="xai-weight" style={{ color }}>
            {pct}%
          </span>
        </div>
      </div>
      <div className="xai-bar-wrap">
        <div
          className="xai-bar-fill"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}bb, ${color})`,
          }}
        />
      </div>
      <p className="xai-factor-explain">{factor.explanation}</p>
    </div>
  );
}

function RadarChart({ factors }) {
  if (!factors || factors.length < 3) return null;
  const size = 200;
  const cx = size / 2, cy = size / 2, r = 72;
  const n = factors.length;
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const point = (i, val) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + r * val * Math.cos(angle),
      y: cy + r * val * Math.sin(angle),
    };
  };

  const dataPoints = factors.map((f, i) => point(i, f.weight));
  const polyline = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="radar-wrap">
      <p className="radar-title">AI Factor Radar</p>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid circles */}
        {gridLevels.map((lvl, i) => (
          <circle
            key={i} cx={cx} cy={cy} r={r * lvl}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"
          />
        ))}
        {/* Axis lines */}
        {factors.map((_, i) => {
          const p = point(i, 1);
          return (
            <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y}
              stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          );
        })}
        {/* Filled polygon */}
        <polygon
          points={polyline}
          fill="rgba(139,92,246,0.15)"
          stroke="#8b5cf6"
          strokeWidth="2"
        />
        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4"
            fill="#8b5cf6" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
        ))}
        {/* Labels */}
        {factors.map((f, i) => {
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
          const lx = cx + (r + 20) * Math.cos(angle);
          const ly = cy + (r + 20) * Math.sin(angle);
          const label = f.factor.length > 9 ? f.factor.slice(0, 8) + "…" : f.factor;
          return (
            <text key={i} x={lx} y={ly}
              textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.42)" fontSize="9"
              fontFamily="Inter, sans-serif">
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function XAIDashboard({ xai, conditions, healthScore }) {
  if (!xai) {
    return (
      <div className="xai-empty">
        <div className="xai-empty-icon">🔬</div>
        <p className="xai-empty-title">No Analysis Yet</p>
        <p className="xai-empty-sub">
          Run a diagnosis first to see the Explainable AI breakdown — factor weights,
          radar chart, confidence scores, and differential diagnosis.
        </p>
      </div>
    );
  }

  const scoreColor =
    healthScore > 70 ? "#10b981" : healthScore > 40 ? "#f59e0b" : "#ef4444";
  const scoreLabel =
    healthScore > 70 ? "Good" : healthScore > 40 ? "Fair" : "At Risk";
  const circ = 2 * Math.PI * 54;
  const dashOffset = circ - ((healthScore || 0) / 100) * circ;

  return (
    <div className="xai-wrap">
      {/* Top row: Health score + Confidence + Radar */}
      <div className="xai-top-row">
        {/* Health Score */}
        <div className="health-score-card">
          <p className="hs-title">Health Score</p>
          <div className="hs-ring-wrap">
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="54" fill="none"
                stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle cx="65" cy="65" r="54" fill="none"
                stroke={scoreColor} strokeWidth="10"
                strokeDasharray={circ} strokeDashoffset={dashOffset}
                strokeLinecap="round" transform="rotate(-90 65 65)"
                style={{ transition: "stroke-dashoffset 1.2s ease" }} />
            </svg>
            <div className="hs-inner">
              <span className="hs-val" style={{ color: scoreColor }}>
                {healthScore}
              </span>
              <span className="hs-unit">/100</span>
            </div>
          </div>
          <p className="hs-label" style={{ color: scoreColor }}>
            {scoreLabel}
          </p>
        </div>

        {/* AI Confidence */}
        <div className="xai-confidence-card">
          <p className="xai-conf-title">AI Confidence</p>
          <p className="xai-conf-val">
            {Math.round((xai.confidence || 0) * 100)}%
          </p>
          <div className="xai-conf-bar-wrap">
            <div
              className="xai-conf-bar"
              style={{ width: `${(xai.confidence || 0) * 100}%` }}
            />
          </div>
          <p className="xai-conf-sub">
            Based on {xai.factors?.length || 0} detected factor
            {xai.factors?.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Radar */}
        {xai.factors?.length >= 3 && <RadarChart factors={xai.factors} />}
      </div>

      {/* AI Reasoning */}
      <div className="xai-reasoning">
        <p className="xai-reasoning-title">🧠 AI Reasoning</p>
        <p className="xai-reasoning-text">{xai.reasoning}</p>
      </div>

      {/* Contributing Factors */}
      {xai.factors?.length > 0 && (
        <div className="xai-factors-section">
          <p className="xai-factors-title">⚖ Contributing Factors</p>
          <div className="xai-factors-list">
            {xai.factors.map((f, i) => (
              <FactorBar key={i} factor={f} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Differential Diagnosis */}
      {conditions?.length > 0 && (
        <div className="xai-conditions">
          <p className="xai-conditions-title">🩺 Differential Diagnosis</p>
          <div className="xai-cond-grid">
            {conditions.slice(0, 6).map((c, i) => {
              const prob = Math.max(
                Math.round((c.probability || Math.max(0.5 - i * 0.07, 0.05)) * 100),
                5
              );
              return (
                <div key={i} className="xai-cond-card"
                  style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="xai-cond-rank">#{i + 1}</div>
                  <p className="xai-cond-name">{c.condition}</p>
                  <div className="xai-cond-prob-wrap">
                    <div
                      className="xai-cond-prob-bar"
                      style={{ width: `${prob}%` }}
                    />
                  </div>
                  <span className="xai-cond-pct">{prob}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="xai-disclaimer">
        ⚠ Explainability data is AI-generated for educational purposes only.
        Not a substitute for professional medical diagnosis.
      </p>
    </div>
  );
}
