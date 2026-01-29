# Multi-Database Configuration Guide

Complete guide for configuring different databases in Laju framework.

## Table of Contents

1. [Overview](#overview)
2. [SQLite (Default)](#sqlite-default)
3. [PostgreSQL](#postgresql)
4. [MySQL / MariaDB](#mysql--mariadb)
5. [Connection Pooling](#connection-pooling)
6. [Migration Differences](#migration-differences)
7. [Switching Databases](#switching-databases)

---

## Overview

Laju supports multiple databases through Knex.js:

| Database | Client | Use Case |
|----------|--------|----------|
| **SQLite** | `better-sqlite3` | Development, small apps, embedded |
| **PostgreSQL** | `pg` | Production, scalable applications |
| **MySQL/MariaDB** | `mysql2` | Production, web applications |

### Environment Variables

All database configuration is done via environment variables in `.env`:

```env
# Required: Database client type
DB_CLIENT=better-sqlite3

# For SQLite only
DB_FILENAME=./data/dev.sqlite3

# For PostgreSQL/MySQL
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=laju

# Connection pooling (PostgreSQL/MySQL only)
DB_POOL_MIN=0
DB_POOL_MAX=10

# Alternative: Use connection string (PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

---

## SQLite (Default)

SQLite is the default database, perfect for development and small applications.

### Installation

SQLite driver is included by default:

```bash
# Already included in package.json
npm install better-sqlite3
```

### Configuration

```env
DB_CLIENT=better-sqlite3
DB_FILENAME=./data/dev.sqlite3
```

### Features

- **WAL Mode** - Automatically enabled for better concurrency
- **Native Service** - `SQLite` service provides direct access for 2-4x faster reads
- **Zero Configuration** - Works out of the box

### Native SQLite Service

For maximum performance, use the native SQLite service:

```typescript
import SQLite from "app/services/SQLite";

// Check if SQLite is available
if (SQLite.isAvailable) {
  // 2-4x faster than Knex for simple reads
  const user = SQLite.get('SELECT * FROM users WHERE id = ?', [id]);
  const posts = SQLite.all('SELECT * FROM posts ORDER BY created_at DESC');
}
```

---

## PostgreSQL

PostgreSQL is recommended for production applications.

### Installation

```bash
npm install pg
```

### Configuration

```env
DB_CLIENT=pg
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=laju
```

Or use a connection string:

```env
DB_CLIENT=pg
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
```

### Connection Pooling

```env
DB_POOL_MIN=0
DB_POOL_MAX=10
```

### Usage

```typescript
import DB from "app/services/DB";

// Same Knex API works across all databases
const users = await DB.from("users").where("active", true);
```

---

## MySQL / MariaDB

MySQL and MariaDB are supported through the `mysql2` driver.

### Installation

```bash
npm install mysql2
```

### Configuration

```env
DB_CLIENT=mysql2
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=laju
```

### Connection Pooling

```env
DB_POOL_MIN=0
DB_POOL_MAX=10
```

---

## Connection Pooling

Connection pooling is automatically configured based on database type:

| Database | Min Connections | Max Connections |
|----------|----------------|-----------------|
| SQLite | 1 | 1 (single file) |
| PostgreSQL | 0 | 10 |
| MySQL | 0 | 10 |

### Custom Pool Settings

```env
DB_POOL_MIN=0
DB_POOL_MAX=20
```

### Best Practices

- Set `DB_POOL_MIN=0` to allow idle connections to close
- Adjust `DB_POOL_MAX` based on your server resources
- For serverless, keep pools small (2-5)

---

## Migration Differences

Some SQL features differ between databases. Here's how to handle them:

### Auto-Increment

```typescript
// Works on all databases
table.increments('id').primary();
```

### Timestamps

```typescript
// Use bigInteger for Unix timestamps (recommended)
table.bigInteger('created_at');
table.bigInteger('updated_at');

// Or use native timestamps (database-specific)
table.timestamps(true, true); // PostgreSQL/MySQL
```

### Boolean Fields

```typescript
// Works on all databases
table.boolean('is_active').defaultTo(false);
```

### JSON Fields

```typescript
// PostgreSQL - native JSONB
table.jsonb('metadata');

// MySQL - JSON type
table.json('metadata');

// SQLite - stored as TEXT
table.text('metadata'); // Parse with JSON.parse()
```

### Full-Text Search

```typescript
// PostgreSQL
await DB.raw(`
  ALTER TABLE posts ADD COLUMN search_vector tsvector;
  CREATE INDEX posts_search_idx ON posts USING gin(search_vector);
`);

// MySQL
await DB.raw(`
  ALTER TABLE posts ADD FULLTEXT(title, content);
`);

// SQLite - use FTS5
await DB.raw(`
  CREATE VIRTUAL TABLE posts_fts USING fts5(title, content);
`);
```

---

## Switching Databases

### From SQLite to PostgreSQL

1. **Update `.env`:**
   ```env
   DB_CLIENT=pg
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=laju
   ```

2. **Install driver:**
   ```bash
   npm install pg
   ```

3. **Run migrations:**
   ```bash
   npx knex migrate:latest
   ```

4. **Migrate data (if needed):**
   ```bash
   # Export SQLite data
   sqlite3 ./data/dev.sqlite3 .dump > backup.sql
   
   # Import to PostgreSQL (may need SQL adjustments)
   psql -d laju -f backup.sql
   ```

### Important Notes

- The `SQLite` native service is **only available** when using SQLite
- Using `SQLite` service with PostgreSQL/MySQL will throw an error
- Always use the `DB` service (Knex) for cross-database compatibility

---

## Next Steps

- [Database Guide](03-DATABASE.md) - Basic database operations
- [Migrations](03-DATABASE.md#migrations) - Create and run migrations
- [Performance Tips](18-PERFORMANCE.md) - Optimize database queries
