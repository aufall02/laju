/**
 * Database Service using Knex.js
 * 
 * This service provides a configured database connection instance using Knex.js query builder.
 * It supports multiple database connections based on different stages (development, production, etc.)
 * and multiple database types (SQLite, PostgreSQL, MySQL).
 */

import config, { isSQLite } from "../../knexfile";
import "dotenv/config";
import DBInstance from "knex";
import { Knex } from "knex";

/**
 * Extended Knex interface that includes a custom connection method
 * for switching between different database configurations
 * 
 * @interface DBType
 * @extends {Knex}
 */
interface DBType extends Knex {
  /**
   * Creates a new database connection for a specific stage
   * @param {string} stage - The environment stage (e.g., 'development', 'production')
   * @returns {DBType} A new database instance for the specified stage
   */
  connection: (stage: string) => DBType;
}

/**
 * Default database instance
 * Uses the configuration from knexfile.js based on DB_CONNECTION environment variable
 * 
 * @example
 * // Using the default connection
 * const users = await DB('users').select('*');
 * 
 * // Using a specific stage connection
 * const stagingDB = DB.connection('staging');
 * const products = await stagingDB('products').select('*');
 */
let DB = DBInstance(config[process.env.DB_CONNECTION as string]) as DBType;

/**
 * Apply SQLite PRAGMAs for better performance and correctness when using better-sqlite3
 * These PRAGMAs are only applied for SQLite databases.
 * 
 * @param instance - The Knex instance to apply PRAGMAs to
 */
function applyDatabaseOptimizations(instance: Knex) {
  const connectionConfig = config[process.env.DB_CONNECTION as string];

  // Only apply SQLite PRAGMAs for SQLite databases
  if (connectionConfig?.client === 'better-sqlite3' || connectionConfig?.client === 'sqlite3') {
    try {
      // WAL mode for better concurrent access
      instance.raw('PRAGMA journal_mode = WAL');
      // NORMAL sync for balance between safety and speed
      instance.raw('PRAGMA synchronous = NORMAL');
      // Enable foreign key constraints
      instance.raw('PRAGMA foreign_keys = ON');
      // Wait 5s before throwing SQLITE_BUSY error
      instance.raw('PRAGMA busy_timeout = 5000');
    } catch (err) {
      // Non-fatal: continue even if PRAGMA fails
      console.warn('Failed to apply SQLite PRAGMA:', err);
    }
  }

  // PostgreSQL optimizations can be added here if needed
  // MySQL optimizations can be added here if needed
}

// Apply optimizations on the default instance
applyDatabaseOptimizations(DB);

/**
 * Method to create a new database connection for a specific stage
 * Useful when needing to connect to different databases in the same application
 * 
 * @param {string} stage - The environment stage to connect to
 * @returns {DBType} A new database instance configured for the specified stage
 */
DB.connection = (stage: string) => {
  const instance = DBInstance(config[stage]) as DBType;
  applyDatabaseOptimizations(instance);
  return instance;
};

export default DB;

/**
 * Check if the current database is SQLite
 * Useful for conditional logic that's SQLite-specific
 */
export { isSQLite };
