/**This is the main program of the Campus Service Request System. It connects all the classes 
together so users can register/sign in, submit service requests, update or cancel requests
assign technicians, track progress, and generate reports
*/
'use strict';

const path = require('path');
const readline = require('readline/promises');
const { stdin, stdout } = require('process');

const UserFactory = require('./models/UserFactory');
const StudentRequester = require('./models/StudentRequester');
const StaffRequester = require('./models/StaffRequester');
const ServiceOfficer = require('./models/ServiceOfficer');
const Technician = require('./models/Technician');

const ICTSupportRequest = require('./models/ICTSupportRequest');
const MaintenanceRequest = require('./models/MaintenanceRequest');
const CleaningRequest = require('./models/CleaningRequest');
const GeneralServiceRequest = require('./models/GeneralServiceRequest');

const ServiceRequestManager = require('./managers/ServiceRequestManager');

const UserFileRepository = require('./repositories/UserFileRepository');
const ServiceRequestFileRepository = require('./repositories/ServiceRequestFileRepository');
const RequestHistoryFileRepository = require('./repositories/RequestHistoryFileRepository');
const AuditFileRepository = require('./repositories/AuditFileRepository');

const { CATEGORIES, PRIORITIES } = require('./utils/validators');

const DATA_DIR = path.join(__dirname, '..', 'data');

const rl = readline.createInterface({ input: stdin, output: stdout });

// ----- helpers
const line = '='.repeat(46);
const thin = '-'.repeat(46);

function banner(title) {
  console.log(`\n${line}\n${title}\n${line}`);
}

async function ask(prompt) {
  return (await rl.question(prompt)).trim();
}

async function askRequired(prompt) {
  let value = '';
  while (!value) {
    value = await ask(prompt);
    if (!value) console.log('  ! This field is required.');
  }
  return value;
}

function printRequests(requests) {
  if (!requests || requests.length === 0) {
    console.log('  (no requests)');
    return;
  }
  for (const r of requests) {
    console.log(`${thin}`);
    console.log(`  ${r.requestId} | ${r.status.padEnd(12)} | ${r.priority.padEnd(6)} | ${r.title}`);
    console.log(`  Type: ${r.constructor.name.padEnd(22)} Requester: ${r.requester.getFullName()}`);
  }
  console.log(thin);
}

// -- application
class CampusServiceApp {
  constructor() {
    this.userRepo = new UserFileRepository(path.join(DATA_DIR, 'users.json'));
    this.requestRepo = new ServiceRequestFileRepository(path.join(DATA_DIR, 'serviceRequests.json'));
    this.historyRepo = new RequestHistoryFileRepository(path.join(DATA_DIR, 'requestHistory.json'));
    this.auditRepo = new AuditFileRepository(path.join(DATA_DIR, 'auditLog.json'));

    this.manager = new ServiceRequestManager();
    this.currentUser = null;
    this.nextRequestNumber = 1;
  }

  async initialise() {
    banner('Loading data');
    const users = await this.userRepo.loadAll();
    const userMap = Object.fromEntries(users.map((u) => [u.userId, u]));

    const requests = await this.requestRepo.loadAll(userMap);
    const audit = await this.auditRepo.loadAll();

    this.manager = new ServiceRequestManager({
      users,
      requests,
      auditTrail: audit,
    });

    // compute next request number from existing IDs (REQ###)
    const maxN = requests.reduce((max, r) => {
      const m = /^REQ(\d+)$/.exec(r.requestId);
      return m ? Math.max(max, Number(m[1])) : max;
    }, 0);
    this.nextRequestNumber = maxN + 1;

    console.log(`  Loaded ${users.length} user(s), ${requests.length} request(s), ${audit.length} audit record(s).`);
  }

  // -- login flow
  async chooseUser() {
    banner('Select / Register user');
    console.log('  1. Register new user');
    console.log('  2. Sign in as existing user');
    console.log('  3. Continue without signing in (view only)');
    const choice = await ask('Choice: ');

    if (choice === '1') return this.registerUserFlow();
    if (choice === '2') return this.signInFlow();
    this.currentUser = null;
    return null;
  }

