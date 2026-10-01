'use strict';

const {
  CATEGORIES,
  PRIORITIES,
  isNonEmptyString,
  isOneOf,
} = require('../utils/validators');

/**
 * The manager holds the in-memory collections and manages all
 * operations. It is intentionally free of any file I/O — the console app
 * injects repositories and calls persistence methods itself.
 */
class ServiceRequestManager {
  #users;
  #requests;
  #auditTrail;

  constructor({ users = [], requests = [], auditTrail = [] } = {}) {
    this.#users = Array.isArray(users) ? [...users] : [];
    this.#requests = Array.isArray(requests) ? [...requests] : [];
    this.#auditTrail = Array.isArray(auditTrail) ? [...auditTrail] : [];
  }

  // ---------------- accessors ----------------
  getAllUsers() { return [...this.#users]; }
  getAllRequests() { return [...this.#requests]; }
  getAuditTrail() { return [...this.#auditTrail]; }

  // ---------------- user operations ----------------
  registerUser(user) {
    if (!user || !isNonEmptyString(user.userId)) {
      throw new Error('A valid user object is required.');
    }
    if (this.findUserById(user.userId)) {
      throw new Error(`Duplicate user ID: ${user.userId}`);
    }
    user.validate();
    this.#users.push(user);
    this.#recordAudit({
      actorId: user.userId,
      actorRole: user.userType,
      action: 'USER_REGISTERED',
      affectedRequestId: null,
      description: `Registered ${user.getFullName()} as ${user.userType}.`,
      result: 'SUCCESS',
    });
    return user;
  }

  findUserById(userId) {
    return this.#users.find((u) => u.userId === userId) || null;
  }

  findUsersByRole(role) {
    return this.#users.filter((u) => u.userType === role);
  }

  // ---------------- request operations ----------------
  submitRequest(request) {
    if (!request || !isNonEmptyString(request.requestId)) {
      throw new Error('A valid request object is required.');
    }
    if (this.findRequestById(request.requestId)) {
      throw new Error(`Duplicate request ID: ${request.requestId}`);
    }
    request.validate();
    this.#requests.push(request);
    this.#recordAudit({
      actorId: request.requesterId,
      actorRole: request.requester.userType,
      action: 'REQUEST_CREATED',
      affectedRequestId: request.requestId,
      description: `New ${request.constructor.name} submitted: "${request.title}".`,
      result: 'SUCCESS',
    });
    return request;
  }

  findRequestById(requestId) {
    return this.#requests.find((r) => r.requestId === requestId) || null;
  }

  getRequestsByUser(userId) {
    return this.#requests.filter((r) => r.requesterId === userId);
  }

  getRequestsByTechnician(technicianId) {
    return this.#requests.filter((r) => r.assignedTechnicianId === technicianId);
  }

  // ---------------- requester actions ----------------
  updateRequest(requestId, userId, changes) {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`Request ${requestId} not found.`);
    const actor = this.findUserById(userId);
    if (!actor) throw new Error(`User ${userId} not found.`);
    request.updateDetails(changes, actor);
    this.#recordAudit({
      actorId: actor.userId,
      actorRole: actor.userType,
      action: 'REQUEST_UPDATED',
      affectedRequestId: requestId,
      description: `Request details updated.`,
      result: 'SUCCESS',
    });
    return request;
  }

  cancelRequest(requestId, userId) {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`Request ${requestId} not found.`);
    const actor = this.findUserById(userId);
    if (!actor) throw new Error(`User ${userId} not found.`);
    request.cancelRequest(actor);
    this.#recordAudit({
      actorId: actor.userId,
      actorRole: actor.userType,
      action: 'REQUEST_CANCELLED',
      affectedRequestId: requestId,
      description: `Request cancelled by ${actor.getFullName()}.`,
      result: 'SUCCESS',
    });
    return request;
  }

  // ---------------- officer/technician workflow ----------------
  reviewRequest(requestId, officerId, priority) {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`Request ${requestId} not found.`);
    const officer = this.requireRole(officerId, 'ServiceOfficer');
    if (priority !== undefined) request.applyPriority(priority, officer);
    request.changeStatus('Reviewed', officer, 'Request reviewed by Service Officer.');
    this.#recordAudit({
      actorId: officer.userId,
      actorRole: officer.userType,
      action: 'REQUEST_REVIEWED',
      affectedRequestId: requestId,
      description: `Reviewed and priority set to ${request.priority}.`,
      result: 'SUCCESS',
    });
    return request;
  }

  assignTechnician(requestId, officerId, technicianId) {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`Request ${requestId} not found.`);
    const officer = this.requireRole(officerId, 'ServiceOfficer');
    const technician = this.requireRole(technicianId, 'Technician');
    if (request.status !== 'Reviewed') {
      throw new Error(`Only Reviewed requests can be assigned (current: ${request.status}).`);
    }
    request.assignTechnician(technician.userId, officer);
    request.changeStatus('Assigned', officer, `Assigned to ${technician.getFullName()}.`);
    this.#recordAudit({
      actorId: officer.userId,
      actorRole: officer.userType,
      action: 'TECHNICIAN_ASSIGNED',
      affectedRequestId: requestId,
      description: `Technician ${technician.userId} assigned.`,
      result: 'SUCCESS',
    });
    return request;
  }

  startWork(requestId, technicianId) {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`Request ${requestId} not found.`);
    const tech = this.requireRole(technicianId, 'Technician');
    if (request.assignedTechnicianId !== tech.userId) {
      throw new Error('Only the assigned technician may start this request.');
    }
    request.changeStatus('In Progress', tech, 'Work started by technician.');
    this.#recordAudit({
      actorId: tech.userId,
      actorRole: tech.userType,
      action: 'WORK_STARTED',
      affectedRequestId: requestId,
      description: 'Technician started work.',
      result: 'SUCCESS',
    });
    return request;
  }

  addProgressNote(requestId, technicianId, note) {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`Request ${requestId} not found.`);
    const tech = this.requireRole(technicianId, 'Technician');
    if (request.assignedTechnicianId !== tech.userId) {
      throw new Error('Only the assigned technician may add progress notes.');
    }
    if (request.status !== 'In Progress') {
      throw new Error('Progress notes are only allowed while the request is In Progress.');
    }
    request.addProgressNote(tech.userId, note);
    this.#recordAudit({
      actorId: tech.userId,
      actorRole: tech.userType,
      action: 'PROGRESS_NOTE',
      affectedRequestId: requestId,
      description: note,
      result: 'SUCCESS',
    });
    return request;
  }

  resolveRequest(requestId, technicianId, comment = 'Resolved by technician.') {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`Request ${requestId} not found.`);
    const tech = this.requireRole(technicianId, 'Technician');
    if (request.assignedTechnicianId !== tech.userId) {
      throw new Error('Only the assigned technician may resolve this request.');
    }
    request.changeStatus('Resolved', tech, comment);
    this.#recordAudit({
      actorId: tech.userId,
      actorRole: tech.userType,
      action: 'REQUEST_RESOLVED',
      affectedRequestId: requestId,
      description: comment,
      result: 'SUCCESS',
    });
    return request;
  }

  closeRequest(requestId, officerId, comment = 'Verified and closed by Service Officer.') {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`Request ${requestId} not found.`);
    const officer = this.requireRole(officerId, 'ServiceOfficer');
    request.changeStatus('Closed', officer, comment);
    this.#recordAudit({
      actorId: officer.userId,
      actorRole: officer.userType,
      action: 'REQUEST_CLOSED',
      affectedRequestId: requestId,
      description: comment,
      result: 'SUCCESS',
    });
    return request;
  }

  // ---------------- search/filter/sort ----------------
  searchRequests(searchText) {
    if (!isNonEmptyString(searchText)) return [];
    const needle = searchText.trim().toLowerCase();
    return this.#requests.filter((r) =>
      r.requestId.toLowerCase().includes(needle) ||
      r.title.toLowerCase().includes(needle)
    );
  }

  filterRequests({ category, status, priority, technicianId } = {}) {
    return this.#requests.filter((r) => {
      if (category && r.category !== category) return false;
      if (status && r.status !== status) return false;
      if (priority && r.priority !== priority) return false;
      if (technicianId && r.assignedTechnicianId !== technicianId) return false;
      return true;
    });
  }

  sortByDateSubmitted(desc = true) {
    return [...this.#requests].sort((a, b) => {
      const diff = new Date(a.dateSubmitted) - new Date(b.dateSubmitted);
      return desc ? -diff : diff;
    });
  }

  sortByPriority(desc = true) {
    const rank = { Low: 1, Normal: 2, High: 3, Urgent: 4 };
    return [...this.#requests].sort((a, b) => {
      const diff = rank[a.priority] - rank[b.priority];
      return desc ? -diff : diff;
    });
  }

  // ---------------- summaries / reports ----------------
  getRequestSummaryByStatus() {
    const summary = {};
    for (const r of this.#requests) {
      summary[r.status] = (summary[r.status] || 0) + 1;
    }
    return summary;
  }

  reportByCategory() {
    return this.#groupBy((r) => r.category);
  }

  reportByPriority() {
    return this.#groupBy((r) => r.priority);
  }

  reportByTechnician() {
    return this.#groupBy((r) => r.assignedTechnicianId || 'Unassigned');
  }

  reportByLocation() {
    return this.#groupBy((r) => r.campusLocation);
  }

  getUrgentRequests() {
    return this.#requests.filter((r) => r.priority === 'Urgent' && r.status !== 'Closed' && r.status !== 'Cancelled');
  }

  getOverdueRequests(referenceDate = new Date()) {
    return this.#requests.filter((r) => r.isOverdue(referenceDate));
  }

  getCompletedRequestsByTechnician() {
    const completed = this.#requests.filter((r) => r.status === 'Closed' || r.status === 'Resolved');
    return completed.reduce((acc, r) => {
      const key = r.assignedTechnicianId || 'Unassigned';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  getAverageResolutionHours() {
    const resolved = this.#requests.filter((r) => ['Resolved', 'Closed'].includes(r.status));
    if (resolved.length === 0) return 0;
    const total = resolved.reduce((sum, r) => {
      const start = new Date(r.dateSubmitted).getTime();
      const end = new Date(r.dateUpdated).getTime();
      return sum + (end - start) / 3600000;
    }, 0);
    return Number((total / resolved.length).toFixed(2));
  }

  #groupBy(selector) {
    return this.#requests.reduce((acc, r) => {
      const key = selector(r);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  // ---------------- audit ----------------
  #recordAudit(entry) {
    const record = {
      auditId: `AUD${String(this.#auditTrail.length + 1).padStart(5, '0')}`,
      dateTime: new Date().toISOString(),
      ...entry,
    };
    this.#auditTrail.push(record);
    return record;
  }

  appendAuditRecord(record) {
    if (record && typeof record === 'object') this.#auditTrail.push(record);
  }

  requireRole(userId, role) {
    const user = this.findUserById(userId);
    if (!user) throw new Error(`User ${userId} not found.`);
    if (user.userType !== role) {
      throw new Error(`User ${userId} must be a ${role} to perform this action.`);
    }
    return user;
  }

  // ---------------- serialisation helpers ----------------
  serializeRequests() {
    return this.#requests.map((r) => r.toJSON());
  }

  serializeUsers() {
    return this.#users.map((u) => u.toJSON());
  }

  serializeAudit() {
    return this.#auditTrail.map((a) => ({ ...a }));
  }

  collectHistory() {
    const entries = [];
    for (const r of this.#requests) {
      for (const h of r.history) {
        entries.push({ requestId: r.requestId, ...h });
      }
    }
    return entries;
  }

  constants() {
    return { CATEGORIES, PRIORITIES };
  }
}

module.exports = ServiceRequestManager;
