"""
SHIELD prototype backend — FastAPI.

Intentional prototype-scope simplifications (say this OUT LOUD if a judge
asks — don't claim otherwise):
  - No JWT / password hashing / RBAC middleware. Frontend passes role +
    user_id directly. Production would add real auth — this is a stated
    roadmap item, not a hidden gap.
  - No AES-256 field encryption / HMAC audit chains in this build.
  - No offline/IndexedDB sync in this build.
  - CORS is wide open (["*"]) for local demo convenience only.

What IS real and actually enforced here:
  - A genuinely trained LightGBM model + TreeSHAP explanations.
  - k-anonymity (k>=5) enforced server-side in the SQL layer, not hidden
    in the frontend — a client cannot get individual data through the
    commander endpoint no matter what it asks for.
  - Personal rolling baseline computed from real historical rows, not
    a fixed universal threshold.
"""
import json
import uuid
import datetime as dt
from typing import Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import init_db, get_conn, row_to_dict
import synthetic_data as sd
import ml_pipeline as mlp

app = FastAPI(title="SHIELD Prototype API", version="0.1.0")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

_state = {"model": None, "explainer": None, "seeded": False}
K_ANON_THRESHOLD = 5


class CheckinIn(BaseModel):
    duty_hours: float
    rest_gap_hours: float
    consecutive_days: int
    workload_intensity: float
    energy: int
    sleep_quality: int
    mental_fatigue: int
    readiness: int
    checkin_date: Optional[str] = None


class WelfareActionIn(BaseModel):
    user_id: str
    officer_id: str
    action_type: str
    notes: str = ""
    follow_up_date: str


def _reason_string(row) -> str:
    return (f"High objective strain (workload {row['workload_intensity_7d']:.1f}/5, "
            f"{int(row['consecutive_days'])} consecutive duty days) alongside a "
            f"self-reported wellbeing index of {row['wellbeing_index']:.2f} that does "
            f"not reflect it.")


@app.get("/health")
def health():
    return {"status": "ok", "seeded": _state["seeded"]}


@app.post("/demo/seed")
def demo_seed():
    init_db(reset=True)
    users = sd.generate_users()
    duty_rows, checkin_rows = sd.generate_duty_and_checkins(users)

    conn = get_conn()
    cur = conn.cursor()
    for u in users:
        cur.execute(
            "INSERT INTO users (id,service_number,full_name,role,unit_id,sub_unit_id) "
            "VALUES (?,?,?,?,?,?)",
            (u["id"], u["service_number"], u["full_name"], u["role"], u["unit_id"], u["sub_unit_id"]),
        )
    for d in duty_rows:
        cur.execute(
            "INSERT INTO duty_records (id,user_id,duty_date,duty_hours,rest_gap_hours,"
            "consecutive_days,workload_intensity) VALUES (?,?,?,?,?,?,?)",
            (d["id"], d["user_id"], d["duty_date"], d["duty_hours"], d["rest_gap_hours"],
             d["consecutive_days"], d["workload_intensity"]),
        )
    for c in checkin_rows:
        cur.execute(
            "INSERT INTO checkins (id,user_id,checkin_date,energy,sleep_quality,"
            "mental_fatigue,readiness) VALUES (?,?,?,?,?,?,?)",
            (c["id"], c["user_id"], c["checkin_date"], c["energy"], c["sleep_quality"],
             c["mental_fatigue"], c["readiness"]),
        )
    conn.commit()

    feature_df = mlp.build_feature_table(duty_rows, checkin_rows)
    rng = np.random.default_rng(26186)
    model, explainer = mlp.train_model(feature_df, rng)
    _state.update(model=model, explainer=explainer, seeded=True)

    latest = feature_df.sort_values("date").groupby("user_id").tail(1)
    for _, row in latest.iterrows():
        risk_level, prob, top_factors = mlp.score_single(model, explainer, row.to_dict())
        flag = int(row["welfare_review_flag"])
        reason = _reason_string(row) if flag else None
        cur.execute(
            "INSERT INTO risk_assessments (id,user_id,checkin_id,assessment_date,risk_level,"
            "risk_score,welfare_review_flag,divergence_reason,top_factors_json) "
            "VALUES (?,?,?,?,?,?,?,?,?)",
            (str(uuid.uuid4()), row["user_id"], row["checkin_id"], row["date"],
             risk_level, prob, flag, reason, json.dumps(top_factors)),
        )
    conn.commit()
    conn.close()

    return {"status": "seeded",
            "personnel_count": sum(1 for u in users if u["role"] == "PERSONNEL"),
            "units": list(sd.UNITS.keys()), "training_rows": len(feature_df)}


@app.get("/users")
def list_users(role: Optional[str] = None, unit_id: Optional[str] = None):
    conn = get_conn()
    q, params = "SELECT * FROM users WHERE 1=1", []
    if role:
        q += " AND role=?"; params.append(role)
    if unit_id:
        q += " AND unit_id=?"; params.append(unit_id)
    rows = conn.execute(q, params).fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


