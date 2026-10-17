import React, { useState, useEffect } from 'react';
import { submitCheckin, getPersonnelHistory } from '../api';
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Calendar, 
  Zap, 
  Moon, 
  Brain, 
  CheckCircle, 
  Flag, 
  HelpCircle,
  Sliders,
  Send,
  Sparkles
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function PersonnelView({ currentUser }) {
  // Checkin form state
  const [formData, setFormData] = useState({
    duty_hours: 8.0,
    rest_gap_hours: 12.0,
    consecutive_days: 4,
    workload_intensity: 3.0,
    energy: 3,
    sleep_quality: 3,
    mental_fatigue: 2,
    readiness: 4,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Load history when currentUser changes
  const loadHistory = async () => {
    if (!currentUser?.id) return;
    setLoadingHistory(true);
    setErrorMsg(null);
    try {
      const hist = await getPersonnelHistory(currentUser.id);
      setHistoryData(hist);
    } catch (err) {
      console.error("Error loading history:", err);
      setErrorMsg("Failed to load historical check-in data.");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
    setLastResult(null); // Reset live demo result when switching personnel account
  }, [currentUser?.id]);

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await submitCheckin(currentUser.id, {
        duty_hours: parseFloat(formData.duty_hours),
        rest_gap_hours: parseFloat(formData.rest_gap_hours),
        consecutive_days: parseInt(formData.consecutive_days, 10),
        workload_intensity: parseFloat(formData.workload_intensity),
        energy: parseInt(formData.energy, 10),
        sleep_quality: parseInt(formData.sleep_quality, 10),
        mental_fatigue: parseInt(formData.mental_fatigue, 10),
        readiness: parseInt(formData.readiness, 10),
      });

      setLastResult(res);
      // Refresh trend history after new check-in
      await loadHistory();
    } catch (err) {
      console.error("Checkin submission failed:", err);
      setErrorMsg(err.response?.data?.detail || "Check-in submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] font-mono uppercase tracking-widest text-xs border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] bg-[#12161C] dark:bg-[#12161C] light:bg-white rounded-[2px]">
        No Personnel Account Selected. Please select an account from the header.
      </div>
    );
  }

  // Format chart data
  const checkinChartData = (historyData?.checkin_history || []).map(item => ({
    date: item.checkin_date ? item.checkin_date.slice(5) : '',
    Energy: item.energy,
    Sleep: item.sleep_quality,
    Fatigue: item.mental_fatigue,
    Readiness: item.readiness,
  }));

  const riskChartData = (historyData?.risk_history || []).map(item => ({
    date: item.assessment_date ? item.assessment_date.slice(5) : '',
    RiskScore: Math.round((item.risk_score || 0) * 100),
    Level: item.risk_level,
    Flagged: Boolean(item.welfare_review_flag),
  }));

  return (
    <div className="space-y-6">
      
      {/* Personnel Profile Dossier Header */}
      <div className="bg-[#12161C] dark:bg-[#12161C] light:bg-white border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] p-4 rounded-[2px] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] flex items-center justify-center text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F] font-mono font-bold text-sm">
            {currentUser.service_number.slice(-3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold uppercase tracking-wider text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] font-mono">
                {currentUser.full_name}
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-[#4A6572]/20 dark:bg-[#4A6572]/20 light:bg-[#8C8574]/20 text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F] border-l-2 border-[#D9A441] dark:border-[#D9A441] light:border-[#1F3A5F] uppercase">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] font-mono">
              SERVICE NO: <span className="text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21]">{currentUser.service_number}</span> | UNIT: <span className="text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21]">{currentUser.unit_id}</span> / <span className="text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21]">{currentUser.sub_unit_id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76]">
          <div className="border-r border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] pr-4 text-right">
            <span className="block text-[10px] uppercase tracking-wider">Total Check-ins</span>
            <span className="text-sm font-bold text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21]">
              {historyData?.checkin_history?.length || 0}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider">Latest Status</span>
            <span className="text-sm font-bold text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F]">
              ACTIVE DUTY
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[#A33F3F]/10 dark:bg-[#A33F3F]/10 light:bg-[#7A2E2E]/10 border-l-4 border-[#A33F3F] dark:border-[#A33F3F] light:border-[#7A2E2E] text-xs font-mono text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21]">
          [ERROR]: {errorMsg}
        </div>
      )}

      {/* Main Grid: Left Checkin Form & Live Result, Right Baseline Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form & Live Result (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Daily Check-in Form Panel */}
          <div className="bg-[#12161C] dark:bg-[#12161C] light:bg-white border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] p-5 rounded-[2px]">
            <div className="flex items-center justify-between border-b border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] font-mono">
                  Daily Welfare Check-In
                </h3>
              </div>
              <span className="text-[10px] font-mono uppercase text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76]">
                SELF-REPORT & DUTY METRICS
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Section 1: Self-Reported Wellbeing (4 Sliders) */}
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F] mb-3 font-semibold border-l-2 border-[#D9A441] dark:border-[#D9A441] light:border-[#1F3A5F] pl-2">
                  1. Self-Reported Wellbeing (Scale 1 to 5)
                </p>

                <div className="space-y-3 bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] p-3 border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] rounded-[2px]">
                  
                  {/* Energy */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="flex items-center gap-1 text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21]">
                        <Zap className="w-3.5 h-3.5 text-[#D9A441]" /> Energy Level:
                      </span>
                      <span className="font-bold text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F]">
                        {formData.energy} / 5
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      step="1"
                      value={formData.energy}
                      onChange={(e) => handleChange('energy', e.target.value)}
                      className="w-full h-1.5 bg-[#1E2630] dark:bg-[#1E2630] light:bg-[#D8D4CA] appearance-none cursor-pointer rounded-[2px]"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] mt-0.5">
                      <span>1 (Exhausted)</span>
                      <span>5 (High Energy)</span>
                    </div>
                  </div>

                  {/* Sleep Quality */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="flex items-center gap-1 text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21]">
                        <Moon className="w-3.5 h-3.5 text-[#4A6572]" /> Sleep Quality:
                      </span>
                      <span className="font-bold text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F]">
                        {formData.sleep_quality} / 5
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      step="1"
                      value={formData.sleep_quality}
                      onChange={(e) => handleChange('sleep_quality', e.target.value)}
                      className="w-full h-1.5 bg-[#1E2630] dark:bg-[#1E2630] light:bg-[#D8D4CA] appearance-none cursor-pointer rounded-[2px]"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] mt-0.5">
                      <span>1 (Very Poor)</span>
                      <span>5 (Restful)</span>
                    </div>
                  </div>

                  {/* Mental Fatigue */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="flex items-center gap-1 text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21]">
                        <Brain className="w-3.5 h-3.5 text-[#C97A2B]" /> Mental Fatigue:
                      </span>
                      <span className="font-bold text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F]">
                        {formData.mental_fatigue} / 5
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      step="1"
                      value={formData.mental_fatigue}
                      onChange={(e) => handleChange('mental_fatigue', e.target.value)}
                      className="w-full h-1.5 bg-[#1E2630] dark:bg-[#1E2630] light:bg-[#D8D4CA] appearance-none cursor-pointer rounded-[2px]"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] mt-0.5">
                      <span>1 (None)</span>
                      <span>5 (Severe)</span>
                    </div>
                  </div>

                  {/* Readiness */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="flex items-center gap-1 text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21]">
                        <CheckCircle className="w-3.5 h-3.5 text-[#6B8E5A]" /> Operational Readiness:
                      </span>
                      <span className="font-bold text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F]">
                        {formData.readiness} / 5
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      step="1"
                      value={formData.readiness}
                      onChange={(e) => handleChange('readiness', e.target.value)}
                      className="w-full h-1.5 bg-[#1E2630] dark:bg-[#1E2630] light:bg-[#D8D4CA] appearance-none cursor-pointer rounded-[2px]"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] mt-0.5">
                      <span>1 (Unready)</span>
                      <span>5 (Fully Ready)</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Section 2: Duty Workload Parameters */}
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F] mb-3 font-semibold border-l-2 border-[#D9A441] dark:border-[#D9A441] light:border-[#1F3A5F] pl-2">
                  2. Operational Duty Parameters
                </p>

                <div className="grid grid-cols-2 gap-3 bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] p-3 border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] rounded-[2px]">
                  
                  {/* Duty Hours */}
                  <div>
                    <label className="block text-[11px] font-mono text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] mb-1">
                      DUTY HOURS
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={formData.duty_hours}
                      onChange={(e) => handleChange('duty_hours', e.target.value)}
                      className="w-full bg-[#12161C] dark:bg-[#12161C] light:bg-white border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] px-2.5 py-1.5 text-xs font-mono text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] focus:outline-none focus:border-[#D9A441] rounded-[2px]"
                      required
                    />
                  </div>

                  {/* Rest Gap */}
                  <div>
                    <label className="block text-[11px] font-mono text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] mb-1">
                      REST GAP (HRS)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="48"
                      step="0.5"
                      value={formData.rest_gap_hours}
                      onChange={(e) => handleChange('rest_gap_hours', e.target.value)}
                      className="w-full bg-[#12161C] dark:bg-[#12161C] light:bg-white border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] px-2.5 py-1.5 text-xs font-mono text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] focus:outline-none focus:border-[#D9A441] rounded-[2px]"
                      required
                    />
                  </div>

                  {/* Consecutive Days */}
                  <div>
                    <label className="block text-[11px] font-mono text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] mb-1">
                      CONSECUTIVE DAYS
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      step="1"
                      value={formData.consecutive_days}
                      onChange={(e) => handleChange('consecutive_days', e.target.value)}
                      className="w-full bg-[#12161C] dark:bg-[#12161C] light:bg-white border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] px-2.5 py-1.5 text-xs font-mono text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] focus:outline-none focus:border-[#D9A441] rounded-[2px]"
                      required
                    />
                  </div>

                  {/* Workload Intensity */}
                  <div>
                    <label className="block text-[11px] font-mono text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] mb-1">
                      INTENSITY (1.0-5.0)
                    </label>
                    <input
                      type="number"
                      min="1.0"
                      max="5.0"
                      step="0.1"
                      value={formData.workload_intensity}
                      onChange={(e) => handleChange('workload_intensity', e.target.value)}
                      className="w-full bg-[#12161C] dark:bg-[#12161C] light:bg-white border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] px-2.5 py-1.5 text-xs font-mono text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] focus:outline-none focus:border-[#D9A441] rounded-[2px]"
                      required
                    />
                  </div>

                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-[#D9A441] dark:bg-[#D9A441] light:bg-[#1F3A5F] hover:bg-[#b88932] dark:hover:bg-[#b88932] light:hover:bg-[#162a45] text-black dark:text-black light:text-white font-mono font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 rounded-[2px]"
              >
                {isSubmitting ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>CALCULATING WELFARE SCORE...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>SUBMIT DAILY CHECK-IN</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Live Result Moment Display Card */}
          {lastResult && (
            <div className="bg-[#12161C] dark:bg-[#12161C] light:bg-white border border-[#D9A441] dark:border-[#D9A441] light:border-[#1F3A5F] p-5 rounded-[2px] space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D9A441]" />
                  <span className="text-xs font-bold uppercase tracking-wider font-mono text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21]">
                    LIVE ASSESSMENT RESULT
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76]">
                  DATE: {lastResult.date}
                </span>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Risk Level Badge */}
                <div className="bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] p-3 border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] rounded-[2px]">
                  <span className="block text-[10px] font-mono uppercase text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] mb-1">
                    WELFARE RISK LEVEL
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-mono font-bold uppercase tracking-wider border-l-4 rounded-[2px] ${
                      lastResult.risk_level === 'ELEVATED'
                        ? 'bg-[#C97A2B]/15 text-[#C97A2B] border-[#C97A2B]'
                        : 'bg-[#6B8E5A]/15 text-[#6B8E5A] border-[#6B8E5A]'
                    }`}>
                      {lastResult.risk_level}
                    </span>
                  </div>
                </div>

                {/* Risk Score */}
                <div className="bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] p-3 border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] rounded-[2px]">
                  <span className="block text-[10px] font-mono uppercase text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] mb-1">
                    COMPUTED RISK SCORE
                  </span>
                  <span className="text-lg font-mono font-bold text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21]">
                    {lastResult.risk_score} <span className="text-xs text-[#8A9099]">({Math.round(lastResult.risk_score * 100)}%)</span>
                  </span>
                </div>
              </div>

              {/* Welfare Review Flag Callout */}
              {lastResult.welfare_review_flag ? (
                <div className="bg-[#A33F3F]/10 dark:bg-[#A33F3F]/10 light:bg-[#7A2E2E]/10 border-l-4 border-[#A33F3F] dark:border-[#A33F3F] light:border-[#7A2E2E] p-3 rounded-[2px]">
                  <div className="flex items-center gap-2 text-[#A33F3F] dark:text-[#A33F3F] light:text-[#7A2E2E] font-mono text-xs font-bold uppercase tracking-wider mb-1">
                    <Flag className="w-4 h-4" />
                    <span>WELFARE REVIEW FLAG TRIGGERED</span>
                  </div>
                  <p className="text-xs text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] font-mono leading-relaxed">
                    {lastResult.divergence_reason || "Objective duty strain is significantly higher than self-reported wellbeing parameters."}
                  </p>
                </div>
              ) : (
                <div className="bg-[#6B8E5A]/10 border-l-4 border-[#6B8E5A] p-2.5 text-xs font-mono text-[#6B8E5A] flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>No divergence detected between duty strain & self-report.</span>
                </div>
              )}

              {/* Top Factors */}
              {lastResult.top_factors && lastResult.top_factors.length > 0 && (
                <div>
                  <span className="block text-[10px] font-mono uppercase text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] mb-2">
                    KEY RISK CONTRIBUTORS (SHAP EXPLANATION)
                  </span>
                  <div className="space-y-1.5">
                    {lastResult.top_factors.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-mono bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] p-2 border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA]">
                        <span className="text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] capitalize">
                          {f.factor}
                        </span>
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold ${
                          f.direction === 'increases_risk' ? 'text-[#C97A2B]' : 'text-[#6B8E5A]'
                        }`}>
                          {f.direction === 'increases_risk' ? '+ RISK' : '- PROTECTIVE'} ({f.impact})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Right Column: "My Baseline" Trend Charts (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-[#12161C] dark:bg-[#12161C] light:bg-white border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] p-5 rounded-[2px] space-y-6">
            <div className="flex items-center justify-between border-b border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] font-mono">
                  My Baseline Trend Analysis
                </h3>
              </div>
              <span className="text-[10px] font-mono uppercase text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76]">
                HISTORICAL RECORD
              </span>
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center text-xs font-mono text-[#8A9099] animate-pulse">
                LOADING PERSONAL HISTORICAL BASELINE...
              </div>
            ) : checkinChartData.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-[#8A9099]">
                No check-in history available for this user yet. Submit a check-in on the left.
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Chart 1: Self-Reported Metrics Trend */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-mono uppercase text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F] font-semibold">
                      Self-Reported Wellbeing Trends (1 to 5)
                    </span>
                  </div>
                  <div className="h-56 w-full bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] p-3 border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] rounded-[2px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={checkinChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E2630" />
                        <XAxis dataKey="date" stroke="#8A9099" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#8A9099" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#12161C', borderColor: '#1E2630', fontSize: '11px', fontFamily: 'monospace' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                        <Line type="monotone" dataKey="Energy" stroke="#D9A441" strokeWidth={2} dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="Sleep" stroke="#4A6572" strokeWidth={2} dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="Fatigue" stroke="#C97A2B" strokeWidth={2} dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="Readiness" stroke="#6B8E5A" strokeWidth={2} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Calculated Risk Score Trend */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-mono uppercase text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F] font-semibold">
                      Calculated Welfare Risk Score Over Time (%)
                    </span>
                  </div>
                  <div className="h-56 w-full bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] p-3 border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] rounded-[2px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={riskChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E2630" />
                        <XAxis dataKey="date" stroke="#8A9099" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                        <YAxis domain={[0, 100]} stroke="#8A9099" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#12161C', borderColor: '#1E2630', fontSize: '11px', fontFamily: 'monospace' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                        <Line type="monotone" dataKey="RiskScore" name="Risk Score (%)" stroke="#C97A2B" strokeWidth={2.5} dot={{ r: 3, fill: '#C97A2B' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
