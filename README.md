# EduPortal - Task 2: Enhanced Course & Assignment Management Platform

> **Full-Stack Implementation Guide, Architecture & Deployment Manual**  
> Built according to the official **Task-2 Specifications** using **Node.js, Express.js, PostgreSQL (with dual-engine fallback)**, **React.js (Vite)**, and **Tailwind CSS**.

---

## 🌟 Executive Summary & UI/UX Design Rationale

The primary objective of Task 2 is to enhance the **UI/UX**, **backend logic**, and **database schema** of the course assignment management system.

### Key UI/UX Design Choices:
1. **Modern Glassmorphic Dark Aesthetics**: Built with high-contrast slate surfaces (`#0b0f19`), frosted glass elements (`backdrop-filter: blur(16px)`), vibrant gradient accents, and custom micro-animations to create a premium, state-of-the-art visual experience.
2. **Role-Based Workflows (Student vs. Professor)**:
   - **Student View**: Responsive grid displaying enrolled courses (`CS101`, `CS202`), assignment deadlines, and progress bars.
   - **Professor View**: Dashboard showing taught courses, student counts, completion rates, submission status breakdown (Acknowledged, Submitted, Pending), and assignment creation tools.
3. **Group Leader Acknowledgment System**:
   - For **Group Assignments**, only the designated **Group Leader** has authority to submit or acknowledge work.
   - When the leader acknowledges, the status **automatically synchronizes across all team members** in real-time! Non-leaders receive clear visual prompts explaining group leader submission rights.
4. **Visual Progress Tracking**:
   - Interactive progress bars (0-100%), status badges (`Pending`, `Submitted`, `Acknowledged`), and visual toasts.

---

## 🏗️ Architecture & Component Hierarchy

```mermaid
graph TD
    User([User / Web Browser]) -->|JWT Header| ReactApp[React Frontend - Vite + Tailwind]
    
    subgraph Frontend Architecture
        ReactApp --> AuthCtx[Auth Context]
        ReactApp --> Nav[Navbar Component]
        ReactApp --> StudentDash[Student Dashboard]
        ReactApp --> ProfDash[Professor Dashboard]
        StudentDash --> AssignModal[Assignment Detail Modal]
        ProfDash --> CreateModal[Create Assignment Modal]
    end

    subgraph Backend Architecture
        ReactApp -->|REST API Requests| ExpressServer[Express.js Server]
        ExpressServer --> AuthMW[JWT Auth Middleware]
        ExpressServer --> Controllers[Controllers: Auth, Courses, Assignments, Submissions]
        Controllers --> DBHandler{Database Driver}
        DBHandler -->|Primary DB| PG[PostgreSQL Database]
        DBHandler -->|Resilient Fallback| MemoryEngine[In-Memory Stateful Engine]
    end
```

---

## 🗄️ Database Schema & Data Relationships

The PostgreSQL database structure is defined in `backend/schema.sql`:

```mermaid
erDiagram
    USERS ||--o{ COURSES : "teaches (Professors)"
    USERS ||--o{ COURSE_ENROLLMENTS : "enrolls (Students)"
    COURSES ||--o{ COURSE_ENROLLMENTS : "has students"
    COURSES ||--o{ ASSIGNMENTS : "contains"
    ASSIGNMENTS ||--o{ GROUPS : "has team groups"
    GROUPS ||--o{ GROUP_MEMBERS : "contains members"
    USERS ||--o{ GROUP_MEMBERS : "belongs to"
    ASSIGNMENTS ||--o{ SUBMISSIONS : "receives"
    USERS ||--o{ SUBMISSIONS : "submits"
```

