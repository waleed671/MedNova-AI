from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
from collections import Counter
import re, hashlib, secrets, random

app = Flask(__name__)
CORS(app)

# ═══════════════════════════════════════════════════════
#   MEDNOVA AI  ·  MULTI-AGENT MEDICAL INTELLIGENCE  v4.0
#   ⚠ DISCLAIMER: For educational/demo purposes only.
#   Not a substitute for professional medical advice.
# ═══════════════════════════════════════════════════════

# ── In-memory stores (production: PostgreSQL) ──────────
users_db      = {}
sessions_db   = {}
patient_records = []
chat_history  = {}

# ── Auth helpers ───────────────────────────────────────
def hash_pw(pw):  return hashlib.sha256(pw.encode()).hexdigest()
def new_token():  return secrets.token_hex(32)
def get_user(req):
    t = req.headers.get("Authorization","").replace("Bearer ","")
    return sessions_db.get(t)

# ── Auth routes ────────────────────────────────────────
@app.route('/auth/register', methods=['POST'])
def register():
    d = request.json or {}
    u, p, e, n = (d.get(k,"").strip() for k in ("username","password","email","name"))
    if not u or not p or not e:
        return jsonify({"error":"Username, email and password required"}), 400
    if u in users_db:
        return jsonify({"error":"Username already exists"}), 409
    users_db[u] = dict(username=u, password=hash_pw(p), email=e,
                       name=n or u, role="doctor",
                       created_at=datetime.now().isoformat(),
                       avatar=u[0].upper())
    t = new_token(); sessions_db[t] = u
    return jsonify({"status":"success","token":t,"user":{
        "username":u,"name":users_db[u]["name"],"email":e,"role":"doctor","avatar":u[0].upper()}})

@app.route('/auth/login', methods=['POST'])
def login():
    d = request.json or {}
    u, p = d.get("username","").strip(), d.get("password","")
    if not u: return jsonify({"error":"Username required"}), 400
    if u not in users_db:
        # Auto-create on first login (demo mode)
        users_db[u] = dict(username=u, password=hash_pw(p),
                           email=f"{u}@mednova.ai", name=u.title(),
                           role="doctor", created_at=datetime.now().isoformat(),
                           avatar=u[0].upper() if u else "D")
    elif users_db[u]["password"] != hash_pw(p):
        return jsonify({"error":"Invalid credentials"}), 401
    t = new_token(); sessions_db[t] = u
    usr = users_db[u]
    return jsonify({"status":"success","token":t,"user":{
        "username":u,"name":usr["name"],"email":usr["email"],
        "role":usr["role"],"avatar":usr["avatar"]}})

@app.route('/auth/logout', methods=['POST'])
def logout():
    t = request.headers.get("Authorization","").replace("Bearer ","")
    sessions_db.pop(t, None)
    return jsonify({"status":"success"})

@app.route('/auth/me', methods=['GET'])
def me():
    u = get_user(request)
    if not u: return jsonify({"error":"Unauthorized"}), 401
    usr = users_db.get(u, {})
    return jsonify({"status":"success","user":{
        "username":u,"name":usr.get("name",u),
        "email":usr.get("email",""),"role":usr.get("role","doctor"),
        "avatar":usr.get("avatar","D")}})

