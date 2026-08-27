const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { pool, isPgConnected, memoryDb } = require('./db');
const { verifyToken, requireRole, JWT_SECRET } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Helper response generator
const sendSuccess = (res, data, message = 'Success') => res.json({ success: true, message, ...data });
const sendError = (res, message, status = 400) => res.status(status).json({ success: false, error: message });

// -------------------------------------------------------------
// 1. AUTHENTICATION ROUTES
// -------------------------------------------------------------

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return sendError(res, 'Name, email, password, and role (student/professor) are required.');
    }

    if (!['student', 'professor'].includes(role)) {
      return sendError(res, 'Role must be either student or professor.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    if (isPgConnected()) {
      // PostgreSQL insertion
      const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return sendError(res, 'User with this email already exists.');
      }

      const result = await pool.query(
        'INSERT INTO users (name, email, password_hash, role, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, avatar_url',
        [name, email, hashedPassword, role, avatarUrl]
      );
      const user = result.rows[0];

      // Auto enroll student in default demo course
      if (role === 'student') {
        await pool.query('INSERT INTO course_enrollments (course_id, student_id) VALUES (1, $1), (2, $1)', [user.id]);
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
      return sendSuccess(res, { token, user });
    } else {
      // In-Memory DB
      const existing = memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return sendError(res, 'User with this email already exists.');
      }

      const newUser = {
        id: memoryDb.users.length + 1,
        name,
        email,
        password_hash: hashedPassword,
        role,
        avatar_url: avatarUrl
      };
      memoryDb.users.push(newUser);

      if (role === 'student') {
        memoryDb.course_enrollments.push({ id: memoryDb.course_enrollments.length + 1, course_id: 1, student_id: newUser.id });
        memoryDb.course_enrollments.push({ id: memoryDb.course_enrollments.length + 1, course_id: 2, student_id: newUser.id });
      }

      const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name }, JWT_SECRET, { expiresIn: '24h' });
      return sendSuccess(res, { token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, avatar_url: newUser.avatar_url } });
    }
  } catch (err) {
    console.error('Register error:', err);
    sendError(res, 'Server error during registration.', 500);
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, 'Email and password are required.');
    }

    if (isPgConnected()) {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return sendError(res, 'Invalid credentials.');
      }
      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return sendError(res, 'Invalid credentials.');
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
      return sendSuccess(res, {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url }
      });
    } else {
      const user = memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return sendError(res, 'Invalid credentials.');
      }
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return sendError(res, 'Invalid credentials.');
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
      return sendSuccess(res, {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url }
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    sendError(res, 'Server error during login.', 500);
  }
});

// GET /api/auth/me
app.get('/api/auth/me', verifyToken, async (req, res) => {
  if (isPgConnected()) {
    const result = await pool.query('SELECT id, name, email, role, avatar_url FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return sendError(res, 'User not found', 44);
    return sendSuccess(res, { user: result.rows[0] });
  } else {
    const user = memoryDb.users.find(u => u.id === req.user.id);
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, { user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url } });
  }
});

// -------------------------------------------------------------
// 2. COURSE MANAGEMENT ROUTES
// -------------------------------------------------------------

// GET /api/courses
app.get('/api/courses', verifyToken, async (req, res) => {
  try {
    if (isPgConnected()) {
      if (req.user.role === 'professor') {
        const result = await pool.query(`
          SELECT c.*, 
            (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as student_count,
            (SELECT COUNT(*) FROM assignments WHERE course_id = c.id) as assignment_count
          FROM courses c WHERE c.professor_id = $1
        `, [req.user.id]);
        return sendSuccess(res, { courses: result.rows });
      } else {
        const result = await pool.query(`
          SELECT c.*, u.name as professor_name,
            (SELECT COUNT(*) FROM assignments WHERE course_id = c.id) as assignment_count
          FROM courses c
          JOIN course_enrollments ce ON ce.course_id = c.id
          JOIN users u ON u.id = c.professor_id
          WHERE ce.student_id = $1
        `, [req.user.id]);
        return sendSuccess(res, { courses: result.rows });
      }
    } else {
      if (req.user.role === 'professor') {
        const courses = memoryDb.courses.filter(c => c.professor_id === req.user.id).map(c => {
          const student_count = memoryDb.course_enrollments.filter(ce => ce.course_id === c.id).length;
          const assignment_count = memoryDb.assignments.filter(a => a.course_id === c.id).length;
          return { ...c, student_count, assignment_count };
        });
        return sendSuccess(res, { courses });
      } else {
        const enrolledCourseIds = memoryDb.course_enrollments.filter(ce => ce.student_id === req.user.id).map(ce => ce.course_id);
        const courses = memoryDb.courses.filter(c => enrolledCourseIds.includes(c.id)).map(c => {
          const prof = memoryDb.users.find(u => u.id === c.professor_id);
          const assignment_count = memoryDb.assignments.filter(a => a.course_id === c.id).length;
          return { ...c, professor_name: prof ? prof.name : 'Faculty Member', assignment_count };
        });
        return sendSuccess(res, { courses });
      }
    }
  } catch (err) {
    console.error('Courses fetch error:', err);
    sendError(res, 'Failed to fetch courses.', 500);
  }
});

