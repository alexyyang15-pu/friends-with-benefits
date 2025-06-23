import { useState, useCallback, useMemo } from 'react';
import { UserProfile } from './useUserProfile';

// Types for AI network discovery
export interface FWBContact {
  name: string;
  company: string;
  position: string;
  linkedinUrl?: string;
}

export interface DiscoveredConnection {
  name: string;
  title: string;
  company: string;
  linkedinUrl?: string;
  email?: string;
  relationshipToFWB: string;
  evidenceStrength: 'high' | 'medium' | 'low';
  evidenceSources: string[];
  careerRelevance: string;
  networkingValue: number;
  contactMethod: 'linkedin' | 'email' | 'mutual_connection';
  careerAlignment: {
    overallScore: number;
    alignmentFactors: {
      industryMatch: number;
      roleRelevance: number;
      skillsOverlap: number;
      careerStageAlignment: number;
      networkingPotential: number;
    };
    strategicValue: {
      shortTermBenefit: string;
      longTermBenefit: string;
      keyOpportunities: string[];
      potentialChallenges: string[];
    };
    actionableInsights: {
      approachStrategy: string;
      conversationStarters: string[];
      valueProposition: string;
      timeline: string;
      introductionTemplates: {
        direct: string;
        warm?: string;
      };
    };
  };
  networkingPriority: number;
  introductionTemplates: {
    direct: string;
    warm?: string;
  };
}

export interface AINetworkDiscoveryResult {
  discoveredConnections: DiscoveredConnection[];
  searchSummary: {
    totalSearches: number;
    sourcesAnalyzed: number;
    confidenceScore: number;
    alignmentAnalysisTime?: number;
  };
  researchInsights: {
    fwbNetworkSize: 'small' | 'medium' | 'large';
    industryConnections: string[];
    keyRelationshipTypes: string[];
  };
  careerAlignmentSummary: {
    overallNetworkingStrategy: string;
    topRecommendations: string[];
    careerAcceleration: {
      immediatePriorities: string[];
      mediumTermGoals: string[];
      longTermVision: string;
    };
    industryAlignment: string;
    analysisMetadata?: {
      processingTime: number;
      connectionsAnalyzed: number;
    };
  } | null;
  processingTime: number;
  requestId: string;
  cached: boolean;
  timestamp: string;
}

export interface AINetworkDiscoveryState {
  isLoading: boolean;
  error: string | null;
  result: AINetworkDiscoveryResult | null;
  phase: 'idle' | 'searching' | 'analyzing' | 'aligning' | 'complete' | 'error';
}

interface UseAINetworkDiscoveryOptions {
  enableCaching?: boolean;
  defaultSearchDepth?: 'shallow' | 'medium' | 'deep';
  onSuccess?: (result: AINetworkDiscoveryResult) => void;
  onError?: (error: string) => void;
}

