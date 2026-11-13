/**
 * SILA1 Electrical System Simulator - Core Logic & Rules
 */

export type NodeStatusType = 'normal' | 'tripped' | 'standby' | 'active' | 'transfer' | 'power-lost';

export interface SourceState {
  id: string;
  name: string;
  type: 'hv' | 'transformer' | 'generator';
  status: 'ONLINE' | 'ACTIVE' | 'STANDBY' | 'RUNNING' | 'FAULT' | 'OFFLINE';
  ratedKva?: number;
}

export interface MdbState {
  id: string;
  name: string;
  status: 'NORMAL' | 'TRIPPED';
  baseCurrent: number; // in Amperes
  linkedAts: string[];
  bus: 'A' | 'B';
  maintenanceRequired?: boolean;
  runTimeHours?: number;
}

export interface AtsState {
  id: string;
  name: string;
  parentMdb: string;
  status: 'SYNC OK' | 'TRANSFER' | 'POWER LOST';
  type: 'main' | 'sub';
  description: string;
}

export interface TelemetryData {
  voltage: number;
  current: number;
  loadPercent: number;
  frequency: number;
  powerKw: number;
}

export interface PowerTrendPoint {
  time: string;
  timestamp: number;
  powerKw: number;
  loadPercent: number;
  voltage: number;
  current: number;
}

export interface SystemCounters {
  critical: number;
  major: number;
  minor: number;
  warning: number;
}

export type UpsStatus = 'ONLINE' | 'BATTERY' | 'BYPASS' | 'FAULT';
export type BatteryStatus = 'FLOAT' | 'DISCHARGE' | 'CHARGE' | 'TEST' | 'FAULT';
export type BreakerStatus = 'CLOSED' | 'OPEN' | 'TRIPPED';

export interface UpsUnitState {
  id: string;
  name: string;
  system: 'UPS-1' | 'UPS-2' | 'UPS-3';
  bus: 'A' | 'B';
  status: UpsStatus;
  capacityKva: number;
  loadKw: number;
  efficiencyPct: number;
  batteryId: string;
  maintenanceRequired?: boolean;
  runTimeHours?: number;
}

export interface BatteryBankState {
  id: string;
  name: string;
  system: 'UPS-1' | 'UPS-2' | 'UPS-3';
  bus: 'A' | 'B';
  status: BatteryStatus;
  socPercent: number;
  voltageDc: number;
  currentAmps: number;
  backupMinutes: number;
  temperatureC: number;
}

export interface UmdbState {
  id: string;
  name: string;
  system: 'UPS-1' | 'UPS-2' | 'UPS-3';
  bus: 'A' | 'B';
  parentMdb: string;
  inputBreaker: BreakerStatus;
  outputBreaker: BreakerStatus;
  status: 'NORMAL' | 'ON_UPS' | 'ON_BATTERY' | 'ON_BYPASS' | 'POWER_LOST';
  totalLoadKw: number;
}

export interface RectifierState {
  id: string;
  name: string;
  status: 'ONLINE' | 'STANDBY' | 'FAULT';
  voltageDc: number;
}

export interface DcBatteryState {
  id: string;
  name: string;
  status: 'FLOAT' | 'DISCHARGE' | 'FAULT';
  socPercent: number;
  voltageDc: number;
}

export interface PduUnitState {
  id: string;
  name: string;
  bus: 'A' | 'B';
  loadKw: number;
  status: 'ONLINE' | 'WARNING' | 'CRITICAL';
}

export interface SimulatorState {
  sources: Record<string, SourceState>;
  mdbs: Record<string, MdbState>;
  ats: Record<string, AtsState>;
  generatorAutoStart: boolean;
  upsUnits: Record<string, UpsUnitState>;
  batteries: Record<string, BatteryBankState>;
  umdbs: Record<string, UmdbState>;
  rectifiers: Record<string, RectifierState>;
  dcBatteries: Record<string, DcBatteryState>;
  pdus: Record<string, PduUnitState>;
}

