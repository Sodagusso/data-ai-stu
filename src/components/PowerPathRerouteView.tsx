import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  RotateCcw,
  Zap,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ArrowRight,
  Layers,
  Cpu,
  Flame,
  CheckCircle2,
  Sparkles,
  Server,
  Activity,
  Play,
  Pause,
  Sliders,
  Wrench,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  TIER_STANDARDS,
  REMEDIATION_SOLUTIONS,
  type TierDowntimeStandard,
  type RemediationSolutionItem,
  type SimulatorState,
} from '../simulator/logic';
import type { ActiveTab } from './SubBar';

interface PowerPathRerouteViewProps {
  state: SimulatorState;
  onNavigateToTab?: (tab: ActiveTab) => void;
  onNavigateToEquipment?: (tab: ActiveTab, elementId: string) => void;
  onOpenWorkOrder?: (params: {
    title: string;
    equipmentId: string;
    equipmentName: string;
    priority: 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_ROUTINE';
    description: string;
  }) => void;
}

export type SwitchingScenario =
  | 'NORMAL_DUAL'
  | 'GRID_OUTAGE_ATS'
  | 'MDB1A_BUS_FAULT'
  | 'UPS3A_INVERTER_TRIP'
  | 'MAINTENANCE_BYPASS'
  | 'EXTENDED_BLACKOUT_GEN_FAIL';