# ── Symptom database ────────────────────────────────────
SYMPTOM_DB = {
    "chest pain":           {"conditions":["Angina","Heart Attack","GERD","Costochondritis"],           "urgency":"critical","system":"Cardiovascular"},
    "chest tightness":      {"conditions":["Angina","Asthma","Anxiety Disorder"],                        "urgency":"high",    "system":"Cardiovascular"},
    "palpitations":         {"conditions":["Arrhythmia","Anxiety","Hyperthyroidism"],                    "urgency":"medium",  "system":"Cardiovascular"},
    "shortness of breath":  {"conditions":["Asthma","Heart Failure","Pneumonia","Anemia"],               "urgency":"high",    "system":"Respiratory"},
    "rapid heartbeat":      {"conditions":["Tachycardia","Anxiety","Fever","Anemia"],                    "urgency":"high",    "system":"Cardiovascular"},
    "cough":                {"conditions":["Common Cold","Bronchitis","Asthma","COVID-19"],               "urgency":"low",     "system":"Respiratory"},
    "dry cough":            {"conditions":["COVID-19","Asthma","GERD"],                                  "urgency":"medium",  "system":"Respiratory"},
    "wheezing":             {"conditions":["Asthma","COPD","Bronchitis"],                                "urgency":"medium",  "system":"Respiratory"},
    "sore throat":          {"conditions":["Pharyngitis","Tonsillitis","Strep Throat"],                  "urgency":"low",     "system":"ENT"},
    "runny nose":           {"conditions":["Common Cold","Allergic Rhinitis","Sinusitis"],               "urgency":"low",     "system":"ENT"},
    "headache":             {"conditions":["Tension Headache","Migraine","Hypertension","Dehydration"],  "urgency":"low",     "system":"Neurological"},
    "severe headache":      {"conditions":["Migraine","Hypertensive Crisis","Meningitis"],               "urgency":"critical","system":"Neurological"},
    "dizziness":            {"conditions":["Vertigo","Hypotension","Anemia"],                            "urgency":"medium",  "system":"Neurological"},
    "numbness":             {"conditions":["Peripheral Neuropathy","Stroke","Multiple Sclerosis"],       "urgency":"high",    "system":"Neurological"},
    "seizure":              {"conditions":["Epilepsy","Febrile Seizure","Hypoglycemia"],                 "urgency":"critical","system":"Neurological"},
    "confusion":            {"conditions":["Delirium","Stroke","Hypoglycemia","Encephalitis"],           "urgency":"critical","system":"Neurological"},
    "memory loss":          {"conditions":["Dementia","Alzheimer's","Depression"],                       "urgency":"medium",  "system":"Neurological"},
    "tremors":              {"conditions":["Parkinson's Disease","Essential Tremor","Hyperthyroidism"],  "urgency":"medium",  "system":"Neurological"},
    "nausea":               {"conditions":["Gastritis","Food Poisoning","Pregnancy","Migraine"],         "urgency":"low",     "system":"Gastrointestinal"},
    "vomiting":             {"conditions":["Gastroenteritis","Food Poisoning","Appendicitis"],           "urgency":"medium",  "system":"Gastrointestinal"},
    "abdominal pain":       {"conditions":["Appendicitis","Gastritis","IBS","Kidney Stone"],             "urgency":"medium",  "system":"Gastrointestinal"},
    "severe abdominal pain":{"conditions":["Appendicitis","Perforated Ulcer","Pancreatitis"],            "urgency":"critical","system":"Gastrointestinal"},
    "diarrhea":             {"conditions":["Gastroenteritis","IBS","Food Poisoning"],                    "urgency":"low",     "system":"Gastrointestinal"},
    "constipation":         {"conditions":["IBS","Hypothyroidism","Dehydration"],                       "urgency":"low",     "system":"Gastrointestinal"},
    "heartburn":            {"conditions":["GERD","Peptic Ulcer","Hiatal Hernia"],                      "urgency":"low",     "system":"Gastrointestinal"},
    "jaundice":             {"conditions":["Hepatitis","Gallstones","Liver Disease"],                    "urgency":"high",    "system":"Hepatic"},
    "joint pain":           {"conditions":["Arthritis","Gout","Lupus","Lyme Disease"],                  "urgency":"low",     "system":"Musculoskeletal"},
    "back pain":            {"conditions":["Lumbar Strain","Herniated Disc","Kidney Infection"],         "urgency":"low",     "system":"Musculoskeletal"},
    "muscle weakness":      {"conditions":["Myopathy","Multiple Sclerosis","ALS"],                      "urgency":"medium",  "system":"Musculoskeletal"},
    "rash":                 {"conditions":["Allergic Reaction","Eczema","Psoriasis"],                   "urgency":"low",     "system":"Dermatological"},
    "hives":                {"conditions":["Allergic Reaction","Urticaria","Angioedema"],               "urgency":"medium",  "system":"Dermatological"},
    "fever":                {"conditions":["Infection","COVID-19","Influenza","UTI"],                   "urgency":"medium",  "system":"General"},
    "high fever":           {"conditions":["Sepsis","Meningitis","Severe Infection"],                   "urgency":"critical","system":"General"},
    "fatigue":              {"conditions":["Anemia","Hypothyroidism","Depression","Diabetes"],          "urgency":"low",     "system":"General"},
    "weight loss":          {"conditions":["Diabetes","Cancer","Hyperthyroidism","Depression"],         "urgency":"medium",  "system":"General"},
    "night sweats":         {"conditions":["Tuberculosis","Lymphoma","Menopause"],                      "urgency":"medium",  "system":"General"},
    "excessive thirst":     {"conditions":["Diabetes Mellitus","Diabetes Insipidus"],                   "urgency":"medium",  "system":"Endocrine"},
    "frequent urination":   {"conditions":["Diabetes","UTI","Overactive Bladder"],                     "urgency":"low",     "system":"Urological"},
    "swelling":             {"conditions":["Heart Failure","Kidney Disease","Deep Vein Thrombosis"],    "urgency":"medium",  "system":"General"},
    "vision changes":       {"conditions":["Glaucoma","Cataracts","Diabetic Retinopathy"],              "urgency":"high",    "system":"Ophthalmological"},
    "eye pain":             {"conditions":["Glaucoma","Conjunctivitis","Uveitis"],                      "urgency":"high",    "system":"Ophthalmological"},
    "pale skin":            {"conditions":["Anemia","Shock","Hypotension"],                             "urgency":"medium",  "system":"Hematological"},
    "swollen joints":       {"conditions":["Rheumatoid Arthritis","Gout","Septic Arthritis"],           "urgency":"medium",  "system":"Musculoskeletal"},
    "loss of appetite":     {"conditions":["Depression","Cancer","Hepatitis"],                          "urgency":"medium",  "system":"General"},
    "weight gain":          {"conditions":["Hypothyroidism","Cushing's Syndrome","PCOS"],               "urgency":"low",     "system":"Endocrine"},
}