export const INITIAL_STATE: SimulatorState = {
  sources: {
    'src-hv': { id: 'src-hv', name: 'High Voltage (PEA/MEG)', type: 'hv', status: 'ONLINE' },
    'tr-1': { id: 'tr-1', name: 'Transformer TR-1 (2500kVA)', type: 'transformer', status: 'ACTIVE', ratedKva: 2500 },
    'tr-2': { id: 'tr-2', name: 'Transformer TR-2 (2500kVA)', type: 'transformer', status: 'ACTIVE', ratedKva: 2500 },
    'gen-1': { id: 'gen-1', name: 'Emergency Generator GEN-1', type: 'generator', status: 'STANDBY', ratedKva: 2000 },
  },
  mdbs: {
    'mdb-1a': { id: 'mdb-1a', name: 'MDB1A', status: 'NORMAL', baseCurrent: 205.5, linkedAts: ['ats-1a', 'atsp-22', 'atsp-23'], bus: 'A' },
    'mdb-1b': { id: 'mdb-1b', name: 'MDB1B', status: 'NORMAL', baseCurrent: 215.2, linkedAts: ['ats-1b', 'atsp-26', 'atsp-27'], bus: 'B' },
    'mdb-2a': { id: 'mdb-2a', name: 'MDB2A', status: 'NORMAL', baseCurrent: 228.3, linkedAts: ['ats-2a', 'atsp-24'], bus: 'A' },
    'mdb-2b': { id: 'mdb-2b', name: 'MDB2B', status: 'NORMAL', baseCurrent: 232.4, linkedAts: ['ats-2b', 'atsp-31'], bus: 'B' },
    'mdb-3a': { id: 'mdb-3a', name: 'MDB3A', status: 'NORMAL', baseCurrent: 181.6, linkedAts: ['ats-3a'], bus: 'A' },
    'mdb-3b': { id: 'mdb-3b', name: 'MDB3B', status: 'NORMAL', baseCurrent: 182.2, linkedAts: ['ats-3b'], bus: 'B' },
  },
  ats: {
    'ats-1b': { id: 'ats-1b', name: 'ATS1B', parentMdb: 'mdb-1b', status: 'SYNC OK', type: 'main', description: 'Main Bus B Transfer Switch' },
    'ats-1a': { id: 'ats-1a', name: 'ATS1A', parentMdb: 'mdb-1a', status: 'SYNC OK', type: 'main', description: 'Main Bus A Transfer Switch' },
    'ats-2b': { id: 'ats-2b', name: 'ATS2B', parentMdb: 'mdb-2b', status: 'SYNC OK', type: 'main', description: 'HVAC Plant B Transfer Switch' },
    'ats-2a': { id: 'ats-2a', name: 'ATS2A', parentMdb: 'mdb-2a', status: 'SYNC OK', type: 'main', description: 'HVAC Plant A Transfer Switch' },
    'ats-3b': { id: 'ats-3b', name: 'ATS3B', parentMdb: 'mdb-3b', status: 'SYNC OK', type: 'main', description: 'Essential Feeder B' },
    'ats-3a': { id: 'ats-3a', name: 'ATS3A', parentMdb: 'mdb-3a', status: 'SYNC OK', type: 'main', description: 'Essential Feeder A' },
    'atsp-22': { id: 'atsp-22', name: 'ATSP22', parentMdb: 'mdb-1a', status: 'SYNC OK', type: 'sub', description: 'Data Center Row 1 UPS' },
    'atsp-26': { id: 'atsp-26', name: 'ATSP26', parentMdb: 'mdb-1b', status: 'SYNC OK', type: 'sub', description: 'Data Center Row 2 UPS' },
    'atsp-23': { id: 'atsp-23', name: 'ATSP23', parentMdb: 'mdb-1a', status: 'SYNC OK', type: 'sub', description: 'Chilled Water Pump Primary' },
    'atsp-27': { id: 'atsp-27', name: 'ATSP27', parentMdb: 'mdb-1b', status: 'SYNC OK', type: 'sub', description: 'Chilled Water Pump Secondary' },
    'atsp-24': { id: 'atsp-24', name: 'ATSP24', parentMdb: 'mdb-2a', status: 'SYNC OK', type: 'sub', description: 'Emergency Lighting Distribution' },
    'atsp-31': { id: 'atsp-31', name: 'ATSP31', parentMdb: 'mdb-2b', status: 'SYNC OK', type: 'sub', description: 'Fire Suppression & Life Safety' },
  },
  generatorAutoStart: true,
  umdbs: {
    'umdb-1a': { id: 'umdb-1a', name: 'UMDB1A', system: 'UPS-1', bus: 'A', parentMdb: 'mdb-1a', inputBreaker: 'CLOSED', outputBreaker: 'CLOSED', status: 'ON_UPS', totalLoadKw: 382.4 },
    'umdb-1b': { id: 'umdb-1b', name: 'UMDB1B', system: 'UPS-1', bus: 'B', parentMdb: 'mdb-1b', inputBreaker: 'CLOSED', outputBreaker: 'CLOSED', status: 'ON_UPS', totalLoadKw: 391.2 },
    'umdb-2a': { id: 'umdb-2a', name: 'UMDB2A', system: 'UPS-2', bus: 'A', parentMdb: 'mdb-2a', inputBreaker: 'CLOSED', outputBreaker: 'CLOSED', status: 'ON_UPS', totalLoadKw: 412.5 },
    'umdb-2b': { id: 'umdb-2b', name: 'UMDB2B', system: 'UPS-2', bus: 'B', parentMdb: 'mdb-2b', inputBreaker: 'CLOSED', outputBreaker: 'CLOSED', status: 'ON_UPS', totalLoadKw: 423.8 },
    'umdb-3a': { id: 'umdb-3a', name: 'UMDB3A', system: 'UPS-3', bus: 'A', parentMdb: 'mdb-3a', inputBreaker: 'CLOSED', outputBreaker: 'CLOSED', status: 'ON_UPS', totalLoadKw: 288.5 },
    'umdb-3b': { id: 'umdb-3b', name: 'UMDB3B', system: 'UPS-3', bus: 'B', parentMdb: 'mdb-3b', inputBreaker: 'CLOSED', outputBreaker: 'CLOSED', status: 'ON_UPS', totalLoadKw: 294.1 },
  },
  upsUnits: {
    // UPS System 1 (D-1/D-2)
    'ups-1a1': { id: 'ups-1a1', name: 'UPS-1A1', system: 'UPS-1', bus: 'A', status: 'ONLINE', capacityKva: 500, loadKw: 95.6, efficiencyPct: 96.8, batteryId: 'batt-1a1' },
    'ups-1a2': { id: 'ups-1a2', name: 'UPS-1A2', system: 'UPS-1', bus: 'A', status: 'ONLINE', capacityKva: 500, loadKw: 95.6, efficiencyPct: 96.8, batteryId: 'batt-1a2' },
    'ups-1a3': { id: 'ups-1a3', name: 'UPS-1A3', system: 'UPS-1', bus: 'A', status: 'ONLINE', capacityKva: 500, loadKw: 95.6, efficiencyPct: 96.8, batteryId: 'batt-1a3' },
    'ups-1a4': { id: 'ups-1a4', name: 'UPS-1A4', system: 'UPS-1', bus: 'A', status: 'ONLINE', capacityKva: 500, loadKw: 95.6, efficiencyPct: 96.8, batteryId: 'batt-1a4' },
    'ups-1b1': { id: 'ups-1b1', name: 'UPS-1B1', system: 'UPS-1', bus: 'B', status: 'ONLINE', capacityKva: 500, loadKw: 97.8, efficiencyPct: 96.7, batteryId: 'batt-1b1' },
    'ups-1b2': { id: 'ups-1b2', name: 'UPS-1B2', system: 'UPS-1', bus: 'B', status: 'ONLINE', capacityKva: 500, loadKw: 97.8, efficiencyPct: 96.7, batteryId: 'batt-1b2' },
    'ups-1b3': { id: 'ups-1b3', name: 'UPS-1B3', system: 'UPS-1', bus: 'B', status: 'ONLINE', capacityKva: 500, loadKw: 97.8, efficiencyPct: 96.7, batteryId: 'batt-1b3' },
    'ups-1b4': { id: 'ups-1b4', name: 'UPS-1B4', system: 'UPS-1', bus: 'B', status: 'ONLINE', capacityKva: 500, loadKw: 97.8, efficiencyPct: 96.7, batteryId: 'batt-1b4' },

    // UPS System 2 (D-1/D-2)
    'ups-2a1': { id: 'ups-2a1', name: 'UPS-2A1', system: 'UPS-2', bus: 'A', status: 'ONLINE', capacityKva: 500, loadKw: 103.1, efficiencyPct: 97.1, batteryId: 'batt-2a1' },
    'ups-2a2': { id: 'ups-2a2', name: 'UPS-2A2', system: 'UPS-2', bus: 'A', status: 'ONLINE', capacityKva: 500, loadKw: 103.1, efficiencyPct: 97.1, batteryId: 'batt-2a2' },
    'ups-2a3': { id: 'ups-2a3', name: 'UPS-2A3', system: 'UPS-2', bus: 'A', status: 'ONLINE', capacityKva: 500, loadKw: 103.1, efficiencyPct: 97.1, batteryId: 'batt-2a3' },
    'ups-2a4': { id: 'ups-2a4', name: 'UPS-2A4', system: 'UPS-2', bus: 'A', status: 'ONLINE', capacityKva: 500, loadKw: 103.1, efficiencyPct: 97.1, batteryId: 'batt-2a4' },
    'ups-2b1': { id: 'ups-2b1', name: 'UPS-2B1', system: 'UPS-2', bus: 'B', status: 'ONLINE', capacityKva: 500, loadKw: 105.9, efficiencyPct: 96.9, batteryId: 'batt-2b1' },
    'ups-2b2': { id: 'ups-2b2', name: 'UPS-2B2', system: 'UPS-2', bus: 'B', status: 'ONLINE', capacityKva: 500, loadKw: 105.9, efficiencyPct: 96.9, batteryId: 'batt-2b2' },
    'ups-2b3': { id: 'ups-2b3', name: 'UPS-2B3', system: 'UPS-2', bus: 'B', status: 'ONLINE', capacityKva: 500, loadKw: 105.9, efficiencyPct: 96.9, batteryId: 'batt-2b3' },
    'ups-2b4': { id: 'ups-2b4', name: 'UPS-2B4', system: 'UPS-2', bus: 'B', status: 'ONLINE', capacityKva: 500, loadKw: 105.9, efficiencyPct: 96.9, batteryId: 'batt-2b4' },

    // UPS System 3 (D-3)
    'ups-3a1': { id: 'ups-3a1', name: 'UPS-3A1', system: 'UPS-3', bus: 'A', status: 'ONLINE', capacityKva: 500, loadKw: 96.2, efficiencyPct: 96.5, batteryId: 'batt-3a1' },
    'ups-3a2': { id: 'ups-3a2', name: 'UPS-3A2', system: 'UPS-3', bus: 'A', status: 'ONLINE', capacityKva: 500, loadKw: 96.2, efficiencyPct: 96.5, batteryId: 'batt-3a2' },
    'ups-3a3': { id: 'ups-3a3', name: 'UPS-3A3', system: 'UPS-3', bus: 'A', status: 'ONLINE', capacityKva: 500, loadKw: 96.2, efficiencyPct: 96.5, batteryId: 'batt-3a3' },
    'ups-3b1': { id: 'ups-3b1', name: 'UPS-3B1', system: 'UPS-3', bus: 'B', status: 'ONLINE', capacityKva: 500, loadKw: 98.0, efficiencyPct: 96.6, batteryId: 'batt-3b1' },
    'ups-3b2': { id: 'ups-3b2', name: 'UPS-3B2', system: 'UPS-3', bus: 'B', status: 'ONLINE', capacityKva: 500, loadKw: 98.0, efficiencyPct: 96.6, batteryId: 'batt-3b2' },
    'ups-3b3': { id: 'ups-3b3', name: 'UPS-3B3', system: 'UPS-3', bus: 'B', status: 'ONLINE', capacityKva: 500, loadKw: 98.0, efficiencyPct: 96.6, batteryId: 'batt-3b3' },
  },
  batteries: {
    // Battery System 1
    'batt-1a1': { id: 'batt-1a1', name: 'BATT-1A1', system: 'UPS-1', bus: 'A', status: 'FLOAT', socPercent: 100, voltageDc: 542.4, currentAmps: 0.8, backupMinutes: 28.5, temperatureC: 23.4 },
    'batt-1a2': { id: 'batt-1a2', name: 'BATT-1A2', system: 'UPS-1', bus: 'A', status: 'FLOAT', socPercent: 100, voltageDc: 541.8, currentAmps: 0.9, backupMinutes: 28.5, temperatureC: 23.5 },
    'batt-1a3': { id: 'batt-1a3', name: 'BATT-1A3', system: 'UPS-1', bus: 'A', status: 'FLOAT', socPercent: 100, voltageDc: 542.1, currentAmps: 0.8, backupMinutes: 28.5, temperatureC: 23.6 },
    'batt-1a4': { id: 'batt-1a4', name: 'BATT-1A4', system: 'UPS-1', bus: 'A', status: 'FLOAT', socPercent: 100, voltageDc: 542.0, currentAmps: 0.8, backupMinutes: 28.5, temperatureC: 23.4 },
    'batt-1b1': { id: 'batt-1b1', name: 'BATT-1B1', system: 'UPS-1', bus: 'B', status: 'FLOAT', socPercent: 100, voltageDc: 541.9, currentAmps: 0.9, backupMinutes: 27.8, temperatureC: 23.8 },
    'batt-1b2': { id: 'batt-1b2', name: 'BATT-1B2', system: 'UPS-1', bus: 'B', status: 'FLOAT', socPercent: 100, voltageDc: 542.3, currentAmps: 0.8, backupMinutes: 27.8, temperatureC: 23.7 },
    'batt-1b3': { id: 'batt-1b3', name: 'BATT-1B3', system: 'UPS-1', bus: 'B', status: 'FLOAT', socPercent: 100, voltageDc: 542.0, currentAmps: 0.8, backupMinutes: 27.8, temperatureC: 23.6 },
    'batt-1b4': { id: 'batt-1b4', name: 'BATT-1B4', system: 'UPS-1', bus: 'B', status: 'FLOAT', socPercent: 100, voltageDc: 542.2, currentAmps: 0.8, backupMinutes: 27.8, temperatureC: 23.5 },

    // Battery System 2
    'batt-2a1': { id: 'batt-2a1', name: 'BATT-2A1', system: 'UPS-2', bus: 'A', status: 'FLOAT', socPercent: 100, voltageDc: 542.5, currentAmps: 0.8, backupMinutes: 26.4, temperatureC: 23.9 },
    'batt-2a2': { id: 'batt-2a2', name: 'BATT-2A2', system: 'UPS-2', bus: 'A', status: 'FLOAT', socPercent: 100, voltageDc: 542.1, currentAmps: 0.9, backupMinutes: 26.4, temperatureC: 23.8 },
    'batt-2a3': { id: 'batt-2a3', name: 'BATT-2A3', system: 'UPS-2', bus: 'A', status: 'FLOAT', socPercent: 100, voltageDc: 541.8, currentAmps: 0.8, backupMinutes: 26.4, temperatureC: 24.1 },
    'batt-2a4': { id: 'batt-2a4', name: 'BATT-2A4', system: 'UPS-2', bus: 'A', status: 'FLOAT', socPercent: 100, voltageDc: 542.4, currentAmps: 0.8, backupMinutes: 26.4, temperatureC: 23.7 },
    'batt-2b1': { id: 'batt-2b1', name: 'BATT-2B1', system: 'UPS-2', bus: 'B', status: 'FLOAT', socPercent: 100, voltageDc: 542.0, currentAmps: 0.9, backupMinutes: 25.9, temperatureC: 24.0 },
    'batt-2b2': { id: 'batt-2b2', name: 'BATT-2B2', system: 'UPS-2', bus: 'B', status: 'FLOAT', socPercent: 100, voltageDc: 542.6, currentAmps: 0.8, backupMinutes: 25.9, temperatureC: 23.8 },
    'batt-2b3': { id: 'batt-2b3', name: 'BATT-2B3', system: 'UPS-2', bus: 'B', status: 'FLOAT', socPercent: 100, voltageDc: 541.9, currentAmps: 0.9, backupMinutes: 25.9, temperatureC: 23.9 },
    'batt-2b4': { id: 'batt-2b4', name: 'BATT-2B4', system: 'UPS-2', bus: 'B', status: 'FLOAT', socPercent: 100, voltageDc: 542.2, currentAmps: 0.8, backupMinutes: 25.9, temperatureC: 23.6 },

    // Battery System 3
    'batt-3a1': { id: 'batt-3a1', name: 'BATT-3A1', system: 'UPS-3', bus: 'A', status: 'FLOAT', socPercent: 100, voltageDc: 542.1, currentAmps: 0.8, backupMinutes: 29.2, temperatureC: 23.5 },
    'batt-3a2': { id: 'batt-3a2', name: 'BATT-3A2', system: 'UPS-3', bus: 'A', status: 'FLOAT', socPercent: 100, voltageDc: 542.5, currentAmps: 0.8, backupMinutes: 29.2, temperatureC: 23.6 },
    'batt-3a3': { id: 'batt-3a3', name: 'BATT-3A3', system: 'UPS-3', bus: 'A', status: 'FLOAT', socPercent: 100, voltageDc: 541.9, currentAmps: 0.9, backupMinutes: 29.2, temperatureC: 23.4 },
    'batt-3b1': { id: 'batt-3b1', name: 'BATT-3B1', system: 'UPS-3', bus: 'B', status: 'FLOAT', socPercent: 100, voltageDc: 542.3, currentAmps: 0.8, backupMinutes: 28.7, temperatureC: 23.7 },
    'batt-3b2': { id: 'batt-3b2', name: 'BATT-3B2', system: 'UPS-3', bus: 'B', status: 'FLOAT', socPercent: 100, voltageDc: 542.0, currentAmps: 0.9, backupMinutes: 28.7, temperatureC: 23.8 },
    'batt-3b3': { id: 'batt-3b3', name: 'BATT-3B3', system: 'UPS-3', bus: 'B', status: 'FLOAT', socPercent: 100, voltageDc: 542.4, currentAmps: 0.8, backupMinutes: 28.7, temperatureC: 23.5 },
  },
  rectifiers: {
    'rec-1a1': { id: 'rec-1a1', name: 'REC 1A/1', status: 'ONLINE', voltageDc: 48.2 },
    'rec-1a2': { id: 'rec-1a2', name: 'REC 1A/2', status: 'ONLINE', voltageDc: 48.2 },
    'rec-2a1': { id: 'rec-2a1', name: 'REC 2A/1', status: 'ONLINE', voltageDc: 48.1 },
    'rec-1b1': { id: 'rec-1b1', name: 'REC 1B/1', status: 'ONLINE', voltageDc: 48.3 },
    'rec-1b2': { id: 'rec-1b2', name: 'REC 1B/2', status: 'ONLINE', voltageDc: 48.2 },
    'rec-2b1': { id: 'rec-2b1', name: 'REC 2B/1', status: 'ONLINE', voltageDc: 48.1 },
  },
  dcBatteries: {
    'dcbatt-1a1': { id: 'dcbatt-1a1', name: 'BATT 1A/1', status: 'FLOAT', socPercent: 100, voltageDc: 53.5 },
    'dcbatt-1a2': { id: 'dcbatt-1a2', name: 'BATT 1A/2', status: 'FLOAT', socPercent: 100, voltageDc: 53.6 },
    'dcbatt-2a1': { id: 'dcbatt-2a1', name: 'BATT 2A/1', status: 'FLOAT', socPercent: 100, voltageDc: 53.4 },
    'dcbatt-1b1': { id: 'dcbatt-1b1', name: 'BATT 1B/1', status: 'FLOAT', socPercent: 100, voltageDc: 53.5 },
    'dcbatt-1b2': { id: 'dcbatt-1b2', name: 'BATT 1B/2', status: 'FLOAT', socPercent: 100, voltageDc: 53.5 },
    'dcbatt-2b1': { id: 'dcbatt-2b1', name: 'BATT 2B/1', status: 'FLOAT', socPercent: 100, voltageDc: 53.4 },
  },
  pdus: {
    'pdu-1a': { id: 'pdu-1a', name: 'PDU1A', bus: 'A', loadKw: 24.5, status: 'ONLINE' },
    'pdu-1b': { id: 'pdu-1b', name: 'PDU1B', bus: 'B', loadKw: 25.1, status: 'ONLINE' },
    'pdu-2a': { id: 'pdu-2a', name: 'PDU2A', bus: 'A', loadKw: 23.8, status: 'ONLINE' },
    'pdu-2b': { id: 'pdu-2b', name: 'PDU2B', bus: 'B', loadKw: 24.2, status: 'ONLINE' },
    'pdu-3a': { id: 'pdu-3a', name: 'PDU3A', bus: 'A', loadKw: 26.2, status: 'ONLINE' },
    'pdu-3b': { id: 'pdu-3b', name: 'PDU3B', bus: 'B', loadKw: 26.8, status: 'ONLINE' },
    'pdu-4a': { id: 'pdu-4a', name: 'PDU4A', bus: 'A', loadKw: 25.0, status: 'ONLINE' },
    'pdu-4b': { id: 'pdu-4b', name: 'PDU4B', bus: 'B', loadKw: 25.4, status: 'ONLINE' },
    'pdu-5a': { id: 'pdu-5a', name: 'PDU5A', bus: 'A', loadKw: 24.1, status: 'ONLINE' },
    'pdu-5b': { id: 'pdu-5b', name: 'PDU5B', bus: 'B', loadKw: 24.9, status: 'ONLINE' },
    'pdu-6a': { id: 'pdu-6a', name: 'PDU6A', bus: 'A', loadKw: 23.9, status: 'ONLINE' },
    'pdu-6b': { id: 'pdu-6b', name: 'PDU6B', bus: 'B', loadKw: 24.4, status: 'ONLINE' },
    'pdu-7a': { id: 'pdu-7a', name: 'PDU7A', bus: 'A', loadKw: 22.8, status: 'ONLINE' },
    'pdu-7b': { id: 'pdu-7b', name: 'PDU7B', bus: 'B', loadKw: 23.3, status: 'ONLINE' },
    'pdu-8a': { id: 'pdu-8a', name: 'PDU8A', bus: 'A', loadKw: 24.7, status: 'ONLINE' },
    'pdu-8b': { id: 'pdu-8b', name: 'PDU8B', bus: 'B', loadKw: 25.2, status: 'ONLINE' },
    'pdu-9a': { id: 'pdu-9a', name: 'PDU9A', bus: 'A', loadKw: 26.4, status: 'ONLINE' },
    'pdu-9b': { id: 'pdu-9b', name: 'PDU9B', bus: 'B', loadKw: 27.0, status: 'ONLINE' },
    'pdu-10a': { id: 'pdu-10a', name: 'PDU10A', bus: 'A', loadKw: 25.8, status: 'ONLINE' },
    'pdu-10b': { id: 'pdu-10b', name: 'PDU10B', bus: 'B', loadKw: 26.1, status: 'ONLINE' },
    'pdu-11a': { id: 'pdu-11a', name: 'PDU11A', bus: 'A', loadKw: 24.9, status: 'ONLINE' },
    'pdu-11b': { id: 'pdu-11b', name: 'PDU11B', bus: 'B', loadKw: 25.3, status: 'ONLINE' },
    'pdu-12a': { id: 'pdu-12a', name: 'PDU12A', bus: 'A', loadKw: 25.5, status: 'ONLINE' },
    'pdu-12b': { id: 'pdu-12b', name: 'PDU12B', bus: 'B', loadKw: 26.0, status: 'ONLINE' },
    'pdu-13a': { id: 'pdu-13a', name: 'PDU13A', bus: 'A', loadKw: 24.3, status: 'ONLINE' },
    'pdu-13b': { id: 'pdu-13b', name: 'PDU13B', bus: 'B', loadKw: 24.7, status: 'ONLINE' },
    'pdu-14a': { id: 'pdu-14a', name: 'PDU14A', bus: 'A', loadKw: 25.1, status: 'ONLINE' },
    'pdu-14b': { id: 'pdu-14b', name: 'PDU14B', bus: 'B', loadKw: 25.6, status: 'ONLINE' },
    'pdu-15a': { id: 'pdu-15a', name: 'PDU15A', bus: 'A', loadKw: 24.8, status: 'ONLINE' },
    'pdu-15b': { id: 'pdu-15b', name: 'PDU15B', bus: 'B', loadKw: 25.2, status: 'ONLINE' },
    'pdu-16a': { id: 'pdu-16a', name: 'PDU16A', bus: 'A', loadKw: 26.0, status: 'ONLINE' },
    'pdu-16b': { id: 'pdu-16b', name: 'PDU16B', bus: 'B', loadKw: 26.5, status: 'ONLINE' },
    'pdu-17a': { id: 'pdu-17a', name: 'PDU17A', bus: 'A', loadKw: 23.9, status: 'ONLINE' },
    'pdu-17b': { id: 'pdu-17b', name: 'PDU17B', bus: 'B', loadKw: 24.2, status: 'ONLINE' },
    'pdu-18a': { id: 'pdu-18a', name: 'PDU18A', bus: 'A', loadKw: 24.4, status: 'ONLINE' },
    'pdu-18b': { id: 'pdu-18b', name: 'PDU18B', bus: 'B', loadKw: 24.9, status: 'ONLINE' },
    'pdu-19a': { id: 'pdu-19a', name: 'PDU19A', bus: 'A', loadKw: 25.3, status: 'ONLINE' },
    'pdu-19b': { id: 'pdu-19b', name: 'PDU19B', bus: 'B', loadKw: 25.7, status: 'ONLINE' },
    'pdu-20a': { id: 'pdu-20a', name: 'PDU20A', bus: 'A', loadKw: 24.6, status: 'ONLINE' },
    'pdu-20b': { id: 'pdu-20b', name: 'PDU20B', bus: 'B', loadKw: 25.0, status: 'ONLINE' },
    'pdu-21a': { id: 'pdu-21a', name: 'PDU21A', bus: 'A', loadKw: 23.7, status: 'ONLINE' },
    'pdu-21b': { id: 'pdu-21b', name: 'PDU21B', bus: 'B', loadKw: 24.1, status: 'ONLINE' },
    'pdu-22a': { id: 'pdu-22a', name: 'PDU22A', bus: 'A', loadKw: 24.0, status: 'ONLINE' },
    'pdu-22b': { id: 'pdu-22b', name: 'PDU22B', bus: 'B', loadKw: 24.5, status: 'ONLINE' },
    'pdu-23a': { id: 'pdu-23a', name: 'PDU23A', bus: 'A', loadKw: 25.2, status: 'ONLINE' },
    'pdu-23b': { id: 'pdu-23b', name: 'PDU23B', bus: 'B', loadKw: 25.6, status: 'ONLINE' },
    'pdu-24a': { id: 'pdu-24a', name: 'PDU24A', bus: 'A', loadKw: 26.1, status: 'ONLINE' },
    'pdu-24b': { id: 'pdu-24b', name: 'PDU24B', bus: 'B', loadKw: 26.7, status: 'ONLINE' },
    'pdu-25a': { id: 'pdu-25a', name: 'PDU25A', bus: 'A', loadKw: 25.7, status: 'ONLINE' },
    'pdu-25b': { id: 'pdu-25b', name: 'PDU25B', bus: 'B', loadKw: 26.2, status: 'ONLINE' },
    'pdu-26a': { id: 'pdu-26a', name: 'PDU26A', bus: 'A', loadKw: 26.8, status: 'ONLINE' },
    'pdu-26b': { id: 'pdu-26b', name: 'PDU26B', bus: 'B', loadKw: 27.3, status: 'ONLINE' },
  },
};

/**
 * Evaluates ATS status according to parent MDB, Transformer status, and Generator status.
 */
export function evaluateAtsState(
  parentMdb: MdbState,
  parentTrStatus: 'ACTIVE' | 'FAULT' | 'OFFLINE',
  hvStatus: 'ONLINE' | 'FAULT',
  genStatus: 'STANDBY' | 'RUNNING' | 'OFFLINE'
): 'SYNC OK' | 'TRANSFER' | 'POWER LOST' {
  const isParentPowered = parentMdb.status === 'NORMAL' && parentTrStatus === 'ACTIVE' && hvStatus === 'ONLINE';

  if (isParentPowered) {
    return 'SYNC OK';
  }

  // If normal power is lost, can we transfer to emergency generator?
  if (genStatus === 'RUNNING') {
    return 'TRANSFER';
  }

  return 'POWER LOST';
}

