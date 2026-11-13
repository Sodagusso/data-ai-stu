import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_STATE,
  toggleMdbTrip,
  toggleSourceNode,
  calculateTelemetry,
  calculateCounters,
  evaluateAtsState,
  calculateTotalPowerKw,
  generateInitialTrendHistory,
  appendTrendHistory,
  calculateTrendStats,
  evaluateUpsSystemState,
  toggleUpsUnit,
  toggleBatteryBank,
  simulateUpsDrill,
  calculateUpsModuleThermalLosses,
  calculateUpsEfficiencySummary,
  generateInitialUpsEfficiencyHistory,
  appendUpsEfficiencyHistory,
  resolveActiveAlarms,
  simulateUpTierDrill,
  openMaintenanceJob,
  acknowledgeMaintenanceJob,
  resolveMaintenanceJob,
  generateMaintenanceJobsCsv,
  generateGoogleSheetsClipboardTsv,
  TIER_STANDARDS,
  REMEDIATION_SOLUTIONS,
  INITIAL_MAINTENANCE_JOBS,
  type SimulatorState,
  type MaintenanceJob,
} from './logic';

test('Initial state has all sources and MDBs normal', () => {
  assert.equal(INITIAL_STATE.sources['src-hv'].status, 'ONLINE');
  assert.equal(INITIAL_STATE.sources['tr-1'].status, 'ACTIVE');
  assert.equal(INITIAL_STATE.sources['gen-1'].status, 'STANDBY');
  assert.equal(INITIAL_STATE.mdbs['mdb-1a'].status, 'NORMAL');
  assert.equal(INITIAL_STATE.ats['ats-1a'].status, 'SYNC OK');

  const counters = calculateCounters(INITIAL_STATE);
  assert.equal(counters.critical, 0);
  assert.equal(counters.major, 0);
});

test('Toggling MDB to trip updates state, ATS, and counters', () => {
  const result = toggleMdbTrip(INITIAL_STATE, 'mdb-1a');
  assert.equal(result.isTrip, true);
  assert.equal(result.nextState.mdbs['mdb-1a'].status, 'TRIPPED');

  // Generator auto-starts and ATS switches to TRANSFER
  assert.equal(result.nextState.sources['gen-1'].status, 'RUNNING');
  assert.equal(result.nextState.ats['ats-1a'].status, 'TRANSFER');

  // Counters reflect the fault
  const counters = calculateCounters(result.nextState);
  assert.ok(counters.critical >= 1, 'Critical counter should be >= 1');
  assert.ok(counters.major >= 1, 'Major counter should be >= 1');
});

test('Toggling MDB back to normal restores ATS to SYNC OK', () => {
  const tripResult = toggleMdbTrip(INITIAL_STATE, 'mdb-1a');
  const restoreResult = toggleMdbTrip(tripResult.nextState, 'mdb-1a');

  assert.equal(restoreResult.isTrip, false);
  assert.equal(restoreResult.nextState.mdbs['mdb-1a'].status, 'NORMAL');
  assert.equal(restoreResult.nextState.ats['ats-1a'].status, 'SYNC OK');
});

test('HV feed outage turns off transformers and auto-starts generator', () => {
  const hvResult = toggleSourceNode(INITIAL_STATE, 'src-hv');
  assert.equal(hvResult.nextState.sources['src-hv'].status, 'FAULT');
  assert.equal(hvResult.nextState.sources['tr-1'].status, 'OFFLINE');
  assert.equal(hvResult.nextState.sources['tr-2'].status, 'OFFLINE');
  assert.equal(hvResult.nextState.sources['gen-1'].status, 'RUNNING');

  // All ATS should transfer to emergency generator
  assert.equal(hvResult.nextState.ats['ats-1a'].status, 'TRANSFER');
  assert.equal(hvResult.nextState.ats['ats-1b'].status, 'TRANSFER');
});

