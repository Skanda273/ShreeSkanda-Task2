import React, { useState } from 'react';
import { api } from '../services/api';
import { X, Plus, BookOpen, Calendar, FileText, Users, Loader2, Sparkles } from 'lucide-react';

export const CreateAssignmentModal = ({ courses, onClose, onCreated }) => {
  const [courseId, setCourseId] = useState(courses[0]?.id || 1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submissionType, setSubmissionType] = useState('individual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !description || !deadline) {
      setError('Please fill in all assignment fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createAssignment({
        course_id: courseId,
        title,
        description,
        deadline,
        submission_type: submissionType
      });

      if (res.success) {
        onCreated();
        onClose();
      } else {
        setError(res.error || 'Failed to create assignment.');
      }
    } catch (err) {
      setError('Network error creating assignment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-slate-700/60">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-2">
            <Plus className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Create New Course Assignment</h2>
          <p className="text-xs text-slate-400 mt-1">Publish an individual or group task for enrolled students</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Select Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Assignment Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Relational Schema Optimization"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Description & Instructions</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail assignment instructions, submission requirements, grading criteria..."
              className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Deadline</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Submission Type</label>
              <select
                value={submissionType}
                onChange={(e) => setSubmissionType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
              >
                <option value="individual" className="bg-slate-900 text-white">Individual</option>
                <option value="group" className="bg-slate-900 text-white">Group</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center space-x-2 text-xs disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Publishing Assignment...</span>
              </>
            ) : (
              <>
                <span>Publish Assignment</span>
                <Sparkles className="h-4 w-4 text-brand-200" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