/**
 * Toggle an MDB trip state and recalculate dependent ATS units.
 */
export function toggleMdbTrip(
  state: SimulatorState,
  mdbId: string
): { nextState: SimulatorState; actionLog: string; isTrip: boolean } {
  const mdb = state.mdbs[mdbId];
  if (!mdb) return { nextState: state, actionLog: 'MDB not found', isTrip: false };

  const isNowTripped = mdb.status === 'NORMAL';
  const newStatus = isNowTripped ? 'TRIPPED' : 'NORMAL';

  const updatedMdbs = {
    ...state.mdbs,
    [mdbId]: {
      ...mdb,
      status: newStatus as 'NORMAL' | 'TRIPPED',
    },
  };

  // Determine generator auto-start if needed
  let updatedSources = { ...state.sources };
  let genStatus = updatedSources['gen-1'].status as 'STANDBY' | 'RUNNING' | 'OFFLINE';

  if (isNowTripped && state.generatorAutoStart && genStatus === 'STANDBY') {
    genStatus = 'RUNNING';
    updatedSources['gen-1'] = {
      ...updatedSources['gen-1'],
      status: 'RUNNING',
    };
  }

  const hvStatus = updatedSources['src-hv'].status as 'ONLINE' | 'FAULT';
  const tr1Status = updatedSources['tr-1'].status as 'ACTIVE' | 'FAULT' | 'OFFLINE';
  const tr2Status = updatedSources['tr-2'].status as 'ACTIVE' | 'FAULT' | 'OFFLINE';

  // Update ATS states
  const updatedAts = { ...state.ats };
  Object.keys(updatedAts).forEach((atsKey) => {
    const atsItem = updatedAts[atsKey];
    const pMdb = updatedMdbs[atsItem.parentMdb] || mdb;
    const trStatus = pMdb.bus === 'A' ? tr1Status : tr2Status;

    const newAtsStatus = evaluateAtsState(pMdb, trStatus, hvStatus, genStatus);
    updatedAts[atsKey] = {
      ...atsItem,
      status: newAtsStatus,
    };
  });

  const nextState: SimulatorState = {
    ...state,
    sources: updatedSources,
    mdbs: updatedMdbs,
    ats: updatedAts,
  };

  const actionLog = isNowTripped
    ? `[Alert] ตู้ ${mdb.name} เกิดเหตุการณ์ Trip/Fault ระบบป้องกันตัดวงจรทำงาน!`
    : `[Normal] ตู้ ${mdb.name} กลับเข้าสู่สภาวะปกติ (Normal)`;

  return { nextState, actionLog, isTrip: isNowTripped };
}

/**
 * Increments runtime and triggers maintenance requirements for equipment.
 */
export function updateMaintenanceStatus(state: SimulatorState, hoursPassed: number): SimulatorState {
  const nextState = { ...state };
  const maintenanceLimit = 100;

  // Update MDBs
  nextState.mdbs = { ...nextState.mdbs };
  Object.keys(nextState.mdbs).forEach((key) => {
    const mdb = nextState.mdbs[key];
    const runTime = (mdb.runTimeHours || 0) + hoursPassed;
    nextState.mdbs[key] = {
      ...mdb,
      runTimeHours: runTime,
      maintenanceRequired: runTime >= maintenanceLimit || mdb.maintenanceRequired,
    };
  });

  // Update UPS Units
  nextState.upsUnits = { ...nextState.upsUnits };
  Object.keys(nextState.upsUnits).forEach((key) => {
    const ups = nextState.upsUnits[key];
    const runTime = (ups.runTimeHours || 0) + hoursPassed;
    nextState.upsUnits[key] = {
      ...ups,
      runTimeHours: runTime,
      maintenanceRequired: runTime >= maintenanceLimit || ups.maintenanceRequired,
    };
  });

  return nextState;
}

/**
 * Clears maintenance required status for equipment.
 */
export function completeMaintenance(state: SimulatorState, equipmentId: string): SimulatorState {
  const nextState = { ...state };

  if (nextState.mdbs[equipmentId]) {
    nextState.mdbs = { ...nextState.mdbs };
    nextState.mdbs[equipmentId] = {
      ...nextState.mdbs[equipmentId],
      maintenanceRequired: false,
      runTimeHours: 0,
    };
  } else if (nextState.upsUnits[equipmentId]) {
    nextState.upsUnits = { ...nextState.upsUnits };
    nextState.upsUnits[equipmentId] = {
      ...nextState.upsUnits[equipmentId],
      maintenanceRequired: false,
      runTimeHours: 0,
    };
  }

  return nextState;
}


/**
 * Toggle a power source (HV, TR-1, TR-2, GEN-1)
 */
export function toggleSourceNode(
  state: SimulatorState,
  sourceId: string
): { nextState: SimulatorState; actionLog: string } {
  const source = state.sources[sourceId];
  if (!source) return { nextState: state, actionLog: 'Source not found' };

  const updatedSources = { ...state.sources };
  let log = '';

  if (source.type === 'hv') {
    const isOnline = source.status === 'ONLINE';
    const nextStatus = isOnline ? 'FAULT' : 'ONLINE';
    updatedSources['src-hv'] = { ...source, status: nextStatus };
    // If HV faults, transformers lose primary feed
    if (nextStatus === 'FAULT') {
      updatedSources['tr-1'] = { ...updatedSources['tr-1'], status: 'OFFLINE' };
      updatedSources['tr-2'] = { ...updatedSources['tr-2'], status: 'OFFLINE' };
      if (state.generatorAutoStart) {
        updatedSources['gen-1'] = { ...updatedSources['gen-1'], status: 'RUNNING' };
      }
      log = `[Critical] ระบบไฟฟ้าแรงสูง (PEA/MEG HV Feed) ดับ/ขัดข้อง! TR-1 & TR-2 ออฟไลน์, เครื่องกำเนิดไฟฟ้า GEN-1 สตาร์ทอัตโนมัติ`;
    } else {
      updatedSources['tr-1'] = { ...updatedSources['tr-1'], status: 'ACTIVE' };
      updatedSources['tr-2'] = { ...updatedSources['tr-2'], status: 'ACTIVE' };
      updatedSources['gen-1'] = { ...updatedSources['gen-1'], status: 'STANDBY' };
      log = `[Normal] แหล่งจ่ายไฟฟ้าแรงสูง PEA/MEG กลับมาจ่ายไฟฟ้าปกติ ระบบซิงโครไนซ์สมบูรณ์`;
    }
  } else if (source.type === 'transformer') {
    const isActive = source.status === 'ACTIVE';
    const nextStatus = isActive ? 'FAULT' : 'ACTIVE';
    updatedSources[sourceId] = { ...source, status: nextStatus };
    log = nextStatus === 'FAULT'
      ? `[Alert] หม้อแปลงไฟฟ้า ${source.name} ทริปขัดข้อง (Transformer Trip/Overload)!`
      : `[Normal] หม้อแปลงไฟฟ้า ${source.name} รีเซ็ตและพร้อมจ่ายโหลด`;
  } else if (source.type === 'generator') {
    const isRunning = source.status === 'RUNNING';
    const nextStatus = isRunning ? 'STANDBY' : 'RUNNING';
    updatedSources[sourceId] = { ...source, status: nextStatus };
    log = nextStatus === 'RUNNING'
      ? `[Action] เดินเครื่องกำเนิดไฟฟ้าสำรอง ${source.name} ด้วยตนเอง (Manual Start RUNNING)`
      : `[Action] สั่งหยุดเครื่องกำเนิดไฟฟ้า ${source.name} เข้าสู่โหมดสแตนด์บาย (STANDBY)`;
  }

  // Recalculate ATS
  const hvStatus = updatedSources['src-hv'].status as 'ONLINE' | 'FAULT';
  const tr1Status = updatedSources['tr-1'].status as 'ACTIVE' | 'FAULT' | 'OFFLINE';
  const tr2Status = updatedSources['tr-2'].status as 'ACTIVE' | 'FAULT' | 'OFFLINE';
  const genStatus = updatedSources['gen-1'].status as 'STANDBY' | 'RUNNING' | 'OFFLINE';

  const updatedAts = { ...state.ats };
  Object.keys(updatedAts).forEach((atsKey) => {
    const atsItem = updatedAts[atsKey];
    const pMdb = state.mdbs[atsItem.parentMdb];
    const trStatus = pMdb.bus === 'A' ? tr1Status : tr2Status;

    updatedAts[atsKey] = {
      ...atsItem,
      status: evaluateAtsState(pMdb, trStatus, hvStatus, genStatus),
    };
  });

  return {
    nextState: {
      ...state,
      sources: updatedSources,
      ats: updatedAts,
    },
    actionLog: log,
  };
}

/**
 * Calculates realtime telemetry values based on active/tripped components.
 */
export function calculateTelemetry(
  state: SimulatorState,
  microNoise: number = 0
): TelemetryData {
  const isHvOnline = state.sources['src-hv'].status === 'ONLINE';
  const isGenRunning = state.sources['gen-1'].status === 'RUNNING';

  // Voltage
  let nominalVolt = 380.0;
  if (!isHvOnline && !isGenRunning) {
    nominalVolt = 0.0;
  } else if (!isHvOnline && isGenRunning) {
    nominalVolt = 382.0; // Generator regulated voltage
  } else {
    nominalVolt = 380.5;
  }

  // Total current sum of active MDBs
  let activeCurrent = 0;
  Object.values(state.mdbs).forEach((mdb) => {
    if (mdb.status === 'NORMAL') {
      const parentTr = mdb.bus === 'A' ? state.sources['tr-1'] : state.sources['tr-2'];
      if ((isHvOnline && parentTr.status === 'ACTIVE') || isGenRunning) {
        activeCurrent += mdb.baseCurrent;
      }
    }
  });

  // Calculate percentage of transformer capacity (rated ~1588 A full load across active transformers)
  let ratedTotalAmps = 0;
  if (state.sources['tr-1'].status === 'ACTIVE' && isHvOnline) ratedTotalAmps += 794;
  if (state.sources['tr-2'].status === 'ACTIVE' && isHvOnline) ratedTotalAmps += 794;

  let loadPercent = 0;
  if (ratedTotalAmps > 0) {
    loadPercent = (activeCurrent / ratedTotalAmps) * 100;
  } else if (isGenRunning) {
    // 2000 kVA generator capacity ~1266 A
    loadPercent = (activeCurrent / 1266) * 100;
  }

  // Frequency
  let freq = 50.0;
  if (!isHvOnline && !isGenRunning) {
    freq = 0.0;
  } else if (!isHvOnline && isGenRunning) {
    freq = 50.2; // Generator governor setpoint
  }

  const voltage = Math.max(0, parseFloat((nominalVolt + (nominalVolt > 0 ? microNoise * 0.8 : 0)).toFixed(1)));
  const current = Math.max(0, parseFloat((activeCurrent + (activeCurrent > 0 ? microNoise * 4.2 : 0)).toFixed(1)));
  const calcLoad = Math.max(0, Math.min(100, parseFloat((loadPercent + (loadPercent > 0 ? microNoise * 0.5 : 0)).toFixed(1))));
  const frequency = Math.max(0, parseFloat((freq + (freq > 0 ? microNoise * 0.04 : 0)).toFixed(1)));
  const powerKw = calculateTotalPowerKw(voltage, current);

  return {
    voltage,
    current,
    loadPercent: calcLoad,
    frequency,
    powerKw,
  };
}

/**
 * 3-phase AC active real power in kW:
 * P = (sqrt(3) * V_LL * I_RMS * PF) / 1000
 * Standard industrial electrical system PF ~ 0.88
 */
export function calculateTotalPowerKw(
  voltage: number,
  current: number,
  powerFactor: number = 0.88
): number {
  if (voltage <= 0 || current <= 0) return 0;
  const kw = (Math.sqrt(3) * voltage * current * powerFactor) / 1000;
  return parseFloat(kw.toFixed(1));
}

/**
 * Generates initial 60-second baseline trend data with micro-fluctuations
 * so the chart is instantly rich and alive.
 */
export function generateInitialTrendHistory(
  initialTelemetry: TelemetryData,
  totalSeconds: number = 60
): PowerTrendPoint[] {
  const points: PowerTrendPoint[] = [];
  const baseKw = initialTelemetry.powerKw;
  const baseLoad = initialTelemetry.loadPercent;

  for (let i = totalSeconds - 1; i >= 0; i--) {
    // Realistic multi-harmonic noise for SCADA telemetry
    const harmonic = Math.sin(i * 0.35) * 0.7 + Math.cos(i * 0.82) * 0.3 + Math.sin(i * 1.7) * 0.2;
    const noiseFactor = baseKw > 0 ? harmonic * 0.015 : 0; // +/- 1.5% fluctuation
    const powerKw = Math.max(0, parseFloat((baseKw * (1 + noiseFactor)).toFixed(1)));
    const loadPercent = Math.max(0, Math.min(100, parseFloat((baseLoad * (1 + noiseFactor)).toFixed(1))));

    points.push({
      time: i === 0 ? 'Now' : `-${i}s`,
      timestamp: -i,
      powerKw,
      loadPercent,
      voltage: initialTelemetry.voltage,
      current: initialTelemetry.current,
    });
  }

  return points;
}

/**
 * Appends a new 1-second sample to the rolling 60-second window.
 */
export function appendTrendHistory(
  history: PowerTrendPoint[],
  newPoint: Omit<PowerTrendPoint, 'time'>,
  maxSeconds: number = 60
): PowerTrendPoint[] {
  const updated = [...history, { ...newPoint, time: 'Now' }];
  const sliced = updated.slice(-maxSeconds);

  return sliced.map((pt, idx, arr) => {
    const relSec = idx - (arr.length - 1);
    return {
      ...pt,
      time: relSec === 0 ? 'Now' : `${relSec}s`,
    };
  });
}

/**
 * Calculates summary statistics for the 60-second window.
 */
export function calculateTrendStats(points: PowerTrendPoint[]): {
  current: number;
  min: number;
  max: number;
  avg: number;
  fluctuationPct: number;
} {
  if (points.length === 0) {
    return { current: 0, min: 0, max: 0, avg: 0, fluctuationPct: 0 };
  }
  const powers = points.map((p) => p.powerKw);
  const current = powers[powers.length - 1];
  const min = Math.min(...powers);
  const max = Math.max(...powers);
  const sum = powers.reduce((a, b) => a + b, 0);
  const avg = parseFloat((sum / powers.length).toFixed(1));
  const range = max - min;
  const fluctuationPct = avg > 0 ? parseFloat(((range / avg) * 100).toFixed(1)) : 0;

  return { current, min, max, avg, fluctuationPct };
}

/**
 * Evaluates and steps the UPS system simulation over time.
 * If incoming utility power from MDB is lost, UPS seamlessly discharges battery.
 */
