'use client';

import { useUserContext } from "../../context/UserContext";
import { useState, useEffect } from "react";
import Navbar from "../../components/Dashboard/Navbar";
import PerformanceOverview from "../../components/Dashboard/PerformanceOverview";
import TopPostAndEngagement from "../../components/Dashboard/TopPostAndEngagement";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus, ArrowUpRight } from "lucide-react";

const Dashboard = () => {
  const { metadata, currentUser } = useUserContext();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (currentUser) {
      setIsInitialLoad(false);
      setIsLoading(true);
      
      // If we have metadata, clear any errors and stop loading
      if (metadata) {
        setError(null);
        setIsLoading(false);
      }
    }
  }, [currentUser, metadata]);

  // Welcome state - no user selected
  if (isInitialLoad || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-md mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md relative">
              {/* Animated arrow pointing to Switch User button */}
              <div className="absolute -top-40 -right-80 flex flex-col items-center animate-bounce">
                <ArrowUpRight className="h-8 w-8 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Start Here</span>
              </div>
              
              <UserPlus className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Welcome to InstaBuddy Analytics
              </h2>
              <p className="text-gray-600 mb-4">
                Click "Switch User" at the top right to begin exploring your Instagram analytics.
              </p>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-700">
                  💡 Enter any Instagram username to view their public analytics and get AI-powered insights!
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-700" />
          <p className="text-lg text-gray-600">Loading analytics data...</p>
        </main>
      </div>
    );
  }

  // If we have no metadata but we're not loading, something went wrong
  if (!metadata) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <Alert variant="destructive" className="bg-white border-purple-200">
              <AlertDescription className="space-y-4">
                <p className="text-lg font-semibold text-gray-800">
                  Unable to Load Analytics
                </p>
                <p className="text-gray-600">
                  There was a problem loading the analytics data for this user.
                  This could be due to network issues or the user may not exist.
                </p>
                <div className="bg-purple-50 p-4 rounded-lg mt-4">
                  <p className="text-sm text-purple-700">
                    🔄 Try selecting a different user or check your internet connection.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-10 px-4 lg:px-8 p-6">
        {/* Metrics and Insights Section */}
        <div className="lg:col-span-3 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
            Metrics & Insights
          </h2>
          <TopPostAndEngagement posts={metadata} username={currentUser} />
        </div>
        
        {/* Performance Overview Section */}
        <div className="pt-3">
          <div className="bg-white shadow-md rounded-lg p-6 w-full">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
              Performance Overview
            </h2>
            <PerformanceOverview data={metadata} />
          </div> 
        </div>
      </main>
    </div>
  );
};

export default Dashboard;