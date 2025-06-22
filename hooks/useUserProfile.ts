'use client';

import { useState, useEffect, useCallback } from 'react';

// Define the structure of the user profile
export interface UserProfile {
  name: string;
  title: string;
  summary: string;
  skills: string[];
  experience: {
    company: string;
    title: string;
    dates: string;
  }[];
  dramaticSummary: string;
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem('userProfile');
      if (item) {
        setProfile(JSON.parse(item));
      }
    } catch (error) {
      console.error('Failed to retrieve user profile from localStorage', error);
      setProfile(null);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        if (profile) {
          window.localStorage.setItem('userProfile', JSON.stringify(profile));
        } else {
          window.localStorage.removeItem('userProfile');
        }
      } catch (error) {
        console.error('Failed to save user profile to localStorage', error);
      }
    }
  }, [profile, isInitialized]);

  const clearProfile = useCallback(() => {
    setProfile(null);
  }, []);

  return { profile, setProfile, clearProfile, isInitialized };
}; 