import React, { useState } from 'react';
import type { SimulatorState } from '../simulator/logic';
import {
  Zap,
  Activity,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Thermometer,
  Layers,
  ArrowRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface HvDiagramViewProps {
  state: SimulatorState;
  onToggleSource: (sourceId: string, name: string) => void;
  onToggleMdb?: (mdbId: string) => void;
  onNavigateToTab?: (tab: 'ee' | 'ups' | 'floor' | 'ac' | 'overview' | 'ups-efficiency' | 'hv-diagram' | 'up-tier') => void;
  highlightedElementId?: string | null;
}

export const HvDiagramView: React.FC<HvDiagramViewProps> = ({
  state,
  onToggleSource,
  onToggleMdb,
  onNavigateToTab,
  highlightedElementId,
}) => {
  // Local switch states for Schneider RM6 Ring Main Unit breakers
  const [tieSwitchClosed, setTieSwitchClosed] = useState<boolean>(true);
  const [rm6Breakers, setRm6Breakers] = useState<Record<string, boolean>>({
    'hv1a-cb1': true,
    'hv1a-cb2': true,
    'hv2a-cb1': true,
    'hv2a-cb2': true,
    'hv1b-cb1': true,
    'hv1b-cb2': true,
    'hv2b-cb1': true,
    'hv2b-cb2': true,
  });

  const isHvOnline = state.sources['src-hv']?.status === 'ONLINE';

  const toggleRm6Breaker = (breakerId: string) => {
    setRm6Breakers((prev) => ({ ...prev, [breakerId]: !prev[breakerId] }));
  };

  // 8 Transformers matching EE Diagram - HV1A1B2A2B DataHall.jpg
  const transformerData = [
    { id: 'tr-1a', label: 'TR1A', kva: 2000, bus: 'A', mdb: 'MDB1A', mdbId: 'mdb-1a', rmu: 'HV1A CB1', tempC: isHvOnline ? 61.2 : 32.0 },
    { id: 'tr-2a', label: 'TR2A', kva: 2000, bus: 'A', mdb: 'MDB2A', mdbId: 'mdb-2a', rmu: 'HV1A CB2', tempC: isHvOnline ? 62.4 : 31.8 },
    { id: 'tr-3a', label: 'TR3A', kva: 2000, bus: 'A', mdb: 'MDB4A', mdbId: 'mdb-3a', rmu: 'HV2A CB1', tempC: isHvOnline ? 59.8 : 30.5 },
    { id: 'tr-4a', label: 'TR4A', kva: 2000, bus: 'A', mdb: 'MDB4A', mdbId: 'mdb-3a', rmu: 'HV2A CB2', tempC: isHvOnline ? 60.5 : 31.2 },
    { id: 'tr-1b', label: 'TR1B', kva: 2000, bus: 'B', mdb: 'MDB1B', mdbId: 'mdb-1b', rmu: 'HV1B CB1', tempC: isHvOnline ? 61.8 : 32.1 },
    { id: 'tr-2b', label: 'TR2B', kva: 2000, bus: 'B', mdb: 'MDB2B', mdbId: 'mdb-2b', rmu: 'HV1B CB2', tempC: isHvOnline ? 63.1 : 31.5 },
    { id: 'tr-3b', label: 'TR3B', kva: 2000, bus: 'B', mdb: 'MDB4B', mdbId: 'mdb-3b', rmu: 'HV2B CB1', tempC: isHvOnline ? 60.0 : 30.8 },
    { id: 'tr-4b', label: 'TR4B', kva: 2000, bus: 'B', mdb: 'MDB4B', mdbId: 'mdb-3b', rmu: 'HV2B CB2', tempC: isHvOnline ? 61.4 : 31.0 },
  ];

  return (
    <div className="flex flex-col gap-3.5 text-xs select-none">
      {/* Top Banner matching EE Diagram - HV1A1B2A2B DataHall.jpg */}
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
              EE DIAGRAM – HV1A / HV1B / HV2A / HV2B (22kV SUBSTATION & TRANSFORMERS)
            </h2>
            <span className="text-[10px] text-gray-400 font-mono">
              SCHNEIDER RM6 24kV RING MAIN UNIT | EKARAT 2000kVA Dyn11 OIL TRANSFORMERS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleSource('src-hv', 'High Voltage 22kV')}
            className={`px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow ${
              isHvOnline
                ? 'bg-[#153319] hover:bg-[#1f4a25] text-[#00ff66] border border-[#00cc44]'
                : 'bg-[#4a1111] hover:bg-[#661616] text-[#ff6666] border border-red-500 animate-pulse'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>22kV FEED: {isHvOnline ? 'NORMAL (ONLINE)' : 'GRID BLACKOUT (TRIPPED)'}</span>
          </button>
        </div>
      </div>

      {/* Main Single-Line Diagram Canvas */}
      <div className="bg-[#242424] border-2 border-[#444] rounded-lg p-5 shadow-inner overflow-x-auto min-w-[900px]">
        {/* PEA Incoming Power Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-[#3a3a3a]">
          {/* Future Line 2 Incomer */}
          <div className="border border-dashed border-amber-500/70 p-3 rounded bg-amber-950/10 flex flex-col items-center">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              FUTURE LINE 2
            </span>
            <span className="text-xs text-amber-300 font-mono font-bold">
              PEA 22kV, 3PH, 3W
            </span>
            <span className="text-[9px] text-gray-400 mt-0.5">STANDBY TIE PATH</span>
          </div>

          {/* Tie Disconnecting Switch */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-mono uppercase mb-1">
              DISCONNECTING SWITCH TIE
            </span>
            <button
              type="button"
              onClick={() => setTieSwitchClosed((prev) => !prev)}
              className={`px-4 py-1.5 rounded font-mono font-bold text-xs border transition cursor-pointer flex items-center gap-1.5 ${
                tieSwitchClosed
                  ? 'bg-emerald-900/60 border-emerald-400 text-emerald-300'
                  : 'bg-amber-900/40 border-amber-500 text-amber-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{tieSwitchClosed ? 'TIE CLOSED (INTERLOCKED)' : 'TIE OPEN (ISOLATED)'}</span>
            </button>
          </div>

          {/* Active Line 1 Incomer (PEA 22kV) */}
          <div
            id="src-hv"
            className={`border-2 p-3 rounded flex flex-col items-center transition-all ${
              highlightedElementId === 'src-hv'
                ? 'ring-4 ring-red-500 animate-pulse bg-red-950/40'
                : ''
            } ${
              isHvOnline
                ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
                : 'border-red-500 bg-red-950/40 text-red-300'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest">
              ACTIVE FEEDER LINE 1
            </span>
            <span className="text-xs font-mono font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              PEA 22kV, 3PH, 3W (22,000V)
            </span>
            <span className="text-[9px] text-gray-300 mt-0.5">
              {isHvOnline ? 'VOLTAGE: 22.1 kV | FREQ: 50.0 Hz' : 'VOLTAGE: 0.0 kV (LOST)'}
            </span>
          </div>
        </div>

        {/* Bus Tie Lines */}
        <div className="relative py-4 flex justify-between items-center px-8">
          <div className={`h-1.5 flex-1 rounded ${isHvOnline ? 'bg-emerald-500 shadow-[0_0_8px_#00ff66]' : 'bg-red-600'}`} />
          <div className="px-3 text-[10px] font-mono text-gray-400">22kV DISTRIBUTION BUS</div>
          <div className={`h-1.5 flex-1 rounded ${isHvOnline ? 'bg-emerald-500 shadow-[0_0_8px_#00ff66]' : 'bg-red-600'}`} />
        </div>

        {/* Schneider RM6 Ring Main Unit (RMU) 24kV Cubicles */}
        <div className="grid grid-cols-4 gap-4 mt-2">
          {/* HV1B Cubicle */}
          <div className="border border-blue-500/50 bg-[#1e2733] p-3 rounded-lg flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-blue-500/30 pb-1">
              <span className="font-bold text-cyan-300 text-xs">RMU #HV1B</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-mono">
                24kV 600A
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-[#151c24] p-1.5 rounded border border-[#333]">
                <div className="text-gray-400">LB1: 24kV 600A</div>
                <div className="text-emerald-400 font-bold">CLOSED</div>
              </div>
              <div className="bg-[#151c24] p-1.5 rounded border border-[#333]">
                <div className="text-gray-400">LB2: 24kV 600A</div>
                <div className="text-emerald-400 font-bold">CLOSED</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleRm6Breaker('hv1b-cb1')}
                className={`flex-1 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                  rm6Breakers['hv1b-cb1'] && isHvOnline
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-red-950/60 border-red-500 text-red-300'
                }`}
              >
                CB1 (200A): {rm6Breakers['hv1b-cb1'] && isHvOnline ? 'ON' : 'TRIP'}
              </button>
              <button
                type="button"
                onClick={() => toggleRm6Breaker('hv1b-cb2')}
                className={`flex-1 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                  rm6Breakers['hv1b-cb2'] && isHvOnline
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-red-950/60 border-red-500 text-red-300'
                }`}
              >
                CB2 (200A): {rm6Breakers['hv1b-cb2'] && isHvOnline ? 'ON' : 'TRIP'}
              </button>
            </div>
          </div>

          {/* HV2B Cubicle */}
          <div className="border border-blue-500/50 bg-[#1e2733] p-3 rounded-lg flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-blue-500/30 pb-1">
              <span className="font-bold text-cyan-300 text-xs">RMU #HV2B</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-mono">
                24kV 600A
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-[#151c24] p-1.5 rounded border border-[#333]">
                <div className="text-gray-400">LB1: 24kV 600A</div>
                <div className="text-emerald-400 font-bold">CLOSED</div>
              </div>
              <div className="bg-[#151c24] p-1.5 rounded border border-[#333]">
                <div className="text-gray-400">LB2: 24kV 600A</div>
                <div className="text-emerald-400 font-bold">CLOSED</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleRm6Breaker('hv2b-cb1')}
                className={`flex-1 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                  rm6Breakers['hv2b-cb1'] && isHvOnline
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-red-950/60 border-red-500 text-red-300'
                }`}
              >
                CB1 (200A): {rm6Breakers['hv2b-cb1'] && isHvOnline ? 'ON' : 'TRIP'}
              </button>
              <button
                type="button"
                onClick={() => toggleRm6Breaker('hv2b-cb2')}
                className={`flex-1 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                  rm6Breakers['hv2b-cb2'] && isHvOnline
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-red-950/60 border-red-500 text-red-300'
                }`}
              >
                CB2 (200A): {rm6Breakers['hv2b-cb2'] && isHvOnline ? 'ON' : 'TRIP'}
              </button>
            </div>
          </div>

          {/* HV2A Cubicle */}
          <div className="border border-emerald-500/50 bg-[#192b1e] p-3 rounded-lg flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-emerald-500/30 pb-1">
              <span className="font-bold text-emerald-300 text-xs">RMU #HV2A</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-mono">
                24kV 600A
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-[#122116] p-1.5 rounded border border-[#333]">
                <div className="text-gray-400">LB1: 24kV 600A</div>
                <div className="text-emerald-400 font-bold">CLOSED</div>
              </div>
              <div className="bg-[#122116] p-1.5 rounded border border-[#333]">
                <div className="text-gray-400">LB2: 24kV 600A</div>
                <div className="text-emerald-400 font-bold">CLOSED</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleRm6Breaker('hv2a-cb1')}
                className={`flex-1 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                  rm6Breakers['hv2a-cb1'] && isHvOnline
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-red-950/60 border-red-500 text-red-300'
                }`}
              >
                CB1 (200A): {rm6Breakers['hv2a-cb1'] && isHvOnline ? 'ON' : 'TRIP'}
              </button>
              <button
                type="button"
                onClick={() => toggleRm6Breaker('hv2a-cb2')}
                className={`flex-1 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                  rm6Breakers['hv2a-cb2'] && isHvOnline
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-red-950/60 border-red-500 text-red-300'
                }`}
              >
                CB2 (200A): {rm6Breakers['hv2a-cb2'] && isHvOnline ? 'ON' : 'TRIP'}
              </button>
            </div>
          </div>

          {/* HV1A Cubicle */}
          <div className="border border-emerald-500/50 bg-[#192b1e] p-3 rounded-lg flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-emerald-500/30 pb-1">
              <span className="font-bold text-emerald-300 text-xs">RMU #HV1A</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-mono">
                24kV 600A
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-[#122116] p-1.5 rounded border border-[#333]">
                <div className="text-gray-400">LB1: 24kV 600A</div>
                <div className="text-emerald-400 font-bold">CLOSED</div>
              </div>
              <div className="bg-[#122116] p-1.5 rounded border border-[#333]">
                <div className="text-gray-400">LB2: 24kV 600A</div>
                <div className="text-emerald-400 font-bold">CLOSED</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleRm6Breaker('hv1a-cb1')}
                className={`flex-1 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                  rm6Breakers['hv1a-cb1'] && isHvOnline
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-red-950/60 border-red-500 text-red-300'
                }`}
              >
                CB1 (200A): {rm6Breakers['hv1a-cb1'] && isHvOnline ? 'ON' : 'TRIP'}
              </button>
              <button
                type="button"
                onClick={() => toggleRm6Breaker('hv1a-cb2')}
                className={`flex-1 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                  rm6Breakers['hv1a-cb2'] && isHvOnline
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-red-950/60 border-red-500 text-red-300'
                }`}
              >
                CB2 (200A): {rm6Breakers['hv1a-cb2'] && isHvOnline ? 'ON' : 'TRIP'}
              </button>
            </div>
          </div>
        </div>

        {/* Ekarat 2000kVA Transformers Matrix */}
        <div className="mt-6">
          <div className="flex items-center justify-between pb-2 border-b border-[#3a3a3a] mb-3">
            <span className="font-bold text-gray-300 text-xs flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-amber-400" />
              EKARAT 2000kVA Dyn11 OIL TRANSFORMERS (STEP-DOWN 22,000V → 400/230V)
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              Oil Temp: 61°C Nom | 90°C Alarm | 100°C Trip
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {transformerData.map((tr) => {
              const isHighlighted = highlightedElementId === tr.id;
              const isBusA = tr.bus === 'A';

              return (
                <div
                  key={tr.id}
                  id={tr.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isHighlighted ? 'ring-4 ring-red-500 animate-pulse bg-red-950/40' : ''
                  } ${
                    isBusA
                      ? 'border-emerald-600/50 bg-[#17261a]'
                      : 'border-blue-600/50 bg-[#16222e]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{tr.label}</span>
                    <span
                      className={`text-[9px] px-1 rounded font-mono font-bold ${
                        isBusA ? 'bg-emerald-900 text-emerald-300' : 'bg-blue-900 text-blue-300'
                      }`}
                    >
                      Bus {tr.bus}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-300 font-mono mt-1">
                    {tr.kva} kVA Dyn11
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-amber-400" />
                      {tr.tempC.toFixed(1)}°C
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      {isHvOnline ? 'NORMAL' : 'STANDBY'}
                    </span>
                  </div>

                  {/* Feeder to MDB button */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => onNavigateToTab && onNavigateToTab('ee')}
                      className="w-full py-1 rounded bg-black/40 hover:bg-black/60 text-gray-300 hover:text-white text-[10px] font-mono flex items-center justify-center gap-1 transition border border-white/10"
                    >
                      <span>To {tr.mdb}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer diagram metadata matching drawing */}
        <div className="mt-6 pt-3 border-t border-[#333] flex flex-wrap items-center justify-between text-[10px] text-gray-500 font-mono">
          <span>File: EE Diagram - HV1A1B2A2B DataHall.vsd</span>
          <span>Creator: tv | SILA1 REV 15</span>
          <span>Last Edit: 2026-11-02 11:41:01</span>
        </div>
      </div>
    </div>
  );
};
