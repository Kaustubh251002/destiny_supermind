import React from 'react';
import '../styles/loader.css'; // Include custom CSS for animations

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-6">
        {/* Spinner */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full ping"></div>
          <div className="absolute inset-0 border-4 border-indigo-200 rounded-full ping delay"></div>
          <div className="absolute inset-0 border-4 border-t-indigo-600 border-r-indigo-600 rounded-full spin"></div>
        </div>

        {/* Text */}
        <div className="text-center">
          <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 pulse">
            InstaBuddy
          </div>
          <div className="mt-2 text-indigo-500 bounce">Loading amazing things...</div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
