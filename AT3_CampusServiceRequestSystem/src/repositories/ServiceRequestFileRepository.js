'use strict';
/**The ServiceRequestFileRepository saves, loads, searches, and updates service requests in a JSON file
It also rebuilds the saved data into the correct service request objects and prevents duplicate request IDs
*/
const JsonFileRepository = require('./JsonFileRepository');
const ServiceRequestFactory = require('../models/ServiceRequestFactory');

class ServiceRequestFileRepository extends JsonFileRepository {
  constructor(filePath) {
    super(filePath);
    this._requests = [];
  }

 
  async loadAll(usersMap = {}) {
    const raw = await super.loadAll();
    const restored = [];
    for (const data of raw) {
      try {
        restored.push(ServiceRequestFactory.createFromData(data, usersMap));
      } catch (err) {
        // Skip records we cannot rebuild but keep going; surface the issue
        // through console in the console app if needed.
        
        console.warn(`Skipping ${data.requestId}: ${err.message}`);
      }
    }
    this._requests = restored;
    return this._requests;
  }

  getCached() { return [...this._requests]; }

  async saveAll(requests) {
    const plain = (requests || this._requests).map((r) =>
      typeof r.toJSON === 'function' ? r.toJSON() : r
    );
    await super.saveAll(plain);
  }

  async create(request) {
    if (!request || typeof request.toJSON !== 'function') {
      throw new Error('create() expects a ServiceRequest instance.');
    }
    if (this.findById(request.requestId)) {
      throw new Error(`Duplicate request ID in file: ${request.requestId}`);
    }
    this._requests.push(request);
    await this.saveAll();
    return request;
  }

  findById(requestId) {
    return this._requests.find((r) => r.requestId === requestId) || null;
  }

  findByRequester(userId) {
    return this._requests.filter((r) => r.requesterId === userId);
  }

  findByTechnician(technicianId) {
    return this._requests.filter((r) => r.assignedTechnicianId === technicianId);
  }

  async update(requestId, changes) {
    const request = this.findById(requestId);
    if (!request) throw new Error(`Request ${requestId} not found in file.`);
    Object.assign(request, changes);
    await this.saveAll();
    return request;
  }
}

module.exports = ServiceRequestFileRepository;
