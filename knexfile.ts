import type { Knex } from "knex";
import "dotenv/config";

/**
 * Multi-Database Configuration for Laju Framework
 * 
 * Supports:
 * - SQLite (better-sqlite3) - Default, embedded database
 * - PostgreSQL (pg) - Production-ready relational database
 * - MySQL (mysql2) - Popular relational database
 * 
 * Configure via environment variables:
 * - DB_CLIENT: Database client (better-sqlite3, pg, mysql2)
 * - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME: Connection details
 * - DB_FILENAME: SQLite file path (for SQLite only)
 */

// Get database client from environment
const DB_CLIENT = process.env.DB_CLIENT || "better-sqlite3";

/**
 * Build connection configuration based on DB_CLIENT
 */
function buildConnectionConfig(): Knex.StaticConnectionConfig | string {
  switch (DB_CLIENT) {
    case "pg":
    case "postgresql":
      // Support connection string or individual parameters
      if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
      }
      return {
        host: process.env.DB_HOST || "127.0.0.1",
        port: parseInt(process.env.DB_PORT || "5432"),
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "laju",
      };

    case "mysql":
    case "mysql2":
      return {
        host: process.env.DB_HOST || "127.0.0.1",
        port: parseInt(process.env.DB_PORT || "3306"),
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "laju",
      };

    case "better-sqlite3":
    case "sqlite3":
    default:
      return {
        filename: process.env.DB_FILENAME || "./data/dev.sqlite3",
      };
  }
}

/**
 * Build pool configuration based on database type
 */
function buildPoolConfig(): Knex.PoolConfig {
  // SQLite uses single connection
  if (DB_CLIENT === "better-sqlite3" || DB_CLIENT === "sqlite3") {
    return { min: 1, max: 1 };
  }

  // PostgreSQL/MySQL use connection pool
  return {
    min: parseInt(process.env.DB_POOL_MIN || "0"),
    max: parseInt(process.env.DB_POOL_MAX || "10"),
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  };
}

/**
 * Check if using SQLite
 */
function isSQLite(): boolean {
  return DB_CLIENT === "better-sqlite3" || DB_CLIENT === "sqlite3";
}

/**
 * Get normalized client name
 */
function getClientName(): string {
  switch (DB_CLIENT) {
    case "pg":
    case "postgresql":
      return "pg";
    case "mysql":
    case "mysql2":
      return "mysql2";
    case "better-sqlite3":
    case "sqlite3":
    default:
      return "better-sqlite3";
  }
}

// Main configuration
const config: { [key: string]: Knex.Config } = {
  development: {
    client: getClientName(),
    connection: buildConnectionConfig(),
    pool: buildPoolConfig(),
    useNullAsDefault: isSQLite(),
    migrations: {
      directory: "./migrations",
    },
  },

  production: {
    client: getClientName(),
    connection: buildConnectionConfig(),
    pool: buildPoolConfig(),
    useNullAsDefault: isSQLite(),
    migrations: {
      directory: "./migrations",
    },
  },

  test: {
    client: "better-sqlite3",
    connection: {
      filename: "./data/test.sqlite3",
    },
    useNullAsDefault: true,
    migrations: {
      directory: "./migrations",
    },
  },
};

export default config;

// Export helper functions for use in other modules
export { isSQLite, getClientName, DB_CLIENT };