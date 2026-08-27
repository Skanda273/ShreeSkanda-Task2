import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ProgressBar, StatusBadge } from './ProgressBar';
import { Plus, BookOpen, Users, CheckCircle2, Clock, ShieldCheck, BarChart3, Filter, ChevronRight, Eye, Calendar, Sparkles } from 'lucide-react';

export const ProfessorDashboard = ({ onCreateAssignmentClick }) => {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionAnalytics, setSubmissionAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, aRes] = await Promise.all([api.getCourses(), api.getAssignments()]);
      if (cRes.success) setCourses(cRes.courses);
      if (aRes.success) {
        setAssignments(aRes.assignments);
        if (aRes.assignments.length > 0) {
          handleSelectAssignment(aRes.assignments[0].id);
        }
      }
    } catch (err) {
      console.error('Professor dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAssignment = async (assignmentId) => {
    setSelectedAssignment(assignments.find(a => a.id === assignmentId) || null);
    try {
      const res = await api.getProfessorSubmissions(assignmentId);
      if (res.success) {
        setSubmissionAnalytics(res);
      }
    } catch (err) {
      console.error('Failed to load submission analytics:', err);
    }
  };

  const totalStudents = courses.reduce((acc, c) => acc + (parseInt(c.student_count) || 0), 0);
  const totalAssignments = assignments.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      
      {/* Top Header Banner with Analytics Cards */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Faculty Management Dashboard
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Course Analytics & Submission Monitor
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Create assignments, track student acknowledgment rates, and grade team/individual submissions.
            </p>
          </div>

          <button
            onClick={onCreateAssignmentClick}
            className="py-3 px-5 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 text-sm shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Assignment</span>
          </button>
        </div>

        {/* Quick Analytics Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Total Courses</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">{courses.length}</span>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Total Students</span>
            <span className="text-2xl font-extrabold text-brand-400 mt-1 block">{totalStudents}</span>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Active Assignments</span>
            <span className="text-2xl font-extrabold text-purple-400 mt-1 block">{totalAssignments}</span>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Avg Completion Rate</span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
              {submissionAnalytics ? `${submissionAnalytics.analytics.completionPercentage}%` : '85%'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Assignment Selector & Detailed Submissions Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Select Assignment */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-400" /> Select Assignment
          </h2>

          <div className="space-y-3">
            {assignments.map(a => {
              const isSelected = selectedAssignment?.id === a.id;
              return (
                <div
                  key={a.id}
                  onClick={() => handleSelectAssignment(a.id)}
                  className={`glass-card rounded-2xl p-4 cursor-pointer transition-all duration-200 border ${
                    isSelected
                      ? 'border-brand-500 bg-slate-900/90 shadow-md shadow-brand-500/10'
                      : 'hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-brand-400 uppercase">{a.course_code}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {a.submission_type === 'group' ? '👥 Group' : '👤 Individual'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">{a.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{a.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Submission Tracker & Student Table */}
        <div className="lg:col-span-2 space-y-6">
          {submissionAnalytics ? (
            <div className="glass-card rounded-3xl p-6 space-y-6">
              
              {/* Assignment Title & Live Analytics */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                    {submissionAnalytics.assignment.submission_type === 'group' ? 'Group Assignment Analytics' : 'Individual Assignment Analytics'}
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-1">{submissionAnalytics.assignment.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">Deadline: {new Date(submissionAnalytics.assignment.deadline).toLocaleString()}</p>
                </div>

                <div className="w-full sm:w-56">
                  <ProgressBar percentage={submissionAnalytics.analytics.completionPercentage} size="md" />
                </div>
              </div>

              {/* Status Counters */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-xs text-emerald-400 font-medium block">Acknowledged</span>
                  <span className="text-xl font-bold text-emerald-300">{submissionAnalytics.analytics.acknowledgedCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <span className="text-xs text-blue-400 font-medium block">Submitted</span>
                  <span className="text-xl font-bold text-blue-300">{submissionAnalytics.analytics.submittedCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-xs text-amber-400 font-medium block">Pending</span>
                  <span className="text-xl font-bold text-amber-300">{submissionAnalytics.analytics.pendingCount}</span>
                </div>
              </div>

              {/* Student Submission Roster Table */}
              <div>
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-400" /> Enrolled Student Roster & Status
                </h3>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Submission Link / Content</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                      {submissionAnalytics.studentStatuses.map(({ student, submission }) => (
                        <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3.5 font-semibold text-white flex items-center gap-2">
                            <img src={student.avatar_url} alt="" className="w-6 h-6 rounded-full bg-slate-800" />
                            <span>{student.name}</span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-400">{student.email}</td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={submission.status} />
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {submission.content ? (
                              <a
                                href={submission.content}
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand-400 hover:text-brand-300 font-semibold underline truncate inline-block max-w-[200px]"
                              >
                                {submission.content}
                              </a>
                            ) : (
                              <span className="text-slate-600 italic">No submission yet</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card rounded-3xl p-12 text-center text-slate-500">
              Select an assignment on the left to inspect student submission statuses.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
