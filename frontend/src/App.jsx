import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { StudentDashboard } from './components/StudentDashboard';
import { ProfessorDashboard } from './components/ProfessorDashboard';
import { AssignmentDetailModal } from './components/AssignmentDetailModal';
import { CreateAssignmentModal } from './components/CreateAssignmentModal';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courses, setCourses] = useState([]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-brand-400 mx-auto" />
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading EduPortal Task 2 System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1">
        {!user ? (
          activeTab === 'login' ? (
            <Login onSwitchToRegister={() => setActiveTab('register')} />
          ) : (
            <Register onSwitchToLogin={() => setActiveTab('login')} />
          )
        ) : user.role === 'student' ? (
          <StudentDashboard onSelectAssignment={(a) => setSelectedAssignment(a)} />
        ) : (
          <ProfessorDashboard
            onCreateAssignmentClick={() => setShowCreateModal(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 EduPortal Task 2 - Course & Assignment Management Engine</p>
          <p className="mt-1 text-[11px] text-slate-600">Built with Node.js, Express, PostgreSQL / Memory Engine & React Tailwind CSS</p>
        </div>
      </footer>

      {/* Assignment Detail Modal */}
      {selectedAssignment && (
        <AssignmentDetailModal
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
        />
      )}

      {/* Create Assignment Modal (Professor) */}
      {showCreateModal && (
        <CreateAssignmentModal
          courses={[
            { id: 1, code: 'CS101', title: 'Full-Stack Web Development' },
            { id: 2, code: 'CS202', title: 'Database Systems & Design' }
          ]}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            window.location.reload();
          }}
        />
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