export function evaluateUpsSystemState(
  state: SimulatorState,
  deltaSeconds: number = 1
): SimulatorState {
  const isHvOnline = state.sources['src-hv'].status === 'ONLINE';
  const isGenRunning = state.sources['gen-1'].status === 'RUNNING';

  const updatedUmdbs = { ...state.umdbs };
  const updatedUps = { ...state.upsUnits };
  const updatedBatteries = { ...state.batteries };

  // Evaluate each UMDB based on its parent MDB & supply
  Object.keys(updatedUmdbs).forEach((umdbId) => {
    const umdb = updatedUmdbs[umdbId];
    const parentMdb = state.mdbs[umdb.parentMdb];
    const trStatus = parentMdb?.bus === 'A' ? state.sources['tr-1'].status : state.sources['tr-2'].status;
    const isMdbPowered = parentMdb && parentMdb.status === 'NORMAL' && ((isHvOnline && trStatus === 'ACTIVE') || isGenRunning);

    const hasInputPower = isMdbPowered && umdb.inputBreaker === 'CLOSED';

    // Find linked UPS units for this UMDB's system and bus
    const linkedUpsKeys = Object.keys(updatedUps).filter(
      (k) => updatedUps[k].system === umdb.system && updatedUps[k].bus === umdb.bus
    );

    if (!hasInputPower) {
      // Utility power lost -> UPS must support load via battery
      updatedUmdbs[umdbId] = {
        ...umdb,
        status: umdb.outputBreaker === 'OPEN' ? 'POWER_LOST' : 'ON_BATTERY',
      };

      linkedUpsKeys.forEach((upsKey) => {
        const u = updatedUps[upsKey];
        if (u.status === 'ONLINE') {
          updatedUps[upsKey] = { ...u, status: 'BATTERY' };
        }
        // Link to battery
        const b = updatedBatteries[u.batteryId];
        if (b && (b.status === 'FLOAT' || b.status === 'CHARGE')) {
          const newSoc = Math.max(0, b.socPercent - (0.05 * deltaSeconds)); // Discharging
          updatedBatteries[u.batteryId] = {
            ...b,
            status: 'DISCHARGE',
            socPercent: parseFloat(newSoc.toFixed(2)),
            voltageDc: 482.0,
            currentAmps: -142.5,
            backupMinutes: Math.max(0, parseFloat((newSoc * 0.28).toFixed(1))),
          };
        } else if (b && b.status === 'DISCHARGE') {
          const newSoc = Math.max(0, b.socPercent - (0.05 * deltaSeconds));
          updatedBatteries[u.batteryId] = {
            ...b,
            socPercent: parseFloat(newSoc.toFixed(2)),
            backupMinutes: Math.max(0, parseFloat((newSoc * 0.28).toFixed(1))),
          };
        }
      });
    } else {
      // Utility power is healthy
      const anyOnBattery = linkedUpsKeys.some((k) => updatedUps[k].status === 'BATTERY');
      const anyBypass = linkedUpsKeys.some((k) => updatedUps[k].status === 'BYPASS');

      updatedUmdbs[umdbId] = {
        ...umdb,
        status: anyBypass ? 'ON_BYPASS' : anyOnBattery ? 'ON_BATTERY' : 'ON_UPS',
      };

      linkedUpsKeys.forEach((upsKey) => {
        const u = updatedUps[upsKey];
        const b = updatedBatteries[u.batteryId];
        if (b && b.status === 'DISCHARGE') {
          // Recover battery
          updatedBatteries[u.batteryId] = {
            ...b,
            status: b.socPercent < 100 ? 'CHARGE' : 'FLOAT',
            voltageDc: b.socPercent < 100 ? 535.0 : 542.0,
            currentAmps: b.socPercent < 100 ? 25.0 : 0.8,
            backupMinutes: 28.5,
          };
        } else if (b && b.status === 'CHARGE') {
          const newSoc = Math.min(100, b.socPercent + (0.1 * deltaSeconds));
          if (newSoc >= 100) {
            updatedBatteries[u.batteryId] = {
              ...b,
              status: 'FLOAT',
              socPercent: 100,
              voltageDc: 542.0,
              currentAmps: 0.8,
            };
          } else {
            updatedBatteries[u.batteryId] = {
              ...b,
              socPercent: parseFloat(newSoc.toFixed(2)),
            };
          }
        }
      });
    }
  });

  return {
    ...state,
    umdbs: updatedUmdbs,
    upsUnits: updatedUps,
    batteries: updatedBatteries,
  };
}

/**
 * Toggle a specific UPS module state (ONLINE -> BATTERY -> BYPASS -> FAULT -> ONLINE)
 */
export function toggleUpsUnit(
  state: SimulatorState,
  upsId: string
): { nextState: SimulatorState; actionLog: string } {
  const ups = state.upsUnits[upsId];
  if (!ups) return { nextState: state, actionLog: 'UPS not found' };

  const cycle: Record<UpsStatus, UpsStatus> = {
    ONLINE: 'BATTERY',
    BATTERY: 'BYPASS',
    BYPASS: 'FAULT',
    FAULT: 'ONLINE',
  };

  const nextStatus = cycle[ups.status];
  const updatedUps = {
    ...state.upsUnits,
    [upsId]: { ...ups, status: nextStatus },
  };

  // Sync battery
  const updatedBatteries = { ...state.batteries };
  const b = updatedBatteries[ups.batteryId];
  if (b) {
    if (nextStatus === 'BATTERY') {
      updatedBatteries[ups.batteryId] = { ...b, status: 'DISCHARGE', voltageDc: 482.0, currentAmps: -138.0 };
    } else if (nextStatus === 'ONLINE') {
      updatedBatteries[ups.batteryId] = { ...b, status: 'FLOAT', voltageDc: 542.0, currentAmps: 0.8 };
    }
  }

  const actionLog = `[UPS] โมดูล ${ups.name} เปลี่ยนโหมดการทำงานเป็น ${nextStatus}`;

  return {
    nextState: { ...state, upsUnits: updatedUps, batteries: updatedBatteries },
    actionLog,
  };
}

/**
 * Toggle a Battery Bank state (FLOAT -> DISCHARGE -> TEST -> FLOAT)
 */
export function toggleBatteryBank(
  state: SimulatorState,
  battId: string
): { nextState: SimulatorState; actionLog: string } {
  const batt = state.batteries[battId];
  if (!batt) return { nextState: state, actionLog: 'Battery not found' };

  let nextStatus: BatteryStatus = 'FLOAT';
  let v = 542.0;
  let a = 0.8;

  if (batt.status === 'FLOAT') {
    nextStatus = 'DISCHARGE';
    v = 480.0;
    a = -145.0;
  } else if (batt.status === 'DISCHARGE') {
    nextStatus = 'TEST';
    v = 510.0;
    a = -40.0;
  } else {
    nextStatus = 'FLOAT';
    v = 542.0;
    a = 0.8;
  }

  const updatedBatteries = {
    ...state.batteries,
    [battId]: { ...batt, status: nextStatus, voltageDc: v, currentAmps: a },
  };

  const actionLog = `[Battery] แบตเตอรี่แบงก์ ${batt.name} เปลี่ยนสถานะเป็น ${nextStatus} (${v}V, ${a}A)`;

  return {
    nextState: { ...state, batteries: updatedBatteries },
    actionLog,
  };
}

/**
 * Toggle UMDB Breakers (I/P or O/P)
 */
export function toggleUmdbBreaker(
  state: SimulatorState,
  umdbId: string,
  breakerType: 'input' | 'output'
): { nextState: SimulatorState; actionLog: string } {
  const umdb = state.umdbs[umdbId];
  if (!umdb) return { nextState: state, actionLog: 'UMDB not found' };

  const currentStatus = breakerType === 'input' ? umdb.inputBreaker : umdb.outputBreaker;
  const nextBreakerStatus = currentStatus === 'CLOSED' ? 'OPEN' : 'CLOSED';

  const updatedUmdb = {
    ...umdb,
    [breakerType === 'input' ? 'inputBreaker' : 'outputBreaker']: nextBreakerStatus,
  };

  const nextState = evaluateUpsSystemState({
    ...state,
    umdbs: { ...state.umdbs, [umdbId]: updatedUmdb },
  });

  const breakerName = breakerType === 'input' ? `I/P ${umdb.name}` : `O/P ${umdb.name}`;
  const actionLog = `[Breaker] เบรกเกอร์ ${breakerName} ถูกสั่ง ${nextBreakerStatus === 'CLOSED' ? 'สับเข้า (CLOSE)' : 'ปลดออก (OPEN)'}`;

  return { nextState, actionLog };
}

/**
 * Initiates complete UPS Blackout Drill / Battery Discharge Simulation
 */
export function simulateUpsDrill(state: SimulatorState): { nextState: SimulatorState; actionLog: string } {
  const isAnyDischarging = Object.values(state.batteries).some((b) => b.status === 'DISCHARGE');
  const updatedUps = { ...state.upsUnits };
  const updatedBatteries = { ...state.batteries };
  const updatedUmdbs = { ...state.umdbs };

  const targetStatus = isAnyDischarging ? 'ONLINE' : 'BATTERY';
  const targetBattStatus = isAnyDischarging ? 'FLOAT' : 'DISCHARGE';

  Object.keys(updatedUps).forEach((k) => {
    updatedUps[k] = { ...updatedUps[k], status: targetStatus };
  });

  Object.keys(updatedBatteries).forEach((k) => {
    updatedBatteries[k] = {
      ...updatedBatteries[k],
      status: targetBattStatus,
      voltageDc: targetBattStatus === 'DISCHARGE' ? 481.5 : 542.0,
      currentAmps: targetBattStatus === 'DISCHARGE' ? -140.0 : 0.8,
    };
  });

  Object.keys(updatedUmdbs).forEach((k) => {
    updatedUmdbs[k] = {
      ...updatedUmdbs[k],
      status: targetStatus === 'BATTERY' ? 'ON_BATTERY' : 'ON_UPS',
    };
  });

  const actionLog = isAnyDischarging
    ? '[UPS Test] สิ้นสุดการทดสอบระบบ UPS แบตเตอรี่กลับสู่โหมด Float Charge ปกติ'
    : '[UPS Test] จำลองเหตุการณ์ไฟฟ้าดับฉุกเฉิน (Drill) - UPS และแบตเตอรี่ทุกตู้สลับจ่ายไฟสำรองทันที (0ms Transfer)!';

  return {
    nextState: { ...state, upsUnits: updatedUps, batteries: updatedBatteries, umdbs: updatedUmdbs },
    actionLog,
  };
}

/**
 * Calculates system status badge counters (Critical, Major, Minor, Warning).
 */
export function calculateCounters(state: SimulatorState): SystemCounters {
  let critical = 0;
  let major = 0;
  let minor = 0;
  let warning = 0;

  // Tripped MDBs are critical
  Object.values(state.mdbs).forEach((mdb) => {
    if (mdb.status === 'TRIPPED') {
      critical += 1;
    }
  });

  // HV fault or Transformer fault is critical
  if (state.sources['src-hv'].status === 'FAULT') critical += 2;
  if (state.sources['tr-1'].status === 'FAULT') critical += 1;
  if (state.sources['tr-2'].status === 'FAULT') critical += 1;

  // ATS in TRANSFER or POWER LOST are major/critical
  Object.values(state.ats).forEach((ats) => {
    if (ats.status === 'POWER LOST') {
      critical += 1;
    } else if (ats.status === 'TRANSFER') {
      major += 1;
    }
  });

  // Emergency Generator running is major
  if (state.sources['gen-1'].status === 'RUNNING') {
    major += 1;
  }

  // UPS counters
  if (state.upsUnits) {
    Object.values(state.upsUnits).forEach((ups) => {
      if (ups.status === 'FAULT') critical += 1;
      else if (ups.status === 'BATTERY') major += 1;
      else if (ups.status === 'BYPASS') warning += 1;
    });
  }

  // Battery counters
  if (state.batteries) {
    Object.values(state.batteries).forEach((b) => {
      if (b.status === 'FAULT') critical += 1;
      else if (b.status === 'DISCHARGE' || b.status === 'TEST') minor += 1;
    });
  }

  // Minor alerts (e.g. generator standby with high load)
  if (state.sources['gen-1'].status === 'STANDBY' && critical > 0) {
    warning += 1;
  }

  return { critical, major, minor, warning };
}

// ==========================================
// UPS EFFICIENCY & MODULE THERMAL LOSS LOGIC
// ==========================================

export interface UpsModuleThermalData {
  moduleId: number; // 1-10
  unitId: string; // 'ups-3a1', 'ups-3a2', etc.
  unitName: string;
  bus: 'A' | 'B';
  status: 'NORMAL' | 'HOT' | 'CRITICAL' | 'FAULT' | 'OFFLINE';
  loadKw: number;
  capacityKw: number; // 60 kW per module (10 modules = 600 kW)
  loadPercent: number;
  efficiencyPct: number;
  // Energy loss breakdown
  lossKw: number;
  conductionLossKw: number;
  switchingLossKw: number;
  filterCoreLossKw: number;
  auxiliaryLossKw: number;
  // Thermal telemetry
  temperatureC: number;
  heatBtuPerHour: number;
  heatRiskIndex: number; // 0 - 100 heat map index
  fanSpeedRpm: number;
}

export interface UpsEfficiencyPoint {
  time: string;
  timestamp: number;
  inputPowerKw: number;
  outputPowerKw: number;
  lossKw: number;
  efficiencyPct: number;
  busAInputKw: number;
  busAOutputKw: number;
  busALossKw: number;
  busAEfficiencyPct: number;
  busBInputKw: number;
  busBOutputKw: number;
  busBLossKw: number;
  busBEfficiencyPct: number;
}

export interface UpsEfficiencySummary {
  totalInputKw: number;
  totalOutputKw: number;
  totalLossKw: number;
  systemEfficiencyPct: number;
  totalHeatBtuPerHour: number;
  pueImpact: number;
  monthlyLossCostThb: number;
  hottestModule: {
    unitName: string;
    moduleId: number;
    temperatureC: number;
    lossKw: number;
  };
  coolestModule: {
    unitName: string;
    moduleId: number;
    temperatureC: number;
    lossKw: number;
  };
  averageModuleTempC: number;
}

/**
 * Calculates per-module thermal energy loss and heat map metrics for all 60 modular blocks (6 units x 10 modules)
 */
export function calculateUpsModuleThermalLosses(
  state: SimulatorState,
  moduleFaults: Record<string, Record<number, boolean>> = {},
  ambientTempC = 23.5
): UpsModuleThermalData[] {
  const units = [
    { id: 'ups-3a1', name: 'UPS-3A1', bus: 'A' as const },
    { id: 'ups-3a2', name: 'UPS-3A2', bus: 'A' as const },
    { id: 'ups-3a3', name: 'UPS-3A3', bus: 'A' as const },
    { id: 'ups-3b1', name: 'UPS-3B1', bus: 'B' as const },
    { id: 'ups-3b2', name: 'UPS-3B2', bus: 'B' as const },
    { id: 'ups-3b3', name: 'UPS-3B3', bus: 'B' as const },
  ];

  const results: UpsModuleThermalData[] = [];

  for (const unit of units) {
    const upsUnit = state.upsUnits[unit.id] || {
      id: unit.id,
      name: unit.name,
      status: 'ONLINE',
      loadKw: 96.2,
      efficiencyPct: 96.8,
    };

    const unitStatus = upsUnit.status;
    const unitFaults = moduleFaults[unit.id] || {};
    const totalUnitLoadKw = unitStatus === 'FAULT' ? 0 : (upsUnit.loadKw || 96.2);

    // Count healthy online modules
    let healthyModulesCount = 0;
    for (let m = 1; m <= 10; m++) {
      if (!unitFaults[m] && unitStatus !== 'FAULT') {
        healthyModulesCount++;
      }
    }

    const perModuleLoadKw = healthyModulesCount > 0 ? totalUnitLoadKw / healthyModulesCount : 0;
    const capacityPerModule = 60.0; // 60 kW per module

    for (let m = 1; m <= 10; m++) {
      const isFault = !!unitFaults[m] || unitStatus === 'FAULT';

      if (isFault) {
        // Module is offline or faulted
        results.push({
          moduleId: m,
          unitId: unit.id,
          unitName: unit.name,
          bus: unit.bus,
          status: 'FAULT',
          loadKw: 0,
          capacityKw: capacityPerModule,
          loadPercent: 0,
          efficiencyPct: 0,
          lossKw: 0.05, // residual standby control board draw
          conductionLossKw: 0,
          switchingLossKw: 0,
          filterCoreLossKw: 0,
          auxiliaryLossKw: 0.05,
          temperatureC: ambientTempC + 1.2,
          heatBtuPerHour: 0.05 * 3412.142,
          heatRiskIndex: 95,
          fanSpeedRpm: 0,
        });
        continue;
      }

      // Operational mode characteristics
      let baseEff = 96.8;
      if (unitStatus === 'BATTERY') {
        baseEff = 94.2; // higher loss through DC converter and battery path
      } else if (unitStatus === 'BYPASS') {
        baseEff = 99.1; // static bypass SCR path
      }

      const modLoadPct = Math.min(100, (perModuleLoadKw / capacityPerModule) * 100);
      
      // Loss calculation (P_in - P_out)
      const inputKw = perModuleLoadKw > 0 ? perModuleLoadKw / (baseEff / 100) : 0.05;
      const totalLossKw = Math.max(0.05, inputKw - perModuleLoadKw);

      // Energy loss decomposition:
      // Conduction loss: IGBT V_ce_sat and diode Vf * I_load (varies with load)
      const conductionLossKw = totalLossKw * (unitStatus === 'BYPASS' ? 0.85 : 0.54);
      // Switching loss: PWM frequency x turn-on/turn-off energies
      const switchingLossKw = unitStatus === 'BYPASS' ? 0.02 : totalLossKw * 0.26;
      // Filter inductor / capacitor losses
      const filterCoreLossKw = unitStatus === 'BYPASS' ? 0.03 : totalLossKw * 0.12;
      // Auxiliary losses (cooling fans, logic controller, drive gate power)
      const auxiliaryLossKw = Math.max(0.03, totalLossKw * 0.08);

      // Stack positional temperature pocket: modules 4, 5, 6, 7 are stacked in the middle column
      const positionHeatPocket = (m >= 4 && m <= 7) ? 2.3 : (m === 1 || m === 10) ? 0.4 : 1.2;

      // Thermal temperature calculation
      const tempRise = (totalLossKw * 13.8) + (modLoadPct * 0.07) + positionHeatPocket;
      const temperatureC = Number((ambientTempC + tempRise).toFixed(1));

      // Heat BTU / hr
      const heatBtuPerHour = Number((totalLossKw * 3412.142).toFixed(1));

      // Heat risk index (0 - 100)
      let heatRiskIndex = Math.min(100, Math.max(5, Math.round(((temperatureC - ambientTempC) / 32) * 100)));
      let status: UpsModuleThermalData['status'] = 'NORMAL';
      if (temperatureC >= 52 || heatRiskIndex >= 85) {
        status = 'CRITICAL';
        heatRiskIndex = 90;
      } else if (temperatureC >= 43 || heatRiskIndex >= 60) {
        status = 'HOT';
      }

      // Fan speed responds to temperature
      const fanSpeedRpm = Math.min(6000, Math.max(1200, Math.round(1500 + (temperatureC - ambientTempC) * 160)));

      results.push({
        moduleId: m,
        unitId: unit.id,
        unitName: unit.name,
        bus: unit.bus,
        status,
        loadKw: Number(perModuleLoadKw.toFixed(2)),
        capacityKw: capacityPerModule,
        loadPercent: Number(modLoadPct.toFixed(1)),
        efficiencyPct: Number(baseEff.toFixed(2)),
        lossKw: Number(totalLossKw.toFixed(3)),
        conductionLossKw: Number(conductionLossKw.toFixed(3)),
        switchingLossKw: Number(switchingLossKw.toFixed(3)),
        filterCoreLossKw: Number(filterCoreLossKw.toFixed(3)),
        auxiliaryLossKw: Number(auxiliaryLossKw.toFixed(3)),
        temperatureC,
        heatBtuPerHour,
        heatRiskIndex,
        fanSpeedRpm,
      });
    }
  }

  return results;
}

