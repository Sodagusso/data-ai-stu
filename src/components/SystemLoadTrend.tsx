import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { PowerTrendPoint } from '../simulator/logic';
import { calculateTrendStats } from '../simulator/logic';
import { TrendingUp, Activity, Gauge, Zap } from 'lucide-react';

interface SystemLoadTrendProps {
  history: PowerTrendPoint[];
  isSimRunning?: boolean;
}

export const SystemLoadTrend: React.FC<SystemLoadTrendProps> = ({
  history,
  isSimRunning = true,
}) => {
  const [metricMode, setMetricMode] = useState<'power' | 'load'>('power');

  const stats = calculateTrendStats(history);
  const currentPoint = history[history.length - 1];
  const currentVal = metricMode === 'power'
    ? `${(currentPoint?.powerKw ?? 0).toFixed(1)} kW`
    : `${(currentPoint?.loadPercent ?? 0).toFixed(1)} %`;

  // Dynamic Y-axis domain padding
  const values = history.map((d) => (metricMode === 'power' ? d.powerKw : d.loadPercent));
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 100;
  const yDomainMin = Math.max(0, Math.floor(minVal * 0.85));
  const yDomainMax = Math.ceil(maxVal * 1.15) || 100;

  return (
    <div className="bg-[#222] border border-[#444] rounded p-3 flex flex-col gap-2.5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3a3a3a] pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-[#00ffcc]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                System Load Trend
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                (Last 60s Simulation Window)
              </span>
            </div>
            <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
              <span>Total Active Power Consumption Fluctuations</span>
              <span className="text-gray-600">•</span>
              <span className="font-mono text-cyan-400/90">3Φ AC (P = √3·V·I·cosφ)</span>
            </div>
          </div>
        </div>

        {/* Controls & Status Indicator */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-[#181818] rounded border border-[#3e3e3e] p-0.5 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setMetricMode('power')}
              className={`px-2 py-0.5 rounded transition-colors ${
                metricMode === 'power'
                  ? 'bg-cyan-500/20 text-[#00ffcc] font-semibold border border-cyan-500/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Power (kW)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('load')}
              className={`px-2 py-0.5 rounded transition-colors ${
                metricMode === 'load'
                  ? 'bg-cyan-500/20 text-[#00ffcc] font-semibold border border-cyan-500/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Load (%)
            </button>
          </div>

          {/* Live Status Pill */}
          <div className="flex items-center gap-1.5 bg-[#181818] border border-[#3e3e3e] px-2 py-0.5 rounded text-[10px] font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isSimRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className={isSimRunning ? 'text-emerald-400' : 'text-amber-400'}>
              {isSimRunning ? 'RECORDING' : 'PAUSED'}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
        <div className="bg-[#181818] border border-[#333] rounded px-2.5 py-1.5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            Current {metricMode === 'power' ? 'Power' : 'Load'}
          </span>
          <span className="text-sm sm:text-base font-bold text-[#00ffcc] mt-0.5">
            {currentVal}
          </span>
        </div>

        <div className="bg-[#181818] border border-[#333] rounded px-2.5 py-1.5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3 h-3 text-amber-400" />
            60s Average
          </span>
          <span className="text-sm sm:text-base font-bold text-amber-300 mt-0.5">
            {metricMode === 'power' ? `${stats.avg.toFixed(1)} kW` : `${((stats.avg / (stats.current || 1)) * (currentPoint?.loadPercent || 0)).toFixed(1)} %`}
          </span>
        </div>

        <div className="bg-[#181818] border border-[#333] rounded px-2.5 py-1.5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Gauge className="w-3 h-3 text-emerald-400" />
            60s Min / Max
          </span>
          <span className="text-xs sm:text-sm font-semibold text-gray-200 mt-0.5 truncate">
            {metricMode === 'power'
              ? `${stats.min.toFixed(0)} / ${stats.max.toFixed(0)} kW`
              : `${minVal.toFixed(1)} / ${maxVal.toFixed(1)} %`}
          </span>
        </div>

        <div className="bg-[#181818] border border-[#333] rounded px-2.5 py-1.5 flex flex-col justify-between">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
            Fluctuation
          </span>
          <span className="text-xs sm:text-sm font-semibold text-cyan-300 mt-0.5">
            ±{stats.fluctuationPct.toFixed(1)}%
            <span className="text-[10px] text-gray-400 font-normal ml-1">
              ({stats.fluctuationPct < 5 ? 'Stable' : 'Dynamic'})
            </span>
          </span>
        </div>

        <div className="bg-[#181818] border border-[#333] rounded px-2.5 py-1.5 flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
            Power Factor / Grid
          </span>
          <span className="text-xs sm:text-sm font-semibold text-emerald-300 mt-0.5">
            0.88 Lagging
          </span>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="w-full h-44 sm:h-48 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={history}
            margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="loadTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ffcc" stopOpacity={0.45} />
                <stop offset="70%" stopColor="#00ffcc" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#00ffcc" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="loadPercentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffaa00" stopOpacity={0.45} />
                <stop offset="70%" stopColor="#ffaa00" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#ffaa00" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#333333"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              stroke="#666666"
              tick={{ fill: '#888888', fontSize: 10, fontFamily: 'monospace' }}
              interval={9}
              tickLine={{ stroke: '#444' }}
            />
            <YAxis
              stroke="#666666"
              tick={{ fill: '#888888', fontSize: 10, fontFamily: 'monospace' }}
              domain={[yDomainMin, yDomainMax]}
              unit={metricMode === 'power' ? ' kW' : ' %'}
              tickLine={{ stroke: '#444' }}
              width={52}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload as PowerTrendPoint;
                return (
                  <div className="bg-[#181818]/95 border border-[#00ffcc]/50 shadow-xl rounded px-3 py-2 text-xs font-mono text-gray-200 backdrop-blur-sm">
                    <div className="text-[11px] text-[#00ffcc] font-bold border-b border-[#333] pb-1 mb-1.5 flex items-center justify-between gap-4">
                      <span>TIME: {data.time}</span>
                      <span className="text-[10px] text-gray-400">SAMPLE #{60 + data.timestamp}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400">Total Power:</span>
                        <span className="font-bold text-[#00ffcc]">{data.powerKw.toFixed(1)} kW</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400">System Load:</span>
                        <span className="font-bold text-amber-300">{data.loadPercent.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400">Voltage (L-L):</span>
                        <span className="font-bold text-yellow-300">{data.voltage.toFixed(1)} V</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400">Total Current:</span>
                        <span className="font-bold text-cyan-300">{data.current.toFixed(1)} A</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={stats.avg}
              stroke="#ffaa00"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: `AVG ${stats.avg.toFixed(0)}kW`,
                fill: '#ffaa00',
                fontSize: 9,
                position: 'insideTopLeft',
              }}
            />
            <Area
              type="monotone"
              dataKey={metricMode === 'power' ? 'powerKw' : 'loadPercent'}
              name={metricMode === 'power' ? 'Total Power (kW)' : 'System Load (%)'}
              stroke={metricMode === 'power' ? '#00ffcc' : '#ffaa00'}
              strokeWidth={2}
              fillOpacity={1}
              fill={metricMode === 'power' ? 'url(#loadTrendGradient)' : 'url(#loadPercentGradient)'}
              isAnimationActive={false}
              dot={false}
              activeDot={{
                r: 4,
                fill: metricMode === 'power' ? '#00ffcc' : '#ffaa00',
                stroke: '#ffffff',
                strokeWidth: 1.5,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer bar with time range & quick indicator */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono border-t border-[#333] pt-1.5">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          T-60s Continuous High-Resolution Telemetry Buffer
        </span>
        <span>
          Realtime Sample Rate: 1.0s / step
        </span>
      </div>
    </div>
  );
};
