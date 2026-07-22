import React, { useState, useRef } from "react";

const API = "http://127.0.0.1:5000";

const IMAGE_TYPES = [
  { id:"xray",       label:"X-Ray",      icon:"🫁", color:"#06b6d4" },
  { id:"mri",        label:"MRI",        icon:"🧠", color:"#8b5cf6" },
  { id:"ecg",        label:"ECG",        icon:"💓", color:"#10b981" },
  { id:"ultrasound", label:"Ultrasound", icon:"📡", color:"#f59e0b" },
];

export default function ImageAnalysis({ token }) {
  const [activeType, setActiveType]     = useState("xray");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [analysis, setAnalysis]         = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [dragOver, setDragOver]         = useState(false);
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload a valid image file (JPEG or PNG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setUploadedImage(e.target.result);
    reader.readAsDataURL(file);
    setAnalysis(null); setError("");
  };

  const analyze = async () => {
    setLoading(true); setError(""); setAnalysis(null);
    try {
      const res  = await fetch(`${API}/image/analyze`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ type: activeType }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (e) {
      setError(e.message || "Analysis failed. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const activeMeta   = IMAGE_TYPES.find((t) => t.id === activeType);
  const confidence   = analysis ? Math.round(analysis.confidence * 100) : 0;
  const circ         = 2 * Math.PI * 34;
  const dashOffset   = circ - (confidence / 100) * circ;
  const confColor    = confidence >= 85 ? "#10b981" : confidence >= 70 ? "#f59e0b" : "#ef4444";

  return (
    <div className="image-wrap">
      {/* Tab buttons — exact screenshot style */}
      <div className="img-type-tabs">
        {IMAGE_TYPES.map((t) => (
          <button
            key={t.id}
            className={`img-tab-btn ${activeType === t.id ? "active" : ""}`}
            onClick={() => { setActiveType(t.id); setAnalysis(null); }}
          >
            <span className="img-tab-dot" style={{
              background: activeType === t.id ? t.color : "rgba(255,255,255,0.18)"
            }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        className="image-upload-area"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current.click()}
        style={{ borderColor: dragOver ? "rgba(99,102,241,0.5)" : undefined }}
      >
        <input ref={fileRef} type="file" accept="image/*"
          style={{ display:"none" }}
          onChange={(e) => handleFile(e.target.files[0])} />
        {uploadedImage ? (
          <img src={uploadedImage} alt="Medical scan" className="uploaded-image" />
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">{activeMeta?.icon || "🖼"}</div>
            <p className="upload-text">Click or drag to upload medical image</p>
            <p className="upload-sub">DICOM, PNG, JPG supported</p>
          </div>
        )}
      </div>

      {error && <div className="img-error">⚠ {error}</div>}

      {/* Analyze button — matches screenshot gradient */}
      <button className="analyze-btn" onClick={analyze} disabled={loading}>
        <span className="btn-shine" />
        <span className="btn-content">
          {loading
            ? <><span className="spinner" /> Analyzing…</>
            : <><span>✨</span> Run AI Analysis</>}
        </span>
      </button>

      {/* Result */}
      {analysis && (
        <div className="analysis-result">
          <div className="analysis-header">
            <div>
              <span className="modality-badge">{analysis.modality}</span>
              {analysis.alert && <div className="alert-badge">⚠ {analysis.alert}</div>}
            </div>
            {/* Confidence ring */}
            <div className="confidence-ring">
              <svg width="76" height="76" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r="34" fill="none"
                  stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                <circle cx="38" cy="38" r="34" fill="none"
                  stroke={confColor} strokeWidth="6"
                  strokeDasharray={circ} strokeDashoffset={dashOffset}
                  strokeLinecap="round" transform="rotate(-90 38 38)"
                  style={{ transition:"stroke-dashoffset 1s ease" }} />
              </svg>
              <div className="confidence-label">
                <span className="conf-val">{confidence}%</span>
                <span className="conf-txt">Confidence</span>
              </div>
            </div>
          </div>

          <div className="findings-section">
            <p className="findings-title">📋 Findings</p>
            <ul className="findings-list">
              {analysis.findings.map((f, i) => (
                <li key={i} className="finding-item">
                  <span className="finding-dot" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="impression-box">
            <p className="impression-label">🩺 Impression</p>
            <p className="impression-text">{analysis.impression}</p>
          </div>

          <p className="analysis-meta">⏱ Analyzed: {new Date(analysis.analyzed_at).toLocaleTimeString()}</p>
          <p className="analysis-disclaimer">{analysis.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
