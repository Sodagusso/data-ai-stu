import React, { useState, useMemo } from 'react';
import type { SimulatorState } from '../simulator/logic';
import {
  calculateUpsModuleThermalLosses,
  calculateUpsEfficiencySummary,
  type UpsEfficiencyPoint,
  type UpsModuleThermalData,
} from '../simulator/logic';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Flame,
  Thermometer,
  Zap,
  Activity,
  DollarSign,
  Layers,
  RotateCcw,
  BatteryCharging,
  Info,
  X,
  Gauge,
  Sliders,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

interface UpsEfficiencyViewProps {
  state: SimulatorState;
  efficiencyHistory: UpsEfficiencyPoint[];
  onSimulateDrill: () => void;
  onResetAll: () => void;
  onTabChange?: (tab: 'ee' | 'ups' | 'ups-efficiency' | 'floor' | 'ac' | 'overview') => void;
}

type HeatMapMetric = 'temperature' | 'loss' | 'load' | 'heatRisk';
type ChartScope = 'total' | 'busA' | 'busB' | 'compare';

export const UpsEfficiencyView: React.FC<UpsEfficiencyViewProps> = ({
  state,
  efficiencyHistory,
  onSimulateDrill,
  onResetAll,
  onTabChange,
}) => {
  // Local state for module fault simulation & interactive inspections
  const [moduleFaults, setModuleFaults] = useState<Record<string, Record<number, boolean>>>({});
  const [selectedModule, setSelectedModule] = useState<UpsModuleThermalData | null>(null);
  const [heatMapMetric, setHeatMapMetric] = useState<HeatMapMetric>('temperature');
  const [chartScope, setChartScope] = useState<ChartScope>('total');
  const [ambientTempC, setAmbientTempC] = useState<number>(23.5);

  // Derive module thermal loss data (60 modular blocks)
  const modules = useMemo(() => {
    return calculateUpsModuleThermalLosses(state, moduleFaults, ambientTempC);
  }, [state, moduleFaults, ambientTempC]);

  // Derive summary metrics
  const summary = useMemo(() => {
    return calculateUpsEfficiencySummary(modules, state);
  }, [modules, state]);

  // Group modules by unit
  const unitsList = [
    { id: 'ups-3a1', name: 'UPS-3A1', bus: 'A' as const },
    { id: 'ups-3a2', name: 'UPS-3A2', bus: 'A' as const },
    { id: 'ups-3a3', name: 'UPS-3A3', bus: 'A' as const },
    { id: 'ups-3b1', name: 'UPS-3B1', bus: 'B' as const },
    { id: 'ups-3b2', name: 'UPS-3B2', bus: 'B' as const },
    { id: 'ups-3b3', name: 'UPS-3B3', bus: 'B' as const },
  ];

  const modulesByUnit = useMemo(() => {
    const map: Record<string, UpsModuleThermalData[]> = {};
    for (const u of unitsList) {
      map[u.id] = modules.filter((m) => m.unitId === u.id);
    }
    return map;
  }, [modules, unitsList]);

  // Aggregate loss breakdown by unit for Recharts BarChart
  const lossBreakdownByUnit = useMemo(() => {
    return unitsList.map((u) => {
      const uMods = modulesByUnit[u.id] || [];
      const conduction = uMods.reduce((acc, m) => acc + m.conductionLossKw, 0);
      const switching = uMods.reduce((acc, m) => acc + m.switchingLossKw, 0);
      const filter = uMods.reduce((acc, m) => acc + m.filterCoreLossKw, 0);
      const auxiliary = uMods.reduce((acc, m) => acc + m.auxiliaryLossKw, 0);
      const totalLoss = uMods.reduce((acc, m) => acc + m.lossKw, 0);

      return {
        unitName: u.name,
        bus: u.bus,
        conduction: Number(conduction.toFixed(2)),
        switching: Number(switching.toFixed(2)),
        filter: Number(filter.toFixed(2)),
        auxiliary: Number(auxiliary.toFixed(2)),
        totalLoss: Number(totalLoss.toFixed(2)),
      };
    });
  }, [unitsList, modulesByUnit]);

  // Toggle specific module fault
  const handleToggleModuleFault = (unitId: string, modNum: number) => {
    setModuleFaults((prev) => {
      const unitMap = prev[unitId] || {};
      const nextUnitMap = { ...unitMap, [modNum]: !unitMap[modNum] };
      return { ...prev, [unitId]: nextUnitMap };
    });

    if (selectedModule && selectedModule.unitId === unitId && selectedModule.moduleId === modNum) {
      setSelectedModule((prev) => (prev ? { ...prev, status: prev.status === 'FAULT' ? 'NORMAL' : 'FAULT' } : null));
    }
  };

  // Helper function to pick color according to selected heat map metric
  const getModuleHeatColor = (mod: UpsModuleThermalData) => {
    if (mod.status === 'FAULT') {
      return {
        bg: 'bg-[#3d1818]',
        border: 'border-[#ff4d4d]',
        text: 'text-[#ff9999]',
        badge: 'bg-red-900/80 text-red-200 border-red-500',
      };
    }

    if (heatMapMetric === 'temperature') {
      if (mod.temperatureC >= 48) {
        return {
          bg: 'bg-[#4a1c1c]',
          border: 'border-[#ff4d4d]',
          text: 'text-[#ff7b7b]',
          badge: 'bg-red-800 text-white border-red-500',
        };
      }
      if (mod.temperatureC >= 43) {
        return {
          bg: 'bg-[#472d17]',
          border: 'border-[#f0ad4e]',
          text: 'text-[#ffb84d]',
          badge: 'bg-amber-800 text-amber-100 border-amber-500',
        };
      }
      if (mod.temperatureC >= 38) {
        return {
          bg: 'bg-[#2a3c20]',
          border: 'border-[#88cc44]',
          text: 'text-[#aaff66]',
          badge: 'bg-emerald-800 text-emerald-100 border-emerald-500',
        };
      }
      return {
        bg: 'bg-[#153319]',
        border: 'border-[#00cc44]',
        text: 'text-[#00ff66]',
        badge: 'bg-emerald-900/80 text-emerald-200 border-emerald-600',
      };
    }

    if (heatMapMetric === 'loss') {
      if (mod.lossKw >= 1.5) {
        return {
          bg: 'bg-[#4a1c1c]',
          border: 'border-[#ff4d4d]',
          text: 'text-[#ff7b7b]',
          badge: 'bg-red-800 text-white border-red-500',
        };
      }
      if (mod.lossKw >= 1.1) {
        return {
          bg: 'bg-[#472d17]',
          border: 'border-[#f0ad4e]',
          text: 'text-[#ffb84d]',
          badge: 'bg-amber-800 text-amber-100 border-amber-500',
        };
      }
      return {
        bg: 'bg-[#153319]',
        border: 'border-[#00cc44]',
        text: 'text-[#00ff66]',
        badge: 'bg-emerald-900/80 text-emerald-200 border-emerald-600',
      };
    }

    if (heatMapMetric === 'load') {
      if (mod.loadPercent >= 35) {
        return {
          bg: 'bg-[#4a2417]',
          border: 'border-[#f08c4e]',
          text: 'text-[#ffa366]',
          badge: 'bg-orange-800 text-orange-100 border-orange-500',
        };
      }
      return {
        bg: 'bg-[#153319]',
        border: 'border-[#00cc44]',
        text: 'text-[#00ff66]',
        badge: 'bg-emerald-900/80 text-emerald-200 border-emerald-600',
      };
    }

    // Default: heat risk index
    if (mod.heatRiskIndex >= 70) {
      return {
        bg: 'bg-[#4a1c1c]',
        border: 'border-[#ff4d4d]',
        text: 'text-[#ff7b7b]',
        badge: 'bg-red-800 text-white border-red-500',
      };
    }
    if (mod.heatRiskIndex >= 45) {
      return {
        bg: 'bg-[#472d17]',
        border: 'border-[#f0ad4e]',
        text: 'text-[#ffb84d]',
        badge: 'bg-amber-800 text-amber-100 border-amber-500',
      };
    }
    return {
      bg: 'bg-[#153319]',
      border: 'border-[#00cc44]',
      text: 'text-[#00ff66]',
      badge: 'bg-emerald-900/80 text-emerald-200 border-emerald-600',
    };
  };

  const isBattMode = Object.values(state.batteries).some((b) => b.status === 'DISCHARGE');

  return (
    <div className="flex flex-col gap-3 text-xs select-none">
      {/* Top SCADA Navigation & Status Bar */}
      <div className="bg-[#242424] border border-[#444] rounded p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
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
              UPS EFFICIENCY ANALYSIS & MODULE THERMAL HEAT MAP
            </h2>
            <span className="text-[10px] text-gray-400 font-mono">
              Double-Conversion VFI Mode (IEC 62040-3 Class 1) • P_loss = P_in - P_out • 60-Module Matrix
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSimulateDrill}
            className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow ${
              isBattMode
                ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                : 'bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 border border-amber-500/60'
            }`}
            title="จำลองไฟฟ้าดับฉุกเฉิน สังเกตการเปลี่ยนแปลงของประสิทธิภาพและการสูญเสียพลังงาน (Battery Inverter Loss)"
          >
            <BatteryCharging className="w-3.5 h-3.5" />
            <span>{isBattMode ? 'RESTORE UTILITY' : 'BLACKOUT DRILL (BATTERY LOSS)'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModuleFaults({});
              setSelectedModule(null);
              onResetAll();
            }}
            className="px-2.5 py-1 rounded bg-[#333] hover:bg-[#444] text-gray-300 border border-[#555] flex items-center gap-1 cursor-pointer"
            title="รีเซ็ตความผิดพร่องทั้งหมด"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Modules</span>
          </button>
        </div>
      </div>

      {/* Top 5 Executive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 font-mono">
        {/* Card 1: System Efficiency */}
        <div className="bg-[#1b2520] border border-[#2d4734] rounded p-2.5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-400 text-[10px]">
            <span>SYSTEM EFFICIENCY</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="my-1">
            <span className="text-xl font-extrabold text-[#00ffcc]">
              {summary.systemEfficiencyPct.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-[9px] text-gray-400 border-t border-[#2d4734] pt-1">
            <span>Tier IV Standard</span>
            <span className="text-emerald-400 font-bold">&gt; 96.0% Optimal</span>
          </div>
        </div>

        {/* Card 2: Total Active Loss */}
        <div className="bg-[#291e1e] border border-[#4a2e2e] rounded p-2.5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-400 text-[10px]">
            <span>TOTAL POWER LOSS</span>
            <Flame className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="my-1 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-[#ff7777]">
              {summary.totalLossKw.toFixed(2)}
            </span>
            <span className="text-xs text-gray-400">kW</span>
          </div>
          <div className="flex items-center justify-between text-[9px] text-gray-400 border-t border-[#4a2e2e] pt-1">
            <span>Heat Load</span>
            <span className="text-amber-300 font-bold">{summary.totalHeatBtuPerHour.toLocaleString()} BTU/h</span>
          </div>
        </div>

        {/* Card 3: PUE Impact */}
        <div className="bg-[#1e2329] border border-[#2e3e4a] rounded p-2.5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-400 text-[10px]">
            <span>UPS PUE OVERHEAD</span>
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="my-1">
            <span className="text-xl font-extrabold text-cyan-300">
              +{summary.pueImpact.toFixed(3)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[9px] text-gray-400 border-t border-[#2e3e4a] pt-1">
            <span>Facility Target</span>
            <span className="text-cyan-400 font-bold">&le; 0.040 PUE</span>
          </div>
        </div>

        {/* Card 4: Financial Energy Loss Cost */}
        <div className="bg-[#2a241a] border border-[#4a3f2e] rounded p-2.5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-400 text-[10px]">
            <span>MONTHLY LOSS COST</span>
            <DollarSign className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div className="my-1 flex items-baseline gap-1">
            <span className="text-lg font-extrabold text-yellow-300">
              ฿{summary.monthlyLossCostThb.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400">/mo</span>
          </div>
          <div className="flex items-center justify-between text-[9px] text-gray-400 border-t border-[#4a3f2e] pt-1">
            <span>Tariff Rate</span>
            <span className="text-gray-300">4.50 THB/kWh</span>
          </div>
        </div>

        {/* Card 5: Thermal Hotspot Alert */}
        <div className="bg-[#241e28] border border-[#3f2e4a] rounded p-2.5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-400 text-[10px]">
            <span>HOTTEST MODULE</span>
            <Thermometer className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="my-1 flex items-baseline justify-between">
            <span className="text-sm font-bold text-white">
              {summary.hottestModule.unitName} M{summary.hottestModule.moduleId}
            </span>
            <span className="text-lg font-extrabold text-[#ffa366]">
              {summary.hottestModule.temperatureC.toFixed(1)}°C
            </span>
          </div>
          <div className="flex items-center justify-between text-[9px] text-gray-400 border-t border-[#3f2e4a] pt-1">
            <span>Module Loss</span>
            <span className="text-amber-300 font-bold">{summary.hottestModule.lossKw.toFixed(2)} kW</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: RECHARTS INPUT VS. OUTPUT EFFICIENCY OVER TIME */}
      <div className="bg-[#242424] border border-[#444] rounded p-3.5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3e3e3e] pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00ffcc]" />
            <div>
              <span className="font-bold text-white uppercase tracking-wider text-xs">
                Real-Time Input vs. Output Power & Efficiency Trajectory
              </span>
              <span className="text-[10px] text-gray-400 block font-mono">
                Continuous rolling 60-second window: Input Power (Pin), Clean Output (Pout), and Heat Loss (Ploss)
              </span>
            </div>
          </div>

          {/* Scope Selectors */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-mono">SCOPE:</span>
            <div className="bg-[#181818] p-0.5 rounded border border-[#3e3e3e] flex text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setChartScope('total')}
                className={`px-2.5 py-0.5 rounded transition cursor-pointer ${
                  chartScope === 'total' ? 'bg-[#007acc] text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Total System
              </button>
              <button
                type="button"
                onClick={() => setChartScope('busA')}
                className={`px-2.5 py-0.5 rounded transition cursor-pointer ${
                  chartScope === 'busA' ? 'bg-[#008f47] text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Train A
              </button>
              <button
                type="button"
                onClick={() => setChartScope('busB')}
                className={`px-2.5 py-0.5 rounded transition cursor-pointer ${
                  chartScope === 'busB' ? 'bg-[#0066aa] text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Train B
              </button>
              <button
                type="button"
                onClick={() => setChartScope('compare')}
                className={`px-2.5 py-0.5 rounded transition cursor-pointer ${
                  chartScope === 'compare' ? 'bg-[#7a3db8] text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Compare A vs B
              </button>
            </div>
          </div>
        </div>

        {/* The Recharts Multi-Axis Visualization */}
        <div className="h-64 w-full bg-[#161616] rounded border border-[#333] p-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={efficiencyHistory} margin={{ top: 10, right: 35, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="effLossGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff4d4d" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#ff4d4d" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="effOutputGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ffcc" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#00ffcc" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#2b2b2b" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#777" tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }} />

              {/* Left Y Axis: Power (kW) */}
              <YAxis
                yAxisId="left"
                stroke="#aaa"
                domain={['auto', 'auto']}
                tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
                unit="kW"
              />

              {/* Right Y Axis: Efficiency (%) */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#00ff66"
                domain={[92, 100]}
                tick={{ fill: '#00ff66', fontSize: 10, fontFamily: 'monospace' }}
                unit="%"
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as UpsEfficiencyPoint;
                    return (
                      <div className="bg-[#1a1a1a]/95 border border-[#555] p-2.5 rounded shadow-xl text-[11px] font-mono text-gray-200 min-w-[210px]">
                        <div className="text-gray-400 font-bold border-b border-[#333] pb-1 mb-1.5 flex justify-between">
                          <span>TIME: {data.time}</span>
                          <span className="text-[#00ffcc] font-bold">{data.efficiencyPct.toFixed(2)}% EFF</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-amber-400">INPUT POWER:</span>
                          <span className="font-bold text-white">{data.inputPowerKw.toFixed(1)} kW</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-cyan-400">OUTPUT POWER:</span>
                          <span className="font-bold text-white">{data.outputPowerKw.toFixed(1)} kW</span>
                        </div>
                        <div className="flex justify-between py-0.5 text-red-400 border-t border-[#333] pt-1">
                          <span>THERMAL LOSS:</span>
                          <span className="font-bold">{data.lossKw.toFixed(2)} kW</span>
                        </div>
                        <div className="text-[9px] text-gray-500 pt-1 flex justify-between">
                          <span>Train A: {data.busAOutputKw.toFixed(0)}kW ({data.busAEfficiencyPct.toFixed(1)}%)</span>
                          <span>Train B: {data.busBOutputKw.toFixed(0)}kW ({data.busBEfficiencyPct.toFixed(1)}%)</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Legend
                wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '4px' }}
                iconType="circle"
              />

              <ReferenceLine yAxisId="right" y={96.0} stroke="#f0ad4e" strokeDasharray="3 3" label={{ value: 'Target 96%', fill: '#f0ad4e', fontSize: 10 }} />

              {chartScope === 'total' && (
                <>
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="inputPowerKw"
                    name="Input Power (kW)"
                    stroke="#f0ad4e"
                    fill="url(#effLossGrad)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="outputPowerKw"
                    name="Clean Output Power (kW)"
                    stroke="#00ffcc"
                    fill="url(#effOutputGrad)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="efficiencyPct"
                    name="Efficiency (%)"
                    stroke="#00ff66"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              )}

              {chartScope === 'busA' && (
                <>
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="busAInputKw"
                    name="Train A Input (kW)"
                    stroke="#f0ad4e"
                    fill="url(#effLossGrad)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="busAOutputKw"
                    name="Train A Output (kW)"
                    stroke="#00ffcc"
                    fill="url(#effOutputGrad)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="busAEfficiencyPct"
                    name="Train A Eff (%)"
                    stroke="#00ff66"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              )}

              {chartScope === 'busB' && (
                <>
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="busBInputKw"
                    name="Train B Input (kW)"
                    stroke="#f0ad4e"
                    fill="url(#effLossGrad)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="busBOutputKw"
                    name="Train B Output (kW)"
                    stroke="#00ffcc"
                    fill="url(#effOutputGrad)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="busBEfficiencyPct"
                    name="Train B Eff (%)"
                    stroke="#00ff66"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              )}

              {chartScope === 'compare' && (
                <>
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="busAOutputKw"
                    name="Train A Load (kW)"
                    stroke="#00ffcc"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="busBOutputKw"
                    name="Train B Load (kW)"
                    stroke="#3399ff"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="busAEfficiencyPct"
                    name="Train A Eff (%)"
                    stroke="#00ff66"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="busBEfficiencyPct"
                    name="Train B Eff (%)"
                    stroke="#ffaa00"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 2: 60-MODULE ENERGY LOSS THERMAL HEAT MAP MATRIX */}
      <div className="bg-[#242424] border border-[#444] rounded p-3.5 flex flex-col gap-3">
        {/* Heat Map Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3e3e3e] pb-2.5">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <div>
              <span className="font-bold text-white uppercase tracking-wider text-xs">
                UPS Module Energy Loss & Thermal Heat Map (60 Power Blocks)
              </span>
              <span className="text-[10px] text-gray-400 block font-mono">
                Click any modular power block to inspect thermal decomposition or toggle N+1 fault transfer simulation
              </span>
            </div>
          </div>

          {/* Metric Selector & Ambient Temperature Control */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400">
              <span>COLOR METRIC:</span>
              <div className="bg-[#181818] p-0.5 rounded border border-[#3e3e3e] flex text-[10px]">
                <button
                  type="button"
                  onClick={() => setHeatMapMetric('temperature')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    heatMapMetric === 'temperature' ? 'bg-[#cc3300] text-white font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Temperature (°C)
                </button>
                <button
                  type="button"
                  onClick={() => setHeatMapMetric('loss')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    heatMapMetric === 'loss' ? 'bg-[#cc6600] text-white font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Energy Loss (kW)
                </button>
                <button
                  type="button"
                  onClick={() => setHeatMapMetric('load')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    heatMapMetric === 'load' ? 'bg-[#008f47] text-white font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Load (%)
                </button>
                <button
                  type="button"
                  onClick={() => setHeatMapMetric('heatRisk')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    heatMapMetric === 'heatRisk' ? 'bg-[#7a3db8] text-white font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Heat Risk Index
                </button>
              </div>
            </div>

            {/* Ambient Room Temp */}
            <div className="flex items-center gap-1 text-[10px] font-mono bg-[#181818] px-2 py-0.5 rounded border border-[#3e3e3e]">
              <span className="text-gray-400">Room Temp:</span>
              <span className="text-emerald-400 font-bold">{ambientTempC.toFixed(1)}°C</span>
            </div>
          </div>
        </div>

        {/* Heat Map Legend */}
        <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-gray-400 bg-[#1a1a1a] p-2 rounded border border-[#333]">
          <span className="font-bold text-gray-300">THERMAL GRADIENT:</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-[#153319] border border-[#00cc44]" /> &lt;38°C (Optimal &lt;0.8 kW Loss)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-[#2a3c20] border border-[#88cc44]" /> 38–42°C (Normal ~1.0 kW Loss)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-[#472d17] border border-[#f0ad4e]" /> 43–47°C (Warm ~1.3 kW Loss)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-[#4a1c1c] border border-[#ff4d4d]" /> &gt;48°C (Hotspot &gt;1.5 kW Loss)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-[#3d1818] border border-[#ff4d4d]" /> FAULT / OFFLINE
            </span>
          </div>
        </div>

        {/* The 6-Unit Matrix (3 Train A + 3 Train B) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {unitsList.map((unit) => {
            const unitMods = modulesByUnit[unit.id] || [];
            const isTrainA = unit.bus === 'A';
            const unitTotalLoss = unitMods.reduce((acc, m) => acc + m.lossKw, 0);
            const unitAvgTemp = unitMods.reduce((acc, m) => acc + m.temperatureC, 0) / (unitMods.length || 1);

            return (
              <div
                key={unit.id}
                className="bg-[#1c1c1c] border border-[#383838] rounded-lg p-2.5 flex flex-col gap-2 shadow-sm"
              >
                {/* Unit Cabinet Header */}
                <div className="flex items-center justify-between border-b border-[#333] pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded font-extrabold text-[10px] font-mono ${
                        isTrainA ? 'bg-[#008f47] text-white' : 'bg-[#0066aa] text-white'
                      }`}
                    >
                      {unit.name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      (Train {unit.bus} • 600 kW)
                    </span>
                  </div>
                  <div className="text-[10px] font-mono flex items-center gap-2">
                    <span className="text-gray-400">
                      Loss: <strong className="text-red-400">{unitTotalLoss.toFixed(2)} kW</strong>
                    </span>
                    <span className="text-gray-400">
                      Avg: <strong className="text-amber-300">{unitAvgTemp.toFixed(1)}°C</strong>
                    </span>
                  </div>
                </div>

                {/* 10 Modular Power Slots arranged in cabinet stack */}
                <div className="grid grid-cols-2 gap-1.5">
                  {unitMods.map((mod) => {
                    const colors = getModuleHeatColor(mod);
                    const isSelected = selectedModule?.unitId === mod.unitId && selectedModule?.moduleId === mod.moduleId;

                    return (
                      <div
                        key={mod.moduleId}
                        onClick={() => setSelectedModule(mod)}
                        className={`p-1.5 rounded border transition-all cursor-pointer flex flex-col justify-between ${colors.bg} ${colors.border} ${
                          isSelected ? 'ring-2 ring-white scale-[1.02] shadow-lg' : 'hover:scale-[1.01]'
                        }`}
                        title="Click to view module thermal breakdown or toggle fault"
                      >
                        <div className="flex justify-between items-center text-[9px] font-mono">
                          <span className="font-bold text-gray-200">MOD {mod.moduleId}</span>
                          <span className={`px-1 py-0.2 rounded text-[8px] font-bold border ${colors.badge}`}>
                            {mod.status}
                          </span>
                        </div>

                        <div className="my-1 flex items-baseline justify-between font-mono">
                          <span className={`text-xs font-extrabold ${colors.text}`}>
                            {heatMapMetric === 'temperature'
                              ? `${mod.temperatureC.toFixed(1)}°C`
                              : heatMapMetric === 'loss'
                              ? `${mod.lossKw.toFixed(2)} kW`
                              : heatMapMetric === 'load'
                              ? `${mod.loadPercent.toFixed(1)}%`
                              : `${mod.heatRiskIndex}/100`}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            {mod.loadKw.toFixed(1)} kW
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[8px] text-gray-400 font-mono border-t border-[#333]/50 pt-0.5">
                          <span>Loss: {mod.lossKw.toFixed(2)} kW</span>
                          <span>{mod.fanSpeedRpm} RPM</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: ENERGY LOSS DECOMPOSITION & SELECTED MODULE HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left 7 Cols: Energy Loss Breakdown BarChart (Recharts) */}
        <div className="lg:col-span-7 bg-[#242424] border border-[#444] rounded p-3.5 flex flex-col gap-2">
          <div className="flex justify-between items-center border-b border-[#3e3e3e] pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white uppercase tracking-wider text-xs">
                Energy Loss Decomposition by UPS Unit (kW)
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">
              Conduction (IGBT) • Switching (PWM) • Filter Harmonics • Auxiliary
            </span>
          </div>

          <div className="h-56 w-full bg-[#161616] rounded border border-[#333] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lossBreakdownByUnit} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid stroke="#2b2b2b" strokeDasharray="3 3" />
                <XAxis dataKey="unitName" stroke="#777" tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis stroke="#aaa" tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }} unit="kW" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#1a1a1a]/95 border border-[#555] p-2 rounded shadow text-[10px] font-mono text-gray-200">
                          <div className="font-bold text-white border-b border-[#333] pb-1 mb-1">
                            {data.unitName} (Train {data.bus})
                          </div>
                          <div className="text-amber-400">Conduction Loss: {data.conduction} kW</div>
                          <div className="text-orange-400">Switching Loss: {data.switching} kW</div>
                          <div className="text-purple-400">Filter/Core Loss: {data.filter} kW</div>
                          <div className="text-cyan-400">Auxiliary/Fans: {data.auxiliary} kW</div>
                          <div className="font-bold text-red-400 border-t border-[#333] pt-0.5 mt-0.5">
                            Total Loss: {data.totalLoss} kW
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                <Bar dataKey="conduction" name="IGBT Conduction" stackId="a" fill="#e67e22" />
                <Bar dataKey="switching" name="PWM Switching" stackId="a" fill="#d35400" />
                <Bar dataKey="filter" name="Filter / Core" stackId="a" fill="#8e44ad" />
                <Bar dataKey="auxiliary" name="Aux & Fans" stackId="a" fill="#2980b9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 5 Cols: Selected Module Diagnostic & Fault Simulation HUD */}
        <div className="lg:col-span-5 bg-[#242424] border border-[#444] rounded p-3.5 flex flex-col justify-between font-mono">
          <div>
            <div className="flex justify-between items-center border-b border-[#3e3e3e] pb-2 mb-2.5">
              <div className="flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white uppercase text-xs">
                  {selectedModule ? `${selectedModule.unitName} Module #${selectedModule.moduleId} Diagnostics` : 'Module Inspection HUD'}
                </span>
              </div>
              {selectedModule && (
                <button
                  type="button"
                  onClick={() => setSelectedModule(null)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {selectedModule ? (
              <div className="flex flex-col gap-2 text-[11px]">
                <div className="grid grid-cols-2 gap-2 bg-[#1a1a1a] p-2 rounded border border-[#333]">
                  <div>
                    <span className="text-gray-400 text-[10px] block">OPERATING STATE</span>
                    <span className="font-bold text-white">{selectedModule.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block">TEMPERATURE</span>
                    <span className="font-bold text-amber-300 text-sm">
                      {selectedModule.temperatureC.toFixed(1)}°C
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block">MODULE LOAD</span>
                    <span className="font-bold text-[#00ffcc]">
                      {selectedModule.loadKw.toFixed(2)} kW ({selectedModule.loadPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block">TOTAL LOSS</span>
                    <span className="font-bold text-[#ff7777] text-sm">
                      {selectedModule.lossKw.toFixed(3)} kW
                    </span>
                  </div>
                </div>

                {/* Loss decomposition table */}
                <div className="bg-[#181818] p-2 rounded border border-[#333] flex flex-col gap-1 text-[10px]">
                  <span className="font-bold text-gray-300 border-b border-[#282828] pb-1">
                    INTERNAL THERMAL LOSS BREAKDOWN
                  </span>
                  <div className="flex justify-between">
                    <span className="text-gray-400">• IGBT Conduction Loss:</span>
                    <span className="text-amber-300">{selectedModule.conductionLossKw.toFixed(3)} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">• PWM Switching Loss (16kHz):</span>
                    <span className="text-orange-300">{selectedModule.switchingLossKw.toFixed(3)} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">• Inductor / Capacitor Filter:</span>
                    <span className="text-purple-300">{selectedModule.filterCoreLossKw.toFixed(3)} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">• Auxiliary & Cooling Fans:</span>
                    <span className="text-cyan-300">{selectedModule.auxiliaryLossKw.toFixed(3)} kW</span>
                  </div>
                  <div className="flex justify-between border-t border-[#282828] pt-1 font-bold">
                    <span className="text-gray-300">Thermal Heat Dissipation:</span>
                    <span className="text-red-400">{selectedModule.heatBtuPerHour.toFixed(0)} BTU/h</span>
                  </div>
                </div>

                {/* Cooling Fan & Heat Risk Index */}
                <div className="flex justify-between items-center bg-[#181818] p-2 rounded border border-[#333] text-[10px]">
                  <span>Fan Speed: <strong className="text-cyan-300">{selectedModule.fanSpeedRpm} RPM</strong></span>
                  <span>Heat Risk Index: <strong className="text-yellow-300">{selectedModule.heatRiskIndex}/100</strong></span>
                </div>
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center text-gray-400 gap-2 border border-dashed border-[#444] rounded p-4">
                <Info className="w-6 h-6 text-cyan-400" />
                <span className="text-xs font-bold text-gray-300">No Module Selected</span>
                <span className="text-[10px] text-gray-500 max-w-xs">
                  Click on any of the 60 power module tiles in the heat map above to inspect its real-time thermal decomposition, fan telemetry, and simulate module trip/fault.
                </span>
              </div>
            )}
          </div>

          {/* Fault Simulation Action Button */}
          {selectedModule && (
            <div className="pt-2 border-t border-[#3e3e3e] mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => handleToggleModuleFault(selectedModule.unitId, selectedModule.moduleId)}
                className={`w-full py-1.5 px-3 rounded text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow ${
                  selectedModule.status === 'FAULT'
                    ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                    : 'bg-red-800 hover:bg-red-700 text-white'
                }`}
              >
                <span>
                  {selectedModule.status === 'FAULT'
                    ? `Restore ${selectedModule.unitName} MOD ${selectedModule.moduleId} (Online)`
                    : `Simulate Module Fault on ${selectedModule.unitName} MOD ${selectedModule.moduleId}`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