test('Telemetry calculates nominal voltage, frequency, and current', () => {
  const telem = calculateTelemetry(INITIAL_STATE, 0);
  assert.ok(telem.voltage >= 380, `Voltage should be ~380V, got ${telem.voltage}`);
  assert.ok(telem.current > 1000, `Current should be > 1000A, got ${telem.current}`);
  assert.equal(telem.frequency, 50.0);
  assert.ok(telem.loadPercent > 60 && telem.loadPercent < 90, `Load% reasonable: ${telem.loadPercent}`);
});

test('Evaluate ATS state directly', () => {
  const mdbNormal = { id: 'm', name: 'MDB', status: 'NORMAL' as const, baseCurrent: 100, linkedAts: [], bus: 'A' as const };
  const mdbTripped = { id: 'm', name: 'MDB', status: 'TRIPPED' as const, baseCurrent: 100, linkedAts: [], bus: 'A' as const };

  assert.equal(evaluateAtsState(mdbNormal, 'ACTIVE', 'ONLINE', 'STANDBY'), 'SYNC OK');
  assert.equal(evaluateAtsState(mdbTripped, 'ACTIVE', 'ONLINE', 'RUNNING'), 'TRANSFER');
  assert.equal(evaluateAtsState(mdbTripped, 'ACTIVE', 'ONLINE', 'STANDBY'), 'POWER LOST');
});

test('calculateTotalPowerKw calculates 3-phase real power accurately', () => {
  // At 380V, 1000A, PF 0.88 -> sqrt(3) * 380 * 1000 * 0.88 / 1000 = 579.16 kW -> 579.2 kW
  const kw = calculateTotalPowerKw(380, 1000, 0.88);
  assert.ok(Math.abs(kw - 579.2) < 0.2, `Expected ~579.2, got ${kw}`);

  // Zero voltage or current yields 0 kW
  assert.equal(calculateTotalPowerKw(0, 1000), 0);
  assert.equal(calculateTotalPowerKw(380, 0), 0);
});

test('generateInitialTrendHistory produces exactly 60 seconds of valid data', () => {
  const telem = calculateTelemetry(INITIAL_STATE, 0);
  const history = generateInitialTrendHistory(telem, 60);

  assert.equal(history.length, 60);
  assert.equal(history[history.length - 1].time, 'Now');
  assert.equal(history[0].time, '-59s');

  history.forEach((pt) => {
    assert.ok(pt.powerKw > 0, 'Initial points should have positive power');
    assert.ok(pt.voltage > 350, 'Voltage should be near nominal');
    assert.ok(pt.loadPercent > 0 && pt.loadPercent <= 100, 'Load percent should be valid');
  });
});

test('appendTrendHistory maintains rolling 60-second window and relative time labels', () => {
  const telem = calculateTelemetry(INITIAL_STATE, 0);
  let history = generateInitialTrendHistory(telem, 60);

  const newSample = {
    timestamp: 1,
    powerKw: 650.5,
    loadPercent: 72.1,
    voltage: 380.0,
    current: 1100.0,
  };

  history = appendTrendHistory(history, newSample, 60);
  assert.equal(history.length, 60);
  assert.equal(history[history.length - 1].powerKw, 650.5);
  assert.equal(history[history.length - 1].time, 'Now');
  assert.equal(history[history.length - 2].time, '-1s');
  assert.equal(history[0].time, '-59s');
});

test('calculateTrendStats derives accurate min, max, average, and fluctuation percentage', () => {
  const mockHistory = [
    { time: '-2s', timestamp: -2, powerKw: 700, loadPercent: 70, voltage: 380, current: 1200 },
    { time: '-1s', timestamp: -1, powerKw: 750, loadPercent: 75, voltage: 380, current: 1250 },
    { time: 'Now', timestamp: 0, powerKw: 725, loadPercent: 72.5, voltage: 380, current: 1225 },
  ];

  const stats = calculateTrendStats(mockHistory);
  assert.equal(stats.current, 725);
  assert.equal(stats.min, 700);
  assert.equal(stats.max, 750);
  assert.equal(stats.avg, 725);
  // range = 50, avg = 725 -> 50 / 725 * 100 = 6.9%
  assert.ok(Math.abs(stats.fluctuationPct - 6.9) < 0.2);
});

