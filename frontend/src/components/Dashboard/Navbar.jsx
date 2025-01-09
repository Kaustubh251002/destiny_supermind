'use client';
import React, { useState, useRef, useEffect } from "react";
import { useUserContext } from "../../context/UserContext";
import { fetchData } from "../../utils/fetchData";
import AIChat from "../../components/Dashboard/AIChat";
import { Button } from "../ui/button";
import Link from "next/link"; // Import Link for navigation

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Input } from "../ui/input";
import { UserCircle } from "lucide-react";

const Navbar = () => {
  const { currentUser, setUser } = useUserContext();
  const [newUserID, setNewUserID] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const handleUserSwitch = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchData(newUserID, 1000);
      if (data) {
        setUser(newUserID, data);
        setPopoverOpen(false);
        setNewUserID("");
      } else {
        setError("User not found");
      }
    } catch {
      setError("Failed to fetch user data. Showing fallback data.");
      setUser("fallbackUser", {
        shortcode: "fallback_shortcode",
        hashtags: "fallback_hashtags",
        media_type: "fallback_type",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && newUserID) {
      handleUserSwitch();
    }
  };

  const handleAIChatToggle = () => {
    if (!currentUser) {
      setError("Please select a user before accessing AI chat.");
      return;
    }
    setAiChatOpen(!aiChatOpen);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <nav className="backdrop-blur-lg bg-white/75 border-b px-6 py-4 flex justify-between items-center transition-all duration-300 ease-in-out">
          {/* InstaBuddy Logo */}
          <div className="flex items-center space-x-3 group cursor-pointer">
            <Link href="/" className="flex items-center space-x-3">
              <i className="bi bi-graph-up-arrow text-2xl text-blue-600 group-hover:animate-bounce transition-all"></i>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:opacity-80 transition-opacity">
                InstaBuddy
              </span>
            </Link>
          </div>
  
          {/* Navigation Buttons */}
          <div className="flex items-center space-x-4">
            <Button
              variant="default"
              className={`bg-gradient-to-r from-purple-600 to-indigo-600 text-white ${
                !currentUser ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handleAIChatToggle}
              disabled={!currentUser}
            >
              Get answers through AI!
            </Button>
  
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  Switch User
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-1">Switch User</h3>
                    <p className="text-sm text-muted-foreground">
                      Current User: <span className="font-medium">{currentUser || "None"}</span>
                    </p>
                  </div>
                  <Input
                    type="text"
                    placeholder="Enter User ID"
                    value={newUserID}
                    onChange={(e) => setNewUserID(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full"
                  />
                  <Button
                    className="w-full"
                    onClick={handleUserSwitch}
                    disabled={loading || !newUserID}
                  >
                    {loading ? "Loading..." : "Submit"}
                  </Button>
                  {error && (
                    <p className="text-sm text-red-500 mt-2">{error}</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </nav>
      </div>
  
      {/* AI Chat Dialog */}
      <Dialog open={aiChatOpen} onOpenChange={setAiChatOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Chat Assistant</DialogTitle>
          </DialogHeader>
          <AIChat username={currentUser} />
        </DialogContent>
      </Dialog>
    </>
  );
  
};

export default Navbar;