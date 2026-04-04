import React from 'react';

const AuthSection = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center border-t border-white/10 relative z-20">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <h1 className="text-4xl font-bold text-white text-center mb-6">Auth Section</h1>
        <p className="text-white/60 text-center mb-8">
          This is the authentication flow area. The user smoothly scrolled down to get here.
        </p>
        <div className="space-y-4">
          <button className="w-full py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors">
            Log In
          </button>
          <button className="w-full py-3 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors">
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthSection;
