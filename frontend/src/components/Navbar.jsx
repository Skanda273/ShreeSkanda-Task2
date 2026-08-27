import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogOut, User, GraduationCap, ShieldCheck } from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              EduPortal <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">Task 2</span>
            </h1>
            <p className="text-xs text-slate-400">Course & Assignment Hub</p>
          </div>
        </div>

        {/* User Info & Navigation */}
        {user ? (
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3 bg-slate-900/60 px-3.5 py-1.5 rounded-full border border-slate-800">
              <img src={user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} alt="Avatar" className="w-7 h-7 rounded-full bg-slate-800" />
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-200 flex items-center gap-1">
                  {user.name}
                  {user.role === 'professor' ? (
                    <span className="bg-purple-500/20 text-purple-400 text-[10px] px-1.5 py-0.2 rounded font-medium border border-purple-500/30">Faculty</span>
                  ) : (
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.2 rounded font-medium border border-emerald-500/30">Student</span>
                  )}
                </p>
                <p className="text-[11px] text-slate-400">{user.email}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('login')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'register'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Register
            </button>
          </div>
        )}

      </div>
    </header>
  );
};
