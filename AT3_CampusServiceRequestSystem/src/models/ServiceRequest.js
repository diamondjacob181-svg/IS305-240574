'use strict';

const {
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  isNonEmptyString,
  isOneOf,
  nowIso,
} = require('../utils/validators');

/**
 * Permitted status flow (Credit requirement).
 * Cancelled is a final status and may only be reached from Submitted / Reviewed.
 */
const ALLOWED_TRANSITIONS = Object.freeze({
  Submitted: Object.freeze(['Reviewed', 'Cancelled']),
  Reviewed: Object.freeze(['Assigned', 'Cancelled']),
  Assigned: Object.freeze(['In Progress']),
  'In Progress': Object.freeze(['Resolved']),
  Resolved: Object.freeze(['Closed']),
  Closed: Object.freeze([]),
  Cancelled: Object.freeze([]),
});

/**
 * Abstract-style base class for all campus service requests.
 * Subclasses MUST override calculatePriorityScore() and getTargetResolutionHours().
 */
class ServiceRequest {
  #requestId;
  #requester;
  #title;
  #description;
  #campusLocation;
  #category;
  #priority;
  #status;
  #dateSubmitted;
  #dateUpdated;
  #assignedTechnicianId;
  #assignedOfficerId;
  #history;

  constructor({
    requestId,
    requester,
    title,
    description,
    campusLocation,
    category,
    priority = 'Normal',
    status = 'Submitted',
    dateSubmitted,
    dateUpdated,
    assignedTechnicianId = null,
    assignedOfficerId = null,
    history = [],
  } = {}) {
    this.#requestId = typeof requestId === 'string' ? requestId.trim() : requestId;
    this.#requester = requester;
    this.#title = typeof title === 'string' ? title.trim() : title;
    this.#description = typeof description === 'string' ? description.trim() : description;
    this.#campusLocation = typeof campusLocation === 'string'
      ? campusLocation.trim()
      : campusLocation;
    this.#category = category;
    this.#priority = priority;
    this.#status = status;
    this.#dateSubmitted = dateSubmitted || nowIso();
    this.#dateUpdated = dateUpdated || this.#dateSubmitted;
    this.#assignedTechnicianId = assignedTechnicianId;
    this.#assignedOfficerId = assignedOfficerId;
    this.#history = Array.isArray(history) ? history.map((entry) => ({ ...entry })) : [];

    this.validate();

    // Only record a creation entry for brand new requests.
    if (this.#history.length === 0) {
      this.addHistoryEntry({
        previousStatus: null,
        newStatus: this.#status,
        action: 'REQUEST_CREATED',
        actorId: this.requesterId,
        actorRole: this.#requester.userType || 'Requester',
        comment: 'Request created.',
      });
    }
  }

