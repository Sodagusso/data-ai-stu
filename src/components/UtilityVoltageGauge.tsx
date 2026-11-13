import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Zap, Gauge, AlertTriangle, CheckCircle2, RotateCcw, ShieldAlert, Activity } from 'lucide-react';
import type { SourceState } from '../simulator/logic';

interface UtilityVoltageGaugeProps {
  voltage: number;
  status?: SourceState['status'];
  frequency?: number;
  isSimRunning?: boolean;
  className?: string;
}

export const UtilityVoltageGauge: React.FC<UtilityVoltageGaugeProps> = ({
  voltage,
  status = 'ONLINE',
  frequency = 50.0,
  isSimRunning = true,
  className = '',
}) => {
  const [mode, setMode] = useState<'L-L' | 'L-N' | 'HV'>('L-L');
  const [minPeak, setMinPeak] = useState<number>(voltage);
  const [maxPeak, setMaxPeak] = useState<number>(voltage);

  const needleRef = useRef<SVGGElement>(null);
  const prevAngleRef = useRef<number>(-135);

  const isGridFault = status === 'FAULT' || voltage <= 10;

  // Track Peak Min/Max
  useEffect(() => {
    if (voltage > 0) {
      setMinPeak((prev) => (prev === 0 ? voltage : Math.min(prev, voltage)));
      setMaxPeak((prev) => Math.max(prev, voltage));
    }
  }, [voltage]);

  const handleResetPeaks = () => {
    setMinPeak(voltage);
    setMaxPeak(voltage);
  };

  // Range and nominal definitions based on mode
  const { minVal, maxVal, nominalVal, displayVal, unitLabel, scaleLabel } = useMemo(() => {
    if (mode === 'L-N') {
      const lnVolt = voltage > 0 ? voltage / Math.sqrt(3) : 0;
      return {
        minVal: 0,
        maxVal: 300,
        nominalVal: 220,
        displayVal: lnVolt,
        unitLabel: 'V (L-N)',
        scaleLabel: '0 - 300 VAC Phase-to-Neutral',
      };
    }
    if (mode === 'HV') {
      const hvVolt = voltage > 0 ? (voltage / 380) * 22.0 : 0;
      return {
        minVal: 0,
        maxVal: 26,
        nominalVal: 22.0,
        displayVal: hvVolt,
        unitLabel: 'kV (22kV Feed)',
        scaleLabel: '0 - 26 kV Primary Grid Feeder',
      };
    }
    // Default L-L
    return {
      minVal: 0,
      maxVal: 500,
      nominalVal: 380,
      displayVal: voltage,
      unitLabel: 'V (L-L)',
      scaleLabel: '0 - 500 VAC 3-Phase Utility Input',
    };
  }, [mode, voltage]);

  // D3 Scales & Radial Geometry
  const width = 280;
  const height = 175;
  const cx = 140;
  const cy = 104;
  const radius = 82;
  const innerRadius = 65;
  const startAngleDeg = -125;
  const endAngleDeg = 125;

  const angleScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([minVal, maxVal])
      .range([startAngleDeg, endAngleDeg])
      .clamp(true);
  }, [minVal, maxVal]);

  const currentAngle = angleScale(displayVal);

  // Smooth needle animation with D3
  useEffect(() => {
    if (!needleRef.current) return;
    const startAngle = prevAngleRef.current;
    const targetAngle = currentAngle;

    const sel = d3.select(needleRef.current);
    sel.transition()
      .duration(280)
      .ease(d3.easeCubicOut)
      .attrTween('transform', () => {
        const interpolator = d3.interpolateNumber(startAngle, targetAngle);
        return (t) => `rotate(${interpolator(t)}, ${cx}, ${cy})`;
      })
      .on('end', () => {
        prevAngleRef.current = targetAngle;
      });
  }, [currentAngle, cx, cy]);

  // Color Arc Bands (Critical Undervoltage, Warning Sag, Nominal, Warning Swell, Overvoltage)
  const arcBands = useMemo(() => {
    const d3Arc = d3.arc<any>()
      .innerRadius(innerRadius)
      .outerRadius(radius);

    const degToRad = (deg: number) => (deg * Math.PI) / 180;

    let bands: { startV: number; endV: number; color: string; label: string }[] = [];

    if (mode === 'L-L') {
      bands = [
        { startV: 0, endV: 340, color: '#e63946', label: 'Trip' },
        { startV: 340, endV: 365, color: '#f59e0b', label: 'Sag' },
        { startV: 365, endV: 395, color: '#00cc66', label: 'Normal' },
        { startV: 395, endV: 420, color: '#f59e0b', label: 'Swell' },
        { startV: 420, endV: 500, color: '#e63946', label: 'Surge' },
      ];
    } else if (mode === 'L-N') {
      bands = [
        { startV: 0, endV: 195, color: '#e63946', label: 'Trip' },
        { startV: 195, endV: 210, color: '#f59e0b', label: 'Sag' },
        { startV: 210, endV: 230, color: '#00cc66', label: 'Normal' },
        { startV: 230, endV: 245, color: '#f59e0b', label: 'Swell' },
        { startV: 245, endV: 300, color: '#e63946', label: 'Surge' },
      ];
    } else {
      bands = [
        { startV: 0, endV: 19.5, color: '#e63946', label: 'Trip' },
        { startV: 19.5, endV: 21.0, color: '#f59e0b', label: 'Sag' },
        { startV: 21.0, endV: 23.0, color: '#00cc66', label: 'Normal' },
        { startV: 23.0, endV: 24.5, color: '#f59e0b', label: 'Swell' },
        { startV: 24.5, endV: 26.0, color: '#e63946', label: 'Surge' },
      ];
    }

    return bands.map((b) => {
      const sAngle = angleScale(b.startV);
      const eAngle = angleScale(b.endV);
      const pathData = d3Arc({
        startAngle: degToRad(sAngle),
        endAngle: degToRad(eAngle),
      });
      return { ...b, pathData, sAngle, eAngle };
    });
  }, [innerRadius, radius, angleScale, mode]);

  // Major and Minor Ticks via D3
  const ticks = useMemo(() => {
    let majorStep = 100;
    let minorStep = 20;
    if (mode === 'L-N') {
      majorStep = 50;
      minorStep = 10;
    } else if (mode === 'HV') {
      majorStep = 5;
      minorStep = 1;
    }

    const majorVals = d3.range(minVal, maxVal + 0.1, majorStep);
    const minorVals = d3.range(minVal, maxVal + 0.1, minorStep);

    // Minor ticks
    const minorTicks = minorVals.map((v) => {
      const angle = angleScale(v);
      const rad = ((angle - 90) * Math.PI) / 180;
      const x1 = cx + (radius - 5) * Math.cos(rad);
      const y1 = cy + (radius - 5) * Math.sin(rad);
      const x2 = cx + radius * Math.cos(rad);
      const y2 = cy + radius * Math.sin(rad);
      return { v, x1, y1, x2, y2 };
    });

    // Major ticks with labels
    const majorTicks = majorVals.map((v) => {
      const angle = angleScale(v);
      const rad = ((angle - 90) * Math.PI) / 180;
      const x1 = cx + (innerRadius + 6) * Math.cos(rad);
      const y1 = cy + (innerRadius + 6) * Math.sin(rad);
      const x2 = cx + (radius + 2) * Math.cos(rad);
      const y2 = cy + (radius + 2) * Math.sin(rad);
      const labelX = cx + (innerRadius - 12) * Math.cos(rad);
      const labelY = cy + (innerRadius - 12) * Math.sin(rad) + 3;
      return { v, x1, y1, x2, y2, labelX, labelY, angle };
    });

    return { minorTicks, majorTicks };
  }, [minVal, maxVal, mode, angleScale, cx, cy, innerRadius, radius]);

  // Health diagnosis & styling
  const voltageStatus = useMemo(() => {
    if (isGridFault) {
      return {
        label: 'GRID OUTAGE / 0V',
        badgeBg: 'bg-red-950/80 border-red-500 text-red-300',
        textColor: 'text-red-400',
        icon: ShieldAlert,
        glowColor: 'rgba(239, 68, 68, 0.4)',
      };
    }
    const lowerTol = mode === 'L-L' ? 365 : mode === 'L-N' ? 210 : 21.0;
    const upperTol = mode === 'L-L' ? 395 : mode === 'L-N' ? 230 : 23.0;

    if (displayVal < lowerTol) {
      return {
        label: 'VOLTAGE SAG',
        badgeBg: 'bg-amber-950/80 border-amber-500 text-amber-300',
        textColor: 'text-amber-400',
        icon: AlertTriangle,
        glowColor: 'rgba(245, 158, 11, 0.4)',
      };
    }
    if (displayVal > upperTol) {
      return {
        label: 'VOLTAGE SWELL',
        badgeBg: 'bg-amber-950/80 border-amber-500 text-amber-300',
        textColor: 'text-amber-400',
        icon: AlertTriangle,
        glowColor: 'rgba(245, 158, 11, 0.4)',
      };
    }
    return {
      label: 'NOMINAL (±2.5%)',
      badgeBg: 'bg-emerald-950/80 border-emerald-500 text-emerald-300',
      textColor: 'text-[#00ffcc]',
      icon: CheckCircle2,
      glowColor: 'rgba(0, 255, 204, 0.4)',
    };
  }, [isGridFault, displayVal, mode]);

  // Nominal 380V indicator position
  const nominalAngle = angleScale(nominalVal);
  const nominalRad = ((nominalAngle - 90) * Math.PI) / 180;
  const nominalMarkerX = cx + (radius + 7) * Math.cos(nominalRad);
  const nominalMarkerY = cy + (radius + 7) * Math.sin(nominalRad);

  // Peak markers
  const minPeakAngle = angleScale(mode === 'L-N' ? minPeak / Math.sqrt(3) : mode === 'HV' ? (minPeak / 380) * 22 : minPeak);
  const maxPeakAngle = angleScale(mode === 'L-N' ? maxPeak / Math.sqrt(3) : mode === 'HV' ? (maxPeak / 380) * 22 : maxPeak);

  return (
    <div className={`bg-[#1c1c1c] border border-[#3e3e3e] rounded p-3 flex flex-col justify-between shadow-lg relative overflow-hidden ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#333] pb-2 mb-1 gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/40 flex items-center justify-center">
            <Zap className="w-3 h-3 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Main Utility Voltage</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-[#333] text-gray-400 font-mono">D3 RADIAL</span>
            </div>
            <div className="text-[9.5px] text-gray-400 font-mono">
              PEA 22kV / RM6 Incomer → 400V Distribution
            </div>
          </div>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-1 font-mono text-[10px]">
          <button
            type="button"
            onClick={() => setMode('L-L')}
            className={`px-2 py-0.5 rounded cursor-pointer transition ${
              mode === 'L-L'
                ? 'bg-cyan-700 text-white font-bold border border-cyan-400'
                : 'bg-[#2a2a2a] text-gray-400 hover:text-white border border-[#444]'
            }`}
            title="Line-to-Line Voltage (Nominal 380V)"
          >
            L-L (380V)
          </button>
          <button
            type="button"
            onClick={() => setMode('L-N')}
            className={`px-2 py-0.5 rounded cursor-pointer transition ${
              mode === 'L-N'
                ? 'bg-cyan-700 text-white font-bold border border-cyan-400'
                : 'bg-[#2a2a2a] text-gray-400 hover:text-white border border-[#444]'
            }`}
            title="Line-to-Neutral Voltage (Nominal 220V)"
          >
            L-N (220V)
          </button>
          <button
            type="button"
            onClick={() => setMode('HV')}
            className={`px-2 py-0.5 rounded cursor-pointer transition hidden sm:inline-block ${
              mode === 'HV'
                ? 'bg-cyan-700 text-white font-bold border border-cyan-400'
                : 'bg-[#2a2a2a] text-gray-400 hover:text-white border border-[#444]'
            }`}
            title="Primary Feed Voltage (22kV)"
          >
            22kV HV
          </button>
        </div>
      </div>

      {/* SVG Radial Voltmeter Canvas */}
      <div className="relative flex items-center justify-center my-0.5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[310px] h-auto select-none overflow-visible"
        >
          <defs>
            {/* Radial background gradient */}
            <radialGradient id="gauge-dial-grad" cx="50%" cy="55%" r="55%">
              <stop offset="0%" stopColor="#252525" />
              <stop offset="85%" stopColor="#161616" />
              <stop offset="100%" stopColor="#0d0d0d" />
            </radialGradient>

            {/* Needle gradient */}
            <linearGradient id="needle-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff4d4d" />
              <stop offset="50%" stopColor="#ff6b6b" />
              <stop offset="100%" stopColor="#c5221f" />
            </linearGradient>

            {/* Bezel glow filter */}
            <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Outer Bezel Dial Plate */}
          <circle
            cx={cx}
            cy={cy}
            r={radius + 18}
            fill="url(#gauge-dial-grad)"
            stroke="#3a3a3a"
            strokeWidth="2.5"
            filter="url(#gauge-glow)"
          />
          <circle
            cx={cx}
            cy={cy}
            r={radius + 14}
            fill="none"
            stroke="#222"
            strokeWidth="1"
          />

          {/* Subtly illuminated circular gauge track background */}
          <path
            d={d3.arc<any>()
              .innerRadius(innerRadius)
              .outerRadius(radius)
              .startAngle((startAngleDeg * Math.PI) / 180)
              .endAngle((endAngleDeg * Math.PI) / 180)({} as any)!}
            transform={`translate(${cx}, ${cy})`}
            fill="#232323"
            stroke="#333"
            strokeWidth="0.5"
          />

          {/* D3 Colored Scale Arc Bands */}
          {arcBands.map((band, idx) => (
            <path
              key={`band-${idx}`}
              d={band.pathData!}
              transform={`translate(${cx}, ${cy})`}
              fill={band.color}
              opacity={isGridFault ? 0.25 : 0.85}
              stroke="#111"
              strokeWidth="0.5"
            />
          ))}

          {/* Minor Ticks */}
          {ticks.minorTicks.map((t, idx) => (
            <line
              key={`minor-${idx}`}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="#555"
              strokeWidth="1"
              opacity="0.8"
            />
          ))}

          {/* Major Ticks & Numerical Labels */}
          {ticks.majorTicks.map((t, idx) => (
            <g key={`major-${idx}`}>
              <line
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke="#888"
                strokeWidth="1.8"
              />
              <text
                x={t.labelX}
                y={t.labelY}
                textAnchor="middle"
                fontSize="8.5"
                fontFamily="monospace"
                fontWeight="bold"
                fill="#aaa"
              >
                {t.v}
              </text>
            </g>
          ))}

          {/* Nominal Setpoint Indicator (e.g. 380V Triange Pointer) */}
          <g>
            <polygon
              points={`${nominalMarkerX},${nominalMarkerY} ${nominalMarkerX - 4},${nominalMarkerY + 6} ${nominalMarkerX + 4},${nominalMarkerY + 6}`}
              fill="#00ffcc"
              stroke="#000"
              strokeWidth="0.5"
            />
            <text
              x={cx}
              y={cy - 48}
              textAnchor="middle"
              fontSize="7.5"
              fontFamily="monospace"
              fontWeight="bold"
              fill="#00ffcc"
              opacity="0.9"
            >
              SET: {nominalVal}{mode === 'HV' ? 'kV' : 'V'} NOMINAL
            </text>
          </g>

          {/* Peak Min / Max Marker Pins */}
          {!isGridFault && (
            <>
              {/* Min Peak Pin */}
              <g transform={`rotate(${minPeakAngle}, ${cx}, ${cy})`}>
                <line x1={cx} y1={cy - radius + 2} x2={cx} y2={cy - radius + 11} stroke="#38bdf8" strokeWidth="2" strokeDasharray="1 1" />
              </g>
              {/* Max Peak Pin */}
              <g transform={`rotate(${maxPeakAngle}, ${cx}, ${cy})`}>
                <line x1={cx} y1={cy - radius + 2} x2={cx} y2={cy - radius + 11} stroke="#f97316" strokeWidth="2" strokeDasharray="1 1" />
              </g>
            </>
          )}

          {/* Dynamic D3 Animated Needle */}
          <g
            ref={needleRef}
            transform={`rotate(${currentAngle}, ${cx}, ${cy})`}
          >
            {/* Needle drop shadow */}
            <path
              d={`M ${cx - 3} ${cy + 16} L ${cx - 1} ${cy - radius + 5} L ${cx} ${cy - radius - 2} L ${cx + 1} ${cy - radius + 5} L ${cx + 3} ${cy + 16} Z`}
              fill="rgba(0,0,0,0.5)"
              transform="translate(1, 2)"
            />
            {/* Needle body */}
            <path
              d={`M ${cx - 3.5} ${cy + 16} L ${cx - 1.2} ${cy - radius + 5} L ${cx} ${cy - radius - 2} L ${cx + 1.2} ${cy - radius + 5} L ${cx + 3.5} ${cy + 16} Z`}
              fill="url(#needle-grad)"
              stroke="#991b1b"
              strokeWidth="0.5"
            />
            {/* Counterbalance tail */}
            <circle cx={cx} cy={cy + 14} r="3" fill="#ff4d4d" />
          </g>

          {/* Central Pivot Hub Cap */}
          <circle cx={cx} cy={cy} r="10" fill="#2a2a2a" stroke="#555" strokeWidth="2" />
          <circle cx={cx} cy={cy} r="5" fill="#111" stroke="#ff4d4d" strokeWidth="1.2" />
          <circle cx={cx} cy={cy} r="2" fill="#fff" />

          {/* Real-time Large Digital Readout */}
          <g transform={`translate(${cx}, ${cy + 42})`}>
            {/* Background pill */}
            <rect
              x="-66"
              y="-16"
              width="132"
              height="26"
              rx="4"
              fill="#141414"
              stroke="#333"
              strokeWidth="1.2"
            />
            <text
              textAnchor="middle"
              y="2.5"
              fontFamily="monospace"
              fontSize="15"
              fontWeight="bold"
              fill={isGridFault ? '#ff4d4d' : '#00ffcc'}
              className="tracking-wider"
            >
              {displayVal.toFixed(1)} {mode === 'HV' ? 'kV' : 'V'}
            </text>
            <text
              textAnchor="middle"
              y="18.5"
              fontFamily="sans-serif"
              fontSize="7"
              fontWeight="bold"
              fill="#888"
              letterSpacing="0.05em"
            >
              {mode === 'L-N' ? 'UTILITY FEED (RMS L-N)' : mode === 'HV' ? 'PRIMARY GRID (22kV)' : 'UTILITY FEED (RMS L-L)'}
            </text>
          </g>
        </svg>

        {/* Live Status Badge overlay on bottom right */}
        <div className="absolute top-1 right-2 flex flex-col items-end gap-1 pointer-events-none">
          <div className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border flex items-center gap-1 shadow ${voltageStatus.badgeBg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isGridFault ? 'bg-red-400 animate-ping' : 'bg-emerald-400'}`} />
            <span>{voltageStatus.label}</span>
          </div>
        </div>
      </div>

      {/* Footer Metrics: Phase Balance & Grid Frequency */}
      <div className="mt-1 pt-2 border-t border-[#333] grid grid-cols-3 gap-1.5 text-center font-mono text-[9.5px]">
        {/* Phase L1-L2 */}
        <div className="bg-[#242424] border border-[#383838] rounded p-1 flex flex-col">
          <span className="text-gray-400 text-[8px]">PHASE L1-L2</span>
          <span className={`font-bold ${isGridFault ? 'text-gray-500' : 'text-cyan-300'}`}>
            {isGridFault ? '0.0 V' : `${(voltage * 1.001).toFixed(1)} V`}
          </span>
        </div>

        {/* Phase L2-L3 */}
        <div className="bg-[#242424] border border-[#383838] rounded p-1 flex flex-col">
          <span className="text-gray-400 text-[8px]">PHASE L2-L3</span>
          <span className={`font-bold ${isGridFault ? 'text-gray-500' : 'text-cyan-300'}`}>
            {isGridFault ? '0.0 V' : `${(voltage * 0.999).toFixed(1)} V`}
          </span>
        </div>

        {/* Phase L3-L1 */}
        <div className="bg-[#242424] border border-[#383838] rounded p-1 flex flex-col">
          <span className="text-gray-400 text-[8px]">PHASE L3-L1</span>
          <span className={`font-bold ${isGridFault ? 'text-gray-500' : 'text-cyan-300'}`}>
            {isGridFault ? '0.0 V' : `${(voltage * 1.000).toFixed(1)} V`}
          </span>
        </div>
      </div>

      {/* Auxiliary Info: Grid Source & Reset Peak Button */}
      <div className="flex items-center justify-between text-[9px] text-gray-400 font-mono mt-1 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Source:</span>
          <span className={status === 'FAULT' ? 'text-red-400 font-bold' : 'text-emerald-400'}>
            {status === 'FAULT' ? 'PEA GRID OUTAGE' : 'PEA 22kV / RM6-01'}
          </span>
          <span className="text-gray-600">•</span>
          <span>{frequency.toFixed(1)} Hz</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-gray-500">Peak:</span>
          <span className="text-sky-400">{minPeak.toFixed(0)}</span>
          <span className="text-gray-600">/</span>
          <span className="text-orange-400">{maxPeak.toFixed(0)}V</span>
          <button
            type="button"
            onClick={handleResetPeaks}
            className="ml-1 text-[8px] text-gray-400 hover:text-white p-0.5 rounded hover:bg-[#333] transition cursor-pointer"
            title="Reset Peak Min/Max"
          >
            <RotateCcw className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
