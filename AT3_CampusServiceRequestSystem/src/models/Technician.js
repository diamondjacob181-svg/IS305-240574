/**The `Technician` class creates a technician user with a speciality and an availability status
It also checks that the speciality is provided and allows the technician's information to 
be displayed or converted to JSON.
*/

'use strict';

const User = require('./User');
const { isNonEmptyString } = require('../utils/validators');

class Technician extends User {
  #speciality;
  #available;

  constructor({ speciality, available = true, ...userData } = {}) {
    super({ ...userData, userType: 'Technician' });
    this.#speciality = typeof speciality === 'string' ? speciality.trim() : speciality;
    this.#available = Boolean(available);
    this.validateSpecialisedFields();
  }

  get speciality() { return this.#speciality; }
  get available() { return this.#available; }

  set speciality(value) {
    if (!isNonEmptyString(value)) throw new Error('Technical speciality is required.');
    this.#speciality = value.trim();
  }

  set available(value) {
    this.#available = Boolean(value);
  }

  validateSpecialisedFields() {
    if (!isNonEmptyString(this.#speciality)) {
      throw new Error('Technical speciality is required for a technician.');
    }
    if (typeof this.#available !== 'boolean') {
      throw new Error('Availability must be true or false.');
    }
    return true;
  }

  displayInfo() {
    return `${super.displayInfo()} | Speciality: ${this.#speciality} | Available: ${this.#available}`;
  }

  toJSON() {
    return { ...super.toJSON(), speciality: this.#speciality, available: this.#available };
  }
}

module.exports = Technician;
