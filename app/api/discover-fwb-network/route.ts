import { NextResponse, NextRequest } from 'next/server';
import { AINetworkResearcher, FWBContact } from '@/lib/ai-network-researcher';
import { CareerAlignmentAnalyzer } from '@/lib/career-alignment-analyzer';
import { UserProfile } from '@/hooks/useUserProfile';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const {
      fwbContact,
      userProfile,
      careerObjective,
      searchDepth = 'medium'
    } = body;

    // Task 4.2: Add comprehensive input validation for required fields
    const errors = validateRequestInput({ fwbContact, userProfile, careerObjective, searchDepth });
    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: errors,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Task 4.7: Add request logging for debugging and performance optimization
    const requestId = `fwb-discovery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${requestId}] Starting FWB network discovery for:`, {
      fwbName: fwbContact.name,
      fwbCompany: fwbContact.company,
      searchDepth,
      userProfile: userProfile.name
    });

    // Task 4.5: Add request deduplication and intelligent caching
    const cacheKey = generateCacheKey(fwbContact, userProfile, careerObjective, searchDepth);
    const cachedResult = await getCachedResult(cacheKey);
    
    if (cachedResult) {
      console.log(`[${requestId}] Returning cached result`);
      return NextResponse.json({
        ...cachedResult,
        cached: true,
        requestId
      });
    }

    // Task 4.3 & 4.4: Integrate all components into unified workflow with orchestrated Gemini calls
    const startTime = Date.now();
    
    // Step 1: AI Network Research
    console.log(`[${requestId}] Phase 1: Starting AI network research...`);
    const aiResearcher = new AINetworkResearcher();
    const networkDiscovery = await aiResearcher.discoverFWBNetwork(
      fwbContact,
      userProfile,
      careerObjective,
      searchDepth as 'shallow' | 'medium' | 'deep'
    );

    if (networkDiscovery.discoveredConnections.length === 0) {
      console.log(`[${requestId}] No connections discovered, returning early`);
      return NextResponse.json({
        discoveredConnections: [],
        searchSummary: networkDiscovery.searchSummary,
        researchInsights: networkDiscovery.researchInsights,
        careerAlignmentSummary: null,
        processingTime: Date.now() - startTime,
        requestId,
        code: 'NO_CONNECTIONS_FOUND'
      });
    }

    // Step 2: Career Alignment Analysis
    console.log(`[${requestId}] Phase 2: Analyzing career alignment for ${networkDiscovery.discoveredConnections.length} connections...`);
    const careerAnalyzer = new CareerAlignmentAnalyzer();
    const alignmentResults = await careerAnalyzer.analyzeIndividualAlignments(
      networkDiscovery.discoveredConnections,
      userProfile,
      careerObjective,
      'comprehensive'
    );

    // Step 3: Generate portfolio insights
    console.log(`[${requestId}] Phase 3: Generating portfolio insights...`);
    const portfolioInsights = await careerAnalyzer.generatePortfolioInsights(
      alignmentResults,
      userProfile,
      careerObjective
    );

    // Task 4.8: Implement response formatting that matches existing closest connections modal structure
    const formattedResponse = formatDiscoveryResponse({
      networkDiscovery,
      alignmentResults,
      portfolioInsights,
      processingTime: Date.now() - startTime,
      requestId
    });

    // Cache the result for future requests
    await setCachedResult(cacheKey, formattedResponse);

    console.log(`[${requestId}] Discovery completed successfully in ${Date.now() - startTime}ms`);
    return NextResponse.json(formattedResponse);

  } catch (error) {
    // Task 4.6: Create comprehensive error handling with specific error codes
    console.error('Error in FWB network discovery:', error);
    
    const errorResponse = handleDiscoveryError(error);
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

/**
 * Task 4.2: Comprehensive input validation
 */
function validateRequestInput({ fwbContact, userProfile, careerObjective, searchDepth }: any): string[] {
  const errors: string[] = [];

  // Validate FWB Contact
  if (!fwbContact || typeof fwbContact !== 'object') {
    errors.push('fwbContact is required and must be an object');
  } else {
    if (!fwbContact.name || typeof fwbContact.name !== 'string') {
      errors.push('fwbContact.name is required and must be a string');
    }
    if (!fwbContact.company || typeof fwbContact.company !== 'string') {
      errors.push('fwbContact.company is required and must be a string');
    }
    if (!fwbContact.position || typeof fwbContact.position !== 'string') {
      errors.push('fwbContact.position is required and must be a string');
    }
  }

  // Validate User Profile
  if (!userProfile || typeof userProfile !== 'object') {
    errors.push('userProfile is required and must be an object');
  } else {
    if (!userProfile.name || typeof userProfile.name !== 'string') {
      errors.push('userProfile.name is required and must be a string');
    }
    if (!userProfile.title || typeof userProfile.title !== 'string') {
      errors.push('userProfile.title is required and must be a string');
    }
  }

  // Validate search depth
  if (searchDepth && !['shallow', 'medium', 'deep'].includes(searchDepth)) {
    errors.push('searchDepth must be one of: shallow, medium, deep');
  }

  return errors;
}

/**
 * Task 4.5: Generate cache key for request deduplication
 */
function generateCacheKey(
  fwbContact: FWBContact,
  userProfile: UserProfile,
  careerObjective?: string,
  searchDepth?: string
): string {
  const keyComponents = [
    fwbContact.name,
    fwbContact.company,
    fwbContact.position,
    userProfile.name,
    userProfile.title,
    careerObjective || '',
    searchDepth || 'medium'
  ];
  
  // Create a hash of the key components
  const keyString = keyComponents.join('|');
  return Buffer.from(keyString).toString('base64').slice(0, 32);
}

/**
 * Task 4.5: Cache management (in-memory for now, could be Redis/database later)
 */
const discoveryCache = new Map<string, any>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getCachedResult(cacheKey: string): Promise<any | null> {
  const cached = discoveryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  if (cached) {
    discoveryCache.delete(cacheKey); // Remove expired cache
  }
  return null;
}

async function setCachedResult(cacheKey: string, data: any): Promise<void> {
  discoveryCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Task 4.8: Format response to match existing closest connections modal structure
 */
function formatDiscoveryResponse({
  networkDiscovery,
  alignmentResults,
  portfolioInsights,
  processingTime,
  requestId
}: any) {
  return {
    // Main discovered connections with alignment data
    discoveredConnections: alignmentResults.map((result: any) => ({
      // Connection details (result IS the connection with alignment data)
      ...result,
      
      // Additional metadata
      networkingPriority: result.careerAlignment?.overallScore || 5,
      introductionTemplates: result.careerAlignment?.actionableInsights?.introductionTemplates || {
        direct: `Hi ${result.name}, I'd love to connect and learn more about your work at ${result.company}.`
      }
    })),

    // Search and analysis summary
    searchSummary: {
      ...networkDiscovery.searchSummary,
      alignmentAnalysisTime: portfolioInsights.analysisMetadata?.processingTime || 0
    },

    // Research insights about the FWB's network
    researchInsights: networkDiscovery.researchInsights,

    // Career alignment portfolio insights
    careerAlignmentSummary: portfolioInsights,

    // Metadata
    processingTime,
    requestId,
    cached: false,
    timestamp: new Date().toISOString()
  };
}

/**
 * Task 4.6: Comprehensive error handling with specific error codes
 */
function handleDiscoveryError(error: any): { body: any; status: number } {
  if (error.message?.includes('API key')) {
    return {
      body: {
        error: 'AI service configuration error',
        code: 'API_KEY_ERROR',
        details: 'Please check Gemini API configuration'
      },
      status: 500
    };
  }

  if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
    return {
      body: {
        error: 'AI service rate limit exceeded',
        code: 'RATE_LIMIT_ERROR',
        details: 'Please try again later'
      },
      status: 429
    };
  }

  if (error.message?.includes('timeout')) {
    return {
      body: {
        error: 'Request timeout',
        code: 'TIMEOUT_ERROR',
        details: 'The AI analysis took too long. Please try again with shallow search depth.'
      },
      status: 504
    };
  }

  // Generic error
  return {
    body: {
      error: 'Internal server error during FWB network discovery',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    },
    status: 500
  };
} 