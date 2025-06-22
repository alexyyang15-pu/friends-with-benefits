'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Connection, ClosestConnection } from '@/lib/types';
import { X, Linkedin, Mail, Copy, AlertTriangle, Send } from 'lucide-react';
import { ProgressBar } from './progress-bar';
import { UserProfile } from '@/hooks/useUserProfile';

interface ClosestConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  introducer: Connection | null;
  allConnections: Connection[];
  userProfile: UserProfile | null;
  onSelectTarget: (target: ClosestConnection) => void;
  cachedResults?: ClosestConnection[];
  onCacheUpdate: (
    introducerUrl: string,
    results: ClosestConnection[]
  ) => void;
  careerObjective: string;
}

export const ClosestConnectionsModal = ({
  isOpen,
  onClose,
  introducer,
  allConnections,
  userProfile,
  onSelectTarget,
  cachedResults,
  onCacheUpdate,
  careerObjective,
}: ClosestConnectionsModalProps) => {
  const [results, setResults] = useState<ClosestConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailProgress, setEmailProgress] = useState(0);

  useEffect(() => {
    if (isOpen && introducer) {
      if (cachedResults) {
        setResults(cachedResults);
        return;
      }

      const findConnections = async () => {
        setIsLoading(true);
        setError(null);
        setResults([]);
        setEmailProgress(0);

        try {
          // 1. Find closest connections
          const connectionsResponse = await fetch(
            '/api/find-closest-connections',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                targetContact: introducer,
                connections: allConnections,
                userProfile,
                careerObjective,
              }),
            }
          );

          if (!connectionsResponse.ok) {
            throw new Error('Failed to find closest connections.');
          }

          const { results: closestConnections } =
            await connectionsResponse.json();

          // 2. Find emails for each connection in parallel
          const emailPromises = closestConnections.map(
            async (conn: ClosestConnection) => {
              try {
                const emailResponse = await fetch('/api/find-email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    firstName: conn['First Name'],
                    lastName: conn['Last Name'],
                    company: conn.Company,
                  }),
                });

                if (emailResponse.ok) {
                  const { email } = await emailResponse.json();
                  setEmailProgress((prev) => prev + 1);
                  return { ...conn, email: email || 'Not found' };
                }
              } catch (e) {
                // Ignore individual email errors
              }
              setEmailProgress((prev) => prev + 1);
              return { ...conn, email: 'Not found' };
            }
          );

          const connectionsWithEmails = await Promise.all(emailPromises);
          setResults(connectionsWithEmails);
          onCacheUpdate(introducer.URL, connectionsWithEmails);
        } catch (err: any) {
          setError(
            err.message || 'An unexpected error occurred during analysis.'
          );
        } finally {
          setIsLoading(false);
        }
      };

      findConnections();
    }
  }, [
    isOpen,
    introducer,
    allConnections,
    userProfile,
    cachedResults,
    onCacheUpdate,
    careerObjective,
  ]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Analyzing {introducer?.['First Name']}'s Network...
          </h2>
          <p className="text-gray-600 mb-2">
            The AI is finding the best people {introducer?.['First Name']} can introduce you to.
          </p>
          <ProgressBar />
          {emailProgress > 0 && (
            <p className="text-sm text-blue-600 mt-2">
              Finding emails... ({emailProgress} / 10)
            </p>
          )}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-600">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-lg font-medium">Analysis Failed</h3>
          <p>{error}</p>
        </div>
      );
    }

    if (results.length > 0) {
      return (
        <div>
          <ul className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {results.map((conn) => (
              <li key={conn.URL} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800">
                      {conn['First Name']} {conn['Last Name']}
                    </h3>
                    <p className="text-sm text-gray-600">{conn.Position}</p>
                    <p className="text-sm text-gray-500">{conn.Company}</p>
                  </div>
                  <a
                    href={conn.URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <Linkedin size={20} />
                  </a>
                </div>
                <p className="mt-2 text-sm text-gray-700 bg-blue-50 p-2 rounded-md">
                  <span className="font-semibold">Reason:</span> {conn.reason}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail size={16} className="text-gray-500" />
                    <span
                      className={`font-mono ${
                        conn.email === 'Not found'
                          ? 'text-gray-400'
                          : 'text-gray-800'
                      }`}
                    >
                      {conn.email}
                    </span>
                    {conn.email && conn.email !== 'Not found' && (
                      <button
                        onClick={() => copyToClipboard(conn.email!)}
                        className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 ml-2"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => onSelectTarget(conn)}
                    className="flex items-center space-x-2 text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    title="Generate Warm Intro Email"
                    disabled={!conn.email || conn.email === 'Not found'}
                  >
                    <Send size={18} />
                    <span>Request Intro</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return null; // Should not happen if not loading and no error
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
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
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Who can {introducer?.['First Name']} introduce you to?
              </h2>
            </div>
            {renderContent()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
 