@app.get("/personnel/{user_id}/history")
def personnel_history(user_id: str):
    conn = get_conn()
    user = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    if not user:
        conn.close(); raise HTTPException(404, "user not found")
    duty = conn.execute("SELECT * FROM duty_records WHERE user_id=? ORDER BY duty_date", (user_id,)).fetchall()
    chk = conn.execute("SELECT * FROM checkins WHERE user_id=? ORDER BY checkin_date", (user_id,)).fetchall()
    risk = conn.execute("SELECT * FROM risk_assessments WHERE user_id=? ORDER BY assessment_date", (user_id,)).fetchall()
    conn.close()
    return {"user": row_to_dict(user), "duty_history": [row_to_dict(r) for r in duty],
            "checkin_history": [row_to_dict(r) for r in chk],
            "risk_history": [row_to_dict(r) for r in risk]}


@app.post("/personnel/{user_id}/checkin")
def submit_checkin(user_id: str, body: CheckinIn):
    if not _state["seeded"]:
        raise HTTPException(400, "call POST /demo/seed first")
    conn = get_conn()
    user = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    if not user:
        conn.close(); raise HTTPException(404, "user not found")

    duty_rows = [row_to_dict(r) for r in conn.execute(
        "SELECT * FROM duty_records WHERE user_id=? ORDER BY duty_date", (user_id,))]
    chk_rows = [row_to_dict(r) for r in conn.execute(
        "SELECT * FROM checkins WHERE user_id=? ORDER BY checkin_date", (user_id,))]

    last_date = max(d["duty_date"] for d in duty_rows) if duty_rows else None
    checkin_date = body.checkin_date or (
        (dt.date.fromisoformat(last_date) + dt.timedelta(days=1)).isoformat()
        if last_date else dt.date.today().isoformat())

    new_duty_id, new_chk_id = str(uuid.uuid4()), str(uuid.uuid4())
    conn.execute(
        "INSERT INTO duty_records (id,user_id,duty_date,duty_hours,rest_gap_hours,"
        "consecutive_days,workload_intensity) VALUES (?,?,?,?,?,?,?)",
        (new_duty_id, user_id, checkin_date, body.duty_hours, body.rest_gap_hours,
         body.consecutive_days, body.workload_intensity))
    conn.execute(
        "INSERT INTO checkins (id,user_id,checkin_date,energy,sleep_quality,"
        "mental_fatigue,readiness) VALUES (?,?,?,?,?,?,?)",
        (new_chk_id, user_id, checkin_date, body.energy, body.sleep_quality,
         body.mental_fatigue, body.readiness))
    conn.commit()

    duty_rows.append({"id": new_duty_id, "user_id": user_id, "duty_date": checkin_date,
                       "duty_hours": body.duty_hours, "rest_gap_hours": body.rest_gap_hours,
                       "consecutive_days": body.consecutive_days,
                       "workload_intensity": body.workload_intensity})
    chk_rows.append({"id": new_chk_id, "user_id": user_id, "checkin_date": checkin_date,
                      "energy": body.energy, "sleep_quality": body.sleep_quality,
                      "mental_fatigue": body.mental_fatigue, "readiness": body.readiness})

    feature_df = mlp.build_feature_table(duty_rows, chk_rows)
    latest_row = feature_df.iloc[-1]
    risk_level, prob, top_factors = mlp.score_single(_state["model"], _state["explainer"], latest_row.to_dict())
    flag = int(latest_row["welfare_review_flag"])
    reason = _reason_string(latest_row) if flag else None

    assessment_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO risk_assessments (id,user_id,checkin_id,assessment_date,risk_level,"
        "risk_score,welfare_review_flag,divergence_reason,top_factors_json) VALUES (?,?,?,?,?,?,?,?,?)",
        (assessment_id, user_id, new_chk_id, checkin_date, risk_level, prob, flag, reason,
         json.dumps(top_factors)))
    conn.commit()
    conn.close()

    return {"assessment_id": assessment_id, "user_id": user_id, "date": checkin_date,
            "risk_level": risk_level, "risk_score": round(prob, 3),
            "welfare_review_flag": bool(flag), "divergence_reason": reason,
            "top_factors": top_factors}


@app.get("/welfare/roster")
def welfare_roster(unit_id: str):
    conn = get_conn()
    users = conn.execute("SELECT * FROM users WHERE unit_id=? AND role='PERSONNEL'", (unit_id,)).fetchall()
    roster = []
    for u in users:
        latest = conn.execute(
            "SELECT * FROM risk_assessments WHERE user_id=? ORDER BY assessment_date DESC LIMIT 1",
            (u["id"],)).fetchone()
        roster.append({
            "user_id": u["id"], "service_number": u["service_number"], "full_name": u["full_name"],
            "sub_unit_id": u["sub_unit_id"],
            "risk_level": latest["risk_level"] if latest else None,
            "risk_score": latest["risk_score"] if latest else None,
            "welfare_review_flag": bool(latest["welfare_review_flag"]) if latest else False,
            "last_assessment_date": latest["assessment_date"] if latest else None,
        })
    conn.close()
    roster.sort(key=lambda r: (r["risk_score"] is None, -(r["risk_score"] or 0)))
    return roster


