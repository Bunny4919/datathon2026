import React from 'react';

interface SecurityGraphicProps {
  type?: 'login' | 'signup' | 'forgot';
}

const SecurityGraphic: React.FC<SecurityGraphicProps> = ({ type = 'login' }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-12">
      {/* Background Pattern: Subtle Grid and Dots */}
      <div className="absolute inset-0 opacity-10"
           style={{
             backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
             backgroundSize: '30px 30px'
           }}
      />

      {/* Decorative State-inspired Geometric Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 0 L100 0 L100 100 L0 100 Z" fill="none" stroke="white" strokeWidth="0.2" />
          <path d="M0 20 L100 20 M0 40 L100 40 M0 60 L100 60 M0 80 L100 80" stroke="white" strokeWidth="0.1" />
          <path d="M20 0 L20 100 M40 0 L40 100 M60 0 L60 100 M80 0 L80 100" stroke="white" strokeWidth="0.1" />
        </svg>
      </div>

      {/* Main Security Composition */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Outer Pulsing Rings */}
          <div className="absolute inset-0 border-4 border-white/10 rounded-full animate-ping opacity-20" />
          <div className="absolute inset-4 border-2 border-white/20 rounded-full animate-pulse" />

          {/* The Digital Shield */}
          <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M100 20 C100 20 160 40 160 80 C160 130 100 180 100 180 C100 180 40 130 40 80 C40 40 100 20 100 20Z"
              fill="url(#shieldGrad)"
              stroke="white"
              strokeWidth="4"
            />
            <defs>
              <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E5AA8" />
                <stop offset="100%" stopColor="#0B3D91" />
              </linearGradient>
            </defs>

            {/* Internal Shield Details - Abstract Justice/Police Symbolism */}
            <path
              d="M100 45 L100 155 M60 80 L140 80"
              stroke="white"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.5"
            />
            <circle cx="100" cy="100" r="30" stroke="white" strokeWidth="4" opacity="0.8" />
            <path d="M85 100 L100 115 L115 100" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          {/* Floating Tech Elements */}
          <div className="absolute top-0 right-0 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 animate-bounce-slow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5a3 3 0 0 0-3-3h-4a3 3 0 0 0-3 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>

          <div className="absolute bottom-0 left-0 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 animate-bounce-slow delay-75">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <h2 className="text-2xl font-bold tracking-wide uppercase opacity-90">
            Karnataka State Police
          </h2>
          <p className="text-white/60 text-sm font-medium max-w-xs mx-auto leading-relaxed">
            Secure Intelligence & Law Enforcement Digital Portal
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecurityGraphic;