  // ---------------- getters ----------------
  get requestId() { return this.#requestId; }
  get requester() { return this.#requester; }
  get requesterId() { return this.#requester ? this.#requester.userId : null; }
  get title() { return this.#title; }
  get description() { return this.#description; }
  get campusLocation() { return this.#campusLocation; }
  get category() { return this.#category; }
  get priority() { return this.#priority; }
  get status() { return this.#status; }
  get dateSubmitted() { return this.#dateSubmitted; }
  get dateUpdated() { return this.#dateUpdated; }
  get assignedTechnicianId() { return this.#assignedTechnicianId; }
  get assignedOfficerId() { return this.#assignedOfficerId; }
  get history() { return this.#history.map((entry) => ({ ...entry })); }

  // ------------- controlled setters -------------
  set priority(value) {
    if (!isOneOf(value, PRIORITIES)) {
      throw new Error(`Unsupported priority value: ${value}`);
    }
    this.#priority = value;
  }

  // ---------------- validation ----------------
  validate() {
    if (!isNonEmptyString(this.#requestId)) throw new Error('Request ID is required.');
    if (!this.#requester || !isNonEmptyString(this.#requester.userId)) {
      throw new Error('A valid requester object is required.');
    }
    if (!isNonEmptyString(this.#title)) throw new Error('Request title is required.');
    if (!isNonEmptyString(this.#description)) throw new Error('Request description is required.');
    if (!isNonEmptyString(this.#campusLocation)) throw new Error('Campus location is required.');
    if (!isOneOf(this.#category, CATEGORIES)) {
      throw new Error(`Unsupported category: ${this.#category}`);
    }
    if (!isOneOf(this.#priority, PRIORITIES)) {
      throw new Error(`Unsupported priority value: ${this.#priority}`);
    }
    if (!isOneOf(this.#status, STATUSES)) {
      throw new Error(`Unsupported status: ${this.#status}`);
    }
    return true;
  }

  // ---------------- history ----------------
  addHistoryEntry({ previousStatus = null, newStatus = null, action, actorId, actorRole, comment = '' }) {
    const entry = {
      previousStatus,
      newStatus: newStatus ?? this.#status,
      action,
      actorId: actorId || 'SYSTEM',
      actorRole: actorRole || 'System',
      comment,
      dateTime: nowIso(),
    };
    this.#history.push(entry);
    return entry;
  }

  // ---------------- requester actions ----------------
  updateDetails(changes = {}, actor) {
    if (!actor || actor.userId !== this.requesterId) {
      throw new Error('Only the requester who created this request may update it.');
    }
    if (this.#status !== 'Submitted') {
      throw new Error(`Only Submitted requests can be updated (current status: ${this.#status}).`);
    }

    const applied = [];

    if (changes.title !== undefined) {
      if (!isNonEmptyString(changes.title)) throw new Error('Request title is required.');
      this.#title = changes.title.trim();
      applied.push('title');
    }
    if (changes.description !== undefined) {
      if (!isNonEmptyString(changes.description)) throw new Error('Request description is required.');
      this.#description = changes.description.trim();
      applied.push('description');
    }
    if (changes.campusLocation !== undefined) {
      if (!isNonEmptyString(changes.campusLocation)) throw new Error('Campus location is required.');
      this.#campusLocation = changes.campusLocation.trim();
      applied.push('campusLocation');
    }
    if (applied.length === 0) throw new Error('No valid changes were supplied.');

    this.#dateUpdated = nowIso();
    this.addHistoryEntry({
      previousStatus: this.#status,
      newStatus: this.#status,
      action: 'REQUEST_UPDATED',
      actorId: actor.userId,
      actorRole: actor.userType,
      comment: `Updated fields: ${applied.join(', ')}`,
    });
    return this;
  }

  cancelRequest(actor) {
    if (!actor || actor.userId !== this.requesterId) {
      throw new Error('Only the requester who created this request may cancel it.');
    }
    if (this.#status === 'Cancelled') {
      throw new Error('This request has already been cancelled.');
    }
    if (!['Submitted', 'Reviewed'].includes(this.#status)) {
      throw new Error(`A request with status ${this.#status} cannot be cancelled.`);
    }
    return this.changeStatus('Cancelled', actor, 'Request cancelled by requester.');
  }

  // ---------------- workflow ----------------
  changeStatus(newStatus, actor, comment = '') {
    const previousStatus = this.#status;
    const allowed = ALLOWED_TRANSITIONS[previousStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid status transition: ${previousStatus} -> ${newStatus}.`);
    }
    this.#status = newStatus;
    this.#dateUpdated = nowIso();
    this.addHistoryEntry({
      previousStatus,
      newStatus,
      action: 'STATUS_CHANGE',
      actorId: actor ? actor.userId : 'SYSTEM',
      actorRole: actor ? actor.userType : 'System',
      comment,
    });
    return this.#status;
  }

  applyPriority(priority, actor) {
    if (!isOneOf(priority, PRIORITIES)) {
      throw new Error(`Unsupported priority value: ${priority}`);
    }
    const previous = this.#priority;
    this.#priority = priority;
    this.#dateUpdated = nowIso();
    this.addHistoryEntry({
      previousStatus: this.#status,
      newStatus: this.#status,
      action: 'PRIORITY_CHANGED',
      actorId: actor ? actor.userId : 'SYSTEM',
      actorRole: actor ? actor.userType : 'System',
      comment: `Priority changed from ${previous} to ${priority}.`,
    });
    return this.#priority;
  }

  assignTechnician(technicianId, actor) {
    if (!isNonEmptyString(technicianId)) throw new Error('Technician ID is required.');
    this.#assignedTechnicianId = technicianId;
    if (actor) this.#assignedOfficerId = actor.userId;
    this.#dateUpdated = nowIso();
    this.addHistoryEntry({
      previousStatus: this.#status,
      newStatus: this.#status,
      action: 'TECHNICIAN_ASSIGNED',
      actorId: actor ? actor.userId : 'SYSTEM',
      actorRole: actor ? actor.userType : 'System',
      comment: `Technician ${technicianId} assigned.`,
    });
    return this;
  }

  addProgressNote(technicianId, note) {
    if (!isNonEmptyString(note)) throw new Error('A progress note is required.');
    this.#dateUpdated = nowIso();
    this.addHistoryEntry({
      previousStatus: this.#status,
      newStatus: this.#status,
      action: 'PROGRESS_NOTE',
      actorId: technicianId,
      actorRole: 'Technician',
      comment: note.trim(),
    });
    return this;
  }

  // ---------------- abstract-style behaviour ----------------
  calculatePriorityScore() {
    throw new Error(`${this.constructor.name} must implement calculatePriorityScore().`);
  }

  getTargetResolutionHours() {
    throw new Error(`${this.constructor.name} must implement getTargetResolutionHours().`);
  }

  /**
   * Common summary. Subclasses override this and call super.getRequestSummary()
   * to append their specialised information (polymorphism).
   */
  getRequestSummary() {
    return [
      `Request ID   : ${this.#requestId}`,
      `Type         : ${this.constructor.name}`,
      `Title        : ${this.#title}`,
      `Description  : ${this.#description}`,
      `Requester    : ${this.#requester.getFullName()} (${this.requesterId})`,
      `Location     : ${this.#campusLocation}`,
      `Category     : ${this.#category}`,
      `Priority     : ${this.#priority}`,
      `Status       : ${this.#status}`,
      `Technician   : ${this.#assignedTechnicianId || 'Unassigned'}`,
      `Submitted    : ${this.#dateSubmitted}`,
      `Last updated : ${this.#dateUpdated}`,
    ].join('\n');
  }

  isOverdue(referenceDate = new Date()) {
    if (['Closed', 'Cancelled', 'Resolved'].includes(this.#status)) return false;
    let targetHours;
    try {
      targetHours = this.getTargetResolutionHours();
    } catch {
      return false;
    }
    const elapsedHours = (referenceDate.getTime() - new Date(this.#dateSubmitted).getTime()) / 3600000;
    return elapsedHours > targetHours;
  }

  toJSON() {
    return {
      requestId: this.#requestId,
      requestType: this.constructor.name,
      requesterId: this.requesterId,
      title: this.#title,
      description: this.#description,
      campusLocation: this.#campusLocation,
      category: this.#category,
      priority: this.#priority,
      status: this.#status,
      assignedTechnicianId: this.#assignedTechnicianId,
      assignedOfficerId: this.#assignedOfficerId,
      dateSubmitted: this.#dateSubmitted,
      dateUpdated: this.#dateUpdated,
      history: this.#history.map((entry) => ({ ...entry })),
    };
  }
}

module.exports = ServiceRequest;
