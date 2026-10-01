/**It stores a student's normal information, plus their programme and year 
level, and makes sure those details are valid.
*/
'use strict';

const User = require('./User');
const { isNonEmptyString } = require('../utils/validators');

class StudentRequester extends User {
  #programme;
  #yearLevel;

  constructor({ programme, yearLevel, ...userData } = {}) {
    // Constructor chaining: the base User constructor does the shared work.
    super({ ...userData, userType: 'StudentRequester' });
    this.#programme = typeof programme === 'string' ? programme.trim() : programme;
    this.#yearLevel = Number(yearLevel);
    this.validateSpecialisedFields();
  }

  get programme() { return this.#programme; }
  get yearLevel() { return this.#yearLevel; }

  set programme(value) {
    if (!isNonEmptyString(value)) throw new Error('Programme is required.');
    this.#programme = value.trim();
  }

  set yearLevel(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 6) {
      throw new Error('Year level must be a whole number between 1 and 6.');
    }
    this.#yearLevel = parsed;
  }

  validateSpecialisedFields() {
    if (!isNonEmptyString(this.#programme)) {
      throw new Error('Programme is required for a student requester.');
    }
    if (!Number.isInteger(this.#yearLevel) || this.#yearLevel < 1 || this.#yearLevel > 6) {
      throw new Error('Year level must be a whole number between 1 and 6.');
    }
    return true;
  }

  displayInfo() {
    return `${super.displayInfo()} | Programme: ${this.#programme} | Year: ${this.#yearLevel}`;
  }

  toJSON() {
    return { ...super.toJSON(), programme: this.#programme, yearLevel: this.#yearLevel };
  }
}

module.exports = StudentRequester;
