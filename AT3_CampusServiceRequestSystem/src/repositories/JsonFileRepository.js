'use strict';

const fs = require('fs/promises');
const path = require('path');

/**
 * Base JSON repository. All file reads/writes for the whole project
 * ultimately go through this class, which isolates the console app from
 * direct filesystem access.
 */
class JsonFileRepository {
  constructor(filePath) {
    if (!filePath) throw new Error('A file path is required for the repository.');
    this.filePath = filePath;
  }

  async loadAll() {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      if (!raw.trim()) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (err) {
      if (err.code === 'ENOENT') {
        // If the data file does not exist, this creates an empty file 
        // containing an empty list so new data can be saved properly.
        await this.saveAll([]);
        return [];
      }
      if (err instanceof SyntaxError) {
        throw new Error(`Malformed JSON in ${this.filePath}: ${err.message}`);
      }
      throw new Error(`Unable to read ${this.filePath}: ${err.message}`);
    }
  }

  async saveAll(records) {
    if (!Array.isArray(records)) {
      throw new Error(`saveAll() expects an array for ${this.filePath}.`);
    }
    const dir = path.dirname(this.filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
      const data = JSON.stringify(records, null, 2);
      await fs.writeFile(this.filePath, data, 'utf8');
    } catch (err) {
      throw new Error(`Unable to write ${this.filePath}: ${err.message}`);
    }
  }
}

module.exports = JsonFileRepository;
