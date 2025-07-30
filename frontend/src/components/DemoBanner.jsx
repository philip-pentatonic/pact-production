import React from 'react';

const DemoBanner = () => {
  // Only show in demo mode
  if (!import.meta.env.VITE_DEMO_MODE) return null;
  
  const message = import.meta.env.VITE_DEMO_MESSAGE || 'Demo Environment - Test Data Only';
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-yellow-400/90 text-black text-center py-2 px-4 z-50 shadow-[0_-2px_4px_rgba(0,0,0,0.1)]">
      <p className="text-sm font-medium flex items-center justify-center gap-2">
        <span>🔧</span>
        <span>{message}</span>
        <a 
          href="mailto:sales@pentatonic.com" 
          className="underline hover:no-underline ml-2"
        >
          Contact Sales
        </a>
      </p>
    </div>
  );
};

export default DemoBanner;