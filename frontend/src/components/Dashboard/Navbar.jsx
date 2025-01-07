// components/Navbar.tsx
'use client'
import React, { useState } from "react";
import { useUserContext } from "../../context/UserContext";
import { fetchData } from  "../../utils/fetchData";

const Navbar = () => {
  const { currentUser, setUser } = useUserContext();
  const [newUserID, setNewUserID] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

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
    <nav className="fixed w-full z-10 px-4 py-3 flex justify-between items-center bg-opacity-60 backdrop-blur-md">
      <div className="flex items-center space-x-2">
        <i className="bi bi-graph-up-arrow text-2xl text-blue-600"></i>
        <span className="text-xl font-bold text-blue-600">InstaBuddy</span>
      </div>
      <div className="relative">
        <button
          className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          onClick={() => setPopoverOpen(!popoverOpen)}
        >
          Switch User
        </button>

        {popoverOpen && (
          <div className="absolute top-12 right-0 bg-white p-4 rounded-lg shadow-lg w-80 z-20">
            <h3 className="text-lg font-bold mb-2">Switch User</h3>
            <p className="text-sm text-gray-600 mb-4">
              Current User: <strong>{currentUser || "None"}</strong>
            </p>
            <input
              type="text"
              placeholder="Enter User ID"
              value={newUserID}
              onChange={(e) => setNewUserID(e.target.value)}
              className="w-full px-3 py-2 border rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              onClick={handleUserSwitch}
              disabled={loading || !newUserID}
            >
              {loading ? "Loading..." : "Submit"}
            </button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
