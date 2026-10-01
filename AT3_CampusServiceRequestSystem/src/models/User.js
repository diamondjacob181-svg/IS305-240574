/**The User class is the base class for all users in the system 
storing their ID, name, email, and user type while checking that the information is valid
It also provides functions to get the user's full name, display their information
and convert their details into JSON
*/
'use strict';

const {
  USER_TYPES,
  isNonEmptyString,
  isValidEmail,
  isOneOf,
} = require('../utils/validators');

/**
 * Base class for every person who uses the system.
 * Encapsulation: all fields are private and only reachable through
 * getters and controlled setters.
 */
class User {
  #userId;
  #firstName;
  #lastName;
  #email;
  #userType;

  constructor({ userId, firstName, lastName, email, userType } = {}) {
    this.#userId = typeof userId === 'string' ? userId.trim() : userId;
    this.#firstName = typeof firstName === 'string' ? firstName.trim() : firstName;
    this.#lastName = typeof lastName === 'string' ? lastName.trim() : lastName;
    this.#email = typeof email === 'string' ? email.trim() : email;
    this.#userType = userType;
    this.validate();
  }

  // ---------------- getters ----------------
  get userId() { return this.#userId; }
  get firstName() { return this.#firstName; }
  get lastName() { return this.#lastName; }
  get email() { return this.#email; }
  get userType() { return this.#userType; }

  // ------------- controlled setters -------------
  set firstName(value) {
    if (!isNonEmptyString(value)) throw new Error('First name is required.');
    this.#firstName = value.trim();
  }

  set lastName(value) {
    if (!isNonEmptyString(value)) throw new Error('Last name is required.');
    this.#lastName = value.trim();
  }

  set email(value) {
    if (!isValidEmail(value)) throw new Error(`Invalid email address: ${value}`);
    this.#email = value.trim();
  }

  // ---------------- behaviour ----------------
  getFullName() {
    return `${this.#firstName} ${this.#lastName}`;
  }

  validate() {
    if (!isNonEmptyString(this.#userId)) throw new Error('User ID is required.');
    if (!isNonEmptyString(this.#firstName)) throw new Error('First name is required.');
    if (!isNonEmptyString(this.#lastName)) throw new Error('Last name is required.');
    if (!isValidEmail(this.#email)) throw new Error(`Invalid email address: ${this.#email}`);
    if (!isOneOf(this.#userType, USER_TYPES)) {
      throw new Error(`Unsupported user type: ${this.#userType}`);
    }
    return true;
  }

  displayInfo() {
    return `${this.#userId} | ${this.getFullName()} | ${this.#userType} | ${this.#email}`;
  }

  toJSON() {
    return {
      userId: this.#userId,
      firstName: this.#firstName,
      lastName: this.#lastName,
      email: this.#email,
      userType: this.#userType,
    };
  }
}

module.exports = User;
