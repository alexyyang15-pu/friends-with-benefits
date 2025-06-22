'use client';

import { useState, useEffect, useRef } from 'react';

interface ReasonPopupProps {
  reason: string;
}

const colors = [
  'bg-red-500',
  'bg-yellow-500',
  'bg-green-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-purple-500',
  'bg-pink-500',
];

export const ReasonPopup = ({ reason }: ReasonPopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [randomColor, setRandomColor] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRandomColor(colors[Math.floor(Math.random() * colors.length)]);
  }, []);

  // Close popup if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [popupRef]);

  return (
    <span className="relative inline-block align-super ml-1" ref={popupRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-2 h-2 rounded-full ${randomColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-transform duration-150 ease-in-out hover:scale-125`}
        aria-label="Show reason"
      />
      {isOpen && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-10">
          <p>{reason}</p>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-800"></div>
        </div>
      )}
    </span>
  );
}; 