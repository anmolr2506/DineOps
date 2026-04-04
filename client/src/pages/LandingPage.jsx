import React from 'react';
import CinematicScroll from '../components/landing/CinematicScroll';
import Login from './auth/Login'; // Changed from AuthSection to Login

const LandingPage = () => {
  return (
    <div className="w-full bg-black">
      {/* Top portion is the cinematic scrollytelling component */}
      <CinematicScroll />

      {/* 
        Below the scroll sequence, the user naturally scrolls into the actual app features / auth 
        We are embedding the newly designed Login screen here.
      */}
      <Login />
    </div>
  );
};

export default LandingPage;
