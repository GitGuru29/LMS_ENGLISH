const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;
const SECRET_KEY = process.env.SECRET_KEY || "YOUR_SUPER_SECRET_KEY";

// Middleware
app.use(cors());
app.use(express.json());

// File Upload Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use a secure folder outside public access
        const uploadDir = 'secure_storage';
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Prevent file replacement by adding timestamp
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// --- Middleware: Verify Token ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    // Also check query param for file streaming/viewing
    if (!token && req.query.token) {
        token = req.query.token;
    }

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;

        // Check Single Session (Last Login Wins)
        db.get("SELECT current_token FROM users WHERE id = ?", [user.id], (err, row) => {
            if (err || !row) return res.sendStatus(500);

            // If token in DB exists and doesn't match current token -> Block access
            // Note: We need to handle the case where DB token is null (fresh migration) - allow it or force relogin?
            // Better to allow if null, but update on login. But to enforce strictness:
            if (row.current_token && row.current_token !== token) {
                return res.status(403).json({ error: "Session expired. You are logged in on another device." });
            }
            next();
        });
    });
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).send("Admin Access Required");
    next();
};

// --- Routes ---

// Login
app.post('/api/v1/auth/login', upload.none(), (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err || !user) return res.status(401).json({ error: "User not found" });

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (!isMatch) return res.status(401).json({ error: "Invalid password" });

            const token = jwt.sign({
                id: user.id,
                username: user.username,
                role: user.role,
                grade: user.grade,
                full_name: user.full_name
            }, SECRET_KEY, { expiresIn: '1h' });

            // Enforce Single Session: Update DB with new token
            db.run("UPDATE users SET current_token = ? WHERE id = ?", [token, user.id], (err) => {
                if (err) return res.status(500).json({ error: "Login failed (session error)" });
                res.json({ access_token: token });
            });
        });
    });
});

// Get User Profile
app.get('/api/v1/users/me', authenticateToken, (req, res) => {
    res.json(req.user);
});

// Update User Profile
app.put('/api/v1/users/me', authenticateToken, (req, res) => {
    const { username, password } = req.body;
    const userId = req.user.id;

    if (!username) return res.status(400).send("Username is required");

    // Check if new username is taken
    db.get("SELECT * FROM users WHERE username = ? AND id != ?", [username, userId], (err, existing) => {
        if (err) return res.status(500).send("Database error");
        if (existing) return res.status(400).send("Username already taken");

        let query = "UPDATE users SET username = ?";
        let params = [username];

        if (password && password.trim() !== "") {
            const hash = bcrypt.hashSync(password, 10);
            query += ", password = ?";
            params.push(hash);
        }

        query += " WHERE id = ?";
        params.push(userId);

        db.run(query, params, function (err) {
            if (err) return res.status(500).send("Update failed");

            // Update plain_password if password was changed
            if (password && password.trim() !== "") {
                db.run("UPDATE users SET plain_password = ? WHERE id = ?", [password, userId]);
            }

            res.json({ message: "Profile updated successfully. Please log in again." });
        });
    });
});

// Admin: Bulk Register Students (CSV)
app.post('/api/v1/admin/register-bulk', authenticateToken, isAdmin, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded");

    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            // Process CSV rows: username, password, full_name, grade
            let count = 0;
            const stmt = db.prepare("INSERT OR IGNORE INTO users (username, password, full_name, email, role, grade) VALUES (?, ?, ?, ?, ?, ?)");

            results.forEach(row => {
                if (row.username && row.password && row.grade) {
                    const hash = bcrypt.hashSync(row.password, 10);
                    // Default email to null if not provided
                    const email = row.email || null;
                    stmt.run(row.username, hash, row.full_name, email, 'student', row.grade);
                    count++;
                }
            });
            stmt.finalize();

            // Clean up temp file
            fs.unlinkSync(req.file.path);
            res.json({ message: `Processed ${count} students.` });
        });
});

// Admin: Upload Material
app.post('/api/v1/materials', authenticateToken, isAdmin, upload.single('file'), (req, res) => {
    const { title, grade, category, fileUrl } = req.body; // Accept fileUrl from frontend

    let filename = '';
    if (req.file) {
        filename = req.file.path; // Local upload
    } else if (fileUrl) {
        filename = fileUrl; // Firebase URL
    } else {
        return res.status(400).send("No file or URL provided");
    }

    // Check for duplicate (same filename for same grade and category)
    db.get("SELECT * FROM materials WHERE filename = ? AND grade = ? AND category = ?",
        [filename, grade, category || 'general'],
        (err, existing) => {
            if (err) return res.status(500).send("Database error");

            if (existing) {
                return res.status(409).json({
                    error: "Duplicate file detected. This file has already been uploaded for this grade and category."
                });
            }

            // No duplicate, proceed with insertion
            db.run("INSERT INTO materials (title, grade, category, filename) VALUES (?, ?, ?, ?)",
                [title, grade, category || 'general', filename],
                function (err) {
                    if (err) return res.status(500).send(err.message);
                    res.json({ id: this.lastID, title, grade, category });
                }
            );
        }
    );
});

