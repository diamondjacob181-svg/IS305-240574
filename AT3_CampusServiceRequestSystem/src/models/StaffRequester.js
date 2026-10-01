/** A staff member who can submit service requests and whose department is stored in the system. */
'use strict';

const User = require('./User');
const { isNonEmptyString } = require('../utils/validators');

class StaffRequester extends User {
  #department;

  constructor({ department, ...userData } = {}) {
    super({ ...userData, userType: 'StaffRequester' });
    this.#department = typeof department === 'string' ? department.trim() : department;
    this.validateSpecialisedFields();
  }

  get department() { return this.#department; }

  set department(value) {
    if (!isNonEmptyString(value)) throw new Error('Department is required.');
    this.#department = value.trim();
  }

  validateSpecialisedFields() {
    if (!isNonEmptyString(this.#department)) {
      throw new Error('Department is required for a staff requester.');
    }
    return true;
  }

  displayInfo() {
    return `${super.displayInfo()} | Department: ${this.#department}`;
  }

  toJSON() {
    return { ...super.toJSON(), department: this.#department };
  }
}

module.exports = StaffRequester;