# ── Vitals analysis ────────────────────────────────────
def analyze_vitals(vitals):
    issues, recs = [], []
    bp = vitals.get("blood_pressure","")
    if bp:
        try:
            sys_v, dia_v = map(int, bp.strip().split("/"))
            if sys_v>=180 or dia_v>=120:
                issues.append({"vital":"Blood Pressure","value":bp,"status":"critical","note":"Hypertensive Crisis — seek emergency care immediately"})
            elif sys_v>=140 or dia_v>=90:
                issues.append({"vital":"Blood Pressure","value":bp,"status":"high","note":"Stage 2 Hypertension"})
                recs.append("Monitor BP every 15 min, reduce sodium, consult physician")
            elif sys_v>=130 or dia_v>=80:
                issues.append({"vital":"Blood Pressure","value":bp,"status":"elevated","note":"Stage 1 Hypertension"})
                recs.append("Lifestyle changes: exercise, DASH diet, reduce stress")
            elif sys_v<90 or dia_v<60:
                issues.append({"vital":"Blood Pressure","value":bp,"status":"low","note":"Hypotension — risk of fainting"})
                recs.append("Increase fluid intake, rise slowly from seated position")
            else:
                issues.append({"vital":"Blood Pressure","value":bp,"status":"normal","note":"Within normal range (120/80)"})
        except: pass
    hr = vitals.get("heart_rate")
    if hr is not None:
        try:
            hr=int(hr)
            if hr>150:   issues.append({"vital":"Heart Rate","value":f"{hr} bpm","status":"critical","note":"Severe Tachycardia"})
            elif hr>100: issues.append({"vital":"Heart Rate","value":f"{hr} bpm","status":"high","note":"Tachycardia"}); recs.append("Avoid caffeine, check fever/anxiety triggers")
            elif hr<40:  issues.append({"vital":"Heart Rate","value":f"{hr} bpm","status":"critical","note":"Severe Bradycardia"})
            elif hr<60:  issues.append({"vital":"Heart Rate","value":f"{hr} bpm","status":"low","note":"Bradycardia — normal for athletes"})
            else:        issues.append({"vital":"Heart Rate","value":f"{hr} bpm","status":"normal","note":"Normal (60–100 bpm)"})
        except: pass
    temp = vitals.get("temperature")
    if temp is not None:
        try:
            temp=float(temp)
            if temp>=39.5:   issues.append({"vital":"Temperature","value":f"{temp}°C","status":"critical","note":"High Fever — risk of febrile seizure"}); recs.append("Antipyretics, cooling measures, seek attention")
            elif temp>=38.0: issues.append({"vital":"Temperature","value":f"{temp}°C","status":"high","note":"Fever — possible infection"}); recs.append("Rest, hydration, paracetamol if needed")
            elif temp<35.0:  issues.append({"vital":"Temperature","value":f"{temp}°C","status":"low","note":"Hypothermia"})
            else:            issues.append({"vital":"Temperature","value":f"{temp}°C","status":"normal","note":"Normal (36.1–37.2°C)"})
        except: pass
    spo2 = vitals.get("oxygen_saturation")
    if spo2 is not None:
        try:
            spo2=int(spo2)
            if spo2<90:   issues.append({"vital":"SpO₂","value":f"{spo2}%","status":"critical","note":"Severe Hypoxemia — emergency oxygen needed"})
            elif spo2<95: issues.append({"vital":"SpO₂","value":f"{spo2}%","status":"high","note":"Low Oxygen — monitor closely"}); recs.append("Supplemental oxygen, check airway")
            else:         issues.append({"vital":"SpO₂","value":f"{spo2}%","status":"normal","note":"Normal (≥95%)"})
        except: pass
    sugar = vitals.get("blood_sugar")
    if sugar is not None:
        try:
            sugar=int(sugar)
            if sugar>300:   issues.append({"vital":"Blood Sugar","value":f"{sugar} mg/dL","status":"critical","note":"Severe Hyperglycemia — DKA risk"}); recs.append("Insulin therapy, immediate medical attention")
            elif sugar>180: issues.append({"vital":"Blood Sugar","value":f"{sugar} mg/dL","status":"high","note":"Hyperglycemia"}); recs.append("Check insulin dosage, avoid carbohydrates")
            elif sugar<70:  issues.append({"vital":"Blood Sugar","value":f"{sugar} mg/dL","status":"low","note":"Hypoglycemia — give glucose immediately"}); recs.append("15g fast-acting carbs, recheck in 15 min")
            else:           issues.append({"vital":"Blood Sugar","value":f"{sugar} mg/dL","status":"normal","note":"Normal (70–180 mg/dL)"})
        except: pass
    return issues, list(set(recs))