export const PowerPathRerouteView: React.FC<PowerPathRerouteViewProps> = ({
  state,
  onNavigateToTab,
  onNavigateToEquipment,
  onOpenWorkOrder,
}) => {
  // Scenario Selection
  const [scenario, setScenario] = useState<SwitchingScenario>('NORMAL_DUAL');

  // Interactive Switch States
  const [tieBreakerClosed, setTieBreakerClosed] = useState<boolean>(false);
  const [staticBypassEngaged, setStaticBypassEngaged] = useState<boolean>(false);
  const [maintenanceBypassEngaged, setMaintenanceBypassEngaged] = useState<boolean>(false);
  const [loadSheddingActive, setLoadSheddingActive] = useState<boolean>(false);
  const [mobileGensetConnected, setMobileGensetConnected] = useState<boolean>(false);

  // Transfer Timing & Outage Duration
  const [outageSeconds, setOutageSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [appliedSolutionId, setAppliedSolutionId] = useState<string | null>(null);
  const [incidentAuditLogs, setIncidentAuditLogs] = useState<string[]>([
    'ระบบเริ่มทำงาน: สถาปัตยกรรม Tier IV 2(N+1) สายส่ง A และ B จ่ายไฟสมบูรณ์ (Path A + Path B Active)',
  ]);

  // Handle Scenario Switches
  const handleSelectScenario = (sc: SwitchingScenario) => {
    setScenario(sc);
    setAppliedSolutionId(null);
    setOutageSeconds(0);

    const now = new Date().toLocaleTimeString('th-TH');

    if (sc === 'NORMAL_DUAL') {
      setIsTimerRunning(false);
      setTieBreakerClosed(false);
      setStaticBypassEngaged(false);
      setMaintenanceBypassEngaged(false);
      setLoadSheddingActive(false);
      setMobileGensetConnected(false);
      setIncidentAuditLogs((prev) => [
        `[${now}] คืนสถานะสู่สายส่งปกติ (Normal Dual Path Active/Active): PEA 22kV จ่ายไฟทั้งบัส A และบัส B`,
        ...prev.slice(0, 15),
      ]);
    } else if (sc === 'GRID_OUTAGE_ATS') {
      setIsTimerRunning(true);
      setTieBreakerClosed(false);
      setStaticBypassEngaged(false);
      setMaintenanceBypassEngaged(false);
      setLoadSheddingActive(false);
      setMobileGensetConnected(false);
      setIncidentAuditLogs((prev) => [
        `[${now}] [OUTAGE] สายส่งการไฟฟ้า PEA 22kV ขัดข้อง! ระบบตรวจจับ Undervoltage ➔ สั่งสตาร์ท GEN-1`,
        `[${now}] [TRANSFER] สวิตช์ ATS-1 เริ่มนับถอยหลังรอบการสับถ่ายโอน (8.5s Transfer Window)`,
        `[${now}] [SEAMLESS] ตู้ UPS-3A และ UPS-3B สลับไปใช้ไฟจากแบตเตอรี่ฉุกเฉินทันที (0ms Interruption)`,
        ...prev.slice(0, 15),
      ]);
    } else if (sc === 'MDB1A_BUS_FAULT') {
      setIsTimerRunning(true);
      setTieBreakerClosed(false);
      setStaticBypassEngaged(false);
      setMaintenanceBypassEngaged(false);
      setLoadSheddingActive(false);
      setMobileGensetConnected(false);
      setIncidentAuditLogs((prev) => [
        `[${now}] [FAULT] เกิด Arc Fault บนบัสบาร์ MDB-1A! เบรกเกอร์ ACB-1 ทริปฉับพลัน`,
        `[${now}] [ALERT] สายส่ง Path A ดับ! ตู้ UPS-3A สลับไปดึงไฟจากแบตเตอรี่ BATT-3A`,
        `[${now}] [ACTION REQUIRED] ต้องสับ Tie-Breaker TIE-MDB หรือรอการแก้ไขเพื่อกู้คืนบัส A`,
        ...prev.slice(0, 15),
      ]);
    } else if (sc === 'UPS3A_INVERTER_TRIP') {
      setIsTimerRunning(true);
      setTieBreakerClosed(false);
      setStaticBypassEngaged(true);
      setMaintenanceBypassEngaged(false);
      setLoadSheddingActive(false);
      setMobileGensetConnected(false);
      setIncidentAuditLogs((prev) => [
        `[${now}] [TRIP] อินเวอร์เตอร์ UPS-3A1 ล็อคความผิดพลาด (SCR Inverter Fault)`,
        `[${now}] [BYPASS] Static Bypass Switch สั่งสับตรงใน < 2ms เพื่อป้องกันโหลดเซิร์ฟเวอร์ดับ`,
        `[${now}] [WARNING] สายส่ง Path A ขณะนี้ใช้ไฟดิบจากบายพาส (Raw Grid/Gen Bypass - Non-Conditioned)`,
        ...prev.slice(0, 15),
      ]);
    } else if (sc === 'MAINTENANCE_BYPASS') {
      setIsTimerRunning(false);
      setTieBreakerClosed(false);
      setStaticBypassEngaged(false);
      setMaintenanceBypassEngaged(true);
      setLoadSheddingActive(false);
      setMobileGensetConnected(false);
      setIncidentAuditLogs((prev) => [
        `[${now}] [MAINTENANCE] สับสวิตช์ Maintenance Bypass เพื่อเข้าสู่โหมดซ่อมบำรุง UPS-3A แบบฮ็อตสว็อป (Hot-Swap Isolation)`,
        `[${now}] [TIER III/IV] เป็นไปตามเกณฑ์ Concurrent Maintainability โหลดเซิร์ฟเวอร์ทำงานต่อเนื่อง 100%`,
        ...prev.slice(0, 15),
      ]);
    } else if (sc === 'EXTENDED_BLACKOUT_GEN_FAIL') {
      setIsTimerRunning(true);
      setTieBreakerClosed(false);
      setStaticBypassEngaged(false);
      setMaintenanceBypassEngaged(false);
      setLoadSheddingActive(false);
      setMobileGensetConnected(false);
      setIncidentAuditLogs((prev) => [
        `[${now}] [CRITICAL DISASTER] การไฟฟ้าดับ และเครื่องกำเนิดไฟฟ้า GEN-1 สตาร์ทไม่ติด (Overcrank Failure)!`,
        `[${now}] [BATTERY ONLY] ศูนย์ข้อมูลใช้ไฟจากแบตเตอรี่ 100% กำลังนับถอยหลังสู่การดับสนิท (Battery Depletion)`,
        `[${now}] [SLA ALERT] กำลังเข้าสู่ภาวะ Downtime เกินเกณฑ์ Tier SLA ทุกระดับ!`,
        ...prev.slice(0, 15),
      ]);
    }
  };

  // Timer Tick
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setOutageSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Derived Electrical Path Statuses
  const pathA = useMemo(() => {
    if (scenario === 'NORMAL_DUAL') {
      return { status: 'NORMAL_GRID', label: 'สายส่ง A: ไฟจากการไฟฟ้า (PEA 22kV / TR-1)', color: '#00ffcc', voltage: 382 };
    }
    if (scenario === 'GRID_OUTAGE_ATS') {
      if (outageSeconds < 8.5) {
        return { status: 'BATTERY', label: 'สายส่ง A: สำรองไฟจากแบตเตอรี่ BATT-3A (ระหว่างรอ ATS 8.5s)', color: '#c084fc', voltage: 380 };
      }
      return { status: 'GENERATOR', label: 'สายส่ง A: ไฟจากเครื่องกำเนิดฉุกเฉิน GEN-1 (ผ่าน ATS-1A)', color: '#f59e0b', voltage: 381 };
    }
    if (scenario === 'MDB1A_BUS_FAULT') {
      if (tieBreakerClosed) {
        return { status: 'TIED_TO_B', label: 'สายส่ง A: รับไฟข้ามบัสผ่าน TIE-MDB จาก MDB-1B', color: '#38bdf8', voltage: 380 };
      }
      return { status: 'BATTERY_DRAINING', label: 'สายส่ง A: แบตเตอรี่ BATT-3A กำลังจ่ายไฟ (MDB-1A ดับ)', color: '#ec4899', voltage: 376 };
    }
    if (scenario === 'UPS3A_INVERTER_TRIP') {
      if (staticBypassEngaged) {
        return { status: 'STATIC_BYPASS', label: 'สายส่ง A: โหมด Static Bypass (บายพาสข้ามอินเวอร์เตอร์)', color: '#fb923c', voltage: 382 };
      }
      return { status: 'FAULT', label: 'สายส่ง A: ขัดข้อง (Inverter Tripped)', color: '#ef4444', voltage: 0 };
    }
    if (scenario === 'MAINTENANCE_BYPASS') {
      return { status: 'MAINT_BYPASS', label: 'สายส่ง A: โหมด Maintenance Bypass (ซ่อมบำรุงตู้ UPS-3A)', color: '#fbbf24', voltage: 382 };
    }
    // EXTENDED_BLACKOUT_GEN_FAIL
    if (mobileGensetConnected) {
      return { status: 'MOBILE_GEN', label: 'สายส่ง A: รับไฟจาก Mobile Genset ภายนอก', color: '#10b981', voltage: 380 };
    }
    if (outageSeconds > 180) {
      return { status: 'BLACKOUT', label: 'สายส่ง A: แบตเตอรี่หมดพลังงาน (System Down)', color: '#ef4444', voltage: 0 };
    }
    return { status: 'BATTERY_DRAINING', label: `สายส่ง A: แบตเตอรี่สำรองเหลือ ~${Math.max(0, 100 - outageSeconds * 0.5).toFixed(0)}%`, color: '#ec4899', voltage: 372 };
  }, [scenario, outageSeconds, tieBreakerClosed, staticBypassEngaged, mobileGensetConnected]);

  const pathB = useMemo(() => {
    if (scenario === 'NORMAL_DUAL') {
      return { status: 'NORMAL_GRID', label: 'สายส่ง B: ไฟจากการไฟฟ้า (PEA 22kV / TR-2)', color: '#00ffcc', voltage: 381 };
    }
    if (scenario === 'GRID_OUTAGE_ATS') {
      if (outageSeconds < 8.5) {
        return { status: 'BATTERY', label: 'สายส่ง B: สำรองไฟจากแบตเตอรี่ BATT-3B (ระหว่างรอ ATS 8.5s)', color: '#c084fc', voltage: 380 };
      }
      return { status: 'GENERATOR', label: 'สายส่ง B: ไฟจากเครื่องกำเนิดฉุกเฉิน GEN-1 (ผ่าน ATS-1B)', color: '#f59e0b', voltage: 381 };
    }
    if (scenario === 'MDB1A_BUS_FAULT') {
      return { status: 'NORMAL_GRID', label: 'สายส่ง B: ไฟจากการไฟฟ้า TR-2 (MDB-1B ปกติ 100%)', color: '#00ffcc', voltage: 381 };
    }
    if (scenario === 'UPS3A_INVERTER_TRIP' || scenario === 'MAINTENANCE_BYPASS') {
      return { status: 'NORMAL_GRID', label: 'สายส่ง B: ไฟจากการไฟฟ้าผ่าน UPS-3B (Double Conversion ปรกติ)', color: '#00ffcc', voltage: 381 };
    }
    // EXTENDED_BLACKOUT_GEN_FAIL
    if (mobileGensetConnected) {
      return { status: 'MOBILE_GEN', label: 'สายส่ง B: รับไฟจาก Mobile Genset ภายนอก', color: '#10b981', voltage: 380 };
    }
    if (outageSeconds > 180) {
      return { status: 'BLACKOUT', label: 'สายส่ง B: แบตเตอรี่หมดพลังงาน (System Down)', color: '#ef4444', voltage: 0 };
    }
    return { status: 'BATTERY_DRAINING', label: `สายส่ง B: แบตเตอรี่สำรองเหลือ ~${Math.max(0, 100 - outageSeconds * 0.5).toFixed(0)}%`, color: '#ec4899', voltage: 372 };
  }, [scenario, outageSeconds, mobileGensetConnected]);

  // Is IT Rack Power Interrupted?
  const itRackPowerStatus = useMemo(() => {
    const isPathAAlive = pathA.voltage > 50;
    const isPathBAlive = pathB.voltage > 50;

    if (isPathAAlive && isPathBAlive) {
      return {
        state: 'DUAL_FEED_PERFECT',
        label: 'จ่ายไฟคู่สมบูรณ์ 2(N+1) (Tier IV Compliant)',
        sublabel: 'Dual-cord servers receive 100% redundant power from both A & B buses',
        badge: 'bg-emerald-950 text-emerald-300 border-emerald-500',
        color: '#00ffcc',
      };
    }
    if (isPathAAlive || isPathBAlive) {
      return {
        state: 'SINGLE_FEED_ACTIVE',
        label: 'จ่ายไฟเส้นทางเดี่ยว (Concurrently Maintainable - Tier III)',
        sublabel: isPathAAlive ? 'เซิร์ฟเวอร์ยังทำงานปกติผ่าน Path A (Path B ไม่จ่ายไฟ)' : 'เซิร์ฟเวอร์ยังทำงานปกติผ่าน Path B (Path A ไม่จ่ายไฟ)',
        badge: 'bg-amber-950 text-amber-300 border-amber-500',
        color: '#f59e0b',
      };
    }
    return {
      state: 'COMPLETE_BLACKOUT',
      label: 'ไฟดับสมบูรณ์ (Critical Load Interrupted - SLA BREACHED)',
      sublabel: 'เซิร์ฟเวอร์และอุปกรณ์ไอทีดับทั้งหมด เกิดความเสียหายตามเกณฑ์ SLA',
      badge: 'bg-red-950 text-red-300 border-red-500 animate-pulse',
      color: '#ef4444',
    };
  }, [pathA, pathB]);

  // Execute Remediation Solution
  const handleExecuteSolution = (sol: RemediationSolutionItem) => {
    const now = new Date().toLocaleTimeString('th-TH');
    setAppliedSolutionId(sol.id);

    if (sol.id === 'sol-tie-breaker') {
      setTieBreakerClosed(true);
      setIncidentAuditLogs((prev) => [
        `[${now}] [SOP EXECUTED] ${sol.nameTh}: สับเบรกเกอร์ TIE-MDB เชื่อมบัส A และบัส B สำเร็จ! แรงดันบัส A ฟื้นคืนสู่ 380V ใน 0.2s`,
        ...prev.slice(0, 15),
      ]);
      if (onOpenWorkOrder) {
        onOpenWorkOrder({
          title: 'ปิดงานฉุกเฉิน: สับ Tie-Breaker TIE-MDB แก้ไข MDB-1A Fault',
          equipmentId: 'mdb-1a',
          equipmentName: 'MDB1A (Main Busbar A)',
          priority: 'P1_CRITICAL',
          description: 'ดำเนินการแก้ไขตาม SOP: สับ Tie-Breaker TIE-MDB จ่ายไฟข้ามจากบัส B ป้องกัน Downtime เกิน SLA',
        });
      }
    } else if (sol.id === 'sol-static-bypass') {
      setStaticBypassEngaged(true);
      setIncidentAuditLogs((prev) => [
        `[${now}] [SOP EXECUTED] ${sol.nameTh}: สับ Static Bypass ข้าม Inverter สำเร็จ ป้องกันไฟดับที่ตู้ UMDB-A`,
        ...prev.slice(0, 15),
      ]);
      if (onOpenWorkOrder) {
        onOpenWorkOrder({
          title: 'เปิด Job ซ่อมบำรุงด่วน: เปลี่ยนโมดูล Inverter UPS-3A1',
          equipmentId: 'ups-3a1',
          equipmentName: 'UPS-3A1 (Data Hall 3 Bus A)',
          priority: 'P2_HIGH',
          description: 'ดำเนินการสับ Static Bypass แล้ว จำเป็นต้องเปลี่ยนการ์ด SCR Inverter Module ตาม SLA 4 ชั่วโมง',
        });
      }
    } else if (sol.id === 'sol-load-shedding') {
      setLoadSheddingActive(true);
      setIncidentAuditLogs((prev) => [
        `[${now}] [SOP EXECUTED] ${sol.nameTh}: สั่งปลดโหลดชิลเลอร์ชุดที่ 2 และระบบไฟเสริม (ลดโหลด 45%) ยืดเวลาแบตเตอรี่เป็น 65 นาที`,
        ...prev.slice(0, 15),
      ]);
    } else if (sol.id === 'sol-mobile-drpus') {
      setMobileGensetConnected(true);
      setIsTimerRunning(false);
      setIncidentAuditLogs((prev) => [
        `[${now}] [SOP EXECUTED] ${sol.nameTh}: เชื่อมต่อ Mobile Genset 800kVA และสับจ่ายไฟฉุกเฉินสำเร็จ! ช่วยเซิร์ฟเวอร์รอดพ้น Blackout`,
        ...prev.slice(0, 15),
      ]);
    } else if (sol.id === 'sol-grid-restore') {
      handleSelectScenario('NORMAL_DUAL');
      setIncidentAuditLogs((prev) => [
        `[${now}] [SOP EXECUTED] ${sol.nameTh}: รีเซ็ตระบบ คืนสู่สายส่ง PEA 22kV เต็มรูปแบบ สถาปัตยกรรม Tier IV กลับมาสมบูรณ์ 100%`,
        ...prev.slice(0, 15),
      ]);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-xs select-none p-1 sm:p-2 overflow-y-auto pb-16">
      {/* Top Banner & Title */}
      <div className="bg-[#1f1f1f] border border-[#444] rounded-lg p-3 sm:p-4 shadow flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
            <Zap className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red-700 text-white font-extrabold px-1.5 py-0.5 rounded text-[11px] font-mono">
                FXL-SILA1
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                จำลองการสับเส้นทางเดินไฟ ทุกระบบ & ตรวจสอบการยอมรับตาม Tier SLA
              </h2>
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-400 font-mono mt-0.5">
              Power Path Rerouting Schematic • Uptime Institute Tier Downtime Tolerance • Automated Incident Remediation Playbook
            </p>
          </div>
        </div>

        {/* Global Critical State Indicator */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded border text-xs font-bold flex items-center gap-2 shadow ${itRackPowerStatus.badge}`}>
            <span className={`w-2 h-2 rounded-full ${itRackPowerStatus.state === 'COMPLETE_BLACKOUT' ? 'bg-red-400 animate-ping' : itRackPowerStatus.state === 'SINGLE_FEED_ACTIVE' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <span>{itRackPowerStatus.label}</span>
          </div>
        </div>
      </div>

      {/* Scenario Selector Ribbon */}
      <div className="bg-[#242424] border border-[#3e3e3e] rounded-lg p-3 shadow flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 font-bold text-gray-200 text-xs">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>เลือกสถานการณ์จำลองการสับเปลี่ยนเส้นทาง (Interactive Switching Scenarios):</span>
          </div>
          {isTimerRunning && (
            <div className="flex items-center gap-2 bg-black/60 px-2.5 py-1 rounded border border-amber-500/40 text-amber-400 font-mono text-xs">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>เวลาที่ระบบเกิดความผิดปกติสะสม: <strong className="text-white text-sm">{outageSeconds} วินาที</strong></span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* 1. Normal Dual */}
          <button
            type="button"
            onClick={() => handleSelectScenario('NORMAL_DUAL')}
            className={`p-2 rounded text-left border transition cursor-pointer flex flex-col justify-between gap-1 ${
              scenario === 'NORMAL_DUAL'
                ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-lg'
                : 'bg-[#1c1c1c] border-[#383838] text-gray-400 hover:text-white hover:bg-[#282828]'
            }`}
          >
            <div className="font-bold text-[11px] text-cyan-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>1. Normal Dual 2(N+1)</span>
            </div>
            <div className="text-[9.5px] text-gray-400 leading-tight">
              การไฟฟ้า PEA 22kV ปกติ จ่ายคู่ขนาน A+B
            </div>
          </button>

          {/* 2. Grid Outage ATS */}
          <button
            type="button"
            onClick={() => handleSelectScenario('GRID_OUTAGE_ATS')}
            className={`p-2 rounded text-left border transition cursor-pointer flex flex-col justify-between gap-1 ${
              scenario === 'GRID_OUTAGE_ATS'
                ? 'bg-amber-950/80 border-amber-400 text-white shadow-lg'
                : 'bg-[#1c1c1c] border-[#383838] text-gray-400 hover:text-white hover:bg-[#282828]'
            }`}
          >
            <div className="font-bold text-[11px] text-amber-300 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              <span>2. PEA Blackout ➔ ATS</span>
            </div>
            <div className="text-[9.5px] text-gray-400 leading-tight">
              ไฟดับ สลับใช้ GEN-1 (ATS 8.5s) UPS แบตเตอรี่รับช่วง
            </div>
          </button>

          {/* 3. MDB1A Bus Fault */}
          <button
            type="button"
            onClick={() => handleSelectScenario('MDB1A_BUS_FAULT')}
            className={`p-2 rounded text-left border transition cursor-pointer flex flex-col justify-between gap-1 ${
              scenario === 'MDB1A_BUS_FAULT'
                ? 'bg-red-950/80 border-red-400 text-white shadow-lg'
                : 'bg-[#1c1c1c] border-[#383838] text-gray-400 hover:text-white hover:bg-[#282828]'
            }`}
          >
            <div className="font-bold text-[11px] text-red-300 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>3. MDB-1A Bus Fault</span>
            </div>
            <div className="text-[9.5px] text-gray-400 leading-tight">
              บัส A ทริป ต้องสั่งสับ TIE-MDB เพื่อดึงไฟข้ามบัส
            </div>
          </button>

          {/* 4. UPS Inverter Trip */}
          <button
            type="button"
            onClick={() => handleSelectScenario('UPS3A_INVERTER_TRIP')}
            className={`p-2 rounded text-left border transition cursor-pointer flex flex-col justify-between gap-1 ${
              scenario === 'UPS3A_INVERTER_TRIP'
                ? 'bg-orange-950/80 border-orange-400 text-white shadow-lg'
                : 'bg-[#1c1c1c] border-[#383838] text-gray-400 hover:text-white hover:bg-[#282828]'
            }`}
          >
            <div className="font-bold text-[11px] text-orange-300 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>4. Inverter ➔ Static Bypass</span>
            </div>
            <div className="text-[9.5px] text-gray-400 leading-tight">
              อินเวอร์เตอร์ทริป สับ STS Static Bypass ใน &lt;2ms
            </div>
          </button>

          {/* 5. Maintenance Bypass */}
          <button
            type="button"
            onClick={() => handleSelectScenario('MAINTENANCE_BYPASS')}
            className={`p-2 rounded text-left border transition cursor-pointer flex flex-col justify-between gap-1 ${
              scenario === 'MAINTENANCE_BYPASS'
                ? 'bg-yellow-950/80 border-yellow-400 text-white shadow-lg'
                : 'bg-[#1c1c1c] border-[#383838] text-gray-400 hover:text-white hover:bg-[#282828]'
            }`}
          >
            <div className="font-bold text-[11px] text-yellow-300 flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5" />
              <span>5. Maintenance Bypass</span>
            </div>
            <div className="text-[9.5px] text-gray-400 leading-tight">
              สับบายพาสซ่อมบำรุงตู้ UPS-3A แบบฮ็อตสว็อป
            </div>
          </button>

          {/* 6. Extended Blackout & Gen Fail */}
          <button
            type="button"
            onClick={() => handleSelectScenario('EXTENDED_BLACKOUT_GEN_FAIL')}
            className={`p-2 rounded text-left border transition cursor-pointer flex flex-col justify-between gap-1 ${
              scenario === 'EXTENDED_BLACKOUT_GEN_FAIL'
                ? 'bg-purple-950/80 border-purple-400 text-white shadow-lg'
                : 'bg-[#1c1c1c] border-[#383838] text-gray-400 hover:text-white hover:bg-[#282828]'
            }`}
          >
            <div className="font-bold text-[11px] text-purple-300 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>6. Gen Fail Disaster</span>
            </div>
            <div className="text-[9.5px] text-gray-400 leading-tight">
              การไฟฟ้าดับ + เครื่องกำเนิดไม่ติด แบตเตอรี่วิกฤต
            </div>
          </button>
        </div>
      </div>

      {/* Main Grid: SVG Animated Power Schematic (Left) & Tier SLA Countdowns (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Animated Power Path Schematic Canvas (8 Cols) */}
        <div className="lg:col-span-8 bg-[#181818] border border-[#3e3e3e] rounded-lg p-3 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#333] pb-2 mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white text-xs uppercase tracking-wider">
                แผนผังจำลองการเดินไฟและสับถ่ายโอน (Active Power Path Schematic)
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Utility
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Generator
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-400" /> Battery
              </span>
              <span className="flex items-center gap-1 text-orange-400">
                <span className="w-2 h-2 rounded-full bg-orange-400" /> Bypass
              </span>
              <span className="flex items-center gap-1 text-sky-400">
                <span className="w-2 h-2 rounded-full bg-sky-400" /> Bus-Tie
              </span>
            </div>
          </div>

          {/* SVG Diagram */}
          <div className="relative w-full overflow-x-auto bg-[#101010] rounded border border-[#2a2a2a] p-2 flex items-center justify-center">
            <svg
              viewBox="0 0 740 480"
              className="w-full max-w-[850px] h-auto select-none font-mono"
            >
              <defs>
                {/* Neon Glow Filters */}
                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00ffcc" floodOpacity="0.8" />
                </filter>
                <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.8" />
                </filter>
                <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#c084fc" floodOpacity="0.8" />
                </filter>

                {/* Animation Pulse Keyframes */}
                <style>
                  {`
                    @keyframes flowAnim {
                      0% { stroke-dashoffset: 40; }
                      100% { stroke-dashoffset: 0; }
                    }
                    .flow-line {
                      stroke-dasharray: 6 4;
                      animation: flowAnim 1.2s linear infinite;
                    }
                    .flow-line-fast {
                      stroke-dasharray: 6 3;
                      animation: flowAnim 0.7s linear infinite;
                    }
                  `}
                </style>
              </defs>

              {/* ---------------- LEVEL 1: SOURCES (TOP) ---------------- */}
              {/* Utility Grid Box */}
              <g transform="translate(140, 20)">
                <rect
                  x="0"
                  y="0"
                  width="180"
                  height="45"
                  rx="4"
                  fill={scenario === 'GRID_OUTAGE_ATS' || scenario === 'EXTENDED_BLACKOUT_GEN_FAIL' ? '#2a1515' : '#142a22'}
                  stroke={scenario === 'GRID_OUTAGE_ATS' || scenario === 'EXTENDED_BLACKOUT_GEN_FAIL' ? '#ef4444' : '#10b981'}
                  strokeWidth="1.5"
                />
                <text x="90" y="20" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
                  PEA 22kV UTILITY GRID
                </text>
                <text x="90" y="34" textAnchor="middle" fill={scenario === 'GRID_OUTAGE_ATS' || scenario === 'EXTENDED_BLACKOUT_GEN_FAIL' ? '#ef4444' : '#00ffcc'} fontSize="9.5">
                  {scenario === 'GRID_OUTAGE_ATS' || scenario === 'EXTENDED_BLACKOUT_GEN_FAIL' ? 'GRID BLACKOUT (0V)' : 'ONLINE 22.0 kV (50.0 Hz)'}
                </text>
              </g>

              {/* Emergency Generator GEN-1 Box */}
              <g transform="translate(420, 20)">
                <rect
                  x="0"
                  y="0"
                  width="180"
                  height="45"
                  rx="4"
                  fill={scenario === 'GRID_OUTAGE_ATS' && outageSeconds >= 8.5 ? '#2b2310' : scenario === 'EXTENDED_BLACKOUT_GEN_FAIL' ? '#2a1515' : '#1a1a1a'}
                  stroke={scenario === 'GRID_OUTAGE_ATS' && outageSeconds >= 8.5 ? '#f59e0b' : scenario === 'EXTENDED_BLACKOUT_GEN_FAIL' ? '#ef4444' : '#555'}
                  strokeWidth="1.5"
                />
                <text x="90" y="20" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
                  EMERGENCY GEN-1 (1000kVA)
                </text>
                <text x="90" y="34" textAnchor="middle" fill={scenario === 'GRID_OUTAGE_ATS' && outageSeconds >= 8.5 ? '#f59e0b' : scenario === 'EXTENDED_BLACKOUT_GEN_FAIL' ? '#ef4444' : '#888'} fontSize="9.5">
                  {scenario === 'GRID_OUTAGE_ATS' && outageSeconds >= 8.5
                    ? 'RUNNING (381V / 50Hz)'
                    : scenario === 'GRID_OUTAGE_ATS' && outageSeconds < 8.5
                    ? 'CRANKING / SYNCING...'
                    : scenario === 'EXTENDED_BLACKOUT_GEN_FAIL'
                    ? 'OVERCRANK TRIP FAULT'
                    : 'AUTO-STANDBY READY'}
                </text>
              </g>

              {/* Transformers TR-1 & TR-2 */}
              <g transform="translate(90, 95)">
                <rect x="0" y="0" width="120" height="35" rx="3" fill="#1e1e1e" stroke={scenario === 'GRID_OUTAGE_ATS' || scenario === 'EXTENDED_BLACKOUT_GEN_FAIL' ? '#444' : '#00ffcc'} strokeWidth="1.2" />
                <text x="60" y="16" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">TR-1 (2500kVA)</text>
                <text x="60" y="28" textAnchor="middle" fill="#aaa" fontSize="8.5">22kV ➔ 400V Dyn11</text>
              </g>
              <g transform="translate(250, 95)">
                <rect x="0" y="0" width="120" height="35" rx="3" fill="#1e1e1e" stroke={scenario === 'GRID_OUTAGE_ATS' || scenario === 'EXTENDED_BLACKOUT_GEN_FAIL' ? '#444' : '#00ffcc'} strokeWidth="1.2" />
                <text x="60" y="16" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">TR-2 (2500kVA)</text>
                <text x="60" y="28" textAnchor="middle" fill="#aaa" fontSize="8.5">22kV ➔ 400V Dyn11</text>
              </g>

              {/* Feed lines from Utility to TR-1 & TR-2 */}
              {!(scenario === 'GRID_OUTAGE_ATS' || scenario === 'EXTENDED_BLACKOUT_GEN_FAIL') && (
                <>
                  <path d="M 190 65 L 190 80 L 150 80 L 150 95" fill="none" stroke="#00ffcc" strokeWidth="2.5" className="flow-line" />
                  <path d="M 270 65 L 270 80 L 310 80 L 310 95" fill="none" stroke="#00ffcc" strokeWidth="2.5" className="flow-line" />
                </>
              )}

              {/* Feed lines from Generator to ATS */}
              {(scenario === 'GRID_OUTAGE_ATS' && outageSeconds >= 8.5) && (
                <path d="M 510 65 L 510 165 L 240 165" fill="none" stroke="#f59e0b" strokeWidth="2.5" className="flow-line" />
              )}

              {/* ---------------- LEVEL 2: ATS & MDB BUSBARS ---------------- */}
              {/* ATS-1 Box */}
              <g transform="translate(170, 150)">
                <rect x="0" y="0" width="120" height="32" rx="3" fill="#222" stroke={scenario === 'GRID_OUTAGE_ATS' ? '#f59e0b' : '#38bdf8'} strokeWidth="1.5" />
                <text x="60" y="15" textAnchor="middle" fill="#fff" fontSize="9.5" fontWeight="bold">ATS-1 (AUTO SWITCH)</text>
                <text x="60" y="26" textAnchor="middle" fill={scenario === 'GRID_OUTAGE_ATS' && outageSeconds >= 8.5 ? '#f59e0b' : '#38bdf8'} fontSize="8">
                  {scenario === 'GRID_OUTAGE_ATS' && outageSeconds >= 8.5 ? 'TRANSFERRED: GEN' : 'SOURCE: UTILITY'}
                </text>
              </g>

              {/* MDB-1A (Bus A) */}
              <g transform="translate(80, 205)">
                <rect
                  x="0"
                  y="0"
                  width="190"
                  height="45"
                  rx="4"
                  fill={scenario === 'MDB1A_BUS_FAULT' && !tieBreakerClosed ? '#2a1515' : '#1a1a1a'}
                  stroke={scenario === 'MDB1A_BUS_FAULT' && !tieBreakerClosed ? '#ef4444' : tieBreakerClosed ? '#38bdf8' : pathA.color}
                  strokeWidth="2"
                />
                <text x="95" y="18" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
                  MDB-1A (BUSBAR A)
                </text>
                <text x="95" y="34" textAnchor="middle" fill={scenario === 'MDB1A_BUS_FAULT' && !tieBreakerClosed ? '#ef4444' : '#00ffcc'} fontSize="9.5">
                  {scenario === 'MDB1A_BUS_FAULT' && !tieBreakerClosed
                    ? 'TRIPPED (0V / ARC FAULT)'
                    : tieBreakerClosed
                    ? 'TIED BACKFEED (380V via TIE)'
                    : 'ENERGIZED 380V (485A)'}
                </text>
              </g>

              {/* TIE-BREAKER TIE-MDB (Between Bus A and Bus B) */}
              <g
                transform="translate(305, 205)"
                className="cursor-pointer"
                onClick={() => setTieBreakerClosed((prev) => !prev)}
              >
                <rect
                  x="0"
                  y="0"
                  width="130"
                  height="45"
                  rx="4"
                  fill={tieBreakerClosed ? '#0c3547' : '#1e1e1e'}
                  stroke={tieBreakerClosed ? '#38bdf8' : '#555'}
                  strokeWidth="1.8"
                />
                <text x="65" y="18" textAnchor="middle" fill={tieBreakerClosed ? '#38bdf8' : '#aaa'} fontSize="10" fontWeight="bold">
                  TIE-MDB BREAKER
                </text>
                <text x="65" y="34" textAnchor="middle" fill={tieBreakerClosed ? '#00ffcc' : '#ef4444'} fontSize="9">
                  {tieBreakerClosed ? '● CLOSED (ACTIVE TIE)' : '○ OPEN (ISOLATED)'}
                </text>
              </g>

              {/* MDB-1B (Bus B) */}
              <g transform="translate(470, 205)">
                <rect
                  x="0"
                  y="0"
                  width="190"
                  height="45"
                  rx="4"
                  fill="#1a1a1a"
                  stroke={pathB.color}
                  strokeWidth="2"
                />
                <text x="95" y="18" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
                  MDB-1B (BUSBAR B)
                </text>
                <text x="95" y="34" textAnchor="middle" fill="#00ffcc" fontSize="9.5">
                  ENERGIZED 380V ({tieBreakerClosed ? '890A LOAD' : '495A LOAD'})
                </text>
              </g>

              {/* Bus tie connection line */}
              {tieBreakerClosed && (
                <path d="M 270 227 L 305 227 M 435 227 L 470 227" fill="none" stroke="#38bdf8" strokeWidth="3" className="flow-line-fast" />
              )}

              {/* ---------------- LEVEL 3: UPS SYSTEMS & BATTERIES ---------------- */}
              {/* UPS-3A System (Bus A) */}
              <g transform="translate(80, 280)">
                <rect
                  x="0"
                  y="0"
                  width="190"
                  height="65"
                  rx="4"
                  fill="#1c1c1c"
                  stroke={staticBypassEngaged ? '#fb923c' : maintenanceBypassEngaged ? '#fbbf24' : '#00ffcc'}
                  strokeWidth="1.8"
                />
                <text x="95" y="18" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
                  UPS-3A1 / 3A2 (BUS A)
                </text>
                <text x="95" y="33" textAnchor="middle" fill={staticBypassEngaged ? '#fb923c' : maintenanceBypassEngaged ? '#fbbf24' : '#00ffcc'} fontSize="9.5">
                  {maintenanceBypassEngaged
                    ? '● MAINTENANCE BYPASS (HOT-SWAP)'
                    : staticBypassEngaged
                    ? '● STATIC BYPASS (SCR STS)'
                    : pathA.status === 'BATTERY' || pathA.status === 'BATTERY_DRAINING'
                    ? '● ON BATTERY DISCHARGE (0ms)'
                    : '● DOUBLE CONVERSION ONLINE'}
                </text>
                <text x="95" y="48" textAnchor="middle" fill="#888" fontSize="8.5">
                  BATT-3A: {scenario === 'EXTENDED_BLACKOUT_GEN_FAIL' ? 'DISCHARGING 48V' : 'FLOAT CHARGE 542V'}
                </text>
              </g>

              {/* UPS-3B System (Bus B) */}
              <g transform="translate(470, 280)">
                <rect
                  x="0"
                  y="0"
                  width="190"
                  height="65"
                  rx="4"
                  fill="#1c1c1c"
                  stroke="#00ffcc"
                  strokeWidth="1.8"
                />
                <text x="95" y="18" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
                  UPS-3B1 / 3B2 (BUS B)
                </text>
                <text x="95" y="33" textAnchor="middle" fill="#00ffcc" fontSize="9.5">
                  {pathB.status === 'BATTERY' || pathB.status === 'BATTERY_DRAINING'
                    ? '● ON BATTERY DISCHARGE (0ms)'
                    : '● DOUBLE CONVERSION ONLINE'}
                </text>
                <text x="95" y="48" textAnchor="middle" fill="#888" fontSize="8.5">
                  BATT-3B: FLOAT CHARGE 542V
                </text>
              </g>

              {/* Vertical Feed lines from MDB to UPS */}
              <path d="M 175 250 L 175 280" fill="none" stroke={pathA.color} strokeWidth="2.5" className="flow-line" />
              <path d="M 565 250 L 565 280" fill="none" stroke={pathB.color} strokeWidth="2.5" className="flow-line" />

              {/* ---------------- LEVEL 4: OUTPUT UMDB & PDU ---------------- */}
              {/* UMDB-A & PDU-A */}
              <g transform="translate(100, 370)">
                <rect x="0" y="0" width="150" height="32" rx="3" fill="#222" stroke={pathA.color} strokeWidth="1.5" />
                <text x="75" y="15" textAnchor="middle" fill="#fff" fontSize="9.5" fontWeight="bold">UMDB-A ➔ PDU-A</text>
                <text x="75" y="26" textAnchor="middle" fill={pathA.color} fontSize="8">{pathA.voltage} VAC • Line A Active</text>
              </g>

              {/* UMDB-B & PDU-B */}
              <g transform="translate(490, 370)">
                <rect x="0" y="0" width="150" height="32" rx="3" fill="#222" stroke={pathB.color} strokeWidth="1.5" />
                <text x="75" y="15" textAnchor="middle" fill="#fff" fontSize="9.5" fontWeight="bold">UMDB-B ➔ PDU-B</text>
                <text x="75" y="26" textAnchor="middle" fill={pathB.color} fontSize="8">{pathB.voltage} VAC • Line B Active</text>
              </g>

              <path d="M 175 345 L 175 370" fill="none" stroke={pathA.color} strokeWidth="2.5" className="flow-line" />
              <path d="M 565 345 L 565 370" fill="none" stroke={pathB.color} strokeWidth="2.5" className="flow-line" />

              {/* ---------------- LEVEL 5: DATA CENTER SERVER RACKS (DUAL-CORD) ---------------- */}
              <g transform="translate(230, 425)">
                <rect
                  x="0"
                  y="0"
                  width="280"
                  height="45"
                  rx="4"
                  fill="#111"
                  stroke={itRackPowerStatus.color}
                  strokeWidth="2"
                  filter={itRackPowerStatus.state !== 'COMPLETE_BLACKOUT' ? 'url(#glow-cyan)' : ''}
                />
                <text x="140" y="18" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
                  WHITE SPACE DATA HALL IT SERVER RACKS
                </text>
                <text x="140" y="34" textAnchor="middle" fill={itRackPowerStatus.color} fontSize="9.5" fontWeight="bold">
                  DUAL-CORD POWER (PSU-A + PSU-B): {itRackPowerStatus.label}
                </text>
              </g>

              {/* Convergence lines to server racks */}
              <path d="M 175 402 L 175 445 L 230 445" fill="none" stroke={pathA.color} strokeWidth="2.5" className={pathA.voltage > 50 ? 'flow-line' : ''} />
              <path d="M 565 402 L 565 445 L 510 445" fill="none" stroke={pathB.color} strokeWidth="2.5" className={pathB.voltage > 50 ? 'flow-line' : ''} />
            </svg>
          </div>

          {/* Quick Breaker Controls Bar */}
          <div className="mt-3 pt-2 border-t border-[#333] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <span className="text-gray-400">ปุ่มควบคุมสับสวิตช์ด่วน:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTieBreakerClosed((p) => !p)}
                className={`px-2.5 py-1 rounded border font-bold cursor-pointer transition ${
                  tieBreakerClosed
                    ? 'bg-cyan-700 text-white border-cyan-400'
                    : 'bg-[#2a2a2a] text-gray-300 border-[#555] hover:text-white'
                }`}
              >
                {tieBreakerClosed ? 'สับปลด Tie-Breaker (OPEN)' : 'สับเชื่อม Tie-Breaker (CLOSE)'}
              </button>

              <button
                type="button"
                onClick={() => setStaticBypassEngaged((p) => !p)}
                className={`px-2.5 py-1 rounded border font-bold cursor-pointer transition ${
                  staticBypassEngaged
                    ? 'bg-orange-700 text-white border-orange-400'
                    : 'bg-[#2a2a2a] text-gray-300 border-[#555] hover:text-white'
                }`}
              >
                {staticBypassEngaged ? 'ปลด Static Bypass' : 'บังคับ Static Bypass'}
              </button>

              <button
                type="button"
                onClick={() => setMaintenanceBypassEngaged((p) => !p)}
                className={`px-2.5 py-1 rounded border font-bold cursor-pointer transition ${
                  maintenanceBypassEngaged
                    ? 'bg-yellow-700 text-white border-yellow-400'
                    : 'bg-[#2a2a2a] text-gray-300 border-[#555] hover:text-white'
                }`}
              >
                {maintenanceBypassEngaged ? 'ปลด Maintenance Bypass' : 'สับ Maintenance Bypass'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Tier Downtime SLA Countdown Clocks & Standards (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Real-time Tier SLA Tolerance Countdown Box */}
          <div className="bg-[#1c1c1c] border border-[#3e3e3e] rounded-lg p-3 shadow flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-[#333] pb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>การนับถอยหลังการยอมรับแต่ละ Tier (SLA Timers)</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#333] text-gray-300 font-mono">UPTIME INSTITUTE</span>
            </div>

            {/* Countdown Cards for Tier I - Tier IV */}
            <div className="space-y-2">
              {/* TIER IV */}
              {(() => {
                const std = TIER_STANDARDS['TIER_4'];
                const isBreached = itRackPowerStatus.state === 'COMPLETE_BLACKOUT';
                return (
                  <div className={`p-2 rounded border transition ${
                    isBreached
                      ? 'bg-red-950/70 border-red-500 text-white'
                      : 'bg-[#242424] border-[#383838] text-gray-200'
                  }`}>
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-cyan-300">TIER IV (Fault Tolerant 2(N+1))</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                        isBreached ? 'bg-red-700 text-white font-extrabold' : 'bg-emerald-900/60 text-emerald-300'
                      }`}>
                        {isBreached ? 'SLA BREACHED' : 'COMPLIANT (0ms)'}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex justify-between font-mono">
                      <span>ยอมรับ Interruption: <strong>0 ms (Continuous)</strong></span>
                      <span>Downtime งบต่อปี: <strong>{std.maxDowntimeMinutesYear} นาที</strong></span>
                    </div>
                    {isBreached && (
                      <div className="mt-1 text-[9.5px] text-red-300 font-bold bg-red-900/40 p-1 rounded">
                        ⚠️ เซิร์ฟเวอร์สูญเสียไฟทั้งสองเส้นทาง! ละเมิดเกณฑ์ Tier IV Fault Tolerance แล้ว
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* TIER III */}
              {(() => {
                const std = TIER_STANDARDS['TIER_3'];
                const maxTransfer = std.maxTransferInterruptionSec;
                const remaining = Math.max(0, maxTransfer - outageSeconds);
                const isBreached = (scenario === 'GRID_OUTAGE_ATS' && outageSeconds > maxTransfer && pathA.status !== 'GENERATOR') || itRackPowerStatus.state === 'COMPLETE_BLACKOUT';
                return (
                  <div className={`p-2 rounded border transition ${
                    isBreached
                      ? 'bg-red-950/70 border-red-500 text-white'
                      : scenario === 'GRID_OUTAGE_ATS' && remaining > 0
                      ? 'bg-amber-950/60 border-amber-500 text-white'
                      : 'bg-[#242424] border-[#383838] text-gray-200'
                  }`}>
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-amber-300">TIER III (Concurrently Maintainable)</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                        isBreached
                          ? 'bg-red-700 text-white font-extrabold'
                          : scenario === 'GRID_OUTAGE_ATS' && remaining > 0
                          ? 'bg-amber-700 text-white animate-pulse'
                          : 'bg-emerald-900/60 text-emerald-300'
                      }`}>
                        {isBreached
                          ? 'SLA BREACHED'
                          : scenario === 'GRID_OUTAGE_ATS' && remaining > 0
                          ? `TRANSFER COUNTDOWN: ${remaining.toFixed(1)}s`
                          : 'COMPLIANT'}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex justify-between font-mono">
                      <span>ATS Transfer SLA: <strong>≤ 10.0 วินาที</strong></span>
                      <span>Downtime งบต่อปี: <strong>{std.maxDowntimeHoursYear} ชม. (96m)</strong></span>
                    </div>
                  </div>
                );
              })()}

              {/* TIER II */}
              {(() => {
                const std = TIER_STANDARDS['TIER_2'];
                const maxTransfer = std.maxTransferInterruptionSec;
                const remaining = Math.max(0, maxTransfer - outageSeconds);
                const isBreached = scenario === 'EXTENDED_BLACKOUT_GEN_FAIL' && outageSeconds > maxTransfer;
                return (
                  <div className={`p-2 rounded border transition ${
                    isBreached ? 'bg-red-950/70 border-red-500 text-white' : 'bg-[#242424] border-[#383838] text-gray-200'
                  }`}>
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-yellow-300">TIER II (Redundant Components N+1)</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                        isBreached ? 'bg-red-700 text-white' : 'bg-emerald-900/60 text-emerald-300'
                      }`}>
                        {isBreached ? 'SLA BREACHED' : 'TOLERANCE: ≤ 20s'}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex justify-between font-mono">
                      <span>ความพร้อมใช้งาน: <strong>99.741%</strong></span>
                      <span>Downtime งบต่อปี: <strong>22.0 ชม./ปี</strong></span>
                    </div>
                  </div>
                );
              })()}

              {/* TIER I */}
              {(() => {
                const std = TIER_STANDARDS['TIER_1'];
                const isBreached = scenario === 'EXTENDED_BLACKOUT_GEN_FAIL' && outageSeconds > std.maxTransferInterruptionSec;
                return (
                  <div className={`p-2 rounded border transition ${
                    isBreached ? 'bg-red-950/70 border-red-500 text-white' : 'bg-[#242424] border-[#383838] text-gray-200'
                  }`}>
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-gray-300">TIER I (Basic Single Path)</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                        isBreached ? 'bg-red-700 text-white' : 'bg-gray-700 text-gray-300'
                      }`}>
                        {isBreached ? 'SLA BREACHED' : 'TOLERANCE: ≤ 60s'}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex justify-between font-mono">
                      <span>ความพร้อมใช้งาน: <strong>99.671%</strong></span>
                      <span>Downtime งบต่อปี: <strong>28.8 ชม./ปี</strong></span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Incident Audit Log stream */}
          <div className="bg-[#1c1c1c] border border-[#3e3e3e] rounded-lg p-3 shadow flex flex-col gap-1.5 flex-1 max-h-[220px]">
            <div className="flex items-center justify-between border-b border-[#333] pb-1">
              <span className="font-bold text-gray-300 text-[11px] flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>บันทึกเหตุการณ์การสับถ่ายโอน (Transfer Audit Log)</span>
              </span>
              <span className="text-[9px] text-gray-500 font-mono">REAL-TIME</span>
            </div>
            <div className="overflow-y-auto space-y-1 font-mono text-[9.5px] pr-1">
              {incidentAuditLogs.map((log, idx) => (
                <div key={idx} className="text-gray-300 leading-tight border-b border-[#292929] pb-0.5">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- SECTION 3: AUTOMATED INCIDENT REMEDIATION PLAYBOOK ---------------- */}
      <div className="bg-[#1e1e1e] border border-[#444] rounded-lg p-4 shadow">
        <div className="flex items-center justify-between mb-3 border-b border-[#333] pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-white text-sm sm:text-base font-bold">
                แนวทางแก้ไขปัญหาเมื่อเกิด Down Time เกินเกณฑ์ SLA (Incident Remediation Playbook)
              </h3>
              <p className="text-[10px] text-gray-400 font-mono">
                Standard Operating Procedures (SOP) • Click-to-Execute Solutions • Immediate State Restoration
              </p>
            </div>
          </div>
          <span className="text-xs text-amber-400 font-mono bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
            5 APPROVED SOLUTIONS
          </span>
        </div>

        {/* Solution Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {REMEDIATION_SOLUTIONS.map((sol) => {
            const isApplied = appliedSolutionId === sol.id;
            return (
              <div
                key={sol.id}
                className={`bg-[#252525] border rounded-lg p-3 flex flex-col justify-between gap-2.5 transition ${
                  isApplied
                    ? 'border-emerald-500 bg-emerald-950/20 shadow-lg'
                    : 'border-[#3a3a3a] hover:border-[#555]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold gap-2">
                    <span className="text-white">{sol.nameTh}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                        sol.riskLevel === 'LOW'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      RISK: {sol.riskLevel}
                    </span>
                  </div>
                  <div className="text-[10px] text-cyan-300 font-mono mt-0.5">
                    {sol.name}
                  </div>

                  <div className="text-[10px] text-gray-300 bg-[#1a1a1a] p-1.5 rounded border border-[#333] my-2 font-mono">
                    <strong className="text-amber-400">เงื่อนไขใช้งาน: </strong>
                    {sol.applicableWhen}
                  </div>

                  {/* SOP Steps */}
                  <div className="space-y-1 text-[9.5px] text-gray-300">
                    <div className="font-bold text-gray-400 text-[10px]">ขั้นตอนดำเนินการตาม SOP:</div>
                    {sol.sopSteps.map((st, i) => (
                      <div key={i} className="leading-tight text-gray-400 pl-1">
                        {st}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#333] pt-2 flex items-center justify-between gap-2">
                  <div className="text-[9.5px] text-gray-400 font-mono">
                    MTTR: <strong className="text-emerald-400">{sol.estimatedMttrMinutes}m</strong> | กู้คืน: <strong className="text-sky-400">{sol.downtimeSavedMinutes}m</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExecuteSolution(sol)}
                    className={`px-2.5 py-1 rounded text-[10.5px] font-bold cursor-pointer transition flex items-center gap-1 shadow ${
                      isApplied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-600 hover:bg-amber-500 text-black'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>แก้ไขแล้ว (Applied)</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        <span>สั่งดำเนินการทันที</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
