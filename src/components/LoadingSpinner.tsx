
import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col justify-center items-center">
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse"></div>
        <div className={`${sizeClasses[size]} rounded-full border-4 border-transparent border-t-primary animate-spin`}></div>
      </div>
      <div className="mt-4 bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent font-medium animate-pulse">
        Creating with Pixel Magic
      </div>
    </div>
  );
};

export default LoadingSpinner;