test('UPS Initial state is online with battery float charging', () => {
  assert.equal(INITIAL_STATE.upsUnits['ups-1a1'].status, 'ONLINE');
  assert.equal(INITIAL_STATE.batteries['batt-1a1'].status, 'FLOAT');
  assert.equal(INITIAL_STATE.batteries['batt-1a1'].socPercent, 100);
  assert.equal(INITIAL_STATE.umdbs['umdb-1a'].status, 'ON_UPS');
});

test('MDB outage causes linked UPS to seamlessly transfer to BATTERY discharge', () => {
  // Trip MDB1A
  const tripState = {
    ...INITIAL_STATE,
    mdbs: {
      ...INITIAL_STATE.mdbs,
      'mdb-1a': { ...INITIAL_STATE.mdbs['mdb-1a'], status: 'TRIPPED' as const },
    },
  };

  const evaluated = evaluateUpsSystemState(tripState, 1);
  assert.equal(evaluated.umdbs['umdb-1a'].status, 'ON_BATTERY');
  assert.equal(evaluated.upsUnits['ups-1a1'].status, 'BATTERY');
  assert.equal(evaluated.batteries['batt-1a1'].status, 'DISCHARGE');
  assert.ok(evaluated.batteries['batt-1a1'].currentAmps < 0, 'Discharge current should be negative');
});

test('Manual toggle of UPS unit cycles modes', () => {
  const t1 = toggleUpsUnit(INITIAL_STATE, 'ups-1a1');
  assert.equal(t1.nextState.upsUnits['ups-1a1'].status, 'BATTERY');

  const t2 = toggleUpsUnit(t1.nextState, 'ups-1a1');
  assert.equal(t2.nextState.upsUnits['ups-1a1'].status, 'BYPASS');

  const t3 = toggleUpsUnit(t2.nextState, 'ups-1a1');
  assert.equal(t3.nextState.upsUnits['ups-1a1'].status, 'FAULT');

  const t4 = toggleUpsUnit(t3.nextState, 'ups-1a1');
  assert.equal(t4.nextState.upsUnits['ups-1a1'].status, 'ONLINE');
});

test('simulateUpsDrill triggers and toggles system-wide battery discharge test', () => {
  const drill = simulateUpsDrill(INITIAL_STATE);
  assert.equal(drill.nextState.upsUnits['ups-1a1'].status, 'BATTERY');
  assert.equal(drill.nextState.batteries['batt-1a1'].status, 'DISCHARGE');

  const restore = simulateUpsDrill(drill.nextState);
  assert.equal(restore.nextState.upsUnits['ups-1a1'].status, 'ONLINE');
  assert.equal(restore.nextState.batteries['batt-1a1'].status, 'FLOAT');
});

test('calculateUpsModuleThermalLosses produces 60 modular blocks with valid thermal telemetry', () => {
  const modules = calculateUpsModuleThermalLosses(INITIAL_STATE);
  assert.equal(modules.length, 60); // 6 units x 10 modules

  for (const m of modules) {
    assert.ok(m.moduleId >= 1 && m.moduleId <= 10);
    assert.ok(m.temperatureC >= 23.5 && m.temperatureC <= 65);
    assert.ok(m.efficiencyPct >= 90);
    assert.ok(m.lossKw > 0);
    assert.ok(m.conductionLossKw >= 0);
    assert.ok(m.switchingLossKw >= 0);
    assert.ok(m.heatBtuPerHour > 0);
    assert.ok(m.fanSpeedRpm >= 1000);
  }
});

test('Module faults redistribute load and update module heat dissipation', () => {
  // Fault module 3 on UPS-3A1
  const faults = {
    'ups-3a1': { 3: true },
  };

  const modules = calculateUpsModuleThermalLosses(INITIAL_STATE, faults);
  const faultedMod = modules.find((m) => m.unitId === 'ups-3a1' && m.moduleId === 3);
  const healthyMod = modules.find((m) => m.unitId === 'ups-3a1' && m.moduleId === 1);

  assert.ok(faultedMod);
  assert.equal(faultedMod.status, 'FAULT');
  assert.equal(faultedMod.loadKw, 0);

  assert.ok(healthyMod);
  assert.equal(healthyMod.status, 'NORMAL');
  // 96.2 kW across 9 modules = ~10.69 kW per module (higher than 96.2 / 10 = 9.62 kW)
  assert.ok(healthyMod.loadKw > 10.0);
});