// -------------------------------------------------------------
// 3. ASSIGNMENTS & PROGRESS ROUTES
// -------------------------------------------------------------

// GET /api/assignments
app.get('/api/assignments', verifyToken, async (req, res) => {
  try {
    const courseId = req.query.course_id;

    if (isPgConnected()) {
      let query = `
        SELECT a.*, c.code as course_code, c.title as course_title
        FROM assignments a
        JOIN courses c ON c.id = a.course_id
      `;
      let params = [];

      if (courseId) {
        query += ` WHERE a.course_id = $1`;
        params.push(courseId);
      }

      query += ` ORDER BY a.deadline ASC`;
      const result = await pool.query(query, params);
      let assignments = result.rows;

      // Attach submission info if student
      if (req.user.role === 'student') {
        const subResult = await pool.query(
          `SELECT * FROM submissions WHERE student_id = $1`, [req.user.id]
        );
        const subsMap = {};
        subResult.rows.forEach(s => subsMap[s.assignment_id] = s);

        assignments = assignments.map(a => ({
          ...a,
          user_submission: subsMap[a.id] || { status: 'pending' }
        }));
      }

      return sendSuccess(res, { assignments });
    } else {
      let assignments = memoryDb.assignments.filter(a => courseId ? a.course_id == courseId : true);
      assignments = assignments.map(a => {
        const course = memoryDb.courses.find(c => c.id === a.course_id);
        const course_code = course ? course.code : 'CS';
        const course_title = course ? course.title : 'Course';

        let user_submission = { status: 'pending' };
        if (req.user.role === 'student') {
          const sub = memoryDb.submissions.find(s => s.assignment_id === a.id && s.student_id === req.user.id);
          if (sub) user_submission = sub;
        }

        return { ...a, course_code, course_title, user_submission };
      });

      return sendSuccess(res, { assignments });
    }
  } catch (err) {
    console.error('Fetch assignments error:', err);
    sendError(res, 'Failed to fetch assignments.', 500);
  }
});

// GET /api/assignments/:id
app.get('/api/assignments/:id', verifyToken, async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id);

    if (isPgConnected()) {
      const result = await pool.query(
        `SELECT a.*, c.code as course_code, c.title as course_title 
         FROM assignments a 
         JOIN courses c ON c.id = a.course_id 
         WHERE a.id = $1`, [assignmentId]
      );

      if (result.rows.length === 0) return sendError(res, 'Assignment not found', 404);
      const assignment = result.rows[0];

      // Fetch group info if group assignment
      let groupInfo = null;
      if (assignment.submission_type === 'group') {
        const gRes = await pool.query(`
          SELECT g.*, u.name as leader_name 
          FROM groups g 
          JOIN users u ON u.id = g.leader_id 
          WHERE g.assignment_id = $1
        `, [assignmentId]);
        
        if (gRes.rows.length > 0) {
          const group = gRes.rows[0];
          const mRes = await pool.query(`
            SELECT u.id, u.name, u.email, u.avatar_url 
            FROM group_members gm 
            JOIN users u ON u.id = gm.student_id 
            WHERE gm.group_id = $1
          `, [group.id]);
          groupInfo = { ...group, members: mRes.rows };
        }
      }

      // Fetch user submission if student
      let userSubmission = null;
      if (req.user.role === 'student') {
        const subRes = await pool.query(
          `SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2`,
          [assignmentId, req.user.id]
        );
        userSubmission = subRes.rows[0] || { status: 'pending' };
      }

      return sendSuccess(res, { assignment, groupInfo, userSubmission });
    } else {
      const assignment = memoryDb.assignments.find(a => a.id === assignmentId);
      if (!assignment) return sendError(res, 'Assignment not found', 404);

      const course = memoryDb.courses.find(c => c.id === assignment.course_id);
      const assignmentDetail = {
        ...assignment,
        course_code: course ? course.code : 'CS',
        course_title: course ? course.title : 'Course'
      };

      let groupInfo = null;
      if (assignment.submission_type === 'group') {
        const group = memoryDb.groups.find(g => g.assignment_id === assignmentId);
        if (group) {
          const leader = memoryDb.users.find(u => u.id === group.leader_id);
          const memberIds = memoryDb.group_members.filter(gm => gm.group_id === group.id).map(gm => gm.student_id);
          const members = memoryDb.users.filter(u => memberIds.includes(u.id)).map(u => ({ id: u.id, name: u.name, email: u.email, avatar_url: u.avatar_url }));
          groupInfo = { ...group, leader_name: leader ? leader.name : 'Leader', members };
        }
      }

      let userSubmission = null;
      if (req.user.role === 'student') {
        userSubmission = memoryDb.submissions.find(s => s.assignment_id === assignmentId && s.student_id === req.user.id) || { status: 'pending' };
      }

      return sendSuccess(res, { assignment: assignmentDetail, groupInfo, userSubmission });
    }
  } catch (err) {
    console.error('Fetch assignment detail error:', err);
    sendError(res, 'Failed to fetch assignment detail.', 500);
  }
});

