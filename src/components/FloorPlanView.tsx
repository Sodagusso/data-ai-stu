import React, { useState } from 'react';
import type { SimulatorState } from '../simulator/logic';
import {
  Layers,
  BatteryCharging,
  Zap,
  Activity,
  Wind,
  ShieldAlert,
  RotateCcw,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Droplets,
  Lock,
  Lightbulb,
  Building,
} from 'lucide-react';

interface FloorPlanViewProps {
  state: SimulatorState;
  onToggleUps: (upsId: string) => void;
  onToggleBattery: (battId: string) => void;
  onSimulateOutage: () => void;
  onResetAll: () => void;
  highlightedElementId?: string | null;
  initialLayer?: FacilityLayer;
  onNavigateToTab?: (tab: 'ee' | 'ups' | 'floor' | 'ac' | 'overview', elementId?: string) => void;
}

type FacilityLayer =
  | 'ELECTRICAL'
  | 'HVAC'
  | 'WATER LEAK'
  | 'FIRE ALARM'
  | 'FIRE PROTECTION'
  | 'SECURITY'
  | 'UTILITY'
  | 'LIGHTING';

export const FloorPlanView: React.FC<FloorPlanViewProps> = ({
  state,
  onToggleUps,
  onToggleBattery,
  onSimulateOutage,
  onResetAll,
  highlightedElementId,
  initialLayer = 'ELECTRICAL',
  onNavigateToTab,
}) => {
  const [activeLayer, setActiveLayer] = useState<FacilityLayer>(initialLayer);
  const [activeFloor, setActiveFloor] = useState<'3RD' | '2ND' | '1ST' | 'ROOF'>('3RD');
  const [buildingType, setBuildingType] = useState<'DC' | 'MECH'>('DC');
  const [selectedNode, setSelectedNode] = useState<{
    id: string;
    name: string;
    type: 'battery' | 'ups' | 'pdu' | 'crac' | 'ats' | 'noc';
    zone: string;
    status: string;
    details: string;
  } | null>(null);

  // Check overall battery discharge state
  const isDischarging = Object.values(state.batteries).some((b) => b.status === 'DISCHARGE');
  const isHvFault = state.sources['src-hv'].status === 'FAULT';

  return (
    <div className="flex flex-col gap-3 text-xs select-none">
      {/* Top Banner Matching EE FLOOR PLAN - D3 Final GIS Rev 15 DataHall.jpg */}
      <div className="bg-[#1f1f1f] border border-[#444] rounded px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
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
              ELECTRICAL – 3<sup>rd</sup> FL. DATA HALL GIS FLOOR PLAN
            </h2>
            <span className="text-[10px] text-gray-400 font-mono">
              EE FLOOR PLAN - D3 Final GIS Rev 15 DataHall.vsd | SCADA Real-Time Spatial Telemetry
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSimulateOutage}
            className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow ${
              isHvFault
                ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                : 'bg-[#4a351c] hover:bg-[#634522] text-[#ffcc66] border border-[#ffaa00]/60'
            }`}
            title="จำลองไฟฟ้าดับ เพื่อสังเกตการณ์ห้องแบตเตอรี่และระบบสำรองบน Floor Plan"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isHvFault ? 'RESTORE GRID POWER' : 'SIMULATE GRID LOSS'}</span>
          </button>

          <button
            type="button"
            onClick={onResetAll}
            className="px-2.5 py-1 rounded bg-[#333] hover:bg-[#444] text-gray-300 border border-[#555] flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Floor Plan Canvas Workspace */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Left Sidebar: Facility Layer Filters */}
        <div className="w-full lg:w-44 flex flex-row lg:flex-col gap-1.5 bg-[#242424] border border-[#444] rounded p-2.5 shrink-0 overflow-x-auto">
          <span className="hidden lg:block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 border-b border-[#3e3e3e] pb-1">
            FACILITY SYSTEMS
          </span>

          {(
            [
              { id: 'ELECTRICAL', icon: Zap, label: 'ELECTRICAL' },
              { id: 'HVAC', icon: Wind, label: 'HVAC / CRAC' },
              { id: 'WATER LEAK', icon: Droplets, label: 'WATER LEAK' },
              { id: 'FIRE ALARM', icon: Flame, label: 'FIRE ALARM' },
              { id: 'FIRE PROTECTION', icon: ShieldAlert, label: 'FIRE PROTECTION' },
              { id: 'SECURITY', icon: Lock, label: 'SECURITY' },
              { id: 'UTILITY', icon: Activity, label: 'UTILITY' },
              { id: 'LIGHTING', icon: Lightbulb, label: 'LIGHTING' },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const isActive = activeLayer === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveLayer(item.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#007acc] text-white shadow-sm ring-1 ring-cyan-400'
                    : 'bg-[#1b1b1b] text-gray-300 hover:bg-[#2e2e2e] hover:text-white border border-[#333]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-cyan-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center: The Architectural Isometric Floor Plan */}
        <div className="flex-1 bg-[#1a1a1a] border border-[#444] rounded p-3 flex flex-col relative overflow-hidden min-h-[580px]">
          {/* Header row in canvas: North Fire Stairs & Lift Lobby */}
          <div className="flex items-center justify-between border-b border-[#333] pb-2 text-[10px] text-gray-400 font-mono">
            <div className="flex items-center gap-4">
              <span className="bg-[#282828] px-2 py-0.5 rounded border border-[#444] text-gray-300">
                FIRE STAIR SF02
              </span>
              <span className="bg-[#282828] px-2 py-0.5 rounded border border-[#444] text-gray-300">
                FIRE STAIR SF03
              </span>
              <span className="bg-[#1f2b38] px-2.5 py-0.5 rounded border border-blue-500/50 text-cyan-300 font-bold">
                LIFT LOBBY
              </span>
              <span className="bg-[#282828] px-2 py-0.5 rounded border border-[#444] text-gray-300">
                FIRE STAIR SF04
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-gray-400">STATUS:</span>
              <span
                className={`font-mono font-bold flex items-center gap-1.5 ${
                  isDischarging ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isDischarging ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
                {isDischarging ? 'BATTERY DISCHARGE ACTIVE' : 'ALL DATAHALL SYSTEMS NOMINAL'}
              </span>
            </div>
          </div>

          {/* Main Floor Plan Grid */}
          <div className="flex-1 grid grid-cols-12 gap-2.5 py-3 relative">
            {/* 1. LEFT CORRIDOR: CRAC B1, CRAC B2, BATTERY ROOM B, RECTIFIERS */}
            <div className="col-span-3 bg-[#1e2321] border border-[#00cc44]/40 rounded p-2 flex flex-col gap-2 relative">
              <div className="flex items-center justify-between text-[10px] border-b border-[#2d4734] pb-1">
                <span className="font-bold text-[#00ff66] uppercase tracking-wide">
                  WEST ELEC / BATT ROOM
                </span>
                <span className="text-[9px] text-gray-400 font-mono">TRAIN B (D-3)</span>
              </div>

              {/* CRAC B1 */}
              <div
                onClick={() =>
                  setSelectedNode({
                    id: 'crac-b1',
                    name: 'CRAC B1 (Computer Room AC)',
                    type: 'crac',
                    zone: 'West Perimeter Mechanical',
                    status: 'NORMAL (RUNNING)',
                    details: 'Airflow: 22,000 CFM | Supply Temp: 19.5°C | Feeder: ATSP22',
                  })
                }
                className="bg-[#153319] hover:bg-[#1e4824] border border-[#00cc44] text-[#00ff66] p-1.5 rounded cursor-pointer flex items-center justify-between text-[10px] transition"
              >
                <span className="font-bold flex items-center gap-1">
                  <Wind className="w-3 h-3 text-cyan-400" /> CRAC B1
                </span>
                <span className="font-mono text-[9px] text-emerald-300">19.5°C</span>
              </div>

              {/* UPS-3B Modular Lineup (500kVA Cabinets - Train B) */}
              <div className="bg-[#102331] border border-[#007acc]/70 rounded p-2 flex flex-col gap-1.5 font-mono">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-cyan-300 font-bold uppercase flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    UPS-3B LINEUP (TRAIN B)
                  </span>
                  <span className="text-[8px] text-gray-400">2N 500kVA</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'ups-3b1', label: 'UPS-3B1' },
                    { id: 'ups-3b2', label: 'UPS-3B2' },
                    { id: 'ups-3b3', label: 'UPS-3B3' },
                  ].map((u) => {
                    const upsState = state.upsUnits[u.id];
                    const isFault = upsState?.status === 'FAULT';
                    const isTarget = highlightedElementId === u.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedNode({
                            id: u.id,
                            name: `${u.label} Modular UPS (500kVA)`,
                            type: 'ups',
                            zone: 'West Electrical / UPS Room (Train B)',
                            status: upsState?.status || 'ONLINE',
                            details: `Capacity: ${upsState?.capacityKva || 500} kVA | Load: ${(upsState?.loadKw || 98).toFixed(1)} kW | Efficiency: ${(upsState?.efficiencyPct || 96.6).toFixed(1)}% | Dedicated Battery: ${upsState?.batteryId?.toUpperCase() || 'BATT-3B2'}`,
                          });
                        }}
                        className={`p-1 rounded border text-center cursor-pointer transition ${
                          isFault
                            ? 'bg-[#4a1c1c] border-[#ff4d4d] text-[#ff9999] animate-pulse'
                            : isTarget
                            ? 'bg-[#183955] border-cyan-400 text-white ring-2 ring-cyan-300 animate-pulse'
                            : 'bg-[#122638] hover:bg-[#1a3852] border-[#007acc] text-cyan-200'
                        }`}
                        title="คลิกเพื่อตรวจสอบข้อมูลสถานะตู้ UPS"
                      >
                        <div className="font-bold text-[9px]">{u.label}</div>
                        <div className="text-[8px] text-emerald-300">{isFault ? 'FAULT' : `${(upsState?.loadKw || 98.0).toFixed(0)}kW`}</div>
                        <div className="text-[7px] text-gray-400">{isFault ? 'TRIPPED' : 'ONLINE'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3D Isometric Battery Bank Racks (Bus B) including BATT-3B2 */}
              <div className="bg-[#142318] border border-[#00cc44]/60 rounded p-2 flex flex-col gap-1.5">
                <span className="text-[10px] text-gray-300 font-bold uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <BatteryCharging className="w-3 h-3 text-emerald-400" />
                    Battery Racks (Bus B)
                  </span>
                  <span className="text-[8px] text-gray-400 font-mono">542V DC</span>
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'batt-3b1', label: 'BATT-3B/1' },
                    { id: 'batt-3b2', label: 'BATT-3B/2' },
                    { id: 'batt-3b3', label: 'BATT-3B/3' },
                    { id: 'batt-1b1', label: 'BATT-1B/1' },
                    { id: 'batt-1b2', label: 'BATT-1B/2' },
                    { id: 'batt-2b1', label: 'BATT-2B/1' },
                  ].map((b) => {
                    const battState = state.batteries[b.id];
                    const isDischarge = battState?.status === 'DISCHARGE';
                    const isTarget = highlightedElementId === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          onToggleBattery(b.id);
                          setSelectedNode({
                            id: b.id,
                            name: b.label,
                            type: 'battery',
                            zone: 'West Battery Room (Floor 3 - Train B)',
                            status: battState?.status || 'FLOAT',
                            details: `Voltage: ${battState?.voltageDc || 542}V DC | Current: ${battState?.currentAmps || 0}A | SoC: ${battState?.socPercent || 100}% | Backup: ${(battState?.backupMinutes || 28.7).toFixed(1)} min`,
                          });
                        }}
                        className={`p-1 rounded border text-center cursor-pointer transition font-mono ${
                          isDischarge
                            ? 'bg-[#4a2e15] border-[#ffaa00] text-[#ffcc66] animate-pulse'
                            : isTarget
                            ? 'bg-[#1f4229] border-emerald-400 text-white ring-2 ring-emerald-300 animate-pulse'
                            : 'bg-[#153319] hover:bg-[#1a4422] border-[#00cc44] text-[#00ff66]'
                        }`}
                        title="คลิกเพื่อทดสอบแบตเตอรี่ (Float / Discharge / Test)"
                      >
                        <div className="font-bold text-[9px] truncate">{b.label}</div>
                        <div className="text-[8px]">{isDischarge ? 'DISCHG' : 'FLOAT'}</div>
                        <div className="text-[7.5px] text-cyan-300">SoC {battState?.socPercent?.toFixed(0) || 100}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DC Rectifiers */}
              <div className="bg-[#181818] border border-[#333] rounded p-1.5 flex flex-col gap-1 text-[9px] font-mono">
                <span className="text-gray-400 uppercase font-semibold">DC Rectifiers 48V:</span>
                <div className="grid grid-cols-2 gap-1 text-center">
                  <span className="bg-[#242424] p-1 rounded text-emerald-400 border border-[#333]">REC1B/1 (OK)</span>
                  <span className="bg-[#242424] p-1 rounded text-emerald-400 border border-[#333]">REC1B/2 (OK)</span>
                  <span className="bg-[#242424] p-1 rounded text-emerald-400 border border-[#333]">REC2B/1 (OK)</span>
                  <span className="bg-[#242424] p-1 rounded text-emerald-400 border border-[#333]">REC2B/2 (OK)</span>
                </div>
              </div>

              {/* CRAC B2 */}
              <div
                onClick={() =>
                  setSelectedNode({
                    id: 'crac-b2',
                    name: 'CRAC B2 (Computer Room AC)',
                    type: 'crac',
                    zone: 'West Perimeter Mechanical',
                    status: 'NORMAL (RUNNING)',
                    details: 'Airflow: 22,000 CFM | Supply Temp: 19.8°C | Feeder: ATSP34',
                  })
                }
                className="bg-[#153319] hover:bg-[#1e4824] border border-[#00cc44] text-[#00ff66] p-1.5 rounded cursor-pointer flex items-center justify-between text-[10px] transition mt-auto"
              >
                <span className="font-bold flex items-center gap-1">
                  <Wind className="w-3 h-3 text-cyan-400" /> CRAC B2
                </span>
                <span className="font-mono text-[9px] text-emerald-300">19.8°C</span>
              </div>

              {/* West EAP / ATS panels */}
              <div className="text-[8px] text-gray-500 font-mono text-center">
                EAP22-25 / ATSP22-25 / EDB1A/B
              </div>
            </div>

            {/* 2. WHITE SPACE B (Left Server Hall) */}
            <div className="col-span-3 bg-[#171f22] border border-[#0099cc]/40 rounded p-2 flex flex-col gap-2 relative">
              <div className="flex items-center justify-between text-[10px] border-b border-[#213f4c] pb-1">
                <span className="font-bold text-cyan-300 uppercase tracking-wide">
                  WHITE SPACE B (DATA HALL B)
                </span>
                <span className="text-[9px] text-gray-400 font-mono">12 RACK ROWS</span>
              </div>

              {/* Server Rows with Dual PDUs (PDU24, PDU25, PDU1, PDU3, PDU4, PDU26, PDU5, PDU6, PDU7) */}
              <div className="grid grid-cols-2 gap-1.5 flex-1 content-start">
                {[
                  { pair: 'PDU24', kw: 52.8 },
                  { pair: 'PDU25', kw: 51.9 },
                  { pair: 'PDU1', kw: 49.6 },
                  { pair: 'PDU3', kw: 53.0 },
                  { pair: 'PDU4', kw: 50.4 },
                  { pair: 'PDU26', kw: 54.1 },
                  { pair: 'PDU5', kw: 49.0 },
                  { pair: 'PDU6', kw: 48.3 },
                ].map((item) => (
                  <div
                    key={item.pair}
                    onClick={() =>
                      setSelectedNode({
                        id: item.pair,
                        name: `${item.pair}A & ${item.pair}B Dual Feed PDU`,
                        type: 'pdu',
                        zone: 'White Space B Server Row',
                        status: 'ONLINE (2N REDUNDANT)',
                        details: `A-Feed: UMDB1A (${(item.kw * 0.49).toFixed(1)}kW) | B-Feed: UMDB1B (${(item.kw * 0.51).toFixed(1)}kW)`,
                      })
                    }
                    className="bg-[#1b2a30] hover:bg-[#233a44] border border-[#0099cc]/70 text-cyan-200 p-1.5 rounded cursor-pointer text-[9px] font-mono flex flex-col justify-between transition"
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span>{item.pair}B</span>
                      <span className="text-gray-400">|</span>
                      <span>{item.pair}A</span>
                    </div>
                    <div className="flex justify-between text-[8px] text-gray-400 mt-1">
                      <span>{item.kw} kW</span>
                      <span className="text-emerald-400">NORMAL</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* DC PDB Cabinets */}
              <div className="bg-[#111a1d] border border-[#224450] rounded p-1 text-[8px] font-mono text-center text-cyan-400">
                DC PDB: PDB1B/1-1, PDB1A/1-1, PDB2B/1-1, PDB2A/1-1
              </div>
            </div>

            {/* 3. CENTER CORRIDOR: BATTERY ROOM A, RECTIFIERS, CRAC A3/B3/B4/A2 */}
            <div className="col-span-3 bg-[#1e2321] border border-[#00cc44]/40 rounded p-2 flex flex-col gap-2 relative">
              <div className="flex items-center justify-between text-[10px] border-b border-[#2d4734] pb-1">
                <span className="font-bold text-[#00ff66] uppercase tracking-wide">
                  CENTER ELEC / BATT ROOM
                </span>
                <span className="text-[9px] text-gray-400 font-mono">TRAIN A (D-3)</span>
              </div>

              {/* CRAC A3 & B3 */}
              <div className="grid grid-cols-2 gap-1 text-[9px] font-mono">
                <div
                  onClick={() =>
                    setSelectedNode({
                      id: 'crac-a3',
                      name: 'CRAC A3',
                      type: 'crac',
                      zone: 'Center Mechanical Spine',
                      status: 'NORMAL (RUNNING)',
                      details: 'Airflow: 22,000 CFM | 19.4°C | Feeder: ATS42',
                    })
                  }
                  className="bg-[#153319] hover:bg-[#1e4824] border border-[#00cc44] text-[#00ff66] p-1 rounded cursor-pointer text-center"
                >
                  CRAC A3 (19.4°C)
                </div>
                <div
                  onClick={() =>
                    setSelectedNode({
                      id: 'crac-b3',
                      name: 'CRAC B3',
                      type: 'crac',
                      zone: 'Center Mechanical Spine',
                      status: 'NORMAL (RUNNING)',
                      details: 'Airflow: 22,000 CFM | 19.6°C | Feeder: ATSP31',
                    })
                  }
                  className="bg-[#153319] hover:bg-[#1e4824] border border-[#00cc44] text-[#00ff66] p-1 rounded cursor-pointer text-center"
                >
                  CRAC B3 (19.6°C)
                </div>
              </div>

              {/* UPS-3A Modular Lineup (500kVA Cabinets - Train A) */}
              <div className="bg-[#122b1c] border border-[#00cc44]/70 rounded p-2 flex flex-col gap-1.5 font-mono">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#00ff66] font-bold uppercase flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#00ff66]" />
                    UPS-3A LINEUP (TRAIN A)
                  </span>
                  <span className="text-[8px] text-gray-400">2N 500kVA</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'ups-3a1', label: 'UPS-3A1' },
                    { id: 'ups-3a2', label: 'UPS-3A2' },
                    { id: 'ups-3a3', label: 'UPS-3A3' },
                  ].map((u) => {
                    const upsState = state.upsUnits[u.id];
                    const isFault = upsState?.status === 'FAULT';
                    const isTarget = highlightedElementId === u.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedNode({
                            id: u.id,
                            name: `${u.label} Modular UPS (500kVA)`,
                            type: 'ups',
                            zone: 'Center Electrical / UPS Room (Train A)',
                            status: upsState?.status || 'ONLINE',
                            details: `Capacity: ${upsState?.capacityKva || 500} kVA | Load: ${(upsState?.loadKw || 96.2).toFixed(1)} kW | Efficiency: ${(upsState?.efficiencyPct || 96.5).toFixed(1)}% | Dedicated Battery: ${upsState?.batteryId?.toUpperCase() || 'BATT-3A2'}`,
                          });
                        }}
                        className={`p-1 rounded border text-center cursor-pointer transition ${
                          isFault
                            ? 'bg-[#4a1c1c] border-[#ff4d4d] text-[#ff9999] animate-pulse'
                            : isTarget
                            ? 'bg-[#1b432a] border-emerald-400 text-white ring-2 ring-emerald-300 animate-pulse'
                            : 'bg-[#153319] hover:bg-[#1e4824] border-[#00cc44] text-[#00ff66]'
                        }`}
                        title="คลิกเพื่อตรวจสอบข้อมูลสถานะตู้ UPS"
                      >
                        <div className="font-bold text-[9px]">{u.label}</div>
                        <div className="text-[8px] text-emerald-300">{isFault ? 'FAULT' : `${(upsState?.loadKw || 96.2).toFixed(0)}kW`}</div>
                        <div className="text-[7px] text-gray-400">{isFault ? 'TRIPPED' : 'ONLINE'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3D Isometric Battery Bank Racks (Bus A) including BATT-3A2 */}
              <div className="bg-[#142318] border border-[#00cc44]/60 rounded p-2 flex flex-col gap-1.5">
                <span className="text-[10px] text-gray-300 font-bold uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <BatteryCharging className="w-3 h-3 text-emerald-400" />
                    Battery Racks (Bus A)
                  </span>
                  <span className="text-[8px] text-gray-400 font-mono">542V DC</span>
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'batt-3a1', label: 'BATT-3A/1' },
                    { id: 'batt-3a2', label: 'BATT-3A/2' },
                    { id: 'batt-3a3', label: 'BATT-3A/3' },
                    { id: 'batt-1a1', label: 'BATT-1A/1' },
                    { id: 'batt-1a2', label: 'BATT-1A/2' },
                    { id: 'batt-2a1', label: 'BATT-2A/1' },
                  ].map((b) => {
                    const battState = state.batteries[b.id];
                    const isDischarge = battState?.status === 'DISCHARGE';
                    const isTarget = highlightedElementId === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          onToggleBattery(b.id);
                          setSelectedNode({
                            id: b.id,
                            name: b.label,
                            type: 'battery',
                            zone: 'Center Battery Room (Floor 3 - Train A)',
                            status: battState?.status || 'FLOAT',
                            details: `Voltage: ${battState?.voltageDc || 542}V DC | Current: ${battState?.currentAmps || 0}A | SoC: ${battState?.socPercent || 100}% | Backup: ${(battState?.backupMinutes || 29.2).toFixed(1)} min`,
                          });
                        }}
                        className={`p-1 rounded border text-center cursor-pointer transition font-mono ${
                          isDischarge
                            ? 'bg-[#4a2e15] border-[#ffaa00] text-[#ffcc66] animate-pulse'
                            : isTarget
                            ? 'bg-[#1f4229] border-emerald-400 text-white ring-2 ring-emerald-300 animate-pulse'
                            : 'bg-[#153319] hover:bg-[#1a4422] border-[#00cc44] text-[#00ff66]'
                        }`}
                        title="คลิกเพื่อทดสอบแบตเตอรี่ (Float / Discharge / Test)"
                      >
                        <div className="font-bold text-[9px] truncate">{b.label}</div>
                        <div className="text-[8px]">{isDischarge ? 'DISCHG' : 'FLOAT'}</div>
                        <div className="text-[7.5px] text-cyan-300">SoC {battState?.socPercent?.toFixed(0) || 100}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DC Rectifiers */}
              <div className="bg-[#181818] border border-[#333] rounded p-1.5 flex flex-col gap-1 text-[9px] font-mono">
                <span className="text-gray-400 uppercase font-semibold">DC Rectifiers 48V:</span>
                <div className="grid grid-cols-2 gap-1 text-center">
                  <span className="bg-[#242424] p-1 rounded text-emerald-400 border border-[#333]">REC1A/1 (OK)</span>
                  <span className="bg-[#242424] p-1 rounded text-emerald-400 border border-[#333]">REC1A/2 (OK)</span>
                  <span className="bg-[#242424] p-1 rounded text-emerald-400 border border-[#333]">REC2A/1 (OK)</span>
                  <span className="bg-[#242424] p-1 rounded text-emerald-400 border border-[#333]">REC2A/2 (OK)</span>
                </div>
              </div>

              {/* CRAC B4 & A2 */}
              <div className="grid grid-cols-2 gap-1 text-[9px] font-mono mt-auto">
                <div
                  onClick={() =>
                    setSelectedNode({
                      id: 'crac-b4',
                      name: 'CRAC B4',
                      type: 'crac',
                      zone: 'Center Mechanical Spine',
                      status: 'NORMAL (RUNNING)',
                      details: 'Airflow: 22,000 CFM | 19.5°C | Feeder: ATSP37',
                    })
                  }
                  className="bg-[#153319] hover:bg-[#1e4824] border border-[#00cc44] text-[#00ff66] p-1 rounded cursor-pointer text-center"
                >
                  CRAC B4 (19.5°C)
                </div>
                <div
                  onClick={() =>
                    setSelectedNode({
                      id: 'crac-a2',
                      name: 'CRAC A2',
                      type: 'crac',
                      zone: 'Center Mechanical Spine',
                      status: 'NORMAL (RUNNING)',
                      details: 'Airflow: 22,000 CFM | 19.7°C | Feeder: ATSP38',
                    })
                  }
                  className="bg-[#153319] hover:bg-[#1e4824] border border-[#00cc44] text-[#00ff66] p-1 rounded cursor-pointer text-center"
                >
                  CRAC A2 (19.7°C)
                </div>
              </div>

              {/* Center ATS / EAP panels */}
              <div className="text-[8px] text-gray-500 font-mono text-center">
                ATSP29-38 / EAP29-38 / DB.R1A/2A / EDB2A/B
              </div>
            </div>

            {/* 4. WHITE SPACE A (Right Server Hall) */}
            <div className="col-span-3 bg-[#171f22] border border-[#0099cc]/40 rounded p-2 flex flex-col gap-2 relative">
              <div className="flex items-center justify-between text-[10px] border-b border-[#213f4c] pb-1">
                <span className="font-bold text-cyan-300 uppercase tracking-wide">
                  WHITE SPACE A (DATA HALL A)
                </span>
                <span className="text-[9px] text-gray-400 font-mono">14 RACK ROWS</span>
              </div>

              {/* Server Rows with Dual PDUs (PDU9 - PDU23) */}
              <div className="grid grid-cols-2 gap-1.5 flex-1 content-start">
                {[
                  { pair: 'PDU9', kw: 53.4 },
                  { pair: 'PDU10', kw: 51.9 },
                  { pair: 'PDU12', kw: 51.5 },
                  { pair: 'PDU14', kw: 50.7 },
                  { pair: 'PDU15', kw: 50.0 },
                  { pair: 'PDU16', kw: 52.5 },
                  { pair: 'PDU17', kw: 48.1 },
                  { pair: 'PDU18', kw: 49.3 },
                ].map((item) => (
                  <div
                    key={item.pair}
                    onClick={() =>
                      setSelectedNode({
                        id: item.pair,
                        name: `${item.pair}A & ${item.pair}B Dual Feed PDU`,
                        type: 'pdu',
                        zone: 'White Space A Server Row',
                        status: 'ONLINE (2N REDUNDANT)',
                        details: `A-Feed: UMDB3A (${(item.kw * 0.49).toFixed(1)}kW) | B-Feed: UMDB3B (${(item.kw * 0.51).toFixed(1)}kW)`,
                      })
                    }
                    className="bg-[#1b2a30] hover:bg-[#233a44] border border-[#0099cc]/70 text-cyan-200 p-1.5 rounded cursor-pointer text-[9px] font-mono flex flex-col justify-between transition"
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span>{item.pair}B</span>
                      <span className="text-gray-400">|</span>
                      <span>{item.pair}A</span>
                    </div>
                    <div className="flex justify-between text-[8px] text-gray-400 mt-1">
                      <span>{item.kw} kW</span>
                      <span className="text-emerald-400">NORMAL</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Perimeter CRAC A1 & CRAC A4 */}
              <div className="grid grid-cols-2 gap-1 text-[9px] font-mono mt-auto">
                <div
                  onClick={() =>
                    setSelectedNode({
                      id: 'crac-a1',
                      name: 'CRAC A1',
                      type: 'crac',
                      zone: 'East Perimeter',
                      status: 'NORMAL (RUNNING)',
                      details: 'Airflow: 22,000 CFM | 19.3°C | Feeder: ATS52',
                    })
                  }
                  className="bg-[#153319] hover:bg-[#1e4824] border border-[#00cc44] text-[#00ff66] p-1 rounded cursor-pointer text-center"
                >
                  CRAC A1 (19.3°C)
                </div>
                <div
                  onClick={() =>
                    setSelectedNode({
                      id: 'crac-a4',
                      name: 'CRAC A4',
                      type: 'crac',
                      zone: 'East Perimeter',
                      status: 'NORMAL (RUNNING)',
                      details: 'Airflow: 22,000 CFM | 19.6°C | Feeder: ATSP54',
                    })
                  }
                  className="bg-[#153319] hover:bg-[#1e4824] border border-[#00cc44] text-[#00ff66] p-1 rounded cursor-pointer text-center"
                >
                  CRAC A4 (19.6°C)
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Reception, Main Corridor, NOC Room, Storage, Restrooms */}
          <div className="border-t border-[#333] pt-2 grid grid-cols-12 gap-2 text-[10px] font-mono">
            {/* Main Stair SF01 */}
            <div className="col-span-2 bg-[#252525] border border-[#3e3e3e] rounded p-2 flex flex-col justify-between">
              <span className="font-bold text-gray-300">MAIN STAIR SF01</span>
              <span className="text-[9px] text-gray-400">RECEPTION & ACCESS</span>
            </div>

            {/* NOC Room (Network Operations Center) */}
            <div
              onClick={() =>
                setSelectedNode({
                  id: 'noc-room',
                  name: 'NOC (Network Operations Center)',
                  type: 'noc',
                  zone: 'South Operations Wing',
                  status: '24/7 ACTIVE SCADA MONITORING',
                  details: 'Servers A01-A08 to J01-J08 | Redundant UPS Feed from UMDB1A & UMDB1B | Temperature 21.0°C',
                })
              }
              className="col-span-6 bg-[#162723] hover:bg-[#1f3832] border border-[#00ffcc]/50 text-cyan-200 rounded p-2 cursor-pointer flex flex-col justify-between transition"
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#00ffcc]" />
                  NOC – NETWORK OPERATIONS CENTER
                </span>
                <span className="text-[9px] text-emerald-400">24/7 ACTIVE</span>
              </div>
              <div className="text-[9px] text-gray-300 mt-1">
                Server Rack Matrix A01-J08 • Dual-Corded Feeder A+B • Redundant SCADA Consoles
              </div>
            </div>

            {/* Storage & Facilities */}
            <div className="col-span-2 bg-[#252525] border border-[#3e3e3e] rounded p-2 flex flex-col justify-between">
              <span className="font-bold text-gray-300">STORAGE & LOGISTICS</span>
              <span className="text-[9px] text-gray-400">RESTROOM (W/M)</span>
            </div>

            {/* Fire Stair SF05 */}
            <div className="col-span-2 bg-[#252525] border border-[#3e3e3e] rounded p-2 flex flex-col justify-between">
              <span className="font-bold text-gray-300">FIRE STAIR SF05</span>
              <span className="text-[9px] text-gray-400">EMERGENCY EGRESS</span>
            </div>
          </div>
        </div>

        {/* Right Building Level Selector Matching Schematic */}
        <div className="w-full lg:w-44 flex flex-row lg:flex-col gap-2.5 bg-[#242424] border border-[#444] rounded p-3 shrink-0">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#3e3e3e] pb-1">
            FLOOR PLAN SELECTOR
          </span>

          {/* Data Center Building Levels */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">
              DATA CENTER BUILDING
            </span>
            {(['ROOF', '3RD', '2ND', '1ST'] as const).map((fl) => (
              <button
                key={fl}
                type="button"
                onClick={() => {
                  setBuildingType('DC');
                  setActiveFloor(fl);
                }}
                className={`px-3 py-1.5 rounded text-left text-[11px] font-bold transition cursor-pointer ${
                  activeFloor === fl && buildingType === 'DC'
                    ? 'bg-[#007acc] text-white shadow ring-1 ring-cyan-300'
                    : 'bg-[#1b1b1b] text-gray-300 hover:bg-[#333] border border-[#333]'
                }`}
              >
                {fl === 'ROOF' ? 'ROOF' : `${fl} FLOOR`}
              </button>
            ))}
          </div>

          {/* Mechanical Building Levels */}
          <div className="flex flex-col gap-1 mt-2">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">
              MECHANICAL BUILDING
            </span>
            {(['ROOF', '2ND', '1ST'] as const).map((fl) => (
              <button
                key={`mech-${fl}`}
                type="button"
                onClick={() => {
                  setBuildingType('MECH');
                  setActiveFloor(fl as any);
                }}
                className={`px-3 py-1.5 rounded text-left text-[11px] font-bold transition cursor-pointer ${
                  activeFloor === fl && buildingType === 'MECH'
                    ? 'bg-[#007acc] text-white shadow ring-1 ring-cyan-300'
                    : 'bg-[#1b1b1b] text-gray-300 hover:bg-[#333] border border-[#333]'
                }`}
              >
                {fl === 'ROOF' ? 'ROOF' : `${fl} FLOOR`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Equipment Telemetry Inspection Modal / Drawer */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#222] border border-[#00ffcc] rounded-lg shadow-2xl w-full max-w-lg p-5 flex flex-col gap-3.5 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-[#444] pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00ffcc] animate-pulse" />
                <span className="text-sm font-bold text-white uppercase">{selectedNode.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-white text-base px-2 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2 text-gray-200">
              <div className="flex justify-between border-b border-[#333] pb-1">
                <span className="text-gray-400">Zone / Location:</span>
                <span className="font-semibold">{selectedNode.zone}</span>
              </div>
              <div className="flex justify-between border-b border-[#333] pb-1">
                <span className="text-gray-400">Operational Status:</span>
                <span className="font-bold text-emerald-400">{selectedNode.status}</span>
              </div>
              <div className="flex justify-between border-b border-[#333] pb-1">
                <span className="text-gray-400">Telemetry Specs:</span>
                <span className="text-cyan-300">{selectedNode.details}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#333]">
              {selectedNode.type === 'ups' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onToggleUps(selectedNode.id);
                      setSelectedNode(null);
                    }}
                    className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer transition shadow"
                  >
                    Toggle Inverter Fault ({selectedNode.id.toUpperCase()})
                  </button>
                  {onNavigateToTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToTab('ups', selectedNode.id);
                        setSelectedNode(null);
                      }}
                      className="px-3 py-1.5 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-bold cursor-pointer transition shadow"
                    >
                      ไปที่หน้าจอจำลอง UPS ({selectedNode.id.toUpperCase()}) ↗
                    </button>
                  )}
                </>
              )}
              {selectedNode.type === 'battery' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onToggleBattery(selectedNode.id);
                      setSelectedNode(null);
                    }}
                    className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer transition shadow"
                  >
                    Toggle Discharge / Test
                  </button>
                  {onNavigateToTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToTab('ups', selectedNode.id);
                        setSelectedNode(null);
                      }}
                      className="px-3 py-1.5 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-bold cursor-pointer transition shadow"
                    >
                      ไปที่หน้าจอแบตเตอรี่ UPS ↗
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="px-3 py-1.5 rounded bg-[#444] hover:bg-[#555] text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