test('calculateUpsEfficiencySummary aggregates total loss, PUE impact, and financial cost', () => {
  const modules = calculateUpsModuleThermalLosses(INITIAL_STATE);
  const summary = calculateUpsEfficiencySummary(modules, INITIAL_STATE);

  assert.ok(summary.totalInputKw > summary.totalOutputKw);
  assert.ok(summary.totalLossKw > 0);
  assert.ok(summary.systemEfficiencyPct > 95 && summary.systemEfficiencyPct < 99);
  assert.ok(summary.totalHeatBtuPerHour > 0);
  assert.ok(summary.pueImpact > 0 && summary.pueImpact < 0.1);
  assert.ok(summary.monthlyLossCostThb > 0);
  assert.ok(summary.hottestModule.temperatureC >= summary.coolestModule.temperatureC);
});

test('generateInitialUpsEfficiencyHistory and append maintain 60s rolling window', () => {
  const initial = generateInitialUpsEfficiencyHistory(INITIAL_STATE, 60);
  assert.equal(initial.length, 60);
  assert.equal(initial[0].time, '-59s');
  assert.equal(initial[initial.length - 1].time, '-0s');

  const appended = appendUpsEfficiencyHistory(initial, INITIAL_STATE, 60);
  assert.equal(appended.length, 60);
  assert.equal(appended[appended.length - 1].time, '0s');
  assert.equal(appended[0].time, '-59s');
  assert.ok(appended[appended.length - 1].efficiencyPct > 90);
});

test('resolveActiveAlarms detects tripped MDBs and provides deep link target', () => {
  // Initially no alarms
  const initialAlarms = resolveActiveAlarms(INITIAL_STATE);
  assert.equal(initialAlarms.length, 0);

  // Trip MDB1A
  const tripResult = toggleMdbTrip(INITIAL_STATE, 'mdb-1a');
  const activeAlarms = resolveActiveAlarms(tripResult.nextState);

  assert.ok(activeAlarms.length > 0);
  const mdbAlarm = activeAlarms.find((a) => a.equipmentId === 'mdb-1a');
  assert.ok(mdbAlarm, 'Should have an alarm for mdb-1a');
  assert.equal(mdbAlarm.severity, 'CRITICAL');
  assert.equal(mdbAlarm.targetTab, 'ee');
  assert.equal(mdbAlarm.targetElementId, 'mdb-1a');
  assert.ok(mdbAlarm.locationText.includes('Power Room'));
});

test('resolveActiveAlarms detects HV Grid Outage and links to HV Diagram', () => {
  const outageResult = toggleSourceNode(INITIAL_STATE, 'src-hv');
  const alarms = resolveActiveAlarms(outageResult.nextState);

  const hvAlarm = alarms.find((a) => a.equipmentId === 'src-hv');
  assert.ok(hvAlarm);
  assert.equal(hvAlarm.severity, 'CRITICAL');
  assert.equal(hvAlarm.targetTab, 'hv-diagram');
  assert.equal(hvAlarm.targetElementId, 'src-hv');
});

test('simulateUpTierDrill compares Tier III vs Tier IV fault tolerance behavior', () => {
  const tier3Report = simulateUpTierDrill('TIER_3', 'HV_FEED_LOSS');
  assert.equal(tier3Report.tierEvaluated, 'TIER_3');
  assert.equal(tier3Report.concurrentMaintainabilityPass, true);
  assert.equal(tier3Report.faultTolerancePass, false);
  assert.ok(tier3Report.autonomousIsolationTimeMs > 1000);

  const tier4Report = simulateUpTierDrill('TIER_4', 'HV_FEED_LOSS');
  assert.equal(tier4Report.tierEvaluated, 'TIER_4');
  assert.equal(tier4Report.concurrentMaintainabilityPass, true);
  assert.equal(tier4Report.faultTolerancePass, true);
  assert.ok(tier4Report.autonomousIsolationTimeMs < 20);
  assert.equal(tier4Report.tierCertificationStatus, 'COMPLIANT');
});