  async registerUserFlow() {
    banner('Register new user');
    console.log('  Types: 1 StudentRequester  2 StaffRequester  3 ServiceOfficer  4 Technician');
    const typeChoice = await ask('User type: ');
    const typeMap = { 1: 'StudentRequester', 2: 'StaffRequester', 3: 'ServiceOfficer', 4: 'Technician' };
    const userType = typeMap[typeChoice];
    if (!userType) {
      console.log('  ! Invalid user type.');
      return null;
    }

    try {
      const userId = await askRequired('User ID: ');
      const firstName = await askRequired('First name: ');
      const lastName = await askRequired('Last name: ');
      const email = await askRequired('Email: ');

      let user;
      if (userType === 'StudentRequester') {
        const programme = await askRequired('Programme: ');
        const yearLevel = Number(await askRequired('Year level (1-6): '));
        user = new StudentRequester({ userId, firstName, lastName, email, programme, yearLevel });
      } else if (userType === 'StaffRequester') {
        const department = await askRequired('Department: ');
        user = new StaffRequester({ userId, firstName, lastName, email, department });
      } else if (userType === 'ServiceOfficer') {
        const serviceSection = await askRequired('Service section: ');
        user = new ServiceOfficer({ userId, firstName, lastName, email, serviceSection });
      } else {
        const speciality = await askRequired('Technical speciality: ');
        user = new Technician({ userId, firstName, lastName, email, speciality });
      }

      this.manager.registerUser(user);
      await this.userRepo.create(user);
      await this.auditRepo.saveAll(this.manager.serializeAudit());
      this.currentUser = user;
      console.log(`  ✔ Registered ${user.getFullName()} (${user.userType}).`);
      return user;
    } catch (err) {
      console.log(`  ! ${err.message}`);
      return null;
    }
  }

  async signInFlow() {
    banner('Sign in');
    const all = this.manager.getAllUsers();
    if (all.length === 0) {
      console.log('  No users have been registered yet.');
      return null;
    }
    all.forEach((u, i) => console.log(`  ${i + 1}. ${u.displayInfo()}`));
    const id = await ask('Enter user ID (blank to cancel): ');
    if (!id) return null;
    const user = this.manager.findUserById(id);
    if (!user) {
      console.log('  ! User not found.');
      return null;
    }
    this.currentUser = user;
    console.log(`  ✔ Signed in as ${user.getFullName()} (${user.userType}).`);
    return user;
  }

  // workflows
  async submitRequestFlow() {
    if (!this.currentUser) return console.log('  ! Please register or sign in first.');
    if (!['StudentRequester', 'StaffRequester'].includes(this.currentUser.userType)) {
      return console.log('  ! Only requesters can submit requests.');
    }

    banner('Submit Service Request');
    console.log('  Categories:');
    CATEGORIES.forEach((c, i) => console.log(`    ${i + 1}. ${c}`));
    const catChoice = Number(await ask('Choose category: '));
    const category = CATEGORIES[catChoice - 1];
    if (!category) return console.log('  ! Invalid category.');

    try {
      const title = await askRequired('Title: ');
      const description = await askRequired('Description: ');
      const campusLocation = await askRequired('Campus location: ');
      const requestId = `REQ${String(this.nextRequestNumber).padStart(3, '0')}`;

      const base = {
        requestId,
        requester: this.currentUser,
        title,
        description,
        campusLocation,
        category,
        priority: 'Normal',
      };

      let request;
      if (category === 'ICT Support') {
        const deviceType = await askRequired('Device type: ');
        const systemName = await askRequired('System name: ');
        const faultType = await askRequired('Fault type: ');
        const networkImpact = (await ask('Network impact? (y/N): ')).toLowerCase() === 'y';
        request = new ICTSupportRequest({ ...base, deviceType, systemName, faultType, networkImpact });
      } else if (category === 'Facilities Maintenance') {
        const building = await askRequired('Building: ');
        const roomNumber = await askRequired('Room number: ');
        const hazardLevel = (await ask('Hazard level (None/Low/Medium/High) [None]: ')) || 'None';
        const equipmentAffected = await askRequired('Equipment affected: ');
        request = new MaintenanceRequest({ ...base, building, roomNumber, hazardLevel, equipmentAffected });
      } else if (category === 'Cleaning and Sanitation') {
        const cleaningArea = await askRequired('Cleaning area: ');
        const hygieneRisk = (await ask('Hygiene risk? (y/N): ')).toLowerCase() === 'y';
        const serviceType = (await ask('Service type (Routine/Deep Clean/Sanitisation/Emergency) [Routine]: ')) || 'Routine';
        const preferredServiceTime = (await ask('Preferred service time [Anytime]: ')) || 'Anytime';
        request = new CleaningRequest({
          ...base, cleaningArea, hygieneRisk, serviceType, preferredServiceTime,
        });
      } else {
        request = new GeneralServiceRequest(base);
      }

      this.manager.submitRequest(request);
      await this.requestRepo.create(request);
      await this.persistHistoryAndAudit();

      this.nextRequestNumber += 1;
      console.log(`  ✔ Request ${request.requestId} submitted with status ${request.status}.`);
    } catch (err) {
      console.log(`  ! ${err.message}`);
    }
  }

