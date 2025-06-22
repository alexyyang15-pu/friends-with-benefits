'use client';

import { useState, useEffect, useCallback } from 'react';
import { Connection } from '@/lib/types';

export const useWarmContacts = (
  initialConnections: Connection[],
  setParentConnections: (connections: Connection[]) => void
) => {
  const [warmContactUrls, setWarmContactUrls] = useState<Set<string>>(
    new Set()
  );

  // Load initial state from localStorage on mount
  useEffect(() => {
    try {
      const storedConnections = localStorage.getItem('connections');
      if (storedConnections) {
        setParentConnections(JSON.parse(storedConnections));
      }

      const storedWarmContactUrls = localStorage.getItem('warmContactUrls');
      if (storedWarmContactUrls) {
        setWarmContactUrls(new Set(JSON.parse(storedWarmContactUrls)));
      }
    } catch (error) {
      console.error('Error loading from localStorage', error);
    }
  }, [setParentConnections]);

  // Persist connections and warm contacts to localStorage whenever they change
  useEffect(() => {
    try {
      // Don't save empty array over existing data on initial load
      if (initialConnections.length > 0) {
        localStorage.setItem(
          'connections',
          JSON.stringify(initialConnections)
        );
      }
      localStorage.setItem(
        'warmContactUrls',
        JSON.stringify(Array.from(warmContactUrls))
      );
    } catch (error) {
      console.error('Error saving to localStorage', error);
    }
  }, [initialConnections, warmContactUrls]);

  const addWarmContact = useCallback((url: string) => {
    setWarmContactUrls((prev) => new Set(prev).add(url));
  }, []);

  const removeWarmContact = useCallback((url: string) => {
    setWarmContactUrls((prev) => {
      const newSet = new Set(prev);
      newSet.delete(url);
      return newSet;
    });
  }, []);

  const isWarmContact = useCallback(
    (url: string) => warmContactUrls.has(url),
    [warmContactUrls]
  );

  const warmContacts = initialConnections.filter((c) => isWarmContact(c.URL));

  return {
    warmContacts,
    addWarmContact,
    removeWarmContact,
    isWarmContact,
    setWarmContacts: setParentConnections,
  };
}; 