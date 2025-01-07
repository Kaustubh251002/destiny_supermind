'use client'
import Navbar from "../components/LandingPage/Navbar";
import Hero from "../components/LandingPage/Hero";
import Features from "../components/LandingPage/Features";
import CTA from "../components/LandingPage/CTA";
import Footer from "../components/LandingPage/Footer";


const LandingPage = () => {

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-50 to-indigo-50 flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <main className="flex-grow flex flex-col justify-center items-center space-y-6">
        <Hero/>
      </main>

      {/* Features Section */}
      <Features />

      {/* Call-to-Action */}
      <CTA/>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
