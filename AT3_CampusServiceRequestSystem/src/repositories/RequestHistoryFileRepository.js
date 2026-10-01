'use strict';
/**The RequestHistoryFileRepository stores the history of service requests in a JSON file
It loads the old history, adds new entries, saves them, and returns the updated history
*/
const JsonFileRepository = require('./JsonFileRepository');

class RequestHistoryFileRepository extends JsonFileRepository {
  async append(entries) {
    const current = await this.loadAll();
    const next = current.concat(Array.isArray(entries) ? entries : [entries]);
    await this.saveAll(next);
    return next;
  }
}

module.exports = RequestHistoryFileRepository;
