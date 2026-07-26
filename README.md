# datathon2026 - KSP Crime Intelligence Platform

An AI-powered Crime Analytics & Conversational Intelligence Platform developed for Karnataka State Police (KSP).

## Key Capabilities

1. **Conversational AI Querying Engine**: Natural language interface supporting English and Kannada with automatic SQL translation and execution.
2. **Interactive Offender Network Analysis**: Force-directed graph visualization linking FIR cases, accused individuals, victims, and financial transactions.
3. **Hotspot & Socio-Demographic Analytics**: Spatial crime density analysis correlated with district urbanization, migration, literacy, and unemployment indices.
4. **Predictive Crime Forecasting**: Time series forecasting (ARIMA / seasonal trend analysis) predicting crime occurrences across districts.
5. **Decision Support & Case Investigation**: Automated case timeline generation, key entity identification, and actionable lead recommendations.
6. **Early Warning Alert System**: Anomaly detection engine highlighting sudden spikes in high-risk crime categories.
7. **Case Similarity Engine**: NLP-driven modus operandi (MO) vector pattern matching to discover related prior cases.
8. **Role-Based Access Control (RBAC)**: Secure multi-tier permissions (`Investigator`, `Analyst`, `Supervisor`, `Policymaker`) with automatic PII data masking.

---

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, SQLite/PostgreSQL, SlowAPI, PyJWT, PyOTP, Scikit-learn, SentenceTransformers
- **Frontend**: React, TypeScript, Vite, TailwindCSS, Lucide Icons, Recharts, Vis-Network
- **Infrastructure**: Docker, Docker Compose, Catalyst Functions

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### Setup Backend
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python seed_db.py
python main.py
```

### Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Testing & Verification
```bash
# Verify Auth
python backend/verify_auth.py

# Verify RBAC
python backend/verify_rbac.py

# Verify Seed Data
python backend/verify_seed.py

# Run API Tests
python backend/test_app_main.py
```
