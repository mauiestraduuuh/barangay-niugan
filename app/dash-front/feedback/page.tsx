"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface Feedback {
  feedback_id: number;
  message: string;
  status: string;
  response?: string | null;
  responded_by?: number | null;
  submitted_at: string;
  responded_at?: string | null;
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;
    axios
      .get("/api/dash/feedback", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setFeedbacks(res.data.feedbacks))
      .catch((err) => console.error(err));
  }, [token]);

  const submitFeedback = async () => {
    if (!token) return setInfoMessage("Unauthorized");
    if (!message) return setInfoMessage("Message is required");

    setLoading(true);
    try {
      const res = await axios.post(
        "/api/dash/feedback",
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedbacks([res.data.feedback, ...feedbacks]);
      setMessage("");
      setInfoMessage("Feedback submitted successfully");
    } catch (err) {
      console.error(err);
      setInfoMessage("Failed to submit feedback");
    }
    setLoading(false);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-200 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-200 text-blue-800";
      case "RESOLVED":
        return "bg-green-200 text-green-800";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen p-6 bg-[linear-gradient(90deg,rgba(2,0,36,1)_0%,rgba(156,11,11,1)_43%,rgba(255,255,255,1)_100%)] flex flex-col items-center">
      <div className="bg-white backdrop-blur-md rounded-2xl shadow-lg w-full max-w-2xl p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center text-black">Submit Feedback / Complain</h1>

        {infoMessage && (
          <p className="text-center text-black font-semibold bg-yellow-100 p-2 rounded">{infoMessage}</p>
        )}

        <div className="space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your feedback or complaint"
            className="w-full border border-black p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-black-900 text-black placeholder-black"
            rows={4}
          />
          <button
            onClick={submitFeedback}
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-md hover:bg-red-600 transition duration-300"
          >
            {loading ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>

        <h2 className="text-xl font-bold text-black mt-6">Your Feedbacks</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-black text-black">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">Message</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Response</th>
                <th className="p-2 border">Submitted At</th>
                <th className="p-2 border">Responded At</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((fb) => (
                <tr key={fb.feedback_id}>
                  <td className="p-2 border">{fb.message}</td>
                  <td className={`p-2 border font-semibold rounded ${statusColor(fb.status)}`}>
                    {fb.status.replace("_", " ")}
                  </td>
                  <td className="p-2 border">{fb.response || "-"}</td>
                  <td className="p-2 border">{new Date(fb.submitted_at).toLocaleString()}</td>
                  <td className="p-2 border">{fb.responded_at ? new Date(fb.responded_at).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
