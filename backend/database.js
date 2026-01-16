const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

class DatabaseAdapter {
    constructor() {
        this.type = process.env.DATABASE_URL ? 'postgres' : 'sqlite';
        this.client = null;
        this.init();
    }

    init() {
        if (this.type === 'postgres') {
            console.log("Using PostgreSQL Database (Render/Production)");
            this.client = new Client({
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false }
            });
            this.client.connect()
                .then(() => {
                    console.log('Connected to PostgreSQL database.');
                    this.initDb();
                })
                .catch(err => console.error('PostgreSQL Connection Error:', err));
        } else {
            console.log("Using SQLite Database (Local/Development)");
            this.client = new sqlite3.Database('./lms.db', (err) => {
                if (err) {
                    console.error('Error opening SQLite database', err.message);
                } else {
                    console.log('Connected to SQLite database.');
                    this.initDb();
                }
            });
        }
    }

    // Convert SQL query placeholders from ? to $1, $2, etc. for Postgres
    _convertQuery(sql) {
        if (this.type !== 'postgres') return sql;

        // Simple regex to replace ? with $1, $2, etc.
        let i = 1;
        // This is a basic implementation. For complex queries with '?' inside strings it might fail, 
        // but for standard parameterized queries it works well.
        return sql.replace(/\?/g, () => `$${i++}`);
    }

    // --- Core API Wrapper Methods ---

    // Get single row
    get(sql, params = [], callback) {
        if (this.type === 'postgres') {
            const pgSql = this._convertQuery(sql);
            this.client.query(pgSql, params)
                .then(res => {
                    // Normalize casing if needed (PG usually returns lowercase col names)
                    // But here we rely on standard column names
                    callback(null, res.rows[0]);
                })
                .catch(err => callback(err, null));
        } else {
            this.client.get(sql, params, callback);
        }
    }

    // Get all rows
    all(sql, params = [], callback) {
        if (this.type === 'postgres') {
            const pgSql = this._convertQuery(sql);
            this.client.query(pgSql, params)
                .then(res => callback(null, res.rows))
                .catch(err => callback(err, null));
        } else {
            this.client.all(sql, params, callback);
        }
    }

    // Run query (Insert/Update/Delete)
    run(sql, params = [], callback) {
        if (this.type === 'postgres') {
            // For Inserts, we need the "lastID" equivalent.
            // Postgres supports RETURNING id.
            let pgSql = this._convertQuery(sql);

            // Check if it's an INSERT and add RETURNING id if not present
            // This is a naive heuristic but works for standard LMS use cases
            const isInsert = /^\s*INSERT\s+INTO/i.test(pgSql);
            if (isInsert && !/RETURNING/i.test(pgSql)) {
                pgSql += ' RETURNING id';
            }

            this.client.query(pgSql, params)
                .then(res => {
                    // Create a context similar to SQLite's `this`
                    const context = {
                        lastID: isInsert && res.rows[0] ? res.rows[0].id : null,
                        changes: res.rowCount
                    };
                    if (callback) callback.call(context, null); // Execute callback with context
                })
                .catch(err => {
                    if (callback) callback(err);
                });
        } else {
            this.client.run(sql, params, callback);
        }
    }

    // Shim for prepare (mainly used in bulk insert)
    prepare(sql) {
        if (this.type === 'postgres') {
            // Return a dummy object with run/finalize that uses the adapter's run
            const adapter = this;
            return {
                run: function (...args) {
                    // run(params...)
                    const params = args;
                    adapter.run(sql, params);
                },
                finalize: function () { } // No-op for PG
            };
        } else {
            return this.client.prepare(sql);
        }
    }

    serialize(callback) {
        if (this.type === 'postgres') {
            callback(); // Just run it immediately
        } else {
            this.client.serialize(callback);
        }
    }

    initDb() {
        const createTable = (sql) => {
            if (this.type === 'postgres') {
                // Adjust schema syntax for Postgres
                // 1. INTEGER PRIMARY KEY AUTOINCREMENT -> SERIAL PRIMARY KEY
                // 2. DATETIME DEFAULT CURRENT_TIMESTAMP -> TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                let pgSql = sql
                    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
                    .replace(/DATETIME/gi, 'TIMESTAMP');

                this.client.query(pgSql).catch(err => console.error("Table Creation Error:", err));
            } else {
                this.client.run(sql);
            }
        };

        this.serialize(() => {
            // Users Table
            createTable(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT,
                full_name TEXT,
                email TEXT,
                role TEXT,
                grade INTEGER,
                plain_password TEXT,
                current_token TEXT
            )`); // Note: plain_password/token added to match current schema state

            // Materials Table
            createTable(`CREATE TABLE IF NOT EXISTS materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                category TEXT,
                grade INTEGER,
                filename TEXT,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Favorites Table
            createTable(`CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                material_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(material_id) REFERENCES materials(id)
            )`);

            // Create Admin if not exists
            const adminQuery = "SELECT * FROM users WHERE role = ?";

            // We use the wrapper `get` to abstract the query
            // BUT initDb is usually run internally. Let's just use our helper methods.
            this.get(adminQuery, ['admin'], (err, row) => {
                if (!row) {
                    const salt = bcrypt.genSaltSync(10);
                    const hash = bcrypt.hashSync("admin123", salt);
                    this.run("INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)",
                        ['admin', hash, 'System Admin', 'admin'],
                        (err) => {
                            if (!err) console.log("Default Admin created: admin / admin123");
                        }
                    );
                }
            });
        });
    }
}

// Singleton instance
const db = new DatabaseAdapter();
module.exports = db;
