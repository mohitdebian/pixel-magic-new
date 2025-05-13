import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';

interface PromptInputProps {
  onPromptChange: (prompt: string) => void;
  disabled: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ onPromptChange, disabled }) => {
  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrompt = e.target.value;
    setPrompt(newPrompt);
    onPromptChange(newPrompt);
  };

  return (
    <div className="w-full relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Search className="w-5 h-5" />
      </div>
      <Input
        type="text"
        placeholder="Describe the image you want..."
        value={prompt}
        onChange={handleInputChange}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`px-12 py-6 bg-input text-foreground rounded-lg w-full text-lg transition-all duration-300
          ${isFocused ? 'ring-2 ring-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.15)]' : ''}
          ${disabled ? 'opacity-50' : 'hover:bg-input/90'}`}
        autoFocus
      />
      <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${prompt ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
      </div>
    </div>
  );
};

export default PromptInput;
