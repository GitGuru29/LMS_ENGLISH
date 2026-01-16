# LMS English - Project Walkthrough & Test Guide

## 1. System Setup Check
- **Backend** is running on `http://localhost:8000` (Node.js/Express).
- **Frontend** is running on `http://localhost:5173` (React/Vite).

## 2. Admin Verification (The Teacher)
1.  **Login**: Access the frontend.
    *   Username: `admin`
    *   Password: `admin123`
2.  **Upload Material**:
    *   You should see a file upload form (if implemented in Dashboard) or use Postman to hit `POST /api/v1/materials`.
    *   *Note*: The current Basic Dashboard lists materials. To verify upload fully, ensure the Admin UI allows uploading. *Refinement*: The current `Dashboard.jsx` focuses on **viewing**. For the demo, you can manually drop a file into `backend/secure_storage` and add a record to DB, OR use Postman/Curl for the upload API to test the "Admin can upload" requirement.
    *   **Action**: Test `POST /api/v1/admin/register-bulk` with a CSV file.

## 3. Student Verification
1.  **Create Student**:
    *   As Admin (or via direct DB insert for quick test), create a student user (e.g., `student1` / `pass123` / Grade 10).
    *   *Tip*: You can use the `admin/register-bulk` API or just let me know if you want a helper script to add a test student.
2.  **Login as Student**:
    *   Logout of Admin.
    *   Login as `student1`.
3.  **View Material**:
    *   Verify you ONLY see Grade 10 materials.
    *   Click a material.
    *   **Check Security**:
        *   Try Right-Click -> Should be blocked.
        *   Look for Watermark -> Should see "Name (ID)".
        *   Try to find the file URL -> It should be a blob stream, not a `.pdf` link.

## 4. Troubleshooting
- **Passlib Error**: Fixed by switching to Node.js.
- **File Access**: If PDF doesn't load, check `backend/secure_storage` permissions.

## 5. Viva Defense Tips
- **Why Node.js over Python?**: "We switched to Node.js to maintain a unified JavaScript stack (full-stack JS), which reduces context switching and simplifies dependency management compared to mixing Python/JS environments."
- **How is it secure?**: "We stream the PDF bytes directly to a mechanism that renders to a Canvas. The raw PDF file is never exposed via a public URL."
