'use strict';

const UserFactory = require('./UserFactory');
const ICTSupportRequest = require('./ICTSupportRequest');
const MaintenanceRequest = require('./MaintenanceRequest');
const CleaningRequest = require('./CleaningRequest');
const GeneralServiceRequest = require('./GeneralServiceRequest');

/**
 * Recreates the correct specialised request object from saved JSON data.
 * `users` is a lookup map  so that the
 * requester object can be re-attached to the restored request.
 */
class ServiceRequestFactory {
  static createFromData(data, users = {}) {
    if (!data || typeof data !== 'object') {
      throw new Error('Saved request data must be an object.');
    }

    const requester = users[data.requesterId];
    if (!requester) {
      throw new Error(`Requester ${data.requesterId} not found for request ${data.requestId}.`);
    }

    const base = {
      requestId: data.requestId,
      requester,
      title: data.title,
      description: data.description,
      campusLocation: data.campusLocation,
      category: data.category,
      priority: data.priority,
      status: data.status,
      dateSubmitted: data.dateSubmitted,
      dateUpdated: data.dateUpdated,
      assignedTechnicianId: data.assignedTechnicianId ?? null,
      assignedOfficerId: data.assignedOfficerId ?? null,
      history: Array.isArray(data.history) ? data.history : [],
    };

    switch (data.requestType) {
      case 'ICTSupportRequest':
        return new ICTSupportRequest({
          ...base,
          deviceType: data.deviceType,
          systemName: data.systemName,
          faultType: data.faultType,
          networkImpact: data.networkImpact,
        });
      case 'MaintenanceRequest':
        return new MaintenanceRequest({
          ...base,
          building: data.building,
          roomNumber: data.roomNumber,
          hazardLevel: data.hazardLevel,
          equipmentAffected: data.equipmentAffected,
        });
      case 'CleaningRequest':
        return new CleaningRequest({
          ...base,
          cleaningArea: data.cleaningArea,
          hygieneRisk: data.hygieneRisk,
          serviceType: data.serviceType,
          preferredServiceTime: data.preferredServiceTime,
        });
      case 'GeneralServiceRequest':
        return new GeneralServiceRequest(base);
      default:
        throw new Error(`Unsupported saved request type: ${data.requestType}`);
    }
  }

  static createFromUsers(data, usersMap) {
    // Alias kept for clarity in the repository layer.
    return ServiceRequestFactory.createFromData(data, usersMap);
  }
}

module.exports = ServiceRequestFactory;
module.exports.UserFactory = UserFactory; 
