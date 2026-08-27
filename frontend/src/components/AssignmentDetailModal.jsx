import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './ProgressBar';
import { X, Calendar, Users, Crown, CheckCircle2, ShieldCheck, Link2, FileText, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export const AssignmentDetailModal = ({ assignment, onClose, onRefresh }) => {
  const { user } = useAuth();
  const [detail, setDetail] = useState(null);
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  useEffect(() => {
    fetchDetail();
  }, [assignment]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.getAssignmentDetail(assignment.id);
      if (res.success) {
        setDetail(res);
        if (res.userSubmission?.content) setContent(res.userSubmission.content);
        if (res.userSubmission?.file_url) setFileUrl(res.userSubmission.file_url);
      }
    } catch (err) {
      console.error('Failed to load assignment detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionType) => {
    setSubmitting(true);
    setToast({ show: false, message: '', isError: false });

    try {
      const res = await api.submitAssignment(assignment.id, content, fileUrl, actionType);
      if (res.success) {
        setToast({ show: true, message: res.message, isError: false });
        await fetchDetail();
        if (onRefresh) onRefresh();
      } else {
        setToast({ show: true, message: res.error || 'Action failed.', isError: true });
      }
    } catch (err) {
      setToast({ show: true, message: 'Network error submitting assignment.', isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (!assignment) return null;

  const isGroup = assignment.submission_type === 'group';
  const groupInfo = detail?.groupInfo;
  const isLeader = isGroup && groupInfo && groupInfo.leader_id === user?.id;
  const userStatus = detail?.userSubmission?.status || 'pending';

  return (
    <div className="fixed inset-[0] z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl glass-card rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-slate-700/60">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" />
            <p className="text-xs">Loading assignment specifications...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header Info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {detail.assignment.course_code}
                </span>
                <StatusBadge status={userStatus} />
              </div>
              <h2 className="text-2xl font-extrabold text-white">{detail.assignment.title}</h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Due: <strong className="text-slate-200">{new Date(detail.assignment.deadline).toLocaleString()}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  Format: <strong className="text-slate-200">{isGroup ? 'Group Work' : 'Individual Work'}</strong>
                </span>
              </div>
            </div>

            {/* Notification Toast */}
            {toast.show && (
              <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 animate-slide-up ${
                toast.isError
                  ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              }`}>
                {toast.isError ? <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" /> : <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />}
                <span>{toast.message}</span>
              </div>
            )}

            {/* Description Card */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Assignment Description</h3>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{detail.assignment.description}</p>
            </div>

            {/* GROUP WORK PANEL (PDF Core Requirement 1.3 & 3.3) */}
            {isGroup && (
              <div className="bg-purple-950/30 border border-purple-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-purple-200 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" /> Group Roster: {groupInfo ? groupInfo.name : 'Team Squad'}
                  </h3>
                  {isLeader && (
                    <span className="bg-purple-500/30 text-purple-200 text-xs px-2.5 py-1 rounded-full font-bold border border-purple-400/40 flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-400" /> Group Leader
                    </span>
                  )}
                </div>

                {groupInfo?.members && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {groupInfo.members.map(member => (
                      <div key={member.id} className="flex items-center gap-2 p-2 rounded-xl bg-purple-900/20 border border-purple-500/20 text-xs text-purple-100">
                        <img src={member.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                        <span className="truncate">{member.name}</span>
                        {member.id === groupInfo.leader_id && <Crown className="w-3.5 h-3.5 text-amber-400 ml-auto shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}

                {!isLeader && user?.role === 'student' && (
                  <p className="text-xs text-purple-300/80 italic pt-1 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    Note: Only Group Leader ({groupInfo?.leader_name || 'Leader'}) can submit/acknowledge on behalf of the group.
                  </p>
                )}
              </div>
            )}

            {/* SUBMISSION FORM */}
            {user?.role === 'student' && (
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-400" /> Submission Details & Links
                </h3>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">GitHub / Project Repository URL</label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="url"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="https://github.com/your-username/repository"
                      disabled={isGroup && !isLeader}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Submission Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => handleAction('submit')}
                    disabled={submitting || (isGroup && !isLeader)}
                    className="flex-1 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{userStatus === 'pending' ? 'Submit Assignment' : 'Update Submission'}</span>
                  </button>

                  <button
                    onClick={() => handleAction('acknowledge')}
                    disabled={submitting || (isGroup && !isLeader)}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>Acknowledge Submission</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
