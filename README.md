# SHIELD

**SHIELD** is a Smart India Hackathon 2026 prototype for **SIH26186: AI-Based Predictive Personnel Stress and Welfare Monitoring System for Uniformed Forces**. It explores whether a privacy-aware, explainable early-warning workflow can help welfare staff notice changes in workload and self-reported wellbeing sooner.

> **Prototype status:** This repository is a demonstration, not a deployed or clinically validated system. It uses synthetic data only. Its risk output is not a diagnosis, a prediction of self-harm, or an automated personnel decision. A human welfare officer is expected to review any support signal.

## What the prototype does

- Lets a demo user switch between Personnel, Welfare Officer, and Commander views.
- Collects daily duty information (hours, rest gap, consecutive days, workload intensity) and self-reported energy, sleep quality, mental fatigue, and readiness.
- Compares self-reported values with a rolling personal baseline. The first few observations use a cohort median and are marked formative in the feature pipeline.
- Trains a LightGBM binary classifier on generated examples and returns a LOW or ELEVATED risk score with TreeSHAP feature explanations.
- Separately computes a transparent Welfare Review Flag from objective strain and wellbeing indices. The flag is intended to prompt human review; it is not deception detection.
- Gives welfare staff a risk-sorted roster, case history, and a form for recording a support action and follow-up date.
- Shows commanders aggregate unit or sub-unit metrics. The backend suppresses aggregate analytics when the selected cohort contains fewer than five personnel (k=5).

## How the demo process works

1. Start the FastAPI service. On its first visit, the frontend checks `/health` and calls `POST /demo/seed` if the backend has not been seeded.
2. The seed endpoint resets the local SQLite database, creates fictional users across ALPHA, BRAVO, and CHARLIE, and generates 21 days of duty and check-in records for each of 40 fictional personnel.
3. The ML pipeline joins matching duty/check-in days, orders each person's history, builds rolling features, and uses only earlier days for that person's baseline. It trains the LightGBM model on the generated feature table and creates TreeSHAP explanations.
4. The prototype scores each person's latest generated day and saves that initial assessment. New daily submissions create additional records and assessments.
5. A welfare officer can review a case and record a follow-up action. A commander can see cohort aggregates only when the cohort meets the server-side k=5 threshold.

Synthetic profiles are generated to demonstrate stable patterns, escalating strain, and divergence between objective workload and self-report. Training labels are also generated from synthetic strain values with added randomness. Scores are therefore a demonstration of the software pipeline, not evidence of real-world predictive accuracy.

## Implemented prototype vs. proposed development

| Area | In this codebase | Proposed / future work |
|---|---|---|
| Data | Reproducible synthetic data; no real personnel records | Carefully governed, consented and authorized field validation |
| UI | React web dashboard with role/account switching for demonstration | Evaluate mobile collection; Flutter is mentioned in the proposal |
| API | FastAPI (Python) | Secure integration with approved HR/personnel systems |
| Storage | SQLite database (`SIH/shield.db`) | PostgreSQL or another managed database for a controlled deployment |
| ML | LightGBM binary model and TreeSHAP explanations | Evaluate with domain experts and held-out/longitudinal data; calibrate thresholds and monitor drift |
| Privacy | Commander cohort suppression at k=5; role-specific screens are a UI workflow | Real authentication and server-side authorization (e.g. JWT/RBAC), data minimization and access reviews |
| Security | Local demonstration configuration | Encryption in transit/at rest, key management, and tamper-evident audit logging |
| Signals | Duty records and self-report | Optional wearable/physiological signals only after feasibility, consent, security, and governance review |
| Evaluation | No clinical or operational validation | Authorized pilot, subgroup analysis, precision/recall and calibration review, usability and impact evaluation |

The future-work items above are **not implemented features**. In particular, the current build has no authentication or RBAC middleware, no AES-256 field encryption, no HMAC audit chain, and permissive CORS for local development. Do not deploy it with real or sensitive data.

## Technology

**Frontend:** React 18, Vite, JavaScript, Tailwind CSS, Axios, Recharts, and Lucide React.

**Backend:** Python, FastAPI, Uvicorn, Pydantic, SQLite (`sqlite3`), NumPy, pandas, LightGBM, and SHAP/TreeSHAP.

## Project layout

```text
.
├── src/                         # React application and role-based demo views
│   ├── components/              # Personnel, welfare officer, commander, header
│   ├── App.jsx                  # App initialization, role selection, theme
│   └── api.js                   # API client and in-memory mock fallback
├── SIH/
│   ├── main.py                  # FastAPI routes and application workflow
│   ├── ml_pipeline.py           # Feature engineering, training, scoring, SHAP
│   ├── synthetic_data.py        # Synthetic population and timelines
│   ├── database.py              # SQLite schema and connection helpers
│   ├── requirements.txt         # Python dependencies
│   ├── test_api.py              # Manual endpoint walkthrough
│   └── README.md                # Backend-specific API notes
├── package.json                 # Frontend dependencies and scripts
└── index.html                   # Vite entry page
```

## Run locally

Prerequisites: Node.js/npm and Python 3.10+ installed.

### 1. Start the backend

From the project root, open a terminal:

```powershell
cd SIH
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The interactive API documentation is available at `http://localhost:8000/docs`. The frontend seeds the demo database automatically if needed. To seed it manually, send `POST http://localhost:8000/demo/seed`; this **resets** the demo database and regenerates its synthetic data.

### 2. Start the frontend

In a second terminal, from the project root:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`. The frontend also has an in-memory mock fallback when its API requests fail, so a screen may still load without the backend; mock data is separate from the Python backend's generated data and is not persisted.

## API overview

The backend base URL is `http://localhost:8000`.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Backend and seed status |
| `POST` | `/demo/seed` | Reset and regenerate the synthetic demo |
| `GET` | `/users` | List demo users; optional `role` and `unit_id` filters |
| `GET` | `/personnel/{user_id}/history` | Duty, check-in, and risk history for one demo user |
| `POST` | `/personnel/{user_id}/checkin` | Save duty/check-in data and calculate an assessment |
| `GET` | `/welfare/roster?unit_id=ALPHA` | Unit welfare triage roster |
| `GET` | `/welfare/case/{user_id}` | Case detail and history |
| `POST` | `/welfare/action` | Record a support action and follow-up date |
| `GET` | `/commander/subunits?unit_id=ALPHA` | Sub-unit sizes and k=5 eligibility |
| `GET` | `/commander/analytics?unit_id=ALPHA&sub_unit_id=A1` | Suppressed or aggregate analytics response |

See [`SIH/README.md`](SIH/README.md) for request and response examples.

## Demo privacy behavior

The commander analytics endpoint checks cohort size on the server and returns `SUPPRESSED` with no metrics for groups below five. The demo intentionally includes smaller groups to show this behavior. This is a limited prototype safeguard; it does not replace authentication, authorization, or a full privacy threat assessment.

## Limitations

- All generated records and model labels are synthetic; no real force personnel records are included or needed to run the prototype.
- The thresholds and model are not clinically validated and must not be used to make operational, employment, medical, or disciplinary decisions.
- Initial seeding saves the latest generated risk assessment per person; historical daily risk assessments are not backfilled.
- User and role switching is for demonstration only. API endpoints do not enforce the role shown in the frontend.
- CORS currently allows all origins for local demonstration convenience.
- `SIH/test_api.py` is a manual walkthrough that prints responses; it is not a comprehensive automated test suite.

## Contributing / next steps

Useful next steps are to establish a threat model and data governance plan, implement and review authentication/authorization and audit controls, add input validation and automated tests, separate mock and backend behavior clearly in the UI, and design a domain-reviewed validation study before considering any real-data pilot. Any real-data or wearable integration would require appropriate authorization, consent, minimization, retention rules, and security review first.

## Team

- Smart India Hackathon 2026 problem statement: **SIH26186**
- Team: **NEXOTRON** (Team ID **150958**)

### Team roles

- **Frontend development:** Madhushyam, Kishore Kumar
- **Security in-charge:** Poornima
- **Hardware:** Balavisakan, Jegaan
- **Machine learning:** Jegaan , Poornima 
- **Backend development:** Balavisakan, Jegaan, Vidharsana

## License

No license is currently specified. Add a license before accepting reuse or contributions; without one, standard copyright restrictions apply.