/**
 * Derives comprehensive UPS efficiency summaries, heat dissipation, and financial cost of energy losses
 */
export function calculateUpsEfficiencySummary(
  modules: UpsModuleThermalData[],
  _state?: SimulatorState
): UpsEfficiencySummary {
  let totalInputKw = 0;
  let totalOutputKw = 0;
  let totalLossKw = 0;
  let totalHeatBtuPerHour = 0;
  let totalTemp = 0;

  let hottest = modules[0] || { unitName: 'UPS-3A1', moduleId: 1, temperatureC: 38, lossKw: 0.95 };
  let coolest = modules[0] || { unitName: 'UPS-3A1', moduleId: 1, temperatureC: 38, lossKw: 0.95 };

  for (const m of modules) {
    const modInput = m.loadKw + m.lossKw;
    totalInputKw += modInput;
    totalOutputKw += m.loadKw;
    totalLossKw += m.lossKw;
    totalHeatBtuPerHour += m.heatBtuPerHour;
    totalTemp += m.temperatureC;

    if (m.temperatureC > hottest.temperatureC && m.status !== 'FAULT') {
      hottest = m;
    }
    if (m.temperatureC < coolest.temperatureC && m.status !== 'FAULT' && m.loadKw > 0) {
      coolest = m;
    }
  }

  const systemEfficiencyPct = totalInputKw > 0 ? (totalOutputKw / totalInputKw) * 100 : 0;
  const averageModuleTempC = modules.length > 0 ? totalTemp / modules.length : 25;

  // PUE impact: UPS losses add directly to the facility overhead power
  // Delta PUE = totalLossKw / totalOutputKw
  const pueImpact = totalOutputKw > 0 ? Number((totalLossKw / totalOutputKw).toFixed(4)) : 0.035;

  // Financial loss calculation based on standard commercial Data Center electricity tariff in Thailand: ~4.5 THB / kWh
  // Monthly loss (THB) = totalLossKw * 24 hours * 30 days * 4.5 THB
  const monthlyLossCostThb = Math.round(totalLossKw * 24 * 30 * 4.5);

  return {
    totalInputKw: Number(totalInputKw.toFixed(1)),
    totalOutputKw: Number(totalOutputKw.toFixed(1)),
    totalLossKw: Number(totalLossKw.toFixed(2)),
    systemEfficiencyPct: Number(systemEfficiencyPct.toFixed(2)),
    totalHeatBtuPerHour: Math.round(totalHeatBtuPerHour),
    pueImpact,
    monthlyLossCostThb,
    hottestModule: {
      unitName: hottest.unitName,
      moduleId: hottest.moduleId,
      temperatureC: hottest.temperatureC,
      lossKw: hottest.lossKw,
    },
    coolestModule: {
      unitName: coolest.unitName,
      moduleId: coolest.moduleId,
      temperatureC: coolest.temperatureC,
      lossKw: coolest.lossKw,
    },
    averageModuleTempC: Number(averageModuleTempC.toFixed(1)),
  };
}

/**
 * Generates initial rolling 60s history for UPS Input vs Output Power and Efficiency
 */
export function generateInitialUpsEfficiencyHistory(
  state: SimulatorState,
  pointsCount = 60
): UpsEfficiencyPoint[] {
  const history: UpsEfficiencyPoint[] = [];
  const now = Date.now();

  const isHvFault = state.sources['src-hv'].status === 'FAULT';
  const isBattMode = Object.values(state.batteries).some((b) => b.status === 'DISCHARGE');

  for (let i = pointsCount - 1; i >= 0; i--) {
    const timestamp = now - i * 1000;
    const timeLabel = `-${i}s`;

    const noise = Math.sin((timestamp / 1000) * 0.35) * 1.8;
    const busANoise = Math.cos((timestamp / 1000) * 0.4) * 0.9;
    const busBNoise = Math.sin((timestamp / 1000) * 0.25) * 1.1;

    // Nominal loads: Train A ~288.6 kW, Train B ~294.0 kW -> Total ~582.6 kW
    const busAOutputKw = Math.max(10, 288.6 + busANoise);
    const busBOutputKw = Math.max(10, 294.0 + busBNoise);
    const outputPowerKw = busAOutputKw + busBOutputKw + noise;

    let busAEff = 96.8;
    let busBEff = 96.7;

    if (isBattMode) {
      busAEff = 94.2;
      busBEff = 94.1;
    } else if (isHvFault) {
      busAEff = 94.0;
      busBEff = 94.0;
    }

    const busAInputKw = isHvFault && !isBattMode ? 0 : busAOutputKw / (busAEff / 100);
    const busBInputKw = isHvFault && !isBattMode ? 0 : busBOutputKw / (busBEff / 100);
    const inputPowerKw = busAInputKw + busBInputKw;

    const busALossKw = Math.max(0, busAInputKw - busAOutputKw);
    const busBLossKw = Math.max(0, busBInputKw - busBOutputKw);
    const lossKw = busALossKw + busBLossKw;

    const efficiencyPct = inputPowerKw > 0 ? (outputPowerKw / inputPowerKw) * 100 : 0;

    history.push({
      time: timeLabel,
      timestamp,
      inputPowerKw: Number(inputPowerKw.toFixed(1)),
      outputPowerKw: Number(outputPowerKw.toFixed(1)),
      lossKw: Number(lossKw.toFixed(2)),
      efficiencyPct: Number(efficiencyPct.toFixed(2)),
      busAInputKw: Number(busAInputKw.toFixed(1)),
      busAOutputKw: Number(busAOutputKw.toFixed(1)),
      busALossKw: Number(busALossKw.toFixed(2)),
      busAEfficiencyPct: Number(busAEff.toFixed(2)),
      busBInputKw: Number(busBInputKw.toFixed(1)),
      busBOutputKw: Number(busBOutputKw.toFixed(1)),
      busBLossKw: Number(busBLossKw.toFixed(2)),
      busBEfficiencyPct: Number(busBEff.toFixed(2)),
    });
  }

  return history;
}

/**
 * Appends a new sample to the UPS efficiency rolling history
 */
export function appendUpsEfficiencyHistory(
  prevHistory: UpsEfficiencyPoint[],
  state: SimulatorState,
  windowSize = 60
): UpsEfficiencyPoint[] {
  const timestamp = Date.now();
  const noise = Math.sin((timestamp / 1000) * 0.35) * 1.5;

  const isHvFault = state.sources['src-hv'].status === 'FAULT';
  const isBattMode = Object.values(state.batteries).some((b) => b.status === 'DISCHARGE');

  const busAOutputKw = Math.max(10, 288.6 + Math.cos(timestamp * 0.002) * 1.2);
  const busBOutputKw = Math.max(10, 294.0 + Math.sin(timestamp * 0.0025) * 1.4);
  const outputPowerKw = busAOutputKw + busBOutputKw + noise;

  let busAEff = 96.8;
  let busBEff = 96.7;

  if (isBattMode) {
    busAEff = 94.2;
    busBEff = 94.1;
  } else if (isHvFault) {
    busAEff = 94.0;
    busBEff = 94.0;
  }

  const busAInputKw = isHvFault && !isBattMode ? 0 : busAOutputKw / (busAEff / 100);
  const busBInputKw = isHvFault && !isBattMode ? 0 : busBOutputKw / (busBEff / 100);
  const inputPowerKw = busAInputKw + busBInputKw;

  const busALossKw = Math.max(0, busAInputKw - busAOutputKw);
  const busBLossKw = Math.max(0, busBInputKw - busBOutputKw);
  const lossKw = busALossKw + busBLossKw;

  const efficiencyPct = inputPowerKw > 0 ? (outputPowerKw / inputPowerKw) * 100 : 0;

  const newPoint: UpsEfficiencyPoint = {
    time: '0s',
    timestamp,
    inputPowerKw: Number(inputPowerKw.toFixed(1)),
    outputPowerKw: Number(outputPowerKw.toFixed(1)),
    lossKw: Number(lossKw.toFixed(2)),
    efficiencyPct: Number(efficiencyPct.toFixed(2)),
    busAInputKw: Number(busAInputKw.toFixed(1)),
    busAOutputKw: Number(busAOutputKw.toFixed(1)),
    busALossKw: Number(busALossKw.toFixed(2)),
    busAEfficiencyPct: Number(busAEff.toFixed(2)),
    busBInputKw: Number(busBInputKw.toFixed(1)),
    busBOutputKw: Number(busBOutputKw.toFixed(1)),
    busBLossKw: Number(busBLossKw.toFixed(2)),
    busBEfficiencyPct: Number(busBEff.toFixed(2)),
  };

  const updated = [...prevHistory, newPoint].slice(-windowSize);

  // Recalculate relative negative time labels (-59s, -58s, ... 0s)
  const len = updated.length;
  return updated.map((pt, idx) => ({
    ...pt,
    time: idx === len - 1 ? '0s' : `-${len - 1 - idx}s`,
  }));
}

// ==========================================
// ALARM LINKING & DEEP NAVIGATION RESOLVER
// ==========================================

export type AlarmSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING';

export interface ActiveAlarmItem {
  id: string;
  code: string;
  severity: AlarmSeverity;
  title: string;
  description: string;
  equipmentId: string;
  equipmentName: string;
  locationText: string;
  targetTab: 'ee' | 'ups' | 'floor' | 'ac' | 'overview' | 'ups-efficiency' | 'hv-diagram' | 'up-tier' | 'maintenance' | 'kpi' | 'alarm-export';
  targetSubTab?: string;
  targetElementId: string;
  timestamp: string;
  recommendedAction: string;
  isRecoverable: boolean;
  recoveryAction?: 'reset-mdb' | 'toggle-source' | 'toggle-ups' | 'reset-all';
}

/**
 * Resolves all currently active alarms in the system, providing exact
 * target tabs, subtabs, and DOM element IDs for instant 1-click navigation.
 */
