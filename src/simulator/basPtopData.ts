/**
 * BAS PtoP (Point-to-Point) and PtoG (Point-to-Gateway / Point-to-Graphics / Point-to-Ground)
 * Investigation & Commissioning Engineering Knowledge Base for SILA1 Data Center SCADA
 */

export type SignalType = 'DI' | 'DO' | 'AI' | 'AO' | 'MODBUS_REG' | 'BACNET_OBJ' | 'SNMP_OID';

export type SubsystemType =
  | 'HV_SWITCHGEAR'
  | 'TRANSFORMER'
  | 'MDB_LV'
  | 'ATS_TRANSFER'
  | 'GENERATOR'
  | 'UPS_SYSTEM'
  | 'BATTERY_BMS'
  | 'HVAC_CHILLER';

export type VendorProtocolType =
  | 'MODBUS_RTU'
  | 'MODBUS_TCP'
  | 'BACNET_IP'
  | 'BACNET_MSTP'
  | 'SNMP_V2_V3'
  | 'IEC_61850'
  | 'HARDWIRED_IO';

export type GroundLoopStatusType =
  | 'SINGLE_POINT_GROUNDED'
  | 'GALVANIC_ISOLATED'
  | 'FLOATING_SHIELD'
  | 'GROUND_LOOP_RISK';

export interface BasPointItem {
  id: string;
  tag: string;
  nameTh: string;
  nameEn: string;
  deviceName: string; // Specific field device name (e.g., Schneider PM8000, Sepam 40, DSE8610)
  registerOffset: string; // Register offset (e.g., 43028 (0x0BCB / 0-based: 3027), OID, or Terminal ID)
  subsystem: SubsystemType;
  subsystemName: string;
  equipmentId: string;
  signalType: SignalType;
  vendorProtocol: VendorProtocolType;
  vendorExample: string;
  hardwareAddress: string; // e.g., "DI-01 / Terminal X1:12", "Modbus 40001", "BACnet AI:3", "OID .1.3.6.1.2.1.33.1.2.5"
  dataType: string; // e.g., "Dry Contact 24VDC", "Float32 (Big-Endian)", "Float32 (Word Swap)", "UInt16"
  engineeringUnit: string; // e.g., "V", "A", "kW", "%", "Hz", "°C", "Binary (0=Norm, 1=Trip)"
  nominalValue: string;
  groundLoopPtoG: string; // PtoG ground loop isolation topology & shield configuration
  groundLoopStatus: GroundLoopStatusType;
  ptopCheckpointTh: string; // ข้อควรระวังระดับ Point-to-Point (Physical & Electrical)
  ptogCheckpointTh: string; // ข้อควรระวังระดับ Point-to-Gateway / Point-to-Graphics (Network, Mapping, SCADA)
  testMethodTh: string; // วิธีการทดสอบ Commissioning
  status: 'NORMAL' | 'SIMULATED_FAULT' | 'VERIFIED';
  currentReading?: string;
  faultMessage?: string;
}

export interface ProtocolDeepDive {
  protocol: VendorProtocolType;
  titleTh: string;
  titleEn: string;
  descriptionTh: string;
  targetInterfaces: string[];
  keyVendors: string[];
  physicalLayer: string;
  networkTransport: string;
  pitfallsPtoP: string[];
  pitfallsPtoG: string[];
  recommendedBestPractices: string[];
}

export interface InterfaceInvestigationSummary {
  interfaceId: string;
  nameTh: string;
  nameEn: string;
  scopeTh: string;
  criticality: 'CRITICAL_TIER_IV' | 'MAJOR_REDUNDANT' | 'SUPPORT_FACILITY';
  protocols: VendorProtocolType[];
  primaryVendors: string[];
  ptopKeyRisks: string[];
  ptogKeyRisks: string[];
  standardSLA: string;
}