test('UPS-3B2 and BATT-3B2 are fully configured with parity to UPS-3A2', () => {
  assert.ok(INITIAL_STATE.upsUnits['ups-3b2'], 'UPS-3B2 exists in state');
  assert.equal(INITIAL_STATE.upsUnits['ups-3b2'].name, 'UPS-3B2');
  assert.equal(INITIAL_STATE.upsUnits['ups-3b2'].bus, 'B');
  assert.equal(INITIAL_STATE.upsUnits['ups-3b2'].capacityKva, 500);
  assert.ok(INITIAL_STATE.batteries['batt-3b2'], 'BATT-3B2 exists in state');
  assert.equal(INITIAL_STATE.batteries['batt-3b2'].name, 'BATT-3B2');
  assert.equal(INITIAL_STATE.batteries['batt-3b2'].voltageDc, 542.0);

  // Toggle UPS-3B2 mode (ONLINE -> BATTERY) and verify alarm generation
  const { nextState: toggledState } = toggleUpsUnit(INITIAL_STATE, 'ups-3b2');
  assert.equal(toggledState.upsUnits['ups-3b2'].status, 'BATTERY');
  const activeAlarms = resolveActiveAlarms(toggledState);
  const ups3b2Alarm = activeAlarms.find((a) => a.equipmentId === 'ups-3b2');
  assert.ok(ups3b2Alarm, 'Alarm generated for discharging UPS-3B2');
  assert.equal(ups3b2Alarm.targetTab, 'ups');
  assert.equal(ups3b2Alarm.targetElementId, 'ups-3b2');
});

test('Real-time main utility input voltage telemetry nominal and blackout collapse', () => {
  // Nominal online utility voltage
  const nominalTelem = calculateTelemetry(INITIAL_STATE, 0);
  assert.ok(nominalTelem.voltage >= 379 && nominalTelem.voltage <= 382, 'Nominal utility voltage around 380V');
  assert.equal(nominalTelem.frequency, 50.0, 'Nominal utility frequency 50Hz');

  // Utility outage simulation
  const blackoutState: SimulatorState = {
    ...INITIAL_STATE,
    sources: {
      ...INITIAL_STATE.sources,
      'src-hv': { ...INITIAL_STATE.sources['src-hv'], status: 'FAULT' },
      'tr-1': { ...INITIAL_STATE.sources['tr-1'], status: 'ACTIVE' },
      'tr-2': { ...INITIAL_STATE.sources['tr-2'], status: 'ACTIVE' },
      'gen-1': { ...INITIAL_STATE.sources['gen-1'], status: 'STANDBY' },
    },
  };

  const blackoutTelem = calculateTelemetry(blackoutState, 0);
  assert.equal(blackoutTelem.voltage, 0.0, 'Grid voltage collapses to 0V during utility outage without generator');
  assert.equal(blackoutTelem.powerKw, 0.0, 'Grid power drops to 0kW during utility outage');
});

