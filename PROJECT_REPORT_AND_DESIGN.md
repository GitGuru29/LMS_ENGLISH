# Secure Web-Based Learning Material Management System
## Industrial Training Project Design & Report

### A. System Architecture

**High-Level Architecture Diagram Description:**
The system follows a Client-Server architecture with a decoupled frontend and backend.

1.  **Client (Student/Admin)**:
    *   Web Browser (Chrome, Firefox, Safari).
    *   Single Page Application (SPA) built with **React**.
    *   Communicates with backend via REST API (JSON).
    *   Renders PDFs using a library like `react-pdf` (rendering to Canvas/SVG to prevent direct download).

2.  **Backend (API Server)**:
    *   **Node.js + Express** application.
    *   Stateless REST API.
    *   Handles Authentication (JWT).
    *   Handles Authorization (Role-based: Admin vs. Student).
    *   Serves PDF *streams* to the frontend (protected routes).

3.  **Database**:
    *   **PostgreSQL** (hosted on Render or similar free tier).
    *   Stores User data (Students, Admins), Class info, File metadata.
    *   *Note*: Binary file content (PDFs) will be stored in a secure cloud object store (e.g., AWS S3, Google Cloud Storage, or securely on the file system if limited—but for free tier Render/Vercel, an external object store is best. However, constraints mention "File storage must be private". We can use a database BLOB for small scale or a free tier S3 compatible storage like Backblaze B2 or Cloudinary. *Design Decision for Free Tier*: Database BLOB is risky for size limits. **Cloudinary** (free tier is generous) or **Firebase Storage** is often good. For this strictly constrained "private" requirement, we will assume **Render Disk** (ephemeral, bad) or **Database** (persistent but limited space).
    *   *Revised Decision*: **Supabase Storage** or **UploadThing** or slightly abusing **PostgreSQL** for small files (if files < 10MB and total < 500MB). Given "Industrial Project", we should recommend **Cloud Cloud Storage (AWS S3 Free Tier / B2 / Supabase Storage)**. We will design for **S3-compatible storage** where the backend generates presigned URLs or proxies the content. *Actually, to enforce strict security (no direct download links), the Backend will PROXY the file stream.*

4.  **Hosting**:
    *   **Frontend**: Vercel (Global CDN, serves static assets).
    *   **Backend**: Render (Node.js runtime).

### B. Secure Backend API Design

**Base URL**: `/api/v1`

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | | | |
| POST | `/auth/login` | Public | Login with Student ID/Admin Username & Password. Returns JWT. |
| POST | `/auth/admin/register-bulk` | Admin | Upload CSV to bulk register students. |
| **Users** | | | |
| GET | `/users/me` | User | Get current user profile. |
| **Materials** | | | |
| GET | `/materials` | User | List materials available for the logged-in user's grade. |
| POST | `/materials` | Admin | Upload a new PDF (Title, Grade, File). |
| DELETE | `/materials/{id}` | Admin | Delete a material. |
| GET | `/materials/{id}/stream` | User | **Core Security Feature**. Stream PDF binary content. Checks Grade & Auth. |

### C. Database Schema (PostgreSQL)

**Tables:**

1.  **users**
    *   `id` (PK, Integer, Auto-increment)
    *   `username` (String, Unique) -> Student ID or Admin Username
    *   `hashed_password` (String)
    *   `role` (Enum: 'admin', 'student')
    *   `grade` (Integer, Nullable) -> 6-11 (Null for Admin)
    *   `full_name` (String) -> Used for Watermarking
    *   `is_active` (Boolean, Default True)

2.  **materials**
    *   `id` (PK, Integer, Auto-increment)
    *   `title` (String)
    *   `grade` (Integer) -> 6-11
    *   `filename` (String) -> Storage reference
    *   `content_type` (String) -> e.g., 'application/pdf'
    *   `uploaded_at` (Timestamp)

3.  **audit_logs** (Optional but good for industrial projects)
    *   `id` (PK)
    *   `user_id` (FK -> users.id)
    *   `action` (String) -> "VIEW_MATERIAL", "LOGIN"
    *   `timestamp` (Timestamp)

### F. Security Measures & System Limitations

**Security Measures (The "Defense"):**
1.  **Authentication & Authorization**: JWT (JSON Web Tokens) with short expiration options. Middleware ensures students specifically match the target `grade` of the material they request.
2.  **No Direct Links**: Files are NOT stored in a `public/` folder. They are served via a backend API endpoint (`/stream`) that validates the session token before yielding a single byte.
3.  **PDF Rendering**: The frontend uses `react-pdf` (based on PDF.js) to render the PDF to an HTML `<canvas>`. This means there is no underlying `<a>` tag or simple image to drag-and-drop.
4.  **Deterrents**:
    *   **Dynamic Watermark**: An overlay `<div>` or canvas layer repeats the logged-in student's Name and ID diagonally across the viewer.
    *   **Right-Click Disabling**: JavaScript listeners on the viewer component prevent context menus.
    *   **Text Selection Disabling**: CSS `user-select: none`.

**System Limitations (The "Honest Truth"):**
1.  **Screenshots**: We cannot technically stop OS-level screenshots (PrintScreen key) or external photos (phone camera). This is a limit of the web platform. *Mitigation*: The watermark ensures any leaked screenshot identifies the leaker.
2.  **Technical Savvy Users**: A very advanced user could inspect network traffic to capture the PDF stream chunks. *Mitigation*: We implement chunked transfer or single-use tokens if needed, but for O/L students, simple auth-gated streams are usually sufficient defense.
3.  **Hosting Limits**: Free tiers on Render spin down after inactivity (cold starts ~50s).

### G. Industrial Training Project Report Outline

1.  **Chapter 1: Introduction**
    *   1.1 Background (Private Tuition Context)
    *   1.2 Problem Statement (Unauthorized sharing of materials)
    *   1.3 Objectives (Secure delivery, Grade-based access)
    *   1.4 Scope & Limitations

2.  **Chapter 2: Literature Review**
    *   Existing LMS solutions (Moodle, Google Classroom) vs. Custom Needs (Specific O/L constraints).

3.  **Chapter 3: Methodology**
    *   3.1 SDLC Model (Agile/Waterfall)
    *   3.2 Requirement Analysis
    *   3.3 Technology Stack Justification (React/FastAPI/Postgres).

4.  **Chapter 4: System Design**
    *   4.1 Architecture Diagram
    *   4.2 Database Schema (ER Diagram)
    *   4.3 UI/UX Design (Wireframes)

5.  **Chapter 5: Implementation**
    *   5.1 Backend Implementation (Auth implementation details)
    *   5.2 Frontend Implementation (PDF Viewer & Watermarking logic)

6.  **Chapter 6: Testing & Validation**
    *   6.1 Unit Testing
    *   6.2 User Acceptance Testing (UAT)

7.  **Chapter 7: Conclusion & Future Enhancements**

### H. Deployment Guidance (Free Tier)

1.  **Database**: Create a free PostgreSQL database on **Neon.tech** or **Render**. Copy the `DATABASE_URL`.
2.  **Backend (Render)**:
    *   Connect GitHub repo.
    *   Build Command: `npm install`
    *   Start Command: `node server.js`
    *   Env Vars: `SECRET_KEY`.
3.  **Frontend (Vercel)**:
    *   Connect GitHub repo.
    *   Framework Preset: Vite.
    *   Build Command: `npm run build`
    *   Env Vars: `VITE_API_URL` (The Render backend URL).

---
