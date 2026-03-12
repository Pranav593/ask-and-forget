import React, { useState } from "react";
import { reminderAPI, engineAPI } from "../api/client";

export default function CreateReminderModal({ isOpen, onClose, onSuccess }) {
  const [sentence, setSentence] = useState("");
  const [parsing, setParsing] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    trigger_type: "time.now",
    location: "",
    condition: { metric: "", operator: "==", value: "" },
    status: "active",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runEngine = async () => {
    try {
      await engineAPI.run();
      alert("Reminder engine executed");
    } catch (err) {
      console.error(err);
    }
  };

  // NEW: call backend to parse with Gemini
  const handleParseSentence = async () => {
    if (!sentence.trim()) return;
    setParsing(true);
    setError("");

    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.details || data.error);
        setParsing(false);
        return;
      }

      // Map Gemini response into frontend formData
      setFormData({
        title: data.title || "",
        trigger_type: data.trigger_type || "time.now",
        location: data.location || "",
        condition: data.condition || { metric: "", operator: "==", value: "" },
        status: data.is_active ? "active" : "inactive",
        is_active: data.is_active ?? true,
      });

      setManualMode(true); // switch to manual mode so user can review/edit

    } catch (err) {
      console.error(err);
      setError("Failed to parse reminder with Gemini");
    }

    setParsing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await reminderAPI.createReminder(formData);
      onSuccess(res.data);

      // reset modal
      setSentence("");
      setFormData({
        title: "",
        trigger_type: "time.now",
        location: "",
        condition: { metric: "", operator: "==", value: "" },
        status: "active",
        is_active: true,
      });
      setManualMode(false);
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Failed to create reminder. Check the trigger type."
      );
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Reminder</h2>

        {!manualMode ? (
          <div className="space-y-4">
            <textarea
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Remind me to buy milk when I reach the grocery store"
              rows="4"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleParseSentence}
              disabled={parsing || !sentence.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
            >
              {parsing ? "Parsing..." : "Parse Reminder with Gemini"}
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
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <select
              value={formData.trigger_type}
              onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="time.now">Time</option>
              <option value="stock.price">Stock</option>
              <option value="weather.current">Weather</option>
            </select>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Location"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
                {loading ? "Creating..." : "Create"}
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

        <button
          type="button"
          onClick={runEngine}
          className="w-full mt-3 bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg transition"
        >
          Run Reminder Engine
        </button>
      </div>
    </div>
  );
}