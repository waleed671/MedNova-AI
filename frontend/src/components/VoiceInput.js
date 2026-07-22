import React, { useState, useRef, useCallback, useEffect } from "react";

export default function VoiceInput({ onTranscript }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [barHeights, setBarHeights] = useState(() => Array(28).fill(3));
  const [supported] = useState(
    () => "webkitSpeechRecognition" in window || "SpeechRecognition" in window
  );
  const recognitionRef = useRef(null);
  const animFrameRef = useRef(null);

  // Animate bars while listening
  useEffect(() => {
    if (listening) {
      const tick = () => {
        setBarHeights(
          Array.from({ length: 28 }, () => Math.random() * 36 + 4)
        );
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(animFrameRef.current);
      setBarHeights(Array(28).fill(3));
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [listening]);

  const startListening = useCallback(() => {
    if (!supported) {
      setError("Speech recognition requires Chrome or Edge.");
      return;
    }
    setError("");
    setInterim("");
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => setListening(true);

    rec.onresult = (e) => {
      let finalPart = "";
      let interimPart = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalPart += t;
        else interimPart += t;
      }
      if (finalPart) {
        setTranscript((prev) => (prev ? prev + " " + finalPart.trim() : finalPart.trim()));
        setInterim("");
      } else {
        setInterim(interimPart);
      }
    };

    rec.onerror = (e) => {
      setError("Microphone error: " + e.error);
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = rec;
    rec.start();
  }, [supported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  const useText = () => {
    const full = [transcript, interim].filter(Boolean).join(" ").trim();
    if (full) {
      onTranscript(full);
      setTranscript("");
      setInterim("");
    }
  };

  const clearAll = () => {
    setTranscript("");
    setInterim("");
    setError("");
  };

  const displayText = [transcript, interim].filter(Boolean).join(" ").trim();

  return (
    <div className="voice-panel">
      {/* Header */}
      <div className="voice-header">
        <span className="voice-icon">🎙</span>
        <div>
          <p className="voice-title">Voice-to-Text Symptom Input</p>
          <p className="voice-sub">
            Speak your symptoms naturally — AI will transcribe and analyze
          </p>
        </div>
      </div>

      {!supported && (
        <div className="voice-unsupported">
          ⚠ Speech recognition requires Chrome or Edge. Please use a supported browser.
        </div>
      )}

      {/* Controls + waveform */}
      <div className="voice-controls">
        <button
          className={`voice-btn ${listening ? "recording" : ""}`}
          onClick={listening ? stopListening : startListening}
          disabled={!supported}
        >
          <div className="voice-btn-inner">{listening ? "⏹" : "🎤"}</div>
          <span>{listening ? "Stop Recording" : "Start Recording"}</span>
        </button>

        {/* Animated waveform bars */}
        <div className="voice-waveform">
          {barHeights.map((h, i) => (
            <div
              key={i}
              className={`wave-bar ${listening ? "active" : ""}`}
              style={{
                height: `${h}px`,
                animationDelay: `${i * 0.04}s`,
                background: listening
                  ? `hsl(${160 + i * 3}, 80%, 60%)`
                  : "rgba(255,255,255,0.1)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Transcript */}
      {(displayText || listening) && (
        <div className="voice-transcript">
          <div className="transcript-header">
            <span className="transcript-label">📝 Transcribed Text</span>
            <button className="transcript-clear" onClick={clearAll}>
              ✕ Clear
            </button>
          </div>
          <p className="transcript-text">
            {displayText || (
              <span style={{ opacity: 0.4, fontStyle: "italic" }}>Listening…</span>
            )}
          </p>
          {displayText && (
            <button className="use-transcript-btn" onClick={useText}>
              <span>✓</span> Use as Symptoms Input
            </button>
          )}
        </div>
      )}

      {error && <div className="voice-error">⚠ {error}</div>}

      {/* Tips */}
      <div className="voice-tips">
        <p className="tips-title">💡 Speaking Tips</p>
        <ul className="tips-list">
          <li>Speak clearly and at a moderate pace</li>
          <li>Separate symptoms with "and" or natural pauses</li>
          <li>Example: "I have chest pain and shortness of breath and fever"</li>
          <li>Click "Use as Symptoms" to auto-fill the diagnosis form</li>
          <li>Works best in Chrome or Edge browsers</li>
        </ul>
      </div>
    </div>
  );
}