# ── Multi-agent analysis ───────────────────────────────
def match_symptoms(text):
    text = text.lower().strip()
    matched = {}
    for k, v in SYMPTOM_DB.items():
        if k in text: matched[k] = v
    for part in re.split(r"[,;\n]", text):
        part = part.strip()
        for k, v in SYMPTOM_DB.items():
            if k in part and k not in matched: matched[k] = v
    return matched

def overall_urgency(matched, vital_issues):
    order = {"critical":4,"high":3,"medium":2,"low":1}
    best = "low"
    for d in matched.values():
        if order.get(d["urgency"],0) > order.get(best,0): best = d["urgency"]
    for i in vital_issues:
        s = i.get("status","low")
        if s in order and order[s] > order.get(best,0): best = s
    return best

def agent_symptom(raw):
    matched = match_symptoms(raw)
    all_conds = []
    for d in matched.values(): all_conds.extend(d["conditions"])
    freq = Counter(all_conds)
    conditions = [{"condition":c,"mentions":m,"probability":min(round(m/max(len(matched),1)*0.42,2),0.95)}
                  for c,m in freq.most_common(8)]
    systems = list(set(v["system"] for v in matched.values()))
    return {"matched":matched,"conditions":conditions,"systems":systems}

def agent_vitals(vitals):
    issues, recs = analyze_vitals(vitals)
    score = 100
    for i in issues:
        if i["status"]=="critical": score-=25
        elif i["status"]=="high":   score-=15
        elif i["status"]=="elevated":score-=8
        elif i["status"]=="low":    score-=10
    return {"issues":issues,"recommendations":recs,"health_score":max(score,0)}

def agent_xai(matched, conditions, urgency):
    factors = []
    for sym, data in list(matched.items())[:5]:
        factors.append({
            "factor":sym.title(),
            "weight":{"critical":0.95,"high":0.75,"medium":0.55,"low":0.3}.get(data["urgency"],0.3),
            "impact":data["urgency"],
            "system":data["system"],
            "explanation":f"'{sym}' is associated with {', '.join(data['conditions'][:2])}"
        })
    n_systems = len(set(d["system"] for d in matched.values()))
    reasoning = (f"Analysis detected {len(matched)} symptom(s) across {n_systems} body system(s). "
        + {"critical":"Multiple critical indicators — immediate emergency care required.",
           "high":"High-priority symptoms — medical consultation within 24 hours.",
           "medium":"Moderate symptoms — schedule appointment within 3–5 days.",
           "low":"Mild symptoms — monitor and use OTC remedies as needed."}.get(urgency,""))
    return {"factors":factors,"reasoning":reasoning,"confidence":min(len(matched)*0.15+0.4,0.92)}

