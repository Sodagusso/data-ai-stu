import React, { useState } from 'react';
import type { SimulatorState } from '../simulator/logic';
import {
  BatteryCharging,
  Zap,
  Activity,
  RotateCcw,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Play,
  CheckCircle2,
} from 'lucide-react';

interface UpsSystemViewProps {
  state: SimulatorState;
  onToggleUps: (upsId: string) => void;
  onToggleBattery: (battId: string) => void;
  onToggleUmdbBreaker: (umdbId: string, breakerType: 'input' | 'output') => void;
  onSimulateDrill: () => void;
  onResetAll: () => void;
  onTabChange?: (tab: 'ee' | 'ups' | 'floor' | 'ac' | 'overview') => void;
  highlightedElementId?: string | null;
}

type UpsSubTab =
  | 'UPS-3A-ALL'
  | 'UPS-3B-ALL'
  | 'UPS-3A1'
  | 'UPS-3A2'
  | 'UPS-3A3'
  | 'UPS-3B1'
  | 'UPS-3B2'
  | 'UPS-3B3';

export const UpsSystemView: React.FC<UpsSystemViewProps> = ({
  state,
  onToggleUps,
  onToggleBattery,
  onToggleUmdbBreaker,
  onSimulateDrill,
  onResetAll,
  onTabChange,
  highlightedElementId,
}) => {
  const [activeTab, setActiveTab] = useState<UpsSubTab>('UPS-3A-ALL');
  const [bypassMode, setBypassMode] = useState<boolean>(false);
  const [moduleFaults, setModuleFaults] = useState<Record<number, boolean>>({});

  // Deep-link effect: switch to unit if highlighted
  React.useEffect(() => {
    if (highlightedElementId) {
      const match = (['UPS-3A1', 'UPS-3A2', 'UPS-3A3', 'UPS-3B1', 'UPS-3B2', 'UPS-3B3'] as const).find(
        (u) => u.toLowerCase() === highlightedElementId.toLowerCase()
      );
      if (match) {
        setActiveTab(match);
      } else if (highlightedElementId.includes('3b')) {
        setActiveTab('UPS-3B-ALL');
      } else if (highlightedElementId.includes('3a')) {
        setActiveTab('UPS-3A-ALL');
      }
    }
  }, [highlightedElementId]);

  // Check if grid is faulted or any battery is discharging
  const isHvFault = state.sources['src-hv'].status === 'FAULT';
  const isDischarging = Object.values(state.batteries).some((b) => b.status === 'DISCHARGE');

  // Active unit for detail view
  const isDetailView = (activeTab.startsWith('UPS-3A') && activeTab !== 'UPS-3A-ALL') || (activeTab.startsWith('UPS-3B') && activeTab !== 'UPS-3B-ALL');
  const currentUnitId = activeTab === 'UPS-3A-ALL' || activeTab === 'UPS-3B-ALL' ? (activeTab === 'UPS-3A-ALL' ? 'ups-3a1' : 'ups-3b1') : activeTab.toLowerCase();
  const currentBus = activeTab.includes('3A') ? 'A' : 'B';
  const isBusA = currentBus === 'A';

  // Specific unit and battery selected
  const selectedUps = state.upsUnits[currentUnitId] || (isBusA ? state.upsUnits['ups-3a2'] : state.upsUnits['ups-3b2']) || state.upsUnits['ups-3a1'];
  const selectedBatteryId = selectedUps?.batteryId || (isBusA ? 'batt-3a2' : 'batt-3b2');
  const selectedBattery = state.batteries[selectedBatteryId] || (isBusA ? state.batteries['batt-3a1'] : state.batteries['batt-3b1']);
  const isUnitFault = selectedUps?.status === 'FAULT';
  const isUnitDischarge = selectedBattery?.status === 'DISCHARGE' || isDischarging;

  // Theme colors
  const primaryColor = isBusA ? '#00cc44' : '#007acc';
  const primaryBg = isBusA ? 'bg-[#153319]' : 'bg-[#102a42]';
  const primaryBorder = isBusA ? 'border-[#00cc44]' : 'border-[#007acc]';
  const primaryText = isBusA ? 'text-[#00ff66]' : 'text-cyan-300';

  // Live telemetry calculations with slight realistic harmonics
  const inputVoltsLN = isHvFault ? 0.0 : 220.2;
  const inputVoltsLL = isHvFault ? 0.0 : 381.4;
  const inputFreq = isHvFault ? 0.0 : 50.0;
  const outputVoltsLN = isUnitFault ? 0.0 : 220.0;
  const outputVoltsLL = isUnitFault ? 0.0 : 380.0;
  const outputFreq = isUnitFault ? 0.0 : 50.0;

  // Active load derived from specific UPS unit (e.g. UPS-3B2: 98.0 kW, UPS-3A2: 96.2 kW)
  const unitKw = isUnitFault ? 0.0 : (selectedUps?.loadKw ?? (isBusA ? 96.2 : 98.0));
  const unitKva = isUnitFault ? 0.0 : parseFloat((unitKw / 0.98).toFixed(1));
  const loadRate = selectedUps ? parseFloat(((unitKw / selectedUps.capacityKva) * 100).toFixed(1)) : (isBusA ? 19.2 : 19.6);
  const phaseCurrent = unitKw > 0 ? parseFloat(((unitKw * 1000) / (3 * 220.0 * 0.98)).toFixed(1)) : 0.0;
  const unitEffPct = selectedUps?.efficiencyPct ?? (isBusA ? 96.5 : 96.6);
  const inputKw = (isHvFault || isUnitFault) ? 0.0 : parseFloat((unitKw / (unitEffPct / 100)).toFixed(1));
  const efficiency = isUnitFault ? 0.0 : isHvFault ? 94.5 : unitEffPct;

  // Battery telemetry bound to specific unit's battery bank (e.g. BATT-3B2 for UPS-3B2)
  const battVoltage = isUnitDischarge ? (selectedBattery?.voltageDc ?? 481.5) : (selectedBattery?.voltageDc ?? 542.0);
  const battCurrent = isUnitDischarge ? (selectedBattery?.currentAmps ?? -142.0) : (selectedBattery?.currentAmps ?? 0.8);
  const battSoc = selectedBattery?.socPercent ?? (isUnitDischarge ? 94.5 : 100.0);
  const remainingMins = selectedBattery?.backupMinutes ?? (isUnitDischarge ? 24.5 : 28.7);

  const toggleModule = (modNum: number) => {
    setModuleFaults((prev) => ({ ...prev, [modNum]: !prev[modNum] }));
  };

  // Diagram items from reference screenshot
  const diagramList = [
    'OVERVIEW',
    'OVERVIEW2',
    'HV1A1B/HV2A2B',
    'MDB1A1B',
    'MDB2A2B',
    'MDB4A4B',
    'EMDB2A2B',
    'EMDB3A3B',
    'EMDB4A4B',
    'INOUT1A1B',
    'UMDB1A1B',
    'INOUT2A2B',
    'UMDB2A2B',
    'D3EDB1A1B',
    'D3EDB2A2B',
    'D3EDB3A3B',
    'D3EDB4A4B',
    'REC1A1B',
    'REC2A2B',
  ];

  const handleBack = () => {
    if (isDetailView) {
      setActiveTab(isBusA ? 'UPS-3A-ALL' : 'UPS-3B-ALL');
    } else if (onTabChange) {
      onTabChange('ee');
    }
  };

  return (
    <div className="flex flex-col gap-3 text-xs select-none">
      {/* Top SCADA Navigation & Alarm Status matching EE - UPS3A-ALL DataHall.jpg */}
      <div className="bg-[#242424] border border-[#444] rounded p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Left: FXL SILA1 Brand & Screen Title */}
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
              {activeTab === 'UPS-3A-ALL'
                ? 'UPS-3A (ALL)'
                : activeTab === 'UPS-3B-ALL'
                ? 'UPS-3B (ALL)'
                : `${activeTab} (SINGLE-UNIT)`}
            </h2>
            <span className="text-[10px] text-gray-400 font-mono">
              THREE-PHASE MODULAR UPS | LIEBERT APM 600 kW / HUAWEI UPS5000-H | 2N SYSTEM
            </span>
          </div>
        </div>

        {/* Center: Drills & Simulation Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSimulateDrill}
            className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition shadow ${
              isDischarging
                ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                : 'bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 border border-amber-500/60'
            }`}
            title="จำลองไฟฟ้าดับฉุกเฉิน ดูการสลับเข้าแบตเตอรี่แบบ 0ms Transfer"
          >
            <BatteryCharging className="w-3.5 h-3.5" />
            <span>{isDischarging ? 'RESTORE UTILITY' : 'BLACKOUT DRILL (0ms)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setBypassMode((prev) => !prev)}
            className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition shadow ${
              bypassMode
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white animate-pulse'
                : 'bg-[#333] hover:bg-[#444] text-yellow-300 border border-yellow-500/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{bypassMode ? 'EXIT BYPASS' : 'STATIC BYPASS'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setBypassMode(false);
              setModuleFaults({});
              onResetAll();
            }}
            className="px-2 py-1 rounded bg-[#333] hover:bg-[#444] text-gray-300 border border-[#555] flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Right: Alarm Counters matching EE - UPS3A-ALL DataHall.jpg */}
        <div className="flex flex-col items-end gap-1 font-mono">
          <div className="flex items-center gap-1 text-[11px] font-bold">
            <span className={`px-2 py-0.5 rounded text-white ${isDischarging ? 'bg-[#ff0000] animate-pulse' : 'bg-[#d9534f]'}`}>
              CRITICAL {isDischarging ? '1' : '0'}
            </span>
            <span className="px-2 py-0.5 rounded text-white bg-[#f0ad4e]">
              MAJOR 0
            </span>
            <span className="px-2 py-0.5 rounded text-black bg-[#ffea75]">
              MINOR 0
            </span>
            <span className="px-2 py-0.5 rounded text-white bg-[#5bc0de]">
              WARNING 0
            </span>
            <button
              type="button"
              onClick={handleBack}
              className="px-2.5 py-0.5 rounded bg-[#fff] text-black hover:bg-gray-200 font-bold ml-1 cursor-pointer shadow"
              title="ย้อนกลับ"
            >
              BACK
            </button>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-gray-300">
            <span>Limit: <strong className="text-white">90%</strong></span>
            <span>Power Factor: <strong className="text-emerald-400">0.99</strong></span>
            <span>Capacity: <strong className="text-white">500 kVA</strong></span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Quick Unit Selection */}
      <div className="bg-[#1e1e1e] border border-[#3e3e3e] rounded p-1.5 flex flex-wrap items-center gap-1.5 font-mono text-xs">
        <span className="text-gray-400 font-bold px-2 text-[11px]">SCADA VIEWS:</span>

        <button
          type="button"
          onClick={() => setActiveTab('UPS-3A-ALL')}
          className={`px-3 py-1 rounded transition cursor-pointer font-bold ${
            activeTab === 'UPS-3A-ALL'
              ? 'bg-[#153319] text-[#00ff66] border border-[#00cc44] shadow'
              : 'text-gray-300 hover:text-white bg-[#282828]'
          }`}
        >
          UPS-3A (ALL)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('UPS-3B-ALL')}
          className={`px-3 py-1 rounded transition cursor-pointer font-bold ${
            activeTab === 'UPS-3B-ALL'
              ? 'bg-[#102a42] text-cyan-300 border border-[#007acc] shadow'
              : 'text-gray-300 hover:text-white bg-[#282828]'
          }`}
        >
          UPS-3B (ALL)
        </button>

        <div className="h-4 w-[1px] bg-[#444] mx-1" />

        <span className="text-gray-400 text-[10px] uppercase">Unit Diagnostics:</span>
        {(['UPS-3A1', 'UPS-3A2', 'UPS-3A3', 'UPS-3B1', 'UPS-3B2', 'UPS-3B3'] as const).map((unit) => (
          <button
            key={unit}
            type="button"
            onClick={() => setActiveTab(unit)}
            className={`px-2.5 py-1 rounded transition cursor-pointer text-[11px] ${
              activeTab === unit
                ? unit.includes('3A')
                  ? 'bg-[#153319] text-[#00ff66] border border-[#00cc44] font-bold'
                  : 'bg-[#102a42] text-cyan-300 border border-[#007acc] font-bold'
                : 'text-gray-400 hover:text-white bg-[#282828]'
            }`}
          >
            {unit}
          </button>
        ))}
      </div>

      {/* Main SCADA Workspace with authentic Left Navigation Tree */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Left Navigation Tree matching EE - UPS3A-ALL DataHall.jpg */}
        <div className="w-full lg:w-44 flex flex-row lg:flex-col gap-1.5 bg-[#202020] border border-[#3e3e3e] rounded p-2 shrink-0 overflow-x-auto text-[11px] font-mono">
          {/* SUMMARY Group */}
          <div className="flex flex-col gap-1 w-full border-b border-[#333] pb-2">
            <span className="font-bold text-gray-400 text-[10px] uppercase px-1">SUMMARY ▼</span>
            <button
              type="button"
              onClick={() => onTabChange && onTabChange('ee')}
              className="text-left px-2 py-1 rounded bg-[#2c2c2c] hover:bg-[#383838] text-gray-200 cursor-pointer"
            >
              EE SUMMARY
            </button>
            <button
              type="button"
              onClick={() => onTabChange && onTabChange('ac')}
              className="text-left px-2 py-1 rounded bg-[#2c2c2c] hover:bg-[#383838] text-gray-200 cursor-pointer"
            >
              AC SUMMARY
            </button>
          </div>

          {/* DIAGRAM Group */}
          <div className="flex flex-col gap-0.5 w-full border-b border-[#333] pb-2 max-h-56 overflow-y-auto">
            <span className="font-bold text-gray-400 text-[10px] uppercase px-1 pt-1">DIAGRAM ▼</span>
            <button
              type="button"
              onClick={() => onTabChange && onTabChange('overview')}
              className="text-left px-2 py-0.5 rounded bg-[#2c2c2c] hover:bg-[#383838] text-cyan-300 cursor-pointer text-[10px]"
            >
              OVERVIEW (SLD)
            </button>
            {diagramList.slice(2, 10).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  if (d.includes('MDB')) onTabChange && onTabChange('ee');
                }}
                className="text-left px-2 py-0.5 rounded hover:bg-[#333] text-gray-400 hover:text-white cursor-pointer text-[10px] truncate"
              >
                {d}
              </button>
            ))}
          </div>

          {/* Floor Plan & Train Switch */}
          <div className="flex flex-col gap-1 w-full pt-1">
            <button
              type="button"
              onClick={() => onTabChange && onTabChange('floor')}
              className="text-left px-2 py-1 rounded bg-[#253545] hover:bg-[#2d4358] text-cyan-300 cursor-pointer font-bold"
            >
              FLOOR PLAN (GIS)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(isBusA ? 'UPS-3B-ALL' : 'UPS-3A-ALL')}
              className={`text-left px-2 py-1 rounded cursor-pointer font-bold ${
                isBusA ? 'bg-[#102a42] text-cyan-300 hover:bg-[#163a5c]' : 'bg-[#153319] text-[#00ff66] hover:bg-[#1e4824]'
              }`}
            >
              {isBusA ? 'UPS-3B (ALL)' : 'UPS-3A (ALL)'}
            </button>
          </div>
        </div>

        {/* Center & Right Content Area */}
        <div className="flex-1 flex flex-col gap-3">
          {/* VIEW 1 & 2: ALL OVERVIEW TABLES (UPS-3A ALL or UPS-3B ALL) */}
          {!isDetailView && (
            <div className="bg-[#242424] border border-[#444] rounded p-3 flex flex-col gap-3">
              {/* Header Specs Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3e3e3e] pb-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded font-bold font-mono text-xs ${primaryBg} ${primaryBorder} ${primaryText} border`}>
                    {isBusA ? 'TRAIN A (BUS A - REDUNDANT FEED)' : 'TRAIN B (BUS B - REDUNDANT FEED)'}
                  </span>
                  <span className="text-gray-400 font-mono text-[11px]">
                    Feeder Source: {isBusA ? 'MDB-3A / TR-1' : 'MDB-3B / TR-2'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[11px] font-mono text-gray-300">
                  <span>Limit: <strong className="text-white">90%</strong></span>
                  <span>Power Factor: <strong className="text-emerald-400">0.99</strong></span>
                  <span>Capacity: <strong className="text-white">500 kVA / 600 kW</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
            {/* Left 9 Cols: 3-Phase Multi-Unit Tables */}
            <div className="xl:col-span-9 flex flex-col gap-4">
              {/* Unit Header Names with Interactive Drill-Down */}
              <div className="grid grid-cols-12 gap-2 text-center font-bold font-mono">
                <div className="col-span-3 text-left pl-2 text-gray-400">MEASUREMENT</div>
                <button
                  type="button"
                  onClick={() => setActiveTab(isBusA ? 'UPS-3A1' : 'UPS-3B1')}
                  className={`col-span-3 py-1 rounded text-white hover:brightness-110 cursor-pointer shadow transition flex items-center justify-center gap-1 ${
                    isBusA ? 'bg-[#00a854]' : 'bg-[#007acc]'
                  }`}
                  title="คลิกเพื่อเปิดหน้าจอรายละเอียดของตู้"
                >
                  <span>{isBusA ? 'UPS-3A1' : 'UPS-3B1'}</span>
                  <span className="text-[10px] opacity-75">↗</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab(isBusA ? 'UPS-3A2' : 'UPS-3B2')}
                  className={`col-span-3 py-1 rounded text-white hover:brightness-110 cursor-pointer shadow transition flex items-center justify-center gap-1 ring-2 ${
                    isBusA ? 'bg-[#00a854] ring-emerald-400/60' : 'bg-[#007acc] ring-cyan-400/60'
                  }`}
                  title="คลิกเพื่อเปิดหน้าจอรายละเอียดของตู้"
                >
                  <span>{isBusA ? 'UPS-3A2' : 'UPS-3B2'}</span>
                  <span className="text-[10px] opacity-75">↗</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab(isBusA ? 'UPS-3A3' : 'UPS-3B3')}
                  className={`col-span-3 py-1 rounded text-white hover:brightness-110 cursor-pointer shadow transition flex items-center justify-center gap-1 ${
                    isBusA ? 'bg-[#00a854]' : 'bg-[#007acc]'
                  }`}
                  title="คลิกเพื่อเปิดหน้าจอรายละเอียดของตู้"
                >
                  <span>{isBusA ? 'UPS-3A3' : 'UPS-3B3'}</span>
                  <span className="text-[10px] opacity-75">↗</span>
                </button>
              </div>

              {/* SECTION 1: AC INPUT STATUS */}
              <div className="border border-[#3e3e3e] rounded overflow-hidden">
                <div className={`px-3 py-1 font-bold text-white uppercase text-[11px] ${isBusA ? 'bg-[#008f47]' : 'bg-[#0066aa]'}`}>
                  AC INPUT STATUS
                </div>
                <div className="p-2 bg-[#1b1b1b] flex flex-col gap-1 font-mono text-[11px]">
                  {/* Phase Headers */}
                  <div className="grid grid-cols-12 text-center text-[10px] text-gray-400 border-b border-[#333] pb-1">
                    <div className="col-span-3 text-left pl-1">PARAMETER</div>
                    <div className="col-span-3 grid grid-cols-3"><span>L1</span><span>L2</span><span>L3</span></div>
                    <div className="col-span-3 grid grid-cols-3"><span>L1</span><span>L2</span><span>L3</span></div>
                    <div className="col-span-3 grid grid-cols-3"><span>L1</span><span>L2</span><span>L3</span></div>
                  </div>

                  {/* Rows */}
                  {[
                    { label: 'VOLTAGE (L-N)', unit: 'V', v: inputVoltsLN.toFixed(1) },
                    { label: 'VOLTAGE (L-L)', unit: 'V', v: inputVoltsLL.toFixed(1) },
                    { label: 'CURRENT (A)', unit: 'A', v: isHvFault ? '0.0' : (phaseCurrent * 1.02).toFixed(1) },
                    { label: 'FREQUENCY (Hz)', unit: 'Hz', v: inputFreq.toFixed(1) },
                  ].map((row) => (
                    <div key={row.label} className="grid grid-cols-12 text-center border-b border-[#282828] py-1">
                      <div className="col-span-3 text-left pl-1 text-gray-400 font-semibold">{row.label}</div>
                      <div className="col-span-3 grid grid-cols-3 text-cyan-300">
                        <span>{row.v}</span><span>{row.v}</span><span>{row.v}</span>
                      </div>
                      <div className="col-span-3 grid grid-cols-3 text-cyan-300">
                        <span>{row.v}</span><span>{row.v}</span><span>{row.v}</span>
                      </div>
                      <div className="col-span-3 grid grid-cols-3 text-cyan-300">
                        <span>{row.v}</span><span>{row.v}</span><span>{row.v}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: AC OUTPUT STATUS */}
              <div className="border border-[#3e3e3e] rounded overflow-hidden">
                <div className={`px-3 py-1 font-bold text-white uppercase text-[11px] ${isBusA ? 'bg-[#008f47]' : 'bg-[#0066aa]'}`}>
                  AC OUTPUT STATUS
                </div>
                <div className="p-2 bg-[#1b1b1b] flex flex-col gap-1 font-mono text-[11px]">
                  {/* Phase Headers */}
                  <div className="grid grid-cols-12 text-center text-[10px] text-gray-400 border-b border-[#333] pb-1">
                    <div className="col-span-3 text-left pl-1">PARAMETER</div>
                    <div className="col-span-3 grid grid-cols-3"><span>L1</span><span>L2</span><span>L3</span></div>
                    <div className="col-span-3 grid grid-cols-3"><span>L1</span><span>L2</span><span>L3</span></div>
                    <div className="col-span-3 grid grid-cols-3"><span>L1</span><span>L2</span><span>L3</span></div>
                  </div>

                  {/* Rows */}
                  {[
                    { label: 'VOLTAGE (L-N)', v: outputVoltsLN.toFixed(1) },
                    { label: 'VOLTAGE (L-L)', v: outputVoltsLL.toFixed(1) },
                    { label: 'CURRENT (A)', v: phaseCurrent.toFixed(1) },
                    { label: 'ACTIVE POWER (kW)', v: (unitKw / 3).toFixed(1) },
                    { label: 'APPARENT POWER (kVA)', v: (unitKva / 3).toFixed(1) },
                    { label: 'FREQUENCY (Hz)', v: outputFreq.toFixed(1) },
                    { label: 'UNIT LOAD RATE (%)', v: `${loadRate}%` },
                  ].map((row) => (
                    <div key={row.label} className="grid grid-cols-12 text-center border-b border-[#282828] py-1">
                      <div className="col-span-3 text-left pl-1 text-gray-400 font-semibold">{row.label}</div>
                      <div className="col-span-3 grid grid-cols-3 text-[#00ffcc]">
                        <span>{row.v}</span><span>{row.v}</span><span>{row.v}</span>
                      </div>
                      <div className="col-span-3 grid grid-cols-3 text-[#00ffcc]">
                        <span>{row.v}</span><span>{row.v}</span><span>{row.v}</span>
                      </div>
                      <div className="col-span-3 grid grid-cols-3 text-[#00ffcc]">
                        <span>{row.v}</span><span>{row.v}</span><span>{row.v}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3: BATTERY MONITORING SYSTEM (3 STRINGS PER UNIT) */}
              <div className="border border-[#3e3e3e] rounded overflow-hidden">
                <div className={`px-3 py-1 font-bold text-white uppercase text-[11px] ${isBusA ? 'bg-[#008f47]' : 'bg-[#0066aa]'}`}>
                  BATTERY MONITORING SYSTEM (3-STRING CONFIGURATION)
                </div>
                <div className="p-2 bg-[#1b1b1b] flex flex-col gap-1 font-mono text-[11px]">
                  {/* String Headers */}
                  <div className="grid grid-cols-12 text-center text-[10px] text-gray-400 border-b border-[#333] pb-1">
                    <div className="col-span-3 text-left pl-1">BATTERY UNIT</div>
                    <div className="col-span-3 grid grid-cols-3"><span>STR 1</span><span>STR 2</span><span>STR 3</span></div>
                    <div className="col-span-3 grid grid-cols-3"><span>STR 1</span><span>STR 2</span><span>STR 3</span></div>
                    <div className="col-span-3 grid grid-cols-3"><span>STR 1</span><span>STR 2</span><span>STR 3</span></div>
                  </div>

                  <div className="grid grid-cols-12 text-center border-b border-[#282828] py-1">
                    <div className="col-span-3 text-left pl-1 text-gray-400 font-semibold">BATTERY CURRENT (A)</div>
                    <div className="col-span-3 grid grid-cols-3 text-amber-300">
                      <span>{battCurrent.toFixed(1)}</span><span>{battCurrent.toFixed(1)}</span><span>{battCurrent.toFixed(1)}</span>
                    </div>
                    <div className="col-span-3 grid grid-cols-3 text-amber-300">
                      <span>{battCurrent.toFixed(1)}</span><span>{battCurrent.toFixed(1)}</span><span>{battCurrent.toFixed(1)}</span>
                    </div>
                    <div className="col-span-3 grid grid-cols-3 text-amber-300">
                      <span>{battCurrent.toFixed(1)}</span><span>{battCurrent.toFixed(1)}</span><span>{battCurrent.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 text-center py-1">
                    <div className="col-span-3 text-left pl-1 text-gray-400 font-semibold">TEMPERATURE (°C)</div>
                    <div className="col-span-3 grid grid-cols-3 text-emerald-300">
                      <span>23.5</span><span>23.8</span><span>23.4</span>
                    </div>
                    <div className="col-span-3 grid grid-cols-3 text-emerald-300">
                      <span>23.6</span><span>23.7</span><span>23.5</span>
                    </div>
                    <div className="col-span-3 grid grid-cols-3 text-emerald-300">
                      <span>23.4</span><span>23.6</span><span>23.8</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 3 Cols: Summary Box & Liebert / Vertiv Branding Card */}
            <div className="xl:col-span-3 flex flex-col gap-3 font-mono">
              {/* Peach Summary Box matching schematic */}
              <div className="bg-[#422d1d] border-2 border-[#e67e22] rounded p-3 text-gray-100 flex flex-col gap-2">
                <span className="text-xs font-bold text-[#ffaa44] uppercase tracking-wider border-b border-[#5a3a22] pb-1">
                  POWER SUMMARY (TOTAL)
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300">UPS3A (kW):</span>
                  <span className="font-bold text-[#00ffcc]">288.6 kW</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300">UPS3B (kW):</span>
                  <span className="font-bold text-cyan-300">294.0 kW</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold border-t border-[#5a3a22] pt-1">
                  <span>TOTAL USAGE:</span>
                  <span className="text-yellow-300">582.6 kW</span>
                </div>
              </div>

              {/* Efficiency Box */}
              <div className="bg-[#1f2b24] border border-[#2d4734] rounded p-3 flex flex-col gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-[#2d4734] pb-1">
                  {isBusA ? 'UPS3A-ALL' : 'UPS3B-ALL'} EFFICIENCY
                </span>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">TOTAL OUTPUT:</span>
                  <span className="font-bold text-white">288.6 kW</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">TOTAL INPUT:</span>
                  <span className="font-bold text-white">{isHvFault ? '0.0 kW' : '298.2 kW'}</span>
                </div>
                <div className="flex justify-between text-xs font-bold border-t border-[#2d4734] pt-1">
                  <span className="text-emerald-400">OVERALL EFFICIENCY:</span>
                  <span className="text-[#00ffcc]">{efficiency.toFixed(1)}%</span>
                </div>
              </div>

              {/* Manufacturer Card matching EE - UPS3A-ALL DataHall.jpg */}
              <div className="bg-[#181818] border border-[#3e3e3e] rounded p-3.5 flex flex-col items-center justify-center text-center gap-1.5 mt-auto">
                <div className="text-lg font-extrabold tracking-wider text-white">
                  Vertiv™ Liebert®
                </div>
                <div className="text-[11px] font-bold text-gray-300">
                  THREE-PHASE MODULAR UPS
                </div>
                <div className="text-[10px] text-gray-400 font-mono">
                  MODEL: APM 600 kW
                </div>
                <div className="text-[10px] text-cyan-400 font-mono font-bold">
                  RATED CAPACITY: 500 kVA
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: DETAILED SINGLE UNIT SCADA SCREEN (e.g. UPS-3A1, UPS-3A2, UPS-3B1) */}
      {isDetailView && (
        <div className="bg-[#242424] border border-[#444] rounded p-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column (3 cols): Cabinet Illustration, Output/Input Card, Brand */}
            <div className="lg:col-span-3 flex flex-col gap-3 font-mono">
              {/* Manufacturer Specs */}
              <div className="bg-[#181818] border border-[#383838] rounded p-3 flex flex-col gap-1 items-center text-center">
                <span className="text-xs font-extrabold text-white">HUAWEI / LIEBERT</span>
                <span className="text-[11px] font-bold text-cyan-400">THREE-PHASE UPS</span>
                <span className="text-[10px] text-gray-400">MODEL : UPS5000-H</span>
                <span className="text-[10px] text-emerald-400 font-bold">CAPACITY : 600 kVA</span>
              </div>

              {/* Output / Input / Efficiency Card matching schematic */}
              <div className="bg-[#422d1d] border-2 border-[#e67e22] rounded p-3 text-gray-100 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300">{activeTab} OUTPUT:</span>
                  <span className="font-bold text-[#00ffcc]">{unitKw.toFixed(1)} kW</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300">{activeTab} INPUT:</span>
                  <span className="font-bold text-yellow-300">{inputKw.toFixed(1)} kW</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold border-t border-[#5a3a22] pt-1">
                  <span className="text-orange-300">EFFICIENCY:</span>
                  <span className="text-[#00ffcc]">{efficiency.toFixed(1)} %</span>
                </div>
              </div>

              {/* UPS Status Card */}
              <div className="bg-[#1b1b1b] border border-[#3e3e3e] rounded p-3 flex flex-col gap-2 text-[11px]">
                <span className={`font-bold uppercase border-b border-[#333] pb-1 ${isBusA ? 'text-emerald-400' : 'text-cyan-400'}`}>
                  UPS STATUS
                </span>
                <div className="flex justify-between">
                  <span className="text-gray-400">SYSTEM STATUS:</span>
                  <span className="font-bold text-emerald-400">{isDischarging ? 'BATTERY DISCHARGE' : bypassMode ? 'ON BYPASS' : 'NORMAL'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">OUTPUT SOURCE:</span>
                  <span className="font-bold text-white">{isDischarging ? 'BATTERY' : bypassMode ? 'BYPASS' : 'INVERTER'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">LOAD ON BYPASS:</span>
                  <span className="font-bold text-white">{bypassMode ? 'YES' : 'NO'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">BATTERY STATUS:</span>
                  <span className={`font-bold ${isDischarging ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                    {isDischarging ? 'DISCHARGING' : 'FLOAT CHARGE'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">BATTERY CAPACITY:</span>
                  <span className="font-bold text-cyan-300">{battSoc.toFixed(0)} %</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">REMAINING BACKUP:</span>
                  <span className="font-bold text-amber-300">{remainingMins.toFixed(1)} min</span>
                </div>
              </div>

              {/* Dedicated Unit Interactive Controls */}
              <div className="bg-[#1b1b1b] border border-[#3e3e3e] rounded p-3 flex flex-col gap-2 text-[11px]">
                <span className={`font-bold uppercase border-b border-[#333] pb-1 flex items-center justify-between ${isBusA ? 'text-emerald-400' : 'text-cyan-400'}`}>
                  <span>HARDWARE TEST ({activeTab})</span>
                  <span className="text-[10px] text-gray-400 font-mono">{isBusA ? 'TRAIN A' : 'TRAIN B (2N)'}</span>
                </span>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleUps(currentUnitId)}
                    className={`w-full py-1.5 px-2.5 rounded font-bold text-xs flex items-center justify-between cursor-pointer transition shadow ${
                      isUnitFault
                        ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                        : 'bg-[#2a2a2a] hover:bg-[#333] text-gray-200 border border-[#555]'
                    }`}
                  >
                    <span>{isUnitFault ? 'RECOVER INVERTER' : 'SIMULATE FAULT (TRIP)'}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40">
                      {isUnitFault ? 'FAULT' : 'ONLINE'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleBattery(selectedBatteryId)}
                    className={`w-full py-1.5 px-2.5 rounded font-bold text-xs flex items-center justify-between cursor-pointer transition shadow ${
                      isUnitDischarge
                        ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                        : 'bg-[#2a2a2a] hover:bg-[#333] text-amber-300 border border-amber-600/50'
                    }`}
                  >
                    <span>{isUnitDischarge ? 'END DISCHARGE' : `TEST BATT (${selectedBattery?.name || 'BATT'})`}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40">
                      {isUnitDischarge ? 'DISCHARGE' : 'FLOAT'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Middle Column (6 cols): 3-Phase Tables, 10 Modules, & Animated Mimic Diagram */}
            <div className="lg:col-span-6 flex flex-col gap-3 font-mono">
              {/* AC Input Status Table */}
              <div className="border border-[#3e3e3e] rounded overflow-hidden">
                <div className={`px-2.5 py-1 font-bold text-white uppercase text-[11px] ${isBusA ? 'bg-[#008f47]' : 'bg-[#0066aa]'}`}>
                  AC INPUT STATUS
                </div>
                <div className="p-2 bg-[#1b1b1b] flex flex-col gap-1 text-[10px]">
                  <div className="grid grid-cols-4 text-center text-gray-400 border-b border-[#333] pb-1 font-semibold">
                    <span className="text-left pl-1">PARAMETER</span><span>L1</span><span>L2</span><span>L3</span>
                  </div>
                  <div className="grid grid-cols-4 text-center text-cyan-300 py-0.5">
                    <span className="text-left pl-1 text-gray-400">PHASE VOLTAGE (V)</span>
                    <span>{inputVoltsLN.toFixed(1)}</span><span>{inputVoltsLN.toFixed(1)}</span><span>{inputVoltsLN.toFixed(1)}</span>
                  </div>
                  <div className="grid grid-cols-4 text-center text-cyan-300 py-0.5">
                    <span className="text-left pl-1 text-gray-400">LINE VOLTAGE (V)</span>
                    <span>{inputVoltsLL.toFixed(1)}</span><span>{inputVoltsLL.toFixed(1)}</span><span>{inputVoltsLL.toFixed(1)}</span>
                  </div>
                  <div className="grid grid-cols-4 text-center text-cyan-300 py-0.5">
                    <span className="text-left pl-1 text-gray-400">CURRENT (A)</span>
                    <span>{(phaseCurrent * 1.02).toFixed(1)}</span><span>{(phaseCurrent * 1.02).toFixed(1)}</span><span>{(phaseCurrent * 1.02).toFixed(1)}</span>
                  </div>
                  <div className="grid grid-cols-4 text-center text-cyan-300 py-0.5">
                    <span className="text-left pl-1 text-gray-400">FREQUENCY (Hz)</span>
                    <span>{inputFreq.toFixed(1)}</span><span>{inputFreq.toFixed(1)}</span><span>{inputFreq.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* AC Output Status Table */}
              <div className="border border-[#3e3e3e] rounded overflow-hidden">
                <div className={`px-2.5 py-1 font-bold text-white uppercase text-[11px] ${isBusA ? 'bg-[#008f47]' : 'bg-[#0066aa]'}`}>
                  AC OUTPUT STATUS
                </div>
                <div className="p-2 bg-[#1b1b1b] flex flex-col gap-1 text-[10px]">
                  <div className="grid grid-cols-4 text-center text-gray-400 border-b border-[#333] pb-1 font-semibold">
                    <span className="text-left pl-1">PARAMETER</span><span>L1</span><span>L2</span><span>L3</span>
                  </div>
                  <div className="grid grid-cols-4 text-center text-[#00ffcc] py-0.5">
                    <span className="text-left pl-1 text-gray-400">LINE VOLTAGE (V)</span>
                    <span>{outputVoltsLL.toFixed(1)}</span><span>{outputVoltsLL.toFixed(1)}</span><span>{outputVoltsLL.toFixed(1)}</span>
                  </div>
                  <div className="grid grid-cols-4 text-center text-[#00ffcc] py-0.5">
                    <span className="text-left pl-1 text-gray-400">CURRENT (A)</span>
                    <span>{phaseCurrent.toFixed(1)}</span><span>{phaseCurrent.toFixed(1)}</span><span>{phaseCurrent.toFixed(1)}</span>
                  </div>
                  <div className="grid grid-cols-4 text-center text-[#00ffcc] py-0.5">
                    <span className="text-left pl-1 text-gray-400">ACTIVE POWER (kW)</span>
                    <span>{(unitKw / 3).toFixed(1)}</span><span>{(unitKw / 3).toFixed(1)}</span><span>{(unitKw / 3).toFixed(1)}</span>
                  </div>
                  <div className="grid grid-cols-4 text-center text-[#00ffcc] py-0.5">
                    <span className="text-left pl-1 text-gray-400">UNIT LOAD RATE</span>
                    <span>{loadRate}%</span><span>{loadRate}%</span><span>{loadRate}%</span>
                  </div>
                </div>
              </div>

              {/* 10 UPS Power Modules Status Grid */}
              <div className="border border-[#3e3e3e] rounded p-2 bg-[#1b1b1b] flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold border-b border-[#333] pb-1">
                  <span>UPS MODULE STATUS (10x 60kW HOT-SWAP MODULES)</span>
                  <span className="text-emerald-400">N+1 REDUNDANCY ACTIVE</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 text-[9px] text-center">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                    const isFault = moduleFaults[num];
                    return (
                      <div
                        key={num}
                        onClick={() => toggleModule(num)}
                        className={`p-1 rounded border cursor-pointer transition ${
                          isFault
                            ? 'bg-[#4a1c1c] border-[#ff4d4d] text-[#ff9999]'
                            : 'bg-[#153319] hover:bg-[#1a4422] border-[#00cc44] text-[#00ff66]'
                        }`}
                        title="Click to toggle module fault simulation"
                      >
                        <div className="font-bold">MOD {num}</div>
                        <div>{isFault ? 'FAULT' : 'NORMAL'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* UPS MIMIC PANEL: Interactive Animated Circuit Schematic */}
              <div className="border border-[#3e3e3e] rounded p-3 bg-[#161616] flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold border-b border-[#333] pb-1">
                  <span>UPS MIMIC PANEL (SINGLE-LINE INTERNAL CIRCUIT)</span>
                  <span className="font-mono text-cyan-400">
                    FLOW: {isDischarging ? 'BATTERY -> INVERTER -> LOAD' : bypassMode ? 'STATIC BYPASS -> LOAD' : 'RECTIFIER -> INVERTER -> LOAD'}
                  </span>
                </div>

                {/* SVG Mimic Circuit Diagram */}
                <svg viewBox="0 0 520 180" className="w-full h-40 bg-[#111] rounded border border-[#282828]">
                  {/* Grid Lines / Busbars */}
                  {/* Input Mains Line (Q1) */}
                  <line x1="30" y1="50" x2="100" y2="50" stroke={isHvFault ? '#666' : '#00ffcc'} strokeWidth="3" />
                  <circle cx="30" cy="50" r="5" fill={isHvFault ? '#666' : '#00ffcc'} />
                  <text x="20" y="35" fill="#888" fontSize="9" fontFamily="monospace">MAINS</text>

                  {/* Breaker Q1 */}
                  <rect x="100" y="42" width="28" height="16" fill="#153319" stroke="#00cc44" strokeWidth="1.5" />
                  <text x="106" y="54" fill="#00ff66" fontSize="9" fontWeight="bold" fontFamily="monospace">Q1</text>
                  <line x1="128" y1="50" x2="170" y2="50" stroke={isHvFault ? '#666' : '#00ffcc'} strokeWidth="3" />

                  {/* Rectifier (AC -> DC) */}
                  <rect x="170" y="32" width="45" height="36" fill="#1b2a30" stroke="#0099cc" strokeWidth="1.5" />
                  <text x="176" y="54" fill="#00ffcc" fontSize="10" fontWeight="bold" fontFamily="monospace">REC</text>

                  {/* DC Bus */}
                  <line x1="215" y1="50" x2="290" y2="50" stroke={isDischarging ? '#ffaa00' : '#00ffcc'} strokeWidth="4" />

                  {/* Battery Line & Breaker Q2 */}
                  <line x1="250" y1="50" x2="250" y2="105" stroke={isDischarging ? '#ffaa00' : '#00ffcc'} strokeWidth="3" />
                  <rect x="236" y="105" width="28" height="16" fill="#153319" stroke="#00cc44" strokeWidth="1.5" />
                  <text x="242" y="117" fill="#00ff66" fontSize="9" fontWeight="bold" fontFamily="monospace">Q2</text>
                  <line x1="250" y1="121" x2="250" y2="140" stroke={isDischarging ? '#ffaa00' : '#00ffcc'} strokeWidth="3" />

                  {/* Battery Bank Box */}
                  <rect x="225" y="140" width="50" height="25" fill={isDischarging ? '#4a2e15' : '#153319'} stroke={isDischarging ? '#ffaa00' : '#00cc44'} strokeWidth="1.5" />
                  <text x="233" y="156" fill={isDischarging ? '#ffcc66' : '#00ff66'} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    BATT {battSoc.toFixed(0)}%
                  </text>

                  {/* Inverter (DC -> AC) */}
                  <rect x="290" y="32" width="45" height="36" fill={bypassMode ? '#222' : '#1b2a30'} stroke={bypassMode ? '#555' : '#0099cc'} strokeWidth="1.5" />
                  <text x="297" y="54" fill={bypassMode ? '#777' : '#00ffcc'} fontSize="10" fontWeight="bold" fontFamily="monospace">INV</text>
                  <line x1="335" y1="50" x2="410" y2="50" stroke={bypassMode ? '#555' : '#00ffcc'} strokeWidth="3" />

                  {/* Static Bypass Line (Q3) */}
                  <line x1="100" y1="20" x2="350" y2="20" stroke={bypassMode ? '#ffaa00' : '#555'} strokeWidth="2" strokeDasharray="4 4" />
                  <rect x="236" y="12" width="28" height="16" fill={bypassMode ? '#4a2e15' : '#222'} stroke={bypassMode ? '#ffaa00' : '#555'} strokeWidth="1.5" />
                  <text x="242" y="24" fill={bypassMode ? '#ffcc66' : '#888'} fontSize="9" fontWeight="bold" fontFamily="monospace">Q3</text>
                  <line x1="350" y1="20" x2="390" y2="50" stroke={bypassMode ? '#ffaa00' : '#555'} strokeWidth="2" />

                  {/* Output Switch Q5 */}
                  <rect x="410" y="42" width="28" height="16" fill="#153319" stroke="#00cc44" strokeWidth="1.5" />
                  <text x="416" y="54" fill="#00ff66" fontSize="9" fontWeight="bold" fontFamily="monospace">Q5</text>
                  <line x1="438" y1="50" x2="490" y2="50" stroke="#00ffcc" strokeWidth="3" />
                  <circle cx="490" cy="50" r="5" fill="#00ffcc" />
                  <text x="470" y="35" fill="#00ffcc" fontSize="9" fontWeight="bold" fontFamily="monospace">LOAD</text>
                </svg>
              </div>
            </div>

            {/* Right Column (3 cols): UPS Alarms & Battery Alarms */}
            <div className="lg:col-span-3 flex flex-col gap-3 font-mono">
              {/* UPS Alarms */}
              <div className="bg-[#1b1b1b] border border-[#ff4d4d]/40 rounded p-3 flex flex-col gap-1.5 text-[10px]">
                <span className="font-bold text-[#ff9999] uppercase border-b border-[#3a1c1c] pb-1">
                  UPS ALARM TELEMETRY
                </span>
                {[
                  { label: 'OUTPUT OVERLOAD', ok: true },
                  { label: 'BATTERY ALARM', ok: !isDischarging },
                  { label: 'BATTERY CAPACITY LOW', ok: battSoc > 20 },
                  { label: 'BATTERY NOT QUALIFIED', ok: true },
                  { label: 'COMMUNICATION LOST', ok: true },
                ].map((a) => (
                  <div key={a.label} className="flex justify-between py-0.5">
                    <span className="text-gray-400">{a.label}</span>
                    <span className={`font-bold ${a.ok ? 'text-emerald-400' : 'text-red-400 animate-pulse'}`}>
                      {a.ok ? 'NORMAL' : 'ALARM'}
                    </span>
                  </div>
                ))}
              </div>

              {/* BATT Alarms */}
              <div className="bg-[#1b1b1b] border border-[#ffaa00]/40 rounded p-3 flex flex-col gap-1.5 text-[10px]">
                <span className="font-bold text-amber-300 uppercase border-b border-[#3e2710] pb-1">
                  BATTERY STRING ALARMS
                </span>
                {[
                  { label: 'MAIN BATT BREAKER STS', val: 'CLOSED', ok: true },
                  { label: 'MAIN BATT BREAKER TRIP', val: 'NORMAL', ok: true },
                  { label: 'BATTERY BREAKER-1', val: 'CLOSED', ok: true },
                  { label: 'BATTERY BREAKER-2', val: 'CLOSED', ok: true },
                  { label: 'BATTERY BREAKER-3', val: 'CLOSED', ok: true },
                  { label: 'COMMON ALARM', val: isDischarging ? 'ACTIVE' : 'NORMAL', ok: !isDischarging },
                ].map((b) => (
                  <div key={b.label} className="flex justify-between py-0.5">
                    <span className="text-gray-400">{b.label}</span>
                    <span className={`font-bold ${b.ok ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {b.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

          {/* Authentic SCADA Engineering Footer matching EE - UPS3A-ALL DataHall.jpg */}
          <div className="flex flex-wrap items-center justify-between text-[10px] text-gray-500 font-mono border-t border-[#333] pt-2 mt-1">
            <div className="flex items-center gap-3">
              <span>File: <strong className="text-gray-400">EE - {activeTab} DataHall.vsd</strong></span>
              <span>Creator: <strong className="text-gray-400">tv</strong></span>
              <span>Standard: <strong className="text-emerald-500">TIA-942 Tier III / Tier IV (2N)</strong></span>
            </div>
            <div>
              <span>Last Edit (M/D/Y): <strong className="text-gray-400">2026-10-28 13:48:27</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
