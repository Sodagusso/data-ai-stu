import React from 'react';
import type { MdbState } from '../simulator/logic';

interface MdbGroupProps {
  mdbs: Record<string, MdbState>;
  onToggleMdb: (mdbId: string) => void;
  highlightedElementId?: string | null;
}

export const MdbGroup: React.FC<MdbGroupProps> = ({ mdbs, onToggleMdb, highlightedElementId }) => {
  // Display ordered as in the original HTML: mdb-1b, mdb-1a, mdb-2b, mdb-2a, mdb-3b, mdb-3a
  const displayOrder = ['mdb-1b', 'mdb-1a', 'mdb-2b', 'mdb-2a', 'mdb-3b', 'mdb-3a'];

  return (
    <div>
      <div className="section-title text-xs text-[#aaa] font-bold border-b border-[#555] pb-1 mb-2 uppercase flex items-center justify-between">
        <span>MDB Group (คลิกเพื่อทดสอบการตัดวงจร / Trip)</span>
        <span className="text-[10px] text-gray-400 font-normal">
          Click node to simulate CB Trip / Fault
        </span>
      </div>

      <div className="grid-container flex gap-2.5 flex-wrap">
        {displayOrder.map((id) => {
          const mdb = mdbs[id];
          if (!mdb) return null;
          const isTripped = mdb.status === 'TRIPPED';
          const isHighlighted = highlightedElementId === id;

          return (
            <button
              key={id}
              type="button"
              id={id}
              data-mdb={mdb.name}
              className={`node-box ${isTripped ? 'tripped' : 'normal'} relative overflow-hidden transition-all duration-300 ${
                isHighlighted ? 'ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(255,230,0,0.9)] scale-105 z-10 animate-bounce' : ''
              }`}
              onClick={() => onToggleMdb(id)}
              title={`ตู้จ่ายหลัก ${mdb.name} (Bus ${mdb.bus}) - ปกติ ~${mdb.baseCurrent}A | คลิกเพื่อทริป/รีเซ็ต`}
              aria-label={`${mdb.name}: ${isTripped ? 'TRIPPED' : 'NORMAL'}`}
            >
              <div className="flex items-center gap-1">
                <span className="name text-[11px] font-bold">{mdb.name}</span>
                <span className="text-[8px] px-1 rounded bg-black/40 text-gray-300 font-mono">
                  B{mdb.bus}
                </span>
              </div>
              <span className="status text-[8.5px] tracking-wider uppercase font-semibold">
                {isTripped ? 'TRIPPED!' : 'NORMAL'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
