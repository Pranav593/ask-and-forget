import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ReminderCard from '../components/ReminderCard';
import CreateReminderModal from '../components/CreateReminderModal';

const API_BASE = 'http://localhost:8000'; // FastAPI backend URL

export default function DashboardPage({ user, onLogout }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 });

  // --- Mouse movement for doodle background ---
  const handleMouseMove = useCallback((e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 40;
    const y = (e.clientY / window.innerHeight - 0.5) * 40;
    setBgOffset({ x, y });
  }, []);

  // --- Fetch reminders from backend ---
  useEffect(() => {
    if (!user?.token) return;

    const fetchReminders = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/reminders`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setReminders(res.data || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load reminders.');
      } finally {
        setLoading(false);
      }
    };

    fetchReminders();
  }, [user?.token]);

  // --- Delete reminder ---
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;

    try {
      await axios.delete(`${API_BASE}/reminders/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
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
  const handleCreateReminder = async (newReminder) => {
  try {
    const token = localStorage.getItem("idToken"); // or wherever you store it
    const reminder = { id: Math.max(...reminders.map(r => r.id), 0) + 1, ...newReminder };

    await axios.post("http://localhost:8000/reminders", reminder, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setReminders([...reminders, reminder]);
  } catch (err) {
    console.error(err);
    setError("Failed to create reminder: " + err.message);
  }
};

  // --- Background doodle SVG ---
  const doodleSvg = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
    <!-- Coffee cup -->
    <g transform="translate(60,50) rotate(-10)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.45">
      <path d="M 0 8 L 0 28 Q 0 35 7 35 L 23 35 Q 30 35 30 28 L 30 8 Z" stroke-linecap="round"/>
      <path d="M 30 14 Q 40 14 40 22 Q 40 30 30 30"/>
      <path d="M 8 0 Q 10 -5 12 0" stroke-width="1"/>
      <path d="M 16 -2 Q 18 -7 20 -2" stroke-width="1"/>
    </g>
    <!-- Key -->
    <g transform="translate(150,520) rotate(30)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.4">
      <circle cx="10" cy="10" r="8"/>
      <line x1="18" y1="10" x2="38" y2="10"/>
      <line x1="34" y1="10" x2="34" y2="16"/>
      <line x1="38" y1="10" x2="38" y2="14"/>
    </g>
    <!-- Clock -->
    <g transform="translate(680,300)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.4">
      <circle cx="18" cy="18" r="18"/>
      <line x1="18" y1="18" x2="18" y2="8"/>
      <line x1="18" y1="18" x2="26" y2="18"/>
      <circle cx="18" cy="18" r="1.5" fill="#6aabeb"/>
    </g>
    <!-- Envelope -->
    <g transform="translate(300,70) rotate(5)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.4">
      <rect x="0" y="0" width="35" height="25" rx="3"/>
      <path d="M 0 0 L 17.5 14 L 35 0"/>
    </g>
    <!-- Small dots scattered -->
    <circle cx="200" cy="250" r="2.5" fill="#6aabeb" opacity="0.25"/>
    <circle cx="450" cy="130" r="2" fill="#7db8f0" opacity="0.25"/>
    <circle cx="630" cy="420" r="2.5" fill="#6aabeb" opacity="0.25"/>
    <circle cx="100" cy="600" r="2" fill="#7db8f0" opacity="0.25"/>
    <circle cx="750" cy="200" r="2" fill="#7db8f0" opacity="0.25"/>
    <circle cx="300" cy="550" r="2" fill="#6aabeb" opacity="0.25"/>
  </svg>`)}`;

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
          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105"
          >
            + New Reminder
          </button>
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