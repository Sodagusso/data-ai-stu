import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2, Copy, Check } from 'lucide-react';

export interface LogEntry {
  id: string;
  time: string;
  type: 'ready' | 'alert' | 'normal' | 'transfer' | 'critical' | 'info';
  message: string;
}

interface OutputLogPanelProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  onNavigateToEquipment?: (tab: 'ee' | 'ups' | 'floor' | 'ac' | 'overview' | 'ups-efficiency' | 'hv-diagram' | 'up-tier', elementId: string) => void;
}

export const OutputLogPanel: React.FC<OutputLogPanelProps> = ({ logs, onClearLogs, onNavigateToEquipment }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCopy = () => {
    const text = logs.map((l) => `[${l.time}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLogTypeBadge = (type: LogEntry['type']) => {
    switch (type) {
      case 'alert':
      case 'critical':
        return <span className="text-[#ff4d4d] font-bold">🔴 [Alert]</span>;
      case 'normal':
        return <span className="text-[#00ff66] font-bold">🟢 [Normal]</span>;
      case 'transfer':
        return <span className="text-[#ffaa00] font-bold">⚡ [Transfer]</span>;
      case 'ready':
      case 'info':
      default:
        return <span className="text-[#00ffcc] font-bold">ℹ️ [System]</span>;
    }
  };

  // Helper to resolve equipment from log text
  const detectEquipmentFromLog = (msg: string): { tab: 'ee' | 'ups' | 'floor' | 'ac' | 'overview' | 'ups-efficiency' | 'hv-diagram' | 'up-tier'; id: string; label: string } | null => {
    if (msg.includes('MDB1A') || msg.includes('mdb-1a')) return { tab: 'ee', id: 'mdb-1a', label: 'MDB1A' };
    if (msg.includes('MDB1B') || msg.includes('mdb-1b')) return { tab: 'ee', id: 'mdb-1b', label: 'MDB1B' };
    if (msg.includes('MDB2A') || msg.includes('mdb-2a')) return { tab: 'ee', id: 'mdb-2a', label: 'MDB2A' };
    if (msg.includes('MDB2B') || msg.includes('mdb-2b')) return { tab: 'ee', id: 'mdb-2b', label: 'MDB2B' };
    if (msg.includes('MDB3A') || msg.includes('mdb-3a')) return { tab: 'ee', id: 'mdb-3a', label: 'MDB3A' };
    if (msg.includes('MDB3B') || msg.includes('mdb-3b')) return { tab: 'ee', id: 'mdb-3b', label: 'MDB3B' };
    if (msg.includes('ATS1A') || msg.includes('ats-1a')) return { tab: 'ee', id: 'ats-1a', label: 'ATS1A' };
    if (msg.includes('ATS1B') || msg.includes('ats-1b')) return { tab: 'ee', id: 'ats-1b', label: 'ATS1B' };
    if (msg.includes('High Voltage') || msg.includes('22kV') || msg.includes('PEA') || msg.includes('Blackout')) return { tab: 'hv-diagram', id: 'src-hv', label: '22kV HV' };
    if (msg.includes('TR-1') || msg.includes('tr-1')) return { tab: 'hv-diagram', id: 'tr-1', label: 'TR-1' };
    if (msg.includes('TR-2') || msg.includes('tr-2')) return { tab: 'hv-diagram', id: 'tr-2', label: 'TR-2' };
    if (msg.includes('GEN-1') || msg.includes('Generator')) return { tab: 'ee', id: 'gen-1', label: 'GEN-1' };
    if (msg.includes('UPS-3B2') || msg.includes('ups-3b2')) return { tab: 'ups', id: 'ups-3b2', label: 'UPS-3B2' };
    if (msg.includes('UPS-3A2') || msg.includes('ups-3a2')) return { tab: 'ups', id: 'ups-3a2', label: 'UPS-3A2' };
    if (msg.includes('UPS-3B1') || msg.includes('ups-3b1')) return { tab: 'ups', id: 'ups-3b1', label: 'UPS-3B1' };
    if (msg.includes('UPS-3A1') || msg.includes('ups-3a1')) return { tab: 'ups', id: 'ups-3a1', label: 'UPS-3A1' };
    if (msg.includes('UPS-3B3') || msg.includes('ups-3b3')) return { tab: 'ups', id: 'ups-3b3', label: 'UPS-3B3' };
    if (msg.includes('UPS-3A3') || msg.includes('ups-3a3')) return { tab: 'ups', id: 'ups-3a3', label: 'UPS-3A3' };
    if (msg.includes('BATT-3B2') || msg.includes('batt-3b2')) return { tab: 'ups', id: 'batt-3b2', label: 'BATT-3B2' };
    if (msg.includes('BATT-3A2') || msg.includes('batt-3a2')) return { tab: 'ups', id: 'batt-3a2', label: 'BATT-3A2' };
    if (msg.includes('UPS-3A') || msg.includes('UPS 3A')) return { tab: 'ups', id: 'ups-3a1', label: 'UPS-3A' };
    if (msg.includes('UPS-3B') || msg.includes('UPS 3B')) return { tab: 'ups', id: 'ups-3b1', label: 'UPS-3B' };
    if (msg.includes('Battery') || msg.includes('แบตเตอรี่')) return { tab: 'ups', id: 'batt-3a1', label: 'BATTERY' };
    if (msg.includes('CRAC') || msg.includes('PCU')) return { tab: 'ac', id: 'crac-pcu04', label: 'CRAC' };
    return null;
  };

  return (
    <div className="output-panel System-Logic---Interconnection-Output-Log h-[140px] bg-[#111] border-t-2 border-[#444] px-4 sm:px-5 py-2 overflow-hidden flex flex-col font-mono text-[11.5px] select-text">
      <div className="flex items-center justify-between border-b border-[#333] pb-1 mb-1">
        <h4 className="text-white font-sans text-xs font-semibold flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-[#00ffcc]" />
          <span>System Logic & Interconnection Output Log:</span>
          <span className="text-[10px] text-gray-400 font-normal hidden sm:inline">
            (คลิกที่แท็กอุปกรณ์เพื่อกระโดดไปยังตำแหน่งอุปกรณ์)
          </span>
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-mono">
            {logs.length} entries
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#222] border border-[#444] hover:bg-[#333] transition cursor-pointer"
            title="คัดลอกประวัติเหตุการณ์ทั้งหมด"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            onClick={onClearLogs}
            className="text-[10px] text-gray-400 hover:text-red-400 flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#222] border border-[#444] hover:bg-[#333] transition cursor-pointer"
            title="ล้างประวัติเหตุการณ์"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div
        id="log-box"
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-1 pr-2 scroll-smooth text-[#00ffcc]"
      >
        {logs.map((log) => {
          const detected = detectEquipmentFromLog(log.message);
          const isFault = log.type === 'alert' || log.type === 'critical';

          return (
            <div
              key={log.id}
              className={`leading-relaxed px-1 rounded transition flex items-center justify-between gap-2 ${
                isFault ? 'bg-red-950/20 hover:bg-red-950/40' : 'hover:bg-[#1a1a1a]'
              }`}
            >
              <div className="flex-1 truncate">
                <span className="text-gray-500 select-none mr-1.5">[{log.time}]</span>
                {getLogTypeBadge(log.type)}{' '}
                <span className={isFault ? 'text-[#ff9999] font-medium' : ''}>
                  {log.message}
                </span>
              </div>

              {detected && onNavigateToEquipment && (
                <button
                  type="button"
                  onClick={() => onNavigateToEquipment(detected.tab, detected.id)}
                  className="shrink-0 px-1.5 py-0.5 rounded bg-[#005580] hover:bg-[#007acc] text-white text-[10px] font-sans font-bold flex items-center gap-1 cursor-pointer transition shadow"
                  title={`กระโดดไปยังหน้า ${detected.tab.toUpperCase()} และโฟกัสที่ ${detected.label}`}
                >
                  <span>📍 ไปที่ {detected.label} ↗</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
