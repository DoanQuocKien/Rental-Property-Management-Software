const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'rental.db');

const db = new sqlite3.Database(DB_PATH);

function buildDemoRoomName(letterIndex, numberIndex) {
  return `${String.fromCharCode(65 + letterIndex)}${numberIndex}`;
}

function ensureColumn(tableName, columnName, columnDef) {
  db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
    if (err || !Array.isArray(columns)) {
      return;
    }

    const exists = columns.some((column) => column.name === columnName);
    if (!exists) {
      // SQLite cannot ADD COLUMN with non-constant defaults like CURRENT_TIMESTAMP.
      const hasNonConstantDefault = /\bDEFAULT\s+\(?\s*(CURRENT_(TIME|DATE|TIMESTAMP)|datetime\s*\()/i.test(columnDef);
      const safeColumnDef = hasNonConstantDefault
        ? columnDef.replace(/\s+DEFAULT\s+\(?\s*(CURRENT_(TIME|DATE|TIMESTAMP)|datetime\s*\([^)]*\))\s*\)?/i, '')
        : columnDef;

      db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${safeColumnDef}`, (alterErr) => {
        if (alterErr) {
          console.error(`Failed to add column ${tableName}.${columnName}: ${alterErr.message}`);
        }
      });
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
      phone TEXT,
      citizen_id TEXT,
      permanent_address TEXT,
      date_of_birth TEXT,
      gender TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  ensureColumn('users', 'full_name', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('users', 'phone_number', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('users', 'phone', 'TEXT');
  ensureColumn('users', 'citizen_id', 'TEXT');
  ensureColumn('users', 'permanent_address', 'TEXT');
  ensureColumn('users', 'date_of_birth', 'TEXT');
  ensureColumn('users', 'gender', 'TEXT');
  ensureColumn('users', 'status', "TEXT NOT NULL DEFAULT 'active'");
  ensureColumn('users', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

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
      rental_price REAL,
      status TEXT DEFAULT 'active',
      is_expired INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES users(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_lease_contracts_tenant_id ON lease_contracts(tenant_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_lease_contracts_room_id ON lease_contracts(room_id)');

  ensureColumn('lease_contracts', 'rental_price', 'REAL');
  ensureColumn('lease_contracts', 'status', "TEXT DEFAULT 'active'");

  db.run(`
    CREATE TABLE IF NOT EXISTS meter_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER,
      room_id INTEGER NOT NULL,
      electricity_index REAL NOT NULL DEFAULT 0,
      water_index REAL NOT NULL DEFAULT 0,
      prev_electricity_index REAL DEFAULT 0,
      prev_water_index REAL DEFAULT 0,
      recorded_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_meter_readings_room_id ON meter_readings(room_id)');

  ensureColumn('meter_readings', 'invoice_id', 'INTEGER');
  ensureColumn('meter_readings', 'prev_electricity_index', 'REAL DEFAULT 0');
  ensureColumn('meter_readings', 'prev_water_index', 'REAL DEFAULT 0');

  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      reading_id INTEGER,
      contract_id INTEGER,
      month INTEGER,
      year INTEGER,
      rent_amount REAL DEFAULT 0,
      electricity_amount REAL DEFAULT 0,
      water_amount REAL DEFAULT 0,
      service_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'Unpaid',
      status TEXT DEFAULT 'unpaid',
      due_date DATE NOT NULL,
      payment_method TEXT,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES lease_contracts(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (reading_id) REFERENCES meter_readings(id)
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_invoices_room_id ON invoices(room_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_invoices_reading_id ON invoices(reading_id)');

  ensureColumn('invoices', 'contract_id', 'INTEGER');
  ensureColumn('invoices', 'month', 'INTEGER');
  ensureColumn('invoices', 'year', 'INTEGER');
  ensureColumn('invoices', 'rent_amount', 'REAL DEFAULT 0');
  ensureColumn('invoices', 'electricity_amount', 'REAL DEFAULT 0');
  ensureColumn('invoices', 'water_amount', 'REAL DEFAULT 0');
  ensureColumn('invoices', 'service_amount', 'REAL DEFAULT 0');
  ensureColumn('invoices', 'status', "TEXT DEFAULT 'unpaid'");
  ensureColumn('invoices', 'payment_method', 'TEXT');
  ensureColumn('invoices', 'paid_at', 'DATETIME');

  db.run(`
    CREATE TABLE IF NOT EXISTS maintenance_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER,
      room_id INTEGER,
      tenant_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'pending',
      assigned_to INTEGER,
      resolution_note TEXT,
      staff_id INTEGER,
      issue_photo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES users(id),
      FOREIGN KEY (staff_id) REFERENCES users(id)
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_maintenance_requests_tenant_id ON maintenance_requests(tenant_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_maintenance_requests_staff_id ON maintenance_requests(staff_id)');

  ensureColumn('maintenance_requests', 'contract_id', 'INTEGER');
  ensureColumn('maintenance_requests', 'room_id', 'INTEGER');
  ensureColumn('maintenance_requests', 'category', "TEXT DEFAULT 'general'");
  ensureColumn('maintenance_requests', 'assigned_to', 'INTEGER');
  ensureColumn('maintenance_requests', 'resolution_note', 'TEXT');
  ensureColumn('maintenance_requests', 'issue_photo', 'TEXT');

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

  setInterval(() => {
    db.run(
      `DELETE FROM revoked_access_tokens WHERE expires_at < datetime('now')`,
      (err) => { if (err) console.error('Cleanup revoked_access_tokens error:', err.message); }
    );
    db.run(
      `DELETE FROM refresh_tokens WHERE revoked = 1 AND revoked_at < datetime('now', '-7 days')`,
      (err) => { if (err) console.error('Cleanup refresh_tokens error:', err.message); }
    );
  }, 60 * 60 * 1000);

  (async () => {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    try {
      const roomCountRow = await db.getAsync('SELECT COUNT(*) AS count FROM rooms');
      if (Number(roomCountRow?.count || 0) > 0) {
        return;
      }

      const landlords = await db.allAsync(
        `SELECT id
         FROM users
         WHERE role IN ('landlord', 'Owner', 'Manager')
           AND status = 'active'`
      );

      if (!landlords.length) {
        return;
      }

      const letters = Array.from({ length: 26 }, (_, index) => index);
      const numbers = Array.from({ length: 21 }, (_, index) => index);

      await db.runAsync('BEGIN TRANSACTION');

      try {
        for (const landlord of landlords) {
          for (const letterIndex of letters) {
            for (const numberIndex of numbers) {
              const roomName = buildDemoRoomName(letterIndex, numberIndex);
              const sequenceIndex = letterIndex * numbers.length + numberIndex;

              await db.runAsync(
                `INSERT INTO rooms (name, description, category, price, area, max_occupants, status, landlord_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  roomName,
                  `Phòng trống mẫu ${roomName}`,
                  'Demo',
                  1200000 + sequenceIndex * 15000,
                  12 + (numberIndex % 9) + (letterIndex % 4),
                  1 + (numberIndex % 3 === 0 ? 1 : 0),
                  'available',
                  landlord.id,
                ]
              );
            }
          }
        }

        await db.runAsync('COMMIT');
        console.log(`Seeded demo rooms for ${landlords.length} landlord account(s).`);
      } catch (seedError) {
        await db.runAsync('ROLLBACK').catch(() => {});
        throw seedError;
      }
    } catch (seedError) {
      console.error('Failed to seed demo rooms:', seedError);
    }
  })();
});

module.exports = db;
