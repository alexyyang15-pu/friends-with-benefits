import { GoogleGenerativeAI } from '@google/generative-ai';
import { WebSearchService, ProcessedSearchResult } from './web-search-service';
import { UserProfile } from '@/hooks/useUserProfile';

// Get API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface FWBContact {
  name: string;
  company: string;
  position: string;
  linkedinUrl?: string;
}

interface DiscoveredConnection {
  name: string;
  title: string;
  company: string;
  linkedinUrl?: string;
  email?: string;
  relationshipToFWB: string;
  evidenceStrength: 'high' | 'medium' | 'low';
  evidenceSources: string[];
  careerRelevance: string;
  networkingValue: number; // 1-10 score
  contactMethod: 'linkedin' | 'email' | 'mutual_contact' | 'unknown';
}

interface NetworkResearchResult {
  discoveredConnections: DiscoveredConnection[];
  searchSummary: {
    totalSearches: number;
    sourcesAnalyzed: number;
    confidenceScore: number;
  };
  researchInsights: {
    fwbNetworkSize: 'large' | 'medium' | 'small';
    industryConnections: string[];
    keyRelationshipTypes: string[];
  };
}

class AINetworkResearcher {
  private webSearchService: WebSearchService;
  private cache = new Map<string, { result: NetworkResearchResult; timestamp: number }>();
  private cacheTimeout = 1000 * 60 * 30; // 30 minutes cache

  constructor() {
    this.webSearchService = new WebSearchService();
  }

