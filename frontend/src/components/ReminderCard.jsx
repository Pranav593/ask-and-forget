import React from 'react';

export default function ReminderCard({ reminder, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-300 hover:shadow-md transition-all duration-300 ease-out hover:scale-105">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-blue-800">{reminder.title}</h3>
          <p className="text-sm text-blue-400">{reminder.trigger_type}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${reminder.is_active ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-400'}`}>
          {reminder.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <p className="text-blue-500 mb-3">{reminder.location}</p>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => onEdit(reminder)}
          className="px-3 py-1 bg-blue-50 text-blue-500 rounded hover:bg-blue-100 text-sm font-medium transition-all duration-200 hover:scale-110"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(reminder.id)}
          className="px-3 py-1 bg-red-50 text-red-400 rounded hover:bg-red-100 text-sm font-medium transition-all duration-200 hover:scale-110"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
