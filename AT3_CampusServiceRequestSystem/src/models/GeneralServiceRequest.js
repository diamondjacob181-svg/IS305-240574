'use strict';

const ServiceRequest = require('./ServiceRequest');

/**
 * Fallback concrete class for "General Campus Service" category so that
 * every request in the system is an instance of a subclass and can be
 * polymorphically processed.
 */
const BASE_SCORE = { Low: 5, Normal: 15, High: 30, Urgent: 60 };
const BASE_HOURS = { Low: 96, Normal: 48, High: 24, Urgent: 8 };

class GeneralServiceRequest extends ServiceRequest {
  calculatePriorityScore() {
    return BASE_SCORE[this.priority] || BASE_SCORE.Normal;
  }

  getTargetResolutionHours() {
    return BASE_HOURS[this.priority] || BASE_HOURS.Normal;
  }

  getRequestSummary() {
    return [
      super.getRequestSummary(),
      '--- General Service Details ---',
      `Priority Score : ${this.calculatePriorityScore()}`,
      `Target Hours   : ${this.getTargetResolutionHours()}`,
    ].join('\n');
  }
}

module.exports = GeneralServiceRequest;
