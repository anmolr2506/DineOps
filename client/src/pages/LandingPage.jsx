import React from 'react';
import CinematicScroll from '../components/landing/CinematicScroll';
import AuthSection from '../components/auth/AuthSection';

const LandingPage = () => {
  return (
    <div className="w-full bg-black">
      {/* Top portion is the cinematic scrollytelling component */}
      <CinematicScroll />
      
      {/* Below the scroll sequence, the user naturally scrolls into the actual app features / auth */}
      <AuthSection />
    </div>
  );
};

export default LandingPage;
