/**This class creates and manages ICT support requests, validates 
  their ICT details, calculates their priority and expected resolution time,
  displays their information, and saves them as JSON.
*/  
'use strict';

const ServiceRequest = require('./ServiceRequest');
const { isNonEmptyString } = require('../utils/validators');

const BASE_SCORE = { Low: 10, Normal: 25, High: 50, Urgent: 80 };
const BASE_HOURS = { Low: 72, Normal: 48, High: 24, Urgent: 8 };

class ICTSupportRequest extends ServiceRequest {
  #deviceType;
  #systemName;
  #faultType;
  #networkImpact;

  constructor({ deviceType, systemName, faultType, networkImpact = false, ...requestData } = {}) {
    super(requestData);
    this.#deviceType = typeof deviceType === 'string' ? deviceType.trim() : deviceType;
    this.#systemName = typeof systemName === 'string' ? systemName.trim() : systemName;
    this.#faultType = typeof faultType === 'string' ? faultType.trim() : faultType;
    this.#networkImpact = Boolean(networkImpact);
    this.validateSpecialisedFields();
  }

  get deviceType() { return this.#deviceType; }
  get systemName() { return this.#systemName; }
  get faultType() { return this.#faultType; }
  get networkImpact() { return this.#networkImpact; }

  validateSpecialisedFields() {
    if (!isNonEmptyString(this.#deviceType)) throw new Error('Device type is required for ICT support requests.');
    if (!isNonEmptyString(this.#systemName)) throw new Error('System name is required for ICT support requests.');
    if (!isNonEmptyString(this.#faultType)) throw new Error('Fault type is required for ICT support requests.');
    if (typeof this.#networkImpact !== 'boolean') throw new Error('Network impact must be true or false.');
    return true;
  }

  calculatePriorityScore() {
    let score = BASE_SCORE[this.priority] || BASE_SCORE.Normal;
    if (this.#networkImpact) score += 20;
    if (this.#faultType.toLowerCase().includes('hardware')) score += 10;
    return score;
  }

  getTargetResolutionHours() {
    const base = BASE_HOURS[this.priority] || BASE_HOURS.Normal;
    return this.#networkImpact ? Math.max(4, Math.floor(base / 2)) : base;
  }

  getRequestSummary() {
    return [
      super.getRequestSummary(),
      '--- ICT Support Details ---',
      `Device Type    : ${this.#deviceType}`,
      `System Name    : ${this.#systemName}`,
      `Fault Type     : ${this.#faultType}`,
      `Network Impact : ${this.#networkImpact ? 'Yes' : 'No'}`,
      `Priority Score : ${this.calculatePriorityScore()}`,
      `Target Hours   : ${this.getTargetResolutionHours()}`,
    ].join('\n');
  }

  toJSON() {
    return {
      ...super.toJSON(),
      deviceType: this.#deviceType,
      systemName: this.#systemName,
      faultType: this.#faultType,
      networkImpact: this.#networkImpact,
    };
  }
}

module.exports = ICTSupportRequest;
