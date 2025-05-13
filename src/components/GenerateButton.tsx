import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, LogIn } from 'lucide-react';
import { onAuthStateChange } from '../services/auth';
import { AuthModal } from './AuthModal';

interface GenerateButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
}

const GenerateButton: React.FC<GenerateButtonProps> = ({ 
  onClick, 
  disabled, 
  isLoading 
}) => {
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Reset click animation state when loading state changes
  useEffect(() => {
    if (!isLoading) {
      setIsClicked(false);
    }
  }, [isLoading]);

  const handleOpenAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  // Add immediate feedback and debounce the click
  const handleButtonClick = useCallback(() => {
    if (disabled || isLoading || isClicked) return;
    
    // Visual feedback
    setIsClicked(true);
    
    // Call the actual handler with a minimal delay for animation
    setTimeout(() => {
      onClick();
    }, 10);
  }, [onClick, disabled, isLoading, isClicked]);

  if (isAuthChecking) {
    return (
      <Button
        disabled={true}
        className="px-8 py-6 font-semibold text-lg rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 text-white opacity-50"
      >
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        <span>Loading...</span>
      </Button>
    );
  }

  if (!user) {
    return (
      <>
        <Button
          onClick={handleOpenAuthModal}
          type="button"
          className="px-8 py-6 font-semibold text-lg rounded-lg relative overflow-hidden group
            hover:scale-105 active:scale-95
            bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 bg-size-200 bg-pos-0 hover:bg-pos-100
            text-white transition-all duration-300 ease-out
            shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <LogIn className="h-5 w-5" />
            <span>Sign In to Generate</span>
          </span>
          <span className="absolute inset-0 opacity-0 group-hover:opacity-25 bg-gradient-to-r from-white/20 via-white/0 to-white/0 transition-opacity"></span>
        </Button>
        
        <AuthModal 
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

  return (
    <Button
      onClick={handleButtonClick}
      type="button"
      disabled={disabled || isLoading}
      aria-label="Generate image"
      className={`px-8 py-6 font-semibold text-lg rounded-lg relative overflow-hidden group
        ${isLoading ? 'opacity-80' : isClicked ? 'scale-95' : 'hover:scale-105'} 
        bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 bg-size-200 bg-pos-0 hover:bg-pos-100
        text-white transition-all duration-300 ease-out 
        shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]
        active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-opacity-50
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100`}
      title={disabled ? "Enter a prompt and API key first" : "Generate image"}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span>Generate</span>
          </>
        )}
      </span>
      <span className={`absolute inset-0 ${isClicked ? 'opacity-40' : 'opacity-0 group-hover:opacity-25'} bg-gradient-to-r from-white/20 via-white/0 to-white/0 transition-opacity`}></span>
      {/* Add ripple effect */}
      {isClicked && !isLoading && 
        <span className="absolute inset-0 scale-0 rounded-full bg-white/30 animate-ripple"></span>
      }
    </Button>
  );
};

export default GenerateButton;
