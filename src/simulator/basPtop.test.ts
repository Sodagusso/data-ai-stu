import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BAS_POINT_CHECKLIST,
  PROTOCOL_DEEP_DIVES,
  INTERFACE_SUMMARIES,
  SIMULATED_FAULTS,
} from './basPtopData.js';

test('BAS Points Checklist has all 20 required points with full attributes', () => {
  assert.equal(BAS_POINT_CHECKLIST.length, 20);

  BAS_POINT_CHECKLIST.forEach((pt) => {
    assert.ok(pt.id, 'Point must have an id');
    assert.ok(pt.tag, 'Point must have a tag');
    assert.ok(pt.nameTh, 'Point must have a Thai name');
    assert.ok(pt.nameEn, 'Point must have an English name');
    assert.ok(pt.deviceName, 'Point must have a Device Name');
    assert.ok(pt.registerOffset, 'Point must have a Register Offset');
    assert.ok(pt.groundLoopPtoG, 'Point must have a Ground Loop PtoG topology');
    assert.ok(pt.groundLoopStatus, 'Point must have a Ground Loop Status');
    assert.ok(pt.hardwareAddress, 'Point must specify hardware address');
    assert.ok(pt.ptopCheckpointTh, 'Point must specify PtoP checkpoint');
    assert.ok(pt.ptogCheckpointTh, 'Point must specify PtoG checkpoint');
    assert.ok(pt.testMethodTh, 'Point must specify commissioning test method');
  });
});

test('All 6 Core Subsystem Interfaces are defined with SLA and vendors', () => {
  assert.equal(INTERFACE_SUMMARIES.length, 6);
  const ids = INTERFACE_SUMMARIES.map((i) => i.interfaceId);
  assert.ok(ids.includes('INT-HV'));
  assert.ok(ids.includes('INT-MDB'));
  assert.ok(ids.includes('INT-ATS'));
  assert.ok(ids.includes('INT-GEN'));
  assert.ok(ids.includes('INT-UPS'));
  assert.ok(ids.includes('INT-HVAC'));
});

test('Protocol Deep-Dives cover Modbus, BACnet, SNMP, and Hardwired/IEC', () => {
  assert.equal(PROTOCOL_DEEP_DIVES.length, 5);
  const protocols = PROTOCOL_DEEP_DIVES.map((p) => p.protocol);
  assert.ok(protocols.includes('MODBUS_RTU'));
  assert.ok(protocols.includes('MODBUS_TCP'));
  assert.ok(protocols.includes('BACNET_IP'));
  assert.ok(protocols.includes('SNMP_V2_V3'));
  assert.ok(protocols.includes('HARDWIRED_IO'));

  PROTOCOL_DEEP_DIVES.forEach((p) => {
    assert.ok(p.pitfallsPtoP.length > 0, 'Must have PtoP pitfalls');
    assert.ok(p.pitfallsPtoG.length > 0, 'Must have PtoG pitfalls');
    assert.ok(p.recommendedBestPractices.length > 0, 'Must have Best practices');
  });
});

test('Simulated faults map to existing point IDs and contain resolutions', () => {
  assert.equal(SIMULATED_FAULTS.length, 6);
  const pointIds = new Set(BAS_POINT_CHECKLIST.map((p) => p.id));

  SIMULATED_FAULTS.forEach((f) => {
    assert.ok(f.titleTh, 'Fault must have Thai title');
    assert.ok(f.rootCauseTh, 'Fault must have Root cause');
    assert.ok(f.resolutionTh, 'Fault must have Resolution');
    f.affectedPointIds.forEach((pid) => {
      assert.ok(pointIds.has(pid), `Fault ${f.id} references invalid point ID ${pid}`);
    });
  });
});
