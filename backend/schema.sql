-- PostgreSQL Schema for Task 2 Assignment & Group Management System

-- Drop tables if exists (for clean migration)
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS course_enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table (Students & Professors)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'professor')),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Courses Table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    professor_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Course Enrollments (Student -> Course Relationship)
CREATE TABLE course_enrollments (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, student_id)
);

-- 4. Assignments Table
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    submission_type VARCHAR(20) NOT NULL CHECK (submission_type IN ('individual', 'group')),
    max_score INT DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Groups Table (for group assignments)
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    assignment_id INT REFERENCES assignments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    leader_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Group Members Table
CREATE TABLE group_members (
    id SERIAL PRIMARY KEY,
    group_id INT REFERENCES groups(id) ON DELETE CASCADE,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, student_id)
);

-- 7. Submissions Table (Tracking acknowledgments & status)
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INT REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    group_id INT REFERENCES groups(id) ON DELETE SET NULL,
    content TEXT,
    file_url VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'acknowledged')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by INT REFERENCES users(id),
    feedback TEXT,
    score INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);

-- SEED DATA SETUP
-- Passwords below are bcrypt hashed for string 'password123'
INSERT INTO users (name, email, password_hash, role, avatar_url) VALUES
('Dr. Robert Smith', 'professor@university.edu', '$2a$10$wE47xL7q3tVzZ.GvO5TfTe2Vz7Z1q.L5n4x1u.GvO5TfTe2Vz7Z1q', 'professor', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert'),
('Alex Johnson', 'alex@student.edu', '$2a$10$wE47xL7q3tVzZ.GvO5TfTe2Vz7Z1q.L5n4x1u.GvO5TfTe2Vz7Z1q', 'student', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'),
('Sarah Connor', 'sarah@student.edu', '$2a$10$wE47xL7q3tVzZ.GvO5TfTe2Vz7Z1q.L5n4x1u.GvO5TfTe2Vz7Z1q', 'student', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'),
('Michael Scott', 'michael@student.edu', '$2a$10$wE47xL7q3tVzZ.GvO5TfTe2Vz7Z1q.L5n4x1u.GvO5TfTe2Vz7Z1q', 'student', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael');

INSERT INTO courses (code, title, description, professor_id) VALUES
('CS101', 'Full-Stack Web Development', 'Comprehensive introduction to modern web architectures, React, Node.js and SQL.', 1),
('CS202', 'Database Systems & Design', 'Relational database architecture, indexing, normalization, and distributed SQL.', 1);

INSERT INTO course_enrollments (course_id, student_id) VALUES
(1, 2), (1, 3), (1, 4),
(2, 2), (2, 3);

INSERT INTO assignments (course_id, title, description, deadline, submission_type, max_score) VALUES
(1, 'Individual Dashboard UI Design', 'Build a responsive glassmorphic React dashboard with stateful components and smooth animations.', NOW() + INTERVAL '5 days', 'individual', 100),
(1, 'Group Web API Architecture', 'Design and implement a full RESTful Express backend with JWT security in a team.', NOW() + INTERVAL '10 days', 'group', 100),
(2, 'Relational Schema Optimization', 'Optimize complex PostgreSQL query execution plans and indexed joins.', NOW() + INTERVAL '3 days', 'individual', 100);

-- Create a group for assignment 2 where Alex Johnson (ID 2) is the leader, and Sarah Connor (ID 3) is member
INSERT INTO groups (assignment_id, name, leader_id) VALUES
(2, 'Alpha Dev Squad', 2);

INSERT INTO group_members (group_id, student_id) VALUES
(1, 2),
(1, 3);

-- Initial Submissions
INSERT INTO submissions (assignment_id, student_id, content, status, submitted_at) VALUES
(1, 2, 'https://github.com/alex/react-dashboard-task', 'submitted', NOW() - INTERVAL '1 day');
