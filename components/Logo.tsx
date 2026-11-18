
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12" }) => {
  return (
    <div className={`${className} relative flex items-center justify-center`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        {/* Decorative Gradient Definitions */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        {/* The "Setu" (Bridge) Arch */}
        <path
          d="M15 70C15 40 40 20 50 20C60 20 85 40 85 70"
          stroke="url(#logoGradient)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Connection Nodes */}
        <circle cx="15" cy="70" r="6" fill="#EA580C" />
        <circle cx="85" cy="70" r="6" fill="#F59E0B" />

        {/* Sound Waves (Enhanced Audio Feature Symbol) */}
        <path
          d="M35 55C40 50 60 50 65 55"
          stroke="#EA580C"
          strokeWidth="4"
          strokeLinecap="round"
          className="animate-pulse"
        />
        <path
          d="M30 65C40 58 60 58 70 65"
          stroke="#F59E0B"
          strokeWidth="4"
          strokeLinecap="round"
          style={{ animationDelay: '0.2s' }}
          className="animate-pulse"
        />
        <path
          d="M25 75C40 66 60 66 75 75"
          stroke="#EA580C"
          strokeWidth="4"
          strokeLinecap="round"
          style={{ animationDelay: '0.4s' }}
          className="animate-pulse"
        />
      </svg>
    </div>
  );
};

export default Logo;
