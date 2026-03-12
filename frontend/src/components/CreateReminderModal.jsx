import React, { useState } from "react";
import { reminderAPI } from "../api/client";

export default function CreateReminderModal({ isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [sentence, setSentence] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // 1. Get User Location (Browser API)
      let userLocation = "";
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        userLocation = ` (My current location is lat: ${pos.coords.latitude}, lon: ${pos.coords.longitude})`;
      } catch (locErr) {
        console.warn("Location permission denied or failed", locErr);
      }

      // 2. Parse with AI
      const fullSentence = sentence + userLocation;
      const parseRes = await fetch("http://localhost:8000/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence: fullSentence }),
      });

      const parseData = await parseRes.json();

      if (parseData.error) {
        throw new Error(parseData.details || "Failed to specificy reminder details. Try again.");
      }
      
      const aiData = parseData.data;

      // Validate aiData has meaningful content
      if (!aiData || (!aiData.trigger_type && !aiData.condition)) {
           throw new Error("AI could not understand the trigger condition. Please try rephrasing.");
      }

      // 3. Create Reminder Automatically
      const payload = {
        title: title,
        trigger_type: aiData.trigger_type || "time.now",
        location: aiData.location || "Unknown",
        condition: aiData.condition || { metric: "", operator: "==", value: "" },
        status: aiData.is_active ? "active" : "inactive",
        is_active: aiData.is_active ?? true,
      };

      try {
          const createRes = await reminderAPI.createReminder(payload);
          onSuccess({ ...payload, id: createRes.data.id });
      } catch (createErr) {
          console.error("Creation error:", createErr);
          throw createErr;
      }

      // Reset & Close
      setTitle("");
      setSentence("");
      onClose();

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create reminder.");
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
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Buy Milk"
                    required
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">What triggers this?</label>
                <textarea
                    value={sentence}
                    onChange={(e) => setSentence(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., When it rains in London..."
                    rows="4"
                    required
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

            <div className="flex gap-2 pt-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-lg transition"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
                >
                    {loading ? "Creating..." : "Create Reminder"}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}