export function resolveActiveAlarms(state: SimulatorState): ActiveAlarmItem[] {
  const alarms: ActiveAlarmItem[] = [];
  const timeStr = new Date().toLocaleTimeString('th-TH');

  // 1. Grid Blackout / HV Fault
  if (state.sources['src-hv'] && state.sources['src-hv'].status === 'FAULT') {
    alarms.push({
      id: 'alm-src-hv',
      code: 'ALM-22KV-GRID-LOSS',
      severity: 'CRITICAL',
      title: 'แหล่งจ่ายไฟฟ้าแรงสูง PEA 22kV ขัดข้อง (Grid Blackout)',
      description: 'ระบบไฟฟ้า 22kV 3PH 3W สูญเสียแรงดันไฟฟ้าทั้งระบบ หม้อแปลงทุกตัวหยุดจ่ายไฟ กำลังใช้เครื่องกำเนิดไฟฟ้าฉุกเฉินและระบบแบตเตอรี่ UPS',
      equipmentId: 'src-hv',
      equipmentName: 'PEA 22kV High Voltage Feed',
      locationText: 'สถานีไฟฟ้าย่อยภายนอก / RM6 Substation Yard',
      targetTab: 'hv-diagram',
      targetElementId: 'src-hv',
      timestamp: timeStr,
      recommendedAction: 'ตรวจสอบสถานะ PEA 22kV Substation และยืนยันการเชื่อมต่อ Generator Tie Breaker',
      isRecoverable: true,
      recoveryAction: 'toggle-source',
    });
  }

  // 2. Transformers Fault
  if (state.sources['tr-1'] && state.sources['tr-1'].status === 'FAULT') {
    alarms.push({
      id: 'alm-tr-1',
      code: 'ALM-TR1-TRIP',
      severity: 'CRITICAL',
      title: 'หม้อแปลง TR-1 (2500kVA Dyn11) ขัดข้อง',
      description: 'Transformer TR-1 เกิด Over-temperature หรือ Overcurrent trip วงจรบัส A ต้องย้ายไปรับไฟจากบัส B หรือ Generator',
      equipmentId: 'tr-1',
      equipmentName: 'Transformer TR-1 (2500kVA)',
      locationText: 'ห้องหม้อแปลงไฟฟ้า TR Room 1 (Ground Fl.)',
      targetTab: 'hv-diagram',
      targetElementId: 'tr-1',
      timestamp: timeStr,
      recommendedAction: 'ตรวจสอบอุณหภูมิน้ำมันหม้อแปลง (Oil Temp) และรีเซ็ต Protection Relay',
      isRecoverable: true,
      recoveryAction: 'toggle-source',
    });
  }

  if (state.sources['tr-2'] && state.sources['tr-2'].status === 'FAULT') {
    alarms.push({
      id: 'alm-tr-2',
      code: 'ALM-TR2-TRIP',
      severity: 'CRITICAL',
      title: 'หม้อแปลง TR-2 (2500kVA Dyn11) ขัดข้อง',
      description: 'Transformer TR-2 ตัดวงจร วงจรบัส B สูญเสียแหล่งจ่ายปกติ',
      equipmentId: 'tr-2',
      equipmentName: 'Transformer TR-2 (2500kVA)',
      locationText: 'ห้องหม้อแปลงไฟฟ้า TR Room 2 (Ground Fl.)',
      targetTab: 'hv-diagram',
      targetElementId: 'tr-2',
      timestamp: timeStr,
      recommendedAction: 'ตรวจสอบสถานะโหลดและรีเซ็ต Protection Relay',
      isRecoverable: true,
      recoveryAction: 'toggle-source',
    });
  }

  // 3. Tripped MDBs (Air Circuit Breakers)
  Object.values(state.mdbs).forEach((mdb) => {
    if (mdb.status === 'TRIPPED') {
      const isBusA = mdb.bus === 'A';
      alarms.push({
        id: `alm-${mdb.id}`,
        code: `ALM-${mdb.name}-TRIP`,
        severity: 'CRITICAL',
        title: `ตู้สวิตช์บอร์ด ${mdb.name} ตัดวงจร (ACB Overcurrent Tripped)`,
        description: `Main Distribution Board ${mdb.name} (Bus ${mdb.bus}) ตัดการจ่ายกระแส (~${mdb.baseCurrent}A) สวิตช์ ATS ในสายถูกสั่งสลับแหล่งจ่าย`,
        equipmentId: mdb.id,
        equipmentName: `${mdb.name} (Main Switchboard Bus ${mdb.bus})`,
        locationText: `ชั้น 3 ห้องไฟฟ้าหลัก Power Room ${isBusA ? '1 (Line A)' : '2 (Line B)'}`,
        targetTab: 'ee',
        targetElementId: mdb.id,
        timestamp: timeStr,
        recommendedAction: `ตรวจสอบกระแสโหลดเกิน (${mdb.baseCurrent}A) และกดคลิกเพื่อรีเซ็ตเบรกเกอร์ ${mdb.name}`,
        isRecoverable: true,
        recoveryAction: 'reset-mdb',
      });
    }
  });

  // 4. ATS in TRANSFER or POWER LOST
  Object.values(state.ats).forEach((ats) => {
    if (ats.status === 'POWER LOST') {
      alarms.push({
        id: `alm-${ats.id}`,
        code: `ALM-${ats.name}-PWRLOSS`,
        severity: 'CRITICAL',
        title: `สวิตช์ถ่ายโอน ${ats.name} สูญเสียกำลังไฟฟ้าทั้งหมด (Blackout)`,
        description: `${ats.description} ไม่มีแหล่งจ่ายทั้ง Main Source และ Emergency Generator`,
        equipmentId: ats.id,
        equipmentName: `${ats.name} (${ats.description})`,
        locationText: `โซนสวิตช์บอร์ด ATS Distribution Corridor`,
        targetTab: 'ee',
        targetElementId: ats.id,
        timestamp: timeStr,
        recommendedAction: 'สตาร์ตเครื่องกำเนิดไฟฟ้าสำรอง GEN-1 หรือสลับ Manual Bypass',
        isRecoverable: false,
      });
    } else if (ats.status === 'TRANSFER') {
      alarms.push({
        id: `alm-${ats.id}`,
        code: `ALM-${ats.name}-TRANSFER`,
        severity: 'MAJOR',
        title: `สวิตช์ ${ats.name} กำลังใช้ไฟฉุกเฉิน (ATS on Emergency Generator)`,
        description: `${ats.description} สลับมารับไฟฟ้าจากเครื่องกำเนิดไฟฟ้าสำรองเนื่องจากสายเมนปกติขัดข้อง`,
        equipmentId: ats.id,
        equipmentName: `${ats.name} (${ats.description})`,
        locationText: `โซนสวิตช์บอร์ด ATS Distribution Corridor`,
        targetTab: 'ee',
        targetElementId: ats.id,
        timestamp: timeStr,
        recommendedAction: 'ฟื้นฟูแหล่งจ่ายหลัก MDB/Transformer เพื่อให้ ATS สลับกลับสภาวะปกติ (Sync Normal)',
        isRecoverable: false,
      });
    }
  });

  // 5. Emergency Generator Running
  if (state.sources['gen-1'] && state.sources['gen-1'].status === 'RUNNING') {
    alarms.push({
      id: 'alm-gen-running',
      code: 'ALM-GEN1-ACTIVE',
      severity: 'MAJOR',
      title: 'เครื่องกำเนิดไฟฟ้าฉุกเฉิน GEN-1 กำลังทำงาน (On Generator Load)',
      description: 'Emergency Diesel Generator GEN-1 (2000kVA) ทำงานรับโหลดฉุกเฉิน อัตราสิ้นเปลืองน้ำมันเชื้อเพลิง ~420 L/hr',
      equipmentId: 'gen-1',
      equipmentName: 'Emergency Generator GEN-1',
      locationText: 'อาคารเครื่องกำเนิดไฟฟ้า Generator Yard & Fuel Tank Sub-base',
      targetTab: 'ee',
      targetElementId: 'gen-1',
      timestamp: timeStr,
      recommendedAction: 'เฝ้าระวังระดับน้ำมันเชื้อเพลิงสำรองและเตรียมคืนระบบสู่การไฟฟ้าเมื่อไฟหลักกลับมา',
      isRecoverable: true,
      recoveryAction: 'toggle-source',
    });
  }

  // 6. UPS System Alarms
  if (state.upsUnits) {
    Object.values(state.upsUnits).forEach((ups) => {
      if (ups.status === 'FAULT') {
        alarms.push({
          id: `alm-${ups.id}`,
          code: `ALM-${ups.name}-FAULT`,
          severity: 'CRITICAL',
          title: `โมดูล ${ups.name} ขัดข้อง (Inverter Fault)`,
          description: `UPS ${ups.name} (Bus ${ups.bus}) อินเวอร์เตอร์ตัดการทำงาน ระบบสลับเข้า Static Bypass หรืออาศัยโมดูลคู่ขนาน N+1`,
          equipmentId: ups.id,
          equipmentName: `${ups.name} (500kVA Modular UPS)`,
          locationText: `ชั้น 3 ห้อง UPS Room ${ups.bus === 'A' ? '#1' : '#2'}`,
          targetTab: 'ups',
          targetSubTab: ups.name,
          targetElementId: ups.id,
          timestamp: timeStr,
          recommendedAction: 'ตรวจสอบสัญญาณเตือนบนแผงควบคุมหน้าตู้ UPS และเปลี่ยนโมดูล Power Module ที่ชำรุด',
          isRecoverable: true,
          recoveryAction: 'toggle-ups',
        });
      } else if (ups.status === 'BATTERY') {
        alarms.push({
          id: `alm-${ups.id}-batt`,
          code: `ALM-${ups.name}-DISCHARGING`,
          severity: 'MAJOR',
          title: `ตู้ ${ups.name} กำลังจ่ายไฟจากแบตเตอรี่ (Battery Discharging)`,
          description: `UPS ${ups.name} ทำงานในโหมด Discharge เนื่องจากไฟฟ้าขาเข้าผิดปกติ กำลังใช้งานแบตเตอรี่ VRLA`,
          equipmentId: ups.id,
          equipmentName: `${ups.name} (Bus ${ups.bus})`,
          locationText: `ชั้น 3 ห้อง UPS Room ${ups.bus === 'A' ? '#1' : '#2'}`,
          targetTab: 'ups',
          targetSubTab: ups.name,
          targetElementId: ups.id,
          timestamp: timeStr,
          recommendedAction: 'เฝ้าระวังเวลาสำรองไฟคงเหลือ (Backup Runtime) และยืนยันการเริ่มทำงานของเครื่องกำเนิดไฟฟ้า',
          isRecoverable: true,
          recoveryAction: 'toggle-ups',
        });
      } else if (ups.status === 'BYPASS') {
        alarms.push({
          id: `alm-${ups.id}-byp`,
          code: `ALM-${ups.name}-BYPASS`,
          severity: 'WARNING',
          title: `ตู้ ${ups.name} ทำงานในโหมด Bypass (Maintenance/Static Bypass Active)`,
          description: `โหลดกำลังรับไฟตรงจาก Bypass Line โดยไม่ผ่านวงจรอินเวอร์เตอร์/กรองคลื่น`,
          equipmentId: ups.id,
          equipmentName: `${ups.name} (Bus ${ups.bus})`,
          locationText: `ชั้น 3 ห้อง UPS Room ${ups.bus === 'A' ? '#1' : '#2'}`,
          targetTab: 'ups',
          targetSubTab: ups.name,
          targetElementId: ups.id,
          timestamp: timeStr,
          recommendedAction: 'รีเซ็ต Inverter ให้พร้อมกลับเข้าสู่สภาวะ Double Conversion Online ปกติ',
          isRecoverable: true,
          recoveryAction: 'toggle-ups',
        });
      }
    });
  }

  // 7. Battery Bank Alarms
  if (state.batteries) {
    Object.values(state.batteries).forEach((b) => {
      if (b.status === 'FAULT') {
        alarms.push({
          id: `alm-${b.id}`,
          code: `ALM-${b.name}-FAULT`,
          severity: 'CRITICAL',
          title: `ชุดแบตเตอรี่ ${b.name} ขัดข้อง (Cell Thermal/String Break)`,
          description: `แบตเตอรี่สตริง ${b.name} อุณหภูมิสูงเกินพิกัด (>35°C) หรือแรงดันตกผิดปกติ`,
          equipmentId: b.id,
          equipmentName: `${b.name} (VRLA 12V 40 Cells)`,
          locationText: `ชั้น 3 ห้อง Battery Room ${b.name.includes('A') ? '1..4' : '5..8'}`,
          targetTab: 'floor',
          targetSubTab: 'FIRE PROTECTION',
          targetElementId: b.id,
          timestamp: timeStr,
          recommendedAction: 'ตัดสวิตช์ Battery Breaker และตรวจสอบระบบปรับอากาศระบายความร้อนห้องแบตเตอรี่',
          isRecoverable: false,
        });
      } else if (b.status === 'DISCHARGE') {
        alarms.push({
          id: `alm-${b.id}-disch`,
          code: `ALM-${b.name}-DISCHARGE`,
          severity: 'MINOR',
          title: `แบตเตอรี่ ${b.name} กำลังคายประจุ (Discharging ~${Math.abs(b.currentAmps)}A)`,
          description: `ความจุคงเหลือ ${b.socPercent.toFixed(1)}% เวลาสำรองคงเหลือ ${b.backupMinutes.toFixed(1)} นาที`,
          equipmentId: b.id,
          equipmentName: `${b.name}`,
          locationText: `ชั้น 3 แถวตู้แบตเตอรี่ Battery Bank ${b.bus}`,
          targetTab: 'ups',
          targetElementId: b.id,
          timestamp: timeStr,
          recommendedAction: 'เฝ้าระวังแรงดันไฟ DC bus ไม่ให้ต่ำกว่า 420V',
          isRecoverable: false,
        });
      }
    });
  }

  // 8. Maintenance Required Alarms
  Object.values(state.mdbs).forEach((mdb) => {
    if (mdb.maintenanceRequired) {
      alarms.push({
        id: `alm-${mdb.id}-maint`,
        code: `ALM-${mdb.name}-MAINT`,
        severity: 'WARNING',
        title: `ตู้ ${mdb.name} ถึงกำหนดการบำรุงรักษา (Maintenance Required)`,
        description: `อุปกรณ์ ${mdb.name} ครบกำหนดรอบการบำรุงรักษาเชิงป้องกัน (Run time > 100 ชม.)`,
        equipmentId: mdb.id,
        equipmentName: mdb.name,
        locationText: 'ห้องไฟฟ้าหลัก Power Room',
        targetTab: 'maintenance',
        targetElementId: mdb.id,
        timestamp: timeStr,
        recommendedAction: 'กรุณาดำเนินการบำรุงรักษาในแท็บ MAINTENANCE',
        isRecoverable: true,
      });
    }
  });

  Object.values(state.upsUnits).forEach((ups) => {
    if (ups.maintenanceRequired) {
      alarms.push({
        id: `alm-${ups.id}-maint`,
        code: `ALM-${ups.name}-MAINT`,
        severity: 'WARNING',
        title: `ตู้ ${ups.name} ถึงกำหนดการบำรุงรักษา (Maintenance Required)`,
        description: `อุปกรณ์ ${ups.name} ครบกำหนดรอบการบำรุงรักษาเชิงป้องกัน (Run time > 100 ชม.)`,
        equipmentId: ups.id,
        equipmentName: ups.name,
        locationText: `ชั้น 3 ห้อง UPS Room ${ups.bus === 'A' ? '#1' : '#2'}`,
        targetTab: 'maintenance',
        targetElementId: ups.id,
        timestamp: timeStr,
        recommendedAction: 'กรุณาดำเนินการบำรุงรักษาในแท็บ MAINTENANCE',
        isRecoverable: true,
      });
    }
  });

  return alarms;
}

// ==========================================
// DATA CENTER UP-TIER SIMULATION ENGINE
// ==========================================

export type TierStandard = 'TIER_3' | 'TIER_4';

export interface UpTierPathStatus {
  name: string;
  bus: 'A' | 'B';
  hvFeed: 'PEA 22kV Line 1' | 'PEA 22kV Line 2' | 'GEN Feed';
  transformer: string;
  switchboard: string;
  upsSystem: string;
  pduCount: number;
  cracCount: number;
  isOnline: boolean;
  isIsolated: boolean;
  redundancyMode: 'N+1' | '2(N+1)' | 'DEGRADED_N';
}

export interface UpTierSimulationReport {
  timestamp: string;
  tierEvaluated: TierStandard;
  scenarioName: string;
  faultInjectedLocation: string;
  pathAffected: 'Line A' | 'Line B' | 'Both';
  // Engineering metrics
  concurrentMaintainabilityPass: boolean;
  faultTolerancePass: boolean;
  autonomousIsolationTimeMs: number;
  itLoadLossKw: number;
  itUptimePercentage: number;
  pueBefore: number;
  pueAfter: number;
  tierCertificationStatus: 'COMPLIANT' | 'FAIL' | 'WARNING';
  complianceDetails: string[];
  operationalLogs: string[];
  recommendation: string;
}

/**
 * Executes an Up-Tier fault injection drill comparing Tier III Concurrently Maintainable
 * with Tier IV Fault Tolerant 2(N+1) with autonomous compartment isolation.
 */
