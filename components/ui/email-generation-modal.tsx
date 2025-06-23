'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Connection,
  ClosestConnection,
  GeneratedEmail,
} from '@/lib/types';
import { UserProfile } from '@/hooks/useUserProfile';
import { X, Copy, RefreshCw, AlertTriangle, Check, Mail } from 'lucide-react';

interface EmailGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  targetContact: ClosestConnection | null;
  introducerContact: Connection | null;
  reasonForIntroduction: string;
  ask: string;
  careerObjective: string;
}

export const EmailGenerationModal = ({
  isOpen,
  onClose,
  userProfile,
  targetContact,
  introducerContact,
  reasonForIntroduction,
  ask,
  careerObjective,
}: EmailGenerationModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(
    null
  );
  const [editedBody, setEditedBody] = useState('');
  const [hasCopied, setHasCopied] = useState(false);
  const [regenerationFeedback, setRegenerationFeedback] = useState('');

  const generateEmailAPICall = async (
    isRegenerating = false,
    feedback = ''
  ) => {
    const missingData = [];
    if (!userProfile) missingData.push('your user profile');
    if (!targetContact) missingData.push('the target contact');
    if (!introducerContact) missingData.push('the introducer');
    if (!reasonForIntroduction) missingData.push('the reason for the intro');
    if (!ask) missingData.push('your ask');

    if (missingData.length > 0) {
      setError(
        `Missing necessary data: ${missingData.join(', ')}.`
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    if (!isRegenerating) {
      setGeneratedEmail(null);
    }

    try {
      // Step 1: Get the target's experience summary
      const expResponse = await fetch('/api/get-target-experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetContact),
      });

      if (!expResponse.ok) {
        throw new Error("Failed to get the target's professional summary.");
      }
      const { summary: targetContactExperience } = await expResponse.json();

      // Step 2: Generate the email
      const emailResponse = await fetch('/api/generate-intro-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          targetContact,
          introducerContact,
          targetContactExperience,
          reasonForIntroduction,
          ask,
          feedback,
          careerObjective,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error('Failed to generate the email content.');
      }

      const email = await emailResponse.json();
      setGeneratedEmail(email);
      setEditedBody(email.body);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateEmailAPICall();
    }
  }, [isOpen]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(editedBody);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };
  
  const handleRegenerate = () => {
    const feedback = prompt(
      'What would you like to change in the regenerated email?'
    );
    if (feedback !== null) {
      setRegenerationFeedback(feedback);
      generateEmailAPICall(true, feedback);
    }
  };

  const handleOpenInGmail = () => {
    console.log('🔍 Gmail button clicked');
    console.log('📧 Generated email:', generatedEmail);
    console.log('👤 Introducer contact:', introducerContact);
    
    if (!generatedEmail) {
      console.log('❌ Missing generated email');
      alert('No email content available. Please regenerate the email.');
      return;
    }
    
    // Option A: Send to introducer asking them to make the introduction
    // Cast to ClosestConnection since introducerContact comes from the closest connections flow
    const introducerEmail = (introducerContact as any)?.email || '';
    console.log('📧 Introducer email:', introducerEmail || 'Not provided - will be blank');
    
    try {
      // Gmail compose URL with the correct format that actually works
      // Use the older but more reliable Gmail compose URL format
      const baseUrl = 'https://mail.google.com/mail/u/0/';
      const params = new URLSearchParams();
      
      params.set('view', 'cm'); // Compose mode
      params.set('fs', '1'); // Full screen
      
      if (introducerEmail) {
        params.set('to', introducerEmail);
      }
      params.set('su', generatedEmail.subject); // Subject
      params.set('body', editedBody); // Body content
      
      const finalUrl = `${baseUrl}?${params.toString()}`;
      console.log('🔗 Final Gmail URL:', finalUrl);
      
      // Try opening Gmail - don't rely on return value for popup detection
      // Browser security often returns null even when tab opens successfully
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
      console.log('✅ Gmail open command sent');
      
      // Give user feedback after a short delay
      if (!introducerEmail) {
        setTimeout(() => {
          alert('Gmail should have opened! Note: The "To" field will be blank - please add the introducer\'s email address.');
        }, 1500);
      } else {
        setTimeout(() => {
          console.log('📧 Gmail should be ready with pre-filled content');
        }, 1000);
      }
      
    } catch (error) {
      console.error('💥 Error opening Gmail:', error);
      
      // Only use mailto fallback if there was an actual error
      try {
        console.log('🔄 Trying mailto fallback due to error');
        const mailtoUrl = `mailto:${introducerEmail}?subject=${encodeURIComponent(generatedEmail.subject)}&body=${encodeURIComponent(editedBody)}`;
        window.location.href = mailtoUrl;
      } catch (mailtoError) {
        console.error('💥 Mailto also failed:', mailtoError);
        alert('Unable to open email client. Please copy the email manually.');
      }
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center p-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="inline-block"
          >
            <RefreshCw className="h-12 w-12 text-blue-600" />
          </motion.div>
          <h3 className="mt-4 text-xl font-semibold">Generating Draft...</h3>
          <p className="text-gray-500 mt-1">
            The AI is writing a personalized email for you.
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-600 p-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-lg font-medium">Generation Failed</h3>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => generateEmailAPICall()}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (generatedEmail) {
      const hasIntroducerEmail = (introducerContact as any)?.email && (introducerContact as any)?.email !== 'Not found';
      
      return (
        <div className="p-1">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Your Draft is Ready</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-600">Subject:</span>
              <p className="text-gray-800 flex-1">{generatedEmail.subject}</p>
            </div>
            <div className="space-y-2">
               <label className="font-semibold text-gray-600" htmlFor="email-body">Body:</label>
               <textarea
                id="email-body"
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
           <div className="mt-6 flex justify-between items-center">
              <button
                onClick={handleRegenerate}
                className="flex items-center space-x-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
              >
                <RefreshCw size={16} />
                <span>Regenerate</span>
              </button>
              <div className="flex items-center space-x-4">
                 <button
                  onClick={handleCopyToClipboard}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200"
                >
                  {hasCopied ? <Check size={18} /> : <Copy size={18} />}
                  <span>{hasCopied ? 'Copied!' : 'Copy'}</span>
                </button>
                 <button
                  onClick={handleOpenInGmail}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200"
                  title={hasIntroducerEmail ? 'Open in Gmail' : 'Open in Gmail (you\'ll need to add the recipient email)'}
                >
                  <Mail size={18} />
                  <span>Open in Gmail</span>
                </button>
                 <button
                  onClick={onClose}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
           </div>
        </div>
      );
    }
    
    return null;
  };

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
            className="bg-white rounded-xl shadow-2xl p-6 m-4 max-w-3xl w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            {renderContent()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 