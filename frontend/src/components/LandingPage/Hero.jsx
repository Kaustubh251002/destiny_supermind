// Hero.js
'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import '../../styles/hero.css'

const Hero = () => {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className={`hero-container ${isVisible ? 'visible' : ''}`}>
      {/* Animated background elements */}
      <div className="background-effects">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="hero-content">
        {/* Main heading */}
        <h1 className="hero-title">
          <span className="gradient-text">Unlock Your Future Today</span>
        </h1>
        
        {/* Subheading */}
        <p className="hero-description">
          Experience cutting-edge technology to elevate your projects and streamline your goals 
          with our powerful AI-driven platform.
        </p>
        
        {/* CTA buttons */}
        <div className="button-group">
          <button
            onClick={() => router.push('/dashboard')}
            className="primary-button"
          >
            Get Started Free
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="secondary-button"
          >
            Watch Demo
          </button>
        </div>

        {/* Feature badges */}
        <div className="feature-badges">
          {['AI Powered', 'Real-time Analytics', 'Smart Automation'].map((feature, index) => (
            <div key={index} className="badge">
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Hero