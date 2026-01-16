const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./lms.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            full_name TEXT,
            email TEXT,
            role TEXT,
            grade INTEGER
        )`);

        // Materials Table
        db.run(`CREATE TABLE IF NOT EXISTS materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            category TEXT,
            grade INTEGER,
            filename TEXT,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Favorites Table
        db.run(`CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            material_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(material_id) REFERENCES materials(id)
        )`);

        // Create Admin if not exists
        const adminQuery = "SELECT * FROM users WHERE role = ?";
        db.get(adminQuery, ['admin'], (err, row) => {
            if (!row) {
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync("admin123", salt);
                db.run("INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)",
                    ['admin', hash, 'System Admin', 'admin']);
                console.log("Default Admin created: admin / admin123");
            }
        });
    });
}

module.exports = db;
