import React from "react";
import { useRouter } from "next/navigation";

const CTA = () => {
  const router = useRouter()
  return (
    <section className="max-w-4xl mx-auto px-6 py-20 text-center">
      <div className="p-12 space-y-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-3xl shadow-2xl">
        <h2 className="text-4xl font-extrabold leading-tight">
          Ready to grow your Instagram?
        </h2>
        <p className="text-lg text-gray-200">
          Join thousands of creators using <span className="font-bold">InstaBuddy</span> 
          to optimize their social media presence and unlock their full potential.
        </p>
        <button className="bg-white text-indigo-600 hover:bg-gray-200 hover:scale-105 px-10 py-3 rounded-full font-semibold shadow-lg transition duration-300" onClick={() => router.push('/dashboard')}>
          Start Free Trial
        </button>
      </div>
    </section>
  );
};

export default CTA;