// Admin: Delete Material
app.delete('/api/v1/materials/:id', authenticateToken, isAdmin, (req, res) => {
    const materialId = req.params.id;

    db.get("SELECT * FROM materials WHERE id = ?", [materialId], (err, material) => {
        if (err) return res.status(500).send("Database error");
        if (!material) return res.status(404).send("Material not found");

        // Delete file from filesystem OR Cloudinary
        const filePath = material.filename;

        if (filePath.includes('cloudinary.com')) {
            // Cloudinary Deletion
            try {
                // Extract Public ID
                const matches = filePath.match(/\/upload\/(?:v\d+\/)?(.+)$/);
                if (matches && matches[1]) {
                    const publicId = matches[1];
                    console.log(`[Delete] Removing from Cloudinary: ${publicId}`);

                    // Cloudinary destroy (async)
                    cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }, (error, result) => {
                        if (error) console.error("Cloudinary Delete Error:", error);
                        else console.log("Cloudinary Delete Result:", result);
                    });
                }
            } catch (e) {
                console.error("Error processing Cloudinary delete:", e);
            }
        } else {
            // Local File Deletion
            const absolutePath = path.resolve(filePath);
            if (fs.existsSync(absolutePath)) {
                try {
                    fs.unlinkSync(absolutePath);
                } catch (e) {
                    console.error("Error deleting local file:", e);
                }
            }
        }

        // Delete from DB
        db.run("DELETE FROM materials WHERE id = ?", [materialId], (err) => {
            if (err) return res.status(500).send("Database error deleting record");
            res.json({ message: "Material deleted successfully" });
        });
    });
});

// List Materials (Filtered by Grade)
app.get('/api/v1/materials', authenticateToken, (req, res) => {
    let query = "SELECT * FROM materials";
    let params = [];

    // Filter by category if provided query param
    const { category } = req.query;

    if (req.user.role !== 'admin') {
        query += " WHERE grade = ?";
        params.push(req.user.grade);
        if (category) {
            query += " AND category = ?";
            params.push(category);
        }
    } else {
        // Admin View: Can filter by grade AND category
        const { grade } = req.query;
        if (grade) {
            query += " WHERE grade = ?";
            params.push(grade);
            if (category) {
                query += " AND category = ?";
                params.push(category);
            }
        } else if (category) {
            query += " WHERE category = ?";
            params.push(category);
        }
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).send("Database error");
        res.json(rows);
    });
});

// Admin: Add Single Student
app.post('/api/v1/admin/users', authenticateToken, isAdmin, (req, res) => {
    const { username, password, full_name, email, grade } = req.body;
    const hash = bcrypt.hashSync(password, 10);

    db.run("INSERT INTO users (username, password, full_name, email, role, grade, plain_password) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [username, hash, full_name, email, 'student', grade, password],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ id: this.lastID, username, email });
        }
    );
});

// Admin: Update Student (Password Reset)
app.put('/api/v1/admin/users/:id', authenticateToken, isAdmin, (req, res) => {
    const userId = req.params.id;
    const { password } = req.body;

    if (!password) return res.status(400).send("Password is required");

    const hash = bcrypt.hashSync(password, 10);

    db.run("UPDATE users SET password = ?, plain_password = ? WHERE id = ?", [hash, password, userId], function (err) {
        if (err) return res.status(500).send("Database error");
        res.json({ message: "User password updated successfully" });
    });
});

// Admin: Delete Student
app.delete('/api/v1/admin/users/:id', authenticateToken, isAdmin, (req, res) => {
    const userId = req.params.id;
    db.run("DELETE FROM users WHERE id = ?", [userId], function (err) {
        if (err) return res.status(500).send("Database error");
        res.json({ message: "User deleted successfully" });
    });
});

// Admin: List Students by Grade
app.get('/api/v1/admin/users', authenticateToken, isAdmin, (req, res) => {
    const { grade } = req.query;
    let query = "SELECT id, username, full_name, email, grade, role, plain_password FROM users WHERE role = 'student'";
    let params = [];

    if (grade) {
        query += " AND grade = ?";
        params.push(grade);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).send("Database error");
        res.json(rows);
    });
});

const cloudinary = require('cloudinary').v2;

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ... (Rest of imports)

// ...

