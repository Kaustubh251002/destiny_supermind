'use client';

import { useUserContext } from "../../context/UserContext";
import Navbar from "../../components/Dashboard/Navbar";
import PerformanceOverview from "../../components/Dashboard/PerformanceOverview";
import AIChat from "../../components/Dashboard/AIChat";

const Dashboard = () => {
  // Access user context data
  const { metadata, currentUser } = useUserContext();

  if (!metadata) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="pt-20 px-4 lg:px-8 h-screen flex flex-col lg:flex-row gap-6">
          <p className="text-xl text-gray-600">No user data found. Please switch user.</p>
          </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-20 px-4 lg:px-8 h-screen flex flex-col lg:flex-row gap-6">
        {/* Left Section */}
        <div className="lg:w-3/4 flex flex-col gap-6 h-full">
          {/* Pass metadata to PerformanceOverview */}
          <PerformanceOverview data={metadata} />
        </div>

        {/* Right Section */}
        <div className="lg:w-1/4 flex-shrink-0 h-full">
          <AIChat />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
