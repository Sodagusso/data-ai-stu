import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Network,
  Radio,
  Binary,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Download,
  Zap,
  Info,
  Server,
  Terminal,
  Activity,
  ArrowRight,
  Flame,
  Check,
  HelpCircle,
  ExternalLink,
  Table,
} from 'lucide-react';
import { BasPtoPtoGView as DetailedPtoPMatrixView } from './BasPtoPtoGView';
import {
  BAS_POINT_CHECKLIST,
  PROTOCOL_DEEP_DIVES,
  INTERFACE_SUMMARIES,
  SIMULATED_FAULTS,
  type BasPointItem,
  type SubsystemType,
  type VendorProtocolType,
  type SimulatedFaultOption,
} from '../simulator/basPtopData';
import { soundEffects } from '../utils/sound';

interface BasPtopPtoGViewProps {
  onNavigateToTab?: (tab: any) => void;
  onNavigateToEquipment?: (tab: any, elementId: string) => void;
}

export const BasPtopPtoGView: React.FC<BasPtopPtoGViewProps> = ({
  onNavigateToTab,
  onNavigateToEquipment,
}) => {
  // Navigation sub-tabs within this view
  const [activeSubView, setActiveSubView] = useState<
    'report' | 'interfaces' | 'protocols' | 'points' | 'matrix' | 'fault-lab'
  >('report');

  // Search & Filters for Points
  const [pointSearch, setPointSearch] = useState<string>('');
  const [selectedSubsystem, setSelectedSubsystem] = useState<SubsystemType | 'ALL'>('ALL');
  const [selectedProtocol, setSelectedProtocol] = useState<VendorProtocolType | 'ALL'>('ALL');
  const [selectedPointDetail, setSelectedPointDetail] = useState<BasPointItem | null>(null);

  // Active Simulated Faults State
  const [activeFaultIds, setActiveFaultIds] = useState<string[]>([]);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState<boolean>(false);
  const [diagnosticReport, setDiagnosticReport] = useState<string | null>(null);
  const [exportCopied, setExportCopied] = useState<boolean>(false);

  // Toggle Simulated Fault
  const handleToggleFault = (faultId: string) => {
    setActiveFaultIds((prev) => {
      const exists = prev.includes(faultId);
      const next = exists ? prev.filter((id) => id !== faultId) : [...prev, faultId];
      if (!exists) {
        soundEffects.playTripAlarm();
      } else {
        soundEffects.playResetTone();
      }
      return next;
    });
  };

  const handleClearAllFaults = () => {
    setActiveFaultIds([]);
    setDiagnosticReport(null);
    soundEffects.playResetTone();
  };

  // Run Automated Diagnostic Test
  const handleRunDiagnostic = () => {
    setIsDiagnosticRunning(true);
    soundEffects.playClick();
    setTimeout(() => {
      setIsDiagnosticRunning(false);
      soundEffects.playResetTone();
      if (activeFaultIds.length === 0) {
        setDiagnosticReport(
          `[PASSED 100%] การทดสอบอัตโนมัติ 20/20 จุดผ่านเกณฑ์การทดสอบ PtoP และ PtoG สัญญาณสื่อสารมีความสมบูรณ์ สภาพกราวด์แยกเป็นอิสระ ค่า Endianness ถูกต้องตามมาตรฐาน ไม่พบข้อบกพร่อง`
        );
      } else {
        setDiagnosticReport(
          `[DETECTED ${activeFaultIds.length} FAULT(S)] ตรวจพบข้อบกพร่องในระบบ กรุณาดูคำแนะนำในการแก้ไข (Corrective Actions) ในแถบ "ห้องทดลองจำลองปัญหา" หรือในตารางตรวจสอบ Point ที่ไฮไลต์สีส้ม/แดง`
        );
      }
    }, 800);
  };

  // Compute live point list with simulated fault conditions applied
  const computedPoints = useMemo(() => {
    return BAS_POINT_CHECKLIST.map((item) => {
      // Find if any active fault affects this point
      const activeFaults = SIMULATED_FAULTS.filter(
        (f) => activeFaultIds.includes(f.id) && f.affectedPointIds.includes(item.id)
      );

      if (activeFaults.length > 0) {
        const topFault = activeFaults[0];
        let currentReading = item.nominalValue;
        if (topFault.code === 'WORD_SWAP_ERROR') {
          currentReading = '0.000000 V (Raw: 0x000043BE - Word Swap Garbled)';
        } else if (topFault.code === 'SHIELD_GROUND_LOOP') {
          currentReading = 'ERR CRC: 50Hz AC Common-Mode Noise Burst';
        } else if (topFault.code === 'REGISTER_OFFSET_SHIFT') {
          currentReading = '0.00 kVAR (Read Offset 43061 instead of 43060 kW)';
        } else if (topFault.code === 'BACNET_DUP_INSTANCE') {
          currentReading = 'DEVICE COLLISION (Instance 101001 Conflict)';
        } else if (topFault.code === 'CURRENT_LOOP_BROKEN') {
          currentReading = '0.0 mA (NAMUR NE43 Broken Wire Alert < 3.6mA)';
        } else if (topFault.code === 'RS485_NO_TERMINATION') {
          currentReading = 'TIMEOUT / PACKET LOSS (Reflection at High Baud)';
        }

        return {
          ...item,
          status: 'SIMULATED_FAULT' as const,
          currentReading,
          faultMessage: `[${topFault.code}] ${topFault.titleTh}: ${topFault.symptomTh}`,
        };
      }

      return {
        ...item,
        status: 'NORMAL' as const,
        currentReading: item.nominalValue,
      };
    });
  }, [activeFaultIds]);

  // Filtered Points
  const filteredPoints = useMemo(() => {
    return computedPoints.filter((item) => {
      const matchSearch =
        pointSearch === '' ||
        item.tag.toLowerCase().includes(pointSearch.toLowerCase()) ||
        item.nameTh.toLowerCase().includes(pointSearch.toLowerCase()) ||
        item.nameEn.toLowerCase().includes(pointSearch.toLowerCase()) ||
        item.vendorExample.toLowerCase().includes(pointSearch.toLowerCase()) ||
        item.hardwareAddress.toLowerCase().includes(pointSearch.toLowerCase());

      const matchSubsystem =
        selectedSubsystem === 'ALL' || item.subsystem === selectedSubsystem;
      const matchProtocol =
        selectedProtocol === 'ALL' || item.vendorProtocol === selectedProtocol;

      return matchSearch && matchSubsystem && matchProtocol;
    });
  }, [computedPoints, pointSearch, selectedSubsystem, selectedProtocol]);

  // Generate complete investigation text for export/copy
  const handleExportReportText = () => {
    const reportText = `
================================================================================
รายงานการสอบสวน BAS PtoP และ PtoG สำหรับระบบไฟฟ้าและสิ่งอำนวยความสะดวก
SILA1 Electrical SCADA & Data Center Commissioning Investigation Report
================================================================================
วันเวลาที่ออกรายงาน: ${new Date().toLocaleString('th-TH')}
มาตรฐานอ้างอิง: ASHRAE Guideline 0-2019, TIA-942 Tier III/IV, IEEE 1100 Emerald Book, Modbus IDA, BACnet 135

1. ความหมายเชิงสถาปัตยกรรม (Architecture Definitions):
--------------------------------------------------------------------------------
• BAS PtoP (Point-to-Point Testing):
  การตรวจสอบความสมบูรณ์ทางกายภาพและสัญญาณไฟฟ้าระหว่างอุปกรณ์ตรวจวัดสนาม (Field Device: Sensors, 
  Aux Contacts, Power Meters, VFD, ATS, Protection Relays) เข้าสู่ตัวควบคุมท้องถิ่น (DDC/PLC/Gateway)
  - DI/DO: ขั้วต่อ Wetting 24VDC, Contact Bounce, Debounce Timer 30-50ms, Flyback Diode
  - AI/AO: วงจร 4-20mA Current Loop, Live Zero (<3.6mA Broken Wire Detection), PT100 3-Wire
  - Serial Bus: RS-485 Polarity (A/B), ตัวต้านทานปิดหัวท้าย 120Ω EOL, กราวด์ชีลด์จุดเดียว

• BAS PtoG (Point-to-Gateway & Point-to-Graphics / Point-to-Ground):
  - Point-to-Gateway / Graphics: การทดสอบเส้นทางข้อมูลจาก Gateway/Controller ข้ามเครือข่าย IP
    (BACnet IP, Modbus TCP, SNMP) ไปยัง SCADA Server และหน้าจอ Graphical HMI
    รวมถึงการแมป Register Offset (1-based vs 0-based), Data Scaling (x0.1, x10), 
    และ Byte/Word Endianness (Swap Words สำหรับ Float32)
  - Point-to-Ground: การแยกความต่างศักย์กราวด์ (Galvanic Isolation) ป้องกัน 50Hz Ground Loop

2. อินเตอร์เฟสหลักที่เกี่ยวข้อง (Interfaces Involved):
--------------------------------------------------------------------------------
1) HV Switchgear & Transformers (22kV RM6 & Ekarat 2000kVA):
   - Protocols: IEC 61850 GOOSE/MMS, Modbus TCP, Hardwired DI/AI
   - Vendors: Schneider (Sepam/Micom/RM6), Ekarat
2) Low Voltage Main Distribution Boards (MDB-1A, 1B, 2A, 2B & EPMS):
   - Protocols: Modbus RTU (RS-485), Modbus TCP, Hardwired Aux Contacts
   - Vendors: Schneider (PM8000, Masterpact MTZ), ABB (Emax 2), Siemens (PAC4200)
3) Automatic Transfer Switches (ATS-1A, 1B, 2A, 2B & Interlock):
   - Protocols: Hardwired Fail-Safe Contacts, Modbus RTU
   - Vendors: Socomec (ATyS), ASCO (Series 7000)
4) Emergency Diesel Generator (EDG 2000kVA):
   - Protocols: Modbus RTU/TCP, Hardwired Auto-Start / Run Feedback
   - Vendors: Deep Sea Electronics (DSE8610), Woodward (EasyGen)
5) UPS Modular System & Battery Monitoring System (BMS):
   - Protocols: SNMP v2c/v3 (RFC 1628), Modbus TCP, Hardwired EPO
   - Vendors: Vertiv (Liebert EXL/Unity), Schneider (Galaxy VX), Eaton (9395)
6) Precision HVAC & Chiller Plant:
   - Protocols: BACnet IP (UDP 47808), BACnet MS/TP, Modbus RTU
   - Vendors: Johnson Controls (Metasys/York), Trane, Schneider (Uniflair)

3. ข้อควรระวังและจุดที่ต้องคำนึงถึงในระดับ Point (Key Points Checkpoints):
--------------------------------------------------------------------------------
- Word Swap Mismatch: 32-bit Float บน Modbus หากสลับ High/Low Word ค่า 380V จะกลายเป็น 0.0000 V
- Single-Point Shield Ground: สายชีลด์ RS-485 ต้องต่อกราวด์ที่ตู้ Gateway จุดเดียว ห้ามต่อ 2 ฝั่ง
- 1-Based vs 0-Based Addressing: รีจิสเตอร์ 43060 ในคู่มือ ต้องคีย์เป็น 43059 ใน Gateway ที่เป็น 0-based
- BACnet Device Instance: ห้ามซ้ำกันทั่วทั้งโครงข่าย (0 - 4,194,302) มิฉะนั้นแพ็กเก็ตจะชนกัน
- 4-20mA Live Zero: ใช้เกณฑ์ NAMUR NE43 (<3.6mA) แยกแยะระหว่าง "อ่านได้ 0" กับ "สายสัญญาณขาด"

4. สถานะจุดตรวจสอบในระบบ SILA1 (จำนวนทั้งหมด ${computedPoints.length} จุด):
${computedPoints
  .map(
    (p, i) =>
      `[${i + 1}] ${p.tag} (${p.nameTh}) | ชนิด: ${p.signalType} | โปรโตคอล: ${p.vendorProtocol} | สถานะ: ${
        p.status === 'NORMAL' ? 'PASS (ปกติ)' : 'FAULT DETECTED (ผิดปกติ)'
      } | ค่าปัจจุบัน: ${p.currentReading}`
  )
  .join('\n')}
================================================================================
`.trim();

    navigator.clipboard.writeText(reportText).then(() => {
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 3000);
    });
  };

  return (
    <div className="flex flex-col gap-4 text-gray-200">
      {/* Top Banner & Quick Navigation */}
      <div className="bg-[#1e293b] border border-cyan-500/40 rounded-lg p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-700/70 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-400">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  รายงานการสอบสวน BAS PtoP และ PtoG & คู่มือสถาปัตยกรรมอินเตอร์เฟส
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  SILA1 SCADA / EPMS
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                การตรวจสอบ Point-to-Point (Physical Signal) และ Point-to-Gateway / Graphics (Protocol & Network) พร้อมระบบทดลองจำลองปัญหาจริง
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleRunDiagnostic}
              disabled={isDiagnosticRunning}
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer disabled:opacity-50"
              title="รันการทดสอบอัตโนมัติ 20/20 จุดเพื่อตรวจสอบความพร้อม"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosticRunning ? 'animate-spin' : ''}`} />
              <span>{isDiagnosticRunning ? 'กำลังสแกน...' : 'รันตรวจสอบอัตโนมัติ'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportReportText}
              className="px-3 py-1.5 rounded bg-[#334155] hover:bg-[#475569] text-cyan-200 border border-cyan-500/30 text-xs font-semibold transition flex items-center gap-1.5 shadow cursor-pointer"
              title="คัดลอกรายงานฉบับเต็มลงคลิปบอร์ด"
            >
              {exportCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">คัดลอกรายงานแล้ว!</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>คัดลอกรายงานฉบับเต็ม</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Diagnostic Notice Banner if test run */}
        {diagnosticReport && (
          <div
            className={`mt-3 p-2.5 rounded border text-xs flex items-center justify-between ${
              activeFaultIds.length === 0
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                : 'bg-amber-950/70 border-amber-500/50 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {activeFaultIds.length === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{diagnosticReport}</span>
            </div>
            {activeFaultIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllFaults}
                className="px-2 py-0.5 rounded bg-amber-700 hover:bg-amber-600 text-white font-bold text-[11px] cursor-pointer"
              >
                เคลียร์ปัญหาทั้งหมด
              </button>
            )}
          </div>
        )}

        {/* Sub-navigation tabs */}
        <div className="flex items-center gap-1.5 mt-3 pt-2 overflow-x-auto text-xs border-t border-gray-700/50">
          <button
            type="button"
            onClick={() => setActiveSubView('report')}
            className={`px-3 py-1.5 rounded font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'report'
                ? 'bg-cyan-600 text-white font-bold shadow'
                : 'bg-[#0f172a] hover:bg-[#1e293b] text-gray-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. รายงานการสอบสวนภาพรวม (Executive Summary)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('interfaces')}
            className={`px-3 py-1.5 rounded font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'interfaces'
                ? 'bg-cyan-600 text-white font-bold shadow'
                : 'bg-[#0f172a] hover:bg-[#1e293b] text-gray-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. แมทริกซ์ 6 อินเตอร์เฟส (Interfaces Matrix)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('protocols')}
            className={`px-3 py-1.5 rounded font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'protocols'
                ? 'bg-cyan-600 text-white font-bold shadow'
                : 'bg-[#0f172a] hover:bg-[#1e293b] text-gray-300'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>3. เจาะลึก 5 โปรโตคอลเวนเดอร์ (Protocols Deep-Dive)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('points')}
            className={`px-3 py-1.5 rounded font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'points'
                ? 'bg-cyan-600 text-white font-bold shadow'
                : 'bg-[#0f172a] hover:bg-[#1e293b] text-gray-300'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>4. ราย Point ที่ต้องคำนึงถึง ({computedPoints.length} Points)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('matrix')}
            className={`px-3 py-1.5 rounded font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'matrix'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow ring-1 ring-cyan-300'
                : 'bg-[#152738] hover:bg-[#1e3852] text-cyan-300 border border-cyan-500/40'
            }`}
            title="ตารางแมทริกซ์เชื่อมโยง SCADA Point (PtoP) สู่ Field Device Address และระบบป้องกันกราวด์ลูป (PtoG)"
          >
            <Table className="w-3.5 h-3.5 text-cyan-400" />
            <span>5. แมทริกซ์ PtoP & PtoG (Matrix Table)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('fault-lab')}
            className={`px-3 py-1.5 rounded font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'fault-lab'
                ? 'bg-amber-600 text-white font-bold shadow'
                : 'bg-[#3d240e] hover:bg-[#523114] text-amber-200 border border-amber-600/40'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>6. ห้องทดลองจำลองปัญหา ({activeFaultIds.length} Active Faults)</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: EXECUTIVE INVESTIGATION REPORT */}
      {activeSubView === 'report' && (
        <div className="flex flex-col gap-4">
          {/* Key Concept Comparison: PtoP vs PtoG */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PtoP Card */}
            <div className="bg-[#182234] border border-blue-500/40 rounded-lg p-4 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm border-b border-blue-500/30 pb-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span>BAS PtoP (Point-to-Point Testing) คืออะไร และตรวจอะไรบ้าง?</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed mb-3">
                  <strong className="text-white">PtoP</strong> คือการทดสอบและสอบสวนความถูกต้องเชิงกายภาพและคุณสมบัติทางไฟฟ้า
                  ระหว่างอุปกรณ์สนาม (Field Device เช่น เซนเซอร์, หน้าสัมผัส Aux Breaker, มิเตอร์ไฟฟ้า, วาล์วน้ำ, ATS)
                  ตรงเข้าไปยังแผงต่อสายหรือโมดูลรับสัญญาณของ Direct Digital Controller (DDC), PLC หรือ Gateway
                </p>
                <div className="bg-[#0f172a] p-3 rounded border border-gray-700/60 text-[11px] space-y-1.5 text-gray-300">
                  <div className="font-semibold text-blue-300">สิ่งสำคัญที่ต้องตรวจสอบระดับ PtoP:</div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-blue-400 font-bold">•</span>
                    <span><strong>Digital Inputs (DI):</strong> ขั้ว Wetting Voltage 24VDC, ค่าความต้านทานสัมผัส, Debounce Filter ป้องกัน Contact Bounce</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-blue-400 font-bold">•</span>
                    <span><strong>Analog Inputs (AI):</strong> สัญญาณ 4-20mA Current Loop Impedance (&lt; 500Ω), การต่อสาย 3-Wire PT100 เพื่อหักลบความต้านทานสาย</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-blue-400 font-bold">•</span>
                    <span><strong>RS-485 Serial Bus:</strong> ตรวจสอบขั้ว A/B (+/-), การต่อตัวต้านทาน 120Ω EOL สองจุดหัวท้าย, การจัดสายแบบ Daisy-Chain แท้ (ห้ามทำสายแยกกิ่ง T-Tap)</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-700/50 flex items-center justify-between text-[11px] text-blue-400">
                <span>เกณฑ์มาตรฐาน: ASHRAE Guideline 0 / Level 3 SAT</span>
                <span className="font-mono">Physical Layer (OSI Layer 1)</span>
              </div>
            </div>

            {/* PtoG Card */}
            <div className="bg-[#182234] border border-cyan-500/40 rounded-lg p-4 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm border-b border-cyan-500/30 pb-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span>BAS PtoG (Point-to-Gateway & Graphics / Ground) คืออะไร?</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed mb-3">
                  <strong className="text-white">PtoG</strong> มีสองมิติสำคัญในระบบ Data Center / EPMS:
                  1) <strong>Point-to-Gateway & Graphics:</strong> การทดสอบส่งผ่านข้อมูลจากตัวแปลงสัญญาณ (Gateway) ข้ามเครือข่าย IP สู่เซิร์ฟเวอร์ SCADA/BMS และแสดงผลบนภาพกราฟิกให้ตรงจุด
                  2) <strong>Point-to-Ground:</strong> การตรวจสอบระบบการต่อลงดินและฉนวน ป้องกันสัญญาณรบกวน Ground Loop
                </p>
                <div className="bg-[#0f172a] p-3 rounded border border-gray-700/60 text-[11px] space-y-1.5 text-gray-300">
                  <div className="font-semibold text-cyan-300">สิ่งสำคัญที่ต้องตรวจสอบระดับ PtoG:</div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong>Word / Endianness Swap:</strong> การแปลงค่า 32-bit Float จาก Modbus Registers (CD-AB vs AB-CD) ป้องกันการแสดงค่าเพี้ยนเป็นตัวเลขขยะ</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong>Addressing Offset:</strong> การชดเชย 1-Based (40001) และ 0-Based (0000) ในตารางแมปข้อมูลเพื่อไม่ให้อ่านข้ามรีจิสเตอร์</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong>Single-Point Shield Ground:</strong> การต่อสายชีลด์ลงกราวด์เพียงจุดเดียวที่ตู้ Gateway ตัดกระแสเหนี่ยวนำ 50Hz จากความต่างศักย์ของตู้ไฟฟ้า</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong>BACnet BBMD / Device ID:</strong> การกระจาย Broadcast ข้าม Subnet และการตรวจสอบไม่ให้หมายเลข Device Instance ชนกัน</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-700/50 flex items-center justify-between text-[11px] text-cyan-400">
                <span>เกณฑ์มาตรฐาน: ANSI/ASHRAE 135 / IEEE 1100</span>
                <span className="font-mono">Network & Application (OSI Layer 2-7)</span>
              </div>
            </div>
          </div>

          {/* Quick Summary Table: 6 Subsystems & Focus Protocols */}
          <div className="bg-[#1e293b] border border-gray-700 rounded-lg p-4 shadow-lg">
            <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>สรุปภาพรวมอินเตอร์เฟสและโปรโตคอลเวนเดอร์ที่ต้องโฟกัสใน SILA1</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0f172a] text-gray-300 border-b border-gray-700">
                    <th className="p-2.5 font-semibold">อินเตอร์เฟสระบบ (Subsystem Interface)</th>
                    <th className="p-2.5 font-semibold">ระดับความสำคัญ</th>
                    <th className="p-2.5 font-semibold">โปรโตคอลที่ต้องโฟกัส</th>
                    <th className="p-2.5 font-semibold">ตัวอย่างเวนเดอร์ในตลาด</th>
                    <th className="p-2.5 font-semibold">จุดวิกฤตที่ต้องคำนึงถึงที่สุด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-300">
                  {INTERFACE_SUMMARIES.map((inf) => (
                    <tr key={inf.interfaceId} className="hover:bg-[#253248] transition">
                      <td className="p-2.5 font-medium text-white">
                        <div>{inf.nameTh}</div>
                        <div className="text-[11px] text-gray-400">{inf.nameEn}</div>
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inf.criticality === 'CRITICAL_TIER_IV'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {inf.criticality.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <div className="flex flex-wrap gap-1">
                          {inf.protocols.map((p) => (
                            <span
                              key={p}
                              className="px-1.5 py-0.5 rounded bg-gray-800 text-cyan-300 text-[10px] border border-gray-700"
                            >
                              {p.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-2.5 text-gray-300">{inf.primaryVendors.join(', ')}</td>
                      <td className="p-2.5 text-amber-300 text-[11px] max-w-xs">
                        {inf.ptopKeyRisks[0]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Engineering Rules of Thumb */}
          <div className="bg-[#182234] border border-amber-500/30 rounded-lg p-4 shadow-lg">
            <h3 className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>กฎเหล็ก 5 ข้อสำหรับการตรวจสอบและส่งมอบงาน BAS PtoP และ PtoG (Golden Rules)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-gray-300">
              <div className="bg-[#0f172a] p-3 rounded border border-gray-700/60">
                <div className="font-bold text-cyan-400 mb-1">1. กฎการต่อสายชีลด์ลงดิน (Single Point Ground)</div>
                <p className="text-[11px] text-gray-400">
                  สาย Drain Wire ของชีลด์ RS-485 หรือสายสัญญาณ 4-20mA ต้องต่อลงดินที่ตู้ Gateway เพียงฝั่งเดียวเท่านั้น ห้ามต่อลงตู้ปลายทางเด็ดขาด เพื่อป้องกันกระแส Ground Loop จากศักย์ดินที่ต่างกัน
                </p>
              </div>
              <div className="bg-[#0f172a] p-3 rounded border border-gray-700/60">
                <div className="font-bold text-cyan-400 mb-1">2. กฎการทดสอบ Live Zero (NAMUR NE43)</div>
                <p className="text-[11px] text-gray-400">
                  สำหรับสัญญาณ 4-20mA สัญญาณช่วง 0.0 - 3.6 mA ให้ถือว่าเป็น "สายสัญญาณขาด / เซนเซอร์ชำรุด" (Sensor Fault) ไม่ใช่ค่า 0 หน่วย ต้องมีระบบแจ้งเตือนเพื่อไม่ให้ระบบนึกว่าค่าปกติ
                </p>
              </div>
              <div className="bg-[#0f172a] p-3 rounded border border-gray-700/60">
                <div className="font-bold text-cyan-400 mb-1">3. กฎการตรวจสอบ Endianness ของ Modbus</div>
                <p className="text-[11px] text-gray-400">
                  ก่อนเชื่อถือค่าตัวเลขทศนิยม 32-bit Float จากมิเตอร์หรือเบรกเกอร์ ให้เปิดหน้าต่างเปรียบเทียบค่าบนจอเครื่องจริงกับค่าบน SCADA เสมอ หากอ่านได้ 0 หรือเลขยกกำลังผิด ให้ทดสอบกด "Swap Words"
                </p>
              </div>
              <div className="bg-[#0f172a] p-3 rounded border border-gray-700/60">
                <div className="font-bold text-cyan-400 mb-1">4. กฎการป้องกัน Token Jamming บน BACnet</div>
                <p className="text-[11px] text-gray-400">
                  บนเครือข่าย BACnet MS/TP ต้องตั้งค่า Max-Master ให้ตรงกับเลข MAC สูงสุดจริงใน Loop และจำกัดค่า COV Increment ไม่ให้ส่งข้อมูลบ่อยเกินจำเป็นจนเกิด Broadcast Storm
                </p>
              </div>
              <div className="bg-[#0f172a] p-3 rounded border border-gray-700/60">
                <div className="font-bold text-cyan-400 mb-1">5. กฎ Contact Debounce ในระดับ PLC/DDC</div>
                <p className="text-[11px] text-gray-400">
                  หน้าสัมผัสของเบรกเกอร์ (Aux Switch) มักเกิดการกระเด้ง (Contact Bounce) ขณะตัดต่อ 5-15ms ต้องใส่ซอฟต์แวร์ฟิลเตอร์หน่วงเวลา 30-50ms ก่อนส่งแจ้งเตือน Alarm เพื่อป้องกันการส่ง Alarm ซ้ำ
                </p>
              </div>
              <div className="bg-[#0f172a] p-3 rounded border border-gray-700/60">
                <div className="font-bold text-cyan-400 mb-1">6. กฎการสอบเทียบ Sequence of Events (SOE)</div>
                <p className="text-[11px] text-gray-400">
                  อุปกรณ์ทุกตัวที่เชื่อมต่อ (Protection Relay, Gateway, SCADA Server) ต้อง Sync เวลาผ่าน NTP/SNTP Server เดียวกัน เพื่อให้การวิเคราะห์ลำดับเหตุการณ์หลังทริปมีความแม่นยำระดับ 1ms
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INTERFACES MATRIX & ARCHITECTURE */}
      {activeSubView === 'interfaces' && (
        <div className="flex flex-col gap-4">
          {/* Signal Pipeline Visual Flow */}
          <div className="bg-[#182234] border border-cyan-500/40 rounded-lg p-4 shadow-lg">
            <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Network className="w-4 h-4" />
              <span>สถาปัตยกรรมทางเดินข้อมูลจากระดับสนามสู่หน้าจอ SCADA (End-to-End Pipeline)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center text-xs">
              <div className="bg-[#0f172a] p-3 rounded border border-blue-500/40 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-blue-400 font-bold uppercase">ขั้นตอนที่ 1</div>
                  <div className="text-sm font-bold text-white mt-1">Field Instruments</div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    Sensors, CT/VT, Breaker Aux, ATS Contacts, Batteries
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-blue-300 bg-blue-950/60 py-1 rounded border border-blue-800">
                  Physical Signals
                </div>
              </div>

              <div className="bg-[#0f172a] p-3 rounded border border-amber-500/40 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-amber-400 font-bold uppercase">ขั้นตอนที่ 2 (PtoP)</div>
                  <div className="text-sm font-bold text-white mt-1">PtoP Termination</div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    Terminal Blocks, 24VDC Wetting, 120Ω EOL, Drain Wire
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-amber-300 bg-amber-950/60 py-1 rounded border border-amber-800">
                  Point-to-Point Testing
                </div>
              </div>

              <div className="bg-[#0f172a] p-3 rounded border border-cyan-500/40 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-cyan-400 font-bold uppercase">ขั้นตอนที่ 3 (Gateway)</div>
                  <div className="text-sm font-bold text-white mt-1">DDC / Gateway / PLC</div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    Protocol Translation (Modbus RTU to TCP, BACnet, SNMP)
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-cyan-300 bg-cyan-950/60 py-1 rounded border border-cyan-800">
                  Register Offset & Word Swap
                </div>
              </div>

              <div className="bg-[#0f172a] p-3 rounded border border-indigo-500/40 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-indigo-400 font-bold uppercase">ขั้นตอนที่ 4 (PtoG Net)</div>
                  <div className="text-sm font-bold text-white mt-1">OT IP Network</div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    Managed Ring Switches, VLAN, BBMD Routing, Port 502/47808
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-indigo-300 bg-indigo-950/60 py-1 rounded border border-indigo-800">
                  Point-to-Gateway Testing
                </div>
              </div>

              <div className="bg-[#0f172a] p-3 rounded border border-emerald-500/40 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-emerald-400 font-bold uppercase">ขั้นตอนที่ 5 (Graphics)</div>
                  <div className="text-sm font-bold text-white mt-1">SCADA / BAS Graphics</div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    HMI Animation, Real-time Gauges, Alarm Priorities, SQL Logs
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-emerald-300 bg-emerald-950/60 py-1 rounded border border-emerald-800">
                  Point-to-Graphics Verification
                </div>
              </div>
            </div>
          </div>

          {/* Cards for each Interface */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTERFACE_SUMMARIES.map((inf) => (
              <div
                key={inf.interfaceId}
                className="bg-[#1e293b] border border-gray-700 rounded-lg p-4 shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-gray-700 pb-2 mb-2">
                    <span className="font-bold text-white text-sm">{inf.nameTh}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inf.criticality === 'CRITICAL_TIER_IV'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {inf.criticality === 'CRITICAL_TIER_IV' ? 'Tier IV Critical' : 'Major Redundant'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{inf.scopeTh}</p>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-gray-400 font-medium">โปรโตคอล: </span>
                      <span className="text-cyan-300 font-mono text-[11px]">
                        {inf.protocols.join(' • ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">เวนเดอร์หลัก: </span>
                      <span className="text-gray-300">{inf.primaryVendors.join(', ')}</span>
                    </div>

                    <div className="bg-[#0f172a] p-2.5 rounded border border-gray-800 text-[11px] space-y-1">
                      <div className="font-bold text-amber-300">ความเสี่ยงหลักระดับ PtoP:</div>
                      <p className="text-gray-400">{inf.ptopKeyRisks[0]}</p>
                      <div className="font-bold text-cyan-300 mt-1.5">ความเสี่ยงหลักระดับ PtoG:</div>
                      <p className="text-gray-400">{inf.ptogKeyRisks[0]}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-800 text-[10px] text-gray-400 flex items-center justify-between">
                  <span>SLA: {inf.standardSLA}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubsystem(
                        inf.interfaceId === 'INT-HV'
                          ? 'HV_SWITCHGEAR'
                          : inf.interfaceId === 'INT-MDB'
                          ? 'MDB_LV'
                          : inf.interfaceId === 'INT-ATS'
                          ? 'ATS_TRANSFER'
                          : inf.interfaceId === 'INT-GEN'
                          ? 'GENERATOR'
                          : inf.interfaceId === 'INT-UPS'
                          ? 'UPS_SYSTEM'
                          : 'HVAC_CHILLER'
                      );
                      setActiveSubView('points');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
                  >
                    ดู Points ในระบบนี้ &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: VENDOR PROTOCOLS DEEP DIVE */}
      {activeSubView === 'protocols' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {PROTOCOL_DEEP_DIVES.map((proto) => (
              <div
                key={proto.protocol}
                className="bg-[#1e293b] border border-cyan-500/30 rounded-lg p-4 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-gray-700 pb-2 mb-2">
                    <div>
                      <h3 className="font-bold text-white text-sm">{proto.titleTh}</h3>
                      <div className="text-[11px] text-cyan-400 font-mono">{proto.titleEn}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                      {proto.protocol}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 mb-3">{proto.descriptionTh}</p>

                  <div className="space-y-2 text-xs">
                    <div className="bg-[#0f172a] p-2 rounded border border-gray-800">
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-gray-400">ชั้นกายภาพ (Physical):</span>
                          <div className="text-gray-200 font-medium">{proto.physicalLayer}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">การส่งผ่าน (Transport):</span>
                          <div className="text-gray-200 font-medium">{proto.networkTransport}</div>
                        </div>
                      </div>
                    </div>

                    {/* PtoP Pitfalls */}
                    <div className="bg-[#241712] p-2.5 rounded border border-amber-800/40 text-[11px]">
                      <div className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>กับดักและข้อผิดพลาดระดับ PtoP (Physical & Wiring):</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-gray-300 pl-1">
                        {proto.pitfallsPtoP.map((pit, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {pit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* PtoG Pitfalls */}
                    <div className="bg-[#132230] p-2.5 rounded border border-cyan-800/40 text-[11px]">
                      <div className="font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                        <Network className="w-3.5 h-3.5 text-cyan-400" />
                        <span>กับดักและข้อผิดพลาดระดับ PtoG (Gateway, Offset & SCADA):</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-gray-300 pl-1">
                        {proto.pitfallsPtoG.map((pit, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {pit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Best Practices */}
                    <div className="bg-[#102418] p-2 rounded border border-emerald-800/40 text-[11px]">
                      <div className="font-bold text-emerald-300 mb-1 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>แนวทางปฏิบัติทางวิศวกรรมที่ดีที่สุด (Best Practices):</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-gray-300 pl-1">
                        {proto.recommendedBestPractices.map((bp, idx) => (
                          <li key={idx}>{bp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-800 text-[11px] text-gray-400 flex items-center justify-between">
                  <span>เวนเดอร์หลัก: {proto.keyVendors.join(', ')}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProtocol(proto.protocol);
                      setActiveSubView('points');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
                  >
                    กรอง Point โปรโตคอลนี้ &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: POINT-BY-POINT CHECKLIST */}
      {activeSubView === 'points' && (
        <div className="flex flex-col gap-4">
          {/* Filter Bar */}
          <div className="bg-[#1e293b] border border-gray-700 rounded-lg p-3 shadow flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 flex-1 w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={pointSearch}
                  onChange={(e) => setPointSearch(e.target.value)}
                  placeholder="ค้นหา Tag, ชื่อภาษาไทย, หรือ Hardware Address..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#0f172a] border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={selectedSubsystem}
                onChange={(e) => setSelectedSubsystem(e.target.value as any)}
                className="bg-[#0f172a] border border-gray-700 rounded px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">ทุกลำดับระบบ (All Subsystems)</option>
                <option value="HV_SWITCHGEAR">ระบบไฟฟ้าแรงสูง 22kV</option>
                <option value="TRANSFORMER">หม้อแปลงไฟฟ้า</option>
                <option value="MDB_LV">สวิตช์บอร์ดแรงต่ำ MDB</option>
                <option value="ATS_TRANSFER">สวิตช์ ATS</option>
                <option value="GENERATOR">เครื่องกำเนิดไฟฟ้า</option>
                <option value="UPS_SYSTEM">ระบบสำรองไฟ UPS</option>
                <option value="BATTERY_BMS">ระบบแบตเตอรี่ BMS</option>
                <option value="HVAC_CHILLER">ระบบปรับอากาศ Chiller</option>
              </select>

              <select
                value={selectedProtocol}
                onChange={(e) => setSelectedProtocol(e.target.value as any)}
                className="bg-[#0f172a] border border-gray-700 rounded px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">ทุกโปรโตคอล (All Protocols)</option>
                <option value="MODBUS_RTU">Modbus RTU</option>
                <option value="MODBUS_TCP">Modbus TCP</option>
                <option value="BACNET_IP">BACnet IP</option>
                <option value="SNMP_V2_V3">SNMP v2/v3</option>
                <option value="HARDWIRED_IO">Hardwired I/O</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 whitespace-nowrap">
              <span>แสดง {filteredPoints.length} จาก {computedPoints.length} รายการ</span>
              {(selectedSubsystem !== 'ALL' || selectedProtocol !== 'ALL' || pointSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setPointSearch('');
                    setSelectedSubsystem('ALL');
                    setSelectedProtocol('ALL');
                  }}
                  className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-[11px] cursor-pointer"
                >
                  ล้างตัวกรอง
                </button>
              )}
            </div>
          </div>

          {/* Points Table */}
          <div className="bg-[#1e293b] border border-gray-700 rounded-lg overflow-hidden shadow-lg">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#0f172a] text-gray-300 sticky top-0 z-10 border-b border-gray-700 shadow">
                  <tr>
                    <th className="p-2.5 font-semibold">Point ID & Tag</th>
                    <th className="p-2.5 font-semibold">ชื่อสัญญาณ & อุปกรณ์</th>
                    <th className="p-2.5 font-semibold">ชนิดสัญญาณ & โปรโตคอล</th>
                    <th className="p-2.5 font-semibold">Hardware Address & Data Type</th>
                    <th className="p-2.5 font-semibold">ค่าปัจจุบัน / จำลอง</th>
                    <th className="p-2.5 font-semibold">สถานะตรวจเช็ค</th>
                    <th className="p-2.5 font-semibold text-center">ดูรายละเอียด & จุดระวัง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-300">
                  {filteredPoints.map((point) => (
                    <tr
                      key={point.id}
                      className={`hover:bg-[#253248] transition cursor-pointer ${
                        point.status === 'SIMULATED_FAULT' ? 'bg-amber-950/30' : ''
                      }`}
                      onClick={() => setSelectedPointDetail(point)}
                    >
                      <td className="p-2.5 font-mono">
                        <div className="font-bold text-white text-xs">{point.tag}</div>
                        <div className="text-[10px] text-gray-400">{point.id}</div>
                      </td>
                      <td className="p-2.5">
                        <div className="font-medium text-white">{point.nameTh}</div>
                        <div className="text-[11px] text-cyan-400 font-mono">{point.nameEn}</div>
                        <div className="text-[10px] text-gray-400">{point.subsystemName}</div>
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold text-[10px] border border-blue-700">
                            {point.signalType}
                          </span>
                          <span className="text-[11px] text-gray-300 font-mono">
                            {point.vendorProtocol}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{point.vendorExample}</div>
                      </td>
                      <td className="p-2.5">
                        <div className="font-mono text-[11px] text-gray-200">{point.hardwareAddress}</div>
                        <div className="text-[10px] text-gray-400">{point.dataType}</div>
                      </td>
                      <td className="p-2.5 font-mono">
                        <span
                          className={`font-semibold ${
                            point.status === 'SIMULATED_FAULT' ? 'text-amber-400 font-bold' : 'text-emerald-300'
                          }`}
                        >
                          {point.currentReading}
                        </span>
                        <div className="text-[10px] text-gray-500">Nominal: {point.nominalValue}</div>
                      </td>
                      <td className="p-2.5">
                        {point.status === 'NORMAL' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>PASS / ปกติ</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>FAULT DETECTED</span>
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPointDetail(point);
                          }}
                          className="px-2 py-1 rounded bg-[#334155] hover:bg-[#475569] text-cyan-300 text-[11px] font-semibold transition cursor-pointer"
                        >
                          ตรวจดูเจาะลึก
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal / Flyout for Detailed Point Inspection */}
          {selectedPointDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
              <div className="bg-[#1e293b] border border-cyan-500/50 rounded-lg max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded bg-cyan-950 text-cyan-400 border border-cyan-700">
                      <Binary className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{selectedPointDetail.tag}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900 text-blue-200">
                          {selectedPointDetail.signalType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{selectedPointDetail.nameTh}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPointDetail(null)}
                    className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-[#0f172a] p-3 rounded border border-gray-800">
                  <div>
                    <span className="text-gray-400">ระบบย่อย:</span>
                    <div className="text-white font-medium">{selectedPointDetail.subsystemName}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">อุปกรณ์เป้าหมาย:</span>
                    <div className="text-cyan-300 font-mono">{selectedPointDetail.equipmentId}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">โปรโตคอล / เวนเดอร์:</span>
                    <div className="text-white font-medium">
                      {selectedPointDetail.vendorProtocol} ({selectedPointDetail.vendorExample})
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">ฮาร์ดแวร์แอดเดรส:</span>
                    <div className="text-cyan-300 font-mono">{selectedPointDetail.hardwareAddress}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">รูปแบบข้อมูล (Data Type):</span>
                    <div className="text-gray-200 font-mono">{selectedPointDetail.dataType}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">หน่วยวัด & ค่าปกติ:</span>
                    <div className="text-emerald-400 font-bold">
                      {selectedPointDetail.nominalValue} ({selectedPointDetail.engineeringUnit})
                    </div>
                  </div>
                </div>

                {/* PtoP and PtoG Checkpoints */}
                <div className="space-y-3 text-xs">
                  <div className="bg-[#1f293d] border border-blue-500/40 p-3 rounded">
                    <div className="font-bold text-blue-400 mb-1 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span>จุดที่ต้องคำนึงถึงระดับ PtoP (Physical Wiring & Signal):</span>
                    </div>
                    <p className="text-gray-300 leading-relaxed pl-3.5">
                      {selectedPointDetail.ptopCheckpointTh}
                    </p>
                  </div>

                  <div className="bg-[#192b3a] border border-cyan-500/40 p-3 rounded">
                    <div className="font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>จุดที่ต้องคำนึงถึงระดับ PtoG (Gateway, Offset, Graphics & SCADA):</span>
                    </div>
                    <p className="text-gray-300 leading-relaxed pl-3.5">
                      {selectedPointDetail.ptogCheckpointTh}
                    </p>
                  </div>

                  <div className="bg-[#1a2d24] border border-emerald-500/40 p-3 rounded">
                    <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ระเบียบวิธีการทดสอบ Commissioning (Test Method):</span>
                    </div>
                    <p className="text-gray-300 leading-relaxed pl-5">
                      {selectedPointDetail.testMethodTh}
                    </p>
                  </div>

                  {selectedPointDetail.faultMessage && (
                    <div className="bg-[#381a1a] border border-red-500/50 p-3 rounded text-red-300">
                      <div className="font-bold text-red-400 mb-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span>อาการจำลองความผิดปกติ (Simulated Active Fault):</span>
                      </div>
                      <p className="leading-relaxed pl-5">{selectedPointDetail.faultMessage}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => setSelectedPointDetail(null)}
                    className="px-4 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 5: DETAILED SCADA POINT-TO-POINT TO GROUND MATRIX TABLE */}
      {activeSubView === 'matrix' && (
        <DetailedPtoPMatrixView
          onNavigateToTab={onNavigateToTab}
          onNavigateToEquipment={onNavigateToEquipment}
          activeFaultIds={activeFaultIds}
          onToggleFault={handleToggleFault}
        />
      )}

      {/* VIEW 6: INTERACTIVE FAULT LAB & DIAGNOSTIC TESTER */}
      {activeSubView === 'fault-lab' && (
        <div className="flex flex-col gap-4">
          <div className="bg-[#2a1b14] border border-amber-600/40 rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-amber-600/30 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold text-amber-200">
                  ห้องทดลองจำลองความผิดปกติจริงของ BAS PtoP และ PtoG (Field Fault Injection Lab)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {activeFaultIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllFaults}
                    className="px-2.5 py-1 rounded bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold transition cursor-pointer"
                  >
                    ล้างการจำลองปัญหาทั้งหมด ({activeFaultIds.length})
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-300 mb-4">
              คลิกเปิดการจำลองเหตุการณ์ข้อผิดพลาดจริงที่พบบ่อยที่สุดในการทำ Commissioning เพื่อสังเกตอาการ
              ดูสาเหตุทางวิศวกรรม (Root Cause) และวิธีตรวจสอบแก้ไขตามมาตรฐานสากล
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SIMULATED_FAULTS.map((fault) => {
                const isActive = activeFaultIds.includes(fault.id);
                return (
                  <div
                    key={fault.id}
                    className={`p-3.5 rounded-lg border transition flex flex-col justify-between ${
                      isActive
                        ? 'bg-[#3b1c1c] border-red-500 shadow-md ring-1 ring-red-400/50'
                        : 'bg-[#182234] border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            fault.category === 'PtoP'
                              ? 'bg-blue-900 text-blue-200 border border-blue-700'
                              : 'bg-cyan-900 text-cyan-200 border border-cyan-700'
                          }`}
                        >
                          หมวด {fault.category}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">{fault.code}</span>
                      </div>

                      <h4 className="text-xs font-bold text-white mb-1">{fault.titleTh}</h4>
                      <div className="text-[10px] text-gray-400 font-mono mb-2">{fault.titleEn}</div>

                      <div className="bg-[#0f172a] p-2 rounded border border-gray-800 text-[11px] space-y-1 mb-2">
                        <div>
                          <strong className="text-amber-400">อาการที่พบ (Symptom):</strong>
                          <p className="text-gray-300 leading-snug">{fault.symptomTh}</p>
                        </div>
                        <div>
                          <strong className="text-cyan-400">สาเหตุรากเหง้า (Root Cause):</strong>
                          <p className="text-gray-400 leading-snug">{fault.rootCauseTh}</p>
                        </div>
                        <div>
                          <strong className="text-emerald-400">แนวทางแก้ไข (Resolution):</strong>
                          <p className="text-emerald-300 leading-snug">{fault.resolutionTh}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">
                        กระทบ {fault.affectedPointIds.length} จุด
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleFault(fault.id)}
                        className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                          isActive
                            ? 'bg-red-600 hover:bg-red-500 text-white shadow'
                            : 'bg-[#293548] hover:bg-[#384963] text-gray-200'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-white" />
                            <span>กำลังจำลองปัญหา (Active)</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>จำลองปัญหานี้</span>
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
      )}
    </div>
  );
};

export { BasPtoPtoGView } from './BasPtoPtoGView';