export const PROTOCOL_DEEP_DIVES: ProtocolDeepDive[] = [
  {
    protocol: 'MODBUS_RTU',
    titleTh: 'Modbus RTU (Serial RS-485 2-Wire)',
    titleEn: 'Modbus RTU over RS-485 Serial Bus',
    descriptionTh:
      'โปรโตคอลมาตรฐานอุตสาหกรรมสำหรับ Power Quality Meters, Breakers (ACB/MCCB) และ ATS Controllers การสื่อสารแบบ Master-Slave บนสาย Shielded Twisted Pair',
    targetInterfaces: ['MDB Power Meters (PM8000/PAC)', 'ATS Controller', 'Trip Units (Micom/Ekip)'],
    keyVendors: ['Schneider Electric', 'ABB', 'Siemens', 'Socomec', 'Janitza'],
    physicalLayer: 'RS-485 2-Wire Half-Duplex, Baud Rate 9600 - 38400 bps, 8-E-1 / 8-N-1',
    networkTransport: 'Direct Serial Daisy-chain (Up to 32 devices per segment without repeater)',
    pitfallsPtoP: [
      'การสลับขั้วสาย A/B หรือ +/- (โดยเฉพาะยี่ห้อ Schneider มักติดป้าย D0/D1 หรือ A/B สลับกับมาตรฐานทั่วไป)',
      'การลืมต่อตัวต้านทานปิดหัวท้าย 120Ω End-of-Line (EOL) Terminator ทำให้เกิด Signal Reflection เมื่อสายยาว > 50m',
      'การต่อสายแบบ Star หรือ Tap แยกแขนง แทนที่จะเป็น Daisy-chain แท้ ทำให้เกิดอิมพีแดนซ์สะท้อน',
      'Shield Drain Wire: ต้องต่อลงกราวด์เพียงจุดเดียว (Single-Point Ground ที่ตู้ Gateway เท่านั้น) หากต่อ 2 ฝั่งจะเกิด Ground Loop Current เผาชิป RS-485',
    ],
    pitfallsPtoG: [
      'Register Offset Shift (40001 vs 40000): คู่มือบอกเริ่ม 40001 (1-based) แต่โปรแกรม Gateway อ่านเริ่ม 0 (0-based) ทำให้ค่าเลื่อนไป 1 รีจิสเตอร์ เช่น อ่านกระแสได้เป็นแรงดัน',
      'Byte / Word Order (Endianness & Word Swap): ตัวเลข 32-bit Float ต้องการการจัดเรียง High-word/Low-word ให้ถูกต้อง หากสลับจะได้ค่าผิดเพี้ยน เช่น 380V อ่านได้ 2.45E-37',
      'Polling Timeout Cascade: หากอุปกรณ์ตัวใดตัวหนึ่งออฟไลน์ ตัว Gateway จะรอ Timeout (เช่น 1,000ms) ทำให้ Polling Loop ของอุปกรณ์ตัวอื่นในสายเดียวกันดีเลย์ตามไปด้วย',
    ],
    recommendedBestPractices: [
      'ใช้สาย Belden 3106A (1 Pair + Ground) หรือ 9841 มาตรฐาน RS-485 แท้',
      'จำกัดจำนวนอุปกรณ์ไม่เกิน 24-28 ตัวต่อ 1 Gateway Port เพื่อรักษารอบ Poll Rate < 2.0 วินาที',
      'เปิดฟังก์ชัน RS-485 Bias Resistor (Pull-up 680Ω / Pull-down 680Ω) ที่ Gateway เพื่อรักษาระดับแรงดันช่วง Idle',
    ],
  },
  {
    protocol: 'MODBUS_TCP',
    titleTh: 'Modbus TCP (Ethernet IP)',
    titleEn: 'Modbus TCP over Ethernet (Port 502)',
    descriptionTh:
      'โปรโตคอลครอบโครงสร้างข้อมูล Modbus ผ่าน TCP/IP ไร้ข้อจำกัดด้านความเร็ว RS-485 มักใช้เชื่อมต่อ Gateway ชุมสาย, Intelligent ACB และ Smart PDU ไปยัง SCADA',
    targetInterfaces: ['MDB Digital Gateway', 'Main Power Meter', 'Smart Breakers', 'Solar Inverter'],
    keyVendors: ['Schneider ComX/Link150', 'Siemens Sicam', 'ABB Ekip E-Hub', 'Moxa MGate'],
    physicalLayer: 'Ethernet RJ45 CAT6 / Fiber Optic Single-mode, 100/1000 Mbps',
    networkTransport: 'TCP/IP Port 502 (Unicast Master-to-Slave / Gateway Unit ID Routing)',
    pitfallsPtoP: [
      'การใช้สาย LAN UTP ธรรมดาในรางสายไฟกำลัง (Power Cable Tray) เหนี่ยวนำสัญญาณรบกวน ต้องใช้สาย STP/FTP ที่มีชีลด์พร้อมต่อกราวด์ Patch Panel',
      'IP Address Conflict หรือ Subnet Mismatch กับโครงสร้างเน็ตเวิร์กของ OT/SCADA VLAN',
    ],
    pitfallsPtoG: [
      'Unit ID (Slave ID) Mismatch เมื่อส่งผ่าน Gateway: Modbus TCP Header มีฟิลด์ Unit ID (1-255) หากตั้งผิด Gateway จะไม่ Route ข้อมูลต่อไปยัง RS-485',
      'TCP Connection Limit Exceeded: มิเตอร์บางรุ่นรองรับ TCP Sockets พร้อมกันได้เพียง 2-4 Session หาก SCADA, BMS และ Web Config เข้าพร้อมกันจะถูกเตะหลุด',
      'Over-Polling: ส่ง Request เร็วเกินไป (< 100ms) ทำให้ CPU ภายในมิเตอร์ค้างจนหยุดตอบสนอง',
    ],
    recommendedBestPractices: [
      'กำหนด IP Address แบบ Static และบันทึกลง IP Allocation Schedule พร้อม MAC Address ชัดเจน',
      'ตั้งค่า Socket Keep-Alive Timeout ไม่เกิน 30-60 วินาที เพื่อปล่อย Session ที่ค้าง',
      'จัดตั้ง Managed Switch พร้อม RSTP/MRP Redundancy Ring สำหรับระบบวิกฤต',
    ],
  },
  {
    protocol: 'BACNET_IP',
    titleTh: 'BACnet IP & BACnet MS/TP',
    titleEn: 'BACnet IP (Port 47808) & MS/TP (RS-485)',
    descriptionTh:
      'โปรโตคอลสากล ANSI/ASHRAE 135 สำหรับระบบควบคุมอาคารอัตโนมัติ (Building Automation) ใช้หลัก Object-Oriented (AI, AO, BI, BO, AV, BV) เหมาะกับชิลเลอร์และแอร์ห้องคอมพิวเตอร์',
    targetInterfaces: ['Chiller Plant Manager', 'CRAC / CRAH Units', 'VFD Cooling Pumps', 'BMS Master Controller'],
    keyVendors: ['Johnson Controls (Metasys)', 'Honeywell (WEBs/ComfortPoint)', 'Siemens (Desigo)', 'Trane', 'Delta Controls'],
    physicalLayer: 'BACnet IP: Ethernet RJ45 (UDP 47808/BAC0) | BACnet MS/TP: RS-485 Token Passing',
    networkTransport: 'UDP/IP Broadcast Management (BBMD) ข้าม Subnet / VLAN',
    pitfallsPtoP: [
      'BACnet MS/TP Token Ring: MAC Address ชนกัน หรือตั้งค่า Max-Master ไม่สอดคล้องกับเลข MAC สูงสุด ทำให้ Token เสียเวลาค้นหา Master ที่ไม่มีจริง',
      'Baud Rate Mismatch ระหว่าง DDC Controller กับตัวตรวจวัดปลายทาง',
    ],
    pitfallsPtoG: [
      'Duplicate BACnet Device Instance ID: ต้องไม่ซ้ำกันทั่วทั้งโครงข่าย (0 - 4,194,302) หากซ้ำ อุปกรณ์จะกะพริบหายไปจาก SCADA / Workstation',
      'BBMD (BACnet Broadcast Management Device) และ BDT (Broadcast Distribution Table): หาก BAS Server กับ Chiller Controller อยู่คนละ VLAN ต้องตั้งค่า BBMD ให้ส่ง Broadcast ข้าม Routers ได้',
      'COV (Change of Value) Subscription vs Polling: หากตั้ง COV Increment ต่ำเกินไป (เช่น อุณหภูมิเปลี่ยน 0.01°C ส่งทันที) บัสจะติดคอขวดและ Network ล่ม',
    ],
    recommendedBestPractices: [
      'ทำ Device ID Allocation Plan โดยมี Prefix ตามอาคารและชั้น เช่น 101xxx สำหรับ SILA1 Data Center',
      'ใช้วิธี Polling สำหรับข้อมูล High-frequency Power และใช้ COV สำหรับข้อมูล State/Status ของแอร์/วาล์ว',
      'ทดสอบด้วยโปรแกรม BACnet Scan Tool เช่น YABE (Yet Another BACnet Explorer) ก่อนเชื่อมต่อ SCADA Server',
    ],
  },
  {
    protocol: 'SNMP_V2_V3',
    titleTh: 'SNMP v2c / v3 (Simple Network Management Protocol)',
    titleEn: 'SNMP v2c / v3 for Power & Infrastructure (RFC 1628)',
    descriptionTh:
      'โปรโตคอลหลักในการมอนิเตอร์อุปกรณ์ IT, Network, UPS และ PDU ใน Data Center ผ่านโครงสร้าง MIB Tree และ OID',
    targetInterfaces: ['UPS-3A / UPS-3B Network Cards', 'Battery Monitoring System (BMS)', 'Precision STS / PDU'],
    keyVendors: ['Vertiv (Liebert Unity)', 'Schneider Electric (APC NMC3)', 'Eaton (Network-M2)', 'Huawei (FusionPower)'],
    physicalLayer: 'Ethernet RJ45 CAT6, 100/1000 Mbps',
    networkTransport: 'UDP Port 161 (GET/POLL) และ UDP Port 162 (TRAPS/EVENTS)',
    pitfallsPtoP: [
      'สายสัญญาณ LAN เชื่อมต่อเข้า Network Card ของ UPS หลวม หรือ Port Link Down',
      'การตั้งค่า IP Address หรือ Subnet Mask ผิดพลาด ทำให้ไม่สามารถ Ping ได้',
    ],
    pitfallsPtoG: [
      'Private Enterprise MIB vs Standard UPS MIB (RFC 1628): มาตรฐาน RFC 1628 ใช้ OID `.1.3.6.1.2.1.33` แต่วิศวกรมักลืมว่าสถานะพิเศษ (เช่น Alarm รหัสเจาะจง) ต้องดึงจาก Vendor MIB Tree เช่น Liebert `.1.3.6.1.4.1.476` หรือ APC `.1.3.6.1.4.1.318`',
      'SNMP Community String / Security: SNMP v2c ส่งรหัสผ่านแบบ Plaintext (public/private) หากปิดกั้น Firewall หรือใช้ v3 ต้องตั้งค่า EngineID, Auth (SHA-256) และ Priv (AES-128) ให้ตรงกัน 100%',
      'Trap Loss: SNMP Trap ส่งผ่าน UDP ไม่มี Handshake หากช่วงไฟตก Switch Reboots สัญญาณเตือน Alarm อาจสูญหาย ต้องมี Polling ควบคู่เสมอ',
    ],
    recommendedBestPractices: [
      'บังคับใช้ SNMP v3 สำหรับ Data Center มาตรฐานความปลอดภัยระดับ Tier III / Tier IV',
      'ตั้ง Trap Receiver IP ใน UPS Card ให้ชี้ไปยัง SCADA Trap Daemon และตั้ง Heartbeat Poll ทุก 30 วินาที',
      'คอมไพล์ Vendor MIB File เข้ากับ SCADA Server เพื่อให้แสดงผลเป็นชื่อตัวแปรที่มนุษย์อ่านเข้าใจแทนเลข OID ยาว',
    ],
  },
  {
    protocol: 'HARDWIRED_IO',
    titleTh: 'Hardwired I/O (DI, DO, AI, AO) & IEC 61850',
    titleEn: 'Hardwired Hard-Wired Direct I/O & Substation IEC 61850',
    descriptionTh:
      'ระบบสัญญาณต่อตรงเชิงกายภาพ (Hardwired) เพื่อความปลอดภัยสูงสุด Fail-Safe และระบบ IEC 61850 GOOSE Substation สำหรับอุปกรณ์ตัดตอนไฟแรงสูง 22kV',
    targetInterfaces: ['MDB Breaker Auxiliary Contacts', 'Emergency Gen Run/Trip Signal', 'ATS Interlock', 'HV 22kV RM6 Relay'],
    keyVendors: ['Schneider Sepam/Micom', 'Socomec', 'Omron Relays', 'ABB Relion', 'Phoenix Contact'],
    physicalLayer: 'Hardwired Multi-core Shielded Cable (0.75 - 1.5 sq.mm.) / Fiber Optic Ethernet for IEC 61850',
    networkTransport: 'Direct Electrical Loop (24VDC Wetting / Dry Contact / 4-20mA Current Loop) / GOOSE Layer 2',
    pitfallsPtoP: [
      'Wetting Voltage Mismatch: หน้าสัมผัส Aux Contact เป็นแบบ Dry Contact แต่ดันไม่จ่ายไฟเลี้ยง 24VDC ลูป ทำให้ PLC อ่านได้ 0 ตลอดกาล',
      'Contact Chattering / Bounce: เบรกเกอร์ตัดวงจรทำให้หน้าสัมผัสกระเด้งช่วง 5-15ms ต้องใส่ Debounce Filter Timer ในโปรแกรม PLC/DDC อย่างน้อย 30-50ms เพื่อป้องกันการส่ง Alarm เบิ้ลหลายสิบครั้ง',
      '4-20mA Broken Wire: สายสัญญาณ AI ขาดหรือลูปขาด จะมีกระแส 0mA ซึ่งต่ำกว่า Live Zero (4mA) หากระบบไม่ได้ทำ Broken Loop Detection จะเข้าใจผิดว่าค่าอ่านได้เป็น 0 หน่วย',
      'Flyback Diode / Snubber: การสั่งงานคอยล์รีเลย์ DO หากไม่มี Diode ดักไฟย้อน จะเกิด Back-EMF กระชากทำให้ทรานซิสเตอร์ของ PLC ทะลุพังเสียหาย',
    ],
    pitfallsPtoG: [
      'Normally Open (NO) vs Normally Closed (NC) Inversion: นิยามของสัญญาณความปลอดภัย เช่น สัญญาณฉุกเฉิน (E-Stop) ต้องเป็น NC (Fail-Safe) หากฝั่ง SCADA ตั้ง Logic ผิดเป็น NO จะทำให้ระบบไม่ออก Alarm ยามสายขาด',
      'IEC 61850 GOOSE Broadcast Mismatch: GOOSE วิ่งบน Layer 2 ไม่ผ่าน IP Router หากคอนฟิก VLAN ID บน Managed Switch ไม่ตรง สัญญาณ Trip Interlock ข้ามตู้จะไม่ส่งถึงกัน',
    ],
    recommendedBestPractices: [
      'ใช้ Interposing Relay แยกวงจรระหว่างสนามกับระบบ PLC เสมอ (Galvanic Isolation 2.5kV)',
      'เลือกใช้สัญญาณ 4-20mA แทน 0-10V สำหรับเซนเซอร์ระยะไกลเพื่อตัดปัญหา Voltage Drop และสามารถตรวจจับสายขาด (Broken Wire) ได้เมื่อกระแส < 3.6mA',
      'ติดป้าย Numbering Ferrule ปลอกสายไฟที่ขั้วต่อทุกเส้นตรงตามแบบ As-Built Schematic',
    ],
  },
];

