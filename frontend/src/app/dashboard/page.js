'use client';

import { useUserContext } from "../../context/UserContext";
import Navbar from "../../components/Dashboard/Navbar";
import PerformanceOverview from "../../components/Dashboard/PerformanceOverview";
import TopPostAndEngagement from "@/components/Dashboard/TopPostAndEngagement";

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
      <main className="pt-20 px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Metrics and Insights Section */}
        <div className="lg:col-span-3 bg-white shadow-md rounded-lg p-6 w-4/5">
          <PerformanceOverview data={metadata} />
        </div>
        {/* Additional Metrics and Insights Section */}
        <div className="lg:col-span-3 bg-white shadow-md rounded-lg p-6">
          {/* Placeholder for future metrics and insights */}
          <h2 className="text-xl font-bold mb-4">Additional Metrics & Insights</h2>
          <TopPostAndEngagement posts={metadata} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
