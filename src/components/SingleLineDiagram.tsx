import React from 'react';
import type { SimulatorState } from '../simulator/logic';
import { ArrowDown, Zap, ShieldCheck } from 'lucide-react';

interface SingleLineDiagramProps {
  state: SimulatorState;
  onToggleMdb: (mdbId: string) => void;
  onToggleSource: (sourceId: string, name: string) => void;
}

export const SingleLineDiagram: React.FC<SingleLineDiagramProps> = ({
  state,
  onToggleMdb,
  onToggleSource,
}) => {
  const isHvOnline = state.sources['src-hv'].status === 'ONLINE';
  const isTr1Active = state.sources['tr-1'].status === 'ACTIVE' && isHvOnline;
  const isTr2Active = state.sources['tr-2'].status === 'ACTIVE' && isHvOnline;
  const isGenRunning = state.sources['gen-1'].status === 'RUNNING';

  const busAColor = isTr1Active ? '#00ff66' : isGenRunning ? '#ffaa00' : '#666';
  const busBColor = isTr2Active ? '#00ff66' : isGenRunning ? '#ffaa00' : '#666';

  return (
    <div className="bg-[#242424] border border-[#444] rounded p-4 flex flex-col gap-4 text-xs">
      <div className="flex items-center justify-between border-b border-[#555] pb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="font-bold text-white uppercase tracking-wider text-sm">
            Single-Line Diagram (SLD) Power Flow Topology
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Normal Feed
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Generator Feed
          </span>
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> De-energized / Trip
          </span>
        </div>
      </div>

      {/* Grid Source Top Tier */}
      <div className="flex justify-center items-center gap-8">
        <button
          type="button"
          onClick={() => onToggleSource('src-hv', 'High Voltage')}
          className={`p-3 rounded border-2 text-center transition cursor-pointer min-w-[160px] ${
            isHvOnline
              ? 'bg-[#153319] border-[#00cc44] text-[#00ff66]'
              : 'bg-[#4a1c1c] border-[#ff4d4d] text-[#ff9999] animate-pulse'
          }`}
        >
          <div className="font-bold text-sm">PEA/MEG 24kV GRID</div>
          <div className="text-[10px] uppercase font-mono mt-0.5">
            Incoming Line: {isHvOnline ? 'ENERGIZED 24kV' : 'BLACKOUT'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onToggleSource('gen-1', 'Emergency Generator')}
          className={`p-3 rounded border-2 text-center transition cursor-pointer min-w-[160px] ${
            isGenRunning
              ? 'bg-[#3e2710] border-[#f0ad4e] text-[#ffb84d] animate-pulse'
              : 'bg-[#2d2d15] border-[#cccc00] text-[#ffff66]'
          }`}
        >
          <div className="font-bold text-sm">GEN-1 DIESEL GENSET</div>
          <div className="text-[10px] uppercase font-mono mt-0.5">
            2000kVA: {state.sources['gen-1'].status}
          </div>
        </button>
      </div>

      {/* Downward Feed Bus Lines */}
      <div className="grid grid-cols-2 gap-8 text-center">
        {/* BUS A BRANCH */}
        <div className="flex flex-col items-center gap-3 bg-[#1e1e1e] p-3 rounded border border-[#333]">
          <div className="flex items-center gap-1 text-gray-400 text-[11px] font-mono">
            <span>Primary Infeed A</span>
            <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
          </div>

          <button
            type="button"
            onClick={() => onToggleSource('tr-1', 'Transformer TR-1')}
            className={`w-full p-2.5 rounded border text-center transition cursor-pointer ${
              state.sources['tr-1'].status === 'ACTIVE' && isHvOnline
                ? 'bg-[#153319] border-[#00cc44] text-[#00ff66]'
                : 'bg-[#4a1c1c] border-[#ff4d4d] text-[#ff9999]'
            }`}
          >
            <div className="font-bold">TR-1 (2500kVA / 380V)</div>
            <div className="text-[10px] font-mono">BUS A FEEDER: {state.sources['tr-1'].status}</div>
          </button>

          {/* Bus Bar A Line */}
          <div
            className="w-full h-2 rounded transition-colors duration-300"
            style={{ backgroundColor: busAColor }}
            title="Main Busbar A (380V)"
          />
          <span className="text-[10px] font-mono font-bold text-gray-300">MAIN BUSBAR A (380V / 50Hz)</span>

          {/* Bus A MDBs */}
          <div className="grid grid-cols-3 gap-2 w-full mt-1">
            {['mdb-1a', 'mdb-2a', 'mdb-3a'].map((id) => {
              const mdb = state.mdbs[id];
              const isTripped = mdb.status === 'TRIPPED';
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onToggleMdb(id)}
                  className={`p-2 rounded border text-center transition cursor-pointer ${
                    isTripped
                      ? 'bg-[#4a1c1c] border-[#ff4d4d] text-[#ff9999] animate-pulse'
                      : 'bg-[#153319] border-[#00cc44] text-[#00ff66]'
                  }`}
                >
                  <div className="font-bold text-[11px]">{mdb.name}</div>
                  <div className="text-[9px] font-mono">{mdb.status}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* BUS B BRANCH */}
        <div className="flex flex-col items-center gap-3 bg-[#1e1e1e] p-3 rounded border border-[#333]">
          <div className="flex items-center gap-1 text-gray-400 text-[11px] font-mono">
            <span>Primary Infeed B</span>
            <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
          </div>

          <button
            type="button"
            onClick={() => onToggleSource('tr-2', 'Transformer TR-2')}
            className={`w-full p-2.5 rounded border text-center transition cursor-pointer ${
              state.sources['tr-2'].status === 'ACTIVE' && isHvOnline
                ? 'bg-[#153319] border-[#00cc44] text-[#00ff66]'
                : 'bg-[#4a1c1c] border-[#ff4d4d] text-[#ff9999]'
            }`}
          >
            <div className="font-bold">TR-2 (2500kVA / 380V)</div>
            <div className="text-[10px] font-mono">BUS B FEEDER: {state.sources['tr-2'].status}</div>
          </button>

          {/* Bus Bar B Line */}
          <div
            className="w-full h-2 rounded transition-colors duration-300"
            style={{ backgroundColor: busBColor }}
            title="Main Busbar B (380V)"
          />
          <span className="text-[10px] font-mono font-bold text-gray-300">MAIN BUSBAR B (380V / 50Hz)</span>

          {/* Bus B MDBs */}
          <div className="grid grid-cols-3 gap-2 w-full mt-1">
            {['mdb-1b', 'mdb-2b', 'mdb-3b'].map((id) => {
              const mdb = state.mdbs[id];
              const isTripped = mdb.status === 'TRIPPED';
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onToggleMdb(id)}
                  className={`p-2 rounded border text-center transition cursor-pointer ${
                    isTripped
                      ? 'bg-[#4a1c1c] border-[#ff4d4d] text-[#ff9999] animate-pulse'
                      : 'bg-[#153319] border-[#00cc44] text-[#00ff66]'
                  }`}
                >
                  <div className="font-bold text-[11px]">{mdb.name}</div>
                  <div className="text-[9px] font-mono">{mdb.status}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-[#181818] p-2.5 rounded border border-[#333] flex items-center justify-between text-[11px] text-gray-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Interconnection Rule: ATS transfers seamlessly to Emergency Generator when primary MDB/TR is de-energized.</span>
        </div>
        <span className="font-mono text-[#00ffcc]">AUTOMATIC SYNCHRONIZATION ACTIVE</span>
      </div>
    </div>
  );
};
