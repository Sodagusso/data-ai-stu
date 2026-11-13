import React from 'react';
import type { TelemetryData, PowerTrendPoint, SourceState } from '../simulator/logic';
import { Activity, Gauge, Zap, Waves, Cpu } from 'lucide-react';
import { SystemLoadTrend } from './SystemLoadTrend';
import { UtilityVoltageGauge } from './UtilityVoltageGauge';

interface TelemetryPanelProps {
  telemetry: TelemetryData;
  trendHistory?: PowerTrendPoint[];
  isSimRunning?: boolean;
  utilityVoltage?: number;
  utilityStatus?: SourceState['status'];
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  telemetry,
  trendHistory = [],
  isSimRunning = true,
  utilityVoltage,
  utilityStatus = 'ONLINE',
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(false);
  const activeUtilityVoltage = utilityVoltage !== undefined ? utilityVoltage : telemetry.voltage;

  // Format current with commas e.g. 1,245.2 A
  const formattedCurrent = telemetry.current.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const getLoadColor = (load: number) => {
    if (load > 85) return 'text-[#ff4d4d]';
    if (load > 70) return 'text-[#ffaa00]';
    return 'text-[#00ffcc]';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="section-title text-xs text-[#aaa] font-bold border-b border-[#555] pb-1 uppercase flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#00ffcc]" />
          Live Telemetry & Real-Time Load Monitor
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-400 font-mono hidden sm:flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            REALTIME 50Hz SAMPLE
          </span>
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="text-[10px] font-mono text-cyan-300 hover:text-white bg-[#222] hover:bg-[#333] px-2 py-0.5 rounded border border-[#444] cursor-pointer transition flex items-center gap-1"
          >
            <span>{isCollapsed ? '▼ Expand Telemetry & Load Trend' : '▲ Minimize Telemetry'}</span>
          </button>
        </div>
      </div>

      {isCollapsed ? (
        <div className="bg-[#222] border border-[#444] rounded px-3 py-1.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-4 text-[11px]">
            <span>Utility Feed: <strong className={utilityStatus === 'FAULT' ? 'text-red-400' : 'text-[#00ffcc]'}>{activeUtilityVoltage.toFixed(1)}V ({utilityStatus})</strong></span>
            <span>Current: <strong className="text-cyan-300">{formattedCurrent}A</strong></span>
            <span>Load: <strong className={getLoadColor(telemetry.loadPercent)}>{telemetry.loadPercent.toFixed(1)}%</strong></span>
            <span>Total Power: <strong className="text-[#00ffcc]">{telemetry.powerKw.toFixed(1)} kW</strong></span>
            <span>Freq: <strong className="text-purple-300">{telemetry.frequency.toFixed(1)}Hz</strong></span>
          </div>
          <span className="text-[10px] text-gray-500">D3 Radial Gauge & 60s Trend Active</span>
        </div>
      ) : (
        <>
          <div className="dashboard-panel grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
        {/* Card 1: System Voltage */}
        <div className="dash-card bg-[#222] border border-[#444] rounded p-2 sm:px-3 sm:py-2 flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="dash-title text-[10px] text-[#888] uppercase tracking-wide">
              System Voltage (L-L)
            </span>
            <Zap className="w-3.5 h-3.5 text-yellow-400/70" />
          </div>
          <span
            className={`dash-value text-base sm:text-lg font-bold font-mono mt-1 ${
              telemetry.voltage < 350 ? 'text-[#ff4d4d]' : 'text-[#00ffcc]'
            }`}
            id="val-volt"
          >
            {telemetry.voltage.toFixed(1)} V
          </span>
          <div className="w-full bg-[#333] h-1 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                telemetry.voltage < 350 ? 'bg-red-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, (telemetry.voltage / 400) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Total Current */}
        <div className="dash-card bg-[#222] border border-[#444] rounded p-2 sm:px-3 sm:py-2 flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="dash-title text-[10px] text-[#888] uppercase tracking-wide">
              Total Current (RMS)
            </span>
            <Gauge className="w-3.5 h-3.5 text-cyan-400/70" />
          </div>
          <span className="dash-value text-base sm:text-lg font-bold text-[#00ffcc] font-mono mt-1" id="val-curr">
            {formattedCurrent} A
          </span>
          <div className="w-full bg-[#333] h-1 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${Math.min(100, (telemetry.current / 1600) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Transformer Load */}
        <div className="dash-card bg-[#222] border border-[#444] rounded p-2 sm:px-3 sm:py-2 flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="dash-title text-[10px] text-[#888] uppercase tracking-wide">
              Transformer Load
            </span>
            <Activity className="w-3.5 h-3.5 text-emerald-400/70" />
          </div>
          <span
            className={`dash-value text-base sm:text-lg font-bold font-mono mt-1 ${getLoadColor(
              telemetry.loadPercent
            )}`}
            id="val-load"
          >
            {telemetry.loadPercent.toFixed(1)} %
          </span>
          <div className="w-full bg-[#333] h-1 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                telemetry.loadPercent > 85 ? 'bg-red-500' : telemetry.loadPercent > 70 ? 'bg-amber-400' : 'bg-[#00ffcc]'
              }`}
              style={{ width: `${Math.min(100, telemetry.loadPercent)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Total Power */}
        <div className="dash-card bg-[#222] border border-[#444] rounded p-2 sm:px-3 sm:py-2 flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="dash-title text-[10px] text-[#888] uppercase tracking-wide">
              Total Power (3Φ)
            </span>
            <Cpu className="w-3.5 h-3.5 text-cyan-400/80" />
          </div>
          <span
            className={`dash-value text-base sm:text-lg font-bold font-mono mt-1 ${
              telemetry.powerKw <= 0 ? 'text-[#ff4d4d]' : 'text-[#00ffcc]'
            }`}
            id="val-power"
          >
            {telemetry.powerKw.toFixed(1)} kW
          </span>
          <div className="w-full bg-[#333] h-1 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                telemetry.powerKw <= 0 ? 'bg-red-500' : 'bg-[#00ffcc]'
              }`}
              style={{ width: `${Math.min(100, (telemetry.powerKw / 1000) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 5: Frequency */}
        <div className="dash-card bg-[#222] border border-[#444] rounded p-2 sm:px-3 sm:py-2 flex flex-col relative overflow-hidden group col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="dash-title text-[10px] text-[#888] uppercase tracking-wide">
              Frequency
            </span>
            <Waves className="w-3.5 h-3.5 text-purple-400/70" />
          </div>
          <span
            className={`dash-value text-base sm:text-lg font-bold font-mono mt-1 ${
              telemetry.frequency < 48 || telemetry.frequency > 52 ? 'text-[#ff4d4d]' : 'text-[#00ffcc]'
            }`}
            id="val-freq"
          >
            {telemetry.frequency.toFixed(1)} Hz
          </span>
          <div className="w-full bg-[#333] h-1 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-purple-400 transition-all duration-300"
              style={{ width: `${Math.min(100, (telemetry.frequency / 60) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Monitoring Bay: D3 Utility Input Voltage Radial Gauge + System Load Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
        {/* D3-based Radial Voltage Gauge */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col">
          <UtilityVoltageGauge
            voltage={activeUtilityVoltage}
            status={utilityStatus}
            frequency={telemetry.frequency}
            isSimRunning={isSimRunning}
            className="h-full"
          />
        </div>

        {/* System Load Trend Recharts Window */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col">
          <SystemLoadTrend history={trendHistory} isSimRunning={isSimRunning} />
        </div>
      </div>
        </>
      )}
    </div>
  );
};
