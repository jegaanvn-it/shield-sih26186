import json
from fastapi.testclient import TestClient
from main import app

c = TestClient(app)

def show(title, resp):
    print(f"\n=== {title} [{resp.status_code}] ===")
    try:
        print(json.dumps(resp.json(), indent=2)[:1500])
    except Exception:
        print(resp.text[:500])

# 1. health before seed
show("health (pre-seed)", c.get("/health"))

# 2. seed
show("demo/seed", c.post("/demo/seed"))

# 3. users list
r = c.get("/users")
users = r.json()
print(f"\n=== /users -> {len(users)} total ===")
by_role = {}
for u in users:
    by_role.setdefault(u["role"], []).append(u)
for role, us in by_role.items():
    print(f"  {role}: {len(us)}")

# grab one welfare officer + commander for ALPHA, plus a personnel from a small sub-unit (A1, size 4) and large (A2, size 9)
officer = next(u for u in users if u["role"] == "WELFARE_OFFICER" and u["unit_id"] == "ALPHA")
commander = next(u for u in users if u["role"] == "COMMANDER" and u["unit_id"] == "ALPHA")
personnel_alpha = [u for u in users if u["role"] == "PERSONNEL" and u["unit_id"] == "ALPHA"]
some_personnel = personnel_alpha[0]

# 4. personnel history
show(f"personnel/{some_personnel['id']}/history", c.get(f"/personnel/{some_personnel['id']}/history"))

# 5. welfare roster for ALPHA
show("welfare/roster?unit_id=ALPHA", c.get("/welfare/roster", params={"unit_id": "ALPHA"}))

# 6. welfare case detail (pick someone flagged if possible)
roster = c.get("/welfare/roster", params={"unit_id": "ALPHA"}).json()
flagged_user = next((r for r in roster if r["welfare_review_flag"]), roster[0])
show(f"welfare/case/{flagged_user['user_id']} (flagged={flagged_user['welfare_review_flag']})",
     c.get(f"/welfare/case/{flagged_user['user_id']}"))

# 7. welfare action log
show("welfare/action (log support)", c.post("/welfare/action", json={
    "user_id": flagged_user["user_id"], "officer_id": officer["id"],
    "action_type": "COUNSELING_SESSION", "notes": "Initial welfare check scheduled.",
    "follow_up_date": "2026-09-13"
}))

# 8. commander subunits (sizes)
show("commander/subunits?unit_id=ALPHA", c.get("/commander/subunits", params={"unit_id": "ALPHA"}))

# 9. commander analytics -- small sub-unit (A1, size 4) should be SUPPRESSED
show("commander/analytics sub_unit=A1 (size 4, expect SUPPRESSED)",
     c.get("/commander/analytics", params={"unit_id": "ALPHA", "sub_unit_id": "A1"}))

# 10. commander analytics -- large sub-unit (A2, size 9) should be AUTHORIZED
show("commander/analytics sub_unit=A2 (size 9, expect AUTHORIZED)",
     c.get("/commander/analytics", params={"unit_id": "ALPHA", "sub_unit_id": "A2"}))

# 11. live checkin submission -- simulate a BAD day for a stable user and watch risk jump
target = some_personnel
show(f"POST checkin (bad day) for {target['full_name']}", c.post(
    f"/personnel/{target['id']}/checkin", json={
        "duty_hours": 15, "rest_gap_hours": 4, "consecutive_days": 9,
        "workload_intensity": 4.8, "energy": 2, "sleep_quality": 1,
        "mental_fatigue": 5, "readiness": 2
    }))

print("\n\nALL ENDPOINT TESTS COMPLETED")
