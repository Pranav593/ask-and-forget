import React, { useState, useEffect, useCallback } from 'react';
import ReminderCard from '../components/ReminderCard';
import CreateReminderModal from '../components/CreateReminderModal';

export default function DashboardPage({ user, onLogout }) {
  const [reminders, setReminders] = useState([
    {
      id: 1,
      title: 'Buy milk',
      trigger_type: 'location',
      location: 'Grocery Store',
      status: 'active',
      isActive: true,
    },
    {
      id: 2,
      title: 'Call dentist',
      trigger_type: 'time',
      location: 'Office',
      status: 'active',
      isActive: true,
    },
    {
      id: 3,
      title: 'Pay electricity bill',
      trigger_type: 'metric',
      location: 'Home',
      status: 'active',
      isActive: false,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 40;
    const y = (e.clientY / window.innerHeight - 0.5) * 40;
    setBgOffset({ x, y });
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    setReminders(reminders.filter(r => r.id !== id));
  };

  const handleEdit = (reminder) => {
    console.log('Edit reminder:', reminder);
  };

  const handleCreateReminder = (newReminder) => {
    const reminder = {
      id: Math.max(...reminders.map(r => r.id), 0) + 1,
      ...newReminder,
    };
    setReminders([...reminders, reminder]);
  };

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

    <!-- Grocery cart -->
    <g transform="translate(600,500) rotate(-5)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.4">
      <path d="M 0 0 L 5 0 L 12 22 L 32 22 L 36 8 L 10 8"/>
      <circle cx="15" cy="28" r="3"/>
      <circle cx="29" cy="28" r="3"/>
    </g>

    <!-- Book -->
    <g transform="translate(250,400) rotate(-15)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.4">
      <path d="M 2 0 L 2 30 Q 15 26 28 30 L 28 0 Q 15 4 2 0 Z"/>
      <line x1="15" y1="2" x2="15" y2="28"/>
    </g>

    <!-- Umbrella -->
    <g transform="translate(100,180)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.4">
      <path d="M 15 5 Q 0 5 0 18 L 15 18 L 30 18 Q 30 5 15 5 Z"/>
      <line x1="15" y1="18" x2="15" y2="35"/>
      <path d="M 15 35 Q 15 40 10 38"/>
    </g>

    <!-- Hanger -->
    <g transform="translate(350,280)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.4">
      <path d="M 15 0 Q 15 5 15 8"/>
      <path d="M 15 8 L 0 25 L 30 25 Z"/>
      <circle cx="15" cy="0" r="3"/>
    </g>

    <!-- Light bulb -->
    <g transform="translate(400,450)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.4">
      <path d="M 15 0 Q 0 0 0 15 Q 0 24 8 28 L 8 34 L 22 34 L 22 28 Q 30 24 30 15 Q 30 0 15 0 Z"/>
      <line x1="10" y1="37" x2="20" y2="37"/>
    </g>

    <!-- Pencil -->
    <g transform="translate(520,150) rotate(-30)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.4">
      <rect x="0" y="0" width="8" height="32" rx="1"/>
      <path d="M 0 32 L 4 40 L 8 32"/>
      <line x1="0" y1="4" x2="8" y2="4"/>
    </g>

    <!-- Water drop -->
    <g transform="translate(720,450)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.4">
      <path d="M 10 0 Q 0 15 10 25 Q 20 15 10 0 Z"/>
    </g>

    <!-- Plant pot -->
    <g transform="translate(380,600)" stroke="#6aabeb" stroke-width="1.5" fill="none" opacity="0.4">
      <path d="M 3 12 L 7 30 L 25 30 L 29 12 Z"/>
      <line x1="0" y1="12" x2="32" y2="12"/>
      <path d="M 16 12 L 16 4 Q 16 0 20 0"/>
      <path d="M 16 8 Q 10 4 8 0"/>
    </g>

    <!-- Camera -->
    <g transform="translate(700,80) rotate(-5)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.4">
      <rect x="0" y="8" width="35" height="22" rx="3"/>
      <circle cx="17" cy="19" r="7"/>
      <rect x="12" y="3" width="12" height="6" rx="1"/>
    </g>

    <!-- Alarm bell -->
    <g transform="translate(50,650)" stroke="#7db8f0" stroke-width="1.5" fill="none" opacity="0.4">
      <path d="M 5 20 Q 5 5 15 5 Q 25 5 25 20 L 5 20"/>
      <line x1="15" y1="0" x2="15" y2="5"/>
      <line x1="3" y1="20" x2="27" y2="20"/>
      <circle cx="15" cy="24" r="2.5"/>
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
                key={reminder.id}
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
