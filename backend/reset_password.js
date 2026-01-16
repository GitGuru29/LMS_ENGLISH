const db = require('./database');
const bcrypt = require('bcryptjs');

const newPass = "admin123";
const hash = bcrypt.hashSync(newPass, 10);

db.run("UPDATE users SET password = ? WHERE role = 'admin'", [hash], function (err) {
    if (err) {
        console.error("Error updating password:", err);
    } else {
        console.log(`Admin password reset to: ${newPass}`);
        console.log(`Changes: ${this.changes}`);
    }
});
