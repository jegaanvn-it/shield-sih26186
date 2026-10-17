import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 2500, // Quick timeout to fall back smoothly if backend server isn't running
});

// ============================================================================
// MOCK FALLBACK DATASTORE (Active when http://localhost:8000 is offline)
// ============================================================================
const MOCK_USERS = [
  { id: "usr_101", service_number: "88412-K", full_name: "L/Nk Rajesh Kumar", role: "PERSONNEL", unit_id: "14-RAJPUT", sub_unit_id: "B-Coy" },
  { id: "usr_102", service_number: "91204-S", full_name: "Sepoy Amit Sharma", role: "PERSONNEL", unit_id: "14-RAJPUT", sub_unit_id: "B-Coy" },
  { id: "usr_103", service_number: "77319-B", full_name: "Hav Balwinder Singh", role: "PERSONNEL", unit_id: "14-RAJPUT", sub_unit_id: "B-Coy" },
  { id: "usr_104", service_number: "65112-R", full_name: "Sepoy Amit Roy", role: "PERSONNEL", unit_id: "14-RAJPUT", sub_unit_id: "A-Coy" },
  { id: "usr_105", service_number: "54129-M", full_name: "Nk Somnath Mukherjee", role: "PERSONNEL", unit_id: "14-RAJPUT", sub_unit_id: "A-Coy" },
  { id: "usr_106", service_number: "43981-G", full_name: "Sepoy Gurpreet Singh", role: "PERSONNEL", unit_id: "14-RAJPUT", sub_unit_id: "A-Coy" },
  { id: "usr_107", service_number: "32109-D", full_name: "Sepoy Dinesh Verma", role: "PERSONNEL", unit_id: "14-RAJPUT", sub_unit_id: "A-Coy" },
  { id: "usr_108", service_number: "21984-P", full_name: "L/Nk Pradeep Yadav", role: "PERSONNEL", unit_id: "14-RAJPUT", sub_unit_id: "A-Coy" },
  { id: "usr_201", service_number: "OFF-3021", full_name: "Capt A. Sharma (MO)", role: "WELFARE_OFFICER", unit_id: "14-RAJPUT", sub_unit_id: "HQ" },
  { id: "usr_202", service_number: "OFF-1102", full_name: "Maj V. Anand (WO)", role: "WELFARE_OFFICER", unit_id: "12-JAKRIF", sub_unit_id: "HQ" },
  { id: "usr_301", service_number: "CO-9001", full_name: "Col S. K. Rawat", role: "COMMANDER", unit_id: "14-RAJPUT", sub_unit_id: "HQ" },
  { id: "usr_302", service_number: "CO-9002", full_name: "Col R. V. Singh", role: "COMMANDER", unit_id: "12-JAKRIF", sub_unit_id: "HQ" },
];

let mockCheckins = {
  usr_101: [
    { id: "chk_1", user_id: "usr_101", checkin_date: "2026-09-14", energy: 4, sleep_quality: 4, mental_fatigue: 2, readiness: 4 },
    { id: "chk_2", user_id: "usr_101", checkin_date: "2026-09-15", energy: 4, sleep_quality: 3, mental_fatigue: 2, readiness: 4 },
    { id: "chk_3", user_id: "usr_101", checkin_date: "2026-09-16", energy: 3, sleep_quality: 3, mental_fatigue: 3, readiness: 3 },
    { id: "chk_4", user_id: "usr_101", checkin_date: "2026-09-17", energy: 2, sleep_quality: 2, mental_fatigue: 4, readiness: 2 },
    { id: "chk_5", user_id: "usr_101", checkin_date: "2026-09-18", energy: 1, sleep_quality: 2, mental_fatigue: 5, readiness: 2 },
  ],
  usr_102: [
    { id: "chk_10", user_id: "usr_102", checkin_date: "2026-09-17", energy: 2, sleep_quality: 1, mental_fatigue: 4, readiness: 2 },
    { id: "chk_11", user_id: "usr_102", checkin_date: "2026-09-18", energy: 1, sleep_quality: 1, mental_fatigue: 5, readiness: 1 },
  ],
  usr_103: [
    { id: "chk_20", user_id: "usr_103", checkin_date: "2026-09-17", energy: 3, sleep_quality: 2, mental_fatigue: 3, readiness: 3 },
    { id: "chk_21", user_id: "usr_103", checkin_date: "2026-09-18", energy: 2, sleep_quality: 2, mental_fatigue: 4, readiness: 2 },
  ]
};