def agent_recommendations(urgency, age=None):
    base = {
        "critical":["Call emergency services (115) immediately","Do not eat or drink until evaluated","Keep patient calm and still","Note exact time symptoms started"],
        "high":    ["Consult a doctor within 24 hours","Do not drive yourself to hospital","Keep record of all current medications","Have someone stay with the patient"],
        "medium":  ["Schedule appointment within 3–5 days","Maintain a symptom diary with times","Stay hydrated and get adequate rest","Avoid alcohol and tobacco"],
        "low":     ["Rest and drink plenty of fluids","OTC medication may relieve symptoms","Monitor for worsening symptoms","Maintain a healthy diet and sleep schedule"],
    }
    recs = list(base.get(urgency, base["low"]))
    if age and age >= 65 and urgency in ("medium","low"):
        recs.insert(0,"⚠ Age 65+: Consult a doctor within 24 hours even for mild symptoms")
    return recs

# ── Copilot knowledge ──────────────────────────────────
COPILOT_KB = {
    "diabetes":      "Diabetes mellitus is a chronic condition affecting blood sugar regulation. Type 1 involves absent insulin production; Type 2 involves insulin resistance. Management: medication, diet, exercise, blood sugar monitoring.",
    "hypertension":  "Hypertension (BP ≥130/80 mmHg) is a major risk factor for heart disease and stroke. Treatment: lifestyle changes, ACE inhibitors, beta-blockers, diuretics.",
    "asthma":        "Asthma is a chronic respiratory condition causing airway inflammation and bronchoconstriction. Triggers: allergens, exercise, cold air. Treatment: bronchodilators, inhaled corticosteroids.",
    "migraine":      "Migraines are severe recurrent headaches, often with nausea and light sensitivity. Triggers: stress, certain foods, hormonal changes. Treatment: triptans, NSAIDs, preventive medications.",
    "covid":         "COVID-19 (SARS-CoV-2) causes respiratory illness ranging from mild to severe. Symptoms: fever, cough, fatigue, loss of taste/smell. Prevention: vaccination, masking, hand hygiene.",
    "heart attack":  "Myocardial infarction occurs when coronary blood flow is blocked. Symptoms: chest pain, arm/jaw pain, shortness of breath, sweating. CALL 115 IMMEDIATELY.",
    "stroke":        "Stroke occurs when blood supply to the brain is interrupted. FAST: Face drooping, Arm weakness, Speech difficulty, Time to call 115. Every minute counts.",
    "pneumonia":     "Pneumonia is lung inflammation from infection. Symptoms: fever, cough, chest pain, difficulty breathing. Treatment: antibiotics (bacterial), rest, fluids.",
    "anxiety":       "Anxiety disorders involve excessive fear/worry. Physical symptoms: palpitations, sweating, trembling. Treatment: CBT, SSRIs, lifestyle changes.",
    "depression":    "Depression is a mood disorder causing persistent sadness and loss of interest. Treatment: psychotherapy, antidepressants, lifestyle modification.",
    "arthritis":     "Arthritis causes joint inflammation and pain. Osteoarthritis is degenerative; rheumatoid is autoimmune. Treatment: NSAIDs, DMARDs, physiotherapy.",
    "anemia":        "Anemia is a reduced red blood cell count causing fatigue, pallor, and shortness of breath. Types: iron-deficiency, B12, folate. Treatment depends on cause.",
    "tuberculosis":  "TB is a bacterial infection primarily affecting the lungs. Symptoms: persistent cough, night sweats, weight loss, fever. Treatment: 6-month antibiotic regimen.",
    "hypo":          "Hypothyroidism is an underactive thyroid causing fatigue, weight gain, cold sensitivity, and depression. Treatment: levothyroxine replacement therapy.",
    "copd":          "COPD is a progressive lung disease (emphysema + bronchitis) causing breathlessness. Risk: smoking. Treatment: bronchodilators, pulmonary rehab, oxygen therapy.",
}