export const INTERFACE_SUMMARIES: InterfaceInvestigationSummary[] = [
  {
    interfaceId: 'INT-HV',
    nameTh: 'อินเตอร์เฟสระบบไฟฟ้าแรงสูง 22kV & หม้อแปลง (HV & TR)',
    nameEn: '22kV High Voltage Switchgear & 2000kVA Transformers Interface',
    scopeTh: 'เชื่อมโยง RM6 Ring Main Unit, หม้อแปลง Ekarat 2000kVA Dyn11, Protection Relays (50/51/50N/51N) และ Oil Temp/Gas Pressure',
    criticality: 'CRITICAL_TIER_IV',
    protocols: ['IEC_61850', 'MODBUS_TCP', 'HARDWIRED_IO'],
    primaryVendors: ['Schneider (RM6 / Sepam / Micom)', 'Ekarat', 'PEA Utility'],
    ptopKeyRisks: [
      'การต่อสาย Thermocouple / PT100 วัดอุณหภูมิขดลวดหม้อแปลงผิดขั้ว',
      'สายสัญญาณ Trip Contact จาก Buchholz Relay และ Pressure Relief Device (PRD) หลวม',
      'การจัดสายสัญญาณใกล้บัสบาร์ 22kV ทำให้เกิดสัญญาณรบกวน Electromagnetic Interference (EMI)',
    ],
    ptogKeyRisks: [
      'การจัดส่งสัญญาณ Trip Alarm ช้าเกินไป (SCADA ต้องแสดงผลภายใน < 1.0 วินาที)',
      'Timestamp ใน Protection Relay ไม่ได้ Sync ผ่าน NTP/SNTP ทำให้ Sequence of Events (SOE) คลาดเคลื่อน',
    ],
    standardSLA: 'Fault Clearance & Indication < 100ms, SCADA Event Logging < 1.0s',
  },
  {
    interfaceId: 'INT-MDB',
    nameTh: 'อินเตอร์เฟสสวิตช์บอร์ดแรงต่ำ MDB & มิเตอร์วัดค่าพลังงาน (MDB & EPMS)',
    nameEn: 'Main Distribution Boards & Power Quality Meters Interface',
    scopeTh: 'ครอบคลุมตู้ MDB-1A, MDB-1B, MDB-2A, MDB-2B, ACB Status (Open/Closed/Tripped), Power Meters PM8000/PAC4200 (V, I, kW, PF, THD)',
    criticality: 'CRITICAL_TIER_IV',
    protocols: ['MODBUS_RTU', 'MODBUS_TCP', 'HARDWIRED_IO'],
    primaryVendors: ['Schneider Electric (Masterpact MTZ, PM8000)', 'ABB (Emax 2)', 'Siemens (Sentron)'],
    ptopKeyRisks: [
      'สลับสายขั้ว RS-485 (A/B) บน Daisy Chain ทำให้มิเตอร์ทั้ง Loop ออฟไลน์',
      'ไม่ต่อสายดินชีลด์ (Drain Wire) หรือต่อหัวท้ายจนเกิด Ground Loop เหนี่ยวนำ 50Hz',
      'การต่อ CT (Current Transformer) กลับทิศ (S1/S2 สลับกัน) ทำให้ Power Factor ติดลบ และค่า kW เป็นลบ',
    ],
    ptogKeyRisks: [
      'ปัญหา Word Swap ใน Float32 ทำให้ค่าแรงดัน 380V หรือกระแสเพี้ยนอย่างรุนแรง',
      'ปัญหา Register Offset เลื่อน 1 รีจิสเตอร์ (1-based vs 0-based)',
      'การคำนวณสูตร Total Power kW บน SCADA ซ้ำซ้อนกับ Internal Meter Summation',
    ],
    standardSLA: 'Telemetry Update Rate <= 2.0s, Breaker Trip Signal Indication <= 500ms',
  },
  {
    interfaceId: 'INT-ATS',
    nameTh: 'อินเตอร์เฟสระบบสวิตช์สลับแหล่งจ่ายไฟอัตโนมัติ (ATS System)',
    nameEn: 'Automatic Transfer Switch & Interlock Controller Interface',
    scopeTh: 'เชื่อมโยงตู้ ATS-1A, ATS-1B, ATS-2A, ATS-2B, ATS Sub, แหล่งจ่าย Normal/Emergency, Transfer Sequence Logic และ Genset Start Command',
    criticality: 'CRITICAL_TIER_IV',
    protocols: ['HARDWIRED_IO', 'MODBUS_RTU'],
    primaryVendors: ['Socomec (ATyS)', 'ASCO (Series 7000)', 'Schneider TransferPacT'],
    ptopKeyRisks: [
      'หน้าสัมผัสสั่งสตาร์ตเครื่องกำเนิดไฟฟ้า (Gen Start Contact) ชำรุดหรือสายขาด',
      'การต่อสลับสายเฟส (Phase Sequence R-S-T) ระหว่างหม้อแปลงกับเครื่องกำเนิดไฟฟ้าทำให้มอเตอร์หมุนกลับทิศ',
      'สัญญาณตรวจจับแรงดันไฟตก (Under-voltage relay) ตั้งหน่วงเวลาน้อยเกินไปจนสับหลอกยามไฟกระพริบ',
    ],
    ptogKeyRisks: [
      'SCADA ไม่อัปเดตสถานะ "Transfer in Progress" ทำให้ Operator นึกว่าระบบตัดไฟสมบูรณ์แล้ว',
      'การขาดการมอนิเตอร์ Transfer Counter (จำนวนครั้งที่สับ) เพื่อแจ้งเตือนรอบบำรุงรักษาหน้าสัมผัส',
    ],
    standardSLA: 'Transfer Execution <= 10.0s (รวมสตาร์ตเจน), SCADA Status Echo <= 500ms',
  },
  {
    interfaceId: 'INT-GEN',
    nameTh: 'อินเตอร์เฟสเครื่องกำเนิดไฟฟ้าดีเซลสำรอง (Emergency Generator)',
    nameEn: 'Diesel Generator & Automatic Genset Controller Interface',
    scopeTh: 'เชื่อมต่อเครื่องกำเนิดไฟฟ้า 2000kVA, Controller DSE8610 / EasyGen, ปริมาณน้ำมัน Day Tank, อุณหภูมิน้ำหล่อเย็น, รอบเครื่องยนต์ (RPM)',
    criticality: 'CRITICAL_TIER_IV',
    protocols: ['MODBUS_RTU', 'MODBUS_TCP', 'HARDWIRED_IO'],
    primaryVendors: ['Deep Sea Electronics (DSE)', 'Woodward (EasyGen)', 'Cummins PowerCommand', 'ComAp'],
    ptopKeyRisks: [
      'สวิตช์โหมดลูกบิดหน้าตู้ตั้งไว้ที่ "OFF" หรือ "MANUAL" แต่ไม่มีสาย DI ส่งไปเตือน BAS/SCADA',
      'เซนเซอร์ระดับน้ำมันเชื้อเพลิง (Fuel Level 4-20mA) คาลิเบรตผิดพลาด แสดงระดับน้ำมันเต็มทั้งที่น้ำมันใกล้หมด',
      'ขั้วต่อแบตเตอรี่สตาร์ต 24VDC ขึ้นขี้เกลือหรือหลวม ทำให้สตาร์ตไม่ติดขณะไฟดับ',
    ],
    ptogKeyRisks: [
      'SCADA ไม่สามารถสั่งสตาร์ตแบบ Remote Test ได้เนื่องจากถูก Interlock ด้วยกุญแจรีโมท',
      'การตั้งค่าสเกลของแรงดันและกระแส (เช่น x10 หรือ x100) ไม่ตรงกับ Controller Registers',
    ],
    standardSLA: 'Auto Start Signal to Full Voltage <= 10.0s, Fuel Level Warning @ 30%',
  },
  {
    interfaceId: 'INT-UPS',
    nameTh: 'อินเตอร์เฟสระบบไฟสำรองต่อเนื่อง UPS และระบบตรวจสอบแบตเตอรี่ BMS',
    nameEn: 'UPS Modular System & Battery Monitoring System Interface',
    scopeTh: 'เชื่อมโยง UPS-3A, UPS-3B, UMDB, Battery Strings 480VDC, Inverter/Rectifier/Bypass Status, Run Time Remaining, Cell IR/Temp',
    criticality: 'CRITICAL_TIER_IV',
    protocols: ['SNMP_V2_V3', 'MODBUS_TCP', 'HARDWIRED_IO'],
    primaryVendors: ['Vertiv (Liebert EXL)', 'Schneider Electric (Galaxy VX)', 'Eaton (9395)', 'Huawei'],
    ptopKeyRisks: [
      'สาย Hardwired EPO (Emergency Power Off) เดินปะปนกับสายกำลัง อาจถูกสัญญาณรบกวนสั่งทริปโดยไม่เจตนา',
      'ขั้วต่อเซนเซอร์วัดอุณหภูมิแบตเตอรี่แต่ละโมดูลหลวม นำไปสู่การประเมิน Thermal Runaway ล้มเหลว',
      'เบรกเกอร์แบตเตอรี่ DC Breaker Auxiliary Contact ไม่เปลี่ยนสถานะเมื่อปลดคัตเอาต์',
    ],
    ptogKeyRisks: [
      'SCADA อ้างอิง OID ของแบตเตอรี่ผิด ทำให้เวลาสำรองไฟ (Minutes Remaining) แสดงผลเป็นค่าว่าง',
      'เครือข่าย LAN ตกค้าง ทำให้ค่าเปอร์เซ็นต์โหลด (Load %) ของทั้งสองบัสไม่อัปเดตแบบเรียลไทม์',
      'การดึงค่า SNMP Trap ขาดหายในช่วงไฟดับฉับพลัน',
    ],
    standardSLA: 'Transfer Time = 0ms (Online Double Conversion), Telemetry Refresh <= 1.0s',
  },
  {
    interfaceId: 'INT-HVAC',
    nameTh: 'อินเตอร์เฟสระบบปรับอากาศดาต้าเซ็นเตอร์ (Chiller & CRAC Units)',
    nameEn: 'Precision Cooling, Chiller Plant & CRAC Units Interface',
    scopeTh: 'เชื่อมโยง Chiller, Chilled Water Pump, Cooling Tower, วาล์วปรับอัตโนมัติ, CRAC Unit 1-6 ในห้องดาต้าฮอลล์, อุณหภูมิ Supply/Return Temp, Water Leak Detector',
    criticality: 'MAJOR_REDUNDANT',
    protocols: ['BACNET_IP', 'BACNET_MSTP', 'MODBUS_RTU'],
    primaryVendors: ['Johnson Controls (York / Metasys)', 'Trane', 'Daikin', 'Schneider (Uniflair)', 'Stulz'],
    ptopKeyRisks: [
      'สายเซนเซอร์วัดอุณหภูมิ PT100 ชนิด 2 สาย มีค่าความต้านทานสายสูง ทำให้อ่านอุณหภูมิสูงกว่าความเป็นจริง 1-2°C (ควรใช้ PT100 3-Wire หรือ 4-Wire)',
      'สาย Water Leak Sensing Cable วางไม่แนบชิดพื้น หรือมีฝุ่นผงนำไฟฟ้าสะสมทำให้เกิด False Alarm',
      'สัญญาณควบคุมวาล์ว 0-10VDC เกิดแรงดันตกคร่อม (Voltage Drop) ทำให้วาล์วเปิดไม่สุด (แนะนำใช้ 4-20mA)',
    ],
    ptogKeyRisks: [
      'BACnet BBMD ไม่ได้คอนฟิก้ามข้าม IT Subnet ทำให้ Chiller Plant Manager มองไม่เห็นตัวสั่งการ SCADA',
      'การตั้งค่า COV ของอุณหภูมิถี่เกินไปจนทำให้เครือข่ายบัส MS/TP ค้างและไม่ตอบสนอง',
    ],
    standardSLA: 'Temperature Tolerance +/- 0.5°C, Leak Alarm Detection <= 3.0s',
  },
];

