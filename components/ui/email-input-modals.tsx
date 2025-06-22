'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Connection, ClosestConnection } from '@/lib/types';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

interface EmailInputModalsProps {
  flowState: 'why' | 'ask';
  onClose: () => void;
  targetContact: ClosestConnection | null;
  introducerContact: Connection | null;
  reason: string;
  setReason: (reason: string) => void;
  ask: string;
  setAsk: (ask: string) => void;
  onNext: () => void;
  onBack: () => void;
  onGenerate: () => void;
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const EmailInputModals = ({
  flowState,
  onClose,
  targetContact,
  introducerContact,
  reason,
  setReason,
  ask,
  setAsk,
  onNext,
  onBack,
  onGenerate,
}: EmailInputModalsProps) => {
  if (!targetContact || !introducerContact) return null;

  const renderContent = () => {
    switch (flowState) {
      case 'why':
        return (
          <motion.div
            key="why"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Why do you want {introducerContact?.['First Name']} to introduce you to {targetContact?.['First Name']}?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              This context will help {introducerContact?.['First Name']} write the perfect intro.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., 'I'm impressed by their work in AI ethics and would love to get their perspective on a project I'm working on.'"
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <div className="mt-6 flex justify-end">
              <button
                onClick={onNext}
                disabled={!reason.trim()}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                <span>Next</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        );
      case 'ask':
        return (
          <motion.div
            key="ask"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              What is your specific ask of {targetContact?.['First Name']}?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Be clear and concise. What is the ideal outcome of this introduction?
            </p>
            <textarea
              value={ask}
              onChange={(e) => setAsk(e.target.value)}
              placeholder="e.g., 'A 15-minute virtual coffee to discuss their career path and advice for someone entering the field.'"
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <div className="mt-6 flex justify-between">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
              >
                <ArrowLeft size={18} />
                <span>Back</span>
              </button>
              <button
                onClick={onGenerate}
                disabled={!ask.trim()}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                <span>Generate Email</span>
              </button>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {(flowState === 'why' || flowState === 'ask') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="bg-white rounded-xl shadow-2xl p-8 m-4 max-w-2xl w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 