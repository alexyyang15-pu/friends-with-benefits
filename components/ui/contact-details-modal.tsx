'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Connection } from '@/lib/types';
import { Linkedin, X, MapPin } from 'lucide-react';
import { WarmContactToggle } from './warm-contact-toggle';
import { ButtonColorful } from './button-colorful';

interface ContactDetailsModalProps {
  contact: Connection | null;
  onClose: () => void;
  isWarmContact: (url: string) => boolean;
  addWarmContact: (url: string) => void;
  removeWarmContact: (url: string) => void;
  onFindClosestConnections: (contact: Connection) => void;
  hasGeneratedConnections: boolean;
  onAIDiscoverNetwork?: (contact: Connection) => void;
}

export const ContactDetailsModal = ({
  contact,
  onClose,
  isWarmContact,
  addWarmContact,
  removeWarmContact,
  onFindClosestConnections,
  hasGeneratedConnections,
  onAIDiscoverNetwork,
}: ContactDetailsModalProps) => {
  if (!contact) return null;

  const handleFindClosest = () => {
    onFindClosestConnections(contact);
    onClose();
  };

  const handleAIDiscovery = () => {
    onAIDiscoverNetwork?.(contact);
    onClose();
  };

  return (
    <AnimatePresence>
      {contact && (
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
            className="bg-white rounded-xl shadow-2xl p-8 m-4 max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            <div className="flex flex-col items-center text-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {contact['First Name']} {contact['Last Name']}
              </h2>
              <p className="text-lg text-gray-600 mt-2">{contact.Position}</p>
              <p className="text-md text-gray-500">{contact.Company}</p>
              {contact.location && (
                <div className="flex items-center text-gray-500 mt-1">
                  <MapPin size={16} className="mr-2" />
                  <p className="text-md">{contact.location}</p>
                </div>
              )}
              <div className="flex items-center space-x-6 mt-6">
                <a
                  href={contact.URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-600"
                >
                  <Linkedin size={32} />
                </a>
                <WarmContactToggle
                  isToggled={isWarmContact(contact.URL)}
                  onToggle={() => {
                    if (isWarmContact(contact.URL)) {
                      removeWarmContact(contact.URL);
                      onClose(); // Close modal after toggling off
                    } else {
                      addWarmContact(contact.URL);
                    }
                  }}
                />
              </div>
              <div className="mt-6 w-full space-y-3">
                <ButtonColorful
                  onClick={handleFindClosest}
                  className="w-full"
                  label={
                    hasGeneratedConnections
                      ? `Show ${contact['First Name']}'s fwb`
                      : 'Find Closest Connections'
                  }
                />
                {onAIDiscoverNetwork && (
                  <ButtonColorful
                    onClick={handleAIDiscovery}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    label={`🤖 AI Discover ${contact['First Name']}'s Network`}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 