export const BAS_POINT_CHECKLIST: BasPointItem[] = [
  // --- HV SWITCHGEAR & TRANSFORMER ---
  {
    id: 'PT-01',
    tag: 'HV-SW-TRIP-DI',
    nameTh: 'สถานะทริปของรีเลย์ป้องกันระบบไฟฟ้า 22kV (Sepam/Micom)',
    nameEn: 'HV 22kV Protection Relay Common Trip Signal',
    deviceName: 'Schneider Sepam 40 / Micom P122 Protection Relay',
    registerOffset: 'X2:14 (Hardwired 24VDC Trip Loop)',
    subsystem: 'HV_SWITCHGEAR',
    subsystemName: 'ระบบไฟฟ้าแรงสูง 22kV',
    equipmentId: 'src-hv',
    signalType: 'DI',
    vendorProtocol: 'HARDWIRED_IO',
    vendorExample: 'Schneider Sepam / Micom Relay',
    hardwareAddress: 'Cabinet HV-01, Terminal X2:14 (24VDC Wetting Loop)',
    dataType: 'Dry Contact (Closed = Trip, Open = Normal)',
    engineeringUnit: 'Binary State (0=Normal, 1=Tripped)',
    nominalValue: '0 (Normal)',
    groundLoopPtoG: 'Galvanic isolation 2.5kV RMS on optical relay input; 24VDC battery charger (-) star-earthed at HV Substation PE bar',
    groundLoopStatus: 'GALVANIC_ISOLATED',
    ptopCheckpointTh:
      'ตรวจสอบแรงดันไฟเลี้ยง Wetting Voltage 24VDC จากตู้ DC Battery Charger วัดแรงดันตกคร่อมหน้าสัมผัส ทดสอบสับ Manual Trip ทดสอบการทำงานของ Aux Relay',
    ptogCheckpointTh:
      'ตรวจสอบ Logic Inversion ในโปรแกรม DDC/SCADA ต้องตั้งค่าให้สายขาดเป็น Fault (Fail-Safe), ตรวจสอบ Debounce Filter 30ms ป้องกัน Contact Bounce',
    testMethodTh: 'ฉีดสัญญาณทดสอบ Secondary Current Injection และจำลองทริปจาก Relay Test Set',
    status: 'NORMAL',
  },
  {
    id: 'PT-02',
    tag: 'TR1-OIL-TEMP-AI',
    nameTh: 'อุณหภูมิน้ำมันระบายความร้อนหม้อแปลง TR-1 (2000kVA)',
    nameEn: 'Transformer TR-1 Top Oil Temperature Sensor',
    deviceName: 'Qualitrol / Ekarat 2000kVA Transformer OTI Sensor',
    registerOffset: 'AI-02 (4-20mA Current Loop / 0-150°C)',
    subsystem: 'TRANSFORMER',
    subsystemName: 'หม้อแปลงไฟฟ้า TR-1',
    equipmentId: 'src-tr1',
    signalType: 'AI',
    vendorProtocol: 'HARDWIRED_IO',
    vendorExample: 'Qualitrol / Ekarat OTI Sensor',
    hardwareAddress: 'TR-1 Terminal Box, PT100 3-Wire / 4-20mA Transmitter',
    dataType: 'Analog 4-20mA Loop (0-150°C)',
    engineeringUnit: '°C',
    nominalValue: '55.4 °C (Limit < 85°C)',
    groundLoopPtoG: 'Single-point earth at PLC marshalling cabinet star-ground; sensor head isolated from transformer tank to prevent tank ground loop',
    groundLoopStatus: 'SINGLE_POINT_GROUNDED',
    ptopCheckpointTh:
      'ตรวจสอบการต่อสายชีลด์ Ground ที่ปลายด้าน Controller เท่านั้น วัดกระแสลูปด้วยมัลติมิเตอร์เทียบกับเกจหน้าตู้ (Calibrated 4mA = 0°C, 20mA = 150°C)',
    ptogCheckpointTh:
      'ตรวจจับ Broken Wire: หากกระแส < 3.6mA ต้องส่งสัญญาณ "Sensor Fault / Wire Broken" ห้ามแสดงผลเป็น 0°C หรือ 150°C',
    testMethodTh: 'ใช้ 4-20mA Current Calibrator (Fluke 789) ป้อนสัญญาณ 4, 8, 12, 16, 20mA ตรวจสอบค่าบน SCADA',
    status: 'NORMAL',
  },

  // --- MDB LOW VOLTAGE ---
  {
    id: 'PT-03',
    tag: 'MDB1A-V-LL-AI',
    nameTh: 'แรงดันไฟฟ้าระหว่างเฟส MDB-1A (V_LL Average)',
    nameEn: 'MDB-1A Line-to-Line Voltage Average',
    deviceName: 'Schneider Electric PowerLogic PM8000 Meter',
    registerOffset: '43028 (0x0BCB / 0-based: 3027 - V_LL Avg)',
    subsystem: 'MDB_LV',
    subsystemName: 'ตู้เมนกระจายไฟฟ้า MDB-1A',
    equipmentId: 'mdb-1a',
    signalType: 'MODBUS_REG',
    vendorProtocol: 'MODBUS_RTU',
    vendorExample: 'Schneider PM8000 / Siemens PAC4200',
    hardwareAddress: 'Modbus Slave ID 1, Holding Register 43028 (0x0BCB)',
    dataType: '32-Bit IEEE 754 Floating Point (Big-Endian with Word Swap)',
    engineeringUnit: 'V',
    nominalValue: '380.0 V (Nominal 380 - 400V)',
    groundLoopPtoG: 'RS-485 Belden 3106A shield drain wire grounded ONLY at MDB-1A Gateway; insulated with heat-shrink at meter end to eliminate 50Hz ground loop',
    groundLoopStatus: 'SINGLE_POINT_GROUNDED',
    ptopCheckpointTh:
      'ตรวจสอบสายคู่บิดเกลียว RS-485 (A+, B-, Shield) ตรวจสอบความถูกต้องของขั้ว ไม่ต่อสลับขั้ว ตรวจสอบความต้านทานปิดสาย 120Ω ที่มิเตอร์ตัวสุดท้าย',
    ptogCheckpointTh:
      'ตรวจสอบปัญหา Word Swap: หากได้ค่า 0.0000e-38 หรือตัวเลขมหาศาล ให้ตั้งค่า Gateway เป็น "Swap Words (CD-AB)"',
    testMethodTh: 'ใช้ Modbus Poll Tool อ่านรีจิสเตอร์เปรียบเทียบกับค่าบนหน้าจอดิจิทัลของมิเตอร์ PM8000',
    status: 'NORMAL',
  },
  {
    id: 'PT-04',
    tag: 'MDB1A-KW-AI',
    nameTh: 'กำลังไฟฟ้าจริงรวม MDB-1A (Total Active Power)',
    nameEn: 'MDB-1A Total Active Power (kW)',
    deviceName: 'Schneider Electric PowerLogic PM8000 Meter',
    registerOffset: '43060 (0x0BEB / 0-based: 3059 - kW Total)',
    subsystem: 'MDB_LV',
    subsystemName: 'ตู้เมนกระจายไฟฟ้า MDB-1A',
    equipmentId: 'mdb-1a',
    signalType: 'MODBUS_REG',
    vendorProtocol: 'MODBUS_RTU',
    vendorExample: 'Schneider PM8000',
    hardwareAddress: 'Modbus Slave ID 1, Holding Register 43060',
    dataType: '32-Bit Float',
    engineeringUnit: 'kW',
    nominalValue: '482.5 kW',
    groundLoopPtoG: 'Daisy-chained RS-485 segment; floating common reference line with 100Ω 1/2W series damper to prevent common-mode voltage saturation',
    groundLoopStatus: 'FLOATING_SHIELD',
    ptopCheckpointTh:
      'ตรวจสอบอัตราส่วนหม้อแปลงกระแส (CT Ratio e.g. 3000/5A) ที่ตั้งในตัวมิเตอร์ให้ตรงกับอุปกรณ์จริง หากตั้งผิดค่ากำลังไฟจะคูณผิดสัดส่วน',
    ptogCheckpointTh:
      'ตรวจสอบค่าติดลบ: หาก CT ต่อสลับขั้ว S1/S2 ค่า kW จะติดลบ (-482 kW) ซึ่งจะทำให้ค่า PUE ของ Data Center ผิดเพี้ยน',
    testMethodTh: 'เปรียบเทียบค่า V * I * sqrt(3) * PF กับค่ารวมที่อ่านได้จากรีจิสเตอร์ของมิเตอร์',
    status: 'NORMAL',
  },
  {
    id: 'PT-05',
    tag: 'MDB1A-ACB-STATUS-DI',
    nameTh: 'สถานะหน้าสัมผัสเมนเบรกเกอร์ ACB MDB-1A (Open/Closed)',
    nameEn: 'MDB-1A Main ACB Auxiliary Contact Status',
    deviceName: 'Schneider Masterpact MTZ2 3200A ACB (Aux OF1-OF2)',
    registerOffset: 'OF1-OF2 (Breaker Status Dry Contact)',
    subsystem: 'MDB_LV',
    subsystemName: 'ตู้เมนกระจายไฟฟ้า MDB-1A',
    equipmentId: 'mdb-1a',
    signalType: 'DI',
    vendorProtocol: 'HARDWIRED_IO',
    vendorExample: 'Masterpact MTZ OF (Open/Closed) Contact',
    hardwareAddress: 'MDB-1A Breaker Aux Terminal OF1-OF2 (24VDC Loop)',
    dataType: 'Dry Contact',
    engineeringUnit: 'Binary (0=Open, 1=Closed)',
    nominalValue: '1 (Closed)',
    groundLoopPtoG: 'Galvanically isolated dry contact; 24VDC wetting loop with RC snubber across terminal to suppress breaker contact bounce EMI',
    groundLoopStatus: 'GALVANIC_ISOLATED',
    ptopCheckpointTh:
      'ทดสอบวัดความต่อเนื่อง (Continuity Test) ขณะเบรกเกอร์สับเปิดและสับปิด ตรวจสอบแรงดัน 24VDC ไม่ตกคร่อมเกิน 1V',
    ptogCheckpointTh:
      'แมปสัญญาณเข้า SCADA Graphic: สีเขียว = Closed (จ่ายไฟตามมาตรฐานไทย/สากลที่ระบุ) สีแดง = Open/Tripped, ตรวจสอบการทำ Alarm Interlock',
    testMethodTh: 'ใช้ปุ่ม Manual Push-button สับเบรกเกอร์ทดสอบทั้งตำแหน่ง Test และ Connected',
    status: 'NORMAL',
  },
  {
    id: 'PT-06',
    tag: 'MDB1A-ACB-TRIP-DI',
    nameTh: 'สัญญาณแจ้งเตือนเบรกเกอร์ ACB MDB-1A ทริปตัดวงจร (SDE Fault)',
    nameEn: 'MDB-1A ACB Overcurrent/Earth Fault Trip (SDE Contact)',
    deviceName: 'Schneider Masterpact MTZ2 3200A ACB (Trip SDE)',
    registerOffset: 'SDE1-SDE2 (Fault Trip Dry Contact)',
    subsystem: 'MDB_LV',
    subsystemName: 'ตู้เมนกระจายไฟฟ้า MDB-1A',
    equipmentId: 'mdb-1a',
    signalType: 'DI',
    vendorProtocol: 'HARDWIRED_IO',
    vendorExample: 'Masterpact MTZ SDE Contact',
    hardwareAddress: 'MDB-1A Terminal SDE-1 / SDE-2',
    dataType: 'Dry Contact (Closed on Trip)',
    engineeringUnit: 'Binary (0=Normal, 1=Fault Tripped)',
    nominalValue: '0 (Normal)',
    groundLoopPtoG: 'Direct isolated alarm contact; separate conduit from busbars to avoid electromagnetic induction during high short-circuit faults',
    groundLoopStatus: 'GALVANIC_ISOLATED',
    ptopCheckpointTh:
      'ตรวจสอบสายสัญญาณทริป SDE แยกต่างหากจากสายคอนโทรลสับสวิตช์ เพื่อป้องกันไฟฟ้ากระชากเหนี่ยวนำข้ามสาย',
    ptogCheckpointTh:
      'เชื่อมโยงเข้าสู่ระบบ Alarm Priority: ต้องเป็นสัญญาณระดับ "CRITICAL / TIER RED ALERT" เด้งหน้าต่าง Popup และส่ง SMS/LINE/Email หาช่างทันที',
    testMethodTh: 'ใช้ Test Button บนหน้า Micrologic Trip Unit เพื่อจำลองการทริป',
    status: 'NORMAL',
  },

  // --- ATS TRANSFER SYSTEM ---
  {
    id: 'PT-07',
    tag: 'ATS1A-SOURCE-NORMAL-DI',
    nameTh: 'สถานะแหล่งจ่ายไฟหลักพร้อมใช้งาน ATS-1A (Source 1 Available)',
    nameEn: 'ATS-1A Normal Source Available Feedback',
    deviceName: 'Socomec ATyS p 4P 2500A Transfer Switch Controller',
    registerOffset: 'Terminals 101-102 (Source 1 Normal Available)',
    subsystem: 'ATS_TRANSFER',
    subsystemName: 'สวิตช์สลับแหล่งจ่ายไฟ ATS-1A',
    equipmentId: 'ats-1a',
    signalType: 'DI',
    vendorProtocol: 'HARDWIRED_IO',
    vendorExample: 'Socomec ATyS / ASCO 7000',
    hardwareAddress: 'ATS-1A Controller Terminal 101-102',
    dataType: 'Dry Contact',
    engineeringUnit: 'Binary (1=Available, 0=Failed)',
    nominalValue: '1 (Available)',
    groundLoopPtoG: 'Dry contact feedback loop; separate instrument ground bar (IE) connected to main data center ground ring (< 1.0 Ohm)',
    groundLoopStatus: 'SINGLE_POINT_GROUNDED',
    ptopCheckpointTh:
      'ตรวจสอบ Voltage Sensing Relay ของ ATS ตรวจจับแรงดันไฟเกิน/ไฟตก (+/- 10%) และตรวจจับความถี่ (47.5 - 52.5 Hz)',
    ptogCheckpointTh:
      'สร้าง SCADA Timer: หากไฟหลักดับเกิน 1.5 วินาที สัญญาณนี้ต้องเปลี่ยนเป็น 0 และทริกเกอร์ขั้นตอนเตรียมสตาร์ตเจนทันที',
    testMethodTh: 'จำลองการดับไฟตู้ MDB-1A ตรวจสอบสถานะการตกของสัญญาณ',
    status: 'NORMAL',
  },
  {
    id: 'PT-08',
    tag: 'ATS1A-POS-STATUS-AI',
    nameTh: 'ตำแหน่งของสวิตช์สลับแหล่งจ่าย ATS-1A (Position I / 0 / II)',
    nameEn: 'ATS-1A Switch Position Feedback (I=Norm, 0=Off, II=Emerg)',
    deviceName: 'Socomec ATyS p Modbus RS-485 Communication Card',
    registerOffset: '0x5000 (Holding Register 20481 - Switch Position)',
    subsystem: 'ATS_TRANSFER',
    subsystemName: 'สวิตช์สลับแหล่งจ่ายไฟ ATS-1A',
    equipmentId: 'ats-1a',
    signalType: 'MODBUS_REG',
    vendorProtocol: 'MODBUS_RTU',
    vendorExample: 'Socomec ATyS Modbus RTU',
    hardwareAddress: 'ATS Modbus Slave ID 3, Register 0x5000',
    dataType: '16-Bit Integer (1=Normal, 2=Emergency, 3=Neutral/Off)',
    engineeringUnit: 'State Code',
    nominalValue: '1 (Normal Source I)',
    groundLoopPtoG: 'Optocoupled RS-485 transceiver; 120-Ohm EOL termination resistor enabled; single-end shield grounding at ATS panel entry',
    groundLoopStatus: 'SINGLE_POINT_GROUNDED',
    ptopCheckpointTh:
      'ตรวจสอบระยะเวลาสลับขั้วและ Mechanical Interlock ไม่ให้เกิดการขนานเฟสโดยไม่ได้ตั้งใจ (Closed Transition vs Open Transition)',
    ptogCheckpointTh:
      'แมปภาพเคลื่อนไหวบน SCADA: ต้องแสดงทิศทางการไหลของกระแสไฟจากตู้ Generator เมื่อสวิตช์ย้ายไปตำแหน่ง II',
    testMethodTh: 'ทดสอบ Transfer Test ผ่านปุ่มบน ATS Controller บันทึกเวลาสลับ',
    status: 'NORMAL',
  },
  {
    id: 'PT-09',
    tag: 'ATS-GEN-START-DO',
    nameTh: 'คำสั่งสั่งสตาร์ตเครื่องกำเนิดไฟฟ้าฉุกเฉิน (Remote Engine Start Command)',
    nameEn: 'ATS to Generator Remote Auto-Start Command',
    deviceName: 'ATS Auto-Start Interposing Relay Panel (Omron MY4N)',
    registerOffset: 'Relay K1 Term 63-64 (Remote Gen Start Command)',
    subsystem: 'ATS_TRANSFER',
    subsystemName: 'สวิตช์สลับแหล่งจ่ายไฟ ATS System',
    equipmentId: 'src-gen',
    signalType: 'DO',
    vendorProtocol: 'HARDWIRED_IO',
    vendorExample: 'Interposing Relay Omron MY4N 24VDC',
    hardwareAddress: 'ATS-1A Panel Relay K1 (Terminals 63-64) -> Gen Controller Rem Start',
    dataType: 'Normally Open Relay Contact (Close to Start)',
    engineeringUnit: 'Binary (1=Start, 0=Stop)',
    nominalValue: '0 (Standby)',
    groundLoopPtoG: 'Interposing relay galvanic isolation 2.0kV; Flyback diode 1N4007 installed across 24VDC coil to prevent inductive flyback spikes',
    groundLoopStatus: 'GALVANIC_ISOLATED',
    ptopCheckpointTh:
      'ใช้สาย Shielded Control Cable ทนไฟ (Fire-Resistant Cable) ป้องกันสายละลายหากเกิดเหตุเพลิงไหม้ ตรวจสอบหน้าสัมผัสทนกระแสได้ไม่ต่ำกว่า 5A 24VDC',
    ptogCheckpointTh:
      'ระบบควบคุมต้องมี Safety Lockout: หากช่างกด "Generator Auto-Start: MANUAL" หรือ E-Stop หน้าตู้ สัญญาณ DO ต้องไม่สตาร์ตเครื่องจนเกิดอุบัติเหตุ',
    testMethodTh: 'จำลองไฟดับหลัก สังเกตรีเลย์ K1 สับหน้าสัมผัสภายใน 1.0 วินาที',
    status: 'NORMAL',
  },

  // --- EMERGENCY DIESEL GENERATOR ---
  {
    id: 'PT-10',
    tag: 'GEN-RUN-STATUS-DI',
    nameTh: 'สัญญาณเครื่องกำเนิดไฟฟ้าหมุนและจ่ายไฟสำเร็จ (Genset Running & Ready)',
    nameEn: 'Diesel Generator Running & Ready to Accept Load',
    deviceName: 'Deep Sea Electronics DSE8610 Genset Controller',
    registerOffset: 'Terminal 39 (Gen Running & Ready Contact)',
    subsystem: 'GENERATOR',
    subsystemName: 'เครื่องกำเนิดไฟฟ้า 2000kVA',
    equipmentId: 'src-gen',
    signalType: 'DI',
    vendorProtocol: 'HARDWIRED_IO',
    vendorExample: 'Deep Sea DSE8610 Auxiliary Contact',
    hardwareAddress: 'Genset Controller Terminal 39 (Gen Ready Output)',
    dataType: 'Dry Contact',
    engineeringUnit: 'Binary (1=Running, 0=Stopped)',
    nominalValue: '0 (Standby Offline)',
    groundLoopPtoG: 'Galvanically isolated solid-state relay output; generator engine chassis bonded to dedicated substation earth pit (< 5.0 Ohm)',
    groundLoopStatus: 'GALVANIC_ISOLATED',
    ptopCheckpointTh:
      'ตรวจสอบสัญญาณว่าอิงจากความเร็วรอบ (RPM > 1500) และแรงดันไฟฟ้า (Gen Voltage > 90%) ก่อนส่งคอนแทกต์ยืนยันความพร้อม',
    ptogCheckpointTh:
      'เชื่อมต่อเข้ากับ ATS Interlock: ห้าม ATS สับรับโหลดจนกว่าสัญญาณนี้จะยืนยันค่า 1',
    testMethodTh: 'สตาร์ตเครื่องในโหมด No-load Test ตรวจสอบเวลาตอบสนองจนคอนแทกต์ทำงาน (ต้องไม่เกิน 10 วินาทีตาม Tier SLA)',
    status: 'NORMAL',
  },
  {
    id: 'PT-11',
    tag: 'GEN-FUEL-LEVEL-AI',
    nameTh: 'ระดับน้ำมันดีเซลในถังรายวัน (Day Tank Fuel Level)',
    nameEn: 'Generator Day Tank Fuel Level (%)',
    deviceName: 'Wema / Afriso Ultrasonic Fuel Level Transmitter',
    registerOffset: 'AI-04 (4-20mA Current Loop / 0-100% Fuel)',
    subsystem: 'GENERATOR',
    subsystemName: 'เครื่องกำเนิดไฟฟ้า 2000kVA',
    equipmentId: 'src-gen',
    signalType: 'AI',
    vendorProtocol: 'HARDWIRED_IO',
    vendorExample: 'Wema / Afriso Ultrasonic Fuel Sensor',
    hardwareAddress: 'Day Tank Sensor Box -> BAS DDC AI-04 (4-20mA)',
    dataType: 'Analog 4-20mA (4mA = 0%, 20mA = 100%)',
    engineeringUnit: '%',
    nominalValue: '88.5 % (Alarm Low < 30%, Critical < 15%)',
    groundLoopPtoG: 'NAMUR NE43 2-wire loop powered with intrinsic safety galvanic zener barrier; tank body grounded to lightning protection earth',
    groundLoopStatus: 'SINGLE_POINT_GROUNDED',
    ptopCheckpointTh:
      'ตรวจสอบสารเคลือบหัววัดกันการกัดกร่อนจากน้ำมันดีเซล ตรวจสอบความถูกต้องของเส้นกราฟเทียบปริมาตรถัง (Liters vs Height %)',
    ptogCheckpointTh:
      'กำหนดระดับการเตือนภัยบน SCADA: Warning ที่ 50%, Major Alert ที่ 30% และสั่งเปิดปั๊มสูบน้ำมันอัตโนมัติ (Fuel Transfer Pump)',
    testMethodTh: 'ดึงหัววัดลอยตัวขึ้นทีละระดับ ตรวจสอบค่าแสดงผลบนหน้าจอ SCADA เทียบกับ Sight Glass ข้างถัง',
    status: 'NORMAL',
  },
  {
    id: 'PT-12',
    tag: 'GEN-TELEMETRY-MODBUS',
    nameTh: 'ข้อมูลการวัดเครื่องกำเนิดไฟฟ้าผ่านเน็ตเวิร์ก (kW, V, Freq, Coolant Temp)',
    nameEn: 'Genset Controller Multi-Variable Telemetry over Modbus TCP',
    deviceName: 'DSE8610 Modbus TCP/IP Network Gateway Module',
    registerOffset: 'Reg 1024-1060 (0x0400-0x0424 Composite Telemetry)',
    subsystem: 'GENERATOR',
    subsystemName: 'เครื่องกำเนิดไฟฟ้า 2000kVA',
    equipmentId: 'src-gen',
    signalType: 'MODBUS_REG',
    vendorProtocol: 'MODBUS_TCP',
    vendorExample: 'DSE8610 Modbus TCP Module',
    hardwareAddress: 'IP 192.168.10.45, Port 502, Reg 1024-1060',
    dataType: 'Multiple Holding Registers',
    engineeringUnit: 'Composite (V, A, kW, Hz, °C)',
    nominalValue: 'Freq 50.0Hz, Temp 82°C',
    groundLoopPtoG: 'Ethernet STP CAT6 shield bonded to IT rack ground bar; 1.5kV magnetic coupling transformers inside RJ45 magnetics',
    groundLoopStatus: 'GALVANIC_ISOLATED',
    ptopCheckpointTh:
      'ตรวจสอบสายเคเบิล Ethernet CAT6 ต่อเข้ากับ Switch ในห้องเครื่องกำเนิดไฟฟ้าที่ติดตั้งในตู้กันละอองน้ำมันและฝุ่น (IP65)',
    ptogCheckpointTh:
      'จัดทำ Poll Rate Throttling: สำหรับเครื่องกำเนิดไฟฟ้าช่วง Standby ให้อ่านทุก 5 วินาที แต่เมื่อสตาร์ตเครื่องให้เร่งรอบอ่านทุก 1.0 วินาที',
    testMethodTh: 'ทดสอบ Ping IP Address และใช้โปรแกรม Modbus Poll อ่านชุดข้อมูลต่อเนื่อง 30 นาทีตรวจเช็ค Packet Drop',
    status: 'NORMAL',
  },

  // --- UPS SYSTEM & BATTERY BMS ---
  {
    id: 'PT-13',
    tag: 'UPS3A-STATUS-SNMP',
    nameTh: 'สถานะโหมดการทำงานของ UPS-3A (Online / Inverter / Bypass / Battery)',
    nameEn: 'UPS-3A Operational Status via RFC 1628 SNMP MIB',
    deviceName: 'Vertiv Liebert EXL S1 400kVA UPS Unity Card',
    registerOffset: 'OID .1.3.6.1.2.1.33.1.2.1 (upsBatteryStatus)',
    subsystem: 'UPS_SYSTEM',
    subsystemName: 'ระบบสำรองไฟ UPS-3A',
    equipmentId: 'ups-3a',
    signalType: 'SNMP_OID',
    vendorProtocol: 'SNMP_V2_V3',
    vendorExample: 'Vertiv Liebert Unity / APC NMC3',
    hardwareAddress: 'OID .1.3.6.1.2.1.33.1.1.1 (upsIdentModel) & .1.3.6.1.2.1.33.1.2.1 (upsBatteryStatus)',
    dataType: 'SNMP OID Integer Enumeration (1=Unknown, 2=Normal/Online, 3=Battery, 4=Bypass)',
    engineeringUnit: 'Enum Code',
    nominalValue: '2 (Normal Online Double-Conversion)',
    groundLoopPtoG: 'Ethernet RJ45 with 1.5kV galvanic pulse transformer; isolated management network VLAN separated from high-power inverter noise',
    groundLoopStatus: 'GALVANIC_ISOLATED',
    ptopCheckpointTh:
      'ตรวจสอบไฟ Link/Act ของพอร์ตการ์ดสื่อสาร SNMP ตรวจสอบว่า IP Address และ Gateway ของการ์ดตั้งค่าถูกต้องบน Management Subnet',
    ptogCheckpointTh:
      'ตรวจสอบการคอมไพล์ RFC 1628 UPS-MIB ลงบน SCADA และตั้งค่า SNMP Trap Daemon ให้จับ Trap เลข 1 (upsTrapOnBattery) แบบ Real-time',
    testMethodTh: 'สั่งทดสอบ UPS Battery Self-Test ผ่านหน้าจอควบคุม ดูการเปลี่ยนค่าของ OID',
    status: 'NORMAL',
  },
  {
    id: 'PT-14',
    tag: 'UPS3A-BATT-MINUTES-SNMP',
    nameTh: 'เวลาสำรองไฟคงเหลือของแบตเตอรี่ UPS-3A (Estimated Minutes Remaining)',
    nameEn: 'UPS-3A Estimated Run Time Remaining (Minutes)',
    deviceName: 'Vertiv Liebert EXL S1 400kVA UPS Unity Card',
    registerOffset: 'OID .1.3.6.1.2.1.33.1.2.3 (upsEstimatedMinutesRemaining)',
    subsystem: 'UPS_SYSTEM',
    subsystemName: 'ระบบสำรองไฟ UPS-3A',
    equipmentId: 'ups-3a',
    signalType: 'SNMP_OID',
    vendorProtocol: 'SNMP_V2_V3',
    vendorExample: 'RFC 1628 UPS-MIB',
    hardwareAddress: 'OID .1.3.6.1.2.1.33.1.2.3 (upsEstimatedMinutesRemaining)',
    dataType: 'Integer32 (Minutes)',
    engineeringUnit: 'Minutes',
    nominalValue: '45 Minutes (At Current Load 75%)',
    groundLoopPtoG: 'SNMP over isolated Management OT VLAN; chassis ground tied to data hall Clean Technical Earth (CTE) busbar',
    groundLoopStatus: 'SINGLE_POINT_GROUNDED',
    ptopCheckpointTh:
      'ตรวจสอบเซนเซอร์วัดแรงดันและกระแสของ Battery String ในตู้ UPS ต้องได้ค่าแม่นยำเพื่อไม่ให้สูตรคำนวณ Run Time เพี้ยน',
    ptogCheckpointTh:
      'สร้างเงื่อนไขฉุกเฉินบน SCADA: หากเวลาสำรองไฟเหลือ < 15 นาที ให้ส่งสัญญาณแจ้งเตือนและเตรียม Shutdown Server โซน Non-Critical',
    testMethodTh: 'ปลดเบรกเกอร์อินพุตตู้ UPS ให้ใช้ไฟจากแบตเตอรี่ 2 นาที สังเกตตัวเลขนับถอยหลัง',
    status: 'NORMAL',
  },
  {
    id: 'PT-15',
    tag: 'BATT3A-STRING-V-AI',
    nameTh: 'แรงดันไฟตรงรวมสตริงแบตเตอรี่ Bank 3A (String DC Voltage)',
    nameEn: 'UPS-3A Battery Bank Total DC Bus Voltage',
    deviceName: 'BMS CellWatch / Vertiv Albér Battery Monitoring Gateway',
    registerOffset: 'Modbus Reg 30005 (0-based: 3004 / Scale x0.1 VDC)',
    subsystem: 'BATTERY_BMS',
    subsystemName: 'ชุดแบตเตอรี่สำรอง Bank 3A',
    equipmentId: 'batt-3a',
    signalType: 'MODBUS_REG',
    vendorProtocol: 'MODBUS_TCP',
    vendorExample: 'BMS CellWatch / Vertiv Albér',
    hardwareAddress: 'BMS Gateway IP 192.168.20.12, Modbus Reg 30005',
    dataType: '16-bit Integer with Scale Factor x0.1',
    engineeringUnit: 'VDC',
    nominalValue: '540.0 VDC (Float 2.25V/cell x 240 cells)',
    groundLoopPtoG: 'High-voltage DC isolation barrier (1000VDC rated optocoupler); battery rack framework earthed via copper tape to main earth bar',
    groundLoopStatus: 'GALVANIC_ISOLATED',
    ptopCheckpointTh:
      'วัดแรงดันจริงด้วย Digital Multimeter 1000V CAT III เทียบกับค่าที่ส่งจาก BMS ตรวจสอบการต่อสาย Hall Effect Current Sensor',
    ptogCheckpointTh:
      'ตรวจสอบ Scale Factor: รีจิสเตอร์ส่งมาเป็นค่า 5400 หาก SCADA ไม่ได้หาร 10 จะแสดงเป็น 5400V ซึ่งเกินพิกัดและแจ้ง Alarm เท็จ',
    testMethodTh: 'เทียบค่าอ่านกับเครื่องมือวัดภายนอกที่สอบเทียบแล้ว (Calibrated Meter)',
    status: 'NORMAL',
  },
  {
    id: 'PT-16',
    tag: 'BATT3A-CELL-TEMP-HIGH-DI',
    nameTh: 'สัญญาณแจ้งเตือนอุณหภูมิเซลล์แบตเตอรี่สูงผิดปกติ (Thermal Runaway Early Warning)',
    nameEn: 'Battery Cell High Temperature Alarm (Over 40°C)',
    deviceName: 'BMS CellWatch Thermal Runaway Detector Module',
    registerOffset: 'Alarm Relay Out 1 (Cell Over-Temp Contact)',
    subsystem: 'BATTERY_BMS',
    subsystemName: 'ชุดแบตเตอรี่สำรอง Bank 3A',
    equipmentId: 'batt-3a',
    signalType: 'DI',
    vendorProtocol: 'HARDWIRED_IO',
    vendorExample: 'BMS Dry Contact Output',
    hardwareAddress: 'BMS Controller Panel Alarm Relay Out 1',
    dataType: 'Dry Contact',
    engineeringUnit: 'Binary (1=Over-temp Alert, 0=Normal)',
    nominalValue: '0 (Normal)',
    groundLoopPtoG: 'Fail-safe normally closed (NC) dry contact loop; 24VDC wetting voltage isolated from battery string 480VDC potential',
    groundLoopStatus: 'GALVANIC_ISOLATED',
    ptopCheckpointTh:
      'ตรวจสอบตำแหน่งติดเซนเซอร์แนบขั้วบวก/ลบของแบตเตอรี่ ตรวจสอบว่าแผ่นความร้อนติดสนิทไม่หลุดร่วง',
    ptogCheckpointTh:
      'เชื่อมโยงเข้าสู่ระบบตัดไฟชาร์จอัตโนมัติ: หากอุณหภูมิเกิน 45°C ต้องส่งสัญญาณหยุดการชาร์จของ Rectifier ทันทีเพื่อป้องกันแบตเตอรี่ระเบิด',
    testMethodTh: 'ใช้ปุ่ม Test Relay บนตู้ BMS ตรวจสอบการตัดต่อหน้าสัมผัส',
    status: 'NORMAL',
  },

  // --- HVAC & CHILLER PLANT ---
  {
    id: 'PT-17',
    tag: 'CHIL-SUP-TEMP-AI',
    nameTh: 'อุณหภูมิน้ำเย็นจ่ายจากชิลเลอร์ (Chilled Water Supply Temperature)',
    nameEn: 'Chiller Plant Chilled Water Supply Temperature (CHW-ST)',
    deviceName: 'Johnson Controls York YK Centrifugal Chiller Plant',
    registerOffset: 'BACnet Object AI:1 (Present_Value / CHW Supply Temp)',
    subsystem: 'HVAC_CHILLER',
    subsystemName: 'ระบบทำความเย็นชิลเลอร์',
    equipmentId: 'chiller-plant',
    signalType: 'BACNET_OBJ',
    vendorProtocol: 'BACNET_IP',
    vendorExample: 'Johnson Controls Metasys / York Chiller',
    hardwareAddress: 'Device ID 101001, Object Analog-Input:1 (AI:1)',
    dataType: 'BACnet Real (Single Precision Float)',
    engineeringUnit: '°C',
    nominalValue: '7.2 °C (Setpoint 7.0°C +/- 0.5)',
    groundLoopPtoG: 'Ethernet BACnet IP over STP CAT6; shield drain grounded at BAS DDC panel star-ground; BBMD router isolation enabled',
    groundLoopStatus: 'SINGLE_POINT_GROUNDED',
    ptopCheckpointTh:
      'ใช้เซนเซอร์ RTD PT100 ชนิด Thermowell เสียบในท่อน้ำเย็น ทาซิลิโคนถ่ายเทความร้อน (Thermal Paste) เต็มช่องเสียบ ป้องกันการวัดคลาดเคลื่อน',
    ptogCheckpointTh:
      'ตรวจสอบ BBMD: หาก Workstation อยู่ VLAN 10 แต่ Chiller Controller อยู่ VLAN 20 ต้องเซ็ต Foreign Device Registration ให้ส่ง Broadcast ได้',
    testMethodTh: 'ใช้โปรแกรม YABE ทำการ ReadProperty AI:1 ตรวจสอบค่า Present_Value',
    status: 'NORMAL',
  },
  {
    id: 'PT-18',
    tag: 'CRAC1-RUN-FEEDBACK-DI',
    nameTh: 'สถานะการทำงานของเครื่องปรับอากาศห้องเซิร์ฟเวอร์ CRAC-1 (Run Feedback)',
    nameEn: 'Data Hall CRAC-1 Blower Fan Running Status',
    deviceName: 'Data Hall CRAC-1 Differential Pressure Switch (DPS)',
    registerOffset: 'Internal Terminal TB-2 (Fan Airflow Differential DI)',
    subsystem: 'HVAC_CHILLER',
    subsystemName: 'ระบบปรับอากาศ Data Hall (CRAC-1)',
    equipmentId: 'crac-1',
    signalType: 'DI',
    vendorProtocol: 'HARDWIRED_IO',
    vendorExample: 'Differential Pressure Switch (DPS) / VFD Run Relay',
    hardwareAddress: 'CRAC-1 Internal Terminal TB-2 (24VDC Loop)',
    dataType: 'Dry Contact',
    engineeringUnit: 'Binary (1=Running, 0=Stopped)',
    nominalValue: '1 (Running)',
    groundLoopPtoG: 'Non-powered mechanical microswitch dry contact; 24VDC wetting supply isolated from motor VFD inverter high-frequency noise',
    groundLoopStatus: 'GALVANIC_ISOLATED',
    ptopCheckpointTh:
      'ใช้ Differential Pressure Switch (DPS) ตรวจจับแรงดันลมจริงที่เป่าผ่านฟิลเตอร์ ไม่ใช้อิงเพียงแค่สัญญาณสั่งสตาร์ต (Command Echo) เพื่อป้องกันสายพานขาดแล้วไม่รู้',
    ptogCheckpointTh:
      'ใส่ฟังก์ชัน Delay Alarm (หน่วงเวลา 15 วินาทีหลังสั่งสตาร์ต) เพื่อรอให้แรงดันลมคงที่ก่อนเช็คสถานะ เพื่อไม่ให้เกิด Fault หลอก',
    testMethodTh: 'ปิดสวิตช์พัดลมชั่วคราว สังเกตการสลับสถานะจาก 1 เป็น 0 ภายใน 3 วินาที',
    status: 'NORMAL',
  },
  {
    id: 'PT-19',
    tag: 'DATA-HALL-LEAK-ALM-DI',
    nameTh: 'สัญญาณตรวจพบน้ำรั่วซึมใต้พื้นยกห้องดาต้าฮอลล์ (Underfloor Water Leak Alarm)',
    nameEn: 'Data Hall Raised Floor Zone-1 Water Leak Detector',
    deviceName: 'RLE SeaHawk Digital Water Leak Controller Module',
    registerOffset: 'Leader Cable TB 1-2 (Supervised 3-State Sensing Loop)',
    subsystem: 'HVAC_CHILLER',
    subsystemName: 'ระบบความปลอดภัยห้อง Data Hall',
    equipmentId: 'floor-leak-z1',
    signalType: 'DI',
    vendorProtocol: 'HARDWIRED_IO',
    vendorExample: 'RLE SeaHawk / TTK Digital Leak System',
    hardwareAddress: 'Leak Module Leader Cable Terminals 1-2',
    dataType: 'Supervised Loop with End-of-Line Resistor (Normal, Leak, Cable Break)',
    engineeringUnit: 'Tri-State (0=Normal, 1=Leak, 2=Cable Break)',
    nominalValue: '0 (Normal Dry)',
    groundLoopPtoG: 'Sensing cable polymer conductive core with end-of-line termination (EOL 47kΩ); isolated from raised floor steel pedestals',
    groundLoopStatus: 'FLOATING_SHIELD',
    ptopCheckpointTh:
      'ใช้สายตรวจจับแบบ Conductive Polymer Cable ขึงราบไปกับพื้นคอนกรีตใต้ท่อน้ำเย็น ทรานสมิตเตอร์ต้องมีตัวต้านทานปิดสาย EOL เพื่อให้ตรวจจับสายขาดได้',
    ptogCheckpointTh:
      'แสดงผลตำแหน่งจุดรั่ว (Distance in Meters) บนแผนผัง Floor Plan แบบเรียลไทม์เพื่อให้เจ้าหน้าที่เข้าแก้ไขได้ตรงจุด',
    testMethodTh: 'ใช้ผ้าชุบน้ำแตะสายเซนเซอร์ สังเกตไฟแดงและเสียง Buzzer เตือนบนตู้ และบนหน้าจอ SCADA ภายใน 3 วินาที',
    status: 'NORMAL',
  },
  {
    id: 'PT-20',
    tag: 'MDB1A-MODBUS-GATEWAY-HB',
    nameTh: 'สัญญาณตรวจเช็คการมีชีวิตของ Gateway ตู้ MDB (Gateway Heartbeat / Watchdog)',
    nameEn: 'MDB-1A Modbus Gateway Heartbeat Life-Signal',
    deviceName: 'Moxa MGate MB3180 / Schneider ComX 510 Gateway',
    registerOffset: 'Holding Register 40001 (0x0000 - Heartbeat Watchdog)',
    subsystem: 'MDB_LV',
    subsystemName: 'ตู้เมนกระจายไฟฟ้า MDB-1A',
    equipmentId: 'mdb-1a',
    signalType: 'MODBUS_REG',
    vendorProtocol: 'MODBUS_TCP',
    vendorExample: 'Moxa MGate / Schneider ComX',
    hardwareAddress: 'Gateway IP 192.168.10.10, Register 40001 (Incrementing Counter)',
    dataType: 'UInt16 Counter (0-65535)',
    engineeringUnit: 'Ticks',
    nominalValue: 'Dynamic Incrementing',
    groundLoopPtoG: 'Dual power input with surge suppression; gateway metal casing bonded to cabinet copper busbar; RS-485 port opto-isolated 2kV',
    groundLoopStatus: 'SINGLE_POINT_GROUNDED',
    ptopCheckpointTh:
      'ตรวจสอบสายดินของโครงสร้าง Gateway Chassis ไม่ให้มีไฟฟ้ารั่วจากสวิตช์บอร์ดเข้ามาทำลายพอร์ตสื่อสาร',
    ptogCheckpointTh:
      'SCADA Watchdog Timer: หากค่าตัวเลขนับไม่เปลี่ยนเกิน 10 วินาที ให้ขึ้นเตือน "MDB-1A Comms Gateway Frozen / Offline"',
    testMethodTh: 'ดึงสาย LAN ออก 15 วินาที สังเกตการแจ้งเตือน Comms Offline บนหน้าจอ SCADA',
    status: 'NORMAL',
  },
];

