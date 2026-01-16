# LMS English - Ver 2.0 Walkthrough

## 1. New Admin Dashboard Features
Login as `admin` / `admin123`.

### A. Class Management (Sidebar)
- **Grade Switching**: Use the Sidebar to switch between Grade 6, 7, 8...
- **Content Isolation**: Materials and Students are isolated by grade.

### B. Material Management (Default View)
- **Categories**: Click tabs to filter: "Past Papers", "Grammar", "New Words", "Notices".
- **Upload**: Select a Category tab -> Fill Title -> Choose File -> Upload.
- **Verification**: The uploaded file appears *only* in that Category for that Grade.

### C. Student Management (Click "Students" Toggle)
- **View Students**: Lists all students registered for the active grade.
- **Add Student**:
    - Click "Add Student".
    - Enter Name, ID, **Google Email** (New!), Password.
    - Click Add.
- **Verification**: Logout -> Login with the new student credentials -> Verify they see the correct grade materials.

## 2. Student Experience
- Login (e.g., `student_grade6` / `password`).
- Dashboard now shows the material list with **Category Tags** (e.g., "Grammar Activities").
- Secure PDF viewing remains active (watermarked).

## 3. Database Changes
- **SQLite Schema Updated**:
    - `users` table now has `email`.
    - `materials` table now has `category`.