def copilot_respond(message, history=None):
    msg = message.lower()
    for key, info in COPILOT_KB.items():
        if key in msg:
            return f"**{key.title()}**\n\n{info}\n\n*Always consult a licensed physician for personal medical advice.*"
    if any(w in msg for w in ["emergency","chest pain","can't breathe","stroke","heart attack","unconscious","collapse"]):
        return "🚨 **This sounds like a medical emergency!**\n\nPlease **call 115 immediately** or go to the nearest emergency room. Do not wait.\n\nIf the patient is unconscious, begin CPR if trained to do so."
    if any(w in msg for w in ["symptom","feeling","pain","ache","hurt","sick","unwell"]):
        return "I understand you're experiencing symptoms. Please use the **Diagnose** tab to enter your symptoms for a comprehensive AI analysis including possible conditions, urgency level, and recommendations.\n\n*I can answer general medical questions — what would you like to know?*"
    if any(w in msg for w in ["medicine","drug","medication","dose","tablet","pill","prescription"]):
        return "Medication questions are best answered by a licensed pharmacist or physician.\n\nFor specific dosing, drug interactions, or prescriptions — please consult your healthcare provider directly."
    if any(w in msg for w in ["hello","hi","hey","help","start"]):
        return "👋 **Hello! I'm MedNova AI Copilot.**\n\nI can help you with:\n- General medical information\n- Understanding conditions and symptoms\n- Health education and prevention\n- Lab result interpretation (general)\n\nWhat medical question can I help with today?"
    if any(w in msg for w in ["thank","thanks","great","good","awesome"]):
        return "You're welcome! Stay healthy and don't hesitate to ask if you have more questions. Remember — for any serious concerns, always consult a qualified healthcare professional. 🏥"
    return (f"I'm MedNova AI Copilot. You asked: *\"{message[:120]}\"*\n\n"
            "I have knowledge of common medical conditions, symptoms, and health topics. "
            "Could you rephrase your question or ask about a specific condition?\n\n"
            "*For emergencies, always call 115 immediately.*")

# ── Image analysis (simulated) ─────────────────────────
IMAGE_DB = {
    "xray": {
        "modality":"Chest X-Ray",
        "normal":{"findings":["Lung fields clear bilaterally","Cardiac silhouette within normal limits","No pleural effusion","Costophrenic angles sharp","Trachea midline"],"impression":"No acute cardiopulmonary pathology detected","confidence":0.88},
        "abnormal":{"findings":["Increased opacity in right lower lobe","Possible consolidation — pneumonia cannot be excluded","Cardiac silhouette mildly enlarged","Minor pleural thickening noted"],"impression":"Findings suggestive of right lower lobe pneumonia. Clinical correlation recommended.","confidence":0.78,"alert":"Follow-up imaging in 4–6 weeks recommended"},
    },
    "mri": {
        "modality":"Brain MRI",
        "normal":{"findings":["No intracranial hemorrhage","White matter appears intact","No space-occupying lesions","Ventricles normal in size","Brain parenchyma unremarkable"],"impression":"Normal brain MRI — no acute abnormalities","confidence":0.91},
        "abnormal":{"findings":["Small area of T2 hyperintensity in left parietal white matter","No mass effect or midline shift","Mild cerebral atrophy noted","Vessels appear patent"],"impression":"Non-specific white matter change; recommend clinical correlation and follow-up MRI in 6 months.","confidence":0.74,"alert":"Neurology review recommended"},
    },
    "ecg": {
        "modality":"ECG / EKG",
        "normal":{"findings":["Normal sinus rhythm at 72 bpm","PR interval 160ms (normal)","QRS duration 90ms (normal)","QT interval 380ms (normal)","No ST-segment changes"],"impression":"Normal 12-lead ECG tracing","confidence":0.94},
        "abnormal":{"findings":["ST-segment depression in leads V4–V6","T-wave inversion in lateral leads","Heart rate 98 bpm","QRS axis normal","No significant Q waves"],"impression":"ECG changes suggestive of lateral ischaemia. Urgent cardiology review recommended.","confidence":0.82,"alert":"Urgent cardiology review recommended"},
    },
    "ultrasound": {
        "modality":"Abdominal Ultrasound",
        "normal":{"findings":["Liver normal in size and echogenicity","Gallbladder: no stones or wall thickening","Kidneys bilateral, normal size","No free fluid","Spleen within normal limits"],"impression":"Normal abdominal ultrasound","confidence":0.84},
        "abnormal":{"findings":["Gallbladder contains multiple echogenic foci with posterior acoustic shadowing","Common bile duct mildly dilated at 9mm","Liver normal","No free fluid in abdomen"],"impression":"Cholelithiasis (gallstones) with mild CBD dilatation. Surgical consultation recommended.","confidence":0.81,"alert":"Surgical consultation recommended"},
    },
}

