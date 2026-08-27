import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ProgressBar, StatusBadge } from './ProgressBar';
import { BookOpen, Calendar, Users, UserCheck, ArrowRight, CheckCircle2, Clock, Filter, Award, Sparkles, AlertCircle } from 'lucide-react';

export const StudentDashboard = ({ onSelectAssignment }) => {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, aRes] = await Promise.all([api.getCourses(), api.getAssignments()]);
      if (cRes.success) setCourses(cRes.courses);
      if (aRes.success) setAssignments(aRes.assignments);
    } catch (err) {
      console.error('Failed to fetch student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = async (course) => {
    if (selectedCourse?.id === course.id) {
      setSelectedCourse(null);
      const res = await api.getAssignments();
      if (res.success) setAssignments(res.assignments);
    } else {
      setSelectedCourse(course);
      const res = await api.getAssignments(course.id);
      if (res.success) setAssignments(res.assignments);
    }
  };

  const filteredAssignments = assignments.filter(a => {
    if (statusFilter === 'all') return true;
    return a.user_submission?.status === statusFilter;
  });

  const totalAssignments = assignments.length;
  const completedCount = assignments.filter(a => a.user_submission?.status === 'submitted' || a.user_submission?.status === 'acknowledged').length;
  const overallProgress = totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      
      {/* Overview Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Student Learning Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              My Enrolled Courses & Assignments
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Select a course below to filter assignments, view deadlines, and submit group/individual work.
            </p>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shrink-0 min-w-[260px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Progress</span>
              <span className="text-sm font-bold text-brand-400">{completedCount} / {totalAssignments} Completed</span>
            </div>
            <ProgressBar percentage={overallProgress} showLabel={false} size="lg" />
          </div>
        </div>
      </div>

      {/* SECTION 1: Enrolled Courses (Grid Layout) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-400" /> Enrolled Courses ({courses.length})
          </h2>
          {selectedCourse && (
            <button
              onClick={() => handleCourseClick(selectedCourse)}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold underline"
            >
              Clear Filter ({selectedCourse.code})
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(n => (
              <div key={n} className="h-32 glass-card rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {courses.map((course) => {
              const isSelected = selectedCourse?.id === course.id;
              return (
                <div
                  key={course.id}
                  onClick={() => handleCourseClick(course)}
                  className={`glass-card rounded-2xl p-5 cursor-pointer transition-all duration-300 relative group overflow-hidden border ${
                    isSelected
                      ? 'border-brand-500 bg-slate-900/90 shadow-xl shadow-brand-500/10'
                      : 'hover:border-slate-700 hover:bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-brand-500/15 border border-brand-500/25 text-brand-400">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-brand-400 tracking-wider uppercase">{course.code}</span>
                        <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
                          {course.title}
                        </h3>
                      </div>
                    </div>

                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                      {course.assignment_count} Assignments
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs mt-3 line-clamp-2">{course.description}</p>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <span>Instructor: <strong className="text-slate-200">{course.professor_name}</strong></span>
                    <span className="text-brand-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      {isSelected ? 'Viewing Assignments' : 'View Course'} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Course Assignments List & Filter */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              {selectedCourse ? `${selectedCourse.code} Assignments` : 'All Assignments'} ({filteredAssignments.length})
            </h2>
            <p className="text-xs text-slate-400">Click any assignment card to submit or review group status</p>
          </div>

          {/* Status Filter buttons */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {['all', 'pending', 'submitted', 'acknowledged'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Assignments List */}
        {filteredAssignments.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No Assignments Found</h3>
            <p className="text-xs text-slate-500 mt-1">There are no assignments matching your current filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAssignments.map(assignment => {
              const status = assignment.user_submission?.status || 'pending';
              const isGroup = assignment.submission_type === 'group';

              return (
                <div
                  key={assignment.id}
                  onClick={() => onSelectAssignment(assignment)}
                  className="glass-card rounded-2xl p-5 hover:border-brand-500/50 cursor-pointer transition-all duration-300 group flex flex-col justify-between hover:shadow-xl hover:shadow-brand-500/5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                        {assignment.course_code}
                      </span>
                      <StatusBadge status={status} />
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                      {assignment.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{assignment.description}</p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        Deadline:
                      </span>
                      <span className="font-semibold text-amber-400">
                        {new Date(assignment.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" /> Type:
                      </span>
                      <span className={`font-semibold px-2 py-0.5 rounded ${
                        isGroup ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {isGroup ? '👥 Group Work' : '👤 Individual'}
                      </span>
                    </div>

                    <button
                      className="w-full py-2.5 rounded-xl bg-slate-800/80 group-hover:bg-brand-600 text-xs font-semibold text-slate-200 group-hover:text-white transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>View & Submit</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
