'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface GoToFwbPopupProps {
  show: boolean;
  onClose: () => void;
  onGoToFwb: () => void;
}

export const GoToFwbPopup = ({
  show,
  onClose,
  onGoToFwb,
}: GoToFwbPopupProps) => {
  const handleGoToClick = () => {
    onGoToFwb();
    onClose();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white p-4 rounded-lg shadow-xl flex items-center space-x-4 z-50"
        >
          <p className="text-gray-700">
            Connection added to your warm contacts.
          </p>
          <button
            onClick={handleGoToClick}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition-colors"
          >
            Show me
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 