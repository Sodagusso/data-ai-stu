import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Flame,
  ArrowRight,
  RotateCcw,
  ShieldAlert,
  Zap,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Clock,
  Filter,
  FileSpreadsheet,
} from 'lucide-react';
import type { ActiveAlarmItem, AlarmSeverity } from '../simulator/logic';

interface ActiveAlarmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alarms: ActiveAlarmItem[];
  filterSeverity: AlarmSeverity | 'ALL';
  onNavigateToAlarm: (alarm: ActiveAlarmItem) => void;
  onQuickRecover?: (alarm: ActiveAlarmItem) => void;
  onResetAll?: () => void;
  onOpenExportTab?: () => void;
}

export const ActiveAlarmsModal: React.FC<ActiveAlarmsModalProps> = ({
  isOpen,
  onClose,
  alarms,
  filterSeverity: initialFilter,
  onNavigateToAlarm,
  onQuickRecover,
  onResetAll,
  onOpenExportTab,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<AlarmSeverity | 'ALL'>(initialFilter || 'ALL');

  if (!isOpen) return null;

  const filteredAlarms =
    selectedFilter === 'ALL' ? alarms : alarms.filter((a) => a.severity === selectedFilter);

  const criticalCount = alarms.filter((a) => a.severity === 'CRITICAL').length;
  const majorCount = alarms.filter((a) => a.severity === 'MAJOR').length;
  const minorCount = alarms.filter((a) => a.severity === 'MINOR').length;
  const warningCount = alarms.filter((a) => a.severity === 'WARNING').length;

  const getSeverityBadge = (sev: AlarmSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#4a1111] text-[#ff4d4d] border border-[#ff4d4d] animate-pulse flex items-center gap-1">
            <Flame className="w-3 h-3 text-red-500" />
            CRITICAL ALARM
          </span>
        );
      case 'MAJOR':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#4a2e0e] text-[#ffaa00] border border-[#ffaa00] flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            MAJOR ALARM
          </span>
        );
      case 'MINOR':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3d3a14] text-[#ffff66] border border-[#cccc00] flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-yellow-400" />
            MINOR EVENT
          </span>
        );
      case 'WARNING':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#14283d] text-[#66b3ff] border border-[#3385ff] flex items-center gap-1">
            <Zap className="w-3 h-3 text-blue-400" />
            WARNING
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none animate-fadeIn">
      <div className="bg-[#1f1f1f] border-2 border-[#555] rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-gray-200">
        {/* Header */}
        <div className="bg-[#151515] px-5 py-3.5 border-b border-[#444] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-[#b30000] text-white shadow">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white text-base font-bold flex items-center gap-2">
                <span>SCADA ACTIVE ALARM & FAULT DIAGNOSTICS</span>
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-[#333] text-gray-300">
                  {alarms.length} Active {alarms.length === 1 ? 'Fault' : 'Faults'}
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">
                ระบบเชื่อมโยงสัญญาณเตือนภัย SCADA คลิกเพื่อกระโดดไปยังหน้าอุปกรณ์ที่มีปัญหาทันที (Deep Link Navigation)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenExportTab && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExportTab();
                }}
                className="px-2.5 py-1.5 rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="เปิดหน้าจัดการและส่งออก Alarm เป็น Excel หรือ SQL"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden sm:inline">Export Excel / SQL</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded bg-[#333] hover:bg-[#444] text-gray-400 hover:text-white transition cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="bg-[#262626] px-5 py-2 border-b border-[#3a3a3a] flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-400 font-semibold text-[11px] flex items-center gap-1">
            <Filter className="w-3 h-3" /> ตัวกรอง:
          </span>
          <button
            type="button"
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1 rounded font-semibold transition cursor-pointer ${
              selectedFilter === 'ALL'
                ? 'bg-[#007acc] text-white shadow'
                : 'bg-[#333] text-gray-400 hover:bg-[#444]'
            }`}
          >
            ทั้งหมด ({alarms.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('CRITICAL')}
            className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'CRITICAL'
                ? 'bg-[#b30000] text-white shadow ring-1 ring-red-400'
                : 'bg-[#333] text-[#ff6666] hover:bg-[#444]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            CRITICAL ({criticalCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('MAJOR')}
            className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
              selectedFilter === 'MAJOR'
                ? 'bg-[#cc8800] text-black font-bold shadow ring-1 ring-amber-300'
                : 'bg-[#333] text-[#ffbb33] hover:bg-[#444]'
            }`}
          >
            MAJOR ({majorCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('MINOR')}
            className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
              selectedFilter === 'MINOR'
                ? 'bg-[#999900] text-black font-bold shadow'
                : 'bg-[#333] text-[#ffff80] hover:bg-[#444]'
            }`}
          >
            MINOR ({minorCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('WARNING')}
            className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
              selectedFilter === 'WARNING'
                ? 'bg-[#005580] text-white font-bold shadow'
                : 'bg-[#333] text-[#80bfff] hover:bg-[#444]'
            }`}
          >
            WARNING ({warningCount})
          </button>

          {onResetAll && (
            <button
              type="button"
              onClick={() => {
                onResetAll();
                onClose();
              }}
              className="ml-auto px-3 py-1 rounded bg-[#4a1c1c] hover:bg-[#662222] text-[#ff9999] border border-[#ff4d4d]/40 font-semibold flex items-center gap-1.5 transition cursor-pointer text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตระบบทั้งหมด (Reset All Alarms)</span>
            </button>
          )}
        </div>

        {/* Alarm List Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-[#181818]">
          {filteredAlarms.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3 animate-bounce" />
              <h4 className="text-white text-base font-bold">ไม่มีสัญญาณแจ้งเตือนค้างในระบบ</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-md">
                อุปกรณ์ไฟฟ้า แหล่งจ่าย 22kV, หม้อแปลง Dyn11, ตู้สวิตช์บอร์ด MDB/ATS และระบบสำรองไฟ UPS
                ทำงานอยู่ในเกณฑ์ปกติตามมาตรฐาน
              </p>
            </div>
          ) : (
            filteredAlarms.map((alarm) => (
              <div
                key={alarm.id}
                className="bg-[#242424] hover:bg-[#2a2a2a] border border-[#444] rounded-lg p-4 transition-all duration-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(alarm.severity)}
                    <span className="font-mono text-xs text-gray-400 font-semibold bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#333]">
                      {alarm.code}
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {alarm.timestamp}
                    </span>
                  </div>

                  <h4 className="text-white text-sm font-bold tracking-wide">
                    {alarm.title}
                  </h4>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    {alarm.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400 pt-1">
                    <span className="flex items-center gap-1 text-cyan-300">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <strong>ตำแหน่ง:</strong> {alarm.locationText}
                    </span>
                    <span>
                      <strong>อุปกรณ์:</strong> {alarm.equipmentName}
                    </span>
                  </div>

                  <div className="bg-[#1a1a1a] rounded p-2 text-[11px] text-gray-300 border-l-2 border-amber-500 mt-2 font-mono">
                    <strong className="text-amber-400">SOP ข้อแนะนำ:</strong> {alarm.recommendedAction}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex sm:flex-col items-center sm:items-stretch gap-2 shrink-0 pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToAlarm(alarm);
                      onClose();
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded bg-[#007acc] hover:bg-[#0094f7] active:scale-95 text-white font-bold text-xs tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2 cursor-pointer ring-1 ring-blue-300"
                    title="กระโดดไปยังตำแหน่งอุปกรณ์ที่มีปัญหาบนหน้าจอ Single-Line Diagram / GIS Floor Plan"
                  >
                    <span>ดึงไปหาอุปกรณ์</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {alarm.isRecoverable && onQuickRecover && (
                    <button
                      type="button"
                      onClick={() => onQuickRecover(alarm)}
                      className="px-3 py-1.5 rounded bg-[#2e3b2e] hover:bg-[#3d523d] text-[#85e085] border border-[#00cc44]/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>รีเซ็ตทันที</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#181818] px-5 py-2.5 border-t border-[#333] flex items-center justify-between text-[11px] text-gray-400 font-mono">
          <span>FXL SILA1 SCADA ALARM BUS v3.4</span>
          <span>AUTONOMOUS FAULT ISOLATION READY</span>
        </div>
      </div>
    </div>
  );
};
