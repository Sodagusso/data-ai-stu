/**
 * SILA1 Electrical System Simulator - Alarm Export Service (Excel & SQL)
 */

import * as XLSX from 'xlsx';
import type { HistoricalAlarmRecord, AlarmPriority } from './alarmStorage';

export type SqlDialect = 'PostgreSQL' | 'MySQL' | 'SQLServer' | 'SQLite';

export interface SqlExportOptions {
  dialect: SqlDialect;
  includeDdl: boolean; // CREATE TABLE / INDEX
  includeBatchInserts: boolean;
  tableName: string;
}

/**
 * Trigger client-side file download of Blob
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate formatted Excel (.xlsx) file with multiple sheets:
 * 1. Alarm_Logs
 * 2. Priority_Summary
 * 3. SCADA_System_Info
 */
export function exportAlarmsToExcel(
  records: HistoricalAlarmRecord[],
  priorityFilter: AlarmPriority | 'ALL' = 'ALL',
  systemContext?: { totalKw: number; voltage: number; frequency: number }
): void {
  const wb = XLSX.utils.book_new();

  // 1. Alarm_Logs Sheet
  const logRows = records.map((r, index) => ({
    'No.': index + 1,
    'Alarm ID': r.id,
    'Alarm Code': r.code,
    'Priority Level': r.priority,
    'Equipment / Tag': r.deviceTag,
    'Subsystem': r.subsystem,
    'Status': r.status,
    'Timestamp (Event)': r.eventTime,
    'Resolved Time': r.resolvedTime || '-',
    'Duration (s)': r.durationSec !== undefined ? r.durationSec : (r.status === 'ACTIVE' ? 'Active' : '-'),
    'Trigger Value': r.triggerValue,
    'Threshold Limit': r.threshold,
    'Description (TH)': r.messageTh,
    'Description (EN)': r.messageEn,
    'Acknowledged By': r.acknowledgedBy || 'Unacknowledged',
  }));

  const wsLogs = XLSX.utils.json_to_sheet(logRows);

  // Set column widths for clean readability in Excel
  wsLogs['!cols'] = [
    { wch: 6 },  // No.
    { wch: 16 }, // Alarm ID
    { wch: 20 }, // Alarm Code
    { wch: 14 }, // Priority Level
    { wch: 16 }, // Equipment Tag
    { wch: 24 }, // Subsystem
    { wch: 14 }, // Status
    { wch: 24 }, // Timestamp
    { wch: 24 }, // Resolved Time
    { wch: 12 }, // Duration
    { wch: 16 }, // Trigger Value
    { wch: 16 }, // Threshold
    { wch: 45 }, // Description TH
    { wch: 45 }, // Description EN
    { wch: 22 }, // Acknowledged By
  ];

  XLSX.utils.book_append_sheet(wb, wsLogs, 'Alarm_Logs');

  // 2. Priority_Summary Sheet (Pivot Breakdown)
  const priorityList: AlarmPriority[] = ['CRITICAL', 'MAJOR', 'MINOR', 'WARNING', 'INFO'];
  const total = records.length;

  const summaryRows = priorityList.map((pri) => {
    const list = records.filter((r) => r.priority === pri);
    const active = list.filter((r) => r.status === 'ACTIVE').length;
    const acked = list.filter((r) => r.status === 'ACKNOWLEDGED').length;
    const resolved = list.filter((r) => r.status === 'RESOLVED').length;
    const count = list.length;
    const pct = total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0%';

    return {
      'Priority Level': pri,
      'Total Count': count,
      'Active Now': active,
      'Acknowledged': acked,
      'Resolved': resolved,
      'Percentage (%)': pct,
    };
  });

  // Total summary row
  summaryRows.push({
    'Priority Level': 'TOTAL ALL' as any,
    'Total Count': total,
    'Active Now': records.filter((r) => r.status === 'ACTIVE').length,
    'Acknowledged': records.filter((r) => r.status === 'ACKNOWLEDGED').length,
    'Resolved': records.filter((r) => r.status === 'RESOLVED').length,
    'Percentage (%)': '100%',
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Priority_Summary');

  // 3. System Plant Metadata Sheet
  const now = new Date();
  const sysRows = [
    { 'Parameter': 'Plant Facility Name', 'Value': 'SILA1 Tier III / Tier IV Data Center' },
    { 'Parameter': 'SCADA Supervisory Host', 'Value': 'FXL Fa x Lite Power Control Terminal' },
    { 'Parameter': 'Export Timestamp', 'Value': now.toISOString() },
    { 'Parameter': 'Export Priority Scope', 'Value': priorityFilter },
    { 'Parameter': 'Total Logged Alarms in Batch', 'Value': records.length.toString() },
    { 'Parameter': 'Active Alarms at Export', 'Value': records.filter(r => r.status === 'ACTIVE').length.toString() },
    { 'Parameter': 'Current System Real Power (kW)', 'Value': (systemContext?.totalKw ?? 0).toString() + ' kW' },
    { 'Parameter': 'System Bus Voltage (V)', 'Value': (systemContext?.voltage ?? 380).toString() + ' V' },
    { 'Parameter': 'System Frequency (Hz)', 'Value': (systemContext?.frequency ?? 50.0).toString() + ' Hz' },
    { 'Parameter': 'Exported By', 'Value': 'Operator (Live SCADA Console)' },
  ];
  const wsSys = XLSX.utils.json_to_sheet(sysRows);
  wsSys['!cols'] = [{ wch: 32 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsSys, 'SCADA_Metadata');

  // Write file
  const pad = (n: number) => n.toString().padStart(2, '0');
  const fileDateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const filename = `SILA1_SCADA_Alarms_${priorityFilter}_${fileDateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}

/**
 * Export Alarms as CSV with UTF-8 BOM so Excel opens Thai language properly without encoding issues
 */
export function exportAlarmsToCsv(
  records: HistoricalAlarmRecord[],
  priorityFilter: AlarmPriority | 'ALL' = 'ALL'
): void {
  const headers = [
    'Alarm_ID',
    'Alarm_Code',
    'Priority',
    'Device_Tag',
    'Subsystem',
    'Status',
    'Event_Time',
    'Resolved_Time',
    'Duration_Sec',
    'Trigger_Value',
    'Threshold',
    'Message_TH',
    'Message_EN',
    'Acknowledged_By',
  ];

  const escapeCsv = (str: string | undefined | null) => {
    if (str === undefined || str === null) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = records.map((r) => [
    escapeCsv(r.id),
    escapeCsv(r.code),
    escapeCsv(r.priority),
    escapeCsv(r.deviceTag),
    escapeCsv(r.subsystem),
    escapeCsv(r.status),
    escapeCsv(r.eventTime),
    escapeCsv(r.resolvedTime || ''),
    escapeCsv(r.durationSec !== undefined ? r.durationSec.toString() : ''),
    escapeCsv(r.triggerValue),
    escapeCsv(r.threshold),
    escapeCsv(r.messageTh),
    escapeCsv(r.messageEn),
    escapeCsv(r.acknowledgedBy || ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  // UTF-8 BOM for perfect Excel compatibility with Thai characters
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const fileDateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const filename = `SILA1_SCADA_Alarms_${priorityFilter}_${fileDateStr}.csv`;

  downloadBlob(blob, filename);
}

/**
 * Generate production-grade SQL script (DDL + DML) matching chosen SQL dialect
 */
export function generateSqlScript(
  records: HistoricalAlarmRecord[],
  options: SqlExportOptions
): string {
  const { dialect, includeDdl, tableName } = options;
  const nowStr = new Date().toISOString();

  let sql = `-- =====================================================================\n`;
  sql += `-- SILA1 Electrical SCADA Alarm Logs Export\n`;
  sql += `-- Dialect: ${dialect}\n`;
  sql += `-- Target Table: ${tableName}\n`;
  sql += `-- Exported Records: ${records.length}\n`;
  sql += `-- Generated At: ${nowStr}\n`;
  sql += `-- Facility: SILA1 Tier III/IV Enterprise Electrical Substation & Data Center\n`;
  sql += `-- =====================================================================\n\n`;

  // DDL (CREATE TABLE & INDEXES)
  if (includeDdl) {
    if (dialect === 'PostgreSQL') {
      sql += `-- PostgreSQL Schema Definition\n`;
      sql += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
      sql += `    id VARCHAR(32) PRIMARY KEY,\n`;
      sql += `    code VARCHAR(64) NOT NULL,\n`;
      sql += `    priority VARCHAR(16) NOT NULL,\n`;
      sql += `    device_tag VARCHAR(64) NOT NULL,\n`;
      sql += `    subsystem VARCHAR(128) NOT NULL,\n`;
      sql += `    message_th TEXT NOT NULL,\n`;
      sql += `    message_en TEXT NOT NULL,\n`;
      sql += `    trigger_value VARCHAR(64),\n`;
      sql += `    threshold VARCHAR(64),\n`;
      sql += `    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',\n`;
      sql += `    event_time TIMESTAMP NOT NULL,\n`;
      sql += `    resolved_time TIMESTAMP,\n`;
      sql += `    duration_sec INT,\n`;
      sql += `    acknowledged_by VARCHAR(64),\n`;
      sql += `    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n`;
      sql += `);\n\n`;
      sql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_priority ON ${tableName}(priority);\n`;
      sql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_event_time ON ${tableName}(event_time);\n`;
      sql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_device_tag ON ${tableName}(device_tag);\n`;
      sql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_status ON ${tableName}(status);\n\n`;
    } else if (dialect === 'MySQL') {
      sql += `-- MySQL / MariaDB Schema Definition\n`;
      sql += `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n`;
      sql += `    \`id\` VARCHAR(32) NOT NULL PRIMARY KEY,\n`;
      sql += `    \`code\` VARCHAR(64) NOT NULL,\n`;
      sql += `    \`priority\` VARCHAR(16) NOT NULL,\n`;
      sql += `    \`device_tag\` VARCHAR(64) NOT NULL,\n`;
      sql += `    \`subsystem\` VARCHAR(128) NOT NULL,\n`;
      sql += `    \`message_th\` TEXT NOT NULL,\n`;
      sql += `    \`message_en\` TEXT NOT NULL,\n`;
      sql += `    \`trigger_value\` VARCHAR(64),\n`;
      sql += `    \`threshold\` VARCHAR(64),\n`;
      sql += `    \`status\` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',\n`;
      sql += `    \`event_time\` DATETIME(3) NOT NULL,\n`;
      sql += `    \`resolved_time\` DATETIME(3) NULL,\n`;
      sql += `    \`duration_sec\` INT NULL,\n`;
      sql += `    \`acknowledged_by\` VARCHAR(64) NULL,\n`;
      sql += `    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
      sql += `    INDEX \`idx_priority\` (\`priority\`),\n`;
      sql += `    INDEX \`idx_event_time\` (\`event_time\`),\n`;
      sql += `    INDEX \`idx_device\` (\`device_tag\`)\n`;
      sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
    } else if (dialect === 'SQLServer') {
      sql += `-- Microsoft SQL Server (T-SQL) Schema Definition\n`;
      sql += `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '${tableName}')\n`;
      sql += `BEGIN\n`;
      sql += `    CREATE TABLE [dbo].[${tableName}] (\n`;
      sql += `        [id] NVARCHAR(32) NOT NULL PRIMARY KEY,\n`;
      sql += `        [code] NVARCHAR(64) NOT NULL,\n`;
      sql += `        [priority] NVARCHAR(16) NOT NULL,\n`;
      sql += `        [device_tag] NVARCHAR(64) NOT NULL,\n`;
      sql += `        [subsystem] NVARCHAR(128) NOT NULL,\n`;
      sql += `        [message_th] NVARCHAR(MAX) NOT NULL,\n`;
      sql += `        [message_en] NVARCHAR(MAX) NOT NULL,\n`;
      sql += `        [trigger_value] NVARCHAR(64) NULL,\n`;
      sql += `        [threshold] NVARCHAR(64) NULL,\n`;
      sql += `        [status] NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE',\n`;
      sql += `        [event_time] DATETIME2 NOT NULL,\n`;
      sql += `        [resolved_time] DATETIME2 NULL,\n`;
      sql += `        [duration_sec] INT NULL,\n`;
      sql += `        [acknowledged_by] NVARCHAR(64) NULL,\n`;
      sql += `        [created_at] DATETIME2 DEFAULT SYSUTCDATETIME()\n`;
      sql += `    );\n`;
      sql += `    CREATE INDEX idx_${tableName}_priority ON [dbo].[${tableName}]([priority]);\n`;
      sql += `    CREATE INDEX idx_${tableName}_event_time ON [dbo].[${tableName}]([event_time]);\n`;
      sql += `END;\nGO\n\n`;
    } else {
      // SQLite
      sql += `-- SQLite Schema Definition\n`;
      sql += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
      sql += `    "id" TEXT PRIMARY KEY,\n`;
      sql += `    "code" TEXT NOT NULL,\n`;
      sql += `    "priority" TEXT NOT NULL,\n`;
      sql += `    "device_tag" TEXT NOT NULL,\n`;
      sql += `    "subsystem" TEXT NOT NULL,\n`;
      sql += `    "message_th" TEXT NOT NULL,\n`;
      sql += `    "message_en" TEXT NOT NULL,\n`;
      sql += `    "trigger_value" TEXT,\n`;
      sql += `    "threshold" TEXT,\n`;
      sql += `    "status" TEXT NOT NULL DEFAULT 'ACTIVE',\n`;
      sql += `    "event_time" TEXT NOT NULL,\n`;
      sql += `    "resolved_time" TEXT,\n`;
      sql += `    "duration_sec" INTEGER,\n`;
      sql += `    "acknowledged_by" TEXT,\n`;
      sql += `    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP\n`;
      sql += `);\n`;
      sql += `CREATE INDEX IF NOT EXISTS "idx_${tableName}_priority" ON "${tableName}"("priority");\n`;
      sql += `CREATE INDEX IF NOT EXISTS "idx_${tableName}_event_time" ON "${tableName}"("event_time");\n\n`;
    }
  }

  // DML (INSERT STATEMENTS)
  if (records.length === 0) {
    sql += `-- No records to insert.\n`;
    return sql;
  }

  sql += `-- Insert Data Statements (${records.length} records)\n`;

  const escapeSql = (str: string | undefined | null) => {
    if (str === undefined || str === null) return 'NULL';
    const s = String(str).replace(/'/g, "''");
    return `'${s}'`;
  };

  const escapeNum = (num: number | undefined | null) => {
    if (num === undefined || num === null) return 'NULL';
    return isNaN(num) ? 'NULL' : num.toString();
  };

  // Format timestamp for SQL DATETIME/TIMESTAMP
  const formatSqlTime = (timeStr: string | undefined) => {
    if (!timeStr) return 'NULL';
    // If format is "YYYY-MM-DD HH:mm:ss.SSS", quote it
    return `'${timeStr}'`;
  };

  // Group into batches of 25 for safe batch insertion
  const batchSize = 25;
  for (let i = 0; i < records.length; i += batchSize) {
    const chunk = records.slice(i, i + batchSize);

    sql += `INSERT INTO ${tableName} (\n`;
    sql += `    id, code, priority, device_tag, subsystem, message_th, message_en,\n`;
    sql += `    trigger_value, threshold, status, event_time, resolved_time, duration_sec, acknowledged_by\n`;
    sql += `) VALUES\n`;

    const valueClauses = chunk.map((r, cIdx) => {
      const isLast = cIdx === chunk.length - 1;
      return `    (${escapeSql(r.id)}, ${escapeSql(r.code)}, ${escapeSql(r.priority)}, ${escapeSql(r.deviceTag)}, ${escapeSql(r.subsystem)}, ${escapeSql(r.messageTh)}, ${escapeSql(r.messageEn)}, ${escapeSql(r.triggerValue)}, ${escapeSql(r.threshold)}, ${escapeSql(r.status)}, ${formatSqlTime(r.eventTime)}, ${formatSqlTime(r.resolvedTime)}, ${escapeNum(r.durationSec)}, ${escapeSql(r.acknowledgedBy)})${isLast ? ';' : ','}`;
    });

    sql += valueClauses.join('\n') + '\n\n';
  }

  return sql;
}

/**
 * Trigger download of SQL script file (.sql)
 */
export function exportAlarmsToSql(
  records: HistoricalAlarmRecord[],
  options: SqlExportOptions,
  priorityFilter: AlarmPriority | 'ALL' = 'ALL'
): void {
  const sqlContent = generateSqlScript(records, options);
  const blob = new Blob([sqlContent], { type: 'application/sql;charset=utf-8;' });

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const fileDateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const filename = `SILA1_SCADA_Alarms_${options.dialect}_${priorityFilter}_${fileDateStr}.sql`;

  downloadBlob(blob, filename);
}