@app.get("/welfare/case/{user_id}")
def welfare_case(user_id: str):
    conn = get_conn()
    user = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    if not user:
        conn.close(); raise HTTPException(404, "user not found")
    risk_hist = conn.execute("SELECT * FROM risk_assessments WHERE user_id=? ORDER BY assessment_date", (user_id,)).fetchall()
    checkins = conn.execute("SELECT * FROM checkins WHERE user_id=? ORDER BY checkin_date", (user_id,)).fetchall()
    duty = conn.execute("SELECT * FROM duty_records WHERE user_id=? ORDER BY duty_date", (user_id,)).fetchall()
    cases = conn.execute("SELECT * FROM welfare_cases WHERE user_id=? ORDER BY created_at DESC", (user_id,)).fetchall()
    conn.close()

    latest = risk_hist[-1] if risk_hist else None
    return {"user": row_to_dict(user), "latest_assessment": row_to_dict(latest),
            "latest_top_factors": json.loads(latest["top_factors_json"]) if latest else [],
            "risk_history": [row_to_dict(r) for r in risk_hist],
            "checkin_history": [row_to_dict(c) for c in checkins],
            "duty_history": [row_to_dict(d) for d in duty],
            "welfare_cases": [row_to_dict(c) for c in cases]}


@app.post("/welfare/action")
def welfare_action(body: WelfareActionIn):
    conn = get_conn()
    case_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO welfare_cases (id,user_id,officer_id,status,action_type,notes,"
        "follow_up_date,created_at) VALUES (?,?,?,?,?,?,?,?)",
        (case_id, body.user_id, body.officer_id, "SUPPORT_ASSIGNED", body.action_type,
         body.notes, body.follow_up_date, dt.datetime.now().isoformat()))
    conn.commit()
    row = conn.execute("SELECT * FROM welfare_cases WHERE id=?", (case_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


@app.get("/commander/subunits")
def commander_subunits(unit_id: str):
    conn = get_conn()
    rows = conn.execute(
        "SELECT sub_unit_id, COUNT(*) as cnt FROM users WHERE unit_id=? AND role='PERSONNEL' "
        "GROUP BY sub_unit_id", (unit_id,)).fetchall()
    conn.close()
    return [{"sub_unit_id": r["sub_unit_id"], "personnel_count": r["cnt"],
             "meets_k_anonymity": r["cnt"] >= K_ANON_THRESHOLD} for r in rows]


@app.get("/commander/analytics")
def commander_analytics(unit_id: str, sub_unit_id: Optional[str] = None):
    conn = get_conn()
    q = "SELECT id FROM users WHERE unit_id=? AND role='PERSONNEL'"
    params = [unit_id]
    if sub_unit_id:
        q += " AND sub_unit_id=?"; params.append(sub_unit_id)
    personnel_ids = [r["id"] for r in conn.execute(q, params).fetchall()]
    cohort_size = len(personnel_ids)

    if cohort_size < K_ANON_THRESHOLD:
        conn.close()
        return {"status": "SUPPRESSED", "cohort_size": cohort_size,
                "min_required_k": K_ANON_THRESHOLD,
                "message": f"Cohort size ({cohort_size}) is below the k={K_ANON_THRESHOLD} "
                           f"privacy threshold. Aggregate data suppressed.",
                "metrics": None}

    placeholders = ",".join("?" * len(personnel_ids))
    rows = conn.execute(
        f"SELECT ra.* FROM risk_assessments ra INNER JOIN "
        f"(SELECT user_id, MAX(assessment_date) md FROM risk_assessments "
        f"WHERE user_id IN ({placeholders}) GROUP BY user_id) latest "
        f"ON ra.user_id=latest.user_id AND ra.assessment_date=latest.md",
        personnel_ids).fetchall()
    conn.close()

    if not rows:
        return {"status": "AUTHORIZED", "cohort_size": cohort_size,
                "metrics": {"note": "no assessments yet — call /demo/seed"}}

    scores = [r["risk_score"] for r in rows]
    elevated = sum(1 for r in rows if r["risk_level"] == "ELEVATED")
    flagged = sum(1 for r in rows if r["welfare_review_flag"])
    return {"status": "AUTHORIZED", "cohort_size": cohort_size,
            "metrics": {"avg_risk_score": round(float(np.mean(scores)), 3),
                        "pct_elevated": round(100 * elevated / cohort_size, 1),
                        "welfare_review_flags": flagged,
                        "readiness_index": round(100 * (1 - float(np.mean(scores))), 1)}}
