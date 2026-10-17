import React, { useState, useEffect } from 'react';
import { getCommanderSubunits, getCommanderAnalytics } from '../api';
import { 
  ShieldAlert, 
  Lock, 
  Users, 
  Activity, 
  Flag, 
  CheckCircle, 
  AlertTriangle,
  Layers,
  Shield,
  EyeOff
} from 'lucide-react';

const UNITS = ['ALPHA', 'BRAVO', 'CHARLIE'];

export default function CommanderView({ currentUser }) {
  const [selectedUnit, setSelectedUnit] = useState('ALPHA');
  const [subunits, setSubunits] = useState([]);
  const [loadingSubunits, setLoadingSubunits] = useState(false);
  const [selectedSubUnit, setSelectedSubUnit] = useState(null); // null means unit-level aggregate
  
  // Analytics response state
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Fetch subunits when unit changes
  useEffect(() => {
    let isMounted = true;
    const fetchSubunits = async () => {
      setLoadingSubunits(true);
      setSelectedSubUnit(null); // Reset sub-unit selection on unit switch
      try {
        const data = await getCommanderSubunits(selectedUnit);
        if (isMounted) setSubunits(data || []);
      } catch (err) {
        console.error("Failed to load commander subunits:", err);
      } finally {
        if (isMounted) setLoadingSubunits(false);
      }
    };

    fetchSubunits();
    return () => { isMounted = false; };
  }, [selectedUnit]);

  // Fetch analytics when selectedUnit or selectedSubUnit changes
  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async () => {
      setLoadingAnalytics(true);
      try {
        const data = await getCommanderAnalytics(selectedUnit, selectedSubUnit);
        if (isMounted) setAnalytics(data);
      } catch (err) {
        console.error("Failed to load commander analytics:", err);
      } finally {
        if (isMounted) setLoadingAnalytics(false);
      }
    };

    fetchAnalytics();
    return () => { isMounted = false; };
  }, [selectedUnit, selectedSubUnit]);

  return (
    <div className="space-y-6">
      
      {/* Commander Header Dossier */}
      <div className="bg-[#12161C] dark:bg-[#12161C] light:bg-white border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] p-4 rounded-[2px] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] flex items-center justify-center text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold uppercase tracking-wider text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] font-mono">
                Commander Tactical Analytics
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-[#4A6572]/20 text-[#D9A441] border-l-2 border-[#D9A441] uppercase">
                {currentUser?.full_name || 'COMMANDER'}
              </span>
            </div>
            <p className="text-xs text-[#8A9099] dark:text-[#8A9099] light:text-[#6B6F76] font-mono">
              k-ANONYMITY PRIVACY PROTECTED COHORT ANALYTICS (k ≥ 5 ENFORCED)
            </p>
          </div>
        </div>

        {/* Unit Selector Tabs */}
        <div className="flex items-center bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] p-1 rounded-[2px]">
          <span className="text-[10px] font-mono uppercase text-[#8A9099] px-2">Unit:</span>
          {UNITS.map(unit => (
            <button
              key={unit}
              onClick={() => setSelectedUnit(unit)}
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

      {/* Sub-Unit Selector Row with k-Anonymity Visual Lock Indicators */}
      <div className="bg-[#12161C] dark:bg-[#12161C] light:bg-white border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] p-4 rounded-[2px] space-y-3">
        <div className="flex items-center justify-between border-b border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F]" />
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21]">
              Select Cohort / Sub-Unit ({selectedUnit} UNIT)
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#8A9099] uppercase">
            PRIVACY THRESHOLD: k=5 MINIMUM PERSONNEL
          </span>
        </div>

        {loadingSubunits ? (
          <div className="py-4 text-center text-xs font-mono text-[#8A9099] animate-pulse">
            LOADING SUB-UNITS & PRIVACY AUDIT...
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Unit Overall Button */}
            <button
              onClick={() => setSelectedSubUnit(null)}
              className={`px-3 py-2 text-xs font-mono font-bold uppercase rounded-[2px] border transition-all flex items-center gap-2 ${
                selectedSubUnit === null
                  ? 'bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] text-[#D9A441] border-[#D9A441] border-l-4'
                  : 'bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-white text-[#8A9099] border-[#1E2630] hover:text-[#E8E6E1]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>ALL SUB-UNITS ({selectedUnit} OVERVIEW)</span>
            </button>

            {/* Sub-Unit Cards */}
            {subunits.map((sub) => {
              const isLocked = !sub.meets_k_anonymity;
              const isSelected = selectedSubUnit === sub.sub_unit_id;

              return (
                <button
                  key={sub.sub_unit_id}
                  onClick={() => setSelectedSubUnit(sub.sub_unit_id)}
                  className={`px-3.5 py-2 text-xs font-mono rounded-[2px] border transition-all flex items-center gap-2 relative ${
                    isLocked
                      ? 'opacity-50 cursor-not-allowed bg-[#0B0E11]/60 text-[#8A9099] border-[#1E2630]'
                      : isSelected
                      ? 'bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F] border-[#D9A441] border-l-4 font-bold'
                      : 'bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-white text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] border-[#1E2630] hover:border-[#4A6572]'
                  }`}
                >
                  {isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-[#C97A2B]" />
                  ) : (
                    <Users className="w-3.5 h-3.5 text-[#6B8E5A]" />
                  )}

                  <span>{sub.sub_unit_id}</span>
                  <span className="text-[10px] text-[#8A9099]">({sub.personnel_count} PNL)</span>

                  {isLocked && (
                    <span className="ml-1 px-1.5 py-0.2 text-[9px] font-mono bg-[#C97A2B]/20 text-[#C97A2B] border border-[#C97A2B]/30 uppercase rounded-[2px]">
                      LOCKED (k&lt;5)
                    </span>
                  )}
                </button>
              );
            })}

          </div>
        )}
      </div>

      {/* Main Analytics Display Area */}
      <div className="bg-[#12161C] dark:bg-[#12161C] light:bg-white border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] p-6 rounded-[2px] space-y-6">
        <div className="flex items-center justify-between border-b border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#D9A441] dark:text-[#D9A441] light:text-[#1F3A5F]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] font-mono">
              Cohort Welfare Dashboard ({selectedSubUnit || `ALL ${selectedUnit} SUB-UNITS`})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#8A9099] uppercase">
            SERVER-SIDE SQL k-ANONYMITY FILTER
          </span>
        </div>

        {loadingAnalytics ? (
          <div className="py-16 text-center text-xs font-mono text-[#8A9099] animate-pulse">
            CALCULATING COHORT AGGREGATE METRICS...
          </div>
        ) : analytics?.status === 'SUPPRESSED' ? (
          
          /* SUPPRESSED privacy state card */
          <div className="bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] border-2 border-[#C97A2B] p-6 rounded-[2px] space-y-4 text-center max-w-2xl mx-auto my-4">
            <div className="w-12 h-12 bg-[#C97A2B]/10 border border-[#C97A2B] rounded-[2px] flex items-center justify-center mx-auto text-[#C97A2B]">
              <EyeOff className="w-6 h-6" />
            </div>

            <div className="space-y-1 font-mono">
              <span className="px-2.5 py-1 text-xs font-bold bg-[#C97A2B]/20 text-[#C97A2B] border border-[#C97A2B]/40 uppercase tracking-widest inline-block rounded-[2px]">
                PRIVACY SUPPRESSION ACTIVE (k-ANONYMITY ENFORCED)
              </span>
              <h4 className="text-sm font-bold text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21] pt-2">
                {analytics.message}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-2 font-mono">
              <div className="bg-[#12161C] dark:bg-[#12161C] light:bg-white p-3 border border-[#1E2630] rounded-[2px]">
                <span className="block text-[10px] text-[#8A9099] uppercase">COHORT SIZE</span>
                <span className="text-lg font-bold text-[#C97A2B]">{analytics.cohort_size} Personnel</span>
              </div>
              <div className="bg-[#12161C] dark:bg-[#12161C] light:bg-white p-3 border border-[#1E2630] rounded-[2px]">
                <span className="block text-[10px] text-[#8A9099] uppercase">REQUIRED THRESHOLD (k)</span>
                <span className="text-lg font-bold text-[#E8E6E1]">{analytics.min_required_k} Personnel</span>
              </div>
            </div>

            <p className="text-xs font-mono text-[#8A9099] leading-relaxed max-w-md mx-auto pt-2">
              Individual-level data and small group metrics are automatically suppressed by the SQL backend to protect personnel confidentiality. Aggregate metrics require at least {analytics.min_required_k} personnel.
            </p>
          </div>

        ) : analytics?.status === 'AUTHORIZED' && analytics.metrics ? (
          
          /* AUTHORIZED aggregate metrics view */
          <div className="space-y-6">
            
            {/* 4 Stat Cards HUD Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Average Risk Score */}
              <div className="bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] p-4 border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] border-l-4 border-l-[#D9A441] rounded-[2px] space-y-2">
                <div className="flex justify-between items-center text-[#8A9099]">
                  <span className="text-[10px] font-mono uppercase tracking-wider">AVG WELFARE RISK SCORE</span>
                  <Activity className="w-4 h-4 text-[#D9A441]" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21]">
                    {analytics.metrics.avg_risk_score}
                  </span>
                  <span className="text-xs font-mono text-[#D9A441]">
                    ({Math.round(analytics.metrics.avg_risk_score * 100)}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#12161C] border border-[#1E2630] rounded-[2px] overflow-hidden">
                  <div 
                    className="h-full bg-[#D9A441]"
                    style={{ width: `${analytics.metrics.avg_risk_score * 100}%` }}
                  />
                </div>
              </div>

              {/* Card 2: Percent Elevated Risk */}
              <div className="bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] p-4 border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] border-l-4 border-l-[#C97A2B] rounded-[2px] space-y-2">
                <div className="flex justify-between items-center text-[#8A9099]">
                  <span className="text-[10px] font-mono uppercase tracking-wider">ELEVATED RISK RATIO</span>
                  <AlertTriangle className="w-4 h-4 text-[#C97A2B]" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold text-[#C97A2B]">
                    {analytics.metrics.pct_elevated}%
                  </span>
                  <span className="text-[10px] font-mono text-[#8A9099]">
                    OF COHORT
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#12161C] border border-[#1E2630] rounded-[2px] overflow-hidden">
                  <div 
                    className="h-full bg-[#C97A2B]"
                    style={{ width: `${analytics.metrics.pct_elevated}%` }}
                  />
                </div>
              </div>

              {/* Card 3: Welfare Review Flags */}
              <div className="bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] p-4 border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] border-l-4 border-l-[#A33F3F] rounded-[2px] space-y-2">
                <div className="flex justify-between items-center text-[#8A9099]">
                  <span className="text-[10px] font-mono uppercase tracking-wider">WELFARE REVIEW FLAGS</span>
                  <Flag className="w-4 h-4 text-[#A33F3F]" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold text-[#E8E6E1] dark:text-[#E8E6E1] light:text-[#1A1D21]">
                    {analytics.metrics.welfare_review_flags}
                  </span>
                  <span className="text-[10px] font-mono text-[#A33F3F] uppercase font-bold">
                    DIVERGENCES
                  </span>
                </div>
                <p className="text-[10px] font-mono text-[#8A9099]">
                  Active strain vs self-report flags
                </p>
              </div>

              {/* Card 4: Operational Readiness Index */}
              <div className="bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] p-4 border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] border-l-4 border-l-[#6B8E5A] rounded-[2px] space-y-2">
                <div className="flex justify-between items-center text-[#8A9099]">
                  <span className="text-[10px] font-mono uppercase tracking-wider">READINESS INDEX</span>
                  <CheckCircle className="w-4 h-4 text-[#6B8E5A]" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold text-[#6B8E5A]">
                    {analytics.metrics.readiness_index}%
                  </span>
                  <span className="text-[10px] font-mono text-[#8A9099]">
                    COHORT SCORE
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#12161C] border border-[#1E2630] rounded-[2px] overflow-hidden">
                  <div 
                    className="h-full bg-[#6B8E5A]"
                    style={{ width: `${analytics.metrics.readiness_index}%` }}
                  />
                </div>
              </div>

            </div>

            {/* Cohort Summary Details */}
            <div className="bg-[#0B0E11] dark:bg-[#0B0E11] light:bg-[#F4F2ED] p-4 border border-[#1E2630] dark:border-[#1E2630] light:border-[#D8D4CA] rounded-[2px] font-mono text-xs space-y-2">
              <div className="flex justify-between items-center text-[#D9A441]">
                <span className="font-bold uppercase tracking-wider">COHORT AUDIT & ANONYMITY STATUS</span>
                <span className="text-[10px] bg-[#6B8E5A]/20 text-[#6B8E5A] border border-[#6B8E5A]/40 px-2 py-0.5 font-bold uppercase rounded-[2px]">
                  AUTHORIZED (k={analytics.cohort_size} ≥ 5)
                </span>
              </div>
              <p className="text-[#8A9099] leading-relaxed text-[11px]">
                Showing aggregate metrics for {analytics.cohort_size} personnel in {selectedSubUnit || `Unit ${selectedUnit}`}.
                Data is computed using server-side SQL aggregation. Individual personnel records are strictly shielded from the Commander interface per privacy protocol.
              </p>
            </div>

          </div>

        ) : (
          <div className="py-12 text-center text-xs font-mono text-[#8A9099]">
            Select a sub-unit or overview tab to view aggregate commander analytics.
          </div>
        )}

      </div>

    </div>
  );
}
