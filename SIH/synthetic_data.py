"""
SHIELD prototype — synthetic data generator.

We do NOT have real personnel data (and never will for a student prototype).
This generates a reproducible synthetic population with three profiles that
map directly onto the demo scenarios:

  stable              -> normal duty pattern, low risk
  escalating_strain    -> objective strain rises AND self-report honestly
                          tracks it -> should trigger ELEVATED risk
  divergence           -> objective strain rises but self-report stays
                          artificially positive -> should trigger the
                          Welfare Review Flag (not just "elevated risk")

Sub-unit sizes are deliberately mixed above/below 5 so the k-anonymity
suppression rule has something real to demonstrate.
"""
import uuid
import numpy as np
from datetime import date, timedelta

RNG_SEED = 26186
rng = np.random.default_rng(RNG_SEED)

UNITS = {
    "ALPHA": ["A1", "A2"],
    "BRAVO": ["B1", "B2"],
    "CHARLIE": ["C1", "C2"],
}
SUB_UNIT_SIZE = {"A1": 4, "A2": 9, "B1": 8, "B2": 6, "C1": 3, "C2": 10}

NUM_DAYS = 21
TODAY = date(2026, 9, 6)
PROFILE_NAMES = ["stable", "escalating_strain", "divergence"]
PROFILE_P = [0.60, 0.25, 0.15]


def _new_id(prefix):
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


def generate_users():
    users = []
    idx = 1
    for unit, subunits in UNITS.items():
        for sub in subunits:
            for _ in range(SUB_UNIT_SIZE[sub]):
                profile = str(rng.choice(PROFILE_NAMES, p=PROFILE_P))
                users.append({
                    "id": _new_id("PN"),
                    "service_number": f"SN{idx:04d}",
                    "full_name": f"Personnel {idx:03d}",
                    "role": "PERSONNEL",
                    "unit_id": unit,
                    "sub_unit_id": sub,
                    "_profile": profile,
                })
                idx += 1
        users.append({"id": _new_id("WO"), "service_number": f"WO-{unit}",
                       "full_name": f"Welfare Officer ({unit.title()})",
                       "role": "WELFARE_OFFICER", "unit_id": unit, "sub_unit_id": "-",
                       "_profile": None})
        users.append({"id": _new_id("CM"), "service_number": f"CO-{unit}",
                       "full_name": f"Commander ({unit.title()})",
                       "role": "COMMANDER", "unit_id": unit, "sub_unit_id": "-",
                       "_profile": None})
    return users


def _simulate_user_timeline(profile):
    days = []
    consecutive = 0
    reset_countdown = int(rng.integers(4, 7))  # proper work-N-days-then-rest cycle
    for d in range(NUM_DAYS):
        progress = d / (NUM_DAYS - 1)

        if profile == "stable":
            rest_gap = rng.normal(11, 1.5)
            workload = rng.normal(2.3, 0.35)
            duty_hours = rng.normal(8, 0.5)
            reset_countdown -= 1
            if reset_countdown <= 0:
                consecutive = 0
                reset_countdown = int(rng.integers(4, 7))
            else:
                consecutive += 1
            energy, sleep, fatigue, readiness = (rng.normal(4.2, 0.5), rng.normal(4.1, 0.5),
                                                   rng.normal(1.8, 0.5), rng.normal(4.2, 0.5))

        elif profile == "escalating_strain":
            rest_gap = rng.normal(10 - 6 * progress, 1.0)
            workload = rng.normal(2.3 + 2.2 * progress, 0.3)
            duty_hours = rng.normal(8 + 3 * progress, 0.6)
            consecutive = 0 if rest_gap > 20 else consecutive + 1
            # self-report HONESTLY tracks the real strain
            energy, sleep, fatigue, readiness = (
                rng.normal(4.2 - 2.3 * progress, 0.4), rng.normal(4.1 - 2.2 * progress, 0.4),
                rng.normal(1.8 + 2.6 * progress, 0.4), rng.normal(4.2 - 2.3 * progress, 0.4))

        else:  # divergence
            rest_gap = rng.normal(10 - 6 * progress, 1.0)
            workload = rng.normal(2.3 + 2.2 * progress, 0.3)
            duty_hours = rng.normal(8 + 3 * progress, 0.6)
            consecutive = 0 if rest_gap > 20 else consecutive + 1
            # self-report stays artificially positive despite rising objective strain
            energy, sleep, fatigue, readiness = (rng.normal(4.0, 0.3), rng.normal(3.9, 0.3),
                                                   rng.normal(1.9, 0.3), rng.normal(4.0, 0.3))

        days.append({
            "duty_hours": round(float(np.clip(duty_hours, 4, 16)), 1),
            "rest_gap_hours": round(float(np.clip(rest_gap, 2, 24)), 1),
            "consecutive_days": int(max(0, consecutive)),
            "workload_intensity": round(float(np.clip(workload, 1, 5)), 2),
            "energy": int(round(float(np.clip(energy, 1, 5)))),
            "sleep_quality": int(round(float(np.clip(sleep, 1, 5)))),
            "mental_fatigue": int(round(float(np.clip(fatigue, 1, 5)))),
            "readiness": int(round(float(np.clip(readiness, 1, 5)))),
        })
    return days


def generate_duty_and_checkins(users):
    duty_rows, checkin_rows = [], []
    start = TODAY - timedelta(days=NUM_DAYS - 1)
    for u in users:
        if u["role"] != "PERSONNEL":
            continue
        timeline = _simulate_user_timeline(u["_profile"])
        for d_offset, day in enumerate(timeline):
            d = (start + timedelta(days=d_offset)).isoformat()
            duty_rows.append({"id": _new_id("DR"), "user_id": u["id"], "duty_date": d,
                               "duty_hours": day["duty_hours"], "rest_gap_hours": day["rest_gap_hours"],
                               "consecutive_days": day["consecutive_days"],
                               "workload_intensity": day["workload_intensity"]})
            checkin_rows.append({"id": _new_id("CK"), "user_id": u["id"], "checkin_date": d,
                                  "energy": day["energy"], "sleep_quality": day["sleep_quality"],
                                  "mental_fatigue": day["mental_fatigue"], "readiness": day["readiness"]})
    return duty_rows, checkin_rows
