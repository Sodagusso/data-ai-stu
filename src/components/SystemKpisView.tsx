/**
 * SILA1 Electrical System Simulator - System KPIs Dashboard View (Recharts)
 */

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ShieldCheck, Activity, TrendingUp, Clock, Zap, AlertTriangle, Cpu, Gauge } from 'lucide-react';
import type { SimulatorState, TelemetryData } from '../simulator/logic';

interface SystemKpisViewProps {
  state: SimulatorState;
  telemetry: TelemetryData;
}

export const SystemKpisView: React.FC<SystemKpisViewProps> = ({ state, telemetry }) => {
  // Historical data points for charts (60 seconds rolling / hourly simulated)
  const pueHistory = [
    { time: '-60s', pue: 1.32, itLoadKw: 420, totalKw: 554.4 },
    { time: '-50s', pue: 1.33, itLoadKw: 422, totalKw: 561.2 },
    { time: '-40s', pue: 1.32, itLoadKw: 418, totalKw: 551.7 },
    { time: '-30s', pue: 1.34, itLoadKw: 425, totalKw: 569.5 },
    { time: '-20s', pue: 1.35, itLoadKw: 430, totalKw: 580.5 },
    { time: '-10s', pue: 1.33, itLoadKw: 428, totalKw: 569.2 },
    { time: 'Now', pue: 1.32, itLoadKw: telemetry.powerKw * 0.75, totalKw: telemetry.powerKw },
  ];

  const uptimeHistory = [
    { time: '00:00', uptimePct: 100.0, target: 99.995 },
    { time: '04:00', uptimePct: 100.0, target: 99.995 },
    { time: '08:00', uptimePct: 99.998, target: 99.995 },
    { time: '12:00', uptimePct: 100.0, target: 99.995 },
    { time: '16:00', uptimePct: 99.995, target: 99.995 },
    { time: '20:00', uptimePct: 100.0, target: 99.995 },
    { time: '24:00', uptimePct: 99.997, target: 99.995 },
  ];

  const mtbfData = [
    { component: 'HV Substation PEA', mtbfHours: 120000, category: 'Source', status: 'Optimal' },
    { component: 'Transformers TR1/2', mtbfHours: 85000, category: 'Transformer', status: 'Optimal' },
    { component: 'MDB Main Bus A/B', mtbfHours: 65000, category: 'Switchboard', status: 'Optimal' },
    { component: 'Modular UPS 3A/3B', mtbfHours: 50000, category: 'UPS', status: 'Good' },
    { component: 'Emergency Gen GEN-1', mtbfHours: 35000, category: 'Generator', status: 'Standby' },
    { component: 'Chillers & CRAC', mtbfHours: 42000, category: 'HVAC', status: 'Good' },
  ];

  return (
    <div className="flex flex-col gap-4 text-xs select-none p-2 pb-12 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-[#222] border border-[#444] rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-gradient-to-br from-emerald-800 to-emerald-950 text-emerald-300 border border-emerald-500/40">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-white text-base sm:text-lg font-bold tracking-wide">
              SYSTEM KPIS & RELIABILITY ANALYTICS (Uptime, MTBF, PUE)
            </h2>
            <p className="text-xs text-gray-400">
              วิเคราะห์ประสิทธิภาพพลังงาน (PUE), สถิติความพร้อมใช้งาน (Uptime 99.995%), และเวลาเฉลี่ยระหว่างความล้มเหลว (MTBF) รายอุปกรณ์
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-[#1a1a1a] px-3 py-2 rounded border border-[#444] text-center">
            <div className="text-[10px] text-gray-400">CURRENT PUE</div>
            <div className="text-base font-mono font-bold text-cyan-300">1.32</div>
          </div>
          <div className="bg-[#1a1a1a] px-3 py-2 rounded border border-[#444] text-center">
            <div className="text-[10px] text-gray-400">SYSTEM UPTIME</div>
            <div className="text-base font-mono font-bold text-emerald-400">99.996%</div>
          </div>
          <div className="bg-[#1a1a1a] px-3 py-2 rounded border border-[#444] text-center">
            <div className="text-[10px] text-gray-400">AVG MTBF</div>
            <div className="text-base font-mono font-bold text-amber-400">66,166 Hrs</div>
          </div>
        </div>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PUE Over Time Chart */}
        <div className="bg-[#1e1e1e] border border-[#444] rounded-lg p-4 flex flex-col shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold flex items-center gap-2 text-xs">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Power Usage Effectiveness (PUE) Trend Over Time
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Target &lt; 1.35
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pueHistory}>
                <defs>
                  <linearGradient id="pueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time" stroke="#888" fontSize={11} />
                <YAxis domain={[1.25, 1.45]} stroke="#888" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#444', borderRadius: '4px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="pue" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#pueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Uptime Percentage Trend */}
        <div className="bg-[#1e1e1e] border border-[#444] rounded-lg p-4 flex flex-col shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Data Center Uptime vs Tier IV SLA Target (24h)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              SLA 99.995%
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={uptimeHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time" stroke="#888" fontSize={11} />
                <YAxis domain={[99.98, 100.0]} stroke="#888" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#444', borderRadius: '4px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="uptimePct" name="Actual Uptime %" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="target" name="Tier IV Target" stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* MTBF Bar Chart Component */}
      <div className="bg-[#1e1e1e] border border-[#444] rounded-lg p-4 flex flex-col shadow">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold flex items-center gap-2 text-xs">
            <Clock className="w-4 h-4 text-amber-400" />
            Mean Time Between Failures (MTBF) per Subsystem Component (Hours)
          </h3>
          <span className="text-[10px] font-mono text-gray-400">ISO 14224 Reliability Standard</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mtbfData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" stroke="#888" fontSize={11} />
              <YAxis dataKey="component" type="category" stroke="#fff" fontSize={11} width={150} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#444', borderRadius: '4px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="mtbfHours" name="MTBF (Hours)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
