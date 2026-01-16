const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('lms.db');

db.serialize(() => {
    db.run("ALTER TABLE users ADD COLUMN plain_password TEXT", (err) => {
        if (err) {
            console.log("Column might already exist or error:", err.message);
        } else {
            console.log("Successfully added plain_password column.");
        }
    });
});

db.close();
