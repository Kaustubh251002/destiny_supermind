import React from "react";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const router = useRouter()
  return (
    <nav className="p-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo Section */}
        <div className="flex items-center space-x-2">
          {/* Icon */}
          <i className="bi bi-lightning-charge-fill text-2xl text-purple-600"></i>
          {/* Brand Name */}
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
            InstaBuddy
          </span>
        </div>

        {/* Navigation Links */}
        <div className="flex space-x-6">
          <a
            href="#features"
            className="px-6 py-2 text-gray-500 font-medium hover:scale-125 hover:text-black transition-transform duration-300"
          >
            Features
          </a>
          <a
            href="#demo"
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-300"
            onClick={() => router.push('/dashboard')}
          >
            Try Demo
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
