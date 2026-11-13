/**
 * SILA1 Electrical System Simulator (Full Package)
 * Combines SCADA Single-Line Diagram HTML interface with interactive JavaScript control logic
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  INITIAL_STATE,
  toggleMdbTrip,
  toggleSourceNode,
  calculateTelemetry,
  calculateCounters,
  generateInitialTrendHistory,
  appendTrendHistory,
  evaluateUpsSystemState,
  toggleUpsUnit,
  toggleBatteryBank,
  toggleUmdbBreaker,
  simulateUpsDrill,
  generateInitialUpsEfficiencyHistory,
  appendUpsEfficiencyHistory,
  resolveActiveAlarms,
  updateMaintenanceStatus,
  completeMaintenance,
  type SimulatorState,
  type TelemetryData,
  type SystemCounters,
  type PowerTrendPoint,
  type UpsEfficiencyPoint,
  type ActiveAlarmItem,
  type AlarmSeverity,
} from './simulator/logic';
import { Header } from './components/Header';
import { SubBar, type ActiveTab } from './components/SubBar';
import { SimulationControls } from './components/SimulationControls';
import { TelemetryPanel } from './components/TelemetryPanel';
import { SourceGroup } from './components/SourceGroup';
import { MdbGroup } from './components/MdbGroup';
import { AtsGroup } from './components/AtsGroup';
import { SingleLineDiagram } from './components/SingleLineDiagram';
import { AcSummaryView } from './components/AcSummaryView';
import { UpsSystemView } from './components/UpsSystemView';
import { UpsEfficiencyView } from './components/UpsEfficiencyView';
import { HvDiagramView } from './components/HvDiagramView';
import { UpTierAnalysisView } from './components/UpTierAnalysisView';
import { MaintenancePanel } from './components/MaintenancePanel';
import { FloorPlanView } from './components/FloorPlanView';
import { ActiveAlarmsModal } from './components/ActiveAlarmsModal';
import { AlarmBanner } from './components/AlarmBanner';
import { OutputLogPanel, type LogEntry } from './components/OutputLogPanel';
import { AlarmExportView } from './components/AlarmExportView';
import { SystemKpisView } from './components/SystemKpisView';
import { PowerPathRerouteView } from './components/PowerPathRerouteView';
import { BasPtopPtoGView } from './components/BasPtopPtoGView';
import {
  generateInitialAlarmHistory,
  formatScadaTimestamp,
  type HistoricalAlarmRecord,
} from './simulator/alarmStorage';
import { soundEffects } from './utils/sound';

export default function App() {
  const [state, setState] = useState<SimulatorState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<ActiveTab>('ee');
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Real-time Alarm History & Export state
  const [alarmHistory, setAlarmHistory] = useState<HistoricalAlarmRecord[]>(() =>
    generateInitialAlarmHistory()
  );
  const [isRealtimeStreaming, setIsRealtimeStreaming] = useState<boolean>(true);
  const [pollIntervalMs, setPollIntervalMs] = useState<number>(1000);
  const [lastPullTimestamp, setLastPullTimestamp] = useState<string>(() =>
    new Date().toLocaleTimeString('th-TH')
  );

  // Alarm Deep-Link & Focus State
  const [alarmModalOpen, setAlarmModalOpen] = useState<boolean>(false);
  const [alarmFilter, setAlarmFilter] = useState<AlarmSeverity | 'ALL'>('ALL');
  const [highlightedElementId, setHighlightedElementId] = useState<string | null>(null);

  // Micro-fluctuation state for live electrical telemetry
  const [tick, setTick] = useState<number>(0);

  // Recharts rolling 60-second power consumption trend history
  const [trendHistory, setTrendHistory] = useState<PowerTrendPoint[]>(() =>
    generateInitialTrendHistory(calculateTelemetry(INITIAL_STATE, 0), 60)
  );

  // Recharts rolling 60-second UPS efficiency history
  const [efficiencyHistory, setEfficiencyHistory] = useState<UpsEfficiencyPoint[]>(() =>
    generateInitialUpsEfficiencyHistory(INITIAL_STATE, 60)
  );

  // Event Logs matching original log text
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      time: new Date().toLocaleTimeString('th-TH'),
      type: 'ready',
      message: 'ระบบไฟฟ้าสมบูรณ์พร้อมจำลองเหตุการณ์ แหล่งจ่ายไฟฟ้าและมิเตอร์โหลดเริ่มทำงานแล้ว (SILA1 Engine Ready)',
    },
    {
      id: 'init-2',
      time: new Date().toLocaleTimeString('th-TH'),
      type: 'normal',
      message: 'ระบบเชื่อมโยง Alarm Deep-Link พร้อมทำงาน: คลิกตัวนับ Alarm หรือปุ่ม [ไปที่อุปกรณ์] เพื่อกระโดดไปยังหน้าอุปกรณ์ที่มีปัญหาได้ทันที',
    },
    {
      id: 'init-3',
      time: new Date().toLocaleTimeString('th-TH'),
      type: 'normal',
      message: 'ระบบ UPS 3-Phase (UPS-3A & UPS-3B) และระบบ Up-Tier Fault Tolerance Engine พร้อมทำงานระดับ Tier III / Tier IV 2(N+1)',
    },
    {
      id: 'init-4',
      time: new Date().toLocaleTimeString('th-TH'),
      type: 'normal',
      message: 'ระบบสอบสวน BAS PtoP และ PtoG พร้อมใช้งาน: ตรวจสอบความถูกต้องของสัญญาณสนาม, Endianness, Register Offsets และ Ground Loop',
    },
  ]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('th-TH');
    const newEntry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      time,
      type,
      message,
    };
    setLogs((prev) => [...prev.slice(-100), newEntry]);
  }, []);

  // Cross-component handler for opening work orders from incident playbooks
  const openWorkOrderHandlerRef = useRef<((params: any) => void) | null>(null);

  const handleOpenWorkOrderFromIncident = useCallback((params: any) => {
    if (openWorkOrderHandlerRef.current) {
      openWorkOrderHandlerRef.current(params);
    }
    addLog(`[WORK ORDER] เปิด Job งานซ่อมบำรุงฉุกเฉิน: ${params.title} (${params.priority})`, 'alert');
  }, [addLog]);

  // Update sound effects global toggle
  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundEffects.enabled = next;
      if (next) soundEffects.playResetTone();
      return next;
    });
  };

  const handleToggleAutoStart = () => {
    setState((prev) => {
      const nextAuto = !prev.generatorAutoStart;
      addLog(
        `ระบบควบคุมอัตโนมัติ: Generator Auto-Transfer ถูกเปลี่ยนเป็น ${nextAuto ? 'เปิดใช้งาน (ENABLED)' : 'กำหนดเอง (MANUAL)'}`,
        'info'
      );
      return { ...prev, generatorAutoStart: nextAuto };
    });
  };

  // Toggle MDB Trip / Fault / Normal
  const handleToggleMdb = (mdbId: string) => {
    setState((prev) => {
      const { nextState, actionLog, isTrip } = toggleMdbTrip(prev, mdbId);
      const mdb = prev.mdbs[mdbId];

      if (isTrip) {
        soundEffects.playTripAlarm();
        addLog(actionLog, 'alert');
        // Check if ATS transferred
        const linkedAts = mdb.linkedAts[0];
        if (linkedAts && nextState.ats[linkedAts]) {
          const atsStatus = nextState.ats[linkedAts].status;
          addLog(
            `[Interlock] ตู้ ${mdb.name} ตัดวงจร -> ${nextState.ats[linkedAts].name} เปลี่ยนสถานะเป็น ${atsStatus}`,
            atsStatus === 'TRANSFER' ? 'transfer' : 'critical'
          );
        }
      } else {
        soundEffects.playResetTone();
        addLog(actionLog, 'normal');
      }

      // Step UPS to react to MDB power state
      return evaluateUpsSystemState(nextState, 1);
    });
  };

  // Toggle Sources (HV, TR-1, TR-2, GEN-1)
  const handleToggleSource = (sourceId: string, name: string) => {
    setState((prev) => {
      const { nextState, actionLog } = toggleSourceNode(prev, sourceId);
      soundEffects.playClick();
      addLog(actionLog, actionLog.includes('Critical') || actionLog.includes('Alert') ? 'alert' : 'normal');
      return evaluateUpsSystemState(nextState, 1);
    });
  };

  // UPS Module toggle
  const handleToggleUps = (upsId: string) => {
    setState((prev) => {
      const { nextState, actionLog } = toggleUpsUnit(prev, upsId);
      soundEffects.playClick();
      addLog(actionLog, actionLog.includes('FAULT') ? 'alert' : 'info');
      return nextState;
    });
  };

  // Battery Bank toggle
  const handleToggleBattery = (battId: string) => {
    setState((prev) => {
      const { nextState, actionLog } = toggleBatteryBank(prev, battId);
      soundEffects.playClick();
      addLog(actionLog, actionLog.includes('DISCHARGE') ? 'alert' : 'info');
      return nextState;
    });
  };

  // UMDB Breaker toggle
  const handleToggleUmdbBreaker = (umdbId: string, breakerType: 'input' | 'output') => {
    setState((prev) => {
      const { nextState, actionLog } = toggleUmdbBreaker(prev, umdbId, breakerType);
      soundEffects.playClick();
      addLog(actionLog, 'normal');
      return nextState;
    });
  };

  // UPS Blackout Drill
  const handleSimulateUpsDrill = () => {
    setState((prev) => {
      const { nextState, actionLog } = simulateUpsDrill(prev);
      if (actionLog.includes('ฉุกเฉิน')) {
        soundEffects.playTripAlarm();
        addLog(actionLog, 'alert');
      } else {
        soundEffects.playResetTone();
        addLog(actionLog, 'normal');
      }
      return nextState;
    });
  };

  // Controls: เริ่ม (Start)
  const handleStartSim = () => {
    if (!isSimRunning) {
      setIsSimRunning(true);
      soundEffects.playResetTone();
      addLog('เริ่มการทำงานของการจำลองระบบไฟฟ้า (Simulation Started / Resumed)', 'normal');
    }
  };

  // Controls: หยุด (Pause / Stop)
  const handleStopSim = () => {
    if (isSimRunning) {
      setIsSimRunning(false);
      soundEffects.playClick();
      addLog('พักการทำงานของการจำลองระบบไฟฟ้า (Simulation Paused)', 'info');
    }
  };

  // Controls: รีเซ็ต (Reset)
  const handleResetAll = () => {
    setState(INITIAL_STATE);
    setTrendHistory(generateInitialTrendHistory(calculateTelemetry(INITIAL_STATE, 0), 60));
    setIsSimRunning(true);
    soundEffects.playResetTone();
    addLog('รีเซ็ตระบบไฟฟ้าทั้งหมดและระบบ UPS กลับสู่สภาวะเริ่มต้น (System Reset All - All Stations Normal)', 'normal');
  };

  // Quick Scenarios
  const handleSimulateOutage = () => {
    handleToggleSource('src-hv', 'High Voltage (PEA/MEG)');
  };

  const handleSimulateMdbTrip = () => {
    handleToggleMdb('mdb-1a');
  };

  // Alarm Deep-Link & Focus Navigation
  const handleOpenAlarmHub = (filter: AlarmSeverity | 'ALL' = 'ALL') => {
    setAlarmFilter(filter);
    setAlarmModalOpen(true);
  };

  const handleNavigateToEquipment = useCallback(
    (tab: ActiveTab, elementId: string) => {
      setActiveTab(tab);
      setHighlightedElementId(elementId);
      soundEffects.playClick();
      addLog(
        `[Alarm Deep-Link] ดึงหน้าจอไปยังตำแหน่งอุปกรณ์: ${elementId} (แท็บ ${tab.toUpperCase()})`,
        'info'
      );

      // Smooth scroll to element after tab render
      setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      // Clear highlight after 4.5 seconds
      setTimeout(() => {
        setHighlightedElementId((curr) => (curr === elementId ? null : curr));
      }, 4500);
    },
    [addLog]
  );

  const handleNavigateToAlarm = useCallback(
    (alarm: ActiveAlarmItem) => {
      handleNavigateToEquipment(alarm.targetTab, alarm.targetElementId);
    },
    [handleNavigateToEquipment]
  );

  const handleQuickRecover = useCallback((alarm: ActiveAlarmItem) => {
    if (alarm.recoveryAction === 'reset-mdb' && alarm.equipmentId) {
      handleToggleMdb(alarm.equipmentId);
    } else if (alarm.recoveryAction === 'toggle-source' && alarm.equipmentId) {
      handleToggleSource(alarm.equipmentId, alarm.equipmentName);
    } else if (alarm.recoveryAction === 'toggle-ups' && alarm.equipmentId) {
      handleToggleUps(alarm.equipmentId);
    }
  }, [handleToggleMdb, handleToggleSource, handleToggleUps]);

  const handlePerformService = (equipmentId: string) => {
    setState((prev) => completeMaintenance(prev, equipmentId));
    addLog(`[Maintenance] ทำการบำรุงรักษาอุปกรณ์ ${equipmentId} เรียบร้อยแล้ว`, 'normal');
    soundEffects.playResetTone();
  };

  // Synchronize active alarms into historical records buffer
  const syncRealtimeAlarms = useCallback((currentActiveAlarms: ActiveAlarmItem[]) => {
    setAlarmHistory((prevHistory) => {
      const activeMap = new Map(currentActiveAlarms.map((a) => [a.id, a]));
      const now = new Date();
      const nowStr = formatScadaTimestamp(now);
      const nowEpoch = now.getTime();

      let hasChanges = false;
      // 1. Mark alarms that cleared as RESOLVED
      const updatedHistory = prevHistory.map((record) => {
        if (record.status === 'ACTIVE' && !activeMap.has(record.id)) {
          hasChanges = true;
          const durationSec = Math.max(1, Math.round((nowEpoch - record.epochMs) / 1000));
          return {
            ...record,
            status: 'RESOLVED' as const,
            resolvedTime: nowStr,
            durationSec,
          };
        }
        return record;
      });

      // 2. Add newly triggered alarms
      const existingActiveIds = new Set(
        updatedHistory.filter((r) => r.status === 'ACTIVE' || r.status === 'ACKNOWLEDGED').map((r) => r.id)
      );

      const newRecords: HistoricalAlarmRecord[] = [];
      currentActiveAlarms.forEach((act) => {
        if (!existingActiveIds.has(act.id)) {
          hasChanges = true;
          newRecords.push({
            id: act.id,
            code: act.code,
            priority: act.severity,
            deviceTag: act.equipmentId.toUpperCase(),
            subsystem: act.locationText,
            messageTh: act.title,
            messageEn: act.description,
            triggerValue: act.severity === 'CRITICAL' ? 'Fault Condition' : 'Warning Event',
            threshold: 'Standard Limit',
            status: 'ACTIVE',
            eventTime: nowStr,
            epochMs: nowEpoch,
            targetTab: act.targetTab,
            targetElementId: act.targetElementId,
          });
        }
      });

      if (!hasChanges && newRecords.length === 0) {
        return prevHistory;
      }

      return [...newRecords, ...updatedHistory].slice(0, 1000);
    });

    setLastPullTimestamp(new Date().toLocaleTimeString('th-TH'));
  }, []);

  const handleAcknowledgeAlarm = (alarmId: string) => {
    setAlarmHistory((prev) =>
      prev.map((r) =>
        r.id === alarmId ? { ...r, status: 'ACKNOWLEDGED', acknowledgedBy: 'SCADA Duty Tech' } : r
      )
    );
    soundEffects.playClick();
    addLog(`[Alarm Ack] เจ้าหน้าที่รับทราบสัญญาณเตือนภัย ${alarmId} เรียบร้อยแล้ว`, 'info');
  };

  const handleResolveAlarm = (alarmId: string) => {
    const now = new Date();
    setAlarmHistory((prev) =>
      prev.map((r) =>
        r.id === alarmId
          ? {
              ...r,
              status: 'RESOLVED',
              resolvedTime: formatScadaTimestamp(now),
              durationSec: r.durationSec ?? Math.max(1, Math.round((now.getTime() - r.epochMs) / 1000)),
            }
          : r
      )
    );
    soundEffects.playResetTone();
    addLog(`[Alarm Clear] ทำการปลดสถานะเตือนภัย ${alarmId} กลับสู่สภาวะปกติ (Resolved)`, 'normal');
  };

  const handleClearAlarmHistory = () => {
    setAlarmHistory([]);
    soundEffects.playClick();
    addLog('ล้างประวัติข้อมูลสัญญาณเตือนภัย SCADA Alarm Logs ทั้งหมดแล้ว', 'info');
  };

  const handleRestoreAlarmDefaults = () => {
    setAlarmHistory(generateInitialAlarmHistory());
    soundEffects.playResetTone();
    addLog('กู้คืนชุดข้อมูลบันทึกสัญญาณเตือนภัยตัวอย่าง (SCADA Baseline) เรียบร้อยแล้ว', 'normal');
  };

  const handleInjectTestAlarm = () => {
    const testId = `ALM-SIM-${Date.now().toString().slice(-4)}`;
    const now = new Date();
    const testItem: HistoricalAlarmRecord = {
      id: testId,
      code: 'ALM-SIM-BURST',
      priority: 'MAJOR',
      deviceTag: 'ATS-2A',
      subsystem: 'HVAC Plant A Transfer Switch',
      messageTh: 'การทดสอบส่งข้อมูล Real-time จำลองไฟตกชั่วขณะ (Simulated Voltage Sag Burst)',
      messageEn: 'Synthetic transient voltage sag burst injected for real-time SCADA validation',
      triggerValue: '342 V (-10%)',
      threshold: 'Nominal 380V',
      status: 'ACTIVE',
      eventTime: formatScadaTimestamp(now),
      epochMs: now.getTime(),
      targetTab: 'ee',
      targetElementId: 'ats-2a',
    };
    setAlarmHistory((prev) => [testItem, ...prev]);
    soundEffects.playTripAlarm();
    addLog(`[Sim Injected] จำลองเหตุการณ์สัญญาณเตือน ${testId} เข้าสู่ระบบ Real-time สำเร็จ`, 'alert');
  };

  const handleNavigateToDeviceFromAlarm = (targetTab: string, targetElementId?: string) => {
    setActiveTab(targetTab as ActiveTab);
    if (targetElementId) {
      setHighlightedElementId(targetElementId);
      soundEffects.playClick();
      addLog(`[Nav] กระโดดไปยังอุปกรณ์ ${targetElementId} ในแท็บ ${targetTab.toUpperCase()}`, 'info');
      setTimeout(() => {
        setHighlightedElementId(null);
      }, 4500);
    }
  };

  // Live timer interval for micro telemetry noise, rolling trend, and efficiency history
  useEffect(() => {
    if (!isSimRunning) return;

    const intervalTime = Math.max(200, 1000 / simSpeed);
    const timer = setInterval(() => {
      setTick((t) => (t + 1) % 10000);

      // Increment maintenance runtime (e.g., 1 hour per tick for simulation purposes)
      setState((prev) => updateMaintenanceStatus(prev, 1));

      // Advance UPS battery state if discharging/charging
      setState((prev) => evaluateUpsSystemState(prev, 1));

      // Append new sample to Recharts 60-second power consumption trend
      setTrendHistory((prevHistory) => {
        const microNoise = Math.sin(Date.now() * 0.003) * 0.6;
        const currentTelem = calculateTelemetry(state, microNoise);
        return appendTrendHistory(
          prevHistory,
          {
            timestamp: Date.now(),
            powerKw: currentTelem.powerKw,
            loadPercent: currentTelem.loadPercent,
            voltage: currentTelem.voltage,
            current: currentTelem.current,
          },
          60
        );
      });

      // Append new sample to Recharts UPS efficiency history
      setEfficiencyHistory((prevHistory) =>
        appendUpsEfficiencyHistory(prevHistory, state, 60)
      );
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isSimRunning, simSpeed, state]);

  // Real-time alarm stream polling timer
  useEffect(() => {
    if (!isRealtimeStreaming) return;
    const streamTimer = setInterval(() => {
      const currentActive = resolveActiveAlarms(state);
      syncRealtimeAlarms(currentActive);
    }, pollIntervalMs);
    return () => clearInterval(streamTimer);
  }, [isRealtimeStreaming, pollIntervalMs, state, syncRealtimeAlarms]);

  // Derived values
  const microNoise = isSimRunning ? Math.sin(tick * 0.4) * 0.6 : 0;
  const telemetry: TelemetryData = calculateTelemetry(state, microNoise);
  const counters: SystemCounters = calculateCounters(state);

  // Active alarms & per-tab alarm badges
  const activeAlarms: ActiveAlarmItem[] = resolveActiveAlarms(state);
  const alarmCountByTab = activeAlarms.reduce<Partial<Record<ActiveTab, number>>>((acc, alm) => {
    acc[alm.targetTab] = (acc[alm.targetTab] || 0) + 1;
    return acc;
  }, {});

  // Show active alarm count on alarm-export tab badge
  if (activeAlarms.length > 0) {
    alarmCountByTab['alarm-export'] = activeAlarms.length;
  }

  const handleManualPullLatest = () => {
    syncRealtimeAlarms(activeAlarms);
    soundEffects.playClick();
    addLog('ดึงข้อมูลสัญญาณเตือนล่าสุด (Real-time Pull) เรียบร้อยแล้ว', 'info');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#2b2b2b] text-white font-sans overflow-hidden select-none">
      {/* Top Header with branding, audio toggle, and clickable alarm counters */}
      <Header
        counters={counters}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        generatorAutoStart={state.generatorAutoStart}
        onToggleAutoStart={handleToggleAutoStart}
        onOpenAlarmHub={handleOpenAlarmHub}
      />

      {/* Sub-bar with Summary / Diagram selectors & Alarm Badges */}
      <SubBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onResetAll={handleResetAll}
        onSimulateOutage={handleSimulateOutage}
        onSimulateMdbTrip={handleSimulateMdbTrip}
        onSimulateUpsDrill={handleSimulateUpsDrill}
        alarmCountByTab={alarmCountByTab}
      />

      {/* Prominent Active Alarm Banner with Direct 1-Click Jump */}
      <AlarmBanner
        alarms={activeAlarms}
        onOpenModal={() => handleOpenAlarmHub('ALL')}
        onNavigateToAlarm={handleNavigateToAlarm}
      />

      {/* Main Workspace */}
      <main className="workspace flex-1 p-3 sm:p-5 bg-[#333] flex flex-col gap-3.5 overflow-y-auto">
        {/* Simulation Controls: เริ่ม / หยุด / รีเซ็ต */}
        <SimulationControls
          isRunning={isSimRunning}
          onStart={handleStartSim}
          onStop={handleStopSim}
          onReset={handleResetAll}
          simSpeed={simSpeed}
          onChangeSpeed={setSimSpeed}
        />

        {/* Realtime Telemetry Dashboard with D3 Radial Utility Voltage Gauge and Recharts System Load Trend */}
        <TelemetryPanel
          telemetry={telemetry}
          trendHistory={trendHistory}
          isSimRunning={isSimRunning}
          utilityVoltage={state.sources['src-hv']?.status === 'ONLINE' ? telemetry.voltage : 0.0}
          utilityStatus={state.sources['src-hv']?.status ?? 'ONLINE'}
        />

        {/* Tab 1: EE SUMMARY (Default Electrical Single-Line Distribution) */}
        {activeTab === 'ee' && (
          <div className="flex flex-col gap-4">
            {/* Source Group: HV, Transformers, Generator */}
            <SourceGroup
              sources={state.sources}
              onToggleSource={handleToggleSource}
              highlightedElementId={highlightedElementId}
            />

            {/* MDB Group: Main Distribution Boards */}
            <MdbGroup
              mdbs={state.mdbs}
              onToggleMdb={handleToggleMdb}
              highlightedElementId={highlightedElementId}
            />

            {/* ATS Group: Automatic Transfer Switches */}
            <AtsGroup
              atsList={state.ats}
            />
          </div>
        )}

        {/* Tab: POWER PATH REROUTE & TIER SLA COUNTDOWN & SOLUTIONS */}
        {activeTab === 'power-path' && (
          <PowerPathRerouteView
            state={state}
            onNavigateToTab={setActiveTab}
            onNavigateToEquipment={handleNavigateToEquipment}
            onOpenWorkOrder={handleOpenWorkOrderFromIncident}
          />
        )}

        {/* Tab 2: HV 22kV DIAGRAM (Schneider RM6 & Ekarat 2000kVA Dyn11 Transformers) */}
        {activeTab === 'hv-diagram' && (
          <HvDiagramView
            state={state}
            onToggleSource={handleToggleSource}
            onToggleMdb={handleToggleMdb}
            onNavigateToTab={setActiveTab}
            highlightedElementId={highlightedElementId}
          />
        )}

        {/* Tab 3: UPS SUMMARY (Full SCADA Data Hall 3-Phase UPS & Battery Strings) */}
        {activeTab === 'ups' && (
          <UpsSystemView
            state={state}
            onToggleUps={handleToggleUps}
            onToggleBattery={handleToggleBattery}
            onToggleUmdbBreaker={handleToggleUmdbBreaker}
            onSimulateDrill={handleSimulateUpsDrill}
            onResetAll={handleResetAll}
            onTabChange={setActiveTab}
            highlightedElementId={highlightedElementId}
          />
        )}

        {/* Tab 4: UPS EFFICIENCY (Recharts Pin vs Pout & 60-Module Heat Loss Map) */}
        {activeTab === 'ups-efficiency' && (
          <UpsEfficiencyView
            state={state}
            efficiencyHistory={efficiencyHistory}
            onSimulateDrill={handleSimulateUpsDrill}
            onResetAll={handleResetAll}
            onTabChange={setActiveTab}
          />
        )}

        {/* Tab 5: UP-TIER SIMULATION & FAULT TOLERANCE ENGINE (Tier III vs Tier IV) */}
        {activeTab === 'up-tier' && (
          <UpTierAnalysisView
            state={state}
            onNavigateToTab={setActiveTab}
            onNavigateToEquipment={handleNavigateToEquipment}
          />
        )}

        {/* Tab 6: MAINTENANCE & REAL-TIME GOOGLE SHEETS */}
        {activeTab === 'maintenance' && (
          <MaintenancePanel
            state={state}
            onPerformService={handlePerformService}
            onOpenWorkOrderRef={(fn) => {
              openWorkOrderHandlerRef.current = fn;
            }}
          />
        )}

        {/* Tab: SYSTEM KPIS */}
        {activeTab === 'kpi' && (
          <SystemKpisView state={state} telemetry={telemetry} />
        )}

        {/* Tab 7: FLOOR PLAN (GIS 3rd Floor Architectural Data Hall Layout) */}
        {activeTab === 'floor' && (
          <FloorPlanView
            state={state}
            onToggleUps={handleToggleUps}
            onToggleBattery={handleToggleBattery}
            onSimulateOutage={handleSimulateOutage}
            onResetAll={handleResetAll}
            highlightedElementId={highlightedElementId}
            onNavigateToTab={handleNavigateToDeviceFromAlarm}
          />
        )}

        {/* Tab 7: AC SUMMARY (Air Conditioning & Chillers View) */}
        {activeTab === 'ac' && (
          <AcSummaryView state={state} />
        )}

        {/* Tab 8: OVERVIEW (Single-Line Diagram Schematic View) */}
        {activeTab === 'overview' && (
          <SingleLineDiagram
            state={state}
            onToggleMdb={handleToggleMdb}
            onToggleSource={handleToggleSource}
          />
        )}

        {/* Tab 9: ALARM EXPORT & REAL-TIME QUERY (EXCEL / SQL) */}
        {activeTab === 'alarm-export' && (
          <AlarmExportView
            alarmHistory={alarmHistory}
            onAcknowledgeAlarm={handleAcknowledgeAlarm}
            onResolveAlarm={handleResolveAlarm}
            onClearHistory={handleClearAlarmHistory}
            onRestoreDefaults={handleRestoreAlarmDefaults}
            onInjectTestAlarm={handleInjectTestAlarm}
            onNavigateToDevice={handleNavigateToDeviceFromAlarm}
            telemetry={telemetry}
            isRealtimeStreaming={isRealtimeStreaming}
            onToggleRealtimeStreaming={() => setIsRealtimeStreaming((prev) => !prev)}
            pollIntervalMs={pollIntervalMs}
            onChangePollInterval={setPollIntervalMs}
            onManualPullLatest={handleManualPullLatest}
            lastPullTimestamp={lastPullTimestamp}
          />
        )}

        {/* Tab 10: BAS PtoP & PtoG INVESTIGATION REPORT & VENDOR PROTOCOLS */}
        {activeTab === 'bas-ptop' && (
          <BasPtopPtoGView
            onNavigateToTab={setActiveTab}
            onNavigateToEquipment={handleNavigateToEquipment}
          />
        )}
      </main>

      {/* Output Event Log Panel with Equipment Deep-Link Buttons */}
      <OutputLogPanel
        logs={logs}
        onClearLogs={() => setLogs([])}
        onNavigateToEquipment={handleNavigateToEquipment}
      />

      {/* Interactive Active Alarms Diagnostic Modal / Drawer */}
      <ActiveAlarmsModal
        isOpen={alarmModalOpen}
        onClose={() => setAlarmModalOpen(false)}
        alarms={activeAlarms}
        filterSeverity={alarmFilter}
        onNavigateToAlarm={handleNavigateToAlarm}
        onQuickRecover={handleQuickRecover}
        onResetAll={handleResetAll}
        onOpenExportTab={() => setActiveTab('alarm-export')}
      />
    </div>
  );
}