let mockDuty = {
  usr_101: [
    { id: "d_1", user_id: "usr_101", duty_date: "2026-09-14", duty_hours: 8, rest_gap_hours: 14, consecutive_days: 2, workload_intensity: 2.5 },
    { id: "d_2", user_id: "usr_101", duty_date: "2026-09-15", duty_hours: 10, rest_gap_hours: 10, consecutive_days: 3, workload_intensity: 3.0 },
    { id: "d_3", user_id: "usr_101", duty_date: "2026-09-16", duty_hours: 12, rest_gap_hours: 8, consecutive_days: 4, workload_intensity: 4.0 },
    { id: "d_4", user_id: "usr_101", duty_date: "2026-09-17", duty_hours: 14, rest_gap_hours: 6, consecutive_days: 8, workload_intensity: 4.5 },
    { id: "d_5", user_id: "usr_101", duty_date: "2026-09-18", duty_hours: 13.5, rest_gap_hours: 5, consecutive_days: 9, workload_intensity: 4.8 },
  ],
  usr_102: [
    { id: "d_10", user_id: "usr_102", duty_date: "2026-09-17", duty_hours: 15, rest_gap_hours: 4, consecutive_days: 12, workload_intensity: 4.9 },
    { id: "d_11", user_id: "usr_102", duty_date: "2026-09-18", duty_hours: 16, rest_gap_hours: 4, consecutive_days: 13, workload_intensity: 5.0 },
  ],
  usr_103: [
    { id: "d_20", user_id: "usr_103", duty_date: "2026-09-17", duty_hours: 12, rest_gap_hours: 6, consecutive_days: 9, workload_intensity: 4.0 },
    { id: "d_21", user_id: "usr_103", duty_date: "2026-09-18", duty_hours: 14, rest_gap_hours: 5, consecutive_days: 10, workload_intensity: 4.5 },
  ]
};

let mockRisks = {
  usr_101: [
    { id: "r_1", user_id: "usr_101", assessment_date: "2026-09-14", risk_level: "LOW", risk_score: 0.18, welfare_review_flag: 0, divergence_reason: null, top_factors_json: JSON.stringify([{ factor: "rest_gap", impact: "0.1", direction: "decreases_risk" }]) },
    { id: "r_2", user_id: "usr_101", assessment_date: "2026-09-15", risk_level: "LOW", risk_score: 0.25, welfare_review_flag: 0, divergence_reason: null, top_factors_json: JSON.stringify([{ factor: "duty_hours", impact: "0.15", direction: "increases_risk" }]) },
    { id: "r_3", user_id: "usr_101", assessment_date: "2026-09-16", risk_level: "MODERATE", risk_score: 0.48, welfare_review_flag: 0, divergence_reason: null, top_factors_json: JSON.stringify([{ factor: "consecutive_days", impact: "0.22", direction: "increases_risk" }]) },
    { id: "r_4", user_id: "usr_101", assessment_date: "2026-09-17", risk_level: "ELEVATED", risk_score: 0.72, welfare_review_flag: 1, divergence_reason: "High duty hours (14h) alongside reported low fatigue.", top_factors_json: JSON.stringify([{ factor: "consecutive_days", impact: "0.31", direction: "increases_risk" }, { factor: "rest_gap_hours", impact: "0.28", direction: "increases_risk" }]) },
    { id: "r_5", user_id: "usr_101", assessment_date: "2026-09-18", risk_level: "ELEVATED", risk_score: 0.786, welfare_review_flag: 1, divergence_reason: "High objective strain (13.5h duty, 9 consecutive days) alongside self-reported wellbeing of 3.25/5.", top_factors_json: JSON.stringify([{ factor: "consecutive_days", impact: "0.34", direction: "increases_risk" }, { factor: "duty_hours", impact: "0.28", direction: "increases_risk" }, { factor: "rest_gap_hours", impact: "0.22", direction: "increases_risk" }]) },
  ],
  usr_102: [
    { id: "r_10", user_id: "usr_102", assessment_date: "2026-09-18", risk_level: "ELEVATED", risk_score: 0.86, welfare_review_flag: 1, divergence_reason: "13 consecutive duty days without 24h rest.", top_factors_json: JSON.stringify([{ factor: "consecutive_days", impact: "0.45", direction: "increases_risk" }]) }
  ],
  usr_103: [
    { id: "r_20", user_id: "usr_103", assessment_date: "2026-09-18", risk_level: "ELEVATED", risk_score: 0.74, welfare_review_flag: 1, divergence_reason: "10 consecutive duty days in high altitude post.", top_factors_json: JSON.stringify([{ factor: "consecutive_days", impact: "0.38", direction: "increases_risk" }]) }
  ]
};

