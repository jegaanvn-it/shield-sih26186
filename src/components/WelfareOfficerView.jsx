import React, { useState, useEffect } from 'react';
import { getWelfareRoster, getWelfareCase, submitWelfareAction } from '../api';
import { 
  Users, 
  Flag, 
  ShieldAlert, 
  X, 
  Calendar, 
  FileText, 
  CheckSquare, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  BarChart2,
  Send,
  UserCheck
} from 'lucide-react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const UNITS = ['ALPHA', 'BRAVO', 'CHARLIE'];

export default function WelfareOfficerView({ currentUser }) {
  const [selectedUnit, setSelectedUnit] = useState('ALPHA');
  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  // Case detail state
  const [caseData, setCaseData] = useState(null);
  const [loadingCase, setLoadingCase] = useState(false);

  // Welfare action form state
  const [actionType, setActionType] = useState('REST_RECOMMENDATION');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

  // Fetch roster when unit changes
  useEffect(() => {
    let isMounted = true;
    const fetchRoster = async () => {
      setLoadingRoster(true);
      try {
        const data = await getWelfareRoster(selectedUnit);
        if (isMounted) setRoster(data || []);
      } catch (err) {
        console.error("Failed to load welfare roster:", err);
      } finally {
        if (isMounted) setLoadingRoster(false);
      }
    };

    fetchRoster();
    return () => { isMounted = false; };
  }, [selectedUnit]);

  // Fetch case detail when a user is selected
  const handleSelectUser = async (userId) => {
    setSelectedUserId(userId);
    setCaseData(null);
    setLoadingCase(true);
    setActionSuccess(false);
    try {
      const data = await getWelfareCase(userId);
      setCaseData(data);
    } catch (err) {
      console.error("Failed to load case detail:", err);
    } fontFinally: {
      setLoadingCase(false);
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !currentUser?.id) return;

    setSubmittingAction(true);
    setActionSuccess(false);
    try {
      await submitWelfareAction({
        user_id: selectedUserId,
        officer_id: currentUser.id,
        action_type: actionType,
        notes,
        follow_up_date: followUpDate,
      });

      setActionSuccess(true);
      setNotes('');
      // Reload case detail to show updated welfare cases list
      const updatedCase = await getWelfareCase(selectedUserId);
      setCaseData(updatedCase);
      // Reload roster to update any state if needed
      const updatedRoster = await getWelfareRoster(selectedUnit);
      setRoster(updatedRoster);
    } catch (err) {
      console.error("Failed to record welfare action:", err);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Build dual comparison chart data (Objective Workload vs Subjective Self-Report)
  const comparisonChartData = React.useMemo(() => {
    if (!caseData?.duty_history || !caseData?.checkin_history) return [];
    
    // Map duty history by date
    const dutyMap = {};
    caseData.duty_history.forEach(d => {
      dutyMap[d.duty_date] = d;
    });

    // Map checkins by date and combine
    return caseData.checkin_history.map(c => {
      const d = dutyMap[c.checkin_date] || {};
      const wellbeingAvg = ((c.energy + c.sleep_quality + c.readiness + (6 - c.mental_fatigue)) / 4.0).toFixed(2);
      return {
        date: c.checkin_date ? c.checkin_date.slice(5) : '',
        'Workload Intensity': d.workload_intensity || 0,
        'Duty Hours': d.duty_hours || 0,
        'Self-Report Wellbeing': parseFloat(wellbeingAvg),
      };
    });
  }, [caseData]);

  return (
    <div className="space-y-6">
      
      {/* Officer Header & Unit Selector */}
      <div className="bg-[#12161C] dark:bg-[#12161C] light:bg-white border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] p-4 rounded-[2px] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] flex items-center justify-center text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F]">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold uppercase tracking-wider text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] font-mono">
                Welfare Officer Console
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-[#4A6572]/20 text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F] border-l-2 border-[#D9A441] uppercase">
                {currentUser?.full_name || 'OFFICER'}
              </span>
            </div>
            <p className="text-xs text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] font-mono">
              UNIT MONITORED: <span className="text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] font-bold">{selectedUnit}</span> | ACTIVE ROSTER EVALUATION
            </p>
          </div>
        </div>

        {/* Unit Selector Tabs */}
        <div className="flex items-center bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] p-1 rounded-[2px]">
          <span className="text-[10px] font-mono uppercase text-[#8A9099] px-2">Unit:</span>
          {UNITS.map(unit => (
            <button
              key={unit}
              onClick={() => { setSelectedUnit(unit); setSelectedUserId(null); }}
              className={`px-3 py-1 text-xs font-mono font-bold uppercase rounded-[2px] transition-all ${
                selectedUnit === unit
                  ? 'bg-[#12161C] dark:bg-[#12161C] light:bg-white text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F] border-l-2 border-[#D9A441] dark:border-[#D9A441] light:border-[#1F3A5F]'
                  : 'text-[#8A9099] hover:text-[#E8E6E1]'
              }`}
            >
              {unit}
            </button>
          ))}
        </div>
      </div>

      {/* Roster Table Grid */}
      <div className="bg-[#12161C] dark:bg-[#12161C] light:bg-white border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] p-5 rounded-[2px] space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] font-mono">
              Personnel Welfare Roster ({selectedUnit} UNIT)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#8A9099] uppercase">
            SORTED BY RISK SCORE (DESCENDING)
          </span>
        </div>

        {loadingRoster ? (
          <div className="py-12 text-center text-xs font-mono text-[#8A9099] animate-pulse">
            FETCHING PERSONNEL ROSTER...
          </div>
        ) : roster.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-[#8A9099]">
            No personnel found for unit {selectedUnit}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] text-[#8A9099] uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Service Number</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Sub-Unit</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3">Welfare Review Flag</th>
                  <th className="py-2.5 px-3">Last Assessed</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2630] dark:divide-[#1E2630] light:divide-[#D8D4CA]">
                {roster.map((row) => (
                  <tr 
                    key={row.user_id}
                    onClick={() => handleSelectUser(row.user_id)}
                    className={`cursor-pointer transition-colors hover:bg-[#1E2630]/50 dark:hover:bg-[#1E2630]/50 light:hover:bg-[#F4F2ED] ${
                      selectedUserId === row.user_id ? 'bg-[#1E2630] dark:bg-[#1E2630] light:bg-[#EAE7DF]' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21]">
                      {row.service_number}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21]">
                      {row.full_name}
                    </td>
                    <td className="py-3 px-3 text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76]">
                      {row.sub_unit_id}
                    </td>
                    <td className="py-3 px-3">
                      {row.risk_level ? (
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border-l-4 rounded-[2px] ${
                          row.risk_level === 'ELEVATED'
                            ? 'bg-[#C97A2B]/15 text-[#C97A2B] border-[#C97A2B]'
                            : 'bg-[#6B8E5A]/15 text-[#6B8E5A] border-[#6B8E5A]'
                        }`}>
                          {row.risk_level} ({Math.round((row.risk_score || 0) * 100)}%)
                        </span>
                      ) : (
                        <span className="text-[#8A9099] text-[10px]">PENDING</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {row.welfare_review_flag ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-[#A33F3F]/15 dark:bg-[#A33F3F]/15 light:bg-[#7A2E2E]/15 text-[#A33F3F] dark:text-[#A33F3F] light:text-[#7A2E2E] border-l-4 border-[#A33F3F] uppercase rounded-[2px]">
                          <Flag className="w-3 h-3" /> FLAG ACTIVE
                        </span>
                      ) : (
                        <span className="text-[#8A9099] text-[10px]">NORMAL</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#8A9099] text-[11px]">
                      {row.last_assessment_date || 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-white border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F] hover:bg-[#1E2630] rounded-[2px] inline-flex items-center gap-1">
                        <span>DOSSIER</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Case Detail Panel (Appears when a personnel row is selected) */}
      {selectedUserId && (
        <div className="bg-[#12161C] dark:bg-[#12161C] light:bg-white border border-[#D9A441] dark:border-[#D9A441] light:border-[#1F3A5F] p-6 rounded-[2px] space-y-6 animate-in slide-in-from-bottom-2 duration-300">
          
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] pb-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] font-mono">
                  CASE DOSSIER: {caseData?.user?.full_name || 'LOADING...'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-[#4A6572]/20 text-[#D9A441] border-l-2 border-[#D9A441] uppercase">
                  SVC NO: {caseData?.user?.service_number}
                </span>
              </div>
              <p className="text-xs text-[#8A9099] font-mono mt-0.5">
                SUB-UNIT: {caseData?.user?.sub_unit_id} | ASSIGNED OFFICER: {currentUser?.full_name}
              </p>
            </div>
            <button
              onClick={() => setSelectedUserId(null)}
              className="p-1 text-[#8A9099] hover:text-[#E8E6E1] border border-[#1E2630] rounded-[2px]"
              title="Close Case Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loadingCase ? (
            <div className="py-12 text-center text-xs font-mono text-[#8A9099] animate-pulse">
              LOADING COMPREHENSIVE CASE FILE & TREE-SHAP ANALYTICS...
            </div>
          ) : caseData ? (
            <div className="space-y-6">
              
              {/* Welfare Review Flag Prominent Callout Box */}
              {caseData.latest_assessment?.welfare_review_flag ? (
                <div className="bg-[#A33F3F]/15 dark:bg-[#A33F3F]/15 light:bg-[#7A2E2E]/15 border-l-4 border-[#A33F3F] dark:border-[#A33F3F] light:border-[#7A2E2E] p-4 rounded-[2px] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#A33F3F] dark:text-[#A33F3F] light:text-[#7A2E2E] font-mono font-bold text-xs uppercase tracking-wider">
                      <Flag className="w-4 h-4" />
                      <span>WELFARE REVIEW FLAG DETECTED</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-[#A33F3F]/20 text-[#E8E6E1] px-2 py-0.5 rounded-[2px]">
                      OBJECTIVE VS SUBJECTIVE DIVERGENCE
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] leading-relaxed">
                    {caseData.latest_assessment.divergence_reason}
                  </p>
                  <p className="text-[10px] font-mono text-[#8A9099] italic">
                    Note: The Welfare Review Flag indicates that objective duty strain does not match self-reported wellbeing metrics. A human welfare review is recommended.
                  </p>
                </div>
              ) : (
                <div className="bg-[#6B8E5A]/10 border-l-4 border-[#6B8E5A] p-3 text-xs font-mono text-[#6B8E5A] flex items-center justify-between rounded-[2px]">
                  <span>No Welfare Review Flag triggered. Self-report metrics align with objective duty strain.</span>
                  <span className="text-[10px] uppercase font-bold">NORMAL STATUS</span>
                </div>
              )}

              {/* Grid: Left Top Factors & Action Form, Right Comparison Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Top Factors & Welfare Action Form (6 cols) */}
                <div className="lg:col-span-6 space-y-6">
                  
                  {/* Top Factors Bar List */}
                  <div className="bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] p-4 border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] rounded-[2px] space-y-3">
                    <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F]">
                      Key Welfare Risk Factors (TreeSHAP Explanation)
                    </span>

                    {caseData.latest_top_factors && caseData.latest_top_factors.length > 0 ? (
                      <div className="space-y-3">
                        {caseData.latest_top_factors.map((factor, idx) => {
                          const isRisk = factor.direction === 'increases_risk';
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] capitalize">
                                  {factor.factor}
                                </span>
                                <span className={`font-bold ${isRisk ? 'text-[#C97A2B]' : 'text-[#6B8E5A]'}`}>
                                  {isRisk ? '+ INCREASES RISK' : '- PROTECTIVE'} ({factor.impact})
                                </span>
                              </div>
                              {/* Horizontal Bar */}
                              <div className="w-full h-2 bg-[#12161C] dark:bg-[#12161C] light:bg-white border border-[#1E2630] rounded-[2px] overflow-hidden">
                                <div 
                                  className={`h-full ${isRisk ? 'bg-[#C97A2B]' : 'bg-[#6B8E5A]'}`}
                                  style={{ width: `${Math.min(Math.abs(factor.impact) * 200, 100)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs font-mono text-[#8A9099]">No factor explanations available.</div>
                    )}
                  </div>

                  {/* Welfare Action Form */}
                  <div className="bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] p-4 border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] rounded-[2px] space-y-4">
                    <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F]">
                      Record Welfare Action / Intervention
                    </span>

                    {actionSuccess && (
                      <div className="p-2.5 bg-[#6B8E5A]/15 border-l-4 border-[#6B8E5A] text-xs font-mono text-[#6B8E5A] font-bold">
                        [SUCCESS]: Welfare action recorded successfully.
                      </div>
                    )}

                    <form onSubmit={handleActionSubmit} className="space-y-3 font-mono text-xs">
                      <div>
                        <label className="block text-[10px] uppercase text-[#8A9099] mb-1">
                          RECOMMENDED INTERVENTION TYPE
                        </label>
                        <select
                          value={actionType}
                          onChange={(e) => setActionType(e.target.value)}
                          className="w-full bg-[#12161C] dark:bg-[#12161C] light:bg-white border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] px-3 py-2 text-xs font-mono text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] focus:outline-none focus:border-[#D9A441] rounded-[2px]"
                        >
                          <option value="REST_RECOMMENDATION">REST RECOMMENDATION</option>
                          <option value="DUTY_REALLOCATION">DUTY REALLOCATION</option>
                          <option value="COUNSELING_SESSION">COUNSELING SESSION</option>
                          <option value="ROUTINE_CHECK">ROUTINE CHECK</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase text-[#8A9099] mb-1">
                          OFFICER INTERVENTION NOTES
                        </label>
                        <textarea
                          rows="3"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Enter intervention rationale, officer observations, or duty adjustments..."
                          className="w-full bg-[#12161C] dark:bg-[#12161C] light:bg-white border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] p-2.5 text-xs font-mono text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] focus:outline-none focus:border-[#D9A441] rounded-[2px]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase text-[#8A9099] mb-1">
                          SCHEDULED FOLLOW-UP DATE
                        </label>
                        <input
                          type="date"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          className="w-full bg-[#12161C] dark:bg-[#12161C] light:bg-white border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] px-3 py-1.5 text-xs font-mono text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] focus:outline-none focus:border-[#D9A441] rounded-[2px]"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingAction}
                        className="w-full py-2 bg-[#D9A441] dark:bg-[#D9A441] light:bg-[#1F3A5F] text-black dark:text-black light:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-[2px] hover:bg-[#b88932] transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{submittingAction ? 'RECORDING...' : 'SAVE WELFARE ACTION'}</span>
                      </button>
                    </form>
                  </div>

                </div>

                {/* Right: Objective Strain vs Self-Report Chart & Previous Actions (6 cols) */}
                <div className="lg:col-span-6 space-y-6">
                  
                  {/* Objective Workload vs Self-Report Comparison Chart */}
                  <div className="bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] p-4 border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] rounded-[2px] space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F]">
                        Objective Workload vs Self-Reported Wellbeing
                      </span>
                      <span className="text-[9px] font-mono text-[#8A9099] uppercase">DIVERGENCE TRACKER</span>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E2630" />
                          <XAxis dataKey="date" stroke="#8A9099" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                          <YAxis yAxisId="left" domain={[0, 5]} stroke="#C97A2B" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                          <YAxis yAxisId="right" orientation="right" domain={[0, 5]} stroke="#6B8E5A" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#12161C', borderColor: '#1E2630', fontSize: '11px', fontFamily: 'monospace' }} />
                          <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                          <Bar yAxisId="left" dataKey="Workload Intensity" fill="#C97A2B" opacity={0.6} />
                          <Line yAxisId="right" type="monotone" dataKey="Self-Report Wellbeing" stroke="#6B8E5A" strokeWidth={2.5} dot={{ r: 3 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] font-mono text-[#8A9099] italic">
                      Bars indicate objective workload strain (1-5). Line indicates self-reported wellbeing index (1-5). Divergence occurs when bars are high while line remains artificially high.
                    </p>
                  </div>

                  {/* Recorded Welfare Actions History */}
                  <div className="bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] p-4 border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] rounded-[2px] space-y-3">
                    <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F]">
                      Recorded Case Action History ({caseData.welfare_cases?.length || 0})
                    </span>

                    {caseData.welfare_cases && caseData.welfare_cases.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {caseData.welfare_cases.map((c) => (
                          <div key={c.id} className="p-2.5 bg-[#12161C] dark:bg-[#12161C] light:bg-white border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] rounded-[2px] text-xs font-mono space-y-1">
                            <div className="flex items-center justify-between text-[#D9A441]">
                              <span className="font-bold uppercase">{c.action_type}</span>
                              <span className="text-[10px] text-[#8A9099]">FOLLOW-UP: {c.follow_up_date}</span>
                            </div>
                            <p className="text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] text-[11px]">
                              {c.notes || 'No notes entered.'}
                            </p>
                            <div className="text-[9px] text-[#8A9099] flex justify-between">
                              <span>BY: {c.officer_id}</span>
                              <span>STATUS: {c.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-mono text-[#8A9099]">No previous welfare actions recorded for this officer.</p>
                    )}
                  </div>

                </div>

              </div>

            </div>
          ) : null}

        </div>
      )}

    </div>
  );
}