def analyze_image(image_type):
    base = IMAGE_DB.get(image_type.lower(), IMAGE_DB["xray"])
    variant = "abnormal" if random.random() > 0.55 else "normal"
    result = dict(base[variant])
    result["modality"]    = base["modality"]
    result["analyzed_at"] = datetime.now().isoformat()
    result["disclaimer"]  = "AI analysis for educational/demo purposes only. Radiologist review required for clinical decisions."
    return result

# ── Main routes ────────────────────────────────────────
@app.route('/')
def home():
    return jsonify({"app":"MedNova AI","version":"4.0","status":"running","year":2026})

@app.route('/diagnose', methods=['POST'])
def diagnose():
    data = request.json
    if not data: return jsonify({"error":"No data provided"}), 400
    patient_name = data.get("patient_name","Anonymous").strip() or "Anonymous"
    symptoms_raw = data.get("symptoms","").strip()
    vitals       = data.get("vitals", {})
    notes        = data.get("notes","").strip()
    gender       = data.get("gender","unknown")
    if not symptoms_raw: return jsonify({"error":"Symptoms are required"}), 400
    try: age = int(data.get("age")) if data.get("age") else None
    except: age = None

    sym    = agent_symptom(symptoms_raw)
    vit    = agent_vitals(vitals)
    urg    = overall_urgency(sym["matched"], vit["issues"])
    xai    = agent_xai(sym["matched"], sym["conditions"], urg)
    recs   = agent_recommendations(urg, age)

    URGENCY_ACTIONS = {
        "critical":"🚨 SEEK EMERGENCY CARE IMMEDIATELY — Call 115 or go to the nearest ER",
        "high":    "⚠️ Consult a doctor within 24 hours — Do not delay treatment",
        "medium":  "📋 Schedule a medical appointment within 3–5 days",
        "low":     "💊 Monitor symptoms — Rest, hydration, and OTC remedies may help",
    }

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    record_id = len(patient_records) + 1

    result = {
        "status":"success", "record_id":record_id, "timestamp":timestamp,
        "disclaimer":"⚠ AI-generated analysis for educational purposes only.",
        "patient":{"name":patient_name,"age":age,"gender":gender},
        "analysis":{
            "symptoms_entered":symptoms_raw,
            "symptoms_recognized":list(sym["matched"].keys()),
            "symptom_count":len(sym["matched"]),
            "recognition_rate":min(round(len(sym["matched"])/max(len(symptoms_raw.split(",")),1)*100),100),
            "affected_systems":sym["systems"],
        },
        "diagnosis":{
            "possible_conditions":sym["conditions"],
            "overall_urgency":urg,
            "urgency_action":URGENCY_ACTIONS.get(urg, URGENCY_ACTIONS["low"]),
            "general_recommendations":recs,
            "vital_recommendations":vit["recommendations"],
        },
        "vitals_analysis":vit["issues"],
        "health_score":vit["health_score"],
        "xai":xai,
        "notes":notes,
        "agents_used":["SymptomAgent","VitalsAgent","XAIAgent","RecommendationAgent"],
    }

    patient_records.append({
        "id":record_id, "timestamp":timestamp,
        "patient_name":patient_name, "age":age, "gender":gender,
        "symptoms_recognized":list(sym["matched"].keys()),
        "possible_conditions":[c["condition"] for c in sym["conditions"][:3]],
        "overall_urgency":urg, "vitals":vitals,
        "health_score":vit["health_score"],
    })
    return jsonify(result)

@app.route('/patients', methods=['GET'])
def get_patients():
    return jsonify({"status":"success","total":len(patient_records),"records":list(reversed(patient_records))})

@app.route('/patients', methods=['DELETE'])
def clear_patients():
    patient_records.clear()
    return jsonify({"status":"success","message":"All records cleared"})

