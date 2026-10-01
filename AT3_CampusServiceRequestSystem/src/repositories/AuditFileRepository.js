'use strict';
/**he AuditFileRepository saves audit records 
into a JSON file. It loads the existing records
adds the new records, saves them back, and returns the updated list.
*/

const JsonFileRepository = require('./JsonFileRepository');

class AuditFileRepository extends JsonFileRepository {
  async append(records) {
    const current = await this.loadAll();
    const next = current.concat(Array.isArray(records) ? records : [records]);
    await this.saveAll(next);
    return next;
  }
}

module.exports = AuditFileRepository;
