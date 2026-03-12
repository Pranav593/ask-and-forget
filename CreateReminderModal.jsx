import React, { useState } from 'react';
import { reminderAPI, parserAPI } from '../api/client';

export default function CreateReminderModal({ isOpen, onClose, onSuccess }) {
  const [sentence, setSentence] = useState('');
  const [parsing, setParsing] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    trigger_type: 'location',
    location: '',
    trigger_params: { metric: '', operator: 0, value: 0 },
    status: 'active',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parseError, setParseError] = useState('');

  const reset = () => {
    setSentence('');
    setParseError('');
    setError('');
    setManualMode(false);
    setFormData({
      title: '',
      trigger_type: 'location',
      location: '',
      trigger_params: { metric: '', operator: 0, value: 0 },
      status: 'active',
      isActive: true,
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleParseSentence = async () => {
    if (!sentence.trim()) return;
    setParsing(true);
    setParseError('');
    try {
      const res = await parserAPI.parse(sentence);
      const parsed = res.data?.data;
      if (!parsed || parsed.error) {
        setParseError(parsed?.error || 'Could not parse your reminder. Try rephrasing.');
        return;
      }
      setFormData({
        title: parsed.title || sentence.substring(0, 50),
        trigger_type: parsed.trigger_type || 'location',
        location: parsed.location || '',
        trigger_params: { metric: parsed.condition?.type || '', operator: 0, value: 0 },
        status: 'active',
        isActive: parsed.is_active ?? true,
      });
      setManualMode(true);
    } catch (err) {
      setParseError('Failed to reach the parser. Please enter details manually.');
      setManualMode(true);
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Title is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await reminderAPI.createReminder(formData);
      // res.data contains { id, message } from the backend
      onSuccess({ id: res.data.id, ...formData });
      reset();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create reminder. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create Reminder</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {!manualMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe your reminder in natural language
              </label>
              <textarea
                value={sentence}
                onChange={(e) => setSentence(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleParseSentence();
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="e.g., Remind me to buy milk when I reach the grocery store"
                rows="4"
              />
              <p className="text-xs text-gray-400 mt-1">Press Enter or click Parse to continue.</p>
            </div>

            {parseError && (
              <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded">{parseError}</p>
            )}

            <button
              onClick={handleParseSentence}
              disabled={parsing || !sentence.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
            >
              {parsing ? 'Parsing…' : 'Parse Reminder'}
            </button>

            <button
              onClick={() => setManualMode(true)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition"
            >
              Enter Manually
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Buy milk"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type</label>
              <select
                value={formData.trigger_type}
                onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="location">Location</option>
                <option value="time">Time</option>
                <option value="metric">Metric</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Grocery Store"
              />
            </div>

            {/* Email notice */}
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <span className="text-blue-400 mt-0.5">✉️</span>
              <p className="text-xs text-blue-600">
                A confirmation email will be sent to you once this reminder is saved.
              </p>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded">{error}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Creating…' : 'Create Reminder'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}