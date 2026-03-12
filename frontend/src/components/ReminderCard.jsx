import React, { useState } from 'react';
import { engineAPI } from '../api/client';

export default function ReminderCard({ reminder, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleManualCheck = async () => {
    setChecking(true);
    setMenuOpen(false);
    try {
       await engineAPI.runSingle(reminder.id);
       alert("Trigger check initiated for this reminder.");
    } catch (e) {
       console.error(e);
       alert("Failed to run check.");
    }
    setChecking(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-300 hover:shadow-md transition-all duration-300 ease-out hover:scale-105 relative">
      
      {/* 3-Dot Menu Button */}
      <div className="absolute top-4 right-4">
        <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-100">
                <button
                    onClick={handleManualCheck}
                    disabled={checking}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                    {checking ? "Checking..." : "Run Check Now"}
                </button>
                <button
                    onClick={() => { setMenuOpen(false); onEdit(reminder); }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                    Edit
                </button>
                <button
                    onClick={() => { setMenuOpen(false); onDelete(reminder.id); }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                    Delete
                </button>
            </div>
        )}
      </div>

      <div className="mb-3 pr-8">
        <h3 className="text-lg font-semibold text-blue-800">{reminder.title}</h3>
        <p className="text-sm text-blue-400">{reminder.trigger_type}</p>
      </div>
      
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${reminder.is_active ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-400'}`}>
          {reminder.is_active ? 'Active' : 'Inactive'}
      </span>

      <p className="text-blue-500 mt-3">{reminder.location}</p>
    </div>
  );
}