// POST /api/assignments (Create assignment - Professor only)
app.post('/api/assignments', verifyToken, requireRole('professor'), async (req, res) => {
  try {
    const { course_id, title, description, deadline, submission_type } = req.body;
    if (!course_id || !title || !description || !deadline || !submission_type) {
      return sendError(res, 'All fields are required.');
    }

    if (isPgConnected()) {
      const result = await pool.query(
        `INSERT INTO assignments (course_id, title, description, deadline, submission_type) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [course_id, title, description, deadline, submission_type]
      );
      return sendSuccess(res, { assignment: result.rows[0] }, 'Assignment created successfully');
    } else {
      const newAssignment = {
        id: memoryDb.assignments.length + 1,
        course_id: parseInt(course_id),
        title,
        description,
        deadline,
        submission_type,
        max_score: 100
      };
      memoryDb.assignments.push(newAssignment);

      // If group assignment, create default group with student Alex Johnson as leader
      if (submission_type === 'group') {
        const newGroup = { id: memoryDb.groups.length + 1, assignment_id: newAssignment.id, name: 'Project Group Alpha', leader_id: 2 };
        memoryDb.groups.push(newGroup);
        memoryDb.group_members.push({ id: memoryDb.group_members.length + 1, group_id: newGroup.id, student_id: 2 });
        memoryDb.group_members.push({ id: memoryDb.group_members.length + 1, group_id: newGroup.id, student_id: 3 });
      }

      return sendSuccess(res, { assignment: newAssignment }, 'Assignment created successfully');
    }
  } catch (err) {
    console.error('Create assignment error:', err);
    sendError(res, 'Failed to create assignment.', 500);
  }
});

// -------------------------------------------------------------
// 4. SUBMISSION & GROUP ACKNOWLEDGMENT LOGIC (PDF CORE)
// -------------------------------------------------------------

// POST /api/submissions (Submit / Acknowledge Assignment)
app.post('/api/submissions', verifyToken, requireRole('student'), async (req, res) => {
  try {
    const { assignment_id, content, file_url, action } = req.body;
    const studentId = req.user.id;

    if (!assignment_id) {
      return sendError(res, 'Assignment ID is required.');
    }

    const submissionStatus = action === 'acknowledge' ? 'acknowledged' : 'submitted';

    if (isPgConnected()) {
      // 1. Get assignment
      const aRes = await pool.query('SELECT * FROM assignments WHERE id = $1', [assignment_id]);
      if (aRes.rows.length === 0) return sendError(res, 'Assignment not found', 404);
      const assignment = aRes.rows[0];

      if (assignment.submission_type === 'group') {
        // Find group
        const gRes = await pool.query(`
          SELECT g.* FROM groups g
          JOIN group_members gm ON gm.group_id = g.id
          WHERE g.assignment_id = $1 AND gm.student_id = $2
        `, [assignment_id, studentId]);

        if (gRes.rows.length === 0) {
          return sendError(res, 'You are not assigned to any group for this assignment.');
        }

        const group = gRes.rows[0];

        // CRITICAL CHECK: ONLY GROUP LEADER CAN SUBMIT / ACKNOWLEDGE
        if (group.leader_id !== studentId) {
          return sendError(res, `Only the designated Group Leader can submit or acknowledge group assignments.`);
        }

        // Get all group members
        const membersRes = await pool.query('SELECT student_id FROM group_members WHERE group_id = $1', [group.id]);
        const memberIds = membersRes.rows.map(m => m.student_id);

        const now = new Date();

        // Update/Insert submission status across ALL group members!
        for (const mId of memberIds) {
          const existingSub = await pool.query('SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2', [assignment_id, mId]);
          if (existingSub.rows.length > 0) {
            await pool.query(
              `UPDATE submissions 
               SET status = $1, content = $2, file_url = $3, acknowledged_at = $4, acknowledged_by = $5, submitted_at = $6
               WHERE assignment_id = $7 AND student_id = $8`,
              [submissionStatus, content || existingSub.rows[0].content, file_url || existingSub.rows[0].file_url, now, studentId, now, assignment_id, mId]
            );
          } else {
            await pool.query(
              `INSERT INTO submissions (assignment_id, student_id, group_id, content, file_url, status, submitted_at, acknowledged_at, acknowledged_by)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [assignment_id, mId, group.id, content, file_url, submissionStatus, now, now, studentId]
            );
          }
        }

        return sendSuccess(res, {
          message: `Group assignment ${submissionStatus} successfully! Status updated for all ${memberIds.length} group members.`
        });
      } else {
        // Individual Assignment Submission
        const now = new Date();
        const existingSub = await pool.query('SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2', [assignment_id, studentId]);

        if (existingSub.rows.length > 0) {
          await pool.query(
            `UPDATE submissions 
             SET status = $1, content = $2, file_url = $3, submitted_at = $4, acknowledged_at = $5
             WHERE assignment_id = $6 AND student_id = $7`,
            [submissionStatus, content || existingSub.rows[0].content, file_url, now, submissionStatus === 'acknowledged' ? now : null, assignment_id, studentId]
          );
        } else {
          await pool.query(
            `INSERT INTO submissions (assignment_id, student_id, content, file_url, status, submitted_at, acknowledged_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [assignment_id, studentId, content, file_url, submissionStatus, now, submissionStatus === 'acknowledged' ? now : null]
          );
        }

        return sendSuccess(res, { message: `Assignment ${submissionStatus} successfully!` });
      }
    } else {
      // In-Memory Logic
      const assignment = memoryDb.assignments.find(a => a.id === parseInt(assignment_id));
      if (!assignment) return sendError(res, 'Assignment not found', 404);

      if (assignment.submission_type === 'group') {
        const group = memoryDb.groups.find(g => g.assignment_id === assignment.id);
        if (!group) return sendError(res, 'Group configuration not found.');

        // Check leader
        if (group.leader_id !== studentId) {
          const leaderUser = memoryDb.users.find(u => u.id === group.leader_id);
          return sendError(res, `Only the group leader (${leaderUser ? leaderUser.name : 'Leader'}) can submit/acknowledge group assignments.`);
        }

        const memberIds = memoryDb.group_members.filter(gm => gm.group_id === group.id).map(gm => gm.student_id);
        const now = new Date().toISOString();

        // Update across all group members
        memberIds.forEach(mId => {
          let sub = memoryDb.submissions.find(s => s.assignment_id === assignment.id && s.student_id === mId);
          if (sub) {
            sub.status = submissionStatus;
            if (content) sub.content = content;
            if (file_url) sub.file_url = file_url;
            sub.submitted_at = now;
            sub.acknowledged_at = now;
            sub.acknowledged_by = studentId;
          } else {
            memoryDb.submissions.push({
              id: memoryDb.submissions.length + 1,
              assignment_id: assignment.id,
              student_id: mId,
              group_id: group.id,
              content: content || 'Group submission completed by leader',
              file_url: file_url || '',
              status: submissionStatus,
              submitted_at: now,
              acknowledged_at: now,
              acknowledged_by: studentId
            });
          }
        });

        return sendSuccess(res, {
          message: `Group assignment ${submissionStatus} successfully! Synchronized across all ${memberIds.length} team members.`
        });
      } else {
        // Individual logic
        const now = new Date().toISOString();
        let sub = memoryDb.submissions.find(s => s.assignment_id === assignment.id && s.student_id === studentId);
        if (sub) {
          sub.status = submissionStatus;
          if (content) sub.content = content;
          if (file_url) sub.file_url = file_url;
          sub.submitted_at = now;
          if (submissionStatus === 'acknowledged') sub.acknowledged_at = now;
        } else {
          memoryDb.submissions.push({
            id: memoryDb.submissions.length + 1,
            assignment_id: assignment.id,
            student_id: studentId,
            group_id: null,
            content: content || '',
            file_url: file_url || '',
            status: submissionStatus,
            submitted_at: now,
            acknowledged_at: submissionStatus === 'acknowledged' ? now : null
          });
        }

        return sendSuccess(res, { message: `Assignment ${submissionStatus} successfully!` });
      }
    }
  } catch (err) {
    console.error('Submission error:', err);
    sendError(res, 'Failed to submit assignment.', 500);
  }
});

// GET /api/professor/submissions/:assignmentId (Professor monitoring view)
app.get('/api/professor/submissions/:assignmentId', verifyToken, requireRole('professor'), async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id || req.params.assignmentId);

    if (isPgConnected()) {
      const aRes = await pool.query('SELECT * FROM assignments WHERE id = $1', [assignmentId]);
      if (aRes.rows.length === 0) return sendError(res, 'Assignment not found', 404);
      const assignment = aRes.rows[0];

      const courseStudents = await pool.query(
        `SELECT u.id, u.name, u.email, u.avatar_url 
         FROM users u 
         JOIN course_enrollments ce ON ce.student_id = u.id 
         WHERE ce.course_id = $1`, [assignment.course_id]
      );

      const submissionsRes = await pool.query('SELECT * FROM submissions WHERE assignment_id = $1', [assignmentId]);
      const subsMap = {};
      submissionsRes.rows.forEach(s => subsMap[s.student_id] = s);

      const studentStatuses = courseStudents.rows.map(student => {
        const sub = subsMap[student.id] || { status: 'pending' };
        return {
          student,
          submission: sub
        };
      });

      const totalStudents = courseStudents.rows.length;
      const submittedCount = studentStatuses.filter(s => s.submission.status === 'submitted' || s.submission.status === 'acknowledged').length;
      const acknowledgedCount = studentStatuses.filter(s => s.submission.status === 'acknowledged').length;
      const pendingCount = totalStudents - submittedCount;
      const completionPercentage = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

      return sendSuccess(res, {
        assignment,
        analytics: {
          totalStudents,
          submittedCount,
          acknowledgedCount,
          pendingCount,
          completionPercentage
        },
        studentStatuses
      });
    } else {
      const assignment = memoryDb.assignments.find(a => a.id === assignmentId);
      if (!assignment) return sendError(res, 'Assignment not found', 404);

      const enrolledStudentIds = memoryDb.course_enrollments.filter(ce => ce.course_id === assignment.course_id).map(ce => ce.student_id);
      const enrolledStudents = memoryDb.users.filter(u => enrolledStudentIds.includes(u.id));

      const studentStatuses = enrolledStudents.map(student => {
        const sub = memoryDb.submissions.find(s => s.assignment_id === assignmentId && s.student_id === student.id) || { status: 'pending' };
        return {
          student: { id: student.id, name: student.name, email: student.email, avatar_url: student.avatar_url },
          submission: sub
        };
      });

      const totalStudents = enrolledStudents.length;
      const submittedCount = studentStatuses.filter(s => s.submission.status === 'submitted' || s.submission.status === 'acknowledged').length;
      const acknowledgedCount = studentStatuses.filter(s => s.submission.status === 'acknowledged').length;
      const pendingCount = totalStudents - submittedCount;
      const completionPercentage = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

      return sendSuccess(res, {
        assignment,
        analytics: {
          totalStudents,
          submittedCount,
          acknowledgedCount,
          pendingCount,
          completionPercentage
        },
        studentStatuses
      });
    }
  } catch (err) {
    console.error('Professor submissions view error:', err);
    sendError(res, 'Failed to retrieve submission analytics.', 500);
  }
});

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    database: isPgConnected() ? 'PostgreSQL Active' : 'In-Memory DB Active (Fallback Mode)'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Task 2 Backend Server running on http://localhost:${PORT}`);
});
