import React, { useState, useMemo } from 'react';
import {
  Table,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Network,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Zap,
  Info,
  Server,
  Terminal,
  Activity,
  ArrowRight,
  Flame,
  Check,
  ExternalLink,
  Radio,
  Binary,
  HelpCircle,
} from 'lucide-react';
import {
  BAS_POINT_CHECKLIST,
  type BasPointItem,
  type SubsystemType,
  type VendorProtocolType,
  type GroundLoopStatusType,
} from '../simulator/basPtopData';
import { soundEffects } from '../utils/sound';

export interface BasPtoPtoGViewProps {
  onNavigateToTab?: (tab: any) => void;
  onNavigateToEquipment?: (tab: any, elementId: string) => void;
  activeFaultIds?: string[];
  onToggleFault?: (faultId: string) => void;
}

export const BasPtoPtoGView: React.FC<BasPtoPtoGViewProps> = ({
  onNavigateToTab,
  onNavigateToEquipment,
  activeFaultIds = [],
  onToggleFault,
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterSubsystem, setFilterSubsystem] = useState<SubsystemType | 'ALL'>('ALL');
  const [filterProtocol, setFilterProtocol] = useState<VendorProtocolType | 'ALL'>('ALL');
  const [filterGroundStatus, setFilterGroundStatus] = useState<GroundLoopStatusType | 'ALL'>('ALL');
  const [selectedPoint, setSelectedPoint] = useState<BasPointItem | null>(null);
  const [isCopiedTsv, setIsCopiedTsv] = useState<boolean>(false);

  // Compute live matrix records with active simulated fault reflections
  const matrixData = useMemo(() => {
    const hasShieldLoopFault = activeFaultIds.includes('FAULT-02');
    const hasWordSwapFault = activeFaultIds.includes('FAULT-01');
    const hasRegisterShiftFault = activeFaultIds.includes('FAULT-03');
    const hasBrokenLoopFault = activeFaultIds.includes('FAULT-05');
    const hasNoTermFault = activeFaultIds.includes('FAULT-06');
    const hasBacnetDupFault = activeFaultIds.includes('FAULT-04');

    return BAS_POINT_CHECKLIST.map((item) => {
      let groundStatus: GroundLoopStatusType = item.groundLoopStatus;
      let groundDesc = item.groundLoopPtoG;
      let regOffset = item.registerOffset;
      let currentVal = item.nominalValue;
      let isFault = false;
      let faultReason = '';

      // Check for Shield Ground Loop fault (affects RS-485 PT-03, PT-08)
      if (hasShieldLoopFault && (item.id === 'PT-03' || item.id === 'PT-08')) {
        groundStatus = 'GROUND_LOOP_RISK';
        groundDesc =
          'CRITICAL GROUND LOOP DETECTED: Shield Drain wire grounded at BOTH ends (Gateway + Switchboard chassis). 50Hz AC circulating current causing CRC corruption!';
        isFault = true;
        faultReason = '50Hz Ground Loop Circulating Noise';
      }

      // Check Word Swap
      if (hasWordSwapFault && (item.id === 'PT-03' || item.id === 'PT-04')) {
        currentVal = '0.000000 V (Word Swap)';
        isFault = true;
        faultReason = 'Modbus Float32 Word Order Inverted (CD-AB)';
      }

      // Check Register Offset Shift
      if (hasRegisterShiftFault && (item.id === 'PT-04' || item.id === 'PT-15')) {
        regOffset = `${item.registerOffset} -> SHIFTED TO 43061 (0-based mismatch)`;
        isFault = true;
        faultReason = '1-Based to 0-Based Offset Shift Error';
      }

      // Check 4-20mA Broken Loop
      if (hasBrokenLoopFault && (item.id === 'PT-02' || item.id === 'PT-11')) {
        currentVal = '0.0 mA (Loop Broken < 3.6mA)';
        isFault = true;
        faultReason = 'NAMUR NE43 Current Loop Broken Wire Alert';
      }

      return {
        ...item,
        groundLoopStatus: groundStatus,
        groundLoopPtoG: groundDesc,
        registerOffset: regOffset,
        currentReading: currentVal,
        isFault,
        faultReason,
      };
    });
  }, [activeFaultIds]);

  // Filtered Matrix Rows
  const filteredMatrix = useMemo(() => {
    return matrixData.filter((item) => {
      const matchSearch =
        searchTerm === '' ||
        item.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nameTh.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.registerOffset.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vendorProtocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hardwareAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.groundLoopPtoG.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSubsystem =
        filterSubsystem === 'ALL' || item.subsystem === filterSubsystem;
      const matchProtocol =
        filterProtocol === 'ALL' || item.vendorProtocol === filterProtocol;
      const matchGround =
        filterGroundStatus === 'ALL' || item.groundLoopStatus === filterGroundStatus;

      return matchSearch && matchSubsystem && matchProtocol && matchGround;
    });
  }, [matrixData, searchTerm, filterSubsystem, filterProtocol, filterGroundStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = matrixData.length;
    const modbusCount = matrixData.filter(
      (m) => m.vendorProtocol === 'MODBUS_RTU' || m.vendorProtocol === 'MODBUS_TCP'
    ).length;
    const hardwiredCount = matrixData.filter((m) => m.vendorProtocol === 'HARDWIRED_IO').length;
    const bacnetSnmpCount = matrixData.filter(
      (m) => m.vendorProtocol === 'BACNET_IP' || m.vendorProtocol === 'SNMP_V2_V3'
    ).length;
    const singlePointCount = matrixData.filter(
      (m) => m.groundLoopStatus === 'SINGLE_POINT_GROUNDED'
    ).length;
    const galvanicCount = matrixData.filter(
      (m) => m.groundLoopStatus === 'GALVANIC_ISOLATED'
    ).length;
    const riskCount = matrixData.filter(
      (m) => m.groundLoopStatus === 'GROUND_LOOP_RISK' || m.isFault
    ).length;

    return {
      total,
      modbusCount,
      hardwiredCount,
      bacnetSnmpCount,
      singlePointCount,
      galvanicCount,
      riskCount,
    };
  }, [matrixData]);

  // Export Matrix Table as TSV for pasting directly into Excel or Google Sheets
  const handleCopyTsv = () => {
    const headers = [
      'SCADA Point Tag (PtoP)',
      'Signal Name (TH)',
      'Device Name',
      'Register Offset',
      'Protocol',
      'Signal Type',
      'Field Device Address (PtoP)',
      'Ground Loop Topology (PtoG)',
      'Grounding Status',
      'Nominal Value',
      'Current Reading',
    ];

    const rows = filteredMatrix.map((r) => [
      r.tag,
      r.nameTh,
      r.deviceName,
      r.registerOffset,
      r.vendorProtocol,
      r.signalType,
      r.hardwareAddress,
      r.groundLoopPtoG,
      r.groundLoopStatus,
      r.nominalValue,
      r.currentReading ?? r.nominalValue,
    ]);

    const tsvContent = [headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n');

    navigator.clipboard.writeText(tsvContent).then(() => {
      setIsCopiedTsv(true);
      soundEffects.playResetTone();
      setTimeout(() => setIsCopiedTsv(false), 2500);
    });
  };

  // Export as CSV File
  const handleDownloadCsv = () => {
    const headers = [
      'Point_Tag',
      'Signal_Name',
      'Device_Name',
      'Register_Offset',
      'Protocol',
      'Signal_Type',
      'Field_Address',
      'Ground_Loop_PtoG',
      'Ground_Status',
      'Nominal_Value',
    ];

    const csvRows = filteredMatrix.map((r) => [
      `"${r.tag}"`,
      `"${r.nameTh}"`,
      `"${r.deviceName}"`,
      `"${r.registerOffset}"`,
      `"${r.vendorProtocol}"`,
      `"${r.signalType}"`,
      `"${r.hardwareAddress}"`,
      `"${r.groundLoopPtoG.replace(/"/g, '""')}"`,
      `"${r.groundLoopStatus}"`,
      `"${r.nominalValue}"`,
    ]);

    const csvString = '\uFEFF' + [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SILA1_BAS_PtoP_to_PtoG_Matrix_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    soundEffects.playResetTone();
  };

  return (
    <div className="flex flex-col gap-4 text-gray-200">
      {/* Matrix Header Banner */}
      <div className="bg-[#182334] border border-cyan-500/40 rounded-lg p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-700/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-400">
              <Table className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  ตารางแมทริกซ์เชื่อมโยง SCADA PtoP สู่ Field Device Address & กราวด์ลูป PtoG
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  PtoP & PtoG Mapping Matrix
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                ตารางแมปข้อมูลทางวิศวกรรม: กำหนดตำแหน่ง Register Offset, Field Device Name, Protocol, Signal Type และระบบป้องกัน Ground Loop แบบครบถ้วน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyTsv}
              className="px-3 py-1.5 rounded bg-[#27405c] hover:bg-[#345376] text-cyan-200 border border-cyan-500/40 text-xs font-semibold transition flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
              title="คัดลอกตารางแมทริกซ์ (TSV) สำหรับวางลงใน Microsoft Excel หรือ Google Sheets"
            >
              {isCopiedTsv ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">คัดลอกลงคลิปบอร์ดแล้ว!</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>คัดลอกลง Excel (TSV)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
              title="ดาวน์โหลดตารางแมทริกซ์เป็นไฟล์ CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด CSV</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Statistics Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-3 pt-1 text-xs">
          <div className="bg-[#0f172a] p-2.5 rounded border border-gray-700/60">
            <div className="text-[10px] text-gray-400 uppercase font-medium">Mapped Points</div>
            <div className="text-base font-bold text-white mt-0.5 flex items-center gap-1.5">
              <Binary className="w-4 h-4 text-cyan-400" />
              <span>{stats.total} จุด</span>
            </div>
          </div>

          <div className="bg-[#0f172a] p-2.5 rounded border border-gray-700/60">
            <div className="text-[10px] text-gray-400 uppercase font-medium">Modbus RTU / TCP</div>
            <div className="text-base font-bold text-cyan-300 mt-0.5 flex items-center gap-1.5">
              <Network className="w-4 h-4 text-cyan-400" />
              <span>{stats.modbusCount} จุด</span>
            </div>
          </div>

          <div className="bg-[#0f172a] p-2.5 rounded border border-gray-700/60">
            <div className="text-[10px] text-gray-400 uppercase font-medium">Hardwired I/O</div>
            <div className="text-base font-bold text-blue-300 mt-0.5 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>{stats.hardwiredCount} จุด</span>
            </div>
          </div>

          <div className="bg-[#0f172a] p-2.5 rounded border border-gray-700/60">
            <div className="text-[10px] text-gray-400 uppercase font-medium">BACnet & SNMP</div>
            <div className="text-base font-bold text-purple-300 mt-0.5 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-purple-400" />
              <span>{stats.bacnetSnmpCount} จุด</span>
            </div>
          </div>

          <div className="bg-[#0f172a] p-2.5 rounded border border-gray-700/60">
            <div className="text-[10px] text-gray-400 uppercase font-medium">Single-Point Ground</div>
            <div className="text-base font-bold text-emerald-300 mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{stats.singlePointCount} จุด</span>
            </div>
          </div>

          <div
            className={`p-2.5 rounded border ${
              stats.riskCount > 0
                ? 'bg-red-950/70 border-red-500/60 text-red-200'
                : 'bg-[#0f172a] border-gray-700/60 text-gray-300'
            }`}
          >
            <div className="text-[10px] uppercase font-medium">
              {stats.riskCount > 0 ? 'Ground Loop Anomalies' : 'Ground Loop Integrity'}
            </div>
            <div
              className={`text-base font-bold mt-0.5 flex items-center gap-1.5 ${
                stats.riskCount > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
              }`}
            >
              {stats.riskCount > 0 ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>{stats.riskCount} เสี่ยงกราวด์ลูป</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>100% ปกติ</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#1e293b] border border-gray-700 rounded-lg p-3 shadow flex flex-col md:flex-row gap-2.5 items-center justify-between text-xs">
        <div className="flex items-center gap-2 flex-1 w-full flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหา Point, Device Name, Register Offset, หรือ Address..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#0f172a] border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={filterSubsystem}
            onChange={(e) => setFilterSubsystem(e.target.value as any)}
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
            value={filterProtocol}
            onChange={(e) => setFilterProtocol(e.target.value as any)}
            className="bg-[#0f172a] border border-gray-700 rounded px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">ทุกโปรโตคอล (All Protocols)</option>
            <option value="MODBUS_RTU">Modbus RTU</option>
            <option value="MODBUS_TCP">Modbus TCP</option>
            <option value="BACNET_IP">BACnet IP</option>
            <option value="SNMP_V2_V3">SNMP v2/v3</option>
            <option value="HARDWIRED_IO">Hardwired I/O</option>
          </select>

          <select
            value={filterGroundStatus}
            onChange={(e) => setFilterGroundStatus(e.target.value as any)}
            className="bg-[#0f172a] border border-gray-700 rounded px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">ทุกสถานะกราวด์ (All Grounding)</option>
            <option value="SINGLE_POINT_GROUNDED">Single-Point Earth (ลงดินจุดเดียว)</option>
            <option value="GALVANIC_ISOLATED">Galvanic Isolated (แยกทางกายภาพ)</option>
            <option value="FLOATING_SHIELD">Floating Shield (ชีลด์ลอย)</option>
            <option value="GROUND_LOOP_RISK">Ground Loop Risk (เสี่ยงกระแสลูป)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-gray-400 whitespace-nowrap self-end md:self-center">
          <span>แสดง {filteredMatrix.length} จาก {matrixData.length} จุด</span>
          {(filterSubsystem !== 'ALL' ||
            filterProtocol !== 'ALL' ||
            filterGroundStatus !== 'ALL' ||
            searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterSubsystem('ALL');
                setFilterProtocol('ALL');
                setFilterGroundStatus('ALL');
              }}
              className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-[11px] cursor-pointer"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* DETAILED MATRIX TABLE */}
      <div className="bg-[#1e293b] border border-gray-700 rounded-lg overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[680px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0f172a] text-gray-300 sticky top-0 z-10 border-b border-gray-700 shadow-md select-none">
              <tr>
                <th className="p-2.5 font-semibold">SCADA Point (PtoP)</th>
                <th className="p-2.5 font-semibold">Device Name (Field Target)</th>
                <th className="p-2.5 font-semibold">Register Offset</th>
                <th className="p-2.5 font-semibold">Protocol</th>
                <th className="p-2.5 font-semibold">Signal Type</th>
                <th className="p-2.5 font-semibold">Field Device Address</th>
                <th className="p-2.5 font-semibold min-w-[280px]">Ground Loop & Isolation (PtoG)</th>
                <th className="p-2.5 font-semibold text-center">Ground Status</th>
                <th className="p-2.5 font-semibold">Nominal / Value</th>
                <th className="p-2.5 font-semibold text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {filteredMatrix.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedPoint(row)}
                  className={`hover:bg-[#253248] transition cursor-pointer ${
                    row.isFault ? 'bg-red-950/30' : ''
                  }`}
                >
                  {/* Column 1: SCADA Point */}
                  <td className="p-2.5 font-mono">
                    <div className="font-bold text-white text-xs">{row.tag}</div>
                    <div className="text-[10px] text-gray-400">{row.id} • {row.subsystemName}</div>
                  </td>

                  {/* Column 2: Device Name */}
                  <td className="p-2.5">
                    <div className="font-medium text-white">{row.deviceName}</div>
                    <div className="text-[10px] text-gray-400">{row.nameTh}</div>
                  </td>

                  {/* Column 3: Register Offset */}
                  <td className="p-2.5 font-mono text-cyan-300">
                    <div className="bg-[#0f172a] px-2 py-1 rounded border border-gray-800 text-[11px] inline-block font-semibold">
                      {row.registerOffset}
                    </div>
                  </td>

                  {/* Column 4: Protocol */}
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 font-bold text-[10px] border border-blue-700/60">
                      {row.vendorProtocol.replace('_', ' ')}
                    </span>
                    <div className="text-[10px] text-gray-400 mt-0.5">{row.vendorExample}</div>
                  </td>

                  {/* Column 5: Signal Type */}
                  <td className="p-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-gray-800 text-cyan-200 text-[10px] font-mono border border-gray-700">
                      {row.signalType}
                    </span>
                    <div className="text-[10px] text-gray-400 mt-0.5">{row.dataType}</div>
                  </td>

                  {/* Column 6: Field Device Address */}
                  <td className="p-2.5 font-mono text-[11px] text-gray-300">
                    {row.hardwareAddress}
                  </td>

                  {/* Column 7: Ground Loop (PtoG) */}
                  <td className="p-2.5 text-[11px]">
                    <div
                      className={`leading-relaxed ${
                        row.isFault ? 'text-red-300 font-semibold' : 'text-gray-300'
                      }`}
                    >
                      {row.groundLoopPtoG}
                    </div>
                    {row.faultReason && (
                      <div className="mt-1 text-[10px] text-amber-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{row.faultReason}</span>
                      </div>
                    )}
                  </td>

                  {/* Column 8: Ground Status Badge */}
                  <td className="p-2.5 text-center">
                    {row.groundLoopStatus === 'SINGLE_POINT_GROUNDED' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Single-Point</span>
                      </span>
                    )}
                    {row.groundLoopStatus === 'GALVANIC_ISOLATED' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                        <Zap className="w-3 h-3 text-blue-400" />
                        <span>Isolated</span>
                      </span>
                    )}
                    {row.groundLoopStatus === 'FLOATING_SHIELD' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        <Activity className="w-3 h-3 text-purple-400" />
                        <span>Floating</span>
                      </span>
                    )}
                    {row.groundLoopStatus === 'GROUND_LOOP_RISK' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span>Ground Loop</span>
                      </span>
                    )}
                  </td>

                  {/* Column 9: Value */}
                  <td className="p-2.5 font-mono text-xs">
                    <span
                      className={`font-semibold ${
                        row.isFault ? 'text-red-400 font-bold' : 'text-emerald-300'
                      }`}
                    >
                      {row.currentReading ?? row.nominalValue}
                    </span>
                    <div className="text-[10px] text-gray-500">Nom: {row.nominalValue}</div>
                  </td>

                  {/* Column 10: Inspect */}
                  <td className="p-2.5 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPoint(row);
                      }}
                      className="px-2 py-1 rounded bg-[#334155] hover:bg-[#475569] text-cyan-300 text-[11px] font-semibold transition cursor-pointer"
                    >
                      เจาะลึก
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECTION MODAL FOR POINT-TO-GROUND TOPOLOGY */}
      {selectedPoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="bg-[#1e293b] border border-cyan-500/60 rounded-lg max-w-3xl w-full p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-700 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-700">
                  <Table className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{selectedPoint.tag}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900 text-blue-200">
                      {selectedPoint.signalType}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-cyan-300">
                      {selectedPoint.vendorProtocol.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedPoint.nameTh}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPoint(null)}
                className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Spec Matrix Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#0f172a] p-3.5 rounded border border-gray-800">
              <div>
                <span className="text-gray-400">ชื่ออุปกรณ์ (Device Name):</span>
                <div className="text-white font-bold mt-0.5">{selectedPoint.deviceName}</div>
              </div>
              <div>
                <span className="text-gray-400">Register Offset:</span>
                <div className="text-cyan-300 font-mono font-bold mt-0.5">
                  {selectedPoint.registerOffset}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Field Device Address:</span>
                <div className="text-gray-200 font-mono mt-0.5">{selectedPoint.hardwareAddress}</div>
              </div>
              <div>
                <span className="text-gray-400">โปรโตคอล / เวนเดอร์:</span>
                <div className="text-gray-200 font-medium mt-0.5">
                  {selectedPoint.vendorProtocol} ({selectedPoint.vendorExample})
                </div>
              </div>
              <div>
                <span className="text-gray-400">Data Type / Format:</span>
                <div className="text-gray-300 font-mono mt-0.5">{selectedPoint.dataType}</div>
              </div>
              <div>
                <span className="text-gray-400">Nominal Reading:</span>
                <div className="text-emerald-400 font-bold mt-0.5">
                  {selectedPoint.nominalValue} ({selectedPoint.engineeringUnit})
                </div>
              </div>
            </div>

            {/* PtoP and PtoG Isolation Deep-Dive Panels */}
            <div className="space-y-3 text-xs">
              {/* PtoG Ground Loop Architecture Panel */}
              <div className="bg-[#182334] border border-cyan-500/50 p-3.5 rounded-lg space-y-2">
                <div className="font-bold text-cyan-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>สถาปัตยกรรมกราวด์ลูปและการแยกสัญญาณ (PtoG Grounding & Isolation Topology)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                    {selectedPoint.groundLoopStatus}
                  </span>
                </div>
                <p className="text-gray-200 leading-relaxed bg-[#0f172a] p-2.5 rounded border border-gray-800">
                  {selectedPoint.groundLoopPtoG}
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400">
                  <div>
                    <span className="text-gray-500 font-semibold">หลักเกณฑ์การต่อลงดิน: </span>
                    <span className="text-gray-300">
                      Single-point earth at main cabinet (ห้ามต่อหัวท้าย 2 ฝั่ง)
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-semibold">พิกัดฉนวน (Galvanic Isolation): </span>
                    <span className="text-gray-300">1.5kV - 2.5kV RMS Optocoupled</span>
                  </div>
                </div>
              </div>

              {/* PtoP Physical Checkpoint Panel */}
              <div className="bg-[#1f293d] border border-blue-500/40 p-3.5 rounded-lg space-y-1.5">
                <div className="font-bold text-blue-300 flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span>การทดสอบระดับสนาม Point-to-Point (PtoP Checkpoint & Wire Verification)</span>
                </div>
                <p className="text-gray-300 leading-relaxed pl-3.5">
                  {selectedPoint.ptopCheckpointTh}
                </p>
              </div>

              {/* PtoG SCADA Mapping Checkpoint Panel */}
              <div className="bg-[#192b3a] border border-cyan-500/40 p-3.5 rounded-lg space-y-1.5">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span>การแมปเข้าสู่ Gateway และหน้าจอ SCADA (PtoG Mapping & Offset Checkpoint)</span>
                </div>
                <p className="text-gray-300 leading-relaxed pl-3.5">
                  {selectedPoint.ptogCheckpointTh}
                </p>
              </div>

              {/* Commissioning Test Procedure */}
              <div className="bg-[#1a2d24] border border-emerald-500/40 p-3.5 rounded-lg space-y-1.5">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>วิธีการทดสอบตรวจรับงาน (Commissioning Test Method)</span>
                </div>
                <p className="text-gray-300 leading-relaxed pl-5.5">
                  {selectedPoint.testMethodTh}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-700 text-xs">
              {onNavigateToEquipment && (
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedPoint;
                    setSelectedPoint(null);
                    onNavigateToEquipment(
                      target.subsystem === 'HV_SWITCHGEAR'
                        ? 'hv-diagram'
                        : target.subsystem === 'UPS_SYSTEM' || target.subsystem === 'BATTERY_BMS'
                        ? 'ups'
                        : target.subsystem === 'HVAC_CHILLER'
                        ? 'ac'
                        : 'ee',
                      target.equipmentId
                    );
                  }}
                  className="px-3 py-1.5 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-semibold transition cursor-pointer flex items-center gap-1"
                >
                  <span>กระโดดไปยังตำแหน่งอุปกรณ์บนผัง SCADA</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedPoint(null)}
                className="ml-auto px-4 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white font-semibold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
