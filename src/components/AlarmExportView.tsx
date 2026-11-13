import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Database,
  Download,
  Copy,
  Check,
  RefreshCw,
  Search,
  Filter,
  Play,
  Pause,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Zap,
  Info,
  ExternalLink,
  CheckCircle2,
  Trash2,
  Clock,
  Layers,
  Sparkles,
  Code,
  X,
  FileText,
} from 'lucide-react';
import type { HistoricalAlarmRecord, AlarmPriority } from '../simulator/alarmStorage';
import {
  exportAlarmsToExcel,
  exportAlarmsToCsv,
  exportAlarmsToSql,
  generateSqlScript,
  type SqlDialect,
} from '../simulator/alarmExportService';
import type { TelemetryData } from '../simulator/logic';

interface AlarmExportViewProps {
  alarmHistory: HistoricalAlarmRecord[];
  onAcknowledgeAlarm: (alarmId: string) => void;
  onResolveAlarm: (alarmId: string) => void;
  onClearHistory: () => void;
  onRestoreDefaults: () => void;
  onInjectTestAlarm: () => void;
  onNavigateToDevice: (targetTab: string, targetElementId: string) => void;
  telemetry: TelemetryData;
  isRealtimeStreaming: boolean;
  onToggleRealtimeStreaming: () => void;
  pollIntervalMs: number;
  onChangePollInterval: (ms: number) => void;
  onManualPullLatest: () => void;
  lastPullTimestamp: string;
}

