import { purchaseCredits } from './auth';

declare global {
  interface Window {
    handlePayment: (response: any) => void;
  }
}

export const setupRazorpayHandler = (userId: string) => {
  window.handlePayment = async (response: any) => {
    if (response.razorpay_payment_id) {
      // Get the amount from the response
      const amount = response.amount / 100; // Convert from paise to rupees
      
      // Map the amount to credit packages
      let creditAmount = 0;
      switch (amount) {
        case 25:
          creditAmount = 100;
          break;
        case 90:
          creditAmount = 500;
          break;
        case 175:
          creditAmount = 1000;
          break;
        default:
          console.error('Invalid payment amount');
          return;
      }

      // Process the credit purchase
      await purchaseCredits(userId, creditAmount, amount);
    }
  };
}; 