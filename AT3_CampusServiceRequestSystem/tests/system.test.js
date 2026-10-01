'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const StudentRequester = require('../src/models/StudentRequester');
const StaffRequester = require('../src/models/StaffRequester');
const ServiceOfficer = require('../src/models/ServiceOfficer');
const Technician = require('../src/models/Technician');
const ICTSupportRequest = require('../src/models/ICTSupportRequest');
const MaintenanceRequest = require('../src/models/MaintenanceRequest');
const CleaningRequest = require('../src/models/CleaningRequest');
const ServiceRequestManager = require('../src/managers/ServiceRequestManager');
const ServiceRequestFactory = require('../src/models/ServiceRequestFactory');
const UserFileRepository = require('../src/repositories/UserFileRepository');
const ServiceRequestFileRepository = require('../src/repositories/ServiceRequestFileRepository');

async function tmpFile(name) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'csrs-test-'));
  return path.join(dir, name);
}

function buildFixtures() {
  const student = new StudentRequester({
    userId: 'S001', firstName: 'Alice', lastName: 'Kora', email: 'alice@dwu.ac.pg',
    programme: 'IS', yearLevel: 3,
  });
  const officer = new ServiceOfficer({
    userId: 'O001', firstName: 'Bob', lastName: 'Maru', email: 'bob@dwu.ac.pg',
    serviceSection: 'ICT',
  });
  const tech = new Technician({
    userId: 'T001', firstName: 'Carl', lastName: 'Naki', email: 'carl@dwu.ac.pg',
    speciality: 'Networking',
  });
  return { student, officer, tech };
}

function buildRequest(student, overrides = {}) {
  return new ICTSupportRequest({
    requestId: 'REQ001',
    requester: student,
    title: 'WiFi down',
    description: 'Cannot connect in library',
    campusLocation: 'Library L2',
    category: 'ICT Support',
    priority: 'High',
    deviceType: 'Laptop',
    systemName: 'Campus WiFi',
    faultType: 'Connectivity',
    networkImpact: true,
    ...overrides,
  });
}

//  This are the Valid object construction for the system test
test('valid user construction', () => {
  const { student } = buildFixtures();
  assert.equal(student.getFullName(), 'Alice Kora');
  assert.equal(student.userType, 'StudentRequester');
});

//These are the Invalid constructor values for the system test
test('invalid email is rejected', () => {
  assert.throws(() => new StaffRequester({
    userId: 'S2', firstName: 'X', lastName: 'Y', email: 'not-an-email', department: 'HR',
  }), /Invalid email/);
});

// 3. This code identifies Duplicate values
test('duplicate user ID is rejected', () => {
  const { student } = buildFixtures();
  const mgr = new ServiceRequestManager();
  mgr.registerUser(student);
  assert.throws(() => mgr.registerUser(student), /Duplicate user ID/);
});

// 4. This gives Role permissions
test('only Service Officer can review', () => {
  const { student } = buildFixtures();
  const mgr = new ServiceRequestManager();
  mgr.registerUser(student);
  const req = buildRequest(student);
  mgr.submitRequest(req);
  assert.throws(() => mgr.reviewRequest(req.requestId, student.userId, 'High'), /ServiceOfficer/);
});

// 5. Controlled status transitions
test('invalid status transition is rejected', () => {
  const { student } = buildFixtures();
  const req = buildRequest(student);
  assert.throws(() => req.changeStatus('Closed', student), /Invalid status transition/);
});

// 6. Specialised behaviour
test('specialised override differs from base', () => {
  const { student } = buildFixtures();
  const ict = buildRequest(student);
  const cln = new CleaningRequest({
    requestId: 'REQ002', requester: student, title: 'Clean lab',
    description: 'Spilled drink', campusLocation: 'Lab A', category: 'Cleaning and Sanitation',
    priority: 'High', cleaningArea: 'Lab A', hygieneRisk: true, serviceType: 'Sanitisation',
  });
  assert.notEqual(ict.calculatePriorityScore(), cln.calculatePriorityScore());
});

// 7. Polymorphic method calls
test('polymorphic calls return per-subclass values', () => {
  const { student } = buildFixtures();
  const reqs = [
    buildRequest(student),
    new MaintenanceRequest({
      requestId: 'REQ003', requester: student, title: 'Leak', description: 'Pipe leak',
      campusLocation: 'Block B', category: 'Facilities Maintenance', priority: 'Urgent',
      building: 'B', roomNumber: '12', hazardLevel: 'High', equipmentAffected: 'Pipe',
    }),
  ];
  const results = reqs.map((r) => r.getTargetResolutionHours());
  assert.ok(results.every((h) => typeof h === 'number' && h > 0));
});

// 8. Saving JSON data
test('user repository saves and reloads users', async () => {
  const file = await tmpFile('users.json');
  const repo = new UserFileRepository(file);
  const { student, officer } = buildFixtures();
  await repo.saveAll([student, officer]);
  const repo2 = new UserFileRepository(file);
  const loaded = await repo2.loadAll();
  assert.equal(loaded.length, 2);
  assert.equal(loaded[0].constructor.name, 'StudentRequester');
});

// 9. Loading / restoring specialised objects
test('request factory restores the correct subclass', async () => {
  const { student } = buildFixtures();
  const req = buildRequest(student);
  const restored = ServiceRequestFactory.createFromData(req.toJSON(), { [student.userId]: student });
  assert.equal(restored.constructor.name, 'ICTSupportRequest');
  assert.equal(restored.networkImpact, true);
});

// 10. Missing data file returns []
test('missing data file returns empty array and is created', async () => {
  const file = await tmpFile('missing.json');
  const repo = new UserFileRepository(file);
  const result = await repo.loadAll();
  assert.deepEqual(result, []);
  const stat = await fs.stat(file);
  assert.ok(stat.isFile());
});

// 11. Report calculations
test('report calculations work', () => {
  const { student } = buildFixtures();
  const mgr = new ServiceRequestManager();
  mgr.registerUser(student);
  mgr.submitRequest(buildRequest(student));
  mgr.submitRequest(buildRequest(student, { requestId: 'REQ099', title: 'Other' }));
  const summary = mgr.getRequestSummaryByStatus();
  assert.equal(summary.Submitted, 2);
});

// 12. File-writing error handling
test('saveAll rejects non-array input', async () => {
  const file = await tmpFile('bad.json');
  const repo = new UserFileRepository(file);
  await assert.rejects(() => repo.saveAll('not-an-array'));
});
