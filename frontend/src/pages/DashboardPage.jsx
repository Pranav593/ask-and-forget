import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ReminderCard from '../components/ReminderCard';
import CreateReminderModal from '../components/CreateReminderModal';
import { engineAPI, reminderAPI } from '../api/client'; // Import engineAPI here

const API_BASE = 'http://localhost:8000'; // FastAPI backend URL

export default function DashboardPage({ user, onLogout }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 });

  // --- Fetch reminders from backend ---
  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reminderAPI.getReminders();
      setReminders(res.data || []);
      // Clear error on success
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load reminders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const runGlobalEngine = async () => {
    try {
        await engineAPI.run();
        alert("Global reminder check started.");
    } catch (e) {
        console.error(e);
        alert("Failed to start engine.");
    }
  };

  // --- Delete reminder ---
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;

    try {
      await reminderAPI.deleteReminder(id);
      setReminders(reminders.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete reminder.');
    }
  };

  // --- Edit reminder (currently just logs) ---
  const handleEdit = (reminder) => {
    console.log('Edit reminder:', reminder);
    // Optional: implement modal for editing and PUT request
  };

  // --- Create reminder ---
  // The reminder is already created in the modal via API, so we just update state here.
  const handleCreateReminder = (newReminder) => {
    // newReminder should already have the ID from the backend response
    setReminders(prev => [...prev, newReminder]);
  };

  const handleMouseMove = (e) => {
    // Parallax effect
    setBgOffset({ x: e.clientX * 0.05, y: e.clientY * 0.05 });
  };

  // --- Background doodle SVG (Simplified) ---
  const doodleSvg = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><path fill="none" stroke="#6aabeb" d="M0,0 L800,800 M800,0 L0,800" opacity="0.1"/></svg>')}`;

  return (
    <div
      className="min-h-screen overflow-hidden"
      onMouseMove={handleMouseMove}
      style={{
        backgroundImage: `url("${doodleSvg}"), linear-gradient(to bottom right, #dbeafe, #bfdbfe)`,
        backgroundSize: '800px 800px, cover',
        backgroundPosition: `${bgOffset.x}px ${bgOffset.y}px, center`,
        transition: 'background-position 0.3s ease-out',
      }}
    >
      <nav className="bg-blue-50/80 backdrop-blur-md border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-800">Ask & Forget</h1>
          <div className="flex items-center gap-4">
            <p className="text-blue-500">{user?.email}</p>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg transition-all duration-200 hover:scale-105"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-blue-800">Your Reminders</h2>
          <div className="flex gap-3">
             <button
               onClick={fetchReminders}
               className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 shadow-md flex items-center gap-2"
               title="Refresh Reminders"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </svg>
             </button>
             <button
                onClick={runGlobalEngine}
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 shadow-md flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Run Checker
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 shadow-md"
              >
                + New Reminder
              </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-blue-400">Loading reminders...</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-blue-200">
            <p className="text-blue-400">No reminders yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reminders.map(reminder => (
              <ReminderCard
                key={reminder.id || reminder.reminder_id} 
                reminder={reminder}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      <CreateReminderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleCreateReminder}
      />
    </div>
  );
}