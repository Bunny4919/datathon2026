import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  graphic?: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, graphic }) => {
  return (
    <div className="min-h-screen bg-ksp-bg flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-6xl bg-white rounded-[16px] shadow-xl border border-slate-200 overflow-hidden flex flex-col-reverse md:flex-row min-h-[680px] z-10">

        {/* Left Side: Auth Form */}
        <div className="w-full md:w-[45%] p-8 sm:p-12 md:p-16 flex flex-col justify-center bg-white">
          {children}
        </div>

        {/* Right Side: Official Graphic */}
        {graphic && (
          <div className="w-full md:w-[55%] bg-ksp-navy relative overflow-hidden hidden md:flex flex-col items-center justify-center text-white">
            {graphic}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthLayout;
