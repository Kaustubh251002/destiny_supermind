'use client';
import React, { useState, useCallback } from "react";
import { useUserContext } from "../../context/UserContext";
import { fetchData } from "../../utils/fetchData";
import AIChat from "../../components/Dashboard/AIChat";
import { Button } from "../ui/button";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "../ui/input";
import { UserCircle, Loader2, Menu, X, ArrowUpRight } from "lucide-react";
import { useMediaQuery } from "../../hooks/useMediaQuery";

const Navbar = () => {
  const { currentUser, setUser } = useUserContext();
  const [newUserID, setNewUserID] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleUserSwitch = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchData(newUserID, 1000);

      if (!data) {
        throw new Error("User not found");
      }

      setUser(newUserID, data);
      setPopoverOpen(false);
      setNewUserID("");
      setMobileMenuOpen(false);
    } catch (error) {
      if (error.message === "Failed to fetch") {
        setError("Unable to connect to the server. Please check your internet connection.");
      } else if (error.message.includes("Backend URL")) {
        setError("System configuration error. Please contact support.");
      } else if (error.message === "User not found") {
        setError("This user ID doesn't exist. Please try another.");
      } else {
        setError("An error occurred while fetching user data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading && newUserID) {
      handleUserSwitch();
    }
  };

  const handleAIChatToggle = () => {
    if (!currentUser) {
      setError("Please select a user before accessing AI chat.");
      setPopoverOpen(true);
      return;
    }
    setAiChatOpen(!aiChatOpen);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <nav className="backdrop-blur-lg bg-white/75 border-b px-4 md:px-6 py-4 flex justify-between items-center transition-all duration-300 ease-in-out">
          <div className="flex items-center space-x-3 group">
            <Link href="/" className="flex items-center space-x-3">
              <ArrowUpRight className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:opacity-80 transition-opacity">
                InstaBuddy
              </span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <Button
                variant="default"
                className={`bg-gradient-to-r from-purple-600 to-indigo-600 text-white w-full md:w-auto ${!currentUser ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                onClick={handleAIChatToggle}
                disabled={!currentUser}
              >
                Get answers through AI!
              </Button>

              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 relative w-full md:w-auto justify-center"
                  >
                    <UserCircle className="h-4 w-4" />
                    Switch User
                    {!currentUser && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-purple-500 rounded-full animate-pulse" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 p-4"
                  align={isMobile ? "start" : "end"}  // Adjust alignment for mobile
                  side={isMobile ? "top" : "bottom"} // Position the popover above for mobile
                  sideOffset={isMobile ? 4 : 8} // Adjust the distance from the button
                >
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
                      disabled={loading}
                    />
                    <Button
                      className="w-full"
                      onClick={handleUserSwitch}
                      disabled={loading || !newUserID}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </div>
                      ) : (
                        "Submit"
                      )}
                    </Button>
                    {error && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

            </div>
          </div>

          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Menu className="h-6 w-6" />
                  {!currentUser && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-purple-500 rounded-full animate-pulse" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-80">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-8">
                  <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                    <Button
                      variant="default"
                      className={`bg-gradient-to-r from-purple-600 to-indigo-600 text-white w-full md:w-auto ${!currentUser ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      onClick={handleAIChatToggle}
                      disabled={!currentUser}
                    >
                      Get answers through AI!
                    </Button>

                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2 relative w-full md:w-auto justify-center"
                        >
                          <UserCircle className="h-4 w-4" />
                          Switch User
                          {!currentUser && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 bg-purple-500 rounded-full animate-pulse" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-80 p-4"
                        align={isMobile ? "start" : "end"}  // Adjust alignment for mobile
                        side={isMobile ? "top" : "bottom"} // Position the popover above for mobile
                        sideOffset={isMobile ? 4 : 8} // Adjust the distance from the button
                      >
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
                            disabled={loading}
                          />
                          <Button
                            className="w-full"
                            onClick={handleUserSwitch}
                            disabled={loading || !newUserID}
                          >
                            {loading ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading...
                              </div>
                            ) : (
                              "Submit"
                            )}
                          </Button>
                          {error && (
                            <Alert variant="destructive" className="mt-2">
                              <AlertDescription className="text-sm">{error}</AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>

                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>

      <Dialog open={aiChatOpen} onOpenChange={setAiChatOpen}>
        <DialogContent
          className={`
          ${isMobile ? "w-full h-full max-w-none m-0 rounded-none" : "max-w-4xl max-h-[80vh]"}
          overflow-y-auto
        `}
        >
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              AI Chat Assistant
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAiChatOpen(false)}
                className="md:hidden"
              >
                <X className="h-6 w-6" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <AIChat username={currentUser} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;
