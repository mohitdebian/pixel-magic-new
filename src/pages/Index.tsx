import React, { useState, useEffect } from 'react';
import PromptInput from '@/components/PromptInput';
import GenerateButton from '@/components/GenerateButton';
import ImageGrid from '@/components/ImageGrid';
import LoadingSpinner from '@/components/LoadingSpinner';
import ApiKeyInput from '@/components/ApiKeyInput';
import ImageSlideshow from '@/components/ImageSlideshow';
import { toast } from "sonner";
import { generateImage, GeneratedImage, initializeTogether } from '@/services/imageService';
import { Sparkles, Wand2, Image as ImageIcon, Stars, ZapIcon, Zap, Mail, AlertCircle } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { hasEnoughCredits, isEmailVerified as checkEmailVerified, sendVerificationEmail } from '@/services/auth';
import { CreditPurchaseModal } from '@/components/CreditPurchaseModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const Index: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean | null>(null);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);

  const tutorialSteps = [
    {
      icon: <Stars className="h-8 w-8 text-violet-400 animate-pulse" />,
      title: 'Welcome to Pixel Magic!',
      description: 'Generate AI images in seconds. Let us show you how to get started.'
    },
    {
      icon: <Sparkles className="h-8 w-8 text-indigo-400 animate-bounce" />,
      title: 'Step 1: Sign In',
      description: 'Sign in with Google to start generating images and track your credits.'
    },
    {
      icon: <Wand2 className="h-8 w-8 text-purple-400 animate-spin-slow" />,
      title: 'Step 2: Enter a Prompt',
      description: 'Describe what you want to see. The AI will create an image based on your prompt.'
    },
    {
      icon: <ImageIcon className="h-8 w-8 text-pink-400 animate-fade-in" />,
      title: 'Step 3: Generate & Download',
      description: 'Click generate, then download or share your masterpiece!'
    },
    {
      icon: <Zap className="h-8 w-8 text-green-400 animate-pulse" />,
      title: 'Start Creating Now!',
      description: 'Get started with your free credits and join our growing community of creators.'
    }
  ];

  // Check email verification status when user is logged in
  useEffect(() => {
    const checkVerification = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const verified = await checkEmailVerified(user.uid);
          setIsEmailVerified(verified);
        } catch (error) {
          console.error('Error checking verification status:', error);
        }
      } else {
        setIsEmailVerified(null);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkVerification();
      } else {
        setIsEmailVerified(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Initialize Together client with environment variable or user input
  useEffect(() => {
    const envApiKey = import.meta.env.VITE_TOGETHER_API_KEY;
    
    // If environment variable exists, use it directly
    if (envApiKey) {
      try {
        initializeTogether(envApiKey);
        setApiKey(envApiKey);
        setIsApiKeySet(true);
        console.log("Using API key from environment variable");
      } catch (error) {
        console.error("Error initializing Together client:", error);
        toast.error("Invalid API key in environment variable");
      }
    }
    // Otherwise use provided API key from input
    else if (apiKey) {
      try {
        initializeTogether(apiKey);
        setIsApiKeySet(true);
      } catch (error) {
        console.error("Error initializing Together client:", error);
        toast.error("Invalid API key format");
        setIsApiKeySet(false);
      }
    }
  }, [apiKey]);

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
  };

  const handleApiKeyChange = (newApiKey: string) => {
    setApiKey(newApiKey);
  };

  const handleResendVerification = async () => {
    try {
      setIsVerificationLoading(true);
      const user = auth.currentUser;
      if (user) {
        await sendVerificationEmail(user);
      } else {
        toast.error('Please log in to resend verification email');
      }
    } catch (error) {
      console.error('Failed to resend verification:', error);
    } finally {
      setIsVerificationLoading(false);
    }
  };

  const handleGenerate = React.useCallback(async () => {
    // Prevent multiple clicks
    if (isGenerating) return;
    
    // Validation checks
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first', {
        duration: 3000,
        className: "font-medium border border-red-200",
        icon: <Zap className="h-5 w-5 text-red-400 animate-pulse" />,
      });
      return;
    }

    if (!isApiKeySet) {
      toast.error('Please enter your Together AI API key first or set VITE_TOGETHER_API_KEY environment variable', {
        duration: 4000,
        className: "font-medium border border-red-200",
        icon: <Zap className="h-5 w-5 text-red-400 animate-pulse" />,
      });
      return;
    }

    // Start loading state immediately for better user feedback
    setIsGenerating(true);

    // Check if user is logged in
    const user = auth.currentUser;
    if (!user) {
      toast.error('Please log in to generate images', {
        duration: 3000,
        className: "font-medium border border-red-200",
        icon: <Zap className="h-5 w-5 text-red-400 animate-pulse" />,
      });
      setIsGenerating(false);
      return;
    }

    // Run checks in parallel for better performance
    try {
      // Start both checks at the same time
      const [verified, hasCredits] = await Promise.all([
        checkEmailVerified(user.uid),
        hasEnoughCredits(user.uid)
      ]);
      
      // Update verification state
      setIsEmailVerified(verified);
      
      // Handle verification error
      if (!verified) {
        toast.error('Please verify your email before generating images', {
          duration: 4000,
          className: "font-medium border border-red-200",
          icon: <Mail className="h-5 w-5 text-red-400 animate-pulse" />,
        });
        setIsGenerating(false);
        return;
      }
      
      // Handle insufficient credits
      if (!hasCredits) {
        toast.error('Insufficient credits. Please purchase more to continue.', {
          duration: 4000,
          className: "font-medium border border-red-200",
          icon: <Zap className="h-5 w-5 text-red-400 animate-pulse" />,
        });
        setIsPurchaseModalOpen(true);
        setIsGenerating(false);
        return;
      }
      
      // All checks passed, generate the image
      const newImage = await generateImage(prompt);
      
      // Update UI with new image
      setImages(prevImages => [newImage, ...prevImages]);
      
      toast.success('Image generated successfully!', {
        duration: 3000,
        className: "font-medium border border-green-200",
        icon: <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />,
      });
      
    } catch (error) {
      // Handle errors
      console.error('Error generating image:', error);
      
      // Don't show duplicate error toasts
      if (error instanceof Error && 
         !error.message.includes('Insufficient credits') && 
         !error.message.includes('Email not verified')) {
        toast.error('Failed to generate image. Please check your API key and try again.', {
          duration: 4000,
          className: "font-medium border border-red-200",
          icon: <Zap className="h-5 w-5 text-red-400 animate-pulse" />,
        });
      }
    } finally {
      // Always reset loading state
      setIsGenerating(false);
    }
  }, [
    prompt, 
    isApiKeySet, 
    isGenerating, 
    setIsEmailVerified, 
    setIsPurchaseModalOpen
  ]);

  const handleNextTutorial = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
    }
  };

  // Inside the return statement, after the API key input / prompt input section
  // Check if user is logged in but email is not verified
  const renderVerificationBanner = () => {
    const user = auth.currentUser;
    
    if (user && isEmailVerified === false) {
      return (
        <div className="w-full max-w-3xl mx-auto px-4 py-3 mb-6 glass-card rounded-lg border border-yellow-500/30 animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-white">
                Please verify your email address to generate images. Check your inbox for a verification link.
              </p>
            </div>
            <Button 
              size="sm" 
              onClick={handleResendVerification}
              disabled={isVerificationLoading}
              className="flex-shrink-0"
            >
              {isVerificationLoading ? 'Sending...' : 'Resend Email'}
            </Button>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <>
      {/* Tutorial Dialog for first-time users */}
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent
          className="w-[90%] max-w-md mx-auto glass-card shadow-2xl animate-fade-in-up p-0 overflow-visible"
          style={{
            background: 'rgba(30, 27, 75, 0.92)',
            backdropFilter: 'blur(16px)',
            borderRadius: '1.5rem',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          }}
          hideClose
        >
          {/* Animated border */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none z-0 animate-glow border-4 border-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 opacity-40" />
          <DialogHeader className="relative z-10 flex flex-col items-center gap-2 pt-12 pb-4 px-6 sm:px-8 w-full">
            <div className="mb-2">{tutorialSteps[tutorialStep].icon}</div>
            <DialogTitle className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text drop-shadow-lg text-center font-display tracking-tight animate-fade-in-up">
              {tutorialSteps[tutorialStep].title}
            </DialogTitle>
            <DialogDescription className="text-base sm:text-lg text-indigo-200 font-medium text-center mt-2 animate-fade-in-up animation-delay-200">
              {tutorialSteps[tutorialStep].description}
            </DialogDescription>
          </DialogHeader>

          {/* Free Credits and Social Proof Section - Only show on last step */}
          {tutorialStep === tutorialSteps.length - 1 && (
            <div className="relative z-10 flex flex-col items-center gap-3 px-6 sm:px-8 py-4 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 rounded-xl mx-4 animate-fade-in-up animation-delay-300">
              <div className="flex items-center gap-2 text-green-400 font-medium">
                <span className="text-xl">✨</span>
                <span>Get 50 free credits on signup to generate images for free!</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-400 font-medium">
                <span className="text-xl">🎨</span>
                <span>Over 1,500+ images generated!</span>
              </div>
            </div>
          )}

          {/* Step Indicator */}
          <div className="relative z-10 flex justify-center items-center gap-2 mt-4 mb-8">
            {tutorialSteps.map((_, index) => (
              <span
                key={index}
                className={`block h-2 w-2 rounded-full transition-colors duration-300 ${
                  index === tutorialStep ? 'bg-violet-400 scale-150' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          <div className="relative z-10 flex justify-center mt-10 mb-8 px-6 sm:px-8 w-full">
            <Button
              onClick={handleNextTutorial}
              className="px-8 py-3 text-lg font-bold rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 shadow-lg hover:scale-105 transition-transform duration-200 focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
            >
              {tutorialStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Main Home Screen Content */}
      <div className={`min-h-screen flex flex-col items-center ${showTutorial ? 'blur-sm pointer-events-none' : ''}`}>
        {/* Hero Section */}
        <header className="w-full bg-gradient-to-b from-violet-900/20 to-background py-16 md:py-24 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute -left-24 top-1/3 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -right-24 top-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
          
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="inline-block mb-4 mt-5 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20 backdrop-blur-sm animate-fade-in-down">
              <span className="text-sm font-medium text-violet-300 flex items-center justify-center gap-2">
                <Stars className="h-4 w-4 animate-pulse" />
                AI-Powered Image Generation
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in-up bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text">
              Modern Pixel Magic
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animation-delay-300 opacity-90">
              Transform your imagination into stunning visuals with our cutting-edge AI image generator
            </p>
            
            <div className="flex flex-col gap-4 items-center mt-8 animate-fade-in-up animation-delay-500">
              {renderVerificationBanner()}
              
              <div className="relative w-full max-w-3xl">
                <Sparkles className="absolute -top-6 -right-6 text-violet-500 animate-float w-12 h-12 opacity-70" />
                <Wand2 className="absolute -bottom-6 -left-6 text-indigo-500 animate-float animation-delay-1000 w-12 h-12 opacity-70" />
                <div className="glass-card p-1 rounded-xl border border-violet-500/20 shadow-lg shadow-violet-500/10 hover:shadow-xl hover:shadow-violet-500/20 transition-all duration-500 animate-glow">
                  <div className="w-full mx-auto">
                    <ApiKeyInput onApiKeyChange={handleApiKeyChange} />
                    <div className="flex flex-col md:flex-row gap-4 items-center p-4 rounded-xl animate-fade-in">
                      <div className="flex-1 w-full">
                        <PromptInput 
                          onPromptChange={handlePromptChange}
                          disabled={isGenerating}
                        />
                      </div>
                      <div>
                        <GenerateButton 
                          onClick={handleGenerate}
                          disabled={!prompt.trim() || !isApiKeySet}
                          isLoading={isGenerating}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="w-full max-w-7xl mx-auto px-4 mb-12">
          {isGenerating ? (
            <div className="flex justify-center my-10 animate-fade-in">
              <div className="flex flex-col items-center">
                <LoadingSpinner size="large" />
                <p className="mt-4 text-muted-foreground animate-pulse">Creating your visual masterpiece...</p>
              </div>
            </div>
          ) : images.length > 0 ? (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-violet-400 to-indigo-400 text-transparent bg-clip-text">
                Your Creations
              </h2>
              <ImageGrid images={images} isLoading={isGenerating} />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-full mt-8 relative">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-violet-500/10 blur-xl"></div>
                <div className="absolute -bottom-8 right-1/4 w-32 h-32 rounded-full bg-indigo-500/10 blur-xl"></div>
                <ImageSlideshow />
              </div>
              
              <div className="w-full mt-20 mb-12 text-center">
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-indigo-400 text-transparent bg-clip-text animate-fade-in-up">
                  How It Works
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                  <div className="glass-card p-6 rounded-xl hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-100 hover:animate-glow">
                    <div className="w-12 h-12 mb-4 mx-auto bg-violet-500/20 rounded-full flex items-center justify-center group-hover:bg-violet-500/30 transition-colors duration-300">
                      <Wand2 className="text-violet-400 group-hover:rotate-12 transition-transform" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Describe</h3>
                    <p className="text-muted-foreground">Type your imagination into words with detailed prompts</p>
                  </div>
                  <div className="glass-card p-6 rounded-xl hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-300 hover:animate-glow">
                    <div className="w-12 h-12 mb-4 mx-auto bg-indigo-500/20 rounded-full flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors duration-300">
                      <Sparkles className="text-indigo-400 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Generate</h3>
                    <p className="text-muted-foreground">Our AI processes your prompt and creates unique visuals</p>
                  </div>
                  <div className="glass-card p-6 rounded-xl hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-500 hover:animate-glow">
                    <div className="w-12 h-12 mb-4 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center group-hover:bg-purple-500/30 transition-colors duration-300">
                      <ImageIcon className="text-purple-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Enjoy</h3>
                    <p className="text-muted-foreground">Download, share or refine your generated masterpieces</p>
                  </div>
                </div>
              </div>
              <ImageGrid images={images} isLoading={isGenerating} />
            </div>
          )}
        </div>

        {/* Footer Section */}
        <footer className="w-full py-8 px-4 border-t border-gray-800 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0 animate-fade-in">
              <h3 className="font-bold text-xl bg-gradient-to-r from-violet-400 to-indigo-400 text-transparent bg-clip-text hover:scale-105 transition-transform duration-300 cursor-pointer">
                Modern Pixel Magic
              </h3>
            </div>
            <p className="text-sm text-gray-400 animate-fade-in animation-delay-300">
              © {new Date().getFullYear()} Modern Pixel Magic. All rights reserved.
            </p>
          </div>
        </footer>

        {/* Credit Purchase Modal */}
        {auth.currentUser && (
          <CreditPurchaseModal 
            isOpen={isPurchaseModalOpen}
            onClose={() => setIsPurchaseModalOpen(false)}
            userId={auth.currentUser.uid}
          />
        )}
      </div>
    </>
  );
};

export default Index;
