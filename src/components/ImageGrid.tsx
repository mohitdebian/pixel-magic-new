import React from 'react';
import { Image } from 'lucide-react';

interface Image {
  id: string;
  url: string;
  prompt: string;
}

interface ImageGridProps {
  images: Image[];
  isLoading: boolean;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, isLoading }) => {
  if (images.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 glass-card rounded-xl p-6 mt-8 animate-fade-in">
        <Image className="w-12 h-12 text-muted-foreground/50 mb-4 animate-float" />
        <p className="text-lg text-muted-foreground text-center bg-gradient-to-r from-muted-foreground to-muted-foreground/70 bg-clip-text text-transparent">
          Your generated images will appear here
        </p>
        <p className="text-sm text-muted-foreground/70 mt-2 text-center">
          Enter a prompt and click Generate to create an image
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {images.map((image, index) => (
        <div 
          key={image.id} 
          className="overflow-hidden rounded-xl glass-card group hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 animate-fade-in flex flex-col"
          style={{ animationDelay: `${index * 150}ms` }}
        >
          <div className="relative aspect-square overflow-hidden">
            <div className="absolute top-2 right-2 z-10">
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Generated Image',
                      url: image.url
                    })
                    .catch(console.error);
                  } else {
                    // Fallback for browsers that don't support Web Share API
                    window.open(image.url, '_blank');
                  }
                }}
                className="p-1.5 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors duration-200"
                title="Share image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
              </button>
            </div>
            <img 
              src={image.url} 
              alt={image.prompt} 
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="p-4 bg-[#121212] border-t border-blue-900/20 flex-grow">
            <p className="text-sm transition-colors duration-300">
              <span className="font-semibold text-blue-400">Prompt:- </span>
              <span className="text-gray-300 group-hover:text-white line-clamp-2 group-hover:line-clamp-none transition-all duration-300">{image.prompt}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageGrid;
