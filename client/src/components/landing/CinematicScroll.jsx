import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

const TOTAL_FRAMES = 240;
const ZOOM_FACTOR = 1.35;
const FRAME_DIRECTORY = '/frame'; 
const SCROLL_HEIGHT = 500; // in vh

const CinematicScroll = () => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const imagesRef = useRef([]);
  const frameIndexRef = useRef(0);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // Preload images
  useEffect(() => {
    let loadedCount = 0;
    const images = [];

    const preloadImages = () => {
      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const img = new Image();
        const frameNum = i.toString().padStart(3, '0');
        img.src = `${FRAME_DIRECTORY}/ezgif-frame-${frameNum}.jpg`;
        img.onload = () => {
          loadedCount++;
          setLoadProgress(Math.floor((loadedCount / TOTAL_FRAMES) * 100));
          if (loadedCount === TOTAL_FRAMES) {
            setIsLoaded(true);
            imagesRef.current = images;
            renderFirstFrame();
          }
        };
        images[i - 1] = img;
      }
    };

    const renderFirstFrame = () => {
      if (images[0]) {
        drawFrame(0);
      }
    };

    preloadImages();
  }, []);

  const drawFrame = useCallback((index) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    const img = imagesRef.current[index];

    if (!canvas || !ctx || !img) return;

    // Canvas dimensions
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Image dimensions
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    // manual object-fit: cover with ZOOM_FACTOR
    const canvasAspect = canvasWidth / canvasHeight;
    const imgAspect = imgWidth / imgHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (canvasAspect > imgAspect) {
      // Canvas is wider than image
      drawWidth = canvasWidth * ZOOM_FACTOR;
      drawHeight = (canvasWidth / imgAspect) * ZOOM_FACTOR;
    } else {
      // Canvas is taller than image
      drawHeight = canvasHeight * ZOOM_FACTOR;
      drawWidth = (canvasHeight * imgAspect) * ZOOM_FACTOR;
    }

    offsetX = (canvasWidth - drawWidth) / 2;
    offsetY = (canvasHeight - drawHeight) / 2;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }, []);

  // Handle Scroll logic
  useEffect(() => {
    if (!isLoaded) return;

    const handleScroll = () => {
      // Adjusted scroll math for component inside a larger page
      const rect = canvasRef.current.parentElement.parentElement.getBoundingClientRect();
      const offsetTop = window.scrollY + rect.top;
      const componentHeight = SCROLL_HEIGHT * window.innerHeight / 100;
      
      const scrollY = window.scrollY - offsetTop;
      const maxScroll = componentHeight - window.innerHeight;
      
      // Calculate fraction, ensuring it stays between 0 and 1
      const scrollFraction = Math.max(0, Math.min(1, scrollY / maxScroll));
      
      const frameIndex = Math.min(
        TOTAL_FRAMES - 1,
        Math.floor(scrollFraction * TOTAL_FRAMES)
      );

      if (frameIndex !== frameIndexRef.current) {
        frameIndexRef.current = frameIndex;
        requestAnimationFrame(() => drawFrame(frameIndex));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoaded, drawFrame]);

  // Handle Resize logic
  useEffect(() => {
    const handleResize = () => {
      drawFrame(frameIndexRef.current);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawFrame]);

  // Handle Mouse parallax
  useEffect(() => {
    if (!isLoaded) return;

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const xPos = (clientX / window.innerWidth - 0.5) * 30; // 30px max offset
      const yPos = (clientY / window.innerHeight - 0.5) * 30;

      gsap.to(canvasRef.current, {
        x: -xPos,
        y: -yPos,
        duration: 0.8,
        ease: 'power2.out',
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isLoaded]);

  // Initialize contextRef
  useEffect(() => {
    if (canvasRef.current) {
      contextRef.current = canvasRef.current.getContext('2d');
    }
  }, []);

  const scrollToTop = () => {
    gsap.to(window, { duration: 1, scrollTo: 0, ease: 'power2.inOut' });
  };

  return (
    <div className="relative bg-black" style={{ height: `${SCROLL_HEIGHT}vh` }}>
      {/* Loading Screen */}
      {!isLoaded && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
          <p className="mt-4 font-sans text-xs tracking-widest text-white/50 uppercase">
            Loading Cinematic Experience {loadProgress}%
          </p>
        </div>
      )}

      {/* Canvas Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden pointer-events-none">
        <canvas
          ref={canvasRef}
          className="block w-full h-full transform scale-105 will-change-transform"
          style={{ objectFit: 'cover' }}
        />
        
        {/* Shadow overlays mapping to scroll can go here if needed, but sticky keeps it on screen */}
      </div>

      {/* Scroll to Top Button (Hidden until some scroll) */}
      {isLoaded && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white p-4 rounded-full transition-all group active:scale-95 cursor-pointer pointer-events-auto"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 group-hover:-translate-y-1 transition-transform" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Hero Overlay Section */}
      <div className="absolute top-0 left-0 w-full min-h-screen flex items-center justify-center pointer-events-none z-10">
        <div className="text-center px-4 max-w-4xl">
          <h1 className="text-6xl md:text-8xl font-sans font-bold tracking-tighter text-white mb-6 uppercase">
            Cinematic <span className="text-primary">Motion</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 font-sans tracking-wide max-w-2xl mx-auto">
            Experience immersive storytelling controlled by your interaction. 
            Scroll down to begin the journey.
          </p>
        </div>
      </div>

      {/* Spacer sections for content or more scroll depth */}
      <div className="absolute bottom-20 w-full flex items-end justify-center pointer-events-none z-10">
        <p className="text-white/30 text-xs tracking-[0.2em] uppercase">End of Sequence</p>
      </div>
    </div>
  );
};

export default CinematicScroll;
