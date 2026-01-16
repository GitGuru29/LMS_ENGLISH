const db = require('./database');

db.run("ALTER TABLE users ADD COLUMN current_token TEXT", (err) => {
    if (err) {
        if (err.message.includes("duplicate column name")) {
            console.log("Column 'current_token' already exists.");
        } else {
            console.error("Error adding column:", err);
        }
    } else {
        console.log("Column 'current_token' added successfully.");
    }
});
