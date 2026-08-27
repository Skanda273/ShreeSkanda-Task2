const API_BASE = '/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('task2_jwt_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  register: async (name, email, password, role) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    return res.json();
  },

  getCurrentUser: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Courses
  getCourses: async () => {
    const res = await fetch(`${API_BASE}/courses`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Assignments
  getAssignments: async (courseId = null) => {
    const url = courseId ? `${API_BASE}/assignments?course_id=${courseId}` : `${API_BASE}/assignments`;
    const res = await fetch(url, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  getAssignmentDetail: async (id) => {
    const res = await fetch(`${API_BASE}/assignments/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  createAssignment: async (data) => {
    const res = await fetch(`${API_BASE}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Submissions & Group Acknowledgment
  submitAssignment: async (assignmentId, content, fileUrl, action = 'submit') => {
    const res = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ assignment_id: assignmentId, content, file_url: fileUrl, action })
    });
    return res.json();
  },

  getProfessorSubmissions: async (assignmentId) => {
    const res = await fetch(`${API_BASE}/professor/submissions/${assignmentId}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  }
};
