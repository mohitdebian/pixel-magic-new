import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Key } from 'lucide-react';
import { toast } from "sonner";

interface ApiKeyInputProps {
  onApiKeyChange: (apiKey: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeyChange }) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [showInput, setShowInput] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    // Check if API key exists in environment variables
    const envApiKey = import.meta.env.VITE_TOGETHER_API_KEY;
    
    if (envApiKey) {
      setApiKey(envApiKey);
      onApiKeyChange(envApiKey);
      setIsSaved(true);
      setShowInput(false);
    }
  }, [onApiKeyChange]);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }
    
    onApiKeyChange(apiKey);
    setIsSaved(true);
    setShowInput(false);
    toast.success('API key saved successfully');
  };

  if (!showInput && isSaved) {
    return null; // Don't render anything when API key is set
  }

  return (
    <div className="w-full glass-card p-4 rounded-xl mb-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <Key size={16} className="text-primary" />
        <h3 className="text-sm font-medium">Together AI API Key</h3>
      </div>
      
      <div className="mb-2 text-xs text-muted-foreground">
        <p>You need a Together AI API key to generate images.</p>
      </div>

      <div className="flex gap-2">
        <Input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Together AI API key"
          className="flex-1"
        />
        <Button onClick={handleSaveApiKey}>
          Save
        </Button>
      </div>
    </div>
  );
};

export default ApiKeyInput;
