import React from "react";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const router = useRouter();
  
  return (
    <nav className="sticky top-0 backdrop-blur-lg bg-white/75 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <div className="flex items-center space-x-2 group cursor-pointer">
            <i className="bi bi-lightning-charge-fill text-2xl text-purple-600 group-hover:animate-bounce"></i>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:opacity-80 transition-opacity">
              InstaBuddy
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-8">
            <a
              href="#features"
              className="relative px-4 py-2 text-gray-600 font-medium transition-colors hover:text-indigo-600 group"
            >
              Features
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
            </a>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-full shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Try Demo
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
