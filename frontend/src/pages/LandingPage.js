'use client'
import { useState, useEffect } from 'react';
import Navbar from "../components/LandingPage/Navbar";
import Hero from "../components/LandingPage/Hero";
import Features from "../components/LandingPage/Features";
import CTA from "../components/LandingPage/CTA";
import Footer from "../components/LandingPage/Footer";
import LoadingScreen from "../components/loader";


const LandingPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // Show content with fade-in effect
    setIsVisible(true);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div 
      className={`min-h-screen bg-gradient-to-r from-purple-50 to-indigo-50 flex flex-col 
      transition-opacity duration-1000 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Navbar with slide-down animation */}
      <div className="transform transition-transform duration-1000 delay-300 translate-y-0">
        <Navbar />
      </div>

      {/* Hero Section with fade-in animation */}
      <main className="flex-grow flex flex-col justify-center items-center space-y-6 
        transform transition-all duration-1000 delay-500">
        <Hero />
      </main>

      {/* Features Section with slide-up animation */}
      <div className="transform transition-all duration-1000 delay-700">
        <Features />
      </div>

      {/* Call-to-Action with fade-in animation */}
      <div className="transform transition-opacity duration-1000 delay-900">
        <CTA />
      </div>

      {/* Footer with slide-up animation */}
      <div className="transform transition-all duration-1000 delay-1000">
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;