// Stream PDF (Secure Proxy)
app.get('/api/v1/materials/:id/stream', authenticateToken, (req, res) => {
    const materialId = req.params.id;

    db.get("SELECT * FROM materials WHERE id = ?", [materialId], async (err, material) => { // Async for axios
        if (!material) return res.status(404).send("Material not found");

        // Auth Check
        if (req.user.role !== 'admin' && material.grade != req.user.grade) {
            return res.status(403).send("Access Denied: Wrong Grade");
        }

        let filePath = material.filename;

        // Check if it's a Remote URL (Firebase/Cloudinary)
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            console.log(`[Stream] Original URL: ${filePath}`);

            // SIGN CLOUDINARY URL if needed
            if (filePath.includes('cloudinary.com')) {
                try {
                    // Extract Public ID for Raw Files
                    // Format: .../raw/upload/v12345/filename.pdf OR .../raw/upload/filename.pdf
                    // Regex to capture everything after 'upload/' (and optional version /v\d+/)
                    const matches = filePath.match(/\/upload\/(?:v\d+\/)?(.+)$/);
                    if (matches && matches[1]) {
                        const publicId = matches[1];

                        // Use Private Download URL
                        filePath = cloudinary.utils.private_download_url(publicId, '', {
                            resource_type: 'raw',
                            type: 'upload',
                            attachment: false
                        });
                        console.log(`[Stream] Generated Signed URL: ${filePath}`);
                    }
                } catch (signErr) {
                    console.error("Error signing Cloudinary URL:", signErr);
                    // Fallback to original if signing fails
                }
            }

            try {
                const response = await axios({
                    method: 'get',
                    url: filePath,
                    responseType: 'stream',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Accept': '*/*'
                    }
                });

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'inline; filename="' + material.title + '.pdf"');
                response.data.pipe(res);
            } catch (proxyErr) {
                console.error("Proxy Error:", proxyErr.message);
                if (proxyErr.response) {
                    console.error("Status:", proxyErr.response.status);
                }
                res.status(500).send("Failed to retrieve remote file");
            }
        } else {
            // Local File
            const absolutePath = path.resolve(filePath);
            if (fs.existsSync(absolutePath)) {
                // Set headers to force inline viewing, not download
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'inline; filename="' + material.title + '.pdf"');

                const stream = fs.createReadStream(absolutePath);
                stream.pipe(res);
            } else {
                res.status(404).send("File missing on server");
            }
        }
    });
});

// --- Admin: Promote All Students ---
app.post('/api/v1/admin/promote-students', authenticateToken, isAdmin, (req, res) => {
    // Step 1: Delete Grade 11 students (graduates)
    db.run("DELETE FROM users WHERE role = 'student' AND grade = 11",
        function (deleteErr) {
            if (deleteErr) return res.status(500).send("Database error during deletion");

            const deletedCount = this.changes;

            // Step 2: Promote remaining students (grade 6-10) to next grade
            db.run("UPDATE users SET grade = grade + 1 WHERE role = 'student' AND grade < 11",
                function (promoteErr) {
                    if (promoteErr) return res.status(500).send("Database error during promotion");

                    const promotedCount = this.changes;
                    res.json({
                        message: `Successfully promoted ${promotedCount} students. ${deletedCount} Grade 11 students graduated and were removed.`,
                        promoted: promotedCount,
                        deleted: deletedCount
                    });
                }
            );
        }
    );
});

// --- Favorites API ---

// Toggle Favorite
app.post('/api/v1/favorites', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { material_id } = req.body;

    if (!material_id) return res.status(400).send("Material ID required");

    // Check if exists
    db.get("SELECT * FROM favorites WHERE user_id = ? AND material_id = ?", [userId, material_id], (err, row) => {
        if (err) return res.status(500).send("Database error");

        if (row) {
            // Exists -> Remove it
            db.run("DELETE FROM favorites WHERE id = ?", [row.id], (err) => {
                if (err) return res.status(500).send("Failed to remove favorite");
                res.json({ favorited: false, message: "Removed from favorites" });
            });
        } else {
            // Not exists -> Add it
            db.run("INSERT INTO favorites (user_id, material_id) VALUES (?, ?)", [userId, material_id], (err) => {
                if (err) return res.status(500).send("Failed to add favorite");
                res.json({ favorited: true, message: "Added to favorites" });
            });
        }
    });
});

// List User Favorites (IDs only for simple client-side mapping)
app.get('/api/v1/favorites', authenticateToken, (req, res) => {
    const userId = req.user.id;
    db.all("SELECT material_id FROM favorites WHERE user_id = ?", [userId], (err, rows) => {
        if (err) return res.status(500).send("Database error");
        const ids = rows.map(r => r.material_id);
        res.json(ids);
    });
});

// Always start server (works locally and Vercel will ignore this)
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Export for Vercel serverless
module.exports = app;
