import React, { useState } from 'react';
import type { SimulatorState } from '../simulator/logic';
import {
  simulateUpTierDrill,
  type TierStandard,
  type UpTierSimulationReport,
} from '../simulator/logic';
import {
  ShieldCheck,
  ShieldAlert,
  Zap,
  Activity,
  ArrowRight,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  Cpu,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Server,
  Droplets,
  Wind,
} from 'lucide-react';

interface UpTierAnalysisViewProps {
  state: SimulatorState;
  onNavigateToTab?: (tab: 'ee' | 'ups' | 'floor' | 'ac' | 'overview' | 'ups-efficiency' | 'hv-diagram' | 'up-tier') => void;
  onNavigateToEquipment?: (tab: 'ee' | 'ups' | 'floor' | 'ac' | 'overview' | 'ups-efficiency' | 'hv-diagram' | 'up-tier', elementId: string) => void;
}

export const UpTierAnalysisView: React.FC<UpTierAnalysisViewProps> = ({
  state,
  onNavigateToTab,
  onNavigateToEquipment,
}) => {
  const [selectedTier, setSelectedTier] = useState<TierStandard>('TIER_4');
  const [activeScenario, setActiveScenario] = useState<
    'HV_FEED_LOSS' | 'MDB1A_SHORT_CIRCUIT' | 'CRAC_CHILLER_RUPTURE'
  >('HV_FEED_LOSS');
  const [drillResult, setDrillResult] = useState<UpTierSimulationReport>(() =>
    simulateUpTierDrill('TIER_4', 'HV_FEED_LOSS')
  );
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const handleRunDrill = (
    tier: TierStandard,
    scenario: 'HV_FEED_LOSS' | 'MDB1A_SHORT_CIRCUIT' | 'CRAC_CHILLER_RUPTURE'
  ) => {
    setIsSimulating(true);
    setTimeout(() => {
      const result = simulateUpTierDrill(tier, scenario);
      setDrillResult(result);
      setIsSimulating(false);
    }, 400);
  };

  return (
    <div className="flex flex-col gap-4 text-xs select-none">
      {/* Top Banner */}
      <div className="bg-[#1f1f1f] border border-[#444] rounded px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="bg-[#cc0000] text-white font-extrabold px-2 py-0.5 rounded text-sm tracking-wider">
              FXL
            </span>
            <span className="font-extrabold text-white text-base tracking-widest font-mono">
              SILA1
            </span>
          </div>
          <div className="h-6 w-[1px] bg-[#555]" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              DATA CENTER UP-TIER SIMULATION & FAULT TOLERANCE ENGINE
            </h2>
            <span className="text-[10px] text-gray-400 font-mono">
              EVALUATION: TIER III (CONCURRENTLY MAINTAINABLE) ➔ TIER IV (FAULT TOLERANT 2(N+1))
            </span>
          </div>
        </div>

        {/* Tier Mode Selector */}
        <div className="flex items-center gap-2 bg-[#151515] p-1 rounded border border-[#333]">
          <span className="text-[11px] text-gray-400 px-2 font-semibold">โหมดสถาปัตยกรรม:</span>
          <button
            type="button"
            onClick={() => {
              setSelectedTier('TIER_3');
              handleRunDrill('TIER_3', activeScenario);
            }}
            className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
              selectedTier === 'TIER_3'
                ? 'bg-amber-600 text-black shadow font-extrabold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            TIER III (N+1)
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedTier('TIER_4');
              handleRunDrill('TIER_4', activeScenario);
            }}
            className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              selectedTier === 'TIER_4'
                ? 'bg-emerald-600 text-white shadow font-extrabold ring-1 ring-emerald-300'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>TIER IV 2(N+1)</span>
          </button>
        </div>
      </div>

      {/* Drill Scenario Selector */}
      <div className="bg-[#262626] border border-[#444] rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-300 text-xs flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-cyan-400" />
            สถานการณ์ทดสอบการทนทานต่อความผิดพร่อง (Fault Injection Drill):
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setActiveScenario('HV_FEED_LOSS');
                handleRunDrill(selectedTier, 'HV_FEED_LOSS');
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                activeScenario === 'HV_FEED_LOSS'
                  ? 'bg-[#007acc] text-white font-bold ring-1 ring-blue-300'
                  : 'bg-[#333] text-gray-300 hover:bg-[#444]'
              }`}
            >
              ⚡ 22kV HV Incomer Loss
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveScenario('MDB1A_SHORT_CIRCUIT');
                handleRunDrill(selectedTier, 'MDB1A_SHORT_CIRCUIT');
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                activeScenario === 'MDB1A_SHORT_CIRCUIT'
                  ? 'bg-[#007acc] text-white font-bold ring-1 ring-blue-300'
                  : 'bg-[#333] text-gray-300 hover:bg-[#444]'
              }`}
            >
              💥 MDB1A Busbar Short
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveScenario('CRAC_CHILLER_RUPTURE');
                handleRunDrill(selectedTier, 'CRAC_CHILLER_RUPTURE');
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                activeScenario === 'CRAC_CHILLER_RUPTURE'
                  ? 'bg-[#007acc] text-white font-bold ring-1 ring-blue-300'
                  : 'bg-[#333] text-gray-300 hover:bg-[#444]'
              }`}
            >
              💧 CRAC Rupture & FAS
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleRunDrill(selectedTier, activeScenario)}
          disabled={isSimulating}
          className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
          <span>{isSimulating ? 'กำลังทดสอบ...' : 'จำลองการตัดแยกอัตโนมัติ (Re-run Drill)'}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#242424] border border-[#444] rounded p-3 flex flex-col">
          <span className="text-[10px] text-gray-400 uppercase font-mono">
            Autonomous Isolation Time
          </span>
          <span
            className={`text-xl font-bold font-mono mt-1 ${
              drillResult.autonomousIsolationTimeMs <= 20
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}
          >
            {drillResult.autonomousIsolationTimeMs} ms
          </span>
          <span className="text-[10px] text-gray-400 mt-1">
            {drillResult.autonomousIsolationTimeMs <= 20
              ? '⚡ Sub-cycle Optical Trip (Tier IV)'
              : '⏳ Mechanical ATS Relay (Tier III)'}
          </span>
        </div>

        <div className="bg-[#242424] border border-[#444] rounded p-3 flex flex-col">
          <span className="text-[10px] text-gray-400 uppercase font-mono">
            IT Load Interruption
          </span>
          <span className="text-xl font-bold font-mono mt-1 text-emerald-400">
            {drillResult.itLoadLossKw} kW (0 ms)
          </span>
          <span className="text-[10px] text-gray-400 mt-1">
            Dual-corded 100% Ride-through
          </span>
        </div>

        <div className="bg-[#242424] border border-[#444] rounded p-3 flex flex-col">
          <span className="text-[10px] text-gray-400 uppercase font-mono">
            Uptime Standard Rating
          </span>
          <span
            className={`text-xl font-bold font-mono mt-1 ${
              selectedTier === 'TIER_4' ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {selectedTier === 'TIER_4' ? '99.995%' : '99.982%'}
          </span>
          <span className="text-[10px] text-gray-400 mt-1">
            Max Down-time: {selectedTier === 'TIER_4' ? '26.3 min/yr' : '1.6 hr/yr'}
          </span>
        </div>

        <div className="bg-[#242424] border border-[#444] rounded p-3 flex flex-col">
          <span className="text-[10px] text-gray-400 uppercase font-mono">
            Fault Tolerance Status
          </span>
          <span
            className={`text-xl font-bold font-mono mt-1 ${
              drillResult.faultTolerancePass ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {drillResult.faultTolerancePass ? 'PASS (PASSED)' : 'WARNING (RISK)'}
          </span>
          <span className="text-[10px] text-gray-400 mt-1">
            Compartment Isolation: {selectedTier === 'TIER_4' ? 'Active' : 'Shared'}
          </span>
        </div>
      </div>

      {/* Main Simulation Report & Architecture Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Active Drill Report & Operational Sequence */}
        <div className="bg-[#242424] border border-[#444] rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#3a3a3a] pb-2">
            <h3 className="font-bold text-white text-xs flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>ผลการทดสอบ: {drillResult.scenarioName}</span>
            </h3>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                drillResult.tierCertificationStatus === 'COMPLIANT'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                  : 'bg-amber-950 text-amber-300 border border-amber-500'
              }`}
            >
              {drillResult.tierCertificationStatus}
            </span>
          </div>

          <div className="text-[11px] text-gray-300 space-y-1">
            <div>
              <strong className="text-gray-400">จุดที่เกิดเหตุ:</strong>{' '}
              <span className="text-amber-300 font-mono">{drillResult.faultInjectedLocation}</span>
            </div>
            <div>
              <strong className="text-gray-400">สายจ่ายไฟที่ได้รับผลกระทบ:</strong>{' '}
              <span className="text-cyan-300 font-mono">{drillResult.pathAffected}</span>
            </div>
          </div>

          {/* Operational Chronological Log */}
          <div className="bg-[#181818] rounded p-2.5 border border-[#333] space-y-1.5 font-mono text-[11px]">
            <div className="text-gray-400 text-[10px] uppercase font-bold border-b border-[#2b2b2b] pb-1">
              Sequence of Events & Protective Relaying:
            </div>
            {drillResult.operationalLogs.map((log, idx) => (
              <div key={idx} className="text-gray-300 leading-relaxed">
                {log}
              </div>
            ))}
          </div>

          {/* Compliance Checklist */}
          <div className="space-y-1.5 pt-1">
            <span className="text-gray-400 text-[10px] uppercase font-bold">
              Uptime Institute Tier Compliance Criteria:
            </span>
            {drillResult.complianceDetails.map((detail, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-gray-200">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    drillResult.faultTolerancePass ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                />
                <span>{detail}</span>
              </div>
            ))}
          </div>

          {/* Link to Affected Equipment */}
          <div className="mt-auto pt-3 border-t border-[#3a3a3a] flex items-center justify-between">
            <span className="text-gray-400 text-[11px]">
              ต้องการตรวจสอบอุปกรณ์จุดเกิดเหตุ?
            </span>
            <button
              type="button"
              onClick={() => {
                if (activeScenario === 'HV_FEED_LOSS') {
                  onNavigateToTab && onNavigateToTab('hv-diagram');
                } else if (activeScenario === 'MDB1A_SHORT_CIRCUIT') {
                  onNavigateToEquipment && onNavigateToEquipment('ee', 'mdb-1a');
                } else {
                  onNavigateToTab && onNavigateToTab('ac');
                }
              }}
              className="px-3 py-1.5 rounded bg-[#007acc] hover:bg-[#0094f7] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
            >
              <span>ดึงไปหาอุปกรณ์ที่มีปัญหา ↗</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Tier III vs Tier IV Physical Architecture Diagram */}
        <div className="bg-[#242424] border border-[#444] rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#3a3a3a] pb-2">
            <h3 className="font-bold text-white text-xs flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>เปรียบเทียบสถาปัตยกรรม SILA1: TIER III vs TIER IV</span>
            </h3>
            <span className="text-[10px] font-mono text-gray-400">TIA-942 SPEC</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Tier III Column */}
            <div className="bg-[#1c1c1c] border border-amber-600/40 rounded p-3 flex flex-col gap-2">
              <div className="font-bold text-amber-400 text-xs border-b border-amber-500/30 pb-1">
                TIER III (Concurrently Maintainable)
              </div>
              <ul className="text-[11px] text-gray-300 space-y-1.5 list-disc list-inside">
                <li>1 Active Path + 1 Alternate Path</li>
                <li>สามารถนำอุปกรณ์ออกซ่อมบำรุงได้โดยไม่ต้องดับ IT Load</li>
                <li><strong className="text-amber-300">จุดอ่อน:</strong> หากเกิด Unplanned Event ขณะซ่อมบำรุง โหลดจะเกิดความเสี่ยงสูง (N Mode)</li>
                <li>ห้องสวิตช์บอร์ด MDB1A/MDB1B อยู่ร่วมกัน (No Fire Separation)</li>
                <li>การตัดแยกต้องอาศัยการสั่งการของ Operator หรือหน่วงเวลา</li>
              </ul>
            </div>

            {/* Tier IV Column */}
            <div className="bg-[#17261a] border border-emerald-500/60 rounded p-3 flex flex-col gap-2">
              <div className="font-bold text-emerald-300 text-xs border-b border-emerald-500/30 pb-1 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>TIER IV (Fault Tolerant 2(N+1))</span>
              </div>
              <ul className="text-[11px] text-gray-300 space-y-1.5 list-disc list-inside">
                <li>2 Active-Active Compartmentalized Paths</li>
                <li>ระบบทนทานต่อความล้มเหลวทุกรูปแบบโดยสมบูรณ์ (Fault Tolerant)</li>
                <li><strong className="text-emerald-300">จุดเด่น:</strong> มีผนังทนไฟ 2-3 ชม. กั้นแยกระหว่าง Power Room A และ Power Room B โดยเด็ดขาด</li>
                <li>ระบบตัดแยกอัตโนมัติ (Autonomous Optical/Static Isolation) &lt; 15ms</li>
                <li>ระบบความเย็นทำงานต่อเนื่องแบบ Continuous Cooling Ride-through</li>
              </ul>
            </div>
          </div>

          {/* Recommendation Box */}
          <div className="bg-[#1a1a1a] rounded p-3 border-l-4 border-emerald-500 mt-auto text-xs">
            <strong className="text-emerald-400 font-mono">วิศวกรรมข้อสรุปสำหรับ Up-Tier SILA1:</strong>
            <p className="text-gray-300 mt-1 leading-relaxed">
              {drillResult.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
