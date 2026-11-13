import React from 'react';
import { Volume2, VolumeX, ShieldAlert, Cpu } from 'lucide-react';
import type { SystemCounters } from '../simulator/logic';

interface HeaderProps {
  counters: SystemCounters;
  soundEnabled: boolean;
  onToggleSound: () => void;
  generatorAutoStart: boolean;
  onToggleAutoStart: () => void;
  onOpenAlarmHub: (filter?: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'ALL') => void;
}

export const Header: React.FC<HeaderProps> = ({
  counters,
  soundEnabled,
  onToggleSound,
  generatorAutoStart,
  onToggleAutoStart,
  onOpenAlarmHub,
}) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const hasAlarms = counters.critical > 0 || counters.major > 0 || counters.minor > 0 || counters.warning > 0;

  return (
    <header className="top-header flex justify-between items-center bg-[#1e1e1e] px-4 sm:px-5 py-2.5 border-b-2 border-[#444] select-none">
      <div className="brand flex items-center gap-3">
        <div className="logo-red bg-[#b30000] text-white px-2.5 py-1 font-bold rounded text-xs sm:text-sm tracking-wider shadow">
          FXL Fa x Lite
        </div>
        <div className="flex flex-col">
          <span className="title-text text-white text-sm sm:text-base font-bold tracking-wider">
            SILA1 - ELECTRICAL SIMULATOR (FULL PACKAGE)
          </span>
          <span className="text-[10px] text-gray-400 font-mono hidden sm:inline-block">
            SCADA INTERACTIVE CONTROL & PROTECTION INTERLOCK SYSTEM
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Protection / Auto-transfer Toggle */}
        <button
          type="button"
          onClick={onToggleAutoStart}
          title="สลับโหมด Auto-Start ของเครื่องกำเนิดไฟฟ้าฉุกเฉินเมื่อไฟดับ"
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold border transition cursor-pointer ${
            generatorAutoStart
              ? 'bg-[#153319] border-[#00cc44] text-[#00ff66]'
              : 'bg-[#2a2a2a] border-[#555] text-gray-400'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>GEN AUTO: {generatorAutoStart ? 'ENABLE' : 'MANUAL'}</span>
        </button>

        {/* Audio Alert Toggle */}
        <button
          type="button"
          onClick={onToggleSound}
          title={soundEnabled ? 'ปิดเสียงแจ้งเตือน (Alarm Muted)' : 'เปิดเสียงแจ้งเตือน (Alarm Unmuted)'}
          className="p-1.5 rounded bg-[#333] hover:bg-[#444] text-gray-300 border border-[#555] transition cursor-pointer"
          aria-label="Toggle sound alarm"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-[#00ffcc]" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
        </button>

        {/* Alarm Hub Quick Launcher */}
        <button
          type="button"
          onClick={() => onOpenAlarmHub('ALL')}
          className={`px-2.5 py-1 rounded text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer shadow ${
            hasAlarms
              ? 'bg-[#4a1111] hover:bg-[#661616] text-[#ff8080] border-red-500 animate-pulse'
              : 'bg-[#2b2b2b] hover:bg-[#383838] text-gray-400 border-[#555]'
          }`}
          title="คลิกเพื่อเปิดศูนย์วิเคราะห์ปัญหาและสัญญาณเตือนทั้งหมด (Active Alarm Hub)"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span className="hidden sm:inline">ALARM HUB</span>
          <span className="bg-black/40 px-1 rounded text-[10px] font-mono text-white">
            {counters.critical + counters.major + counters.minor + counters.warning}
          </span>
        </button>

        {/* Status Counters matching HTML IDs and classes - Clickable to filter alarms! */}
        <div className="status-counters flex gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onOpenAlarmHub('CRITICAL')}
            className={`counter-badge c-crit transition hover:scale-105 active:scale-95 cursor-pointer ${
              counters.critical > 0 ? 'animate-pulse ring-2 ring-red-400' : 'hover:brightness-110'
            }`}
            id="cnt-crit"
            title="คลิกเพื่อดูและดึงไปหาอุปกรณ์ที่มีปัญหา CRITICAL (ตู้ทริป/หม้อแปลงขัดข้อง)"
          >
            CRITICAL: {pad(counters.critical)}
          </button>
          <button
            type="button"
            onClick={() => onOpenAlarmHub('MAJOR')}
            className="counter-badge c-maj transition hover:scale-105 active:scale-95 cursor-pointer hover:brightness-110"
            id="cnt-maj"
            title="คลิกเพื่อดูและดึงไปหาอุปกรณ์ MAJOR (ATS Transfer/ไฟฉุกเฉิน)"
          >
            MAJOR: {pad(counters.major)}
          </button>
          <button
            type="button"
            onClick={() => onOpenAlarmHub('MINOR')}
            className="counter-badge c-min hidden sm:block transition hover:scale-105 active:scale-95 cursor-pointer hover:brightness-110"
            title="คลิกเพื่อดูเหตุการณ์ MINOR (Battery Discharging)"
          >
            MINOR: {pad(counters.minor)}
          </button>
          <button
            type="button"
            onClick={() => onOpenAlarmHub('WARNING')}
            className="counter-badge c-warn hidden sm:block transition hover:scale-105 active:scale-95 cursor-pointer hover:brightness-110"
            title="คลิกเพื่อดูคำเตือน WARNING (Bypass Mode/Gen Standby)"
          >
            WARNING: {pad(counters.warning)}
          </button>
        </div>
      </div>
    </header>
  );
};

