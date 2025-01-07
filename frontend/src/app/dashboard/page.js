'use client'

import Navbar from "../../components/Dashboard/Navbar";
import PerformanceOverview from "../../components/Dashboard/PerformanceOverview";
import AIChat from "../../components/Dashboard/AIChat";
import tempData from "D:/stuff/dev/ig-profile-data/output.json" assert {type: "json"};

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="pt-20 px-4 lg:px-8 h-screen flex flex-col lg:flex-row gap-6">
        {/* Left Section */}
        <div className="lg:w-3/4 flex flex-col gap-6 h-full">
          <PerformanceOverview data={tempData}/>
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