test('Maintenance Work Order lifecycle: Open -> Acknowledge -> Resolve with SLA compliance', () => {
  let jobs: MaintenanceJob[] = [...INITIAL_MAINTENANCE_JOBS];
  const initialCount = jobs.length;

  // 1. Open Job
  jobs = openMaintenanceJob(jobs, {
    title: 'ทดสอบการสับ Tie-Breaker MDB1A',
    equipmentId: 'mdb-1a',
    equipmentName: 'MDB1A (Main Bus A)',
    jobType: 'EMERGENCY_SOP',
    priority: 'P1_CRITICAL',
    description: 'ทดสอบระบบสับเปลี่ยนอัตโนมัติ',
    assignedTo: 'Lead Engineer',
  });
  assert.equal(jobs.length, initialCount + 1, 'Job added to list');
  const createdJob = jobs[0];
  assert.equal(createdJob.status, 'OPEN');
  assert.equal(createdJob.priority, 'P1_CRITICAL');
  assert.equal(createdJob.responseSlaMinutes, 15, 'P1 Response SLA is 15 minutes');
  assert.equal(createdJob.resolutionSlaHours, 2, 'P1 Resolution SLA is 2 hours');
  assert.equal(createdJob.responseSlaStatus, 'PENDING');

  // 2. Acknowledge Job
  jobs = acknowledgeMaintenanceJob(jobs, createdJob.id, 'สมชาย ชัยชนะ (Senior EE)');
  const ackedJob = jobs.find((j) => j.id === createdJob.id)!;
  assert.equal(ackedJob.status, 'IN_PROGRESS');
  assert.equal(ackedJob.acknowledgedBy, 'สมชาย ชัยชนะ (Senior EE)');
  assert.equal(ackedJob.responseSlaStatus, 'MET', 'Immediate ACK meets 15min response SLA');

  // 3. Resolve Job
  jobs = resolveMaintenanceJob(jobs, createdJob.id, {
    resolvedBy: 'สมชาย ชัยชนะ',
    resolutionNotes: 'ทดสอบการสับและคืนสู่สถานะปกติเรียบร้อย',
    partsReplaced: 'None',
    actualDowntimeMinutes: 0,
  });
  const resolvedJob = jobs.find((j) => j.id === createdJob.id)!;
  assert.equal(resolvedJob.status, 'RESOLVED');
  assert.equal(resolvedJob.resolutionSlaStatus, 'MET', 'Immediate fix meets 2hr resolution SLA');
  assert.equal(resolvedJob.actualDowntimeMinutes, 0);
});

test('CSV and TSV export functions generate valid Google Sheet / Excel formats', () => {
  const csv = generateMaintenanceJobsCsv(INITIAL_MAINTENANCE_JOBS);
  assert.ok(csv.startsWith('\uFEFF'), 'CSV includes UTF-8 BOM for Thai character encoding in Google Sheets');
  assert.ok(csv.includes('Work Order ID'), 'CSV includes header row');
  assert.ok(csv.includes('WO-2026-101'), 'CSV includes job records');

  const tsv = generateGoogleSheetsClipboardTsv(INITIAL_MAINTENANCE_JOBS);
  assert.ok(tsv.includes('\t'), 'TSV uses tab separators for direct Google Sheets paste');
  assert.ok(tsv.includes('WO-2026-101'), 'TSV contains job IDs');
});

test('Data Center Tier standards and downtime budgets are properly calibrated', () => {
  assert.equal(TIER_STANDARDS.TIER_4.uptimePct, 99.995);
  assert.equal(TIER_STANDARDS.TIER_4.maxTransferInterruptionSec, 0.0);
  assert.equal(TIER_STANDARDS.TIER_4.maxDowntimeMinutesYear, 26.3);

  assert.equal(TIER_STANDARDS.TIER_3.uptimePct, 99.982);
  assert.equal(TIER_STANDARDS.TIER_3.maxTransferInterruptionSec, 10.0);
  assert.equal(TIER_STANDARDS.TIER_3.maxDowntimeHoursYear, 1.6);

  assert.equal(TIER_STANDARDS.TIER_2.uptimePct, 99.741);
  assert.equal(TIER_STANDARDS.TIER_1.uptimePct, 99.671);
});

test('Remediation solutions matrix provides complete emergency action playbooks', () => {
  assert.ok(REMEDIATION_SOLUTIONS.length >= 5, 'Contains at least 5 remediation playbooks');
  const busTieSol = REMEDIATION_SOLUTIONS.find((s) => s.id === 'sol-tie-breaker');
  assert.ok(busTieSol, 'Bus-tie interlock override solution exists');
  assert.ok(busTieSol.sopSteps.length >= 3, 'Contains step-by-step SOP checklist');

  const staticBypassSol = REMEDIATION_SOLUTIONS.find((s) => s.id === 'sol-static-bypass');
  assert.ok(staticBypassSol, 'Static bypass engagement solution exists');

  const loadShedSol = REMEDIATION_SOLUTIONS.find((s) => s.id === 'sol-load-shedding');
  assert.ok(loadShedSol, 'Load shedding protocol exists');
});



