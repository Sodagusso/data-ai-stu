/**
 * SILA1 Electrical System Simulator - Real-time SCADA Alarm History & Export Engine
 */

export type AlarmPriority = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INFO';

export interface HistoricalAlarmRecord {
  id: string;
  code: string;
  priority: AlarmPriority;
  deviceTag: string;
  subsystem: string;
  messageTh: string;
  messageEn: string;
  triggerValue: string;
  threshold: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  eventTime: string;
  epochMs: number;
  resolvedTime?: string;
  durationSec?: number;
  acknowledgedBy?: string;
  targetTab: 'ee' | 'ups' | 'floor' | 'ac' | 'overview' | 'ups-efficiency' | 'hv-diagram' | 'up-tier' | 'maintenance' | 'kpi' | 'alarm-export';
  targetElementId: string;
}

// Format date helper
export function formatScadaTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}.${ms}`;
}

// Generate realistic baseline alarm logs so the table and export have rich SCADA history
export function generateInitialAlarmHistory(): HistoricalAlarmRecord[] {
  const now = Date.now();

  const sampleEvents: Array<Omit<HistoricalAlarmRecord, 'id' | 'epochMs' | 'eventTime' | 'resolvedTime' | 'durationSec'> & { minutesAgo: number; resolvedMinutesAgo?: number }> = [
    {
      minutesAgo: 1,
      code: 'ALM-MDB1A-OC',
      priority: 'CRITICAL',
      deviceTag: 'MDB-1A',
      subsystem: 'LV Switchboard Bus A',
      messageTh: 'ตู้ประธาน MDB1A ตัดวงจรจากสภาวะ Overcurrent Protection (2480A)',
      messageEn: 'ACB MDB1A Overcurrent trip detected by Micrologic 6.0X trip unit',
      triggerValue: '2,480 A',
      threshold: '> 2,000 A',
      status: 'RESOLVED',
      resolvedMinutesAgo: 0.5,
      acknowledgedBy: 'Chief Engineer (Shift A)',
      targetTab: 'ee',
      targetElementId: 'mdb-1a',
    },
    {
      minutesAgo: 8,
      code: 'ALM-ATS1A-XFER',
      priority: 'MAJOR',
      deviceTag: 'ATS-1A',
      subsystem: 'Automatic Transfer Switch',
      messageTh: 'ATS1A สลับแหล่งจ่ายไปรับไฟจาก Emergency Generator GEN-1',
      messageEn: 'ATS1A transferred source from Primary Utility to Emergency Generator',
      triggerValue: 'Source 1 Loss (0V)',
      threshold: 'UV < 340V',
      status: 'RESOLVED',
      resolvedMinutesAgo: 6,
      acknowledgedBy: 'System Auto-Ack',
      targetTab: 'ee',
      targetElementId: 'ats-1a',
    },
    {
      minutesAgo: 15,
      code: 'ALM-UPS3A2-INV',
      priority: 'CRITICAL',
      deviceTag: 'UPS-3A2',
      subsystem: 'Critical IT UPS Bus A',
      messageTh: 'อินเวอร์เตอร์โมดูล UPS-3A2 ขัดข้อง อุณหภูมิแผงฮีตซิงก์เกินเกณฑ์ (78°C)',
      messageEn: 'Inverter power module fault due to IGBT heatsink over-temperature',
      triggerValue: '78.4 °C',
      threshold: '> 75.0 °C',
      status: 'RESOLVED',
      resolvedMinutesAgo: 10,
      acknowledgedBy: 'SCADA Duty Tech',
      targetTab: 'ups',
      targetElementId: 'ups-3a2',
    },
    {
      minutesAgo: 18,
      code: 'ALM-UPS3B2-THRM',
      priority: 'CRITICAL',
      deviceTag: 'UPS-3B2',
      subsystem: 'Critical IT UPS Bus B',
      messageTh: 'ตรวจพบอุณหภูมิอินเวอร์เตอร์โมดูล UPS-3B2 สูงกว่าพิกัดมาตรฐาน (76.8°C)',
      messageEn: 'Inverter power module thermal alarm on UPS-3B2, redundant cooling engaged',
      triggerValue: '76.8 °C',
      threshold: '> 75.0 °C',
      status: 'RESOLVED',
      resolvedMinutesAgo: 12,
      acknowledgedBy: 'SCADA Duty Tech',
      targetTab: 'ups',
      targetElementId: 'ups-3b2',
    },
    {
      minutesAgo: 22,
      code: 'ALM-BATT3B2-IMP',
      priority: 'MINOR',
      deviceTag: 'BATT-3B2',
      subsystem: 'VRLA Battery Bank 3B String 2',
      messageTh: 'ตรวจวัดค่าความต้านทานภายในเซลล์แบตเตอรี่ BATT-3B2 อยู่ในเกณฑ์ปกติ',
      messageEn: 'Internal cell impedance diagnostic verification completed for BATT-3B2',
      triggerValue: '1.24 mΩ',
      threshold: '< 2.00 mΩ',
      status: 'RESOLVED',
      resolvedMinutesAgo: 19,
      acknowledgedBy: 'Automation Scheduler',
      targetTab: 'ups',
      targetElementId: 'batt-3b2',
    },
    {
      minutesAgo: 22,
      code: 'ALM-BATT3A-TEST',
      priority: 'MINOR',
      deviceTag: 'BATT-3A',
      subsystem: 'VRLA Battery Bank 3A',
      messageTh: 'การทดสอบคายประจุแบตเตอรี่ประจำรอบอัตโนมัติ (Battery Impedance Test)',
      messageEn: 'Scheduled battery string discharge test active, Cell resistance nominal',
      triggerValue: '488 VDC',
      threshold: 'Float 540 VDC',
      status: 'RESOLVED',
      resolvedMinutesAgo: 18,
      acknowledgedBy: 'Automation Scheduler',
      targetTab: 'ups',
      targetElementId: 'batt-3a',
    },
    {
      minutesAgo: 35,
      code: 'ALM-TR1-OIL-TEMP',
      priority: 'MAJOR',
      deviceTag: 'TR-1',
      subsystem: 'HV Transformer 2000kVA',
      messageTh: 'อุณหภูมิน้ำมันหม้อแปลง TR-1 สูงผิดปกติ (Oil Temp Warning)',
      messageEn: 'Transformer TR-1 Winding/Oil temperature probe reached stage-1 warning',
      triggerValue: '82.6 °C',
      threshold: '> 80.0 °C',
      status: 'RESOLVED',
      resolvedMinutesAgo: 28,
      acknowledgedBy: 'Electrical Supervisor',
      targetTab: 'hv-diagram',
      targetElementId: 'tr-1',
    },
    {
      minutesAgo: 45,
      code: 'ALM-GEN1-WARMUP',
      priority: 'MINOR',
      deviceTag: 'GEN-1',
      subsystem: 'Emergency Generator',
      messageTh: 'เครื่องกำเนิดไฟฟ้าดีเซล GEN-1 ติดเครื่องทดสอบประจำสัปดาห์ (No-load Test)',
      messageEn: 'Weekly automated generator exercise warmup run completed successfully',
      triggerValue: '1,500 RPM',
      threshold: 'Rated 1500 RPM',
      status: 'RESOLVED',
      resolvedMinutesAgo: 40,
      acknowledgedBy: 'Facilities Ops',
      targetTab: 'ee',
      targetElementId: 'gen-1',
    },
    {
      minutesAgo: 58,
      code: 'ALM-GRID-SAG',
      priority: 'MAJOR',
      deviceTag: 'PEA-22kV',
      subsystem: 'PEA 22kV High Voltage',
      messageTh: 'แรงดันไฟฟ้าการไฟฟ้า PEA ตกชั่วขณะ (Voltage Sag Phase C: 19.8kV)',
      messageEn: 'Transient voltage sag detected on incoming 22kV Line C',
      triggerValue: '19.8 kV',
      threshold: 'Nominal 22.0 kV',
      status: 'RESOLVED',
      resolvedMinutesAgo: 57,
      acknowledgedBy: 'System Auto-Ack',
      targetTab: 'hv-diagram',
      targetElementId: 'src-hv',
    },
    {
      minutesAgo: 75,
      code: 'ALM-CHILLER-FLW',
      priority: 'WARNING',
      deviceTag: 'PCU-CHILLER-2',
      subsystem: 'Mechanical Cooling Plant',
      messageTh: 'อัตราการไหลของน้ำหล่อเย็นทุติยภูมิเบี่ยงเบนต่ำกว่าค่ากำหนด (Flow Rate Low)',
      messageEn: 'Secondary chilled water differential flow rate slightly below benchmark',
      triggerValue: '48.2 L/s',
      threshold: '< 50.0 L/s',
      status: 'RESOLVED',
      resolvedMinutesAgo: 65,
      acknowledgedBy: 'HVAC Specialist',
      targetTab: 'ac',
      targetElementId: 'ac-plant',
    },
    {
      minutesAgo: 90,
      code: 'ALM-MNT-MDB2B',
      priority: 'INFO',
      deviceTag: 'MDB-2B',
      subsystem: 'Preventive Maintenance',
      messageTh: 'รอบชั่วโมงการทำงานสะสมครบ 2,000 ชม. แนะนำตรวจสอบแรงขันขั้วต่อบัสบาร์ (Torque Check)',
      messageEn: 'Preventive maintenance threshold advisory: Schedule thermal imaging inspection',
      triggerValue: '2,005 Hours',
      threshold: 'Target 2,000 Hours',
      status: 'RESOLVED',
      resolvedMinutesAgo: 70,
      acknowledgedBy: 'Maintenance Manager',
      targetTab: 'maintenance',
      targetElementId: 'mdb-2b',
    },
    {
      minutesAgo: 120,
      code: 'ALM-FIRE-SUP-RDY',
      priority: 'INFO',
      deviceTag: 'FAS-ZONE-3',
      subsystem: 'Fire & Safety Interlock',
      messageTh: 'ระบบดับเพลิงอัตโนมัติ Novec-1230 ตรวจเช็กแรงดันถังก๊าซปกติ (Normal Standby)',
      messageEn: 'Clean agent suppression cylinder pressure sensor test passed 25 bar',
      triggerValue: '25.2 Bar',
      threshold: '24-26 Bar',
      status: 'RESOLVED',
      resolvedMinutesAgo: 119,
      acknowledgedBy: 'Safety Officer',
      targetTab: 'floor',
      targetElementId: 'floor-fas',
    },
  ];

  return sampleEvents.map((item, idx) => {
    const eventEpoch = now - item.minutesAgo * 60 * 1000;
    const resolvedEpoch = item.resolvedMinutesAgo !== undefined ? now - item.resolvedMinutesAgo * 60 * 1000 : undefined;
    const duration = resolvedEpoch ? Math.round((resolvedEpoch - eventEpoch) / 1000) : undefined;

    return {
      id: `ALM-${(20261000 + idx).toString()}`,
      code: item.code,
      priority: item.priority,
      deviceTag: item.deviceTag,
      subsystem: item.subsystem,
      messageTh: item.messageTh,
      messageEn: item.messageEn,
      triggerValue: item.triggerValue,
      threshold: item.threshold,
      status: item.status,
      eventTime: formatScadaTimestamp(new Date(eventEpoch)),
      epochMs: eventEpoch,
      resolvedTime: resolvedEpoch ? formatScadaTimestamp(new Date(resolvedEpoch)) : undefined,
      durationSec: duration,
      acknowledgedBy: item.acknowledgedBy,
      targetTab: item.targetTab,
      targetElementId: item.targetElementId,
    };
  });
}