### PostgreSQL DDL Summary:
- **`users`**: `id`, `name`, `email`, `password_hash`, `role` ('student' | 'professor'), `avatar_url`.
- **`courses`**: `id`, `code`, `title`, `description`, `professor_id`.
- **`course_enrollments`**: `course_id`, `student_id`.
- **`assignments`**: `id`, `course_id`, `title`, `description`, `deadline`, `submission_type` ('individual' | 'group').
- **`groups`**: `id`, `assignment_id`, `name`, `leader_id`.
- **`group_members`**: `group_id`, `student_id`.
- **`submissions`**: `id`, `assignment_id`, `student_id`, `group_id`, `content`, `status` ('pending' | 'submitted' | 'acknowledged'), `acknowledged_by`.

---

## 💻 Step-by-Step Local Setup & Execution Guide

### Prerequisites:
- Node.js (v16+ or v18+) installed.
- (Optional) PostgreSQL installed locally, or use default built-in stateful engine.

---

### Step 1: Start Backend Server

1. Open terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Configure environment variables in `.env`:
   ```env
   PORT=5000
   JWT_SECRET=task2_super_secret_jwt_key_2026
   DATABASE_URL=postgres://postgres:password@localhost:5432/task2_db
   ```
   *Note: If PostgreSQL is not running, the system will automatically fall back to the in-memory persistent database engine so you can test immediately!*
4. Run the backend server:
   ```bash
   npm start
   ```
   *Output: `🚀 Task 2 Backend Server running on http://localhost:5000`*

---

### Step 2: Start Frontend Application

1. Open a new terminal tab and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open your browser at **`http://localhost:3000`**.

---

### 🔑 Pre-Seeded Demo Credentials (1-Click Login Enabled):

| Role | Email | Password | Features / View |
| :--- | :--- | :--- | :--- |
| **Student (Leader)** | `alex@student.edu` | `password123` | Can submit/acknowledge group assignments for team |
| **Student (Member)** | `sarah@student.edu` | `password123` | Team member view (synchronized status) |
| **Faculty / Professor** | `professor@university.edu` | `password123` | Course analytics, submission monitoring, create assignment |

---

## 🚀 Step-by-Step Deployment Guide

### 1. Deploy Frontend to Vercel or Netlify
1. Push your repository to GitHub.
2. Sign in to **Vercel** or **Netlify** and click **Import Project**.
3. Select the `frontend` folder as the Root Directory.
4. Set Build Command: `npm run build` and Output Directory: `dist`.
5. Set Environment Variable: `VITE_API_BASE_URL` pointing to your deployed backend URL.

### 2. Deploy Backend to Render or Railway
1. Go to **Render.com** -> Create a new **Web Service**.
2. Connect your GitHub repository and set the Root Directory to `backend`.
3. Set Build Command: `npm install` and Start Command: `node server.js`.
4. Add Environment Variables:
   - `JWT_SECRET`: (Any secure secret string)
   - `DATABASE_URL`: (Connection string from Supabase / Neon / Render PostgreSQL)

### 3. PostgreSQL Database (Supabase / Neon)
1. Create a free PostgreSQL instance on **Supabase** or **Neon.tech**.
2. Run the SQL script from `backend/schema.sql` inside your database SQL editor.
3. Copy the database connection string and set `DATABASE_URL` in your backend deployment.

---

## 🎥 Optional Video Walkthrough Script

When recording your video demo:
1. **Introduction**: Show the responsive glassmorphic landing & authentication page.
2. **Student Dashboard Flow**:
   - Log in as Student (`alex@student.edu`).
   - Demonstrate course filtering (`CS101` and `CS202`).
   - Open individual assignment, submit GitHub URL, and click **Acknowledge Submission**.
3. **Group Leader Acknowledgment Demonstration**:
   - Open group assignment `Group Web API Architecture`.
   - Show that Alex Johnson is the **Group Leader**.
   - Acknowledge submission as Alex -> Log out -> Log in as member Sarah (`sarah@student.edu`).
   - Highlight that Sarah's status has automatically updated to **Acknowledged**!
4. **Professor Analytics Flow**:
   - Log in as Faculty (`professor@university.edu`).
   - Demonstrate real-time submission progress bar, student roster, and creating a new assignment.
