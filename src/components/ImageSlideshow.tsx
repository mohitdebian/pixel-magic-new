import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

// Local images from public folder
const SLIDESHOW_IMAGES = [
  { url: '/slide1.jpg' },
  { url: '/slide4.jpg' },
  { url: '/slide5.jpg' },
  { url: '/slide7.jpg' },
  { url: '/slide8.jpg' },
  { url: '/slide9.jpg' },
  { url: '/slide10.jpg' },
];

const ImageSlideshow: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  // Preload images
  useEffect(() => {
    // Preload current image and next image
    const imagesToLoad = [
      currentIndex,
      (currentIndex + 1) % SLIDESHOW_IMAGES.length,
      (currentIndex + 2) % SLIDESHOW_IMAGES.length
    ];
    
    imagesToLoad.forEach(index => {
      if (!loadedImages.has(index)) {
        const img = new Image();
        img.src = SLIDESHOW_IMAGES[index].url;
        img.onload = () => {
          setLoadedImages(prev => {
            const newSet = new Set(prev);
            newSet.add(index);
            return newSet;
          });
          if (index === currentIndex) {
            setIsImageLoaded(true);
          }
        };
      }
    });
  }, [currentIndex, loadedImages]);

  const goToNext = useCallback(() => {
    setIsImageLoaded(false);  
    setCurrentIndex((prevIndex) => (prevIndex + 1) % SLIDESHOW_IMAGES.length);
  }, []);

  const goToPrevious = useCallback(() => {
    setIsImageLoaded(false);
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? SLIDESHOW_IMAGES.length - 1 : prevIndex - 1
    );
  }, []);

  const handleDotClick = (index: number) => {
    if (index !== currentIndex) {
      setIsImageLoaded(false);
      setCurrentIndex(index);
    }
  };

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  // Touch event handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    
    // Swipe threshold of 50px
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext(); // Swipe left to right
      } else {
        goToPrevious(); // Swipe right to left
      }
    }
    
    setTouchStartX(null);
  };

  // Auto advance slideshow
  useEffect(() => {
    let interval: number | null = null;
    
    if (isAutoplay) {
      interval = window.setInterval(goToNext, 5000);
    }
    
    return () => {
      if (interval !== null) {
        clearInterval(interval);
      }
    };
  }, [isAutoplay, goToNext]);

  // Progress bar for autoplay
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    let progressInterval: number | null = null;
    
    if (isAutoplay) {
      setProgress(0);
      let currentProgress = 0;
      
      progressInterval = window.setInterval(() => {
        currentProgress += 1;
        setProgress(Math.min(currentProgress, 100));
      }, 50); // 5000ms / 50ms = 100 steps
    } else {
      setProgress(0);
    }
    
    return () => {
      if (progressInterval !== null) {
        clearInterval(progressInterval);
      }
    };
  }, [isAutoplay, currentIndex]);

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      <div className="absolute -top-8 -left-8 w-16 h-16 rounded-full bg-indigo-500/10 blur-lg"></div>
      <div className="absolute -bottom-8 -right-8 w-16 h-16 rounded-full bg-violet-500/10 blur-lg"></div>
      
      <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-violet-400 to-indigo-400 text-transparent bg-clip-text animate-fade-in-up">
        AI Image Showcase
      </h2>
      
      <div 
        className="relative overflow-hidden rounded-xl glass-card shadow-lg shadow-violet-500/10 hover:shadow-xl hover:shadow-violet-500/20 transition-all duration-500 animate-glow"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Image counter */}
        <div className="absolute top-4 left-4 z-10 py-1 px-3 rounded-full bg-black/40 backdrop-blur-sm text-xs text-white font-medium">
          {currentIndex + 1} / {SLIDESHOW_IMAGES.length}
        </div>
        
        {/* Autoplay control */}
        <button 
          onClick={() => setIsAutoplay(prev => !prev)}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
          aria-label={isAutoplay ? "Pause slideshow" : "Play slideshow"}
        >
          {isAutoplay ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white" />
          )}
        </button>
      
        {/* Image container */}
        <div className="relative aspect-[3/2] overflow-hidden">
          {SLIDESHOW_IMAGES.map((image, index) => (
            <img
              key={index}
              src={image.url}
              alt={`AI generated image ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                currentIndex === index 
                  ? 'opacity-100 z-10 scale-100' 
                  : 'opacity-0 z-0 scale-110'
              }`}
              onLoad={currentIndex === index ? handleImageLoad : undefined}
            />
          ))}
          
          {/* Loading indicator */}
          {!loadedImages.has(currentIndex) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
              <div className="w-8 h-8 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            </div>
          )}
          
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-20 pointer-events-none"></div>
        </div>
        
        {/* Navigation arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors hover:scale-110 transform duration-200"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors hover:scale-110 transform duration-200"
          aria-label="Next image"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
        
        {/* Autoplay progress bar */}
        {isAutoplay && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 z-30">
            <div 
              className="h-full bg-white/60 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        
        {/* Dot indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {SLIDESHOW_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                currentIndex === index
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageSlideshow; 