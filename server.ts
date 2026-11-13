import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// ---------------------------------------------------------------------------
// SELF-CONTAINED MAINTENANCE WORK ORDER TYPES & LOGIC FOR BACKEND
// (Kept self-contained to avoid ESM relative module resolution issues in Node 22)
// ---------------------------------------------------------------------------

export type JobPriority = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_ROUTINE';
export type JobStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';
export type JobType = 'PREVENTIVE_PM' | 'CORRECTIVE_CM' | 'EMERGENCY_SOP';

export interface MaintenanceJob {
  id: string;
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
  responseSlaMinutes: number;
  resolutionSlaHours: number;
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

const SLA_TARGETS: Record<JobPriority, { responseMinutes: number; resolutionHours: number }> = {
  P1_CRITICAL: { responseMinutes: 15, resolutionHours: 2 },
  P2_HIGH: { responseMinutes: 30, resolutionHours: 4 },
  P3_MEDIUM: { responseMinutes: 120, resolutionHours: 8 },
  P4_ROUTINE: { responseMinutes: 240, resolutionHours: 24 },
};

const INITIAL_MAINTENANCE_JOBS: MaintenanceJob[] = [
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

function openMaintenanceJob(
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

function acknowledgeMaintenanceJob(
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

function resolveMaintenanceJob(
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

function generateMaintenanceJobsCsv(jobs: MaintenanceJob[]): string {
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

  return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

// In-memory maintenance jobs state on server (synced across browser clients and Google Sheets)
let serverMaintenanceJobs: MaintenanceJob[] = [...INITIAL_MAINTENANCE_JOBS];

// ---------------------------------------------------------------------------
// REAL-TIME GOOGLE SHEETS LIVE SYNC CSV ENDPOINT
// Can be directly referenced inside any Google Sheet using:
// =IMPORTDATA("https://<YOUR_APP_URL>/api/maintenance/live-sync.csv")
// ---------------------------------------------------------------------------
app.get('/api/maintenance/live-sync.csv', (_req: Request, res: Response) => {
  const csvData = generateMaintenanceJobsCsv(serverMaintenanceJobs);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="maintenance-jobs-live.csv"');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.send(csvData);
});

// JSON REST APIs for Maintenance Jobs
app.get('/api/maintenance/jobs', (_req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    count: serverMaintenanceJobs.length,
    jobs: serverMaintenanceJobs,
  });
});

app.post('/api/maintenance/jobs', (req: Request, res: Response) => {
  const { title, equipmentId, equipmentName, jobType, priority, description, assignedTo } = req.body;
  if (!title || !equipmentId || !priority) {
    res.status(400).json({ error: 'Missing required fields: title, equipmentId, priority' });
    return;
  }

  serverMaintenanceJobs = openMaintenanceJob(serverMaintenanceJobs, {
    title,
    equipmentId,
    equipmentName: equipmentName || equipmentId.toUpperCase(),
    jobType: jobType || 'CORRECTIVE_CM',
    priority,
    description: description || '',
    assignedTo: assignedTo || 'Unassigned',
  });

  res.json({ status: 'created', jobs: serverMaintenanceJobs });
});

app.put('/api/maintenance/jobs/:id/acknowledge', (req: Request, res: Response) => {
  const { id } = req.params;
  const { acknowledgedBy } = req.body;

  serverMaintenanceJobs = acknowledgeMaintenanceJob(
    serverMaintenanceJobs,
    id,
    acknowledgedBy || 'Data Center Operations Engineer'
  );

  res.json({ status: 'acknowledged', jobs: serverMaintenanceJobs });
});

app.put('/api/maintenance/jobs/:id/resolve', (req: Request, res: Response) => {
  const { id } = req.params;
  const { resolvedBy, resolutionNotes, partsReplaced, actualDowntimeMinutes } = req.body;

  serverMaintenanceJobs = resolveMaintenanceJob(serverMaintenanceJobs, id, {
    resolvedBy: resolvedBy || 'Senior EE Engineer',
    resolutionNotes: resolutionNotes || 'Service completed according to standard procedures.',
    partsReplaced: partsReplaced || 'None',
    actualDowntimeMinutes: Number(actualDowntimeMinutes) || 0,
  });

  res.json({ status: 'resolved', jobs: serverMaintenanceJobs });
});

// Sync entire state from frontend if desired
app.post('/api/maintenance/sync-all', (req: Request, res: Response) => {
  if (Array.isArray(req.body.jobs)) {
    serverMaintenanceJobs = req.body.jobs;
  }
  res.json({ status: 'synced', count: serverMaintenanceJobs.length });
});

// Setup Vite or Static File Serving
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
