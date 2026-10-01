'use strict';
/**
The UserFileRepository saves, loads, creates, searches, and updates users in a JSON file
It also converts saved data back into the correct user types and prevents duplicate user IDs
*/

const JsonFileRepository = require('./JsonFileRepository');
const UserFactory = require('../models/UserFactory');

class UserFileRepository extends JsonFileRepository {
  constructor(filePath) {
    super(filePath);
    this._users = [];
  }

  async loadAll() {
    const raw = await super.loadAll();
    this._users = raw.map((data) => UserFactory.createFromData(data));
    return this._users;
  }

  getCached() { return [...this._users]; }

  async saveAll(users) {
    const plain = (users || this._users).map((u) =>
      typeof u.toJSON === 'function' ? u.toJSON() : u
    );
    await super.saveAll(plain);
  }

  async create(user) {
    if (!user || typeof user.toJSON !== 'function') {
      throw new Error('create() expects a User instance.');
    }
    if (this.findById(user.userId)) {
      throw new Error(`Duplicate user ID in file: ${user.userId}`);
    }
    this._users.push(user);
    await this.saveAll();
    return user;
  }

  findById(userId) {
    return this._users.find((u) => u.userId === userId) || null;
  }

  async update(userId, changes) {
    const user = this.findById(userId);
    if (!user) throw new Error(`User ${userId} not found in file.`);
    for (const [key, value] of Object.entries(changes)) {
      if (key in user) user[key] = value;
    }
    await this.saveAll();
    return user;
  }
}

module.exports = UserFileRepository;
