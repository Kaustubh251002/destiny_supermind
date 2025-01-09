'use client';

import { useUserContext } from "../../context/UserContext";
import Navbar from "../../components/Dashboard/Navbar";
import PerformanceOverview from "../../components/Dashboard/PerformanceOverview";
import TopPostAndEngagement from "../../components/Dashboard/TopPostAndEngagement";

const Dashboard = () => {
  // Access user context data
  const { metadata, currentUser } = useUserContext();

  if (!metadata) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-xl text-gray-600">No user data found. Please switch user.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-10 px-4 lg:px-8 p-6">
        {/* Additional Metrics and Insights Section */}
        <div className="lg:col-span-3 bg-white shadow-md rounded-lg p-6">
          {/* Placeholder for future metrics and insights */}
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">Metrics & Insights</h2>
          <TopPostAndEngagement posts={metadata} username={currentUser} />
        </div>
        {/* Metrics and Insights Section */}
        <div className="pt-3">
          <div className="bg-white shadow-md rounded-lg p-6 w-full">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">Performance Overview</h2>
            <PerformanceOverview data={metadata} />
          </div> 
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
