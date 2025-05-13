import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { loginWithGoogle, signUp, login, sendVerificationEmail } from '../services/auth';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Mail } from 'lucide-react';
import { auth } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [signupComplete, setSignupComplete] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('login');
      setSignupComplete(false);
      setName('');
      setEmail('');
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      await loginWithGoogle();
      toast.success('Logged in with Google successfully');
      onClose();
    } catch (error) {
      console.error('Google login failed:', error);
      toast.error('Failed to login with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const user = await login(email, password);
      
      if (!user.emailVerified) {
        toast.error('Please verify your email before logging in');
        setError('Email not verified. Please check your inbox for a verification link.');
        return;
      }
      
      toast.success('Logged in successfully');
      onClose();
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await signUp(email, password, name);
      setSignupComplete(true);
    } catch (error: any) {
      console.error('Signup failed:', error);
      setError(error.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setIsLoading(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        await sendVerificationEmail(currentUser);
      } else {
        toast.error('No active user session. Please log in again.');
      }
    } catch (error) {
      console.error('Failed to resend verification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'login' | 'signup');
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-[#2d2d2d] max-w-md">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-white text-2xl font-bold">Welcome</DialogTitle>
          <DialogDescription className="text-gray-400 text-base mt-2">
            {activeTab === 'login' ? 'Sign in to generate amazing AI images' : 'Create an account to get started'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="login" value={activeTab} onValueChange={handleTabChange} className="pt-4">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Login</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-gray-300">Email</Label>
                <Input 
                  id="login-email" 
                  type="email" 
                  placeholder="your@email.com" 
                  className="bg-[#2d2d2d] border-[#3d3d3d] text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-gray-300">Password</Label>
                <Input 
                  id="login-password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-[#2d2d2d] border-[#3d3d3d] text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              
              {error && <p className="text-red-500 text-sm">{error}</p>}
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : 'Login'}
              </button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#3d3d3d]"></span>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#1a1a1a] px-2 text-gray-400">Or continue with</span>
              </div>
            </div>
          </TabsContent>
          
          {signupComplete ? (
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
                <Mail className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Verify Your Email</h3>
              <p className="text-gray-400 mb-4">
                We've sent a verification link to <strong>{email}</strong>. 
                Please check your inbox and verify your email address.
              </p>
              <p className="text-gray-400 mb-4">
                You'll need to verify your email before you can generate images.
              </p>
              <div className="space-y-3">
                <Button 
                  className="w-full"
                  onClick={handleResendVerification}
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Resend Verification Email'}
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    setActiveTab('login');
                    setSignupComplete(false);
                  }}
                >
                  Back to Login
                </Button>
              </div>
            </div>
          ) : (
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-gray-300">Full Name</Label>
                  <Input 
                    id="signup-name" 
                    type="text" 
                    placeholder="John Doe" 
                    className="bg-[#2d2d2d] border-[#3d3d3d] text-white"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-gray-300">Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="your@email.com" 
                    className="bg-[#2d2d2d] border-[#3d3d3d] text-white"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-gray-300">Password</Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    placeholder="At least 6 characters" 
                    className="bg-[#2d2d2d] border-[#3d3d3d] text-white"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    minLength={6}
                  />
                </div>
                
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : 'Create Account'}
                </button>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#3d3d3d]"></span>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#1a1a1a] px-2 text-gray-400">Or continue with</span>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
        
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="mt-2 flex items-center justify-center w-full px-4 py-2 text-sm font-medium outline-none cursor-pointer bg-white hover:bg-gray-100 rounded-lg text-gray-800 transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#4285F4"/>
                <path d="M3.15295 7.3455L6.43845 9.755C7.32745 7.554 9.48045 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15895 2 4.82795 4.1685 3.15295 7.3455Z" fill="#EA4335"/>
                <path d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5718 17.5742 13.3038 18.001 12 18C9.39905 18 7.19005 16.3415 6.35705 14.027L3.09705 16.5395C4.75205 19.778 8.11405 22 12 22Z" fill="#34A853"/>
                <path d="M3.09705 16.5395L6.35705 14.027C6.06705 13.361 5.90005 12.691 5.90005 12C5.90005 11.309 6.09805 10.639 6.43845 9.755L3.15295 7.3455C2.41895 8.66496 2.00005 10.1443 2.00005 12C2.00005 13.8565 2.40205 15.637 3.09705 16.5395Z" fill="#FBBC05"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>
        
        <div className="text-center text-xs text-gray-500 mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </div>
      </DialogContent>
    </Dialog>
  );
}; 