let mockWelfareCases = [];

// Helper API Wrapper with Auto-Fallback
const callApiOrFallback = async (apiCallFn, fallbackFn) => {
  try {
    return await apiCallFn();
  } catch (err) {
    console.warn("FastAPI backend unreachable at http://localhost:8000. Running in Standalone Edge Mode.", err.message);
    return fallbackFn();
  }
};

export const getHealth = async () => {
  return callApiOrFallback(
    async () => (await api.get('/health')).data,
    () => ({ status: "ok_standalone", seeded: true })
  );
};

export const seedDemo = async () => {
  return callApiOrFallback(
    async () => (await api.post('/demo/seed')).data,
    () => ({ status: "seeded_standalone", personnel_count: 8, units: ["14-RAJPUT", "12-JAKRIF"] })
  );
};

export const getUsers = async (role = null, unit_id = null) => {
  return callApiOrFallback(
    async () => {
      const params = {};
      if (role) params.role = role;
      if (unit_id) params.unit_id = unit_id;
      return (await api.get('/users', { params })).data;
    },
    () => {
      let filtered = [...MOCK_USERS];
      if (role) filtered = filtered.filter(u => u.role === role);
      if (unit_id) filtered = filtered.filter(u => u.unit_id === unit_id);
      return filtered;
    }
  );
};

export const getPersonnelHistory = async (userId) => {
  return callApiOrFallback(
    async () => (await api.get(`/personnel/${userId}/history`)).data,
    () => {
      const u = MOCK_USERS.find(user => user.id === userId) || MOCK_USERS[0];
      const chk = mockCheckins[userId] || [];
      const duty = mockDuty[userId] || [];
      const risk = mockRisks[userId] || [];
      return {
        user: u,
        duty_history: duty,
        checkin_history: chk,
        risk_history: risk
      };
    }
  );
};

export const submitCheckin = async (userId, checkinData) => {
  return callApiOrFallback(
    async () => (await api.post(`/personnel/${userId}/checkin`, checkinData)).data,
    () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const newChk = { id: `chk_${Date.now()}`, user_id: userId, checkin_date: todayStr, ...checkinData };
      if (!mockCheckins[userId]) mockCheckins[userId] = [];
      mockCheckins[userId].push(newChk);

      // Compute OSI and Risk Score
      const dutyH = checkinData.duty_hours || 12;
      const consec = checkinData.consecutive_days || 5;
      const intensity = checkinData.workload_intensity || 3;
      const osi = Math.min(100, ((dutyH / 24) * 35 + (consec * 2.5) + (intensity * 8)));
      
      const avgWellbeing = ((checkinData.energy + checkinData.sleep_quality + (6 - checkinData.mental_fatigue) + checkinData.readiness) / 4);
      const riskScore = Math.min(0.95, Math.max(0.12, (osi / 100) * 0.7 + (5 - avgWellbeing) * 0.08));
      const riskLevel = riskScore >= 0.7 ? "ELEVATED" : riskScore >= 0.4 ? "MODERATE" : "LOW";
      const flag = (osi > 65 && avgWellbeing > 3.0) || riskScore >= 0.7;
      const divergenceReason = flag ? `High objective strain (${dutyH}h duty, ${consec} consecutive days) alongside self-reported wellbeing of ${avgWellbeing.toFixed(1)}/5.` : null;

      const topFactors = [
        { factor: "consecutive_days", impact: "+0.32", direction: "increases_risk" },
        { factor: "duty_hours", impact: "+0.26", direction: "increases_risk" },
        { factor: "rest_gap_hours", impact: "+0.18", direction: "increases_risk" }
      ];

      const newRisk = {
        id: `r_${Date.now()}`,
        user_id: userId,
        assessment_date: todayStr,
        risk_level: riskLevel,
        risk_score: parseFloat(riskScore.toFixed(3)),
        welfare_review_flag: flag ? 1 : 0,
        divergence_reason: divergenceReason,
        top_factors_json: JSON.stringify(topFactors)
      };

      if (!mockRisks[userId]) mockRisks[userId] = [];
      mockRisks[userId].push(newRisk);

      return {
        assessment_id: newRisk.id,
        user_id: userId,
        date: todayStr,
        risk_level: riskLevel,
        risk_score: newRisk.risk_score,
        welfare_review_flag: flag,
        divergence_reason: divergenceReason,
        top_factors: topFactors
      };
    }
  );
};

export const getWelfareRoster = async (unitId) => {
  return callApiOrFallback(
    async () => (await api.get('/welfare/roster', { params: { unit_id: unitId } })).data,
    () => {
      const personnel = MOCK_USERS.filter(u => u.role === 'PERSONNEL' && (unitId ? u.unit_id === unitId : true));
      return personnel.map(u => {
        const risks = mockRisks[u.id] || [];
        const latest = risks[risks.length - 1];
        return {
          user_id: u.id,
          service_number: u.service_number,
          full_name: u.full_name,
          sub_unit_id: u.sub_unit_id,
          risk_level: latest ? latest.risk_level : "LOW",
          risk_score: latest ? latest.risk_score : 0.2,
          welfare_review_flag: latest ? Boolean(latest.welfare_review_flag) : false,
          last_assessment_date: latest ? latest.assessment_date : "2026-09-18"
        };
      }).sort((a, b) => b.risk_score - a.risk_score);
    }
  );
};

export const getWelfareCase = async (userId) => {
  return callApiOrFallback(
    async () => (await api.get(`/welfare/case/${userId}`)).data,
    () => {
      const u = MOCK_USERS.find(user => user.id === userId) || MOCK_USERS[0];
      const riskHist = mockRisks[userId] || [];
      const latest = riskHist[riskHist.length - 1];
      const checkins = mockCheckins[userId] || [];
      const duty = mockDuty[userId] || [];
      const cases = mockWelfareCases.filter(c => c.user_id === userId);

      return {
        user: u,
        latest_assessment: latest,
        latest_top_factors: latest ? JSON.parse(latest.top_factors_json) : [],
        risk_history: riskHist,
        checkin_history: checkins,
        duty_history: duty,
        welfare_cases: cases
      };
    }
  );
};

export const submitWelfareAction = async (actionData) => {
  return callApiOrFallback(
    async () => (await api.post('/welfare/action', actionData)).data,
    () => {
      const newCase = {
        id: `case_${Date.now()}`,
        user_id: actionData.user_id,
        officer_id: actionData.officer_id,
        status: "SUPPORT_ASSIGNED",
        action_type: actionData.action_type,
        notes: actionData.notes,
        follow_up_date: actionData.follow_up_date,
        created_at: new Date().toISOString()
      };
      mockWelfareCases.push(newCase);
      return newCase;
    }
  );
};

export const getCommanderSubunits = async (unitId) => {
  return callApiOrFallback(
    async () => (await api.get('/commander/subunits', { params: { unit_id: unitId } })).data,
    () => ([
      { sub_unit_id: "A-Coy", personnel_count: 5, meets_k_anonymity: true },
      { sub_unit_id: "B-Coy", personnel_count: 3, meets_k_anonymity: false },
      { sub_unit_id: "HQ-Platoon", personnel_count: 2, meets_k_anonymity: false }
    ])
  );
};

export const getCommanderAnalytics = async (unitId, subUnitId = null) => {
  return callApiOrFallback(
    async () => {
      const params = { unit_id: unitId };
      if (subUnitId) params.sub_unit_id = subUnitId;
      return (await api.get('/commander/analytics', { params })).data;
    },
    () => {
      const subUnits = [
        { id: "A-Coy", count: 5 },
        { id: "B-Coy", count: 3 }
      ];
      const match = subUnits.find(s => s.id === subUnitId);
      const cohortSize = match ? match.count : 8;

      if (subUnitId && match && match.count < 5) {
        return {
          status: "SUPPRESSED",
          cohort_size: match.count,
          min_required_k: 5,
          message: `Cohort size (${match.count}) is below the k=5 privacy threshold. Aggregate data suppressed to protect individual privacy.`,
          metrics: null
        };
      }

      return {
        status: "AUTHORIZED",
        cohort_size: cohortSize,
        metrics: {
          avg_risk_score: 0.542,
          pct_elevated: 37.5,
          welfare_review_flags: 3,
          readiness_index: 84.8
        }
      };
    }
  );
};

