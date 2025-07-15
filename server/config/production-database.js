const { Pool } = require("pg");

class ProductionDatabase {
  constructor() {
    this.pool = new Pool({
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT || 5432,
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async run(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return {
        id: result.rows[0]?.id || result.insertId,
        changes: result.rowCount,
      };
    } catch (error) {
      throw error;
    }
  }

  async get(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  async all(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async serialize(callback) {
    // PostgreSQL doesn't need serialization like SQLite
    await callback();
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = new ProductionDatabase();
