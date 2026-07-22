# ⚕️ MedNova AI

> **Multi-Agent Medical Intelligence Platform** | Python Flask + React.js  
> Built by [waleed671](https://github.com/waleed671)

---

> ⚠️ **Disclaimer:** This project is for **educational and demonstration purposes only**.  
> It is **NOT** a substitute for professional medical advice, diagnosis, or treatment.  
> Always consult a licensed physician for any medical concerns.

---

## ✨ Features

### 🤖 Multi-Agent AI Architecture
- **SymptomAgent** — NLP-based symptom matching across 46+ symptoms
- **VitalsAgent** — Real-time vital signs analysis with status levels
- **XAIAgent** — Explainable AI with factor weights & radar chart
- **RecommendationAgent** — Urgency-based clinical recommendations

### 🩺 AI Diagnosis
- 46+ symptoms mapped across 10+ body systems
- Possible conditions with confidence scoring & probability bars
- Urgency levels: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low
- Affected body systems identification

### 📊 Vital Signs Monitor
| Vital Sign | Normal Range | Status Levels |
|---|---|---|
| Blood Pressure | 90/60 – 120/80 mmHg | Normal / Elevated / High / Critical |
| Heart Rate | 60 – 100 bpm | Normal / Tachycardia / Bradycardia |
| Temperature | 36.1 – 37.2 °C | Normal / Fever / High Fever |
| SpO₂ | ≥ 95% | Normal / Low / Critical |
| Blood Sugar | 70 – 180 mg/dL | Normal / High / Low / Critical |

### 🤖 Nova — AI Copilot
- Medical Q&A chatbot with 15+ condition knowledge base
- Typing indicators, suggestion chips, session history
- Emergency detection & routing

### 🎙️ Voice-to-Text Input
- Web Speech API integration
- Real-time animated waveform visualization
- Auto-fill symptom field from voice transcript

### 🖼️ Medical Image Analysis
- X-Ray, MRI, ECG, Ultrasound simulation
- AI confidence ring visualization
- Findings list + clinical impression

### 🔬 Explainable AI (XAI) Dashboard
- Health score ring chart
- Factor weight bar chart
- Radar chart (SVG)
- Differential diagnosis grid

### 📄 PDF Report Generator
- Full clinical report generation
- Download as .txt / Print
- Patient summary with urgency badge

### 📈 Analytics Dashboard
- KPI cards (Total Patients, Avg Age, Top Condition)
- Urgency distribution bars
- Top diagnosed conditions chart
- Gender distribution

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.8+, Flask, Flask-CORS |
| Frontend | React.js 19, CSS3, Canvas API |
| Analysis | Custom 4-Agent NLP Engine |
| UI Style | Glassmorphism 2.0, Dark Navy Theme, Aurora BG |
| Auth | Token-based session auth |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm

### 1. Clone the repository
```bash
git clone https://github.com/waleed671/MedNova-AI.git
cd MedNova-AI
```

### 2. Backend Setup
```bash
cd backend
pip install flask flask-cors
python app.py
```
Backend runs on → `http://127.0.0.1:5000`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```
Frontend runs on → `http://localhost:3000`

### 4. Demo Login
```
Username: demo
Password: demo123
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login / auto-register |
| POST | `/auth/register` | Register new user |
| POST | `/diagnose` | Multi-agent symptom analysis |
| GET | `/patients` | All patient records |
| DELETE | `/patients` | Clear all records |
| GET | `/stats` | Analytics & statistics |
| POST | `/copilot/chat` | Nova AI Copilot chat |
| POST | `/image/analyze` | Medical image analysis |
| POST | `/report/generate` | Generate PDF report |
| GET | `/symptoms-list` | All 46+ supported symptoms |

---

## 📁 Project Structure

```
MedNova-AI/
├── backend/
│   └── app.py                    # Flask API + 4-Agent Medical Engine
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js                # Main App + Sidebar Layout
│   │   ├── App.css               # Complete UI Styles
│   │   ├── index.css             # Global Styles + Variables
│   │   ├── index.js
│   │   └── components/
│   │       ├── AuthPage.js       # Login / Register
│   │       ├── AuroraBackground.js  # Animated Neural Canvas
│   │       ├── CopilotChat.js    # Nova AI Chat
│   │       ├── VoiceInput.js     # Voice-to-Text
│   │       ├── ImageAnalysis.js  # Medical Imaging AI
│   │       ├── XAIDashboard.js   # Explainable AI
│   │       ├── PDFReport.js      # Report Generator
│   │       └── Analytics.js      # Analytics Dashboard
│   └── package.json
└── README.md
```

---

## 🎨 UI Highlights

- **Dark Navy Theme** — Deep `#070c18` background with indigo/violet gradients
- **Aurora Background** — 80-node animated neural particle canvas
- **Sidebar Navigation** — Fixed left sidebar with active state indicators
- **Glassmorphism 2.0** — Frosted glass cards with backdrop blur
- **Smooth Animations** — slideUp, cardIn, pulseGlow transitions
- **Fully Responsive** — Mobile & tablet friendly

---

## 📜 License

MIT License — feel free to use, modify, and distribute.

---

Built with ❤️ by **Waleed Asif** | MedNova AI © 2026
