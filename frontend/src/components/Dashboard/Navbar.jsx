'use client';
import React, { useState, useRef, useEffect } from "react";
import { useUserContext } from "../../context/UserContext";
import { fetchData } from "../../utils/fetchData";
import AIChat from "../../components/Dashboard/AIChat";

const Navbar = () => {
  const { currentUser, setUser } = useUserContext();
  const [newUserID, setNewUserID] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  // Ref for AI chat modal
  const aiChatRef = useRef(null);

  // Close AI Chat if user clicks outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (aiChatRef.current && !aiChatRef.current.contains(event.target)) {
        setAiChatOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleUserSwitch = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchData(newUserID, 1000);
      if (data) {
        setUser(newUserID, data);
        setPopoverOpen(false); // Auto-close the popover
      } else {
        setError("User not found");
      }
    } catch {
      setError("Failed to fetch user data. Showing fallback data.");
      // Set fallback user and metadata
      setUser("fallbackUser", {
        shortcode: "fallback_shortcode",
        hashtags: "fallback_hashtags",
        media_type: "fallback_type",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <nav className="sticky top-0 backdrop-blur-lg bg-white/75 z-50 px-6 py-4 flex justify-between items-center transition-all duration-300 ease-in-out">
        <div className="flex items-center space-x-3 group cursor-pointer">
          <i className="bi bi-graph-up-arrow text-2xl text-blue-600 group-hover:animate-bounce transition-all"></i>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:opacity-80 transition-opacity">
            InstaBuddy
          </span>
        </div>
        <div className="relative flex items-center space-x-6">
          {/* Open AI Chat Popover */}
          <button
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-full shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
            onClick={() => setAiChatOpen(!aiChatOpen)}
          >
            Get answers through AI!
          </button>

          {/* Switch User Popover */}
          <button
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-full shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
            onClick={() => setPopoverOpen(!popoverOpen)}
          >
            Switch User
          </button>
        </div>
      </nav>

      {/* AI Chat below the Navbar */}
      {aiChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            ref={aiChatRef}
            className="relative w-100 h-70 bg-white rounded-xl overflow-hidden"
          >
            <AIChat />
          </div>
        </div>
      )}

      {/* Switch User Popover */}
      {popoverOpen && (
        <div className="absolute top-12 right-0 bg-white p-6 rounded-lg shadow-xl w-80 z-20 transition-all duration-200 ease-in-out">
          <h3 className="text-lg font-bold mb-3 text-gray-800">Switch User</h3>
          <p className="text-sm text-gray-600 mb-4">
            Current User: <strong>{currentUser || "None"}</strong>
          </p>
          <input
            type="text"
            placeholder="Enter User ID"
            value={newUserID}
            onChange={(e) => setNewUserID(e.target.value)}
            className="w-full px-4 py-3 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-200 ease-in-out"
          />
          <button
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 transition-all duration-200 ease-in-out"
            onClick={handleUserSwitch}
            disabled={loading || !newUserID}
          >
            {loading ? "Loading..." : "Submit"}
          </button>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      )}
    </>
  );
};

export default Navbar;
