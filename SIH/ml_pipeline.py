"""
SHIELD prototype — ML pipeline.

Two SEPARATE concepts, kept explicitly separate (never conflated):

1. Risk score (ELEVATED / LOW) — a LightGBM classifier trained on objective
   duty features + personal-baseline deviations of self-report. Explained
   per-prediction with TreeSHAP. This is a prototype demonstration on
   synthetic data — NOT a clinically validated diagnostic tool.

2. Welfare Review Flag — a simple, transparent rule comparing an objective
   strain index against a subjective wellbeing index. This is NOT lie
   detection / deception detection. It only says: objective workload is
   high while self-report does not reflect it, so a human should take a
   look. The threshold values are a stated prototype design choice.
"""
import warnings
import numpy as np
import pandas as pd
import lightgbm as lgb
import shap

warnings.filterwarnings("ignore", message="LightGBM binary classifier")

FEATURE_COLS = [
    "consecutive_days", "rest_gap_hours", "workload_intensity_7d",
    "energy_delta", "sleep_delta", "fatigue_delta", "readiness_delta",
]

FEATURE_LABELS = {
    "consecutive_days": "consecutive duty days",
    "rest_gap_hours": "rest gap between shifts",
    "workload_intensity_7d": "7-day workload intensity",
    "energy_delta": "energy vs personal baseline",
    "sleep_delta": "sleep quality vs personal baseline",
    "fatigue_delta": "mental fatigue vs personal baseline",
    "readiness_delta": "readiness vs personal baseline",
}

STRAIN_FLAG_THRESHOLD = 0.55     # prototype design choice, not medically validated
WELLBEING_FLAG_THRESHOLD = 0.65  # prototype design choice, not medically validated


def _wellbeing_index(energy, sleep_quality, readiness, mental_fatigue):
    raw = (energy + sleep_quality + readiness + (6 - mental_fatigue)) / 4.0
    return float(np.clip((raw - 1) / 4.0, 0, 1))


def _strain_index(consecutive_days, rest_gap_hours, workload_intensity):
    s = (consecutive_days / 12.0 + (24 - rest_gap_hours) / 20.0 + workload_intensity / 5.0) / 3.0
    return float(np.clip(s, 0, 1))


def build_feature_table(duty_rows, checkin_rows):
    """One row per user-day. Baseline for day i uses ONLY days < i for that
    user (no leakage). Cold-start (<3 prior days) falls back to a cohort
    median baseline, explicitly labelled as 'FORMATIVE'."""
    duty_df = pd.DataFrame(duty_rows).rename(columns={"id": "duty_id"})
    chk_df = pd.DataFrame(checkin_rows).rename(columns={"id": "checkin_id"})
    df = pd.merge(duty_df, chk_df, left_on=["user_id", "duty_date"],
                  right_on=["user_id", "checkin_date"])
    df = df.sort_values(["user_id", "duty_date"]).reset_index(drop=True)

    cohort_median = {
        "energy": df["energy"].median(), "sleep_quality": df["sleep_quality"].median(),
        "mental_fatigue": df["mental_fatigue"].median(), "readiness": df["readiness"].median(),
    }

    rows = []
    for uid, g in df.groupby("user_id"):
        g = g.reset_index(drop=True)
        for i in range(len(g)):
            history = g.iloc[:i]
            today = g.iloc[i]

            if len(history) >= 3:
                base_energy = history["energy"].mean()
                base_sleep = history["sleep_quality"].mean()
                base_fatigue = history["mental_fatigue"].mean()
                base_readiness = history["readiness"].mean()
                baseline_status = "PERSONAL"
            else:
                base_energy, base_sleep = cohort_median["energy"], cohort_median["sleep_quality"]
                base_fatigue, base_readiness = cohort_median["mental_fatigue"], cohort_median["readiness"]
                baseline_status = "FORMATIVE"

            window7 = g.iloc[max(0, i - 6): i + 1]
            workload_7d = float(window7["workload_intensity"].mean())

            strain_idx = _strain_index(today["consecutive_days"], today["rest_gap_hours"], workload_7d)
            wellbeing_idx = _wellbeing_index(today["energy"], today["sleep_quality"],
                                              today["readiness"], today["mental_fatigue"])
            divergence_flag = int(strain_idx >= STRAIN_FLAG_THRESHOLD and
                                   wellbeing_idx >= WELLBEING_FLAG_THRESHOLD)

            rows.append({
                "user_id": uid, "date": today["duty_date"], "checkin_id": today["checkin_id"],
                "consecutive_days": int(today["consecutive_days"]),
                "rest_gap_hours": float(today["rest_gap_hours"]),
                "workload_intensity_7d": workload_7d,
                "energy_delta": float(today["energy"] - base_energy),
                "sleep_delta": float(today["sleep_quality"] - base_sleep),
                "fatigue_delta": float(today["mental_fatigue"] - base_fatigue),
                "readiness_delta": float(today["readiness"] - base_readiness),
                "strain_index": strain_idx, "wellbeing_index": wellbeing_idx,
                "welfare_review_flag": divergence_flag, "baseline_status": baseline_status,
            })
    return pd.DataFrame(rows)


def make_training_labels(feature_df, rng):
    """Elevated-risk probability grows with the objective strain index, with
    injected noise so the model has a genuine (not trivially-copied) learning
    problem — matching the ~10% stochastic noise called for in the design."""
    p = 1 / (1 + np.exp(-12 * (feature_df["strain_index"].values - 0.55)))
    p = np.clip(p + rng.normal(0, 0.06, size=len(p)), 0, 1)
    return (rng.random(len(p)) < p).astype(int)


def train_model(feature_df, rng):
    X = feature_df[FEATURE_COLS]
    y = make_training_labels(feature_df, rng)
    train_data = lgb.Dataset(X, label=y)
    params = dict(objective="binary", metric="binary_logloss", max_depth=4,
                  num_leaves=15, learning_rate=0.05, verbosity=-1)
    model = lgb.train(params, train_data, num_boost_round=150)
    explainer = shap.TreeExplainer(model)
    return model, explainer


def score_single(model, explainer, feature_row: dict):
    X = pd.DataFrame([{c: feature_row[c] for c in FEATURE_COLS}])
    prob = float(model.predict(X)[0])
    risk_level = "ELEVATED" if prob >= 0.5 else "LOW"

    sv_raw = explainer.shap_values(X)
    sv = np.array(sv_raw[-1])[0] if isinstance(sv_raw, list) else np.array(sv_raw)[0]

    contribs = sorted(zip(FEATURE_COLS, sv), key=lambda t: -abs(t[1]))
    top_factors = [{
        "factor": FEATURE_LABELS[name],
        "direction": "increases_risk" if val > 0 else "protective",
        "impact": round(float(val), 3),
    } for name, val in contribs[:3]]

    return risk_level, prob, top_factors