@app.route('/stats', methods=['GET'])
def stats():
    if not patient_records:
        return jsonify({"status":"success","total_patients":0})
    urgency_counts  = Counter(r["overall_urgency"] for r in patient_records)
    gender_counts   = Counter(r["gender"] for r in patient_records)
    all_conditions  = []
    for r in patient_records: all_conditions.extend(r["possible_conditions"])
    top_conds = Counter(all_conditions).most_common(5)
    ages   = [r["age"] for r in patient_records if r.get("age")]
    scores = [r.get("health_score",80) for r in patient_records]
    daily  = {}
    for r in patient_records:
        day = r["timestamp"].split(" ")[0]
        daily[day] = daily.get(day,0) + 1
    return jsonify({
        "status":"success",
        "total_patients":len(patient_records),
        "urgency_distribution":dict(urgency_counts),
        "gender_distribution":dict(gender_counts),
        "top_conditions":[{"condition":c,"count":n} for c,n in top_conds],
        "average_age":round(sum(ages)/len(ages),1) if ages else None,
        "average_health_score":round(sum(scores)/len(scores),1) if scores else None,
        "daily_patients":daily,
    })

@app.route('/symptoms-list', methods=['GET'])
def symptoms_list():
    by_system = {}
    for sym, data in SYMPTOM_DB.items():
        s = data["system"]
        by_system.setdefault(s,[]).append({"symptom":sym,"urgency":data["urgency"]})
    return jsonify({"status":"success","total":len(SYMPTOM_DB),"by_system":by_system})

@app.route('/copilot/chat', methods=['POST'])
def copilot_chat():
    data = request.json or {}
    message    = data.get("message","").strip()
    session_id = data.get("session_id","default")
    if not message: return jsonify({"error":"Message required"}), 400
    chat_history.setdefault(session_id,[])
    chat_history[session_id].append({"role":"user","content":message,"time":datetime.now().isoformat()})
    response = copilot_respond(message, chat_history[session_id])
    chat_history[session_id].append({"role":"assistant","content":response,"time":datetime.now().isoformat()})
    if len(chat_history[session_id]) > 40:
        chat_history[session_id] = chat_history[session_id][-40:]
    return jsonify({"status":"success","response":response,"session_id":session_id})

@app.route('/image/analyze', methods=['POST'])
def image_analyze():
    data = request.json or {}
    image_type = data.get("type","xray")
    return jsonify({"status":"success","analysis":analyze_image(image_type)})

@app.route('/report/generate', methods=['POST'])
def generate_report():
    data       = request.json or {}
    patient    = data.get("patient",{})
    analysis   = data.get("analysis",{})
    diagnosis  = data.get("diagnosis",{})
    timestamp  = data.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    record_id  = data.get("record_id","N/A")

    conditions_text = "\n".join(
        f"  {i+1}. {c['condition']} ({c.get('mentions',1)} signal(s))"
        for i,c in enumerate(diagnosis.get("possible_conditions",[])[:5])
    )
    recs_text = "\n".join(f"  • {r}" for r in diagnosis.get("general_recommendations",[]))

    report = f"""
================================================================================
                         MEDNOVA AI MEDICAL REPORT
                 Multi-Agent Medical Intelligence Platform v4.0
                          Generated: {timestamp}
================================================================================

REPORT ID      : #{record_id}
GENERATED BY   : MedNova AI — 4-Agent Analysis Engine

PATIENT INFORMATION
-------------------
Name           : {patient.get('name','N/A')}
Age            : {patient.get('age','N/A')}
Gender         : {patient.get('gender','N/A')}

CLINICAL ANALYSIS
-----------------
Symptoms Reported   : {analysis.get('symptoms_entered','N/A')}
Symptoms Matched    : {', '.join(analysis.get('symptoms_recognized',[])) or 'None matched'}
Affected Systems    : {', '.join(analysis.get('affected_systems',[])) or 'N/A'}
Recognition Rate    : {analysis.get('recognition_rate','N/A')}%

DIAGNOSIS SUMMARY
-----------------
Urgency Level       : {diagnosis.get('overall_urgency','N/A').upper()}
Action Required     : {diagnosis.get('urgency_action','N/A')}

TOP POSSIBLE CONDITIONS
{conditions_text or '  No conditions identified'}

CLINICAL RECOMMENDATIONS
{recs_text or '  Monitor symptoms and rest'}

================================================================================
⚠ DISCLAIMER
  This is an AI-generated educational report. It does NOT replace professional
  medical diagnosis, advice, or treatment. Always consult a licensed healthcare
  professional for any health concerns.
================================================================================
MedNova AI v4.0  ·  Multi-Agent Medical Intelligence  ·  2026
"""
    return jsonify({"status":"success","report":report.strip(),"timestamp":timestamp})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