  async viewRequestByIdFlow() {
    const id = await ask('Request ID: ');
    const request = this.manager.findRequestById(id);
    if (!request) return console.log('  ! Request not found.');
    banner(`Request ${id}`);
    console.log(request.getRequestSummary());
    console.log('\n  History:');
    request.history.forEach((h) =>
      console.log(`    ${h.dateTime} | ${h.action} | ${h.previousStatus || '-'}→${h.newStatus} | ${h.actorId} | ${h.comment}`)
    );
  }

  async viewMyRequestsFlow() {
    if (!this.currentUser) return console.log('  ! Sign in first.');
    const list = this.manager.getRequestsByUser(this.currentUser.userId);
    banner(`Requests for ${this.currentUser.getFullName()}`);
    printRequests(list);
  }

  async viewAllRequestsFlow() {
    banner('All Requests');
    printRequests(this.manager.sortByDateSubmitted(true));
  }

  async updateMyRequestFlow() {
    if (!this.currentUser) return console.log('  ! Sign in first.');
    const id = await ask('Request ID to update: ');
    const request = this.manager.findRequestById(id);
    if (!request) return console.log('  ! Request not found.');
    try {
      const title = await ask(`New title [${request.title}]: `);
      const description = await ask(`New description [${request.description}]: `);
      const campusLocation = await ask(`New location [${request.campusLocation}]: `);
      const changes = {};
      if (title) changes.title = title;
      if (description) changes.description = description;
      if (campusLocation) changes.campusLocation = campusLocation;
      this.manager.updateRequest(id, this.currentUser.userId, changes);
      await this.requestRepo.saveAll(this.manager.getAllRequests());
      await this.persistHistoryAndAudit();
      console.log('  ✔ Request updated.');
    } catch (err) {
      console.log(`  ! ${err.message}`);
    }
  }

  async cancelMyRequestFlow() {
    if (!this.currentUser) return console.log('  ! Sign in first.');
    const id = await ask('Request ID to cancel: ');
    try {
      this.manager.cancelRequest(id, this.currentUser.userId);
      await this.requestRepo.saveAll(this.manager.getAllRequests());
      await this.persistHistoryAndAudit();
      console.log('  ✔ Request cancelled.');
    } catch (err) {
      console.log(`  ! ${err.message}`);
    }
  }

  async searchRequestsFlow() {
    const text = await ask('Search (ID or title): ');
    banner(`Search results for "${text}"`);
    printRequests(this.manager.searchRequests(text));
  }

  async viewSummaryFlow() {
    banner('Request Summary by Status');
    const summary = this.manager.getRequestSummaryByStatus();
    if (Object.keys(summary).length === 0) return console.log('  (no requests)');
    for (const [status, count] of Object.entries(summary)) {
      console.log(`  ${status.padEnd(15)} : ${count}`);
    }
  }

  // officer/technician
  async officerFlow() {
    banner('Service Officer Actions');
    console.log('  1. Review a Submitted request');
    console.log('  2. Assign a technician to a Reviewed request');
    console.log('  3. Close a Resolved request');
    const choice = await ask('Choice: ');
    try {
      if (choice === '1') {
        const id = await ask('Request ID: ');
        const priority = (await ask(`Priority (${PRIORITIES.join('/')}) [Normal]: `)) || 'Normal';
        this.manager.reviewRequest(id, this.currentUser.userId, priority);
      } else if (choice === '2') {
        const id = await ask('Request ID: ');
        const techId = await ask('Technician user ID: ');
        this.manager.assignTechnician(id, this.currentUser.userId, techId);
      } else if (choice === '3') {
        const id = await ask('Request ID: ');
        this.manager.closeRequest(id, this.currentUser.userId);
      } else {
        return console.log('  ! Invalid choice.');
      }
      await this.requestRepo.saveAll(this.manager.getAllRequests());
      await this.persistHistoryAndAudit();
      console.log('  ✔ Action complete.');
    } catch (err) {
      console.log(`  ! ${err.message}`);
    }
  }

