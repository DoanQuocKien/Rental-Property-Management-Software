const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'rental.db');

const db = new sqlite3.Database(DB_PATH);

function ensureColumn(tableName, columnName, columnDef) {
  db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
    if (err || !Array.isArray(columns)) {
      return;
    }

    const exists = columns.some((column) => column.name === columnName);
    if (!exists) {
      db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
    }
  });
}

db.runAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function onRun(err) {
    if (err) {
      return reject(err);
    }
    resolve({ lastID: this.lastID, changes: this.changes });
  });
});

db.getAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) {
      return reject(err);
    }
    resolve(row);
  });
});

db.allAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) {
      return reject(err);
    }
    resolve(rows);
  });
});

db.closeAsync = () => new Promise((resolve, reject) => {
  db.close((err) => {
    if (err) {
      return reject(err);
    }
    resolve();
  });
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL DEFAULT '',
      phone_number TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'tenant',
      citizen_id TEXT,
      permanent_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  ensureColumn('users', 'full_name', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('users', 'phone_number', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('users', 'citizen_id', 'TEXT');
  ensureColumn('users', 'permanent_address', 'TEXT');

  db.run(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'Standard',
      price REAL NOT NULL,
      area REAL,
      max_occupants INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'available',
      landlord_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (landlord_id) REFERENCES users(id)
    )
  `, () => {
    ensureColumn('rooms', 'category', "TEXT NOT NULL DEFAULT 'Standard'");
    ensureColumn('rooms', 'max_occupants', 'INTEGER NOT NULL DEFAULT 1');
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS lease_contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      deposit REAL NOT NULL,
      is_expired INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES users(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_lease_contracts_tenant_id ON lease_contracts(tenant_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_lease_contracts_room_id ON lease_contracts(room_id)');

  db.run(`
    CREATE TABLE IF NOT EXISTS meter_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      electricity_index REAL NOT NULL,
      water_index REAL NOT NULL,
      recorded_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_meter_readings_room_id ON meter_readings(room_id)');

  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      reading_id INTEGER,
      total_amount REAL NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'Unpaid',
      due_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (reading_id) REFERENCES meter_readings(id)
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_invoices_room_id ON invoices(room_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_invoices_reading_id ON invoices(reading_id)');

  db.run(`
    CREATE TABLE IF NOT EXISTS maintenance_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      staff_id INTEGER,
      description TEXT NOT NULL,
      issue_photo TEXT,
      priority TEXT NOT NULL DEFAULT 'Medium',
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES users(id),
      FOREIGN KEY (staff_id) REFERENCES users(id)
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_maintenance_requests_tenant_id ON maintenance_requests(tenant_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_maintenance_requests_staff_id ON maintenance_requests(staff_id)');

  db.run(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      jti TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      revoked INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      revoked_at DATETIME,
      replaced_by_jti TEXT,
      last_used_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash)');

  db.run(`
    CREATE TABLE IF NOT EXISTS revoked_access_tokens (
      jti TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_revoked_access_expires_at ON revoked_access_tokens(expires_at)');
});

module.exports = db;
