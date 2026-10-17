# SHIELD Prototype — Backend

AI-based early-warning system for uniformed-forces personnel welfare (SIH26186).
Self-report + duty/workload data → personal baseline → LightGBM risk engine →
TreeSHAP explanation → Welfare Officer review → human decides support action.
Separately: divergence between objective strain and self-report → **Welfare
Review Flag** (never "lie detection").

## Run it

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then call `POST /demo/seed` once (see below) before anything else — it wipes
the DB, generates the synthetic population, trains the model, and scores
everyone. Interactive API docs (Swagger UI) are auto-served at
`http://localhost:8000/docs` — open that in a browser to try every endpoint
by hand before wiring up the frontend.

## What's real vs. simplified in this build

**Real and actually enforced:**
- A genuinely trained LightGBM classifier + TreeSHAP explanations (not hard-coded).
- k-anonymity (k≥5) enforced **server-side in SQL**, not hidden in the frontend.
  A client cannot get individual data through the commander endpoint no matter
  what it requests — try `/commander/analytics?unit_id=ALPHA&sub_unit_id=A1`
  (only 4 people) and it returns `SUPPRESSED`, not partial data.
- Personal rolling baseline computed from real historical rows (not a fixed
  universal threshold), with a labelled fallback for new/"formative" personnel.
- The Welfare Review Flag is a transparent, explainable rule (strain index vs.
  wellbeing index), kept deliberately separate from the ML risk score.

**Deliberately simplified for this round — say so if asked, don't hide it:**
- No JWT / password hashing / RBAC middleware. The frontend passes `user_id`
  and role directly. Real deployment would add proper auth — that's a stated
  roadmap item, not a claimed feature.
- No AES-256 field encryption or HMAC audit-log chaining in this build.
- No offline/IndexedDB sync in this build.
- CORS is wide open (`*`) — fine for a local demo, not for production.
- All data is synthetic (fixed random seed `26186`, reproducible). This is
  explicitly **not** real personnel data and the system makes no clinical
  validation claim.

## Data model (SQLite, file `shield.db`, created on first seed)

- `users` — id, service_number, full_name, role (`PERSONNEL` / `WELFARE_OFFICER`
  / `COMMANDER`), unit_id, sub_unit_id
- `duty_records` — objective data: duty_hours, rest_gap_hours, consecutive_days,
  workload_intensity
- `checkins` — self-report: energy, sleep_quality, mental_fatigue, readiness
  (all 1–5)
- `risk_assessments` — risk_level, risk_score, welfare_review_flag,
  divergence_reason, top_factors_json (TreeSHAP top-3)
- `welfare_cases` — officer actions/follow-ups

Demo world: 3 units (ALPHA / BRAVO / CHARLIE), 2 sub-units each. Sub-unit
sizes are deliberately mixed above/below 5 (A1=4, C1=3 are **below** k=5 on
purpose) so the suppression rule has something to demonstrate live.

---

## API Reference (for the frontend build)

Base URL: `http://localhost:8000`. All responses are JSON.

### `GET /health`
Returns `{status, seeded}`. Use on frontend load to check if seeding is needed.

### `POST /demo/seed`
Resets everything and regenerates the demo world. Call once at app start (or
add a "Reset Demo" button). Returns `{status, personnel_count, units, training_rows}`.

### `GET /users?role=&unit_id=`
List users, both optional filters. Use this to populate a **role/account
switcher** for the demo (no real login) — e.g. dropdown of Personnel /
Welfare Officer / Commander accounts per unit.
Returns array of `{id, service_number, full_name, role, unit_id, sub_unit_id}`.

### `GET /personnel/{user_id}/history`
Full history for one person — duty records, checkins, and every past risk
assessment. Use for the **Personnel "My Baseline" trend screen** (line chart
of energy/sleep/fatigue/readiness over time).

### `POST /personnel/{user_id}/checkin`
Submit a new day's data (this is the **daily check-in form** — sliders in
the UI). Body:
```json
{
  "duty_hours": 9.5, "rest_gap_hours": 6.0, "consecutive_days": 5,
  "workload_intensity": 3.2,
  "energy": 3, "sleep_quality": 2, "mental_fatigue": 4, "readiness": 3
}
```
Returns the freshly computed assessment: `{risk_level, risk_score,
welfare_review_flag, divergence_reason, top_factors}`. Good for a live "submit
and watch the risk score respond" demo moment.

### `GET /welfare/roster?unit_id=ALPHA`
The **Welfare Officer triage table** — every person in the unit with their
latest risk_level/score/flag, sorted highest-risk first. Fields: `user_id,
service_number, full_name, sub_unit_id, risk_level, risk_score,
welfare_review_flag, last_assessment_date`.

### `GET /welfare/case/{user_id}`
The **Welfare Officer case-detail drawer**: latest assessment, top_factors
(SHAP), full risk/checkin/duty history (for the "objective strain vs.
self-report" comparison chart), and any logged welfare_cases.

### `POST /welfare/action`
Officer logs a support action. Body:
```json
{"user_id": "...", "officer_id": "...", "action_type": "COUNSELING_SESSION",
 "notes": "...", "follow_up_date": "2026-09-20"}
```
`action_type` is a free string in this build — suggested UI options: `REST_RECOMMENDATION`,
`DUTY_REALLOCATION`, `COUNSELING_SESSION`, `ROUTINE_CHECK`.

### `GET /commander/subunits?unit_id=ALPHA`
Lists sub-units with personnel counts and whether each meets k-anonymity —
use this to **grey out / label small sub-units in the commander's selector
before they even query analytics** (nice UX touch, matches scenario 4/5 in
the pitch).

### `GET /commander/analytics?unit_id=ALPHA&sub_unit_id=A1` (sub_unit_id optional)
The **Commander dashboard**. Two possible shapes:
```json
{"status": "SUPPRESSED", "cohort_size": 4, "min_required_k": 5, "message": "...", "metrics": null}
```
```json
{"status": "AUTHORIZED", "cohort_size": 9,
 "metrics": {"avg_risk_score": 0.43, "pct_elevated": 22.2,
             "welfare_review_flags": 2, "readiness_index": 57.3}}
```
Frontend must branch on `status` and show the suppression message when
`SUPPRESSED` — never attempt to show partial data.

---

## Suggested screens (3 roles)

1. **Personnel:** account switcher → check-in form (4 sliders) → submit →
   show returned risk_level/score inline → "My Baseline" trend chart from
   `/personnel/{id}/history`.
2. **Welfare Officer:** roster table (`/welfare/roster`) sorted by risk →
   click a row → case detail drawer (`/welfare/case/{id}`) with SHAP factors
   + strain-vs-wellbeing chart → action form (`/welfare/action`).
3. **Commander:** unit selector → sub-unit selector (greyed out below k=5,
   from `/commander/subunits`) → aggregate cards (`/commander/analytics`) →
   a demo card showing the *raw* SUPPRESSED response when a small sub-unit
   is picked, so judges can see the guardrail firing.

Recommended demo flow: seed → show Commander view on a small sub-unit
(SUPPRESSED) → same unit's large sub-unit (AUTHORIZED, aggregate only) →
Welfare Officer roster → open a flagged case, show the divergence reasoning
→ submit a live bad-day check-in for someone and watch the score move.
