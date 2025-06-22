'use client';

import { motion } from 'framer-motion';
import { Connection } from '@/lib/types';

interface ContactBubbleProps {
  contact: Connection;
  onClick: () => void;
}

export const ContactBubble = ({ contact, onClick }: ContactBubbleProps) => {
  const fullName = `${contact['First Name']} ${contact['Last Name']}`;

  return (
    <motion.button
      onClick={onClick}
      className="bg-blue-200/50 hover:bg-blue-300/70 backdrop-blur-sm text-gray-800 font-semibold py-3 px-6 rounded-full shadow-lg m-2"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {fullName}
    </motion.button>
  );
}; 