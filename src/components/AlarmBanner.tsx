import React from 'react';
import { Flame, AlertTriangle, ArrowRight, ShieldAlert, ListFilter } from 'lucide-react';
import type { ActiveAlarmItem } from '../simulator/logic';

interface AlarmBannerProps {
  alarms: ActiveAlarmItem[];
  onOpenModal: () => void;
  onNavigateToAlarm: (alarm: ActiveAlarmItem) => void;
}

export const AlarmBanner: React.FC<AlarmBannerProps> = ({
  alarms,
  onOpenModal,
  onNavigateToAlarm,
}) => {
  if (alarms.length === 0) return null;

  const topAlarm = alarms[0];
  const isCritical = alarms.some((a) => a.severity === 'CRITICAL');

  return (
    <div
      className={`px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs font-sans select-none border-b shadow-md transition-all ${
        isCritical
          ? 'bg-[#3b0d0d] border-red-500/80 text-white'
          : 'bg-[#38260b] border-amber-500/80 text-amber-100'
      }`}
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-1.5 font-bold tracking-wide">
          {isCritical ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white text-[11px] animate-pulse">
              <Flame className="w-3.5 h-3.5" />
              <span>CRITICAL ALARM ({alarms.length})</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-600 text-black font-extrabold text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>MAJOR ALARM ({alarms.length})</span>
            </span>
          )}
          <span className="text-gray-300 font-normal">|</span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <strong className="text-white underline">{topAlarm.equipmentName}:</strong>
          <span className="truncate max-w-[280px] sm:max-w-md text-gray-200">
            {topAlarm.title}
          </span>
          <span className="text-[10px] text-gray-400 hidden md:inline">
            ({topAlarm.locationText})
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick jump to the most critical alarm */}
        <button
          type="button"
          onClick={() => onNavigateToAlarm(topAlarm)}
          className="px-2.5 py-1 rounded bg-[#007acc] hover:bg-[#0094f7] active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition shadow cursor-pointer ring-1 ring-blue-300"
          title={`กระโดดไปยังหน้า ${topAlarm.targetTab.toUpperCase()} (${topAlarm.equipmentName})`}
        >
          <span>🎯 ดึงไปหา: {topAlarm.equipmentName}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {/* View all button */}
        <button
          type="button"
          onClick={onOpenModal}
          className="px-2.5 py-1 rounded bg-black/40 hover:bg-black/60 text-gray-200 border border-white/20 font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>ดูทั้งหมด ({alarms.length})</span>
        </button>
      </div>
    </div>
  );
};
