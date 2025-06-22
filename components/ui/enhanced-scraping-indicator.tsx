'use client';

import { useState, useEffect } from 'react';
import { Globe, Bot, CheckCircle, AlertCircle } from 'lucide-react';

interface EnhancedScrapingIndicatorProps {
  isActive: boolean;
  totalConnections: number;
  processedConnections: number;
}

export const EnhancedScrapingIndicator: React.FC<EnhancedScrapingIndicatorProps> = ({
  isActive,
  totalConnections,
  processedConnections,
}) => {
  const [currentMethod, setCurrentMethod] = useState<'stagehand' | 'ai' | 'complete'>('stagehand');
  
  useEffect(() => {
    if (!isActive) {
      setCurrentMethod('complete');
      return;
    }

    // Simulate the progression through methods
    const timer = setTimeout(() => {
      if (currentMethod === 'stagehand') {
        setCurrentMethod('ai');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isActive, currentMethod]);

  if (!isActive && processedConnections === 0) return null;

  const progress = totalConnections > 0 ? (processedConnections / totalConnections) * 100 : 0;

  return (
    <div className="mb-4 text-center">
      <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg shadow-sm">
        <div className="flex items-center mr-4">
          {isActive ? (
            <>
              {currentMethod === 'stagehand' && (
                <>
                  <Globe className="animate-spin mr-2 h-5 w-5 text-blue-600" />
                  <span className="text-blue-700 font-medium">
                    Scraping LinkedIn profiles...
                  </span>
                </>
              )}
              {currentMethod === 'ai' && (
                <>
                  <Bot className="animate-pulse mr-2 h-5 w-5 text-purple-600" />
                  <span className="text-purple-700 font-medium">
                    AI analyzing profiles...
                  </span>
                </>
              )}
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
              <span className="text-green-700 font-medium">
                Location enrichment complete
              </span>
            </>
          )}
        </div>
        
        {totalConnections > 0 && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">
              {processedConnections}/{totalConnections}
            </span>
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      {isActive && (
        <div className="flex justify-center items-center mt-2 space-x-4 text-xs text-gray-500">
          <div className="flex items-center">
            <Globe className="w-3 h-3 mr-1" />
            <span>Browser automation</span>
          </div>
          <div className="text-gray-300">→</div>
          <div className="flex items-center">
            <Bot className="w-3 h-3 mr-1" />
            <span>AI fallback</span>
          </div>
        </div>
      )}
    </div>
  );
}; 