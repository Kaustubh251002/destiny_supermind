'use client';

import { useUserContext } from "../../context/UserContext";
import { useState, useEffect } from "react";
import Navbar from "../../components/Dashboard/Navbar";
import PerformanceOverview from "../../components/Dashboard/PerformanceOverview";
import TopPostAndEngagement from "../../components/Dashboard/TopPostAndEngagement";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus, Globe, Star, Instagram } from "lucide-react";
import { fetchData } from "../../utils/fetchData";

const LoadingState = ({ username }) => {
  const loadingMessages = [
    "Analyzing engagement patterns...",
    "Crunching the numbers...",
    "Fetching latest insights...",
    "Preparing your dashboard..."
  ];

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <div className="flex-grow flex flex-col items-center justify-center p-4 space-y-8">
        <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full space-y-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Instagram className="h-12 w-12 text-purple-600 animate-pulse" />
            </div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Loading Analytics
            </h2>
            
            <p className="text-gray-600 text-sm animate-pulse">
              {loadingMessages[messageIndex]}
            </p>
          </div>

          <div className="flex justify-center space-x-2">
            <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-100"></span>
            <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-200"></span>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            This may take a few moments...
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { metadata, currentUser, setUser } = useUserContext();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const leftColumnAccounts = [
    'cristiano',
    'leomessi',
    'kyliejenner',
    'selenagomez'
  ];

  const rightColumnAccounts = [
    'narendramodi',
    'arianagrande',
    'kimkardashian',
    'virat.kohli'
  ];

  const handleAccountClick = async (username) => {
    try {
      setIsLoading(true);
      setIsInitialLoad(false);
      const data = await fetchData(username, 1000);
      if (!data) {
        throw new Error("User not found");
      }
      setUser(username, data);
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      if (metadata) {
        setError(null);
        setIsLoading(false);
      }
    }
  }, [currentUser, metadata]);

  const AccountList = ({ accounts }) => (
    <div className="flex flex-col items-start">
      {accounts.map((account) => (
        <button 
          key={account} 
          onClick={() => handleAccountClick(account)}
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline cursor-pointer whitespace-nowrap flex items-center mb-2"
        >
          <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
          {account}
        </button>
      ))}
    </div>
  );

  if (isLoading) {
    return <LoadingState username={currentUser || 'user'} />;
  }

  if (isInitialLoad || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="relative">
          <Navbar />
        </div>
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-lg mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <UserPlus className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Welcome to InstaBuddy Analytics
              </h2>
              <p className="text-gray-600 mb-4">
                Click "Switch User" at the top right to begin exploring public Instagram analytics.
              </p>
              <div className="bg-purple-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-purple-700">
                  💡 Enter any Instagram username to view their public analytics and get AI-powered insights!
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <Globe className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm text-yellow-700">
                  🔒 Due to Instagram's CORS policy, we have pre-stored data for top 50 global influencers!
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <Star className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-700 mb-3">
                  Try these popular accounts:
                </p>
                <div className="flex justify-center">
                  <div className="hidden md:flex space-x-16">
                    <AccountList accounts={leftColumnAccounts} />
                    <AccountList accounts={rightColumnAccounts} />
                  </div>
                  <div className="md:hidden flex justify-center">
                    <AccountList accounts={leftColumnAccounts} />
                  </div>
                </div>
                <p className="text-xs text-blue-500 mt-2">
                  ...and {42 + rightColumnAccounts.length} more top influencers!
                </p>
              </div>
              <div className="mt-4 bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700">
                  🚀 Want to analyze other accounts?{' '}
                  <a 
                    href="https://github.com/Kaustubh251002/destiny_supermind"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 underline"
                  >
                    Run locally
                  </a>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-10 px-4 lg:px-8 p-6">
        <div className="lg:col-span-3 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
            Metrics & Insights
          </h2>
          <TopPostAndEngagement posts={metadata} username={currentUser} />
        </div>
        
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