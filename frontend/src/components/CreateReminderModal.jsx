import React, { useState } from 'react';

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

  const handleParseSentence = async () => {
    if (!sentence.trim()) return;
    setParsing(true);
    // Mock parsing - just extract basic info
    setTimeout(() => {
      setFormData({
        title: sentence.substring(0, 30) || 'Reminder',
        trigger_type: 'location',
        location: 'Location',
        trigger_params: { metric: '', operator: 0, value: 0 },
        status: 'active',
        isActive: true,
      });
      setParsing(false);
    }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Mock submission
    setTimeout(() => {
      onSuccess(formData);
      setSentence('');
      setFormData({
        title: '',
        trigger_type: 'location',
        location: '',
        trigger_params: { metric: '', operator: 0, value: 0 },
        status: 'active',
        isActive: true,
      });
      onClose();
      setLoading(false);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Reminder</h2>

        {!manualMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe your reminder in natural language
              </label>
              <textarea
                value={sentence}
                onChange={(e) => setSentence(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Remind me to buy milk when I reach the grocery store"
                rows="4"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={handleParseSentence}
              disabled={parsing || !sentence.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
            >
              {parsing ? 'Parsing...' : 'Parse Reminder'}
            </button>

            <button
              onClick={() => setManualMode(true)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-lg transition"
            >
              Edit Manually
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <option>location</option>
                <option>time</option>
                <option>metric</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-lg transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full text-gray-600 hover:text-gray-800 font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
}