export const AlarmExportView: React.FC<AlarmExportViewProps> = ({
  alarmHistory,
  onAcknowledgeAlarm,
  onResolveAlarm,
  onClearHistory,
  onRestoreDefaults,
  onInjectTestAlarm,
  onNavigateToDevice,
  telemetry,
  isRealtimeStreaming,
  onToggleRealtimeStreaming,
  pollIntervalMs,
  onChangePollInterval,
  onManualPullLatest,
  lastPullTimestamp,
}) => {
  // Priority Filter: ALL or specific priority level
  const [selectedPriority, setSelectedPriority] = useState<AlarmPriority | 'ALL'>('ALL');

  // Search & secondary filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL');
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>('ALL');
  const [timeRange, setTimeRange] = useState<'ALL' | '15M' | '1H' | '24H'>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST' | 'PRIORITY'>('NEWEST');

  // Selection for export
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // SQL Preview Modal State
  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);
  const [sqlDialect, setSqlDialect] = useState<SqlDialect>('PostgreSQL');
  const [sqlIncludeDdl, setSqlIncludeDdl] = useState<boolean>(true);
  const [sqlTableName, setSqlTableName] = useState<string>('scada_alarm_logs');
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Export dropdown / quick notifications
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const showExportNotice = (msg: string) => {
    setExportNotice(msg);
    setTimeout(() => setExportNotice(null), 3500);
  };

  // Distinct subsystems
  const subsystems = useMemo(() => {
    const set = new Set<string>();
    alarmHistory.forEach((r) => set.add(r.subsystem));
    return Array.from(set);
  }, [alarmHistory]);

  // Priority counts
  const priorityCounts = useMemo(() => {
    const counts = {
      ALL: alarmHistory.length,
      CRITICAL: 0,
      MAJOR: 0,
      MINOR: 0,
      WARNING: 0,
      INFO: 0,
      ACTIVE_TOTAL: 0,
      ACKED_TOTAL: 0,
      RESOLVED_TOTAL: 0,
    };
    alarmHistory.forEach((r) => {
      counts[r.priority] = (counts[r.priority] || 0) + 1;
      if (r.status === 'ACTIVE') counts.ACTIVE_TOTAL += 1;
      if (r.status === 'ACKNOWLEDGED') counts.ACKED_TOTAL += 1;
      if (r.status === 'RESOLVED') counts.RESOLVED_TOTAL += 1;
    });
    return counts;
  }, [alarmHistory]);

  // Filtered & Sorted Alarm List
  const filteredRecords = useMemo(() => {
    const now = Date.now();

    return alarmHistory
      .filter((r) => {
        // 1. Priority filter
        if (selectedPriority !== 'ALL' && r.priority !== selectedPriority) return false;

        // 2. Status filter
        if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;

        // 3. Subsystem filter
        if (selectedSubsystem !== 'ALL' && r.subsystem !== selectedSubsystem) return false;

        // 4. Time Range filter
        if (timeRange === '15M' && now - r.epochMs > 15 * 60 * 1000) return false;
        if (timeRange === '1H' && now - r.epochMs > 60 * 60 * 1000) return false;
        if (timeRange === '24H' && now - r.epochMs > 24 * 60 * 60 * 1000) return false;

        // 5. Search text filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchCode = r.code.toLowerCase().includes(q);
          const matchTag = r.deviceTag.toLowerCase().includes(q);
          const matchMsgTh = r.messageTh.toLowerCase().includes(q);
          const matchMsgEn = r.messageEn.toLowerCase().includes(q);
          const matchSub = r.subsystem.toLowerCase().includes(q);
          const matchId = r.id.toLowerCase().includes(q);
          if (!matchCode && !matchTag && !matchMsgTh && !matchMsgEn && !matchSub && !matchId) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'NEWEST') return b.epochMs - a.epochMs;
        if (sortOrder === 'OLDEST') return a.epochMs - b.epochMs;
        if (sortOrder === 'PRIORITY') {
          const score = (p: AlarmPriority) => {
            switch (p) {
              case 'CRITICAL': return 5;
              case 'MAJOR': return 4;
              case 'MINOR': return 3;
              case 'WARNING': return 2;
              case 'INFO': return 1;
            }
          };
          return score(b.priority) - score(a.priority) || b.epochMs - a.epochMs;
        }
        return 0;
      });
  }, [alarmHistory, selectedPriority, selectedStatus, selectedSubsystem, timeRange, searchTerm, sortOrder]);

  // Selected records for targeted export, or all filtered records if none explicitly checked
  const recordsToExport = useMemo(() => {
    if (selectedIds.size > 0) {
      return filteredRecords.filter((r) => selectedIds.has(r.id));
    }
    return filteredRecords;
  }, [filteredRecords, selectedIds]);

  // Bulk selection handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map((r) => r.id)));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Export handlers
  const handleExportExcel = () => {
    exportAlarmsToExcel(recordsToExport, selectedPriority, {
      totalKw: telemetry.powerKw,
      voltage: telemetry.voltage,
      frequency: telemetry.frequency,
    });
    showExportNotice(`สร้างและดาวน์โหลดไฟล์ Excel (.xlsx) จำนวน ${recordsToExport.length} รายการสำเร็จ!`);
  };

  const handleExportCsv = () => {
    exportAlarmsToCsv(recordsToExport, selectedPriority);
    showExportNotice(`สร้างและดาวน์โหลดไฟล์ CSV (UTF-8 BOM) จำนวน ${recordsToExport.length} รายการสำเร็จ!`);
  };

  const handleExportSql = () => {
    exportAlarmsToSql(
      recordsToExport,
      {
        dialect: sqlDialect,
        includeDdl: sqlIncludeDdl,
        includeBatchInserts: true,
        tableName: sqlTableName || 'scada_alarm_logs',
      },
      selectedPriority
    );
    showExportNotice(`สร้างและดาวน์โหลดไฟล์ SQL (.sql) สำเร็จ!`);
  };

  // Generated SQL for modal view
  const previewSqlString = useMemo(() => {
    return generateSqlScript(recordsToExport, {
      dialect: sqlDialect,
      includeDdl: sqlIncludeDdl,
      includeBatchInserts: true,
      tableName: sqlTableName || 'scada_alarm_logs',
    });
  }, [recordsToExport, sqlDialect, sqlIncludeDdl, sqlTableName]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(previewSqlString);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const getPriorityBadge = (pri: AlarmPriority) => {
    switch (pri) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#4a1111] text-[#ff4d4d] border border-[#ff4d4d] animate-pulse">
            <Flame className="w-3 h-3 text-red-500" />
            CRITICAL
          </span>
        );
      case 'MAJOR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#4a2e0e] text-[#ffaa00] border border-[#ffaa00]">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            MAJOR
          </span>
        );
      case 'MINOR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#3d3a14] text-[#ffff66] border border-[#cccc00]">
            <ShieldAlert className="w-3 h-3 text-yellow-400" />
            MINOR
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#14283d] text-[#66b3ff] border border-[#3385ff]">
            <Zap className="w-3 h-3 text-blue-400" />
            WARNING
          </span>
        );
      case 'INFO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#1d3326] text-[#70f2a9] border border-[#2e7d32]">
            <Info className="w-3 h-3 text-emerald-400" />
            INFO
          </span>
        );
    }
  };

  const getStatusBadge = (status: HistoricalAlarmRecord['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            ACTIVE
          </span>
        );
      case 'ACKNOWLEDGED':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
            ACKNOWLEDGED
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            RESOLVED
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4 text-gray-200 select-none pb-12">
      {/* Top SCADA Real-time Status Header */}
      <div className="bg-[#222] border border-[#444] rounded-lg p-3 sm:p-4 shadow flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-gradient-to-br from-[#005580] to-[#002b40] text-cyan-300 border border-cyan-500/40 shadow-inner">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-white text-base sm:text-lg font-bold tracking-wide">
                SCADA ALARM LOGS & REAL-TIME DATA QUERY
              </h2>
              {isRealtimeStreaming ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/90 text-emerald-400 border border-emerald-500/50 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  REAL-TIME STREAM ACTIVE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-950/90 text-yellow-400 border border-yellow-500/50 flex items-center gap-1.5">
                  <Pause className="w-3 h-3 text-yellow-400" />
                  STREAM PAUSED
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              ดึงข้อมูลเหตุการณ์เตือนภัยแบบ Real-time, จำแนกตามลำดับความสำคัญ (Priority Logs) และส่งออกเป็นไฟล์ Excel (.xlsx / .csv) หรือคำสั่ง SQL (.sql)
            </p>
          </div>
        </div>

        {/* Real-time controls & actions */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Real-time toggle */}
          <button
            type="button"
            onClick={onToggleRealtimeStreaming}
            className={`px-3 py-1.5 rounded font-medium border flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
              isRealtimeStreaming
                ? 'bg-[#153319] hover:bg-[#1e4723] text-emerald-300 border-emerald-500/50'
                : 'bg-[#3d3319] hover:bg-[#524522] text-amber-300 border-amber-500/50'
            }`}
            title="เปิด/ปิดการสตรีมข้อมูลสัญญาณเตือนอัตโนมัติ"
          >
            {isRealtimeStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRealtimeStreaming ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>

          {/* Poll Interval */}
          <div className="flex items-center gap-1 bg-[#1a1a1a] px-2 py-1 rounded border border-[#444] text-[11px]">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-gray-400">Rate:</span>
            <select
              value={pollIntervalMs}
              onChange={(e) => onChangePollInterval(Number(e.target.value))}
              className="bg-[#2a2a2a] text-cyan-300 rounded px-1.5 py-0.5 font-mono cursor-pointer border border-[#555] focus:outline-none"
            >
              <option value={500}>0.5s</option>
              <option value={1000}>1.0s</option>
              <option value={2000}>2.0s</option>
              <option value={5000}>5.0s</option>
            </select>
          </div>

          {/* Pull Latest Now */}
          <button
            type="button"
            onClick={onManualPullLatest}
            className="px-2.5 py-1.5 rounded bg-[#2c4354] hover:bg-[#39576e] text-cyan-200 border border-cyan-500/40 flex items-center gap-1.5 cursor-pointer transition"
            title="ดึงข้อมูลสัญญาณเตือนภัยสดทันที"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Pull Latest</span>
          </button>

          {/* Inject Test Alarm */}
          <button
            type="button"
            onClick={onInjectTestAlarm}
            className="px-2.5 py-1.5 rounded bg-[#4a2612] hover:bg-[#663519] text-amber-200 border border-amber-500/40 flex items-center gap-1.5 cursor-pointer transition"
            title="จำลองเหตุการณ์เตือนภัยแบบฉับพลันเพื่อทดสอบการบันทึก Real-time"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Alarm Burst</span>
          </button>
        </div>
      </div>

      {/* Export Feedback Notification Banner */}
      {exportNotice && (
        <div className="bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between shadow animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="text-emerald-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Priority KPI Cards Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
        {/* Total */}
        <div
          onClick={() => setSelectedPriority('ALL')}
          className={`p-3 rounded-lg border cursor-pointer transition ${
            selectedPriority === 'ALL'
              ? 'bg-[#1e293b] border-blue-400 shadow-md ring-1 ring-blue-400'
              : 'bg-[#222] border-[#444] hover:border-gray-400'
          }`}
        >
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="font-semibold text-[11px]">ALL LOGS</span>
            <Layers className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-white">
            {priorityCounts.ALL}
          </div>
          <div className="text-[10px] text-gray-400 flex items-center justify-between mt-1">
            <span>Active: {priorityCounts.ACTIVE_TOTAL}</span>
            <span>Resolved: {priorityCounts.RESOLVED_TOTAL}</span>
          </div>
        </div>

        {/* Critical */}
        <div
          onClick={() => setSelectedPriority('CRITICAL')}
          className={`p-3 rounded-lg border cursor-pointer transition ${
            selectedPriority === 'CRITICAL'
              ? 'bg-[#3b1515] border-red-500 shadow-md ring-1 ring-red-400'
              : 'bg-[#222] border-[#444] hover:border-red-500/60'
          }`}
        >
          <div className="flex items-center justify-between text-red-400 mb-1">
            <span className="font-bold text-[11px] flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              CRITICAL
            </span>
            {priorityCounts.CRITICAL > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-red-400">
            {priorityCounts.CRITICAL}
          </div>
          <div className="text-[10px] text-red-300/80 mt-1">
            MDB Trips & Blackouts
          </div>
        </div>

        {/* Major */}
        <div
          onClick={() => setSelectedPriority('MAJOR')}
          className={`p-3 rounded-lg border cursor-pointer transition ${
            selectedPriority === 'MAJOR'
              ? 'bg-[#38230f] border-amber-500 shadow-md ring-1 ring-amber-400'
              : 'bg-[#222] border-[#444] hover:border-amber-500/60'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="font-bold text-[11px] flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              MAJOR
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-amber-400">
            {priorityCounts.MAJOR}
          </div>
          <div className="text-[10px] text-amber-300/80 mt-1">
            ATS Transfers & Gen Run
          </div>
        </div>

        {/* Minor */}
        <div
          onClick={() => setSelectedPriority('MINOR')}
          className={`p-3 rounded-lg border cursor-pointer transition ${
            selectedPriority === 'MINOR'
              ? 'bg-[#383311] border-yellow-500 shadow-md ring-1 ring-yellow-400'
              : 'bg-[#222] border-[#444] hover:border-yellow-500/60'
          }`}
        >
          <div className="flex items-center justify-between text-yellow-400 mb-1">
            <span className="font-bold text-[11px] flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              MINOR
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-yellow-400">
            {priorityCounts.MINOR}
          </div>
          <div className="text-[10px] text-yellow-300/80 mt-1">
            Battery Test & Overloads
          </div>
        </div>

        {/* Warning */}
        <div
          onClick={() => setSelectedPriority('WARNING')}
          className={`p-3 rounded-lg border cursor-pointer transition ${
            selectedPriority === 'WARNING'
              ? 'bg-[#14283d] border-blue-400 shadow-md ring-1 ring-blue-400'
              : 'bg-[#222] border-[#444] hover:border-blue-400/60'
          }`}
        >
          <div className="flex items-center justify-between text-blue-400 mb-1">
            <span className="font-bold text-[11px] flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              WARNING
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-blue-400">
            {priorityCounts.WARNING}
          </div>
          <div className="text-[10px] text-blue-300/80 mt-1">
            Static Bypass & Cooling
          </div>
        </div>

        {/* Info */}
        <div
          onClick={() => setSelectedPriority('INFO')}
          className={`p-3 rounded-lg border cursor-pointer transition ${
            selectedPriority === 'INFO'
              ? 'bg-[#153322] border-emerald-500 shadow-md ring-1 ring-emerald-400'
              : 'bg-[#222] border-[#444] hover:border-emerald-500/60'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="font-bold text-[11px] flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              INFO
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">
            {priorityCounts.INFO}
          </div>
          <div className="text-[10px] text-emerald-300/80 mt-1">
            Maintenance & Routine
          </div>
        </div>
      </div>

      {/* Main Filter & Action Bar */}
      <div className="bg-[#242424] border border-[#444] rounded-lg p-3 sm:p-4 flex flex-col gap-3 shadow">
        {/* Row 1: Priority Tab Selector Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#3a3a3a] pb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-gray-400 mr-1">PRIORITY TABS:</span>
            {(['ALL', 'CRITICAL', 'MAJOR', 'MINOR', 'WARNING', 'INFO'] as const).map((pri) => {
              const isActive = selectedPriority === pri;
              return (
                <button
                  key={pri}
                  type="button"
                  onClick={() => setSelectedPriority(pri)}
                  className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#007acc] text-white shadow ring-1 ring-cyan-400'
                      : 'bg-[#333] text-gray-300 hover:bg-[#444]'
                  }`}
                >
                  <span>{pri}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#222] text-gray-400'
                    }`}
                  >
                    {priorityCounts[pri]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Export Excel (.xlsx) */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow border border-emerald-500/50"
              title="ส่งออกรายงานเหตุการณ์ทั้งหมดเป็นไฟล์ Excel (.xlsx) พร้อมตารางสรุป Priority Pivot"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Export Excel (.xlsx)</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-2.5 py-1.5 rounded bg-[#2a4d3a] hover:bg-[#37634b] text-emerald-200 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer border border-emerald-600/40"
              title="ส่งออกเป็นไฟล์ CSV (UTF-8 BOM รองรับภาษาไทย)"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>

            {/* Export SQL */}
            <button
              type="button"
              onClick={handleExportSql}
              className="px-3 py-1.5 rounded bg-[#1e40af] hover:bg-[#2563eb] active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow border border-blue-400/50"
              title={`ดาวน์โหลดคำสั่ง SQL Insert & Schema DDL สำหรับ ${sqlDialect}`}
            >
              <Database className="w-4 h-4 text-cyan-300" />
              <span>Export SQL (.sql)</span>
            </button>

            {/* Preview SQL Modal Button */}
            <button
              type="button"
              onClick={() => setIsSqlModalOpen(true)}
              className="px-2.5 py-1.5 rounded bg-[#333] hover:bg-[#444] text-gray-200 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer border border-[#555]"
              title="เปิดหน้าต่างดูคำสั่ง SQL แบบสด พร้อมเลือก Dialect และคัดลอกได้ทันที"
            >
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              <span>Preview SQL</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search and secondary filtering */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Search Bar */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px] bg-[#1a1a1a] px-3 py-1.5 rounded border border-[#444]">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหา Device (MDB-1A, TR-1, UPS), รหัสเตือน, หรือข้อความ..."
              className="bg-transparent text-white placeholder-gray-500 text-xs w-full focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Subsystem filter */}
          <div className="flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1.5 rounded border border-[#444]">
            <span className="text-gray-400 text-[11px]">Subsystem:</span>
            <select
              value={selectedSubsystem}
              onChange={(e) => setSelectedSubsystem(e.target.value)}
              className="bg-[#242424] text-gray-200 rounded px-1.5 py-0.5 text-xs border border-[#555] focus:outline-none"
            >
              <option value="ALL">All Subsystems ({subsystems.length})</option>
              {subsystems.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1.5 rounded border border-[#444]">
            <span className="text-gray-400 text-[11px]">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-[#242424] text-gray-200 rounded px-1.5 py-0.5 text-xs border border-[#555] focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="RESOLVED">Resolved Only</option>
            </select>
          </div>

          {/* Time Range */}
          <div className="flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1.5 rounded border border-[#444]">
            <span className="text-gray-400 text-[11px]">Time:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-[#242424] text-gray-200 rounded px-1.5 py-0.5 text-xs border border-[#555] focus:outline-none"
            >
              <option value="ALL">All Time</option>
              <option value="15M">Past 15 Mins</option>
              <option value="1H">Past 1 Hour</option>
              <option value="24H">Past 24 Hours</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1.5 rounded border border-[#444]">
            <span className="text-gray-400 text-[11px]">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-[#242424] text-gray-200 rounded px-1.5 py-0.5 text-xs border border-[#555] focus:outline-none"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="PRIORITY">Priority First</option>
            </select>
          </div>

          {/* Utility Reset / Clear */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRestoreDefaults}
              className="px-2 py-1.5 rounded bg-[#333] hover:bg-[#444] text-gray-300 text-[11px] border border-[#555] cursor-pointer"
              title="โหลดชุดข้อมูลตัวอย่าง SCADA Historical Alarms เริ่มต้นใหม่"
            >
              Reset Samples
            </button>
            <button
              type="button"
              onClick={onClearHistory}
              className="px-2 py-1.5 rounded bg-[#421b1b] hover:bg-[#5c2424] text-red-300 text-[11px] border border-red-500/40 cursor-pointer"
              title="ล้างบันทึกประวัติการเตือนภัยทั้งหมด"
            >
              <Trash2 className="w-3 h-3 inline mr-1" />
              Clear
            </button>
          </div>
        </div>

        {/* Selection Info Bar */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-white font-mono">{filteredRecords.length}</strong> of{' '}
              <strong className="text-white font-mono">{alarmHistory.length}</strong> recorded alarms
            </span>
            {selectedIds.size > 0 && (
              <span className="text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                {selectedIds.size} selected for export ({((selectedIds.size / filteredRecords.length) * 100).toFixed(0)}%)
              </span>
            )}
          </div>
          <div className="text-gray-400 font-mono text-[11px]">
            Last Synced: <span className="text-cyan-300">{lastPullTimestamp || 'Live'}</span>
          </div>
        </div>
      </div>

      {/* Main SCADA Alarm Records Table */}
      <div className="bg-[#1e1e1e] border border-[#444] rounded-lg shadow overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#151515] text-gray-400 border-b border-[#333] text-[11px] uppercase tracking-wider font-semibold">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredRecords.length && filteredRecords.length > 0}
                    onChange={handleToggleSelectAll}
                    className="cursor-pointer rounded accent-cyan-500"
                    title="เลือกทั้งหมดในหน้านี้"
                  />
                </th>
                <th className="p-3 w-28">Priority</th>
                <th className="p-3 w-32">Alarm Code</th>
                <th className="p-3 w-28">Device Tag</th>
                <th className="p-3 w-40">Subsystem</th>
                <th className="p-3 w-28">Status</th>
                <th className="p-3 min-w-[280px]">Alarm Description</th>
                <th className="p-3 w-36">Trigger / Limit</th>
                <th className="p-3 w-36">Event Timestamp</th>
                <th className="p-3 w-32 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d2d] text-gray-300 font-sans">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert className="w-10 h-10 text-gray-600" />
                      <p className="text-sm font-semibold text-gray-400">
                        ไม่พบข้อมูลสัญญาณเตือนที่ตรงกับตัวกรอง
                      </p>
                      <p className="text-xs text-gray-500">
                        ลองเปลี่ยนแท็บ Priority, ล้างคำค้นหา, หรือคลิก &quot;Simulate Alarm Burst&quot; เพื่อจำลองสัญญาณเตือนใหม่
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isSelected = selectedIds.has(record.id);

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-[#282828] transition ${
                        isSelected ? 'bg-[#183144]/60' : record.status === 'ACTIVE' ? 'bg-red-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(record.id)}
                          className="cursor-pointer rounded accent-cyan-500"
                        />
                      </td>

                      {/* Priority */}
                      <td className="p-3 font-mono">{getPriorityBadge(record.priority)}</td>

                      {/* Alarm Code */}
                      <td className="p-3 font-mono font-bold text-gray-200">
                        {record.code}
                        <div className="text-[10px] text-gray-500 font-normal">{record.id}</div>
                      </td>

                      {/* Device Tag */}
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-[#2a2a2a] text-cyan-300 border border-[#444] text-[11px]">
                          {record.deviceTag}
                        </span>
                      </td>

                      {/* Subsystem */}
                      <td className="p-3 text-gray-300 text-[11px]">{record.subsystem}</td>

                      {/* Status */}
                      <td className="p-3">{getStatusBadge(record.status)}</td>

                      {/* Description TH & EN */}
                      <td className="p-3">
                        <div className="font-medium text-white text-xs leading-snug">
                          {record.messageTh}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                          {record.messageEn}
                        </div>
                      </td>

                      {/* Trigger Value / Threshold */}
                      <td className="p-3 font-mono text-[11px]">
                        <div className="text-amber-300 font-semibold">{record.triggerValue}</div>
                        <div className="text-[10px] text-gray-400">Limit: {record.threshold}</div>
                      </td>

                      {/* Timestamp */}
                      <td className="p-3 font-mono text-[11px] text-gray-400">
                        <div>{record.eventTime}</div>
                        {record.durationSec !== undefined && (
                          <div className="text-[10px] text-emerald-400">
                            Duration: {record.durationSec}s
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Acknowledge Button */}
                          {record.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => onAcknowledgeAlarm(record.id)}
                              className="px-2 py-1 rounded bg-[#383311] hover:bg-[#4d4417] text-yellow-300 text-[10px] font-bold border border-yellow-500/50 cursor-pointer"
                              title="รับทราบสัญญาณเตือน (Acknowledge Alarm)"
                            >
                              Ack
                            </button>
                          )}

                          {/* Resolve Button */}
                          {record.status !== 'RESOLVED' && (
                            <button
                              type="button"
                              onClick={() => onResolveAlarm(record.id)}
                              className="px-2 py-1 rounded bg-[#153322] hover:bg-[#1f4a32] text-emerald-300 text-[10px] font-bold border border-emerald-500/50 cursor-pointer"
                              title="คืนสภาพสภาวะปกติ (Clear Alarm)"
                            >
                              Clear
                            </button>
                          )}

                          {/* Deep Link to Device Tab */}
                          <button
                            type="button"
                            onClick={() => onNavigateToDevice(record.targetTab, record.targetElementId)}
                            className="p-1.5 rounded bg-[#2b2b2b] hover:bg-[#3d3d3d] text-cyan-300 hover:text-white border border-[#555] cursor-pointer"
                            title="กระโดดไปยังหน้าอุปกรณ์ในระบบ SCADA Diagram"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer info */}
        <div className="bg-[#151515] p-3 border-t border-[#333] flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              Real-time Buffer Capacity: 1000 items | IEC 62682 / ISA-18.2 Alarm Management Standard Compliant
            </span>
          </div>
          <div className="font-mono text-[11px] text-gray-400">
            Export Target: <span className="text-white font-bold">{recordsToExport.length} rows</span>
          </div>
        </div>
      </div>

      {/* SQL Preview & Code Viewer Modal */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none animate-fadeIn">
          <div className="bg-[#1a1a1a] border-2 border-[#555] rounded-lg shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-gray-200">
            {/* Modal Header */}
            <div className="bg-[#111] px-5 py-3.5 border-b border-[#333] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-blue-700 text-white shadow">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white text-base font-bold flex items-center gap-2">
                    <span>SCADA SQL CODE GENERATOR & EXPORT</span>
                    <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-[#333] text-cyan-300">
                      {recordsToExport.length} Records
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    คำสั่ง SQL สำหรับนำข้อมูลเหตุการณ์เตือนภัยไป Import ใน Database ภายนอก รองรับ DDL + DML
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1.5 rounded hover:bg-[#333] text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Controls Bar */}
            <div className="bg-[#242424] px-5 py-3 border-b border-[#333] flex items-center justify-between flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Dialect Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 font-semibold">SQL Dialect:</span>
                  <div className="flex items-center gap-1 bg-[#151515] p-1 rounded border border-[#444]">
                    {(['PostgreSQL', 'MySQL', 'SQLServer', 'SQLite'] as SqlDialect[]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSqlDialect(d)}
                        className={`px-2.5 py-1 rounded text-xs font-mono cursor-pointer transition ${
                          sqlDialect === d
                            ? 'bg-blue-600 text-white font-bold shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Name */}
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Table Name:</span>
                  <input
                    type="text"
                    value={sqlTableName}
                    onChange={(e) => setSqlTableName(e.target.value)}
                    className="bg-[#151515] text-cyan-300 font-mono px-2 py-1 rounded border border-[#444] text-xs focus:outline-none w-36"
                  />
                </div>

                {/* Include DDL Toggle */}
                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input
                    type="checkbox"
                    checked={sqlIncludeDdl}
                    onChange={(e) => setSqlIncludeDdl(e.target.checked)}
                    className="rounded accent-blue-500 cursor-pointer"
                  />
                  <span>Include CREATE TABLE & INDEXES (DDL)</span>
                </label>
              </div>

              {/* Copy & Download Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    copiedSql
                      ? 'bg-emerald-700 text-white border-emerald-400'
                      : 'bg-[#333] hover:bg-[#444] text-gray-200 border-[#555]'
                  }`}
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportSql}
                  className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow border border-blue-400"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .sql File</span>
                </button>
              </div>
            </div>

            {/* SQL Monospace Code Box */}
            <div className="flex-1 p-4 bg-[#111] overflow-y-auto font-mono text-xs text-gray-300">
              <pre className="whitespace-pre-wrap leading-relaxed select-text font-mono text-[11px] text-cyan-100/90">
                {previewSqlString}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#151515] px-5 py-3 border-t border-[#333] flex items-center justify-between text-xs text-gray-400">
              <span className="text-[11px]">
                Tip: สามารถนำไฟล์ .sql นี้ไปรันใน DBeaver, pgAdmin, MySQL Workbench หรือ SSMS ได้ทันที
              </span>
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="px-4 py-1.5 rounded bg-[#333] hover:bg-[#444] text-gray-200 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
