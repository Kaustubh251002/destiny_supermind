'use client'

import { useRouter } from 'next/navigation'

const Hero = () => {
  const router = useRouter()

  return (
    <div className="h-96 bg-gradient-to-b from-white to-purple-100 flex flex-col justify-center items-center text-center space-y-6 w-9/12">
      {/* Heading */}
      <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
        Unlock Your Future Today
      </h1>
      
      {/* Subheading */}
      <p className="text-base text-gray-600 max-w-md">
        Experience cutting-edge technology to elevate your projects and streamline your goals.
      </p>
      
      {/* Call-to-Action Button */}
      <button
        onClick={() => router.push('/dashboard')}
        className="px-5 py-2 text-sm bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium rounded-full hover:scale-105 hover:shadow-lg transition-all duration-300"
      >
        Get Started Free
      </button>
    </div>
  )
}

export default Hero
