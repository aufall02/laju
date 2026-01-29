/**
 * Native SQLite Service using better-sqlite3
 * 
 * This service provides direct access to the better-sqlite3 database connection
 * for optimal performance without an ORM or query builder layer.
 * 
 * ⚠️ IMPORTANT: This service is ONLY available when using SQLite database.
 * For PostgreSQL or MySQL, use the DB service (Knex.js) instead.
 */
import "dotenv/config";
import config from "../../knexfile";

// Check if we should load SQLite service
const connectionType = process.env.DB_CONNECTION || 'development';
const dbConfig = config[connectionType];
const clientType = dbConfig?.client;

// Only load SQLite if the client is better-sqlite3 or sqlite3
const isSQLiteClient = clientType === 'better-sqlite3' || clientType === 'sqlite3';

/**
 * SQLite Service interface
 */
interface SQLiteServiceType {
  get<T = Record<string, unknown>>(sql: string, params?: unknown[]): T | undefined;
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): T[];
  run(sql: string, params?: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  transaction<T>(fn: (db: SQLiteServiceType) => T): T;
  getDatabase(): any;
  isAvailable: boolean;
}

/**
 * Create a stub service for non-SQLite databases
 */
function createStubService(): SQLiteServiceType {
  const errorMsg = `SQLite service is not available with ${clientType} client. Use DB service instead.`;
  return {
    get: () => { throw new Error(errorMsg); },
    all: () => { throw new Error(errorMsg); },
    run: () => { throw new Error(errorMsg); },
    transaction: () => { throw new Error(errorMsg); },
    getDatabase: () => null,
    isAvailable: false,
  };
}

/**
 * Create the actual SQLite service
 */
function createSQLiteService(): SQLiteServiceType {
  // Type guard to check if connection has filename property
  interface SQLiteConnectionConfig {
    filename: string;
  }

  // Ensure we have a valid configuration with filename
  if (!dbConfig ||
    !dbConfig.connection ||
    typeof dbConfig.connection !== 'object' ||
    !('filename' in dbConfig.connection)) {
    throw new Error(`Invalid database configuration for connection: ${connectionType}`);
  }

  // Safe to access filename now that we've validated it exists
  const connectionConfig = dbConfig.connection as SQLiteConnectionConfig;

  // Import better-sqlite3 dynamically
  const Database = require('better-sqlite3');
  const nativeDb = new Database(connectionConfig.filename);

  // Set pragmas for better performance
  nativeDb.pragma('journal_mode = WAL');
  nativeDb.pragma('synchronous = NORMAL');
  nativeDb.pragma('foreign_keys = ON');
  nativeDb.pragma('busy_timeout = 5000');

  // Statement cache to reuse prepared statements
  const statementCache: Record<string, any> = {};

  return {
    isAvailable: true,

    /**
     * Get a single row from the database
     * @param sql SQL query with ? placeholders
     * @param params Parameters to bind to the query
     * @returns The first row or undefined if not found
     */
    get<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | undefined {
      try {
        const parameters = Array.isArray(params) ? params : Object.values(params);
        let stmt = statementCache[sql];
        if (!stmt) {
          stmt = nativeDb.prepare(sql);
          statementCache[sql] = stmt;
        }
        return stmt.get(...parameters) as T | undefined;
      } catch (error) {
        console.error('SQLite get error:', error);
        throw error;
      }
    },

    /**
     * Get all rows from the database
     * @param sql SQL query with ? placeholders
     * @param params Parameters to bind to the query
     * @returns Array of rows
     */
    all<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
      try {
        const parameters = Array.isArray(params) ? params : Object.values(params);
        let stmt = statementCache[sql];
        if (!stmt) {
          stmt = nativeDb.prepare(sql);
          statementCache[sql] = stmt;
        }
        return stmt.all(...parameters) as T[];
      } catch (error) {
        console.error('SQLite all error:', error);
        throw error;
      }
    },

    /**
     * Execute a query that modifies the database
     * @param sql SQL query with ? placeholders
     * @param params Parameters to bind to the query
     * @returns Result of the run operation
     */
    run(sql: string, params: unknown[] = []): { changes: number; lastInsertRowid: number | bigint } {
      try {
        const parameters = Array.isArray(params) ? params : Object.values(params);
        let stmt = statementCache[sql];
        if (!stmt) {
          stmt = nativeDb.prepare(sql);
          statementCache[sql] = stmt;
        }
        return stmt.run(...parameters);
      } catch (error) {
        console.error('SQLite run error:', error);
        throw error;
      }
    },

    /**
     * Execute a transaction with multiple statements
     * @param fn Function containing the transaction logic
     * @returns Result of the transaction
     */
    transaction<T>(fn: (db: SQLiteServiceType) => T): T {
      const service = this;
      const transactionFn = nativeDb.transaction(() => {
        return fn(service);
      });
      return transactionFn();
    },

    /**
     * Get the raw database instance
     * @returns The better-sqlite3 database instance
     */
    getDatabase(): any {
      return nativeDb;
    }
  };
}

// Create the appropriate service based on database type
let SQLiteService: SQLiteServiceType;

if (isSQLiteClient) {
  SQLiteService = createSQLiteService();
} else {
  console.info(`SQLite native service is disabled (current client: ${clientType}). Use DB service for database operations.`);
  SQLiteService = createStubService();
}

export default SQLiteService;
