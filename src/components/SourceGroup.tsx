import React from 'react';
import type { SourceState } from '../simulator/logic';

interface SourceGroupProps {
  sources: Record<string, SourceState>;
  onToggleSource: (sourceId: string, name: string) => void;
  highlightedElementId?: string | null;
}

export const SourceGroup: React.FC<SourceGroupProps> = ({
  sources,
  onToggleSource,
  highlightedElementId,
}) => {
  const getNodeClass = (source: SourceState, id: string) => {
    const isHighlighted = highlightedElementId === id;
    const highlightRing = isHighlighted ? ' ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(255,230,0,0.9)] scale-105 z-10 animate-bounce' : '';

    if (source.status === 'FAULT' || source.status === 'OFFLINE') {
      return `node-box tripped${highlightRing}`;
    }
    if (source.status === 'STANDBY') {
      return `node-box standby${highlightRing}`;
    }
    if (source.status === 'RUNNING') {
      return `node-box transfer animate-pulse${highlightRing}`;
    }
    return `node-box normal${highlightRing}`;
  };

  return (
    <div>
      <div className="section-title text-xs text-[#aaa] font-bold border-b border-[#555] pb-1 mb-2 uppercase flex items-center justify-between">
        <span>Source Group (HV / Transformer / Generator)</span>
        <span className="text-[10px] text-gray-400 font-normal">
          (คลิกเพื่อจำลองสลับสถานะ / ปลดวงจรแหล่งจ่าย)
        </span>
      </div>

      <div className="grid-container flex gap-2.5 flex-wrap">
        {/* HV Feed */}
        <button
          type="button"
          id="src-hv"
          className={getNodeClass(sources['src-hv'], 'src-hv')}
          onClick={() => onToggleSource('src-hv', 'High Voltage (PEA/MEG)')}
          title="คลิกเพื่อจำลองไฟฟ้าแรงสูงดับ / คืนสู่ระบบ"
          aria-label={`High Voltage Feed: ${sources['src-hv'].status}`}
        >
          <span className="name text-[11px] font-bold">HV Feed</span>
          <span className="status text-[8.5px] tracking-wider uppercase font-semibold">
            {sources['src-hv'].status}
          </span>
        </button>

        {/* Transformer 1 */}
        <button
          type="button"
          id="tr-1"
          className={getNodeClass(sources['tr-1'], 'tr-1')}
          onClick={() => onToggleSource('tr-1', 'Transformer TR-1')}
          title="หม้อแปลง TR-1 จ่ายบัส A (คลิกเพื่อทดสอบ Trip หม้อแปลง 1)"
          aria-label={`Transformer TR-1: ${sources['tr-1'].status}`}
        >
          <span className="name text-[11px] font-bold">TR-1 (2500kVA)</span>
          <span className="status text-[8.5px] tracking-wider uppercase font-semibold">
            {sources['tr-1'].status}
          </span>
        </button>

        {/* Transformer 2 */}
        <button
          type="button"
          id="tr-2"
          className={getNodeClass(sources['tr-2'], 'tr-2')}
          onClick={() => onToggleSource('tr-2', 'Transformer TR-2')}
          title="หม้อแปลง TR-2 จ่ายบัส B (คลิกเพื่อทดสอบ Trip หม้อแปลง 2)"
          aria-label={`Transformer TR-2: ${sources['tr-2'].status}`}
        >
          <span className="name text-[11px] font-bold">TR-2 (2500kVA)</span>
          <span className="status text-[8.5px] tracking-wider uppercase font-semibold">
            {sources['tr-2'].status}
          </span>
        </button>

        {/* Emergency Generator */}
        <button
          type="button"
          id="gen-1"
          className={getNodeClass(sources['gen-1'], 'gen-1')}
          onClick={() => onToggleSource('gen-1', 'Emergency Generator GEN-1')}
          title="เครื่องกำเนิดไฟฟ้าฉุกเฉิน (คลิกเพื่อ Manual Run / Standby)"
          aria-label={`Emergency Generator GEN-1: ${sources['gen-1'].status}`}
        >
          <span className="name text-[11px] font-bold">GEN-1</span>
          <span className="status text-[8.5px] tracking-wider uppercase font-semibold">
            {sources['gen-1'].status}
          </span>
        </button>
      </div>
    </div>
  );
};
