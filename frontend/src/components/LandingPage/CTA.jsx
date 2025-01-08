import React from "react";
import { useRouter } from "next/navigation";

const CTA = () => {
  const router = useRouter();
  
  return (
    <section className="max-w-5xl mx-auto px-6 py-24">
      <div className="relative p-12 space-y-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-3xl shadow-2xl overflow-hidden group">
        {/* Background Animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative z-10">
          <h2 className="text-5xl font-extrabold leading-tight mb-6">
            Ready to grow your Instagram?
          </h2>
          <p className="text-xl text-gray-100 max-w-2xl mx-auto">
            Join thousands of creators using <span className="font-bold">InstaBuddy</span> 
            to optimize their social media presence and unlock their full potential.
          </p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-8 bg-white text-indigo-600 hover:bg-gray-50 hover:scale-105 active:scale-95 px-12 py-4 rounded-full font-semibold shadow-lg transition-all duration-300"
          >
            Start Free Trial
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTA;
