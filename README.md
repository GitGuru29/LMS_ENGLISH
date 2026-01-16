# Secure LMS for O/L English
## Industrial Training Project

**Project Title**: Secure Web-Based Learning Material Management System for O/L English Classes
**Client**: Private English Teacher (Grades 6-11)

### Quick Start

This repository contains the architecture design and code skeletons for the project.

**Key Documents:**
- [PROJECT_REPORT_AND_DESIGN.md](./PROJECT_REPORT_AND_DESIGN.md): **READ THIS FIRST**. Contains the System Architecture, DB Schema, Security Analysis, and Project Report Outline.

**Directory Structure:**
- `backend/`: FastAPI implementation skeleton.
    - Run: `pip install -r requirements.txt` then `uvicorn main:app --reload`
- `frontend/`: React component structure.
    - This is a partial skeleton. To initialize a full app, run `npx create-vite@latest frontend --template react` and then copy the `src` folder contents provided here into it.

### Core Features Implemented in Skeleton
1.  **Auth**: JWT Application with Role-Based Access Control (RBAC).
2.  **Secure File Storage**: `main.py` handles file uploads and secured streaming.
3.  **Deterrence**: `PDFViewer.jsx` implements client-side rendering with watermarking and right-click disabling.
