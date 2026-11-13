/**
 * SILA1 Electrical System Simulator - Maintenance Panel & Work Order SLA System
 * Includes Real-Time Google Sheets Integration, Job Dispatch, Acknowledge & Resolve Lifecycle
 */

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Activity,
  Gauge,
  Flame,
  Sparkles,
  RefreshCcw,
  FileSpreadsheet,
  PlusCircle,
  Copy,
  ExternalLink,
  Download,
  Check,
  UserCheck,
  ListFilter,
  Send,
  Sliders,
} from 'lucide-react';
import {
  type SimulatorState,
  type MaintenanceJob,
  type JobPriority,
  type JobStatus,
  type JobType,
  SLA_TARGETS,
  INITIAL_MAINTENANCE_JOBS,
  openMaintenanceJob,
  acknowledgeMaintenanceJob,
  resolveMaintenanceJob,
  generateMaintenanceJobsCsv,
  generateGoogleSheetsClipboardTsv,
} from '../simulator/logic';

interface MaintenancePanelProps {
  state: SimulatorState;
  onPerformService: (equipmentId: string) => void;
  initialJobs?: MaintenanceJob[];
  onOpenWorkOrderRef?: (fn: (job: any) => void) => void;
}

export const MaintenancePanel: React.FC<MaintenancePanelProps> = ({
  state,
  onPerformService,
  initialJobs,
  onOpenWorkOrderRef,
}) => {
  const [selectedComponentId, setSelectedComponentId] = useState<string>('mdb-1a');

  // Work Orders state
  const [jobs, setJobs] = useState<MaintenanceJob[]>(() => initialJobs || INITIAL_MAINTENANCE_JOBS);
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<JobPriority | 'ALL'>('ALL');

  // Modals & UI States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState<boolean>(false);
  const [activeResolvingJob, setActiveResolvingJob] = useState<MaintenanceJob | null>(null);
  const [copiedFormula, setCopiedFormula] = useState<boolean>(false);
  const [copiedClipboard, setCopiedClipboard] = useState<boolean>(false);

  // New Job Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newEquipmentId, setNewEquipmentId] = useState<string>('mdb-1a');
  const [newJobType, setNewJobType] = useState<JobType>('CORRECTIVE_CM');
  const [newPriority, setNewPriority] = useState<JobPriority>('P2_HIGH');
  const [newAssignee, setNewAssignee] = useState<string>('สมชาย ชัยชนะ (Senior EE Engineer)');
  const [newDescription, setNewDescription] = useState<string>('');

  // Resolve Job Form State
  const [resolveEngineer, setResolveEngineer] = useState<string>('สมชาย ชัยชนะ (Senior EE Engineer)');
  const [resolveNotes, setResolveNotes] = useState<string>('');
  const [partsReplaced, setPartsReplaced] = useState<string>('เปลี่ยนชิ้นส่วนและทดสอบระบบเรียบร้อย');
  const [actualDowntimeMinutes, setActualDowntimeMinutes] = useState<number>(0);

  // Sync with backend API if available
  useEffect(() => {
    fetch('/api/maintenance/jobs')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && Array.isArray(data.jobs) && data.jobs.length > 0) {
          setJobs(data.jobs);
        }
      })
      .catch(() => {
        // Fallback to local state if running standalone
      });
  }, []);

  // Allow external triggers (e.g. from PowerPathRerouteView) to open a work order
  useEffect(() => {
    if (onOpenWorkOrderRef) {
      onOpenWorkOrderRef((params: any) => {
        setJobs((prev) =>
          openMaintenanceJob(prev, {
            title: params.title,
            equipmentId: params.equipmentId,
            equipmentName: params.equipmentName,
            jobType: 'EMERGENCY_SOP',
            priority: params.priority || 'P1_CRITICAL',
            description: params.description,
            assignedTo: 'Lead EE On-Duty Engineer',
          })
        );
      });
    }
  }, [onOpenWorkOrderRef]);

  // Aggregate preventive maintenance needs from simulator
  const mdbTasks = Object.values(state.mdbs).filter((m) => m.maintenanceRequired);
  const upsTasks = Object.values(state.upsUnits).filter((u) => u.maintenanceRequired);
  const tasks = [...mdbTasks, ...upsTasks];

  // Predictive failure calculations
  const getPredictiveMetrics = (componentId: string) => {
    let baseHours = 1250;
    let loadPct = 65;
    let tempC = 38.5;
    let name = componentId.toUpperCase();

    if (state.mdbs[componentId]) {
      const m = state.mdbs[componentId];
      name = m.name;
      baseHours = m.runTimeHours || 1420;
      loadPct = Math.min(100, Math.round((m.baseCurrent / 794) * 100));
      tempC = m.status === 'TRIPPED' ? 72.4 : 41.2;
    } else if (state.upsUnits[componentId]) {
      const u = state.upsUnits[componentId];
      name = u.name;
      baseHours = u.runTimeHours || (u.id.includes('3b2') ? 1820 : u.id.includes('3a2') ? 1850 : 1780);
      loadPct = Math.min(100, Math.round((u.loadKw / u.capacityKva) * 100));
      tempC = u.status === 'FAULT' ? 79.1 : u.id.includes('3b2') ? 43.8 : 44.5;
    } else if (state.batteries && state.batteries[componentId]) {
      const b = state.batteries[componentId];
      name = b.name;
      baseHours = 3200;
      loadPct = b.status === 'DISCHARGE' ? 88 : 8;
      tempC = b.temperatureC || 23.8;
    } else if (componentId === 'tr-1' || componentId === 'tr-2') {
      name = state.sources[componentId]?.name || componentId;
      baseHours = 4500;
      loadPct = 58;
      tempC = state.sources[componentId]?.status === 'FAULT' ? 88.0 : 54.2;
    } else if (componentId === 'gen-1') {
      name = 'Emergency Generator GEN-1';
      baseHours = 320;
      loadPct = state.sources['gen-1']?.status === 'RUNNING' ? 82 : 0;
      tempC = 62.0;
    }

    const hoursScore = (baseHours / 10000) * 40;
    const loadScore = (loadPct / 100) * 35;
    const tempScore = Math.max(0, (tempC - 35) / 50) * 25;
    const failureProbPct = Math.min(99.9, Math.max(1.2, parseFloat((hoursScore + loadScore + tempScore).toFixed(1))));

    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (failureProbPct > 65) riskLevel = 'CRITICAL';
    else if (failureProbPct > 40) riskLevel = 'HIGH';
    else if (failureProbPct > 20) riskLevel = 'MODERATE';

    return {
      name,
      runTimeHours: baseHours,
      loadPct,
      tempC,
      failureProbPct,
      riskLevel,
      remainingLifeDays: Math.max(15, Math.round(365 * (1 - failureProbPct / 100))),
      recommendation:
        failureProbPct > 65
          ? 'คำแนะนำเร่งด่วน: ตรวจสอบความร้อนขั้วต่อบัสบาร์ด้วยกล้องอินฟราเรด (Thermal Imaging) และวางแผนเปลี่ยนถ่ายชิ้นส่วนโดยเร็ว'
          : failureProbPct > 40
          ? 'คำแนะนำ: ตรวจเช็กพัดลมระบายความร้อนและค่าความต้านทานฉนวนประจำรอบ'
          : 'สถานะปกติ: อุปกรณ์ทำงานอยู่ในเกณฑ์ความน่าเชื่อถือสูงตามมาตรฐาน IEEE',
    };
  };

  const currentPred = getPredictiveMetrics(selectedComponentId);
  const radius = 70;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (currentPred.failureProbPct / 100) * circumference;

  // Filtered jobs
  const filteredJobs = jobs.filter((j) => {
    if (statusFilter !== 'ALL' && j.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && j.priority !== priorityFilter) return false;
    return true;
  });

  // Action: Open New Job
  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let eqName = newEquipmentId.toUpperCase();
    if (state.mdbs[newEquipmentId]) eqName = state.mdbs[newEquipmentId].name;
    else if (state.upsUnits[newEquipmentId]) eqName = state.upsUnits[newEquipmentId].name;
    else if (state.sources[newEquipmentId]) eqName = state.sources[newEquipmentId].name;

    const updated = openMaintenanceJob(jobs, {
      title: newTitle,
      equipmentId: newEquipmentId,
      equipmentName: eqName,
      jobType: newJobType,
      priority: newPriority,
      description: newDescription || 'งานบำรุงรักษาและแก้ไขตามมาตรฐาน SLA',
      assignedTo: newAssignee,
    });

    setJobs(updated);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDescription('');

    // Sync to backend
    fetch('/api/maintenance/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobs: updated }),
    }).catch(() => {});
  };

  // Action: Acknowledge Job
  const handleAcknowledge = (jobId: string) => {
    const engineerName = prompt('กรุณากรอกชื่อวิศวกรผู้รับงาน (Acknowledge Engineer):', 'สมชาย ชัยชนะ (Lead EE)') || 'Lead Engineer';
    const updated = acknowledgeMaintenanceJob(jobs, jobId, engineerName);
    setJobs(updated);

    fetch(`/api/maintenance/jobs/${jobId}/acknowledge`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acknowledgedBy: engineerName }),
    }).catch(() => {});
  };

  // Action: Start Resolve Job
  const handleOpenResolveModal = (job: MaintenanceJob) => {
    setActiveResolvingJob(job);
    setResolveNotes(`ตรวจเช็กและแก้ไขอุปกรณ์ ${job.equipmentName} เรียบร้อย ทดสอบระบบผ่านเกณฑ์ความปลอดภัย`);
    setIsResolveModalOpen(true);
  };

  // Action: Complete Resolve Job
  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResolvingJob) return;

    const updated = resolveMaintenanceJob(jobs, activeResolvingJob.id, {
      resolvedBy: resolveEngineer,
      resolutionNotes: resolveNotes,
      partsReplaced,
      actualDowntimeMinutes,
    });

    setJobs(updated);
    setIsResolveModalOpen(false);
    setActiveResolvingJob(null);

    fetch(`/api/maintenance/jobs/${activeResolvingJob.id}/resolve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resolvedBy: resolveEngineer,
        resolutionNotes: resolveNotes,
        partsReplaced,
        actualDowntimeMinutes,
      }),
    }).catch(() => {});
  };

  // Google Sheets Formula
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000';
  const liveSyncCsvUrl = `${originUrl}/api/maintenance/live-sync.csv`;
  const googleSheetFormula = `=IMPORTDATA("${liveSyncCsvUrl}")`;

  const handleCopyFormula = () => {
    navigator.clipboard.writeText(googleSheetFormula);
    setCopiedFormula(true);
    setTimeout(() => setCopiedFormula(false), 2500);
  };

  const handleCopyClipboardTsv = () => {
    const tsv = generateGoogleSheetsClipboardTsv(jobs);
    navigator.clipboard.writeText(tsv);
    setCopiedClipboard(true);
    setTimeout(() => setCopiedClipboard(false), 2500);
  };

  // Export to Excel / Google Sheet .xlsx
  const handleExportXlsx = () => {
    const wb = XLSX.utils.book_new();

    // 1. Maintenance Work Orders
    const jobsData = jobs.map((j) => ({
      'Work Order ID': j.id,
      'Equipment ID': j.equipmentId,
      'Equipment Name': j.equipmentName,
      'Job Title': j.title,
      'Job Type': j.jobType,
      'Priority': j.priority,
      'Status': j.status,
      'Assigned Engineer': j.assignedTo,
      'Created At': j.createdAt,
      'SLA Response Target (Min)': j.responseSlaMinutes,
      'Acknowledged At': j.acknowledgedAt || 'N/A',
      'Acknowledged By': j.acknowledgedBy || 'N/A',
      'Response SLA': j.responseSlaStatus,
      'SLA Resolution Target (Hrs)': j.resolutionSlaHours,
      'Resolved At': j.resolvedAt || 'N/A',
      'Resolved By': j.resolvedBy || 'N/A',
      'Resolution SLA': j.resolutionSlaStatus,
      'MTTR (Minutes)': j.mttrMinutes,
      'Downtime (Minutes)': j.actualDowntimeMinutes,
      'Parts Replaced': j.partsReplaced || 'None',
      'Resolution Notes': j.resolutionNotes || 'None',
    }));
    const wsJobs = XLSX.utils.json_to_sheet(jobsData);
    XLSX.utils.book_append_sheet(wb, wsJobs, 'Maintenance_Jobs_SLA');

    // 2. Predictive Failure Telemetry
    const predictiveComponents = ['mdb-1a', 'mdb-1b', 'ups-3a1', 'ups-3b2', 'tr-1', 'gen-1', 'batt-3a1'];
    const predData = predictiveComponents.map((id) => {
      const p = getPredictiveMetrics(id);
      return {
        'Equipment ID': id,
        'Equipment Name': p.name,
        'Runtime Hours': p.runTimeHours,
        'Load Factor (%)': p.loadPct,
        'Temperature (°C)': p.tempC,
        'Failure Probability (%)': p.failureProbPct,
        'Risk Level': p.riskLevel,
        'Est. Remaining Life (Days)': p.remainingLifeDays,
        'AI Recommendation': p.recommendation,
      };
    });
    const wsPred = XLSX.utils.json_to_sheet(predData);
    XLSX.utils.book_append_sheet(wb, wsPred, 'Predictive_Health_Analysis');

    // Download file
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `SILA1_Maintenance_SLA_Schedule_${dateStr}.xlsx`);
  };

  // Download raw CSV
  const handleDownloadCsv = () => {
    const csvContent = generateMaintenanceJobsCsv(jobs);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SILA1_Maintenance_Jobs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4 text-xs select-none p-1 sm:p-2 pb-16 overflow-y-auto">
      {/* ---------------- SECTION 1: GOOGLE SHEETS REAL-TIME INTEGRATION BAR ---------------- */}
      <div className="bg-[#1f1f1f] border border-[#444] rounded-lg p-3 sm:p-4 shadow flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white text-sm sm:text-base font-bold">
                  ระบบเชื่อมต่อตาราง Maintenance กับ Google Sheets แบบ Real Time
                </h3>
                <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[9.5px] font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE SYNC ACTIVE
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-gray-400 font-mono mt-0.5">
                Real-Time Webhook • Live IMPORTDATA Formula • One-Click Excel / Google Sheets Export
              </p>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportXlsx}
              className="px-2.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10.5px] cursor-pointer transition shadow flex items-center gap-1.5"
              title="Download as Excel .xlsx ready for Google Drive import"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Google Sheet (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-2.5 py-1.5 rounded bg-[#2a2a2a] hover:bg-[#383838] text-gray-200 border border-[#555] font-bold text-[10.5px] cursor-pointer transition shadow flex items-center gap-1.5"
              title="Download raw CSV with UTF-8 BOM"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download CSV</span>
            </button>

            <button
              type="button"
              onClick={handleCopyClipboardTsv}
              className="px-2.5 py-1.5 rounded bg-[#2a2a2a] hover:bg-[#383838] text-gray-200 border border-[#555] font-bold text-[10.5px] cursor-pointer transition shadow flex items-center gap-1.5"
              title="Copy formatted table to paste directly into Google Sheets (Ctrl+V)"
            >
              {copiedClipboard ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">คัดลอกตารางแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>ก๊อปปี้ไปวางใน Google Sheet</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Google Sheet Formula Box */}
        <div className="bg-[#141414] border border-[#333] rounded p-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
          <div className="flex-1 w-full overflow-hidden">
            <div className="text-[10px] text-gray-400 font-sans mb-1 flex items-center gap-1.5">
              <span className="font-bold text-cyan-300">สูตรเชื่อมโยง Real-time สำหรับ Google Sheets:</span>
              <span className="text-gray-500">(นำสูตรนี้ไปวางใน Google Sheet ช่อง A1 เพื่อดึงข้อมูลสดตลอดเวลา)</span>
            </div>
            <div className="bg-[#0c0c0c] px-3 py-1.5 rounded border border-[#2a2a2a] text-emerald-400 text-[11px] truncate select-all">
              {googleSheetFormula}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyFormula}
            className={`px-3 py-2 rounded font-bold text-[11px] cursor-pointer transition shadow flex items-center gap-1.5 whitespace-nowrap w-full sm:w-auto justify-center ${
              copiedFormula
                ? 'bg-emerald-600 text-white'
                : 'bg-cyan-700 hover:bg-cyan-600 text-white'
            }`}
          >
            {copiedFormula ? (
              <>
                <Check className="w-4 h-4" />
                <span>คัดลอกสูตรแล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>คัดลอกสูตร =IMPORTDATA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ---------------- SECTION 2: WORK ORDER & SLA DISPATCH MANAGEMENT ---------------- */}
      <div className="bg-[#1f1f1f] border border-[#444] rounded-lg p-3 sm:p-4 shadow flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[#333] pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-white text-sm sm:text-base font-bold">
                ตารางงานซ่อมบำรุง & การติดตาม SLA (Work Orders, Acknowledge & Resolve Lifecycle)
              </h3>
              <p className="text-[10px] text-gray-400 font-mono">
                P1 (15m Resp / 2h Fix) • P2 (30m / 4h) • P3 (2h / 8h) • P4 (4h / 24h)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Open Job Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3 py-1.5 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs cursor-pointer transition shadow flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>เปิด Job ซ่อมบำรุงใหม่</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs bg-[#242424] p-2 rounded border border-[#383838]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-gray-400 font-semibold flex items-center gap-1">
              <ListFilter className="w-3.5 h-3.5 text-cyan-400" /> สถานะ:
            </span>
            {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded font-mono text-[10.5px] cursor-pointer transition ${
                  statusFilter === st
                    ? 'bg-cyan-700 text-white font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'ทั้งหมด' : st}
              </button>
            ))}

            <span className="text-[#555] mx-1">|</span>

            <span className="text-gray-400 font-semibold">Priority:</span>
            {(['ALL', 'P1_CRITICAL', 'P2_HIGH', 'P3_MEDIUM', 'P4_ROUTINE'] as const).map((pr) => (
              <button
                key={pr}
                type="button"
                onClick={() => setPriorityFilter(pr)}
                className={`px-2 py-0.5 rounded font-mono text-[10.5px] cursor-pointer transition ${
                  priorityFilter === pr
                    ? 'bg-amber-700 text-white font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {pr === 'ALL' ? 'ทุกระดับ' : pr.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="text-gray-400 font-mono text-[11px]">
            แสดงผล: <strong className="text-white">{filteredJobs.length}</strong> / {jobs.length} รายการ
          </div>
        </div>

        {/* Jobs Table */}
        <div className="overflow-x-auto rounded border border-[#333]">
          <table className="w-full text-left font-mono text-[10.5px] border-collapse">
            <thead className="bg-[#141414] text-gray-400 border-b border-[#333] select-none text-[10px]">
              <tr>
                <th className="p-2.5">Ticket #</th>
                <th className="p-2.5">อุปกรณ์ (Equipment)</th>
                <th className="p-2.5">หัวข้องาน (Job Title)</th>
                <th className="p-2.5">Priority & SLA</th>
                <th className="p-2.5">สถานะ (Status)</th>
                <th className="p-2.5">Response SLA</th>
                <th className="p-2.5">Resolution SLA</th>
                <th className="p-2.5">ผู้รับผิดชอบ (Assignee)</th>
                <th className="p-2.5 text-right">ดำเนินการ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-gray-500 font-sans">
                    ไม่พบรายการ Job ซ่อมบำรุงตามตัวกรองที่เลือก
                  </td>
                </tr>
              ) : (
                filteredJobs.map((j) => {
                  const target = SLA_TARGETS[j.priority];
                  return (
                    <tr key={j.id} className="hover:bg-[#252525] transition">
                      <td className="p-2.5 font-bold text-cyan-300">{j.id}</td>
                      <td className="p-2.5 text-white font-bold">{j.equipmentName}</td>
                      <td className="p-2.5 text-gray-200 font-sans max-w-[220px] truncate" title={j.title}>
                        {j.title}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                            j.priority === 'P1_CRITICAL'
                              ? 'bg-red-950 text-red-300 border-red-500'
                              : j.priority === 'P2_HIGH'
                              ? 'bg-amber-950 text-amber-300 border-amber-500'
                              : j.priority === 'P3_MEDIUM'
                              ? 'bg-yellow-950 text-yellow-300 border-yellow-500'
                              : 'bg-gray-800 text-gray-300 border-gray-600'
                          }`}
                        >
                          {j.priority.replace('_', ' ')}
                        </span>
                        <div className="text-[9px] text-gray-400 mt-0.5 font-sans">
                          Resp {target.responseMinutes}m / Fix {target.resolutionHours}h
                        </div>
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                            j.status === 'RESOLVED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : j.status === 'IN_PROGRESS'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                              : j.status === 'ACKNOWLEDGED'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              : 'bg-red-950 text-red-300 border border-red-500/40'
                          }`}
                        >
                          {j.status}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            j.responseSlaStatus === 'MET'
                              ? 'text-emerald-400 bg-emerald-950/40'
                              : j.responseSlaStatus === 'BREACHED'
                              ? 'text-red-400 bg-red-950/40'
                              : 'text-amber-400'
                          }`}
                        >
                          {j.responseSlaStatus === 'MET' ? '✓ MET' : j.responseSlaStatus === 'BREACHED' ? '✕ BREACHED' : '⏳ PENDING'}
                        </span>
                        {j.acknowledgedAt && (
                          <div className="text-[8.5px] text-gray-500 truncate max-w-[90px]">{j.acknowledgedAt}</div>
                        )}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            j.resolutionSlaStatus === 'MET'
                              ? 'text-emerald-400 bg-emerald-950/40'
                              : j.resolutionSlaStatus === 'BREACHED'
                              ? 'text-red-400 bg-red-950/40'
                              : 'text-amber-400'
                          }`}
                        >
                          {j.resolutionSlaStatus === 'MET' ? '✓ MET' : j.resolutionSlaStatus === 'BREACHED' ? '✕ BREACHED' : '⏳ PENDING'}
                        </span>
                        {j.mttrMinutes > 0 && (
                          <div className="text-[8.5px] text-gray-500">MTTR: {j.mttrMinutes}m</div>
                        )}
                      </td>
                      <td className="p-2.5 text-gray-300 font-sans truncate max-w-[130px]">
                        {j.assignedTo}
                      </td>
                      <td className="p-2.5 text-right whitespace-nowrap">
                        {j.status === 'OPEN' && (
                          <button
                            type="button"
                            onClick={() => handleAcknowledge(j.id)}
                            className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-black font-bold text-[10px] cursor-pointer transition shadow"
                          >
                            รับงาน (Acknowledge)
                          </button>
                        )}
                        {(j.status === 'IN_PROGRESS' || j.status === 'ACKNOWLEDGED') && (
                          <button
                            type="button"
                            onClick={() => handleOpenResolveModal(j)}
                            className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10px] cursor-pointer transition shadow"
                          >
                            ปิดงาน (Resolve)
                          </button>
                        )}
                        {j.status === 'RESOLVED' && (
                          <span className="text-gray-500 font-sans text-[10px] italic">
                            ปิดงานเรียบร้อย
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- SECTION 3: PREDICTIVE ANALYSIS & PREVENTIVE SCHEDULE ---------------- */}
      <div className="bg-[#1e1e1e] border border-[#444] rounded-lg p-3 sm:p-4 shadow flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-white text-base font-bold flex items-center gap-2">
            <Gauge className="w-5 h-5 text-cyan-400" />
            Predictive Failure Analysis (AI Prognostics & Health Monitoring)
          </h3>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-400">เลือกอุปกรณ์ประเมิน:</span>
            <select
              value={selectedComponentId}
              onChange={(e) => setSelectedComponentId(e.target.value)}
              className="bg-[#2a2a2a] text-cyan-300 rounded px-2 py-1 font-mono border border-[#555] focus:outline-none cursor-pointer"
            >
              <optgroup label="Main Distribution Boards">
                <option value="mdb-1a">MDB1A (Bus A)</option>
                <option value="mdb-1b">MDB1B (Bus B)</option>
                <option value="mdb-2a">MDB2A (HVAC A)</option>
                <option value="mdb-2b">MDB2B (HVAC B)</option>
                <option value="mdb-3a">MDB3A (Essential A)</option>
                <option value="mdb-3b">MDB3B (Essential B)</option>
              </optgroup>
              <optgroup label="UPS Systems (Modular 500kVA)">
                <option value="ups-3a1">UPS-3A1 (Bus A)</option>
                <option value="ups-3a2">UPS-3A2 (Bus A)</option>
                <option value="ups-3a3">UPS-3A3 (Bus A)</option>
                <option value="ups-3b1">UPS-3B1 (Bus B)</option>
                <option value="ups-3b2">UPS-3B2 (Bus B)</option>
                <option value="ups-3b3">UPS-3B3 (Bus B)</option>
              </optgroup>
              <optgroup label="VRLA Battery Strings">
                <option value="batt-3a1">BATT-3A1 (Bus A String 1)</option>
                <option value="batt-3a2">BATT-3A2 (Bus A String 2)</option>
                <option value="batt-3b1">BATT-3B1 (Bus B String 1)</option>
                <option value="batt-3b2">BATT-3B2 (Bus B String 2)</option>
              </optgroup>
              <optgroup label="Transformers & Generators">
                <option value="tr-1">Transformer TR-1</option>
                <option value="tr-2">Transformer TR-2</option>
                <option value="gen-1">Emergency Generator GEN-1</option>
              </optgroup>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-[#252525] border border-[#3a3a3a] rounded-lg p-5">
          {/* Gauge Chart Visualizer */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-44 h-24 flex items-center justify-center overflow-hidden">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="#333"
                  strokeWidth="14"
                  strokeDasharray={circumference}
                  strokeDashoffset="0"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={
                    currentPred.failureProbPct > 65
                      ? '#ef4444'
                      : currentPred.failureProbPct > 40
                      ? '#f59e0b'
                      : currentPred.failureProbPct > 20
                      ? '#eab308'
                      : '#10b981'
                  }
                  strokeWidth="14"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
                <span className="text-2xl font-mono font-bold text-white">
                  {currentPred.failureProbPct}%
                </span>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  Failure Risk
                </span>
              </div>
            </div>
            <div className="mt-2">
              <span
                className={`px-3 py-1 rounded text-[11px] font-extrabold border ${
                  currentPred.riskLevel === 'CRITICAL'
                    ? 'bg-red-950 text-red-400 border-red-500 animate-pulse'
                    : currentPred.riskLevel === 'HIGH'
                    ? 'bg-amber-950 text-amber-400 border-amber-500'
                    : currentPred.riskLevel === 'MODERATE'
                    ? 'bg-yellow-950 text-yellow-300 border-yellow-500'
                    : 'bg-emerald-950 text-emerald-400 border-emerald-500'
                }`}
              >
                RISK LEVEL: {currentPred.riskLevel}
              </span>
            </div>
          </div>

          {/* Component Prognostic Telemetry Details */}
          <div className="flex flex-col gap-2.5">
            <div className="text-sm font-bold text-cyan-300 border-b border-[#444] pb-1.5 flex items-center justify-between">
              <span>{currentPred.name}</span>
              <span className="text-[11px] font-mono font-normal text-gray-400">ID: {selectedComponentId}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#1a1a1a] p-2 rounded border border-[#333]">
                <div className="text-[10px] text-gray-400">Cumulative Runtime</div>
                <div className="font-mono font-bold text-white text-sm">{currentPred.runTimeHours.toLocaleString()} Hrs</div>
              </div>
              <div className="bg-[#1a1a1a] p-2 rounded border border-[#333]">
                <div className="text-[10px] text-gray-400">Current Load Factor</div>
                <div className="font-mono font-bold text-cyan-300 text-sm">{currentPred.loadPct}%</div>
              </div>
              <div className="bg-[#1a1a1a] p-2 rounded border border-[#333]">
                <div className="text-[10px] text-gray-400">Thermal Probe Temp</div>
                <div className="font-mono font-bold text-amber-400 text-sm">{currentPred.tempC}°C</div>
              </div>
              <div className="bg-[#1a1a1a] p-2 rounded border border-[#333]">
                <div className="text-[10px] text-gray-400">Est. Remaining Life</div>
                <div className="font-mono font-bold text-emerald-400 text-sm">{currentPred.remainingLifeDays} Days</div>
              </div>
            </div>
          </div>

          {/* AI Recommendation Box */}
          <div className="bg-[#1a1a1a] border border-[#444] rounded-lg p-3.5 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI Prognostic Recommendation</span>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed">
              {currentPred.recommendation}
            </p>
            <div className="text-[10px] text-gray-500 font-mono">
              Model: Weibull Proportional Hazards Prognostic Engine v4.2
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- MODAL: OPEN NEW WORK ORDER ---------------- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 select-none">
          <div className="bg-[#222] border border-[#444] rounded-lg w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-[#1a1a1a] p-3 border-b border-[#333] flex items-center justify-between">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-cyan-400" />
                <span>เปิด Job ซ่อมบำรุงใหม่ (New Work Order)</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-4 flex flex-col gap-3 text-xs">
              <div>
                <label className="text-gray-300 font-semibold mb-1 block">หัวข้องาน (Job Title):</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ตรวจเช็กพัดลมระบายความร้อน UPS-3A1"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#141414] border border-[#444] rounded p-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">อุปกรณ์ (Equipment):</label>
                  <select
                    value={newEquipmentId}
                    onChange={(e) => setNewEquipmentId(e.target.value)}
                    className="w-full bg-[#141414] border border-[#444] rounded p-2 text-cyan-300 font-mono focus:outline-none cursor-pointer"
                  >
                    <option value="mdb-1a">MDB1A (Main Bus A)</option>
                    <option value="mdb-1b">MDB1B (Main Bus B)</option>
                    <option value="ups-3a1">UPS-3A1 (Bus A)</option>
                    <option value="ups-3b2">UPS-3B2 (Bus B)</option>
                    <option value="tr-1">Transformer TR-1</option>
                    <option value="tr-2">Transformer TR-2</option>
                    <option value="gen-1">Emergency Generator GEN-1</option>
                    <option value="ats-1a">ATS-1A</option>
                    <option value="batt-3a1">BATT-3A1</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">ประเภทงาน (Job Type):</label>
                  <select
                    value={newJobType}
                    onChange={(e) => setNewJobType(e.target.value as JobType)}
                    className="w-full bg-[#141414] border border-[#444] rounded p-2 text-white font-mono focus:outline-none cursor-pointer"
                  >
                    <option value="EMERGENCY_SOP">EMERGENCY SOP (ฉุกเฉิน)</option>
                    <option value="CORRECTIVE_CM">CORRECTIVE CM (แก้ไขชำรุด)</option>
                    <option value="PREVENTIVE_PM">PREVENTIVE PM (ตามรอบ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">ระดับความสำคัญ (Priority):</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as JobPriority)}
                    className="w-full bg-[#141414] border border-[#444] rounded p-2 text-amber-300 font-mono focus:outline-none cursor-pointer"
                  >
                    <option value="P1_CRITICAL">P1 Critical (Resp: 15m / Fix: 2h)</option>
                    <option value="P2_HIGH">P2 High (Resp: 30m / Fix: 4h)</option>
                    <option value="P3_MEDIUM">P3 Medium (Resp: 2h / Fix: 8h)</option>
                    <option value="P4_ROUTINE">P4 Routine (Resp: 4h / Fix: 24h)</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">มอบหมายวิศวกร (Assignee):</label>
                  <input
                    type="text"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full bg-[#141414] border border-[#444] rounded p-2 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold mb-1 block">รายละเอียดความผิดปกติ / แผนงาน:</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="กรอกรายละเอียดความผิดปกติและขั้นตอนงานซ่อมบำรุง..."
                  className="w-full bg-[#141414] border border-[#444] rounded p-2 text-white font-sans focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#333]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[#333] hover:bg-[#444] text-gray-300 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-bold cursor-pointer transition shadow"
                >
                  บันทึกและเปิด Job ทันที
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL: RESOLVE WORK ORDER ---------------- */}
      {isResolveModalOpen && activeResolvingJob && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 select-none">
          <div className="bg-[#222] border border-[#444] rounded-lg w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-[#1a1a1a] p-3 border-b border-[#333] flex items-center justify-between">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>บันทึกปิดงานซ่อมบำรุง: {activeResolvingJob.id}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsResolveModalOpen(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="p-4 flex flex-col gap-3 text-xs">
              <div className="bg-[#161616] p-2.5 rounded border border-[#333]">
                <div className="font-bold text-cyan-300">{activeResolvingJob.equipmentName}</div>
                <div className="text-gray-300 mt-0.5">{activeResolvingJob.title}</div>
                <div className="text-gray-500 font-mono text-[10px] mt-1">
                  Target SLA: {activeResolvingJob.resolutionSlaHours} ชม.
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-semibold mb-1 block">วิศวกรผู้ปิดงาน (Resolved By):</label>
                <input
                  type="text"
                  required
                  value={resolveEngineer}
                  onChange={(e) => setResolveEngineer(e.target.value)}
                  className="w-full bg-[#141414] border border-[#444] rounded p-2 text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-gray-300 font-semibold mb-1 block">ผลการดำเนินการ & รายละเอียดการแก้ไข:</label>
                <textarea
                  rows={3}
                  required
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  className="w-full bg-[#141414] border border-[#444] rounded p-2 text-white font-sans focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">ชิ้นส่วนที่เปลี่ยน (Parts Replaced):</label>
                  <input
                    type="text"
                    value={partsReplaced}
                    onChange={(e) => setPartsReplaced(e.target.value)}
                    className="w-full bg-[#141414] border border-[#444] rounded p-2 text-white font-sans focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold mb-1 block">ระยะเวลาไฟดับจริง (Downtime นาที):</label>
                  <input
                    type="number"
                    min={0}
                    value={actualDowntimeMinutes}
                    onChange={(e) => setActualDowntimeMinutes(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#141414] border border-[#444] rounded p-2 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#333]">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[#333] hover:bg-[#444] text-gray-300 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold cursor-pointer transition shadow"
                >
                  ยืนยันปิดงานซ่อม (Resolve)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
