import React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from "sonner";
import { PostHogProvider } from 'posthog-js/react'

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_REACT_APP_PUBLIC_POSTHOG_KEY}
      options={{
        api_host: import.meta.env.VITE_REACT_APP_PUBLIC_POSTHOG_HOST,
      }}
    >
      <Toaster 
        position="top-right" 
        expand={true} 
        richColors 
        closeButton
        theme="dark"
        toastOptions={{
          className: "glass-card",
          style: { 
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            background: 'rgba(20, 20, 30, 0.8)',
          },
          duration: 4000,
        }}
      />
      <App />
    </PostHogProvider>
  </React.StrictMode>
);
