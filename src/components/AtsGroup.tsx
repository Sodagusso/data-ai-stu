import React from 'react';
import type { AtsState } from '../simulator/logic';

interface AtsGroupProps {
  atsList: Record<string, AtsState>;
}

export const AtsGroup: React.FC<AtsGroupProps> = ({ atsList }) => {
  const displayOrder = [
    'ats-1b',
    'ats-1a',
    'ats-2b',
    'ats-2a',
    'ats-3b',
    'ats-3a',
    'atsp-22',
    'atsp-26',
    'atsp-23',
    'atsp-27',
    'atsp-24',
    'atsp-31',
  ];

  const getNodeClass = (status: AtsState['status']) => {
    if (status === 'POWER LOST') {
      return 'node-box tripped';
    }
    if (status === 'TRANSFER') {
      return 'node-box transfer';
    }
    return 'node-box normal';
  };

  return (
    <div>
      <div className="section-title text-xs text-[#aaa] font-bold border-b border-[#555] pb-1 mb-2 uppercase flex items-center justify-between">
        <span>ATS Group (เปลี่ยนสถานะอัตโนมัติตาม MDB ต้นทาง)</span>
        <span className="text-[10px] text-gray-400 font-normal">
          Main & Sub-Distribution Automatic Transfer Switches
        </span>
      </div>

      <div className="grid-container flex gap-2.5 flex-wrap">
        {displayOrder.map((id) => {
          const ats = atsList[id];
          if (!ats) return null;

          return (
            <div
              key={id}
              id={id}
              className={getNodeClass(ats.status)}
              title={`${ats.name} (${ats.description}) - ผูกกับ ${ats.parentMdb.toUpperCase()} | สถานะ: ${ats.status}`}
              aria-label={`${ats.name}: ${ats.status}`}
            >
              <span className="name text-[11px] font-bold">{ats.name}</span>
              <span className="status text-[8.5px] tracking-wider uppercase font-semibold">
                {ats.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