export interface SimulatedFaultOption {
  id: string;
  code: string;
  titleTh: string;
  titleEn: string;
  category: 'PtoP' | 'PtoG';
  affectedProtocols: VendorProtocolType[];
  affectedPointIds: string[];
  symptomTh: string;
  rootCauseTh: string;
  resolutionTh: string;
  standardReference: string;
}

export const SIMULATED_FAULTS: SimulatedFaultOption[] = [
  {
    id: 'FAULT-01',
    code: 'WORD_SWAP_ERROR',
    titleTh: 'ความผิดพลาดการสลับ Word (Float32 Little-Endian Word Swap)',
    titleEn: 'Modbus 32-Bit Float Byte/Word Order Mismatch',
    category: 'PtoG',
    affectedProtocols: ['MODBUS_RTU', 'MODBUS_TCP'],
    affectedPointIds: ['PT-03', 'PT-04'],
    symptomTh:
      'ค่าแรงดันไฟฟ้า 380V และกำลังไฟฟ้า kW บนหน้าจอ SCADA แสดงผลเป็นตัวเลขขยะ เช่น 1.401E-45 หรือ 0.000000 V ทั้งที่เครื่องมือวัดหน้าตู้แสดงค่าปกติสมบูรณ์',
    rootCauseTh:
      'สถาปัตยกรรมของมิเตอร์ส่งข้อมูลแบบ Modicon Word Order (Low Word First / CD-AB) แต่โปรแกรม Gateway ฝั่ง SCADA ดึงค่าแบบ Standard IEEE-754 (High Word First / AB-CD)',
    resolutionTh:
      'เปิดหน้าต่างตั้งค่า Device Driver ใน Gateway หรือ SCADA Driver แล้วเลือกเครื่องหมายถูกที่ช่อง "Swap Words" หรือ "Reverse Register Order" สำหรับแท็ก 32-bit Float',
    standardReference: 'Modbus Application Protocol Specification V1.1b3 / IEEE 754-2019',
  },
  {
    id: 'FAULT-02',
    code: 'SHIELD_GROUND_LOOP',
    titleTh: 'ปัญหากราวด์ลูปในสายชีลด์ RS-485 (Shield Ground Loop Noise)',
    titleEn: 'Two-End Shield Grounding Inducing 50Hz AC Common-Mode Noise',
    category: 'PtoP',
    affectedProtocols: ['MODBUS_RTU', 'BACNET_MSTP'],
    affectedPointIds: ['PT-03', 'PT-08'],
    symptomTh:
      'การสื่อสารบนสาย RS-485 หลุดติดๆ ดับๆ มี CRC Error Rate สูงกว่า 20% และมีหน้าสัมผัส DI สั่นส่ง Alarm กระพริบถี่เป็นจังหวะ 50Hz โดยเฉพาะช่วงโหลดสูง',
    rootCauseTh:
      'ช่างต่อสายต่อ Drain Wire ของ Shield เข้ากับโครงตู้สวิตช์บอร์ดทั้ง 2 ฝั่ง (ต้นทางและปลายทาง) เนื่องจากศักย์ไฟฟ้ากราวด์ของตู้ทั้งสองต่างกัน ทำให้เกิดกระแสหมุนวน (Circulating Current) วิ่งผ่านสายชีลด์เหนี่ยวนำสัญญาณรบกวนเข้าสายแกนนำสัญญาณ',
    resolutionTh:
      'ตัดการต่อลงกราวด์ของสายชีลด์ที่ฝั่งปลายทางออก ให้ต่อลงกราวด์เพียงจุดเดียว (Single-Point Earth Ground) ที่ตู้ Gateway หลักเท่านั้น และใส่ฉนวนหุ้มปลายสายชีลด์ฝั่งปลายทางไม่ให้แตะโครงตู้',
    standardReference: 'TIA/EIA-485-A Appendix D / IEEE 1100 Emerald Book Grounding',
  },
  {
    id: 'FAULT-03',
    code: 'REGISTER_OFFSET_SHIFT',
    titleTh: 'ปัญหา Register Offset เลื่อน 1 ตำแหน่ง (1-Based vs 0-Based)',
    titleEn: 'Register Addressing Shift: 40001 (PLC) vs 0000 (Protocol)',
    category: 'PtoG',
    affectedProtocols: ['MODBUS_RTU', 'MODBUS_TCP'],
    affectedPointIds: ['PT-04', 'PT-15'],
    symptomTh:
      'อ่านค่าจากมิเตอร์ได้ข้อมูลของพารามิเตอร์อื่น เช่น ต้องการอ่าน Total Active Power (kW) แต่กลับได้ค่า Reactive Power (kVAR) หรืออ่านได้ 0 ผิดช่อง',
    rootCauseTh:
      'คู่มือมิเตอร์ระบุตำแหน่งรีจิสเตอร์แบบ 1-based (เช่น 43060) แต่วิศวกรนำตัวเลข 43060 ไปใส่ในซอฟต์แวร์ที่ใช้ระบบ Address แบบ 0-based ทำให้ Request ที่ส่งออกไปอ่านกลายเป็น 43061 ของอุปกรณ์',
    resolutionTh:
      'ตรวจสอบข้อกำหนดของ SCADA Driver: หากเป็น 0-based ให้ลบ 1 ออกจากแอดเดรสในคู่มือ (เช่น 43060 ต้องกรอก 43059 หรือ 3059 ตามประเภท Function Code 03/04)',
    standardReference: 'Modbus Protocol Reference Guide PI-MBUS-300 Rev J',
  },
  {
    id: 'FAULT-04',
    code: 'BACNET_DUP_INSTANCE',
    titleTh: 'ปัญหา BACnet Device Instance ID ซ้ำซ้อน (Duplicate Device ID)',
    titleEn: 'BACnet Duplicate Device Instance Collision on Network',
    category: 'PtoG',
    affectedProtocols: ['BACNET_IP', 'BACNET_MSTP'],
    affectedPointIds: ['PT-17'],
    symptomTh:
      'อุปกรณ์ Chiller Controller หรือ CRAC ติดๆ ดับๆ หายไปจากหน้ากราฟิก SCADA สลับกันไปมา ส่งผลให้ค่าอุณหภูมิน้ำเย็นไม่อัปเดต',
    rootCauseTh:
      'ผู้รับเหมา Commissioning 2 รายตั้งค่า Default Device ID เป็นเลขเดียวกัน (เช่น 1000) บนอุปกรณ์คนละตัว ทำให้เวลา SCADA ส่ง Who-Is หรือดึงข้อมูล เกิดการตอบสนองชนกัน',
    resolutionTh:
      'ใช้โปรแกรม Wireshark หรือ BACnet Browser สแกนตรวจหา MAC Address ของ Device ID ที่ซ้ำกัน แล้วเข้าปรับตั้งค่า Device Instance ID ใหม่ให้มีเอกลักษณ์ไม่ซ้ำกันทั่วทั้งระบบตามแบบแผนผัง',
    standardReference: 'ANSI/ASHRAE Standard 135-2020 Clause 19 (BACnet Protocol)',
  },
  {
    id: 'FAULT-05',
    code: 'CURRENT_LOOP_BROKEN',
    titleTh: 'ปัญหาลูปสายสัญญาณ 4-20mA ขาด (Broken Loop Current < 3.6mA)',
    titleEn: 'Analog 4-20mA Broken Loop Wire Condition',
    category: 'PtoP',
    affectedProtocols: ['HARDWIRED_IO'],
    affectedPointIds: ['PT-02', 'PT-11'],
    symptomTh:
      'อุณหภูมิน้ำมันหม้อแปลง หรือระดับน้ำมันเชื้อเพลิงถังเจนเนอเรเตอร์แสดงผลเป็นค่าลบ หรือแสดงผล 0% ตลอดเวลา และระบบเตือนภัยเงียบผิดปกติ',
    rootCauseTh:
      'สายสัญญาณ AI ขั้วหลุดจากเทอร์มินอลบล็อก หรือสายภายในขาด กระแสในลูปจึงไหลเป็น 0.0mA ซึ่งต่ำกว่าค่า Live Zero (4.0mA)',
    resolutionTh:
      'ซ่อมแซมจุดเชื่อมต่อสายไฟ ขันน็อตเทอร์มินอลให้แน่นหนาด้วยแรงบิดตามสเปก และเขียนโปรแกรม PLC ให้มีฟังก์ชัน Live Zero Checking: หากกระแส < 3.6mA ให้ทริกเกอร์ Sensor Fault Alarm ทันที',
    standardReference: 'NAMUR NE 43 (Standardization of the Signal Level for Failure Information)',
  },
  {
    id: 'FAULT-06',
    code: 'RS485_NO_TERMINATION',
    titleTh: 'ขาดตัวต้านทานปิดหัวท้ายสาย 120Ω (Missing EOL Terminator)',
    titleEn: 'Missing 120-Ohm End-of-Line Bus Terminator Reflection',
    category: 'PtoP',
    affectedProtocols: ['MODBUS_RTU'],
    affectedPointIds: ['PT-03', 'PT-04', 'PT-08'],
    symptomTh:
      'เมื่อต่ออุปกรณ์มากกว่า 10 ตัวบนสาย หรือความยาวสายเกิน 60 เมตร จะเริ่มอ่านข้อมูลไม่ติด เกิด Time-out ถี่ขึ้นเมื่อตั้ง Baud Rate สูง (38400 bps ขึ้นไป)',
    rootCauseTh:
      'ปลายสายเปิดโล่ง (Open-circuit) ทำให้คลื่นสัญญาณความถี่สูงวิ่งไปชนปลายสายแล้วสะท้อนกลับ (Signal Reflection) ซ้อนทับกับสัญญาณจริงจนรูปคลื่นบิดเบี้ยว',
    resolutionTh:
      'ติดตั้งตัวต้านทาน 120 โอห์ม 1/4 วัตต์ (Tolerance 1%) คร่อมระหว่างขั้ว A และ B ที่อุปกรณ์ตัวแรก (Gateway) และอุปกรณ์ตัวสุดท้ายบนสาย Daisy-chain เพียง 2 จุดเท่านั้น',
    standardReference: 'EIA/TIA-485 Standard Transmission Lines Design Guide',
  },
];
