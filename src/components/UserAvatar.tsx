import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { loginWithGoogle, logout, getUserCredits, onAuthStateChange, onCreditUpdate } from '../services/auth';
import { toast } from 'sonner';
import { CreditPurchaseModal } from './CreditPurchaseModal';
import { SparklesIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

// Credits needed per image generation
const CREDITS_PER_GENERATION = 10;

export const UserAvatar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    let unsubscribeCredits: (() => void) | undefined;

    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      if (user) {
        // Initial credits fetch
        getUserCredits(user.uid).then(setCredits);
        // Set up real-time listener for credit updates
        unsubscribeCredits = onCreditUpdate(user.uid, (newCredits) => {
          setCredits(newCredits);
        });
      } else {
        setCredits(0);
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubscribeCredits) {
        unsubscribeCredits();
      }
    };
  }, []);

  // Show tutorial dialog if not logged in
  useEffect(() => {
    if (!user && !isLoading) {
      setShowTutorial(true);
      setTutorialStep(0);
    } else {
      setShowTutorial(false);
    }
  }, [user, isLoading]);

  const tutorialSteps = [
    {
      title: 'Welcome to Pixel Magic!',
      description: 'Generate AI images in seconds. Let us show you how to get started.'
    },
    {
      title: 'Step 1: Sign In',
      description: 'Sign in with Google to start generating images and track your credits.'
    },
    {
      title: 'Step 2: Enter a Prompt',
      description: 'Describe what you want to see. The AI will create an image based on your prompt.'
    },
    {
      title: 'Step 3: Generate & Download',
      description: 'Click generate, then download or share your masterpiece!'
    }
  ];

  const handleNextTutorial = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      toast.success('Logged in with Google successfully');
    } catch (error) {
      console.error('Google login failed:', error);
      toast.error('Failed to login with Google');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout');
    }
  };

  // Calculate how many images the user can generate with their credits
  const imagesRemaining = Math.floor(credits / CREDITS_PER_GENERATION);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center justify-center w-10 h-10 rounded-full outline-none transition-transform hover:scale-105 overflow-hidden border-2 border-transparent hover:border-blue-500 focus:border-blue-500">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-[#2d2d2d]">
                <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : user && user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || "User"} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-xl font-medium">
                {user ? (
                  user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                )}
              </div>
            )}
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[280px] bg-gradient-to-b from-[#1a1a1a] to-[#121212] rounded-xl shadow-2xl p-0 z-50 border border-[#2d2d2d] overflow-hidden animate-in slide-in-from-top-5 fade-in-20 duration-200"
            sideOffset={5}
            align="end"
          >
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : !user ? (
              <div className="p-4">
                <div className="mb-4 text-center">
                  <h3 className="text-white text-lg font-medium mb-1">Welcome</h3>
                  <p className="text-gray-400 text-sm">Sign in to generate images and manage credits</p>
                </div>
                <DropdownMenu.Item
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium outline-none cursor-pointer bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                  onSelect={handleGoogleLogin}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="white"/>
                  </svg>
                  Continue with Google
                </DropdownMenu.Item>
                
                <div className="mt-4 pt-4 border-t border-[#2d2d2d]">
                  <a 
                    href="https://twitter.com/mohitdebian" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-3 text-sm outline-none cursor-pointer hover:bg-[#2d2d2d] rounded-lg text-white transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#1DA1F2] flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">Follow us on Twitter</div>
                      <div className="text-gray-400 text-xs">@mohitdebian</div>
                    </div>
                  </a>
                  
                  <a 
                    href="mailto:devbyte.mohit@gmail.com" 
                    className="flex items-center px-4 py-3 text-sm outline-none cursor-pointer hover:bg-[#2d2d2d] rounded-lg text-white transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">Contact Us</div>
                      <div className="text-gray-400 text-xs">devbyte.mohit@gmail.com</div>
                    </div>
                  </a>
                </div>
              </div>
            ) : (
              <>
                <div className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden mr-4 ring-2 ring-blue-500 ring-offset-2 ring-offset-[#1a1a1a]">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-2xl font-medium">
                          {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">
                        {user.displayName || user.email?.split('@')[0] || 'User'}
                      </div>
                      <div className="text-gray-400 text-sm mb-2">
                        {user.email}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center bg-[#1a1a1a] px-3 py-1 rounded-full text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                          <span className="text-white font-medium">{credits}</span>
                          <span className="text-gray-400 ml-1">credits</span>
                        </div>
                        
                        <div className="flex items-center bg-[#1a1a1a] px-3 py-1 rounded-full text-sm">
                          <SparklesIcon className="h-4 w-4 mr-1 text-indigo-400" />
                          <span className="text-white font-medium">{imagesRemaining}</span>
                          <span className="text-gray-400 ml-1">images remaining</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-2">
                  <DropdownMenu.Item
                    className="flex items-center px-4 py-3 text-sm outline-none cursor-pointer hover:bg-[#2d2d2d] rounded-lg text-white transition-colors group"
                    onSelect={() => setIsPurchaseModalOpen(true)}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">Buy Credits</div>
                      <div className="text-gray-400 text-xs">Purchase credits for image generation</div>
                    </div>
                  </DropdownMenu.Item>
                  
                  <a 
                    href="https://twitter.com/mohitdebian" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-3 text-sm outline-none cursor-pointer hover:bg-[#2d2d2d] rounded-lg text-white transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#1DA1F2] flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">Follow us on Twitter</div>
                      <div className="text-gray-400 text-xs">@mohitdebian</div>
                    </div>
                  </a>
                  
                  <a 
                    href="mailto:devbyte.mohit@gmail.com" 
                    className="flex items-center px-4 py-3 text-sm outline-none cursor-pointer hover:bg-[#2d2d2d] rounded-lg text-white transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">Contact Us</div>
                      <div className="text-gray-400 text-xs">devbyte.mohit@gmail.com</div>
                    </div>
                  </a>
                  
                  <DropdownMenu.Item
                    className="flex items-center px-4 py-3 text-sm outline-none cursor-pointer hover:bg-[#2d2d2d] rounded-lg text-white transition-colors group"
                    onSelect={handleLogout}
                  >
                    <div className="w-9 h-9 rounded-full bg-[#2d2d2d] flex items-center justify-center mr-3 group-hover:bg-red-500/20 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-5-5H3zm7 5a1 1 0 10-2 0v4.3a1 1 0 102 0V8zm2.707 7.707a1 1 0 01-1.414 0L8 12.414l-3.293 3.293a1 1 0 01-1.414-1.414l3.293-3.293-3.293-3.293a1 1 0 010-1.414A1 1 0 014.707 6l3.293 3.293L11.293 6a1 1 0 011.414 1.414L9.414 10.707l3.293 3.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">Logout</div>
                      <div className="text-gray-400 text-xs">Sign out of your account</div>
                    </div>
                  </DropdownMenu.Item>
                </div>
              </>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {user && (
        <CreditPurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          userId={user.uid}
        />
      )}

      {/* Tutorial Dialog for not-logged-in users */}
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>{tutorialSteps[tutorialStep].title}</DialogTitle>
            <DialogDescription>{tutorialSteps[tutorialStep].description}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-6">
            <Button onClick={handleNextTutorial}>
              {tutorialStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}; 