export function simulateUpTierDrill(
  currentTier: TierStandard,
  scenario: 'HV_FEED_LOSS' | 'MDB1A_SHORT_CIRCUIT' | 'CRAC_CHILLER_RUPTURE' | 'FIRE_ZONE_ISOLATION'
): UpTierSimulationReport {
  const timeStr = new Date().toLocaleTimeString('th-TH');

  if (scenario === 'HV_FEED_LOSS') {
    if (currentTier === 'TIER_3') {
      return {
        timestamp: timeStr,
        tierEvaluated: 'TIER_3',
        scenarioName: 'จำลองสายส่ง 22kV สายที่ 1 สูญเสียแรงดัน (HV Line 1 Loss)',
        faultInjectedLocation: 'PEA 22kV Substation Incomer 1A',
        pathAffected: 'Line A',
        concurrentMaintainabilityPass: true,
        faultTolerancePass: false,
        autonomousIsolationTimeMs: 1450, // slow ATS mechanical transfer
        itLoadLossKw: 0, // ride-through by UPS
        itUptimePercentage: 100.0,
        pueBefore: 1.35,
        pueAfter: 1.48,
        tierCertificationStatus: 'WARNING',
        complianceDetails: [
          'Tier III อนุญาตให้บำรุงรักษาโดยไม่ดับโหลด (Concurrently Maintainable)',
          'อย่างไรก็ตาม หากมีงานซ่อมบำรุงบนบัส B ขณะที่บัส A ดับ จะเกิดภาวะเสี่ยงหยุดชะงัก (N State)',
          'สวิตช์ ATS ต้องสั่ง Start Generator ใช้เวลา 8-12 วินาทีกว่าจะ Sync สมบูรณ์',
        ],
        operationalLogs: [
          `[${timeStr}] [INJECT] สัญญาณแรงดัน 22kV Line 1 หายไป`,
          `[${timeStr}] [TIER 3] ตู้ MDB1A สูญเสียไฟหลัก -> ATS1A ตรวจพบ Under-voltage`,
          `[${timeStr}] [TIER 3] สั่งสตาร์ต Emergency Generator GEN-1 (ใช้เวลาประเมิน 1.45 วินาที)`,
          `[${timeStr}] [STATUS] ความพร้อมของระบบลดลงเหลือ N (ไม่มี Redundancy สำรองระหว่างรอไฟ)`,
        ],
        recommendation: 'อัปเกรดเป็น Tier IV: เพิ่มระบบ 22kV Dual Ring Main Unit (RM6) แบบ Auto-Tie ตัดต่อฉับพลัน < 20ms',
      };
    } else {
      // TIER 4 Fault Tolerant
      return {
        timestamp: timeStr,
        tierEvaluated: 'TIER_4',
        scenarioName: 'จำลองสายส่ง 22kV สายที่ 1 สูญเสียแรงดัน (HV Line 1 Loss)',
        faultInjectedLocation: 'PEA 22kV Substation Incomer 1A',
        pathAffected: 'Line A',
        concurrentMaintainabilityPass: true,
        faultTolerancePass: true,
        autonomousIsolationTimeMs: 8, // Sub-cycle static bus transfer
        itLoadLossKw: 0,
        itUptimePercentage: 100.0,
        pueBefore: 1.32,
        pueAfter: 1.34,
        tierCertificationStatus: 'COMPLIANT',
        complianceDetails: [
          'Tier IV Fault Tolerant 2(N+1): ระบบแยกคู่ขนานโดยสมบูรณ์ (Physical & Compartmentalized Separation)',
          'บัส B จ่ายโหลดเซิร์ฟเวอร์แบบ Dual-Corded ทันทีโดยไม่ต้องรอ Generator',
          'Autonomous Fault Isolation: วงจรป้องกัน Microprocessor Relay สั่งปลด Breaker ภายใน 8ms',
          'ระดับความพร้อมใช้งานรองรับ Uptime 99.995% (Down-time ไม่เกิน 26.3 นาที/ปี)',
        ],
        operationalLogs: [
          `[${timeStr}] [INJECT] สัญญาณ 22kV Line 1 ขัดข้อง`,
          `[${timeStr}] [TIER 4] ระบบตรวจจับ Differential Protection สั่ง Trip Incomer 1A ภายใน 8ms`,
          `[${timeStr}] [TIER 4] โหลด IT ทั้งหมด 100% ยังคงทำงานปกติผ่าน Line B 2(N+1) Compartment`,
          `[${timeStr}] [STATUS] สถานะการทนทานต่อความผิดพร่อง (Fault Tolerance): ผ่านเกณฑ์สูงสุด`,
        ],
        recommendation: 'ระบบเป็นไปตามมาตรฐาน Uptime Institute Tier IV Fault Tolerant อย่างสมบูรณ์',
      };
    }
  }

  if (scenario === 'MDB1A_SHORT_CIRCUIT') {
    if (currentTier === 'TIER_3') {
      return {
        timestamp: timeStr,
        tierEvaluated: 'TIER_3',
        scenarioName: 'จำลองลัดวงจรบัสบาร์หลัก MDB1A (Main Busbar Arc-Flash Short)',
        faultInjectedLocation: 'ตู้สวิตช์บอร์ดประธาน MDB1A บัสบาร์ 3200A',
        pathAffected: 'Line A',
        concurrentMaintainabilityPass: true,
        faultTolerancePass: false,
        autonomousIsolationTimeMs: 250,
        itLoadLossKw: 0,
        itUptimePercentage: 100.0,
        pueBefore: 1.35,
        pueAfter: 1.52,
        tierCertificationStatus: 'WARNING',
        complianceDetails: [
          'Tier III สามารถทนทานได้เฉพาะกรณีมีแผนล่วงหน้า (Planned Maintenance)',
          'กรณีเกิด Unplanned Catastrophic Short Circuit: สวิตช์ ATS สายรองบางตัวอาจหน่วงเวลา',
          'ห้องควบคุมไฟฟ้ายังไม่มีกำแพงทนไฟแยกระหว่าง MDB1A และ MDB1B (Shared Room Risk)',
        ],
        operationalLogs: [
          `[${timeStr}] [INJECT] เกิดกระแสลัดวงจรขนาด 50kA บนบัสบาร์ MDB1A`,
          `[${timeStr}] [TRIP] ACB MDB1A ตัดวงจรฉับพลัน`,
          `[${timeStr}] [TIER 3] UPS-3A สลับไปใช้ไฟจากชุดแบตเตอรี่ฉุกเฉิน`,
          `[${timeStr}] [ALERT] กำลังไฟสำรองเหลือเส้นทางเดียว (Single Active Path Risk)`,
        ],
        recommendation: 'กั้นห้องทนไฟ (Compartmentalization Fire Barrier 2-Hour) ระหว่างชุดสวิตช์บอร์ดตาม Tier IV',
      };
    } else {
      return {
        timestamp: timeStr,
        tierEvaluated: 'TIER_4',
        scenarioName: 'จำลองลัดวงจรบัสบาร์หลัก MDB1A (Main Busbar Arc-Flash Short)',
        faultInjectedLocation: 'ตู้สวิตช์บอร์ดประธาน MDB1A บัสบาร์ 3200A',
        pathAffected: 'Line A',
        concurrentMaintainabilityPass: true,
        faultTolerancePass: true,
        autonomousIsolationTimeMs: 12,
        itLoadLossKw: 0,
        itUptimePercentage: 100.0,
        pueBefore: 1.32,
        pueAfter: 1.33,
        tierCertificationStatus: 'COMPLIANT',
        complianceDetails: [
          'Tier IV Compartmentalization: MDB1A อยู่ในห้อง Power Room A แยกอิสระจาก Power Room B โดยสิ้นเชิง',
          'ระบบ Arc-Flash Optical Protection สั่งตัดวงจรใน 12ms และป้องกันลุกลาม',
          'Line B และระบบระบายความร้อนฝั่ง B ยังคงทำงานเต็มพิกัด 2(N+1) ไม่กระทบต่อ White Space',
        ],
        operationalLogs: [
          `[${timeStr}] [INJECT] เกิด Arc Fault บนบัสบาร์ MDB1A`,
          `[${timeStr}] [TIER 4] Optical Arc Sensor ตรวจจับแสงวาบ ตัด ACB ใน 12ms`,
          `[${timeStr}] [TIER 4] ผนังทนไฟ 3 ชั่วโมงและประตูกันควันแยกโซนอัตโนมัติ`,
          `[${timeStr}] [STATUS] White Space IT Rack ได้รับไฟต่อเนื่อง 100% ผ่าน PDU Line B`,
        ],
        recommendation: 'การทดสอบจำลองผ่านเกณฑ์ Tier IV Fault Tolerance สมบูรณ์แบบ',
      };
    }
  }

  // CRAC_CHILLER_RUPTURE or FIRE_ZONE_ISOLATION
  return {
    timestamp: timeStr,
    tierEvaluated: currentTier,
    scenarioName: 'จำลองท่อน้ำเย็นระบบ CRAC รั่วซึมและแจ้งเตือนเพลิงไหม้ (Cooling Rupture & FAS)',
    faultInjectedLocation: 'CRAC PCU-04 / Battery Room 1 Preaction Zone',
    pathAffected: 'Line A',
    concurrentMaintainabilityPass: true,
    faultTolerancePass: currentTier === 'TIER_4',
    autonomousIsolationTimeMs: currentTier === 'TIER_4' ? 15 : 850,
    itLoadLossKw: 0,
    itUptimePercentage: 100.0,
    pueBefore: 1.34,
    pueAfter: currentTier === 'TIER_4' ? 1.36 : 1.55,
    tierCertificationStatus: currentTier === 'TIER_4' ? 'COMPLIANT' : 'WARNING',
    complianceDetails: [
      currentTier === 'TIER_4'
        ? 'Tier IV รองรับการฉีดแก๊ส N2 แยกห้องโดยไม่ตัดไฟตู้ UPS ฝั่งตรงข้าม'
        : 'Tier III ต้องอาศัย Manual Valve Isolation จากเจ้าหน้าที่ควบคุม',
    ],
    operationalLogs: [
      `[${timeStr}] [ALERT] เซ็นเซอร์ Water Leakage ตรวจพบน้ำใต้พื้นยก Data Hall โซน A`,
      `[${timeStr}] [ISOLATION] วาล์วไฟฟ้า Motorized Valve สั่งปิดท่อน้ำวนวงจร A ภายใน ${currentTier === 'TIER_4' ? '15ms' : '1.2s'}`,
      `[${timeStr}] [COOLING] PCU ฝั่ง B เร่งรอบพัดลม EC Fan ชดเชยอุณหภูมิห้องให้อยู่ที่ 22.5°C คงที่`,
    ],
    recommendation: 'คงสถานะ Dual-path Continuous Cooling ตามเกณฑ์ Tier IV Uptime Institute',
  };
}

// ---------------------------------------------------------------------------
// MAINTENANCE WORK ORDERS & SLA LIFECYCLE MANAGEMENT
// ---------------------------------------------------------------------------

export type JobPriority = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_ROUTINE';
export type JobStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';
export type JobType = 'PREVENTIVE_PM' | 'CORRECTIVE_CM' | 'EMERGENCY_SOP';

export interface MaintenanceJob {
  id: string; // e.g. WO-2026-101
  title: string;
  equipmentId: string;
  equipmentName: string;
  jobType: JobType;
  priority: JobPriority;
  status: JobStatus;
  description: string;
  assignedTo: string;
  createdAt: string;
  createdTimestamp: number;
  responseSlaMinutes: number; // P1: 15m, P2: 30m, P3: 120m, P4: 240m
  resolutionSlaHours: number; // P1: 2h, P2: 4h, P3: 8h, P4: 24h
  acknowledgedAt: string | null;
  acknowledgedTimestamp: number | null;
  acknowledgedBy: string | null;
  responseSlaStatus: 'MET' | 'BREACHED' | 'PENDING';
  resolvedAt: string | null;
  resolvedTimestamp: number | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
  partsReplaced: string | null;
  resolutionSlaStatus: 'MET' | 'BREACHED' | 'PENDING';
  actualDowntimeMinutes: number;
  mttrMinutes: number;
}

export const SLA_TARGETS: Record<JobPriority, { responseMinutes: number; resolutionHours: number; label: string }> = {
  P1_CRITICAL: { responseMinutes: 15, resolutionHours: 2, label: 'P1 - Critical Outage (SLA: 15m Resp / 2h Fix)' },
  P2_HIGH: { responseMinutes: 30, resolutionHours: 4, label: 'P2 - Major Redundancy Loss (SLA: 30m Resp / 4h Fix)' },
  P3_MEDIUM: { responseMinutes: 120, resolutionHours: 8, label: 'P3 - Minor Anomaly (SLA: 2h Resp / 8h Fix)' },
  P4_ROUTINE: { responseMinutes: 240, resolutionHours: 24, label: 'P4 - Preventive PM (SLA: 4h Resp / 24h Fix)' },
};

export const INITIAL_MAINTENANCE_JOBS: MaintenanceJob[] = [
  {
    id: 'WO-2026-101',
    title: 'แก้ไขบัสบาร์ MDB-1A ทริปและสั่งสับ Tie-Breaker สำรอง',
    equipmentId: 'mdb-1a',
    equipmentName: 'MDB1A (Main Busbar A)',
    jobType: 'EMERGENCY_SOP',
    priority: 'P1_CRITICAL',
    status: 'RESOLVED',
    description: 'ตรวจพบ Undervoltage Trip บน ACB-MDB1A ได้สั่งสับ Tie-Breaker เชื่อมบัส B และกู้คืนแหล่งจ่ายไฟ',
    assignedTo: 'สมชาย ชัยชนะ (Senior EE Engineer)',
    createdAt: '11/03/2026 08:30:00',
    createdTimestamp: Date.now() - 3600000 * 4,
    responseSlaMinutes: 15,
    resolutionSlaHours: 2,
    acknowledgedAt: '11/03/2026 08:38:12',
    acknowledgedTimestamp: Date.now() - 3600000 * 4 + 492000,
    acknowledgedBy: 'สมชาย ชัยชนะ',
    responseSlaStatus: 'MET',
    resolvedAt: '11/03/2026 09:42:00',
    resolvedTimestamp: Date.now() - 3600000 * 3,
    resolvedBy: 'สมชาย ชัยชนะ',
    resolutionNotes: 'ตรวจสอบค่า Insulation Resistance เมกะโอห์ม > 100MΩ รีเซ็ต Micrologic Trip Unit และปลด Tie-Breaker คืนระบบปกติ',
    partsReplaced: 'Micrologic 6.0X Auxiliary Contact Block',
    resolutionSlaStatus: 'MET',
    actualDowntimeMinutes: 0,
    mttrMinutes: 72,
  },
  {
    id: 'WO-2026-102',
    title: 'เปลี่ยนถ่ายคาปาซิเตอร์ DC Bus Filter และพัดลมระบายความร้อน UPS-3A1',
    equipmentId: 'ups-3a1',
    equipmentName: 'UPS-3A1 (Data Hall 3 Bus A)',
    jobType: 'CORRECTIVE_CM',
    priority: 'P2_HIGH',
    status: 'IN_PROGRESS',
    description: 'พัดลมระบายความร้อนตัวที่ 3 ส่งสัญญาณ RPM Warning และค่า ESR คาปาซิเตอร์สูงขึ้นตามเกณฑ์ชั่วโมงสะสม',
    assignedTo: 'ธนกฤต วิศวกรรม (Lead Data Center Tech)',
    createdAt: '11/03/2026 10:15:00',
    createdTimestamp: Date.now() - 3600000 * 2,
    responseSlaMinutes: 30,
    resolutionSlaHours: 4,
    acknowledgedAt: '11/03/2026 10:28:45',
    acknowledgedTimestamp: Date.now() - 3600000 * 2 + 825000,
    acknowledgedBy: 'ธนกฤต วิศวกรรม',
    responseSlaStatus: 'MET',
    resolvedAt: null,
    resolvedTimestamp: null,
    resolvedBy: null,
    resolutionNotes: null,
    partsReplaced: null,
    resolutionSlaStatus: 'PENDING',
    actualDowntimeMinutes: 0,
    mttrMinutes: 0,
  },
  {
    id: 'WO-2026-103',
    title: 'ทดสอบการสตาร์ทฉุกเฉินและโหลดเทสต์เครื่องกำเนิดไฟฟ้า GEN-1 ประจำเดือน',
    equipmentId: 'gen-1',
    equipmentName: 'Emergency Generator GEN-1 (2000kVA)',
    jobType: 'PREVENTIVE_PM',
    priority: 'P3_MEDIUM',
    status: 'ACKNOWLEDGED',
    description: 'ทดสอบ Full Load Bank Test 80% พิกัด 60 นาที ตรวจเช็กแบตเตอรี่สตาร์ท 24VDC และแรงดันน้ำมันเชื้อเพลิง',
    assignedTo: 'วิรัช ช่างยนต์ (Diesel Gen Specialist)',
    createdAt: '11/03/2026 11:00:00',
    createdTimestamp: Date.now() - 3600000 * 1,
    responseSlaMinutes: 120,
    resolutionSlaHours: 8,
    acknowledgedAt: '11/03/2026 11:22:10',
    acknowledgedTimestamp: Date.now() - 3600000 * 1 + 1330000,
    acknowledgedBy: 'วิรัช ช่างยนต์',
    responseSlaStatus: 'MET',
    resolvedAt: null,
    resolvedTimestamp: null,
    resolvedBy: null,
    resolutionNotes: null,
    partsReplaced: null,
    resolutionSlaStatus: 'PENDING',
    actualDowntimeMinutes: 0,
    mttrMinutes: 0,
  },
  {
    id: 'WO-2026-104',
    title: 'สแกนความร้อนบัสบาร์และสายส่งหม้อแปลง TR-1 / TR-2 (Thermal Scan)',
    equipmentId: 'tr-1',
    equipmentName: 'Transformer TR-1 (2500kVA Dyn11)',
    jobType: 'PREVENTIVE_PM',
    priority: 'P4_ROUTINE',
    status: 'OPEN',
    description: 'ตรวจสอบจุดต่อขั้วสายแรงต่ำ 400V และบุชชิ่งแรงสูง 22kV ด้วยกล้อง Infrared ไม่ให้ความร้อนสูงเกิน 65°C',
    assignedTo: 'ยังไม่ได้มอบหมาย (Unassigned)',
    createdAt: '11/03/2026 11:45:00',
    createdTimestamp: Date.now() - 1800000,
    responseSlaMinutes: 240,
    resolutionSlaHours: 24,
    acknowledgedAt: null,
    acknowledgedTimestamp: null,
    acknowledgedBy: null,
    responseSlaStatus: 'PENDING',
    resolvedAt: null,
    resolvedTimestamp: null,
    resolvedBy: null,
    resolutionNotes: null,
    partsReplaced: null,
    resolutionSlaStatus: 'PENDING',
    actualDowntimeMinutes: 0,
    mttrMinutes: 0,
  },
];

