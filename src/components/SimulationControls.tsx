import React from 'react';
import { Play, Pause, RotateCcw, Activity } from 'lucide-react';

interface SimulationControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  simSpeed: number;
  onChangeSpeed: (speed: number) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isRunning,
  onStart,
  onStop,
  onReset,
  simSpeed,
  onChangeSpeed,
}) => {
  return (
    <div className="bg-[#2a2a2a] border border-[#444] rounded p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3">
        <span className="text-gray-300 font-bold flex items-center gap-1.5 uppercase tracking-wide">
          <Activity className="w-4 h-4 text-[#00ffcc]" />
          <span>แผงควบคุมการจำลอง (Simulation Controls)</span>
        </span>

        {/* Live Status Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1c1c1c] border border-[#3c3c3c]">
          <span
            className={`w-2 h-2 rounded-full ${
              isRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
            }`}
          />
          <span className="text-[11px] font-mono font-semibold">
            สถานะ:{' '}
            <span className={isRunning ? 'text-emerald-400' : 'text-amber-400'}>
              {isRunning ? 'กำลังทำงาน (RUNNING)' : 'หยุดชั่วคราว (PAUSED)'}
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* ปุ่ม 'เริ่ม' (Start) */}
        <button
          type="button"
          id="btn-sim-start"
          onClick={onStart}
          disabled={isRunning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold transition shadow cursor-pointer ${
            isRunning
              ? 'bg-[#1e3321] text-emerald-600 border border-emerald-900/50 cursor-not-allowed opacity-60'
              : 'bg-[#28a745] hover:bg-[#218838] active:scale-95 text-white border border-[#34ce57]'
          }`}
          title="เริ่มการทำงานของการจำลองระบบไฟฟ้า (Start Simulation)"
          aria-label="เริ่มการจำลอง"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>เริ่ม</span>
        </button>

        {/* ปุ่ม 'หยุด' (Pause / Stop) */}
        <button
          type="button"
          id="btn-sim-stop"
          onClick={onStop}
          disabled={!isRunning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold transition shadow cursor-pointer ${
            !isRunning
              ? 'bg-[#3b321c] text-amber-600 border border-amber-900/50 cursor-not-allowed opacity-60'
              : 'bg-[#ffaa00] hover:bg-[#e69900] active:scale-95 text-black border border-[#ffbb33]'
          }`}
          title="พักการทำงานของการจำลอง (Pause Simulation)"
          aria-label="หยุดการจำลอง"
        >
          <Pause className="w-3.5 h-3.5 fill-current" />
          <span>หยุด</span>
        </button>

        {/* ปุ่ม 'รีเซ็ต' (Reset) */}
        <button
          type="button"
          id="btn-sim-reset"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded font-bold bg-[#b30000] hover:bg-[#cc0000] active:scale-95 text-white border border-[#d9534f] transition shadow cursor-pointer"
          title="กลับสู่สถานะเริ่มต้น (Reset to Initial State)"
          aria-label="รีเซ็ตการจำลอง"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>รีเซ็ต</span>
        </button>

        {/* Speed Selector */}
        <div className="hidden sm:flex items-center gap-1 ml-2 pl-2 border-l border-[#444] text-[11px] text-gray-400">
          <span>ความเร็ว:</span>
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => onChangeSpeed(spd)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition ${
                simSpeed === spd
                  ? 'bg-[#007acc] text-white font-bold'
                  : 'bg-[#333] hover:bg-[#444] text-gray-300'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
