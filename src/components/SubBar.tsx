import React from 'react';
import {
  RotateCcw,
  Zap,
  Sparkles,
  BatteryCharging,
  LayoutGrid,
  TrendingUp,
  ShieldCheck,
  Flame,
  Wrench,
  FileSpreadsheet,
  Activity,
  Network,
} from 'lucide-react';

export type ActiveTab =
  | 'ee'
  | 'power-path'
  | 'ups'
  | 'ups-efficiency'
  | 'up-tier'
  | 'maintenance'
  | 'kpi'
  | 'bas-ptop'
  | 'hv-diagram'
  | 'floor'
  | 'ac'
  | 'overview'
  | 'alarm-export';

interface SubBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onResetAll: () => void;
  onSimulateOutage: () => void;
  onSimulateMdbTrip: () => void;
  onSimulateUpsDrill?: () => void;
  alarmCountByTab?: Partial<Record<ActiveTab, number>>;
}

export const SubBar: React.FC<SubBarProps> = ({
  activeTab,
  onTabChange,
  onResetAll,
  onSimulateOutage,
  onSimulateMdbTrip,
  onSimulateUpsDrill,
  alarmCountByTab = {},
}) => {
  return (
    <div className="sub-bar bg-[#3c3c3c] px-3 sm:px-5 py-2 flex flex-wrap gap-2 items-center border-b border-[#555] text-xs text-gray-200 select-none">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-semibold text-gray-400 text-[11px] hidden sm:inline">SUMMARY ▼</span>
        <button
          type="button"
          onClick={() => onTabChange('ee')}
          className={`sub-btn px-2.5 py-1 rounded text-white font-medium transition cursor-pointer text-xs flex items-center gap-1 ${
            activeTab === 'ee' ? 'active bg-[#007acc] ring-1 ring-blue-300 font-bold' : 'bg-[#555] hover:bg-[#666]'
          }`}
        >
          <span>EE SUMMARY</span>
          {(alarmCountByTab['ee'] ?? 0) > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange('power-path')}
          className={`sub-btn px-2.5 py-1 rounded text-white font-medium transition cursor-pointer text-xs flex items-center gap-1 ${
            activeTab === 'power-path'
              ? 'active bg-gradient-to-r from-cyan-700 to-blue-700 ring-1 ring-cyan-300 font-bold shadow-md'
              : 'bg-[#213547] hover:bg-[#2b445b] text-cyan-300 border border-cyan-500/40'
          }`}
          title="จำลองการสับเส้นทางเดินไฟทุกระบบ & การนับถอยหลังการยอมรับแต่ละ Tier SLA พร้อมแนวทางแก้ไขปัญหา"
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold">PATH REROUTE & TIER SLA</span>
          {(alarmCountByTab['power-path'] ?? 0) > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange('hv-diagram')}
          className={`sub-btn px-2.5 py-1 rounded text-white font-medium transition cursor-pointer text-xs flex items-center gap-1 ${
            activeTab === 'hv-diagram' ? 'active bg-[#007acc] ring-1 ring-blue-300 font-bold' : 'bg-[#555] hover:bg-[#666]'
          }`}
          title="PEA 22kV 3PH 3W, Schneider RM6 24kV และหม้อแปลง Ekarat 2000kVA Dyn11"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>HV 22kV DIAGRAM</span>
          {(alarmCountByTab['hv-diagram'] ?? 0) > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange('ups')}
          className={`sub-btn px-2.5 py-1 rounded text-white font-medium transition cursor-pointer text-xs flex items-center gap-1 ${
            activeTab === 'ups' ? 'active bg-[#007acc] ring-1 ring-blue-300 font-bold' : 'bg-[#555] hover:bg-[#666]'
          }`}
        >
          <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          <span>UPS 3A/3B</span>
          {(alarmCountByTab['ups'] ?? 0) > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange('ups-efficiency')}
          className={`sub-btn px-2.5 py-1 rounded text-white font-medium transition cursor-pointer text-xs flex items-center gap-1 ${
            activeTab === 'ups-efficiency' ? 'active bg-[#007acc] ring-1 ring-blue-300 font-bold' : 'bg-[#555] hover:bg-[#666]'
          }`}
          title="วิเคราะห์ประสิทธิภาพ Pin vs Pout และ 60-Module Thermal Loss Heat Map"
        >
          <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
          <span>UPS EFFICIENCY</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('up-tier')}
          className={`sub-btn px-2.5 py-1 rounded text-white font-medium transition cursor-pointer text-xs flex items-center gap-1 ${
            activeTab === 'up-tier' ? 'active bg-emerald-700 ring-1 ring-emerald-300 font-bold' : 'bg-[#2a4532] hover:bg-[#395c43] text-emerald-300'
          }`}
          title="จำลองการอัปเกรดเป็น Tier IV Fault Tolerant 2(N+1) พร้อมการตัดแยกความผิดพร่องอัตโนมัติ"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold">UP-TIER SIM</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('maintenance')}
          className={`sub-btn px-2.5 py-1 rounded text-white font-medium transition cursor-pointer text-xs flex items-center gap-1 ${
            activeTab === 'maintenance' ? 'active bg-[#7a5c00] ring-1 ring-amber-300 font-bold' : 'bg-[#554522] hover:bg-[#7a6633] text-amber-300'
          }`}
          title="ตารางการบำรุงรักษาเชิงป้องกัน"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span className="font-bold">MAINTENANCE</span>
          {(alarmCountByTab['maintenance'] ?? 0) > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange('kpi')}
          className={`sub-btn px-2.5 py-1 rounded text-white font-medium transition cursor-pointer text-xs flex items-center gap-1 ${
            activeTab === 'kpi' ? 'active bg-emerald-700 ring-1 ring-emerald-300 font-bold' : 'bg-[#1b3d2f] hover:bg-[#285945] text-emerald-300 border border-emerald-500/30'
          }`}
          title="วิเคราะห์ System KPIs: Uptime %, MTBF และ PUE Over Time"
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold">SYSTEM KPIS</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('ac')}
          className={`sub-btn px-2.5 py-1 rounded text-white font-medium transition cursor-pointer text-xs ${
            activeTab === 'ac' ? 'active bg-[#007acc] ring-1 ring-blue-300 font-bold' : 'bg-[#555] hover:bg-[#666]'
          }`}
        >
          AC SUMMARY
        </button>
      </div>

      <div className="hidden md:inline-block text-gray-500">|</div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-semibold text-gray-400 text-[11px] hidden sm:inline">SPATIAL & TOPOLOGY ▼</span>
        <button
          type="button"
          onClick={() => onTabChange('floor')}
          className={`sub-btn px-2.5 py-1 rounded text-white font-medium transition cursor-pointer text-xs flex items-center gap-1 ${
            activeTab === 'floor' ? 'active bg-[#007acc] ring-1 ring-blue-300 font-bold' : 'bg-[#555] hover:bg-[#666]'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
          <span>FLOOR PLAN (GIS)</span>
          {(alarmCountByTab['floor'] ?? 0) > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onTabChange('overview')}
          className={`sub-btn px-2.5 py-1 rounded text-white font-medium transition cursor-pointer text-xs ${
            activeTab === 'overview' ? 'active bg-[#007acc] ring-1 ring-blue-300 font-bold' : 'bg-[#555] hover:bg-[#666]'
          }`}
        >
          OVERVIEW
        </button>
      </div>

      <div className="hidden md:inline-block text-gray-500">|</div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-semibold text-gray-400 text-[11px] hidden sm:inline">DATA & BAS ▼</span>
        <button
          type="button"
          onClick={() => onTabChange('bas-ptop')}
          className={`sub-btn px-2.5 py-1 rounded font-medium transition cursor-pointer text-xs flex items-center gap-1.5 ${
            activeTab === 'bas-ptop'
              ? 'active bg-gradient-to-r from-cyan-600 to-blue-600 ring-1 ring-cyan-300 font-bold text-white shadow'
              : 'bg-[#1b2b3a] hover:bg-[#253b50] text-cyan-300 border border-cyan-500/40'
          }`}
          title="รายงานการสอบสวน BAS PtoP และ PtoG สำหรับ Interface และ Vendor Protocols พร้อมราย Point ที่ต้องคำนึงถึง"
        >
          <Network className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold">BAS PtoP / PtoG</span>
          {(alarmCountByTab['bas-ptop'] ?? 0) > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange('alarm-export')}
          className={`sub-btn px-2.5 py-1 rounded font-medium transition cursor-pointer text-xs flex items-center gap-1.5 ${
            activeTab === 'alarm-export'
              ? 'active bg-[#007acc] ring-1 ring-cyan-300 font-bold text-white'
              : 'bg-[#1e3a4c] hover:bg-[#284f67] text-cyan-200 border border-cyan-500/30'
          }`}
          title="ดึงข้อมูลสัญญาณเตือนภัย Real-time, แบ่งตาม Priority และส่งออกเป็น Excel (.xlsx) หรือ SQL (.sql)"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>ALARM EXPORT / SQL</span>
          {(alarmCountByTab['alarm-export'] ?? 0) > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Quick test buttons for easy simulation demonstration */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px]">
          <span className="text-gray-400">Quick Test:</span>
          <button
            type="button"
            onClick={onSimulateMdbTrip}
            className="px-2 py-0.5 rounded bg-[#4a1c1c] hover:bg-[#632222] text-[#ff9999] border border-[#ff4d4d]/50 cursor-pointer flex items-center gap-1"
            title="จำลองตู้ MDB1A ตัดวงจร"
          >
            <Zap className="w-3 h-3 text-red-400" />
            <span>Trip MDB1A</span>
          </button>
          <button
            type="button"
            onClick={onSimulateOutage}
            className="px-2 py-0.5 rounded bg-[#4a351c] hover:bg-[#634522] text-[#ffcc66] border border-[#ffaa00]/50 cursor-pointer flex items-center gap-1"
            title="จำลองไฟฟ้าแรงสูงดับทั้งระบบ (Grid Blackout)"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Grid Blackout</span>
          </button>
          {onSimulateUpsDrill && (
            <button
              type="button"
              onClick={onSimulateUpsDrill}
              className="px-2 py-0.5 rounded bg-[#1f382a] hover:bg-[#284d39] text-[#70f2a9] border border-[#00cc44]/50 cursor-pointer flex items-center gap-1"
              title="จำลองการทดสอบแบตเตอรี่ UPS แบบ 0ms Transfer"
            >
              <BatteryCharging className="w-3 h-3 text-emerald-400" />
              <span>UPS Drill</span>
            </button>
          )}
        </div>

        {/* Original RESET ALL button */}
        <button
          type="button"
          onClick={onResetAll}
          className="sub-btn bg-[#b30000] hover:bg-[#cc0000] active:scale-95 text-white font-bold px-3.5 py-1 rounded transition flex items-center gap-1.5 cursor-pointer shadow"
          title="รีเซ็ตอุปกรณ์และระบบทั้งหมดกลับสู่สภาวะปกติ"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET ALL</span>
        </button>
      </div>
    </div>
  );
};