  async technicianFlow() {
    banner('Technician Actions');
    console.log('  1. Start work on my assigned request');
    console.log('  2. Add progress note');
    console.log('  3. Resolve request');
    const choice = await ask('Choice: ');
    try {
      if (choice === '1') {
        const id = await ask('Request ID: ');
        this.manager.startWork(id, this.currentUser.userId);
      } else if (choice === '2') {
        const id = await ask('Request ID: ');
        const note = await askRequired('Progress note: ');
        this.manager.addProgressNote(id, this.currentUser.userId, note);
      } else if (choice === '3') {
        const id = await ask('Request ID: ');
        const note = (await ask('Resolution comment [Resolved by technician.]: ')) || 'Resolved by technician.';
        this.manager.resolveRequest(id, this.currentUser.userId, note);
      } else {
        return console.log('  ! Invalid choice.');
      }
      await this.requestRepo.saveAll(this.manager.getAllRequests());
      await this.persistHistoryAndAudit();
      console.log('  ✔ Action complete.');
    } catch (err) {
      console.log(`  ! ${err.message}`);
    }
  }

  async reportsFlow() {
    banner('Management Reports');
    console.log('  By status        :', this.manager.getRequestSummaryByStatus());
    console.log('  By category      :', this.manager.reportByCategory());
    console.log('  By priority      :', this.manager.reportByPriority());
    console.log('  By location      :', this.manager.reportByLocation());
    console.log('  By technician    :', this.manager.reportByTechnician());
    console.log('  Completed by tech:', this.manager.getCompletedRequestsByTechnician());
    console.log('  Average hours    :', this.manager.getAverageResolutionHours());
    console.log('  Urgent open      :', this.manager.getUrgentRequests().map((r) => r.requestId));
    console.log('  Overdue          :', this.manager.getOverdueRequests().map((r) => r.requestId));
    console.log('  Polymorphic demo :');
    for (const r of this.manager.getAllRequests()) {
      console.log(`    ${r.requestId} ${r.constructor.name} score=${r.calculatePriorityScore()} hours=${r.getTargetResolutionHours()}`);
    }
  }

  // persistence
  async persistHistoryAndAudit() {
    await this.historyRepo.saveAll(this.manager.collectHistory());
    await this.auditRepo.saveAll(this.manager.serializeAudit());
  }

  async persistAll() {
    await this.userRepo.saveAll(this.manager.getAllUsers());
    await this.requestRepo.saveAll(this.manager.getAllRequests());
    await this.persistHistoryAndAudit();
  }

  // menu loop
  async menu() {
    let exit = false;
    while (!exit) {
      const who = this.currentUser
        ? `${this.currentUser.getFullName()} (${this.currentUser.userType})`
        : 'not signed in';
      console.log(`\n${line}`);
      console.log('     CAMPUS SERVICE REQUEST SYSTEM');
      console.log(`     Signed in: ${who}`);
      console.log(line);
      console.log('  1. Register User');
      console.log('  2. Submit Service Request');
      console.log('  3. View Request by ID');
      console.log('  4. View My Requests');
      console.log('  5. View All Requests');
      console.log('  6. Update My Request');
      console.log('  7. Cancel My Request');
      console.log('  8. Search Requests');
      console.log('  9. View Request Summary');
      console.log(' 10. Exit');
      console.log(' 11. Sign in / switch user');
      console.log(' 12. Service Officer actions');
      console.log(' 13. Technician actions');
      console.log(' 14. Management reports');
      console.log(line);

      const choice = await ask('Choose: ');
      try {
        switch (choice) {
          case '1': await this.registerUserFlow(); break;
          case '2': await this.submitRequestFlow(); break;
          case '3': await this.viewRequestByIdFlow(); break;
          case '4': await this.viewMyRequestsFlow(); break;
          case '5': await this.viewAllRequestsFlow(); break;
          case '6': await this.updateMyRequestFlow(); break;
          case '7': await this.cancelMyRequestFlow(); break;
          case '8': await this.searchRequestsFlow(); break;
          case '9': await this.viewSummaryFlow(); break;
          case '10': exit = true; break;
          case '11': await this.signInFlow(); break;
          case '12': await this.officerFlow(); break;
          case '13': await this.technicianFlow(); break;
          case '14': await this.reportsFlow(); break;
          default: console.log('  ! Unknown option.');
        }
      } catch (err) {
        console.log(`  ! Unexpected error: ${err.message}`);
      }
    }

    console.log('\nSaving data before exit...');
    try {
      await this.persistAll();
      console.log('  ✔ Data saved.');
    } catch (err) {
      console.log(`  ! Failed to save data: ${err.message}`);
    }
    rl.close();
  }

  async run() {
    try {
      await this.initialise();
      await this.chooseUser();
      await this.menu();
    } catch (err) {
      console.error(`Fatal error: ${err.message}`);
      rl.close();
    }
  }
}

if (require.main === module) {
  new CampusServiceApp().run();
}

module.exports = CampusServiceApp;