export function openMaintenanceJob(
  jobs: MaintenanceJob[],
  params: {
    title: string;
    equipmentId: string;
    equipmentName: string;
    jobType: JobType;
    priority: JobPriority;
    description: string;
    assignedTo?: string;
  }
): MaintenanceJob[] {
  const newNum = jobs.length + 101;
  const target = SLA_TARGETS[params.priority];
  const now = new Date();
  const timeStr = `${now.toLocaleDateString('th-TH')} ${now.toLocaleTimeString('th-TH')}`;

  const newJob: MaintenanceJob = {
    id: `WO-2026-${newNum}`,
    title: params.title,
    equipmentId: params.equipmentId,
    equipmentName: params.equipmentName,
    jobType: params.jobType,
    priority: params.priority,
    status: 'OPEN',
    description: params.description,
    assignedTo: params.assignedTo || 'Unassigned',
    createdAt: timeStr,
    createdTimestamp: Date.now(),
    responseSlaMinutes: target.responseMinutes,
    resolutionSlaHours: target.resolutionHours,
    acknowledgedAt: null,
    acknowledgedTimestamp: null,
    acknowledgedBy: null,
    responseSlaStatus: 'PENDING',
    resolvedAt: null,
    resolvedTimestamp: null,
    resolvedBy: null,
    resolutionNotes: null,
    partsReplaced: null,
    resolutionSlaStatus: 'PENDING',
    actualDowntimeMinutes: 0,
    mttrMinutes: 0,
  };

  return [newJob, ...jobs];
}

export function acknowledgeMaintenanceJob(
  jobs: MaintenanceJob[],
  jobId: string,
  acknowledgedBy: string
): MaintenanceJob[] {
  const now = new Date();
  const nowTs = Date.now();
  const timeStr = `${now.toLocaleDateString('th-TH')} ${now.toLocaleTimeString('th-TH')}`;

  return jobs.map((j) => {
    if (j.id !== jobId) return j;
    const elapsedMinutes = (nowTs - j.createdTimestamp) / 60000;
    const responseSlaStatus = elapsedMinutes <= j.responseSlaMinutes ? 'MET' : 'BREACHED';

    return {
      ...j,
      status: 'IN_PROGRESS',
      acknowledgedAt: timeStr,
      acknowledgedTimestamp: nowTs,
      acknowledgedBy,
      assignedTo: acknowledgedBy,
      responseSlaStatus,
    };
  });
}

export function resolveMaintenanceJob(
  jobs: MaintenanceJob[],
  jobId: string,
  params: {
    resolvedBy: string;
    resolutionNotes: string;
    partsReplaced?: string;
    actualDowntimeMinutes?: number;
  }
): MaintenanceJob[] {
  const now = new Date();
  const nowTs = Date.now();
  const timeStr = `${now.toLocaleDateString('th-TH')} ${now.toLocaleTimeString('th-TH')}`;

  return jobs.map((j) => {
    if (j.id !== jobId) return j;
    const totalMinutes = Math.max(1, Math.round((nowTs - j.createdTimestamp) / 60000));
    const resolutionSlaMinutes = j.resolutionSlaHours * 60;
    const resolutionSlaStatus = totalMinutes <= resolutionSlaMinutes ? 'MET' : 'BREACHED';

    return {
      ...j,
      status: 'RESOLVED',
      resolvedAt: timeStr,
      resolvedTimestamp: nowTs,
      resolvedBy: params.resolvedBy,
      resolutionNotes: params.resolutionNotes,
      partsReplaced: params.partsReplaced || 'None',
      resolutionSlaStatus,
      actualDowntimeMinutes: params.actualDowntimeMinutes || 0,
      mttrMinutes: totalMinutes,
    };
  });
}

export function generateMaintenanceJobsCsv(jobs: MaintenanceJob[]): string {
  const headers = [
    'Work Order ID',
    'Equipment ID',
    'Equipment Name',
    'Job Title',
    'Job Type',
    'Priority',
    'Status',
    'Assigned Engineer',
    'Created At',
    'SLA Response Target (Min)',
    'Acknowledged At',
    'Acknowledged By',
    'Response SLA Status',
    'SLA Resolution Target (Hrs)',
    'Resolved At',
    'Resolved By',
    'Resolution SLA Status',
    'MTTR (Minutes)',
    'Downtime (Minutes)',
    'Parts Replaced',
    'Resolution Notes',
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = jobs.map((j) => [
    escapeCsv(j.id),
    escapeCsv(j.equipmentId),
    escapeCsv(j.equipmentName),
    escapeCsv(j.title),
    escapeCsv(j.jobType),
    escapeCsv(j.priority),
    escapeCsv(j.status),
    escapeCsv(j.assignedTo),
    escapeCsv(j.createdAt),
    escapeCsv(j.responseSlaMinutes),
    escapeCsv(j.acknowledgedAt || 'N/A'),
    escapeCsv(j.acknowledgedBy || 'N/A'),
    escapeCsv(j.responseSlaStatus),
    escapeCsv(j.resolutionSlaHours),
    escapeCsv(j.resolvedAt || 'N/A'),
    escapeCsv(j.resolvedBy || 'N/A'),
    escapeCsv(j.resolutionSlaStatus),
    escapeCsv(j.mttrMinutes),
    escapeCsv(j.actualDowntimeMinutes),
    escapeCsv(j.partsReplaced || 'N/A'),
    escapeCsv(j.resolutionNotes || 'N/A'),
  ]);

  // Include UTF-8 BOM \uFEFF for seamless Thai character rendering in Google Sheets & MS Excel
  return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

export function generateGoogleSheetsClipboardTsv(jobs: MaintenanceJob[]): string {
  const headers = [
    'WO ID\tEquipment\tTitle\tPriority\tStatus\tAssignee\tCreated\tResp SLA (Min)\tAck By\tResp SLA\tResol SLA (Hr)\tResol SLA\tMTTR (m)\tDowntime (m)\tResolution Notes',
  ];

  const rows = jobs.map((j) =>
    [
      j.id,
      j.equipmentName,
      j.title,
      j.priority,
      j.status,
      j.assignedTo,
      j.createdAt,
      j.responseSlaMinutes,
      j.acknowledgedBy || '-',
      j.responseSlaStatus,
      j.resolutionSlaHours,
      j.resolutionSlaStatus,
      j.mttrMinutes,
      j.actualDowntimeMinutes,
      j.resolutionNotes || '-',
    ].join('\t')
  );

  return [headers, ...rows].join('\n');
}

// ---------------------------------------------------------------------------
// DATA CENTER TIER STANDARDS & DOWNTIME TOLERANCES
// ---------------------------------------------------------------------------

export interface TierDowntimeStandard {
  tier: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';
  title: string;
  uptimePct: number;
  maxDowntimeHoursYear: number;
  maxDowntimeMinutesYear: number;
  maxTransferInterruptionSec: number;
  itLoadLossToleranceMs: number;
  topology: string;
  concurrentMaintainability: boolean;
  faultTolerance: boolean;
  slaBreachThresholdSec: number;
}

export const TIER_STANDARDS: Record<string, TierDowntimeStandard> = {
  TIER_1: {
    tier: 'TIER_1',
    title: 'Tier I - Basic Capacity',
    uptimePct: 99.671,
    maxDowntimeHoursYear: 28.8,
    maxDowntimeMinutesYear: 1728,
    maxTransferInterruptionSec: 60.0,
    itLoadLossToleranceMs: 20,
    topology: 'Single path (N), non-redundant, manual transfer',
    concurrentMaintainability: false,
    faultTolerance: false,
    slaBreachThresholdSec: 60,
  },
  TIER_2: {
    tier: 'TIER_2',
    title: 'Tier II - Redundant Capacity Components',
    uptimePct: 99.741,
    maxDowntimeHoursYear: 22.0,
    maxDowntimeMinutesYear: 1320,
    maxTransferInterruptionSec: 20.0,
    itLoadLossToleranceMs: 20,
    topology: 'Single path with redundant components (N+1)',
    concurrentMaintainability: false,
    faultTolerance: false,
    slaBreachThresholdSec: 20,
  },
  TIER_3: {
    tier: 'TIER_3',
    title: 'Tier III - Concurrently Maintainable',
    uptimePct: 99.982,
    maxDowntimeHoursYear: 1.6,
    maxDowntimeMinutesYear: 96,
    maxTransferInterruptionSec: 10.0,
    itLoadLossToleranceMs: 0,
    topology: 'Dual paths (Active/Passive), concurrent maintainability',
    concurrentMaintainability: true,
    faultTolerance: false,
    slaBreachThresholdSec: 10,
  },
  TIER_4: {
    tier: 'TIER_4',
    title: 'Tier IV - Fault Tolerant',
    uptimePct: 99.995,
    maxDowntimeHoursYear: 0.44,
    maxDowntimeMinutesYear: 26.3,
    maxTransferInterruptionSec: 0.0,
    itLoadLossToleranceMs: 0,
    topology: 'Dual autonomous paths (Active/Active 2(N+1)), 0ms continuous feed',
    concurrentMaintainability: true,
    faultTolerance: true,
    slaBreachThresholdSec: 0.02, // 20ms PSU hold-up time
  },
};

// ---------------------------------------------------------------------------
// REMEDIATION SOLUTIONS MATRIX FOR DOWNTIME EXCEEDING SLA
// ---------------------------------------------------------------------------

export interface RemediationSolutionItem {
  id: string;
  name: string;
  nameTh: string;
  category: 'BUS_TIE' | 'BYPASS' | 'LOAD_SHED' | 'MOBILE_POWER' | 'GRID_RESTORE';
  applicableWhen: string;
  estimatedMttrMinutes: number;
  downtimeSavedMinutes: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  sopSteps: string[];
}

export const REMEDIATION_SOLUTIONS: RemediationSolutionItem[] = [
  {
    id: 'sol-tie-breaker',
    name: 'Emergency Bus-Tie Interlock Override',
    nameTh: 'สับสวิตช์ Tie-Breaker ข้ามบัสบาร์ฉุกเฉิน (TIE-MDB)',
    category: 'BUS_TIE',
    applicableWhen: 'เมื่อ MDB1A ทริป หรือหม้อแปลง TR-1 ขัดข้องเกิน 5 วินาที โดยที่ MDB1B ยังมีไฟสมบูรณ์',
    estimatedMttrMinutes: 1,
    downtimeSavedMinutes: 119,
    riskLevel: 'LOW',
    sopSteps: [
      '1. ยืนยันว่า ACB หลัก MDB1A ปลดวงจรแล้ว (Interlock Check)',
      '2. สั่งปิดวงจรเบรกเกอร์ TIE-MDB (Close Tie Breaker) เพื่อจ่ายไฟจากบัส B ข้ามไปยังบัส A',
      '3. ตรวจสอบกระแสโหลดรวมบนบัส B ไม่ให้เกิน 2800A พิกัดหม้อแปลง TR-2',
      '4. ยืนยันแรงดันไฟขาเข้าตู้ UPS-3A1 และ UPS-3A2 กลับคืนสู่สภาวะปกติ 380V',
    ],
  },
  {
    id: 'sol-static-bypass',
    name: 'Force Static Bypass Thyristor Engagement',
    nameTh: 'บังคับสับระบบ Static Bypass ข้าม Inverter ของตู้ UPS',
    category: 'BYPASS',
    applicableWhen: 'เมื่ออินเวอร์เตอร์ UPS ล็อคความผิดพลาด (Inverter SCR Fault) หรือ Overload > 125%',
    estimatedMttrMinutes: 0.1,
    downtimeSavedMinutes: 180,
    riskLevel: 'LOW',
    sopSteps: [
      '1. สั่งเปิดสัญญาณไทริสเตอร์สวิตช์ Static Bypass Switch (STS < 2ms)',
      '2. จ่ายไฟดิบสะอาดจากหม้อแปลงหรือเครื่องกำเนิดตรงสู่ตู้ UMDB',
      '3. ปลด Inverter Module ที่มีปัญหาเพื่อเข้าสู่โหมด Service Isolation',
      '4. ดำเนินการเปิด Job งานประเภท CM เพื่อเปลี่ยนการ์ด SCR / Driver Board',
    ],
  },
  {
    id: 'sol-load-shedding',
    name: '2-Stage Emergency Load Shedding Protocol',
    nameTh: 'ระบบตัดโหลดอัตโนมัติ 2 ลำดับขั้น (Chiller & Non-Critical Load Shedding)',
    category: 'LOAD_SHED',
    applicableWhen: 'เมื่อไฟฟ้าดับเป็นเวลานานเกิน SLA และเครื่องกำเนิดไฟฟ้าสตาร์ทไม่ติด หรือแบตเตอรี่เหลือ < 30%',
    estimatedMttrMinutes: 0.5,
    downtimeSavedMinutes: 45,
    riskLevel: 'MEDIUM',
    sopSteps: [
      '1. ขั้นที่ 1: ตัดโหลดระบบปรับอากาศชิลเลอร์ชุดที่ 2 และพัดลมระบายอากาศสำรอง (ลดโหลด 45%)',
      '2. ขั้นที่ 2: ตัดโหลดระบบแสงสว่างส่วนกลางและปลั๊กไฟสำนักงาน (คงไว้เฉพาะ Data Hall Racks)',
      '3. ยืดระยะเวลาการสำรองไฟของแบตเตอรี่ VRLA จาก 14 นาที เป็น 65 นาที เพื่อรอการแก้ไขเครื่องกำเนิด',
    ],
  },
  {
    id: 'sol-mobile-drpus',
    name: 'Deploy Standby Mobile Genset / Tie-In Cable Box',
    nameTh: 'เชื่อมต่อและจ่ายไฟจากเครื่องกำเนิดไฟฟ้าเคลื่อนที่ภายนอก (Mobile Genset)',
    category: 'MOBILE_POWER',
    applicableWhen: 'เมื่อ GEN-1 สตาร์ทล้มเหลว (Overcrank Fault) และการไฟฟ้าดับเกิน 15 นาที',
    estimatedMttrMinutes: 15,
    downtimeSavedMinutes: 360,
    riskLevel: 'MEDIUM',
    sopSteps: [
      '1. เคลื่อนย้ายตู้คอนเทนเนอร์ Mobile Genset 800kVA เข้าเทียบ Quick-Connect Docking Box',
      '2. ล็อคขั้วต่อ Cam-Lock 3 Phase + Neutral + Ground ตามรหัสสี',
      '3. ซิงโครไนซ์ความถี่และเฟส 50Hz / 400V ก่อนสับเบรกเกอร์รับไฟภายนอก',
      '4. สับ ATS2 เข้าสู่แหล่งจ่ายสำรองเคลื่อนที่',
    ],
  },
  {
    id: 'sol-grid-restore',
    name: 'Black-Start Grid Recovery & Normalization',
    nameTh: 'รีเซ็ตระบบและคืนสถานะสู่สายส่งปกติ (PEA 22kV Full Recovery)',
    category: 'GRID_RESTORE',
    applicableWhen: 'เมื่อสายส่งการไฟฟ้ากลับมาเสถียรต่อเนื่องเกิน 180 วินาที',
    estimatedMttrMinutes: 2,
    downtimeSavedMinutes: 0,
    riskLevel: 'LOW',
    sopSteps: [
      '1. ตรวจสอบแรงดันสายส่ง PEA 22kV คงที่ ±2.5% และความถี่ 50.0Hz',
      '2. สั่ง ATS ย้ายโหลดกลับสู่สายส่งการไฟฟ้าหลักแบบ Closed-Transition (Make-before-break)',
      '3. รันคูลดาวน์เครื่องกำเนิดไฟฟ้า GEN-1 5 นาทีก่อนดับเครื่อง',
      '4. ปลด Tie-Breaker คืนระบบสู่สถาปัตยกรรม Tier IV 2(N+1) แยกอิสระสมบูรณ์',
    ],
  },
];



