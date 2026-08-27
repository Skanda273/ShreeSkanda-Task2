const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

let pool = null;
let isPgConnected = false;

// Check if PostgreSQL configuration is available
const connectionString = process.env.DATABASE_URL;

if (connectionString || (process.env.PGUSER && process.env.PGDATABASE)) {
  pool = new Pool({
    connectionString: connectionString || `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  pool.connect()
    .then(client => {
      console.log('⚡ Connected to PostgreSQL Database');
      isPgConnected = true;
      client.release();
    })
    .catch(err => {
      console.warn('⚠️ PostgreSQL connection failed. Using in-memory persistent store fallback for seamless operation.', err.message);
      isPgConnected = false;
    });
} else {
  console.log('ℹ️ No PostgreSQL environment variable set. Running with In-Memory Persistent Database Engine.');
}

// IN-MEMORY DATABASE FALLBACK WITH COMPLETE PRE-SEEDED DEMO DATA
const defaultPasswordHash = bcrypt.hashSync('password123', 10);

const memoryDb = {
  users: [
    { id: 1, name: 'Dr. Robert Smith', email: 'professor@university.edu', password_hash: defaultPasswordHash, role: 'professor', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert' },
    { id: 2, name: 'Alex Johnson', email: 'alex@student.edu', password_hash: defaultPasswordHash, role: 'student', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    { id: 3, name: 'Sarah Connor', email: 'sarah@student.edu', password_hash: defaultPasswordHash, role: 'student', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: 4, name: 'Michael Scott', email: 'michael@student.edu', password_hash: defaultPasswordHash, role: 'student', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael' }
  ],
  courses: [
    { id: 1, code: 'CS101', title: 'Full-Stack Web Development', description: 'Comprehensive introduction to modern web architectures, React, Node.js and SQL.', professor_id: 1 },
    { id: 2, code: 'CS202', title: 'Database Systems & Design', description: 'Relational database architecture, indexing, normalization, and distributed SQL.', professor_id: 1 }
  ],
  course_enrollments: [
    { id: 1, course_id: 1, student_id: 2 },
    { id: 2, course_id: 1, student_id: 3 },
    { id: 3, course_id: 1, student_id: 4 },
    { id: 4, course_id: 2, student_id: 2 },
    { id: 5, course_id: 2, student_id: 3 }
  ],
  assignments: [
    { id: 1, course_id: 1, title: 'Individual Dashboard UI Design', description: 'Build a responsive glassmorphic React dashboard with stateful components and smooth animations.', deadline: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(), submission_type: 'individual', max_score: 100 },
    { id: 2, course_id: 1, title: 'Group Web API Architecture', description: 'Design and implement a full RESTful Express backend with JWT security in a team.', deadline: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(), submission_type: 'group', max_score: 100 },
    { id: 3, course_id: 2, title: 'Relational Schema Optimization', description: 'Optimize complex PostgreSQL query execution plans and indexed joins.', deadline: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(), submission_type: 'individual', max_score: 100 }
  ],
  groups: [
    { id: 1, assignment_id: 2, name: 'Alpha Dev Squad', leader_id: 2 }
  ],
  group_members: [
    { id: 1, group_id: 1, student_id: 2 },
    { id: 2, group_id: 1, student_id: 3 }
  ],
  submissions: [
    { id: 1, assignment_id: 1, student_id: 2, group_id: null, content: 'https://github.com/alex/react-dashboard-task', status: 'submitted', submitted_at: new Date().toISOString(), acknowledged_at: null, acknowledged_by: null, score: null, feedback: null },
    { id: 2, assignment_id: 2, student_id: 2, group_id: 1, content: 'https://github.com/alpha-dev-squad/group-api', status: 'acknowledged', submitted_at: new Date().toISOString(), acknowledged_at: new Date().toISOString(), acknowledged_by: 2, score: 95, feedback: 'Great team architecture!' },
    { id: 3, assignment_id: 2, student_id: 3, group_id: 1, content: 'https://github.com/alpha-dev-squad/group-api', status: 'acknowledged', submitted_at: new Date().toISOString(), acknowledged_at: new Date().toISOString(), acknowledged_by: 2, score: 95, feedback: 'Great team architecture!' }
  ]
};

module.exports = {
  pool,
  isPgConnected: () => isPgConnected,
  memoryDb
};