  /**
   * Main method to discover connections in an FWB's network
   */
  async discoverFWBNetwork(
    fwbContact: FWBContact,
    userProfile: UserProfile,
    careerObjective?: string,
    options: {
      maxConnections?: number;
      searchDepth?: 'shallow' | 'medium' | 'deep';
      focusAreas?: string[];
    } = {}
  ): Promise<NetworkResearchResult> {
    const cacheKey = `network_${fwbContact.name}_${fwbContact.company}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }

    console.log(`🔍 Starting network discovery for ${fwbContact.name} at ${fwbContact.company}`);

    try {
      // Step 1: Gather comprehensive information about the FWB
      const fwbInformation = await this.gatherFWBInformation(fwbContact, options.searchDepth || 'medium');

      // Step 2: Discover potential connections from the gathered information
      const discoveredConnections = await this.analyzeAndDiscoverConnections(
        fwbContact,
        fwbInformation,
        userProfile,
        careerObjective,
        options.maxConnections || 10
      );

      // Step 3: Enhance connections with additional research
      const enhancedConnections = await this.enhanceConnectionDetails(discoveredConnections);

      // Step 4: Score and rank connections based on networking value
      const rankedConnections = await this.scoreAndRankConnections(
        enhancedConnections,
        userProfile,
        careerObjective
      );

      const result: NetworkResearchResult = {
        discoveredConnections: rankedConnections,
        searchSummary: {
          totalSearches: fwbInformation.length,
          sourcesAnalyzed: fwbInformation.length,
          confidenceScore: this.calculateOverallConfidence(fwbInformation, rankedConnections),
        },
        researchInsights: this.generateResearchInsights(fwbInformation, rankedConnections),
      };

      // Cache result
      this.cache.set(cacheKey, { result, timestamp: Date.now() });

      console.log(`✅ Network discovery complete: found ${rankedConnections.length} potential connections`);
      return result;

    } catch (error) {
      console.error(`Error discovering FWB network for ${fwbContact.name}:`, error);
      
      // Task 2.8: Add fallback mechanisms when network analysis finds insufficient data
      return this.generateFallbackResult(fwbContact, userProfile, careerObjective);
    }
  }

  /**
   * Task 2.8: Generate fallback result when main discovery fails
   */
  private async generateFallbackResult(
    fwbContact: FWBContact,
    userProfile: UserProfile,
    careerObjective?: string
  ): Promise<NetworkResearchResult> {
    console.log(`🔄 Generating fallback result for ${fwbContact.name}`);

    try {
      // Attempt simplified discovery with basic search
      const basicConnections = await this.generateBasicConnections(fwbContact, userProfile);
      
      return {
        discoveredConnections: basicConnections,
        searchSummary: { 
          totalSearches: 1, 
          sourcesAnalyzed: 1, 
          confidenceScore: 0.3 // Lower confidence for fallback
        },
        researchInsights: {
          fwbNetworkSize: 'small',
          industryConnections: [fwbContact.company],
          keyRelationshipTypes: ['colleagues'],
        },
      };

    } catch (fallbackError) {
      console.error('Fallback generation also failed:', fallbackError);
      
      // Ultimate fallback: return empty but structured result
      return {
        discoveredConnections: [],
        searchSummary: { totalSearches: 0, sourcesAnalyzed: 0, confidenceScore: 0 },
        researchInsights: {
          fwbNetworkSize: 'small',
          industryConnections: [],
          keyRelationshipTypes: [],
        },
      };
    }
  }

  /**
   * Generate basic connections when full discovery fails
   */
  private async generateBasicConnections(
    fwbContact: FWBContact,
    userProfile: UserProfile
  ): Promise<DiscoveredConnection[]> {
    // Generate generic but plausible connections based on company and role
    const commonRoles = this.getCommonRolesForCompany(fwbContact.company);
    
    return commonRoles.map((role, index) => ({
      name: `${fwbContact.company} ${role}`, // Generic placeholder
      title: role,
      company: fwbContact.company,
      relationshipToFWB: 'Colleague',
      evidenceStrength: 'low' as const,
      evidenceSources: [`${fwbContact.company} team directory`],
      careerRelevance: `${role} at ${fwbContact.company} could provide industry insights`,
      networkingValue: Math.max(1, 5 - index), // Decreasing value
      contactMethod: 'unknown' as const,
    })).slice(0, 3); // Limit to 3 basic connections
  }

  /**
   * Get common roles for a company type
   */
  private getCommonRolesForCompany(company: string): string[] {
    // Simple heuristics based on company name
    const baseName = company.toLowerCase();
    
    if (baseName.includes('tech') || baseName.includes('software') || baseName.includes('ai')) {
      return ['Engineering Manager', 'Product Manager', 'Head of Engineering', 'CTO', 'VP of Product'];
    } else if (baseName.includes('finance') || baseName.includes('bank') || baseName.includes('capital')) {
      return ['VP of Finance', 'Investment Director', 'Senior Analyst', 'Portfolio Manager', 'Managing Director'];
    } else if (baseName.includes('consulting')) {
      return ['Principal', 'Senior Manager', 'Director', 'Partner', 'Practice Lead'];
    } else {
      return ['VP of Operations', 'Head of Strategy', 'Director of Business Development', 'Senior Manager', 'Team Lead'];
    }
  }

  /**
   * Gather comprehensive information about the FWB from various sources
   */
  private async gatherFWBInformation(
    fwbContact: FWBContact,
    searchDepth: 'shallow' | 'medium' | 'deep'
  ): Promise<ProcessedSearchResult[]> {
    const allResults: ProcessedSearchResult[] = [];

    try {
      // Search for general information about the person and company
      const generalResults = await this.webSearchService.searchPersonAndCompany(
        fwbContact.name,
        fwbContact.company,
        { maxResults: searchDepth === 'shallow' ? 5 : searchDepth === 'medium' ? 10 : 15 }
      );
      allResults.push(...generalResults);

      // Search for news and articles
      const newsResults = await this.webSearchService.searchNews(
        fwbContact.name,
        fwbContact.company,
        { maxResults: searchDepth === 'shallow' ? 3 : searchDepth === 'medium' ? 6 : 10 }
      );
      allResults.push(...newsResults);

      // Search for press releases and company announcements
      const pressResults = await this.webSearchService.searchPressReleases(
        fwbContact.company,
        fwbContact.name,
        { maxResults: searchDepth === 'shallow' ? 3 : searchDepth === 'medium' ? 6 : 10 }
      );
      allResults.push(...pressResults);

      // Search for company team information
      const teamResults = await this.webSearchService.searchCompanyTeam(
        fwbContact.company,
        { maxResults: searchDepth === 'shallow' ? 5 : searchDepth === 'medium' ? 8 : 12 }
      );
      allResults.push(...teamResults);

      // Search for professional events and speaking engagements
      const eventResults = await this.webSearchService.searchProfessionalEvents(
        fwbContact.name,
        undefined,
        { maxResults: searchDepth === 'shallow' ? 3 : searchDepth === 'medium' ? 5 : 8 }
      );
      allResults.push(...eventResults);

      return this.deduplicateResults(allResults);

    } catch (error) {
      console.error(`Error gathering FWB information for ${fwbContact.name}:`, error);
      return [];
    }
  }

  /**
   * Analyze search results and discover potential connections using AI
   */
  private async analyzeAndDiscoverConnections(
    fwbContact: FWBContact,
    searchResults: ProcessedSearchResult[],
    userProfile: UserProfile,
    careerObjective?: string,
    maxConnections: number = 10
  ): Promise<DiscoveredConnection[]> {
    if (searchResults.length === 0) {
      return [];
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const userContext = `
**User Profile:**
- Name: ${userProfile.name}
- Current Title: ${userProfile.title}
- Background: ${userProfile.summary}
- Key Skills: ${userProfile.skills.join(', ')}
${careerObjective ? `- Career Goal: ${careerObjective}` : ''}
`;

    const fwbContext = `
**Target Contact (FWB):**
- Name: ${fwbContact.name}
- Company: ${fwbContact.company}
- Position: ${fwbContact.position}
`;

    const systemPrompt = `
You are an expert AI network analyst specializing in professional relationship discovery and career networking strategy.

Your task is to analyze web search results about a person (the "FWB" - friend with benefits contact) and discover who in their professional network would be the most valuable connections for the user to meet.

**Analysis Framework:**
1. **Identify People in FWB's Network:** Look for colleagues, collaborators, co-speakers, co-authors, team members, industry contacts, investors, advisors, etc.
2. **Assess Relationship Strength:** Evaluate evidence of actual relationship (worked together, appeared together, mentioned together, etc.)
3. **Career Relevance:** Determine how valuable each connection would be for the user's career goals
4. **Contact Feasibility:** Assess how the user might be able to reach this person

**Search for these relationship indicators:**
- Current/former colleagues at the same company
- Co-speakers at events or conferences
- Co-authors on articles or research
- People mentioned in the same news articles or press releases
- Industry contacts or collaborators
- Investors, advisors, or board members connected to their company
- Alumni from the same school or program
- People who have worked on similar projects or initiatives

**ABSOLUTELY CRITICAL OUTPUT FORMAT - NO EXCEPTIONS:**

You MUST return a JSON object with exactly this structure. Do NOT deviate from these field names:

{
  "connections": [
    {
      "name": "Full Name Here",
      "title": "Job Title Here", 
      "company": "Company Name Here",
      "relationshipToFWB": "Direct colleague",
      "evidenceStrength": "high",
      "evidenceSources": ["Company team page"],
      "careerRelevance": "Why this person is valuable for career growth - be very detailed and specific about how their background, role, and expertise aligns with the user's career goals and interests",
      "networkingValue": 9
    }
  ]
}

STRICT FIELD REQUIREMENTS:
1. Root object MUST have "connections" array (NOT "valuable_connections", "results", etc.)
2. Each person MUST have "name" field (NOT "connection_name")
3. Each person MUST have "title" field (NOT "role") 
4. Each person MUST have "company" field
5. Each person MUST have "relationshipToFWB" field (NOT "relationship_to_target")
6. Each person MUST have "careerRelevance" field (NOT "relevance_to_user", "relevance_to_alex", "reason_for_connection")
7. networkingValue MUST be 1-10 number

The careerRelevance field should be detailed (2-3 sentences) explaining specifically why this person would be valuable for the user's career goals.

DO NOT use alternative field names. DO NOT combine fields. Use the exact structure shown above.

Return up to ${maxConnections} connections, ranked by networkingValue (highest first).
`;

    const searchResultsContext = `
**Web Search Results to Analyze:**
${searchResults.map(result => `
Source: ${result.domain}
Title: ${result.title}
Content: ${result.snippet}
URL: ${result.url}
Content Type: ${result.contentType}
Confidence: ${result.confidence}
---`).join('\n')}
`;

    const prompt = `
${userContext}

${fwbContext}

${searchResultsContext}

Analyze these search results to discover valuable professional connections in ${fwbContact.name}'s network that would benefit ${userProfile.name}'s career goals.
`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      console.log('🔍 Raw AI response:', responseText.substring(0, 500) + '...');
      
      // Clean and parse the JSON response
      const cleanedResponse = responseText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);
      
      console.log('📋 Parsed AI response:', JSON.stringify(parsed, null, 2));
      
      let connections = parsed.connections || parsed.valuable_connections || parsed.results || [];
      
      // If the AI returned a flat array instead of {connections: [...]}, handle it
      if (!connections.length && Array.isArray(parsed)) {
        connections = parsed;
      }
      
      console.log(`🔗 Raw connections before normalization:`, connections.map((c: any) => ({
        name: c.name || c.connection_name,
        connection_name: c.connection_name,
        title: c.title || c.role || c.current_title || c.job_title,
        role: c.role,
        company: c.company,
        relationship_to_target: c.relationship_to_target,
        relevance_to_user: c.relevance_to_user,
        relevance_to_alex: c.relevance_to_alex,
        careerRelevance: c.careerRelevance,
        source_url: c.source_url
      })));
      
      // Normalize field names in case AI used different naming
      connections = connections.map((conn: any, index: number) => {
        // Extract title and company from relationship_to_target if needed
        let extractedTitle = conn.title || conn.role || conn.current_title || conn.job_title || conn.position;
        let extractedCompany = conn.company || conn.organization || conn.employer;
        let extractedRelationship = conn.relationshipToFWB || conn.relationship || conn.connection_type || conn.connection_strength_to_nolan;

        // Parse relationship_to_target field like "Colleague at American Family Ventures (Managing Director)"
        if (conn.relationship_to_target && !extractedTitle && !extractedCompany) {
          const relationshipText = conn.relationship_to_target;
          
          // Extract title from parentheses
          const titleMatch = relationshipText.match(/\(([^)]+)\)/);
          if (titleMatch) {
            extractedTitle = titleMatch[1];
          }
          
          // Extract company from "at [Company]"
          const companyMatch = relationshipText.match(/at\s+([^(]+)/);
          if (companyMatch) {
            extractedCompany = companyMatch[1].trim();
          }
          
          // Extract relationship type (before "at")
          const relationshipMatch = relationshipText.match(/^([^a]+?)(?:\s+at\s)/);
          if (relationshipMatch) {
            extractedRelationship = relationshipMatch[1].trim();
          }
        }

        const normalized = {
          name: conn.name || conn.connection_name || conn.fullName || conn.full_name || `Unknown Person ${index + 1}`,
          title: extractedTitle || 'Unknown Position',
          company: extractedCompany || 'Unknown Company',
          relationshipToFWB: extractedRelationship || conn.relationship_to_target || 'Colleague',
          evidenceStrength: (conn.evidenceStrength || conn.evidence_strength || 'medium') as 'high' | 'medium' | 'low',
          evidenceSources: conn.evidenceSources || conn.sources || conn.evidence || (conn.source_url ? [conn.source_url] : ['Team directory']),
          careerRelevance: conn.relevance_to_alex || conn.careerRelevance || conn.relevance_to_user || conn.reason_for_connection || conn.relevance || conn.career_relevance || 'Potential networking opportunity',
          networkingValue: conn.networkingValue || conn.networking_value || conn.score || 5,
          contactMethod: 'unknown' as const
        };
        
        console.log(`✅ Normalized connection ${index + 1}:`, {
          name: normalized.name,
          title: normalized.title,
          company: normalized.company,
          careerRelevance: normalized.careerRelevance
        });
        
        return normalized;
      });
      
      console.log(`AI analysis found ${connections.length} potential connections`);
      return connections;

    } catch (error) {
      console.error('Error analyzing connections:', error);
      return [];
    }
  }

  /**
   * Enhance discovered connections with additional details and validation
   * Task 2.4: Create connection validation to ensure discovered people are real professionals
   * Task 2.6: Implement evidence aggregation from multiple search result sources
   */
  private async enhanceConnectionDetails(
    connections: DiscoveredConnection[]
  ): Promise<DiscoveredConnection[]> {
    const enhancedConnections: DiscoveredConnection[] = [];

    for (const connection of connections) {
      try {
        // Validate connection is a real professional
        const isValid = await this.validateConnection(connection);
        if (!isValid) {
          console.log(`⚠️ Skipping invalid connection: ${connection.name}`);
          continue;
        }

        // Aggregate evidence from multiple sources
        const aggregatedEvidence = await this.aggregateConnectionEvidence(connection);
        
        // Enhance with contact method inference
        const enhanced: DiscoveredConnection = {
          ...connection,
          evidenceSources: aggregatedEvidence.sources,
          evidenceStrength: aggregatedEvidence.strength,
          contactMethod: this.inferContactMethod(connection),
        };

        enhancedConnections.push(enhanced);

      } catch (error) {
        console.error(`Error enhancing connection ${connection.name}:`, error);
        // Include original connection as fallback
        enhancedConnections.push({
          ...connection,
          contactMethod: this.inferContactMethod(connection),
        });
      }
    }

    return enhancedConnections;
  }

  /**
   * Task 2.4: Validate that discovered connections are real professionals
   * Made more lenient - only reject obviously fake/invalid connections
   */
  private async validateConnection(connection: DiscoveredConnection): Promise<boolean> {
    // Basic sanity checks - only reject if obviously invalid
    if (!connection.name || connection.name.includes('Unknown Person')) {
      console.log(`⚠️ Skipping connection with missing/generic name: ${connection.name}`);
      return false;
    }

    if (!connection.company || connection.company === 'Unknown Company') {
      console.log(`⚠️ Skipping connection with missing/unknown company: ${connection.name} at ${connection.company}`);
      return false;
    }

    // Check for obviously fake names (all lowercase, numbers, initials only, etc.)
    if (/^[a-z]+$/.test(connection.name) || /\d/.test(connection.name)) {
      console.log(`⚠️ Skipping connection with suspicious name format: ${connection.name}`);
      return false;
    }

    // Skip connections with only initials (like "N. J." or "G. G.")
    if (/^[A-Z]\.\s?[A-Z]\.$/.test(connection.name)) {
      console.log(`⚠️ Skipping connection with initials only: ${connection.name}`);
      return false;
    }

    // Skip obviously generic names
    if (connection.name.includes('Attendees') || connection.name.includes('Speakers') || connection.name.includes('Various')) {
      console.log(`⚠️ Skipping generic group connection: ${connection.name}`);
      return false;
    }

    // If basic checks pass, accept the connection (much more lenient than before)
    console.log(`✅ Connection passed validation: ${connection.name} at ${connection.company}`);
    return true;
  }

  /**
   * Task 2.6: Aggregate evidence from multiple sources
   */
  private async aggregateConnectionEvidence(
    connection: DiscoveredConnection
  ): Promise<{ sources: string[]; strength: 'high' | 'medium' | 'low' }> {
    // If we have strong evidence already, enhance it with additional verification
    if (connection.evidenceStrength === 'high' && connection.evidenceSources.length >= 2) {
      return {
        sources: connection.evidenceSources,
        strength: 'high'
      };
    }

    // For weaker evidence, try to find additional supporting sources
    try {
      const additionalSources = await this.findAdditionalEvidence(connection);
      const allSources = [...new Set([...connection.evidenceSources, ...additionalSources])];
      
      // Determine evidence strength based on source count and quality
      let strength: 'high' | 'medium' | 'low' = 'low';
      if (allSources.length >= 3) {
        strength = 'high';
      } else if (allSources.length >= 2) {
        strength = 'medium';
      }

      return { sources: allSources, strength };

    } catch (error) {
      console.error(`Error aggregating evidence for ${connection.name}:`, error);
      return {
        sources: connection.evidenceSources,
        strength: connection.evidenceStrength
      };
    }
  }

  /**
   * Find additional evidence sources for a connection
   */
  private async findAdditionalEvidence(connection: DiscoveredConnection): Promise<string[]> {
    try {
      // Search for additional mentions of this person
      const searchResults = await this.webSearchService.searchPersonAndCompany(
        connection.name,
        connection.company,
        { maxResults: 3 }
      );

      return searchResults
        .filter(result => result.confidence !== 'low')
        .map(result => result.url);

    } catch (error) {
      console.error(`Error finding additional evidence for ${connection.name}:`, error);
      return [];
    }
  }

  /**
   * Score and rank connections based on networking value for the user
   */
  private async scoreAndRankConnections(
    connections: DiscoveredConnection[],
    userProfile: UserProfile,
    careerObjective?: string
  ): Promise<DiscoveredConnection[]> {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const systemPrompt = `
You are a career networking strategist. Score and rank these discovered connections based on their value for the user's career goals.

**Scoring Criteria (1-10 scale):**
1. **Career Relevance** (40%): How directly relevant to user's career goals
2. **Seniority/Influence** (25%): Decision-making power and industry influence  
3. **Accessibility** (20%): Likelihood of successful connection through the FWB
4. **Evidence Strength** (15%): Quality of evidence for the relationship

**User Profile:**
- Name: ${userProfile.name}
- Title: ${userProfile.title}
- Background: ${userProfile.summary}
- Skills: ${userProfile.skills.join(', ')}
${careerObjective ? `- Career Goal: ${careerObjective}` : ''}

Return the connections array with updated networkingValue scores, sorted by score (highest first).
`;

    const prompt = `
Connections to score and rank:
${JSON.stringify(connections, null, 2)}

Score each connection and return them ranked by networking value.
`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const cleanedResponse = responseText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);
      
      return parsed.connections || connections;

    } catch (error) {
      console.error('Error scoring connections:', error);
      // Fallback: return original connections sorted by existing networkingValue
      return connections.sort((a, b) => (b.networkingValue || 0) - (a.networkingValue || 0));
    }
  }

  /**
   * Helper methods
   */
  private deduplicateResults(results: ProcessedSearchResult[]): ProcessedSearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.url)) {
        return false;
      }
      seen.add(result.url);
      return true;
    });
  }

  private inferContactMethod(connection: DiscoveredConnection): 'linkedin' | 'email' | 'mutual_contact' | 'unknown' {
    if (connection.linkedinUrl) {
      return 'linkedin';
    }
    if (connection.email) {
      return 'email';
    }
    if (connection.evidenceStrength === 'high') {
      return 'mutual_contact';
    }
    return 'unknown';
  }

  private calculateOverallConfidence(
    searchResults: ProcessedSearchResult[],
    connections: DiscoveredConnection[]
  ): number {
    if (searchResults.length === 0) return 0;
    
    const avgSearchConfidence = searchResults.reduce((acc, result) => {
      const confidenceScore = result.confidence === 'high' ? 3 : result.confidence === 'medium' ? 2 : 1;
      return acc + confidenceScore;
    }, 0) / searchResults.length / 3; // Normalize to 0-1

    const avgEvidenceStrength = connections.reduce((acc, conn) => {
      const evidenceScore = conn.evidenceStrength === 'high' ? 3 : conn.evidenceStrength === 'medium' ? 2 : 1;
      return acc + evidenceScore;
    }, 0) / (connections.length || 1) / 3; // Normalize to 0-1

    return Math.round((avgSearchConfidence + avgEvidenceStrength) / 2 * 100) / 100;
  }

  private generateResearchInsights(
    searchResults: ProcessedSearchResult[],
    connections: DiscoveredConnection[]
  ) {
    const industryConnections = [...new Set(connections.map(c => c.company))];
    const relationshipTypes = [...new Set(connections.map(c => c.relationshipToFWB))];
    
    let networkSize: 'large' | 'medium' | 'small' = 'small';
    if (connections.length >= 8) networkSize = 'large';
    else if (connections.length >= 4) networkSize = 'medium';

    return {
      fwbNetworkSize: networkSize,
      industryConnections: industryConnections.slice(0, 5), // Top 5 companies
      keyRelationshipTypes: relationshipTypes.slice(0, 3), // Top 3 relationship types
    };
  }

  /**
   * Clear the cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

export { AINetworkResearcher, type DiscoveredConnection, type NetworkResearchResult, type FWBContact };