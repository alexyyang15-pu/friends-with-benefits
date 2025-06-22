'use client';

import { motion } from 'framer-motion';

interface WarmContactToggleProps {
  isToggled: boolean;
  onToggle: () => void;
}

const spring = {
  type: 'spring',
  stiffness: 700,
  damping: 30,
};

export const WarmContactToggle = ({
  isToggled,
  onToggle,
}: WarmContactToggleProps) => {
  return (
    <div
      className={`flex-shrink-0 w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
        isToggled
          ? 'bg-orange-400 justify-end'
          : 'bg-blue-500 justify-start'
      }`}
      onClick={onToggle}
    >
      <motion.div
        className="w-5 h-5 bg-white rounded-full shadow-md"
        layout
        transition={spring}
      />
    </div>
  );
}; 