'use client';

import { useState, useRef, useCallback } from 'react';
import { UserProfile } from '@/hooks/useUserProfile';
import { UploadCloud, Loader2 } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';

// Set up the worker source for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface UserProfileUploaderProps {
  onUploadSuccess: (profile: UserProfile) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  label?: string;
}

export const UserProfileUploader = ({
  onUploadSuccess,
  isProcessing,
  setIsProcessing,
  label = 'Upload your resume (pdf)',
}: UserProfileUploaderProps) => {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = useCallback(
    async (text: string) => {
      if (!text) {
        setError('Could not extract text from PDF.');
        setIsProcessing(false);
        return;
      }

      try {
        const response = await fetch('/api/analyze-profile-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          const { error: message } = await response.json();
          throw new Error(message || 'Failed to analyze text.');
        }

        const profileData = await response.json();
        onUploadSuccess(profileData);
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred during analysis.');
      } finally {
        setIsProcessing(false);
      }
    },
    [onUploadSuccess, setIsProcessing]
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (!file) return;

      setIsProcessing(true);
      setError(null);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(' ');
        }

        await handleAnalyze(fullText);
      } catch (err: any) {
        setError('Failed to read the PDF file.');
        setIsProcessing(false);
      }
    },
    [setIsProcessing, handleAnalyze]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a PDF file.');
        return;
      }
      setError(null);
      handleFile(selectedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.type !== 'application/pdf') {
        setError('Please upload a PDF file.');
        return;
      }
      setError(null);
      handleFile(droppedFile);
    }
  };

  const triggerFileSelect = () => {
    if (isProcessing) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-md text-center">
      <label
        className={`flex items-center justify-center w-full px-4 py-3 text-sm border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 ${
          isProcessing
            ? 'cursor-not-allowed'
            : 'cursor-pointer hover:bg-gray-100'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 text-gray-500 animate-spin" />
            <span className="font-medium text-gray-600">Analyzing...</span>
          </>
        ) : (
          <>
            <UploadCloud className="w-5 h-5 mr-2 text-gray-500" />
            <span className="font-medium text-gray-600">{label}</span>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
      </label>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}; 