export function useAINetworkDiscovery(options: UseAINetworkDiscoveryOptions = {}) {
  const {
    enableCaching = true,
    defaultSearchDepth = 'medium',
    onSuccess,
    onError
  } = options;

  // Main state
  const [state, setState] = useState<AINetworkDiscoveryState>({
    isLoading: false,
    error: null,
    result: null,
    phase: 'idle'
  });

  // Cache for storing previous results
  const [cache, setCache] = useState<Map<string, AINetworkDiscoveryResult>>(new Map());

  // Generate cache key
  const generateCacheKey = useCallback((
    fwbContact: FWBContact,
    userProfile: UserProfile,
    careerObjective?: string,
    searchDepth?: string
  ): string => {
    const keyComponents = [
      fwbContact.name,
      fwbContact.company,
      fwbContact.position,
      userProfile.name,
      userProfile.title,
      careerObjective || '',
      searchDepth || defaultSearchDepth
    ];
    return keyComponents.join('|');
  }, [defaultSearchDepth]);

  // Main discovery function
  const discoverNetwork = useCallback(async (
    fwbContact: FWBContact,
    userProfile: UserProfile,
    careerObjective?: string,
    searchDepth?: 'shallow' | 'medium' | 'deep'
  ) => {
    const actualSearchDepth = searchDepth || defaultSearchDepth;
    const cacheKey = generateCacheKey(fwbContact, userProfile, careerObjective, actualSearchDepth);

    // Check cache first
    if (enableCaching && cache.has(cacheKey)) {
      const cachedResult = cache.get(cacheKey)!;
      setState({
        isLoading: false,
        error: null,
        result: { ...cachedResult, cached: true },
        phase: 'complete'
      });
      onSuccess?.(cachedResult);
      return cachedResult;
    }

    // Start discovery process
    setState({
      isLoading: true,
      error: null,
      result: null,
      phase: 'searching'
    });

    try {
      const response = await fetch('/api/discover-fwb-network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fwbContact,
          userProfile,
          careerObjective,
          searchDepth: actualSearchDepth
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Discovery failed');
      }

      const result: AINetworkDiscoveryResult = await response.json();

      // Update state with success
      setState({
        isLoading: false,
        error: null,
        result,
        phase: 'complete'
      });

      // Cache the result
      if (enableCaching && !result.cached) {
        setCache(prev => new Map(prev.set(cacheKey, result)));
      }

      onSuccess?.(result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      setState({
        isLoading: false,
        error: errorMessage,
        result: null,
        phase: 'error'
      });

      onError?.(errorMessage);
      throw error;
    }
  }, [cache, enableCaching, generateCacheKey, defaultSearchDepth, onSuccess, onError]);

  // Clear current result
  const clearResult = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      result: null,
      phase: 'idle'
    });
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  // Get cached result for specific parameters
  const getCachedResult = useCallback((
    fwbContact: FWBContact,
    userProfile: UserProfile,
    careerObjective?: string,
    searchDepth?: 'shallow' | 'medium' | 'deep'
  ): AINetworkDiscoveryResult | null => {
    if (!enableCaching) return null;
    
    const cacheKey = generateCacheKey(fwbContact, userProfile, careerObjective, searchDepth);
    return cache.get(cacheKey) || null;
  }, [cache, enableCaching, generateCacheKey]);

  // Check if discovery is available (user profile is complete enough)
  const canDiscover = useCallback((userProfile: UserProfile | null): boolean => {
    if (!userProfile) return false;
    return !!(userProfile.name && userProfile.title);
  }, []);

  // Get discovery status message
  const getStatusMessage = useCallback((): string => {
    switch (state.phase) {
      case 'idle':
        return 'Ready to discover connections';
      case 'searching':
        return 'Searching for FWB network information...';
      case 'analyzing':
        return 'Analyzing discovered connections...';
      case 'aligning':
        return 'Evaluating career alignment...';
      case 'complete':
        return 'Discovery complete';
      case 'error':
        return state.error || 'Discovery failed';
      default:
        return 'Processing...';
    }
  }, [state.phase, state.error]);

  // Get progress percentage
  const getProgress = useCallback((): number => {
    switch (state.phase) {
      case 'idle':
        return 0;
      case 'searching':
        return 25;
      case 'analyzing':
        return 50;
      case 'aligning':
        return 75;
      case 'complete':
        return 100;
      case 'error':
        return 0;
      default:
        return 0;
    }
  }, [state.phase]);

  // Sort connections by networking priority
  const sortedConnections = useMemo((): DiscoveredConnection[] => {
    if (!state.result?.discoveredConnections) return [];
    
    return [...state.result.discoveredConnections].sort((a, b) => {
      // Sort by networking priority (higher first), then by overall alignment score
      if (b.networkingPriority !== a.networkingPriority) {
        return b.networkingPriority - a.networkingPriority;
      }
      return b.careerAlignment.overallScore - a.careerAlignment.overallScore;
    });
  }, [state.result]);

  // Get top recommendations
  const topRecommendations = useMemo((): DiscoveredConnection[] => {
    return sortedConnections.slice(0, 3); // Top 3 connections
  }, [sortedConnections]);

  // Filter connections by criteria
  const filterConnections = useCallback((
    criteria: {
      minNetworkingValue?: number;
      evidenceStrength?: 'high' | 'medium' | 'low';
      industry?: string;
      contactMethod?: 'linkedin' | 'email' | 'mutual_connection';
    }
  ): DiscoveredConnection[] => {
    if (!state.result?.discoveredConnections) return [];

    return state.result.discoveredConnections.filter(connection => {
      if (criteria.minNetworkingValue && connection.networkingValue < criteria.minNetworkingValue) {
        return false;
      }
      if (criteria.evidenceStrength && connection.evidenceStrength !== criteria.evidenceStrength) {
        return false;
      }
      if (criteria.contactMethod && connection.contactMethod !== criteria.contactMethod) {
        return false;
      }
      return true;
    });
  }, [state.result]);

  return {
    // State
    ...state,
    
    // Actions
    discoverNetwork,
    clearResult,
    clearCache,
    
    // Utilities
    getCachedResult,
    canDiscover,
    getStatusMessage,
    getProgress,
    
    // Computed values
    sortedConnections,
    topRecommendations,
    filterConnections,
    
    // Cache info
    cacheSize: cache.size,
    isCacheEnabled: enableCaching
  };
} 