import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { purchaseCredits } from '../services/auth';
import { toast } from 'sonner';
import { auth } from '../lib/firebase';

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const CREDIT_PACKAGES = [
  { amount: 100, price: 15, popular: false, icon: "✨" },  // 10 images for $15 (~$1.5/image)
  { amount: 500, price: 50, popular: true, icon: "🔥" },  // 50 images for $50 ($1/image)
  { amount: 1000, price: 90, popular: false, icon: "⚡" }, // 100 images for $90 ($0.9/image)
];  

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Razorpay API credentials
// const RAZORPAY_KEY_ID = "rzp_test_BRLNwkXJVOGoQE";
const RAZORPAY_KEY_ID = "rzp_live_xruFKEcNeWmzBk"; // Live key

// Exchange rate: INR to USD (as of current date)
const INR_TO_USD_RATE = 0.012; // 1 INR = 0.012 USD (approximately)

const convertInrToUsd = (inrAmount: number): number => {
  return parseFloat((inrAmount * INR_TO_USD_RATE).toFixed(4));
};

export const CreditPurchaseModal = ({ isOpen, onClose, userId }: CreditPurchaseModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<{ name: string; email: string }>({ name: '', email: '' });

  useEffect(() => {
    // Get current user details
    const user = auth.currentUser;
    if (user) {
      setUserDetails({
        name: user.displayName || 'User',
        email: user.email || ''
      });
    }
  }, []);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handlePurchase = async (amount: number, price: number) => {
    try {
      setIsLoading(true);
      setSelectedPackage(amount);
      
      // Create a Razorpay checkout instance
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: price * 100, // Amount in paise
        currency: "INR",
        name: "Pixel Magic Credits",
        description: `Purchase ${amount} credits (₹${price} | $${convertInrToUsd(price)})`,
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            setSelectedPackage(null);
          },
          confirm_close: true,
          escape: false,
          backdropClose: false
        },
        handler: async function(response: any) {
          if (response.razorpay_payment_id) {
            // Process the credit purchase after successful payment
            const success = await purchaseCredits(userId, amount, price);
            if (success) {
              toast.success(`Successfully purchased ${amount} credits!`);
              onClose();
            } else {
              toast.error('Failed to process credits. Please contact support.');
            }
          }
        },
        prefill: {
          name: userDetails.name,
          email: userDetails.email
        },
        theme: {
          color: "#3B82F6"
        },
        notes: {
          currency_conversion: `Equivalent to $${convertInrToUsd(price)} USD`
        }
      };
      
      // Close our modal before opening Razorpay
      onClose();
      
      // Create a new instance of Razorpay
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to initiate payment. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedPackage(null);
    }
  };

  const getValueText = (amount: number, price: number) => {
    const pricePerCredit = price / amount;
    const costPerImage = (price / amount) * 10; // Cost per image (10 credits per image)
    
    if (amount === 100) return 'Basic';
    if (amount === 500) return 'Best Value';
    if (amount === 1000) return 'Pro Pack';
    
    return `₹${(pricePerCredit).toFixed(2)} | $${convertInrToUsd(pricePerCredit).toFixed(4)} per credit`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="bg-[#1a1a1a] border-[#2d2d2d] max-w-md w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-1">
          <DialogTitle className="text-white text-xl font-bold">Power Up Your Creativity</DialogTitle>
          <DialogDescription className="text-gray-400 text-sm mt-1">
            Purchase credits to generate more amazing images
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 py-3">
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.amount}
              className={`relative rounded-lg border transition-all duration-300 overflow-hidden ${
                pkg.popular 
                  ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                  : 'border-[#2d2d2d] hover:border-blue-500/50'
              }`}
            >
              {pkg.popular && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-bl-lg">
                  POPULAR
                </div>
              )}
              
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{pkg.icon}</span>
                    <div>
                      <h3 className="text-white font-bold text-lg">{pkg.amount} Credits</h3>
                      <p className="text-blue-400 text-xs">{getValueText(pkg.amount, pkg.price)}</p>
                      <p className="text-gray-300 text-xs">
                        ₹{((pkg.price / pkg.amount) * 10).toFixed(2)} | ${convertInrToUsd((pkg.price / pkg.amount) * 10).toFixed(2)} per image
                      </p>
                    </div>
                  </div>
                  <div className="text-white text-xl font-bold">
                    <div className="flex items-center gap-1">
                      <span>₹{pkg.price}</span>
                      <span className="text-white">|</span>
                      <span>${convertInrToUsd(pkg.price).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className={`w-full py-2 text-white font-medium text-sm ${
                    pkg.popular 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-[#2d2d2d] hover:bg-[#3d3d3d]'
                  }`}
                  onClick={() => handlePurchase(pkg.amount, pkg.price)}
                  disabled={isLoading}
                >
                  {isLoading && selectedPackage === pkg.amount ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Buy Now'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-1 text-center text-xs text-gray-500">
          Secure payments powered by Razorpay.
        </div>
      </DialogContent>
    </Dialog>
  );
};