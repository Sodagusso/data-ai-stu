import React from 'react';
import type { SimulatorState } from '../simulator/logic';
import { Wind, Snowflake, CheckCircle, AlertTriangle } from 'lucide-react';

interface AcSummaryViewProps {
  state: SimulatorState;
}

export const AcSummaryView: React.FC<AcSummaryViewProps> = ({ state }) => {
  // AC equipment connected to MDBs:
  // Chiller 1 on MDB1B
  // Chiller 2 on MDB2B
  // Primary Chilled Water Pumps on ATSP23 (MDB1A)
  // Secondary Chilled Water Pumps on ATSP27 (MDB1B)
  // AHU Zone 1 on MDB2A
  // AHU Zone 2 on MDB3B

  const ch1Tripped = state.mdbs['mdb-1b'].status === 'TRIPPED';
  const ch2Tripped = state.mdbs['mdb-2b'].status === 'TRIPPED';
  const pump1Lost = state.ats['atsp-23'].status === 'POWER LOST';
  const pump2Lost = state.ats['atsp-27'].status === 'POWER LOST';

  return (
    <div className="bg-[#242424] border border-[#444] rounded p-4 flex flex-col gap-4 text-xs">
      <div className="flex items-center justify-between border-b border-[#555] pb-2">
        <div className="flex items-center gap-2">
          <Snowflake className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white uppercase tracking-wider text-sm">
            AC Summary - HVAC & Chiller Plant Electrical Interconnection
          </span>
        </div>
        <span className="text-[11px] text-gray-400 font-mono">
          CHILLER PLANT & AHU INTERLOCK STATUS
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Chiller 1 */}
        <div
          className={`p-3 rounded border ${
            ch1Tripped
              ? 'bg-[#4a1c1c] border-[#ff4d4d] text-[#ff9999]'
              : 'bg-[#1a2d1d] border-[#00cc44] text-[#00ff66]'
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span>CHILLER-01 (1000 TR)</span>
            {ch1Tripped ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
          </div>
          <div className="text-[10px] text-gray-300 mt-1">Feeder: MDB1B (Bus B)</div>
          <div className="text-[11px] font-mono mt-1 font-semibold">
            STATUS: {ch1Tripped ? 'INTERLOCK TRIP (POWER LOSS)' : 'RUNNING (NORMAL)'}
          </div>
        </div>

        {/* Chiller 2 */}
        <div
          className={`p-3 rounded border ${
            ch2Tripped
              ? 'bg-[#4a1c1c] border-[#ff4d4d] text-[#ff9999]'
              : 'bg-[#1a2d1d] border-[#00cc44] text-[#00ff66]'
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span>CHILLER-02 (1000 TR)</span>
            {ch2Tripped ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
          </div>
          <div className="text-[10px] text-gray-300 mt-1">Feeder: MDB2B (Bus B)</div>
          <div className="text-[11px] font-mono mt-1 font-semibold">
            STATUS: {ch2Tripped ? 'INTERLOCK TRIP (POWER LOSS)' : 'RUNNING (NORMAL)'}
          </div>
        </div>

        {/* Chilled Water Circulation Pumps */}
        <div
          className={`p-3 rounded border ${
            pump1Lost && pump2Lost
              ? 'bg-[#4a1c1c] border-[#ff4d4d] text-[#ff9999]'
              : pump1Lost || pump2Lost
              ? 'bg-[#3e2710] border-[#f0ad4e] text-[#ffb84d]'
              : 'bg-[#1a2d1d] border-[#00cc44] text-[#00ff66]'
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span>CHW PUMPS (P-01 / P-02)</span>
            <Wind className="w-4 h-4" />
          </div>
          <div className="text-[10px] text-gray-300 mt-1">ATS Feeder: ATSP23 / ATSP27</div>
          <div className="text-[11px] font-mono mt-1 font-semibold">
            STATUS:{' '}
            {pump1Lost && pump2Lost
              ? 'ALL PUMPS OFFLINE'
              : pump1Lost || pump2Lost
              ? 'STANDBY PUMP RUNNING'
              : 'DUAL PUMP OPERATIONAL'}
          </div>
        </div>
      </div>
    </div>
  );
};
