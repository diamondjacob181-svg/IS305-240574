/** The UserFactory class creates the correct type of user from saved data
such as a StudentRequester, StaffRequester, ServiceOfficer, or Technician
It checks the userType and automatically creates the matching user object
*/
'use strict';

const StudentRequester = require('./StudentRequester');
const StaffRequester = require('./StaffRequester');
const ServiceOfficer = require('./ServiceOfficer');
const Technician = require('./Technician');

/**
 * Recreates the correct User subclass from saved JSON data.
 */
class UserFactory {
  static createFromData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('User data must be an object.');
    }

    switch (data.userType) {
      case 'StudentRequester':
        return new StudentRequester(data);
      case 'StaffRequester':
        return new StaffRequester(data);
      case 'ServiceOfficer':
        return new ServiceOfficer(data);
      case 'Technician':
        return new Technician(data);
      default:
        throw new Error(`Unsupported user type: ${data.userType}`);
    }
  }
}

module.exports = UserFactory;
