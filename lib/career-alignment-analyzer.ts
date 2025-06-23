import { GoogleGenerativeAI } from '@google/generative-ai';
import { DiscoveredConnection } from './ai-network-researcher';
import { UserProfile } from '@/hooks/useUserProfile';

// Get API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface CareerAlignment {
  overallScore: number; // 1-100
  alignmentFactors: {
    industryMatch: number; // 1-10
    roleRelevance: number; // 1-10
    skillsOverlap: number; // 1-10
    careerStageAlignment: number; // 1-10
    networkingPotential: number; // 1-10
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
    timelineRecommendation: 'immediate' | 'near_term' | 'future';
  };
  confidenceLevel: 'high' | 'medium' | 'low';
}

interface ConnectionWithAlignment extends DiscoveredConnection {
  careerAlignment: CareerAlignment;
}

interface AlignmentAnalysisResult {
  analyzedConnections: ConnectionWithAlignment[];
  portfolioInsights: {
    overallNetworkingStrategy: string;
    priorityTiers: {
      tier1: ConnectionWithAlignment[]; // Immediate priority
      tier2: ConnectionWithAlignment[]; // Medium term
      tier3: ConnectionWithAlignment[]; // Future consideration
    };
    gapAnalysis: string[];
    recommendedFocusAreas: string[];
  };
  careerTrajectoryInsights: {
    currentPositioning: string;
    strengthAreas: string[];
    growthOpportunities: string[];
    networkingGoals: string[];
  };
}

export class CareerAlignmentAnalyzer {
  private cache = new Map<string, { result: AlignmentAnalysisResult; timestamp: number }>();
  private cacheTimeout = 1000 * 60 * 45; // 45 minutes cache

  /**
   * Main method to analyze career alignment for discovered connections
   */
  async analyzeCareerAlignment(
    connections: DiscoveredConnection[],
    userProfile: UserProfile,
    careerObjective?: string,
    options: {
      analysisDepth?: 'quick' | 'standard' | 'comprehensive';
      focusAreas?: string[];
      timeHorizon?: 'short_term' | 'medium_term' | 'long_term' | 'all';
    } = {}
  ): Promise<AlignmentAnalysisResult> {
    const cacheKey = `alignment_${userProfile.name}_${connections.length}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }

    console.log(`🎯 Starting career alignment analysis for ${connections.length} connections`);

    try {
      // Step 1: Analyze individual connection alignments
      const analyzedConnections = await this.analyzeIndividualAlignments(
        connections,
        userProfile,
        careerObjective,
        options.analysisDepth || 'standard'
      );

      // Step 2: Generate portfolio-level insights
      const portfolioInsights = await this.generatePortfolioInsights(
        analyzedConnections,
        userProfile,
        careerObjective,
        options.timeHorizon || 'all'
      );

      // Step 3: Analyze career trajectory and positioning
      const careerTrajectoryInsights = await this.analyzeCareerTrajectory(
        analyzedConnections,
        userProfile,
        careerObjective
      );

      const result: AlignmentAnalysisResult = {
        analyzedConnections,
        portfolioInsights,
        careerTrajectoryInsights,
      };

      // Cache result
      this.cache.set(cacheKey, { result, timestamp: Date.now() });

      console.log(`✅ Career alignment analysis complete: analyzed ${analyzedConnections.length} connections`);
      return result;

    } catch (error) {
      console.error('Error analyzing career alignment:', error);
      return {
        analyzedConnections: connections.map(conn => ({
          ...conn,
          careerAlignment: this.getDefaultAlignment(),
        })),
        portfolioInsights: {
          overallNetworkingStrategy: 'Unable to generate strategy due to analysis error.',
          priorityTiers: { tier1: [], tier2: [], tier3: [] },
          gapAnalysis: [],
          recommendedFocusAreas: [],
        },
        careerTrajectoryInsights: {
          currentPositioning: 'Analysis unavailable',
          strengthAreas: [],
          growthOpportunities: [],
          networkingGoals: [],
        },
      };
    }
  }

  /**
   * Analyze career alignment for individual connections
   */
  async analyzeIndividualAlignments(
    connections: DiscoveredConnection[],
    userProfile: UserProfile,
    careerObjective?: string,
    analysisDepth: 'quick' | 'standard' | 'comprehensive'
  ): Promise<ConnectionWithAlignment[]> {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
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

    const systemPrompt = `
You are an expert career strategist and networking consultant. Analyze each discovered connection for career alignment with the user's profile and goals.

**Analysis Framework:**
1. **Industry Match (1-10)**: How well does their industry align with user's career path?
2. **Role Relevance (1-10)**: How relevant is their role to the user's aspirations?
3. **Skills Overlap (1-10)**: How much skill/expertise overlap exists?
4. **Career Stage Alignment (1-10)**: Are they at the right level to be helpful?
5. **Networking Potential (1-10)**: How likely are they to be valuable long-term?

**Strategic Value Assessment:**
- Short-term benefit: Immediate value this connection could provide
- Long-term benefit: Future career value over 2-5 years
- Key opportunities: Specific doors this person could open
- Potential challenges: Obstacles or limitations to consider

**Actionable Insights:**
- Approach strategy: How to best connect with this person
- Conversation starters: 2-3 specific topics to discuss
- Value proposition: What the user can offer in return
- Timeline: When to prioritize this connection (immediate/near_term/future)

**Analysis Depth: ${analysisDepth}**
${analysisDepth === 'comprehensive' ? '- Provide detailed analysis with specific examples and scenarios' : 
  analysisDepth === 'standard' ? '- Provide balanced analysis with key insights' : 
  '- Provide concise analysis focusing on top-level insights'}

Return a JSON object with "connections" array, where each connection includes ALL original fields (especially careerRelevance) plus a "careerAlignment" object with the analysis.

CRITICAL: You MUST preserve the original careerRelevance field exactly as provided in the input data. Do not modify or shorten it.
`;

    const prompt = `
${userContext}

**Connections to Analyze:**
${JSON.stringify(connections, null, 2)}

Analyze career alignment for each connection based on the user's profile and goals.
`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const cleanedResponse = responseText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);
      
      if (parsed.connections && Array.isArray(parsed.connections)) {
        // Ensure all original fields are preserved, especially careerRelevance
        return parsed.connections.map((analyzedConn: any, index: number) => ({
          ...connections[index], // Start with original connection data
          ...analyzedConn, // Overlay with AI analysis (but preserve originals if AI didn't include them)
          careerRelevance: analyzedConn.careerRelevance || connections[index].careerRelevance, // Explicitly preserve careerRelevance
          careerAlignment: analyzedConn.careerAlignment || this.getDefaultAlignment(),
        }));
      } else {
        return connections.map(conn => ({
          ...conn,
          careerAlignment: this.getDefaultAlignment(),
        }));
      }

    } catch (error) {
      console.error('Error analyzing individual alignments:', error);
      return connections.map(conn => ({
        ...conn,
        careerAlignment: this.getDefaultAlignment(),
      }));
    }
  }

  /**
   * Generate portfolio-level networking insights
   */
  async generatePortfolioInsights(
    connections: ConnectionWithAlignment[],
    userProfile: UserProfile,
    careerObjective?: string,
    timeHorizon: 'short_term' | 'medium_term' | 'long_term' | 'all'
  ) {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const systemPrompt = `
You are a senior career strategist analyzing a portfolio of networking connections for strategic career development.

**Analysis Requirements:**
1. **Overall Networking Strategy**: High-level approach for this connection portfolio
2. **Priority Tiers**: Categorize connections into 3 tiers based on strategic value and timing
   - Tier 1: Immediate priority (next 1-3 months)
   - Tier 2: Medium term (3-12 months)  
   - Tier 3: Future consideration (1+ years)
3. **Gap Analysis**: What types of connections are missing for the user's goals?
4. **Recommended Focus Areas**: Top 3-5 areas the user should prioritize

**Time Horizon Focus: ${timeHorizon}**

**Categorization Criteria:**
- Tier 1: High alignment + immediate impact + accessible
- Tier 2: Good alignment + medium-term value + moderately accessible
- Tier 3: Lower alignment OR long-term value OR harder to access

Return JSON with overallNetworkingStrategy, priorityTiers (with arrays of connection names/companies), gapAnalysis array, and recommendedFocusAreas array.
`;

    const connectionsOverview = connections.map(conn => ({
      name: conn.name,
      company: conn.company,
      title: conn.title,
      overallScore: conn.careerAlignment.overallScore,
      alignmentFactors: conn.careerAlignment.alignmentFactors,
      timelineRecommendation: conn.careerAlignment.actionableInsights.timelineRecommendation,
    }));

    const prompt = `
**User Profile:**
- Name: ${userProfile.name}
- Title: ${userProfile.title}
- Background: ${userProfile.summary}
- Skills: ${userProfile.skills.join(', ')}
${careerObjective ? `- Career Goal: ${careerObjective}` : ''}

**Connection Portfolio Overview:**
${JSON.stringify(connectionsOverview, null, 2)}

Generate portfolio-level networking insights and strategic recommendations.
`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const cleanedResponse = responseText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);

      // Map connection names back to full connection objects
      const tier1 = this.mapNamesToConnections(parsed.priorityTiers?.tier1 || [], connections);
      const tier2 = this.mapNamesToConnections(parsed.priorityTiers?.tier2 || [], connections);
      const tier3 = this.mapNamesToConnections(parsed.priorityTiers?.tier3 || [], connections);

      return {
        overallNetworkingStrategy: parsed.overallNetworkingStrategy || 'Focus on building strategic relationships',
        priorityTiers: { tier1, tier2, tier3 },
        gapAnalysis: parsed.gapAnalysis || [],
        recommendedFocusAreas: parsed.recommendedFocusAreas || [],
      };

    } catch (error) {
      console.error('Error generating portfolio insights:', error);
      return {
        overallNetworkingStrategy: 'Focus on highest-scoring connections first',
        priorityTiers: {
          tier1: connections.filter(c => c.careerAlignment.overallScore >= 80),
          tier2: connections.filter(c => c.careerAlignment.overallScore >= 60 && c.careerAlignment.overallScore < 80),
          tier3: connections.filter(c => c.careerAlignment.overallScore < 60),
        },
        gapAnalysis: [],
        recommendedFocusAreas: [],
      };
    }
  }

  /**
   * Analyze career trajectory and positioning
   */
  private async analyzeCareerTrajectory(
    connections: ConnectionWithAlignment[],
    userProfile: UserProfile,
    careerObjective?: string
  ) {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const systemPrompt = `
You are a senior career advisor analyzing how a portfolio of networking connections can accelerate career growth.

**Analysis Requirements:**
1. **Current Positioning**: How is the user positioned in their career based on their profile?
2. **Strength Areas**: What are the user's key professional strengths based on their background?
3. **Growth Opportunities**: What areas should the user focus on developing?
4. **Networking Goals**: What should the user aim to achieve through these connections?

**Consider:**
- User's current level and experience
- Market positioning and competitive landscape
- Skills gaps and development needs
- Strategic career moves enabled by these connections

Return JSON with currentPositioning (string), strengthAreas (array), growthOpportunities (array), and networkingGoals (array).
`;

    const connectionsContext = connections.map(conn => ({
      name: conn.name,
      company: conn.company,
      title: conn.title,
      careerRelevance: conn.careerRelevance,
      strategicValue: conn.careerAlignment.strategicValue,
    }));

    const prompt = `
**User Profile:**
- Name: ${userProfile.name}
- Title: ${userProfile.title}
- Background: ${userProfile.summary}
- Skills: ${userProfile.skills.join(', ')}
${careerObjective ? `- Career Goal: ${careerObjective}` : ''}

**Available Connections:**
${JSON.stringify(connectionsContext, null, 2)}

Analyze the user's career trajectory and how these connections can accelerate their growth.
`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const cleanedResponse = responseText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);

      return {
        currentPositioning: parsed.currentPositioning || 'Professional seeking career advancement',
        strengthAreas: parsed.strengthAreas || [],
        growthOpportunities: parsed.growthOpportunities || [],
        networkingGoals: parsed.networkingGoals || [],
      };

    } catch (error) {
      console.error('Error analyzing career trajectory:', error);
      return {
        currentPositioning: 'Analysis unavailable',
        strengthAreas: userProfile.skills.slice(0, 3),
        growthOpportunities: ['Expand professional network', 'Develop industry expertise'],
        networkingGoals: ['Build strategic relationships', 'Access new opportunities'],
      };
    }
  }

  /**
   * Helper methods
   */
  private getDefaultAlignment(): CareerAlignment {
    return {
      overallScore: 50,
      alignmentFactors: {
        industryMatch: 5,
        roleRelevance: 5,
        skillsOverlap: 5,
        careerStageAlignment: 5,
        networkingPotential: 5,
      },
      strategicValue: {
        shortTermBenefit: 'Potential networking opportunity',
        longTermBenefit: 'May provide future career value',
        keyOpportunities: ['Expand professional network'],
        potentialChallenges: ['Unknown relationship strength'],
      },
      actionableInsights: {
        approachStrategy: 'Standard professional introduction',
        conversationStarters: ['Discuss industry trends', 'Share professional experiences'],
        valueProposition: 'Mutual professional networking',
        timelineRecommendation: 'near_term',
      },
      confidenceLevel: 'medium',
    };
  }

  private mapNamesToConnections(
    names: string[], 
    connections: ConnectionWithAlignment[]
  ): ConnectionWithAlignment[] {
    return names.map(name => {
      const found = connections.find(conn => 
        conn.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(conn.name.toLowerCase())
      );
      return found || connections[0]; // Fallback to first connection if not found
    }).filter(Boolean);
  }

  /**
   * Generate targeted alignment report for a specific connection
   */
  async generateTargetedAlignmentReport(
    connection: DiscoveredConnection,
    userProfile: UserProfile,
    careerObjective?: string
  ): Promise<CareerAlignment> {
    const analyzed = await this.analyzeIndividualAlignments(
      [connection],
      userProfile,
      careerObjective,
      'comprehensive'
    );

    return analyzed[0]?.careerAlignment || this.getDefaultAlignment();
  }

  /**
   * Task 3.8: Generate introduction request and follow-up templates
   */
  async generateIntroductionTemplates(
    connection: DiscoveredConnection,
    fwbContact: { name: string; company: string },
    userProfile: UserProfile,
    careerObjective?: string
  ): Promise<{
    introductionRequest: string;
    followUpMessage: string;
    linkedInMessage: string;
    emailSubject: string;
  }> {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const systemPrompt = `
You are an expert networking coach specializing in professional introductions and relationship building.

Generate personalized templates for connecting with this discovered professional:

**Template Requirements:**
1. **Introduction Request**: Message to send to the FWB asking for an introduction
2. **Follow-up Message**: Message to send after getting connected
3. **LinkedIn Message**: Direct LinkedIn connection request (if needed)
4. **Email Subject**: Professional subject line for email outreach

**Tone Guidelines:**
- Professional but warm and authentic
- Specific and value-focused (not generic)
- Respectful of everyone's time
- Clear about the mutual benefit

**Personalization Elements:**
- Reference specific background/skills alignment
- Mention concrete value the user can provide
- Include relevant career goals context
- Reference the FWB connection appropriately

Return JSON with introductionRequest, followUpMessage, linkedInMessage, and emailSubject fields.
`;

    const prompt = `
**User Profile:**
- Name: ${userProfile.name}
- Title: ${userProfile.title}
- Background: ${userProfile.summary}
- Skills: ${userProfile.skills.join(', ')}
${careerObjective ? `- Career Goal: ${careerObjective}` : ''}

**Target Connection:**
- Name: ${connection.name}
- Title: ${connection.title}
- Company: ${connection.company}
- Relationship to FWB: ${connection.relationshipToFWB}
- Career Relevance: ${connection.careerRelevance}

**FWB (Mutual Contact):**
- Name: ${fwbContact.name}
- Company: ${fwbContact.company}

Generate personalized introduction templates for this networking scenario.
`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const cleanedResponse = responseText.replace(/```json|```/g, '').trim();
      const templates = JSON.parse(cleanedResponse);
      
      return {
        introductionRequest: templates.introductionRequest || this.getDefaultIntroRequest(connection, fwbContact, userProfile),
        followUpMessage: templates.followUpMessage || this.getDefaultFollowUp(connection, userProfile),
        linkedInMessage: templates.linkedInMessage || this.getDefaultLinkedInMessage(connection, userProfile),
        emailSubject: templates.emailSubject || `Introduction to ${connection.name}`,
      };

    } catch (error) {
      console.error('Error generating introduction templates:', error);
      return {
        introductionRequest: this.getDefaultIntroRequest(connection, fwbContact, userProfile),
        followUpMessage: this.getDefaultFollowUp(connection, userProfile),
        linkedInMessage: this.getDefaultLinkedInMessage(connection, userProfile),
        emailSubject: `Introduction to ${connection.name}`,
      };
    }
  }

  /**
   * Task 3.3 & 3.4: Enhanced opportunity identification and personalized explanations
   */
  async generateDetailedOpportunityAnalysis(
    connections: DiscoveredConnection[],
    userProfile: UserProfile,
    careerObjective?: string
  ): Promise<{
    specificOpportunities: Array<{
      connectionName: string;
      opportunityType: 'mentorship' | 'collaboration' | 'job_opportunity' | 'industry_insight' | 'skill_development';
      description: string;
      actionSteps: string[];
      timeframe: string;
      successMetrics: string[];
    }>;
    strategicInsights: {
      portfolioStrengths: string[];
      marketPositioning: string;
      competitiveAdvantages: string[];
      developmentAreas: string[];
    };
  }> {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const systemPrompt = `
You are a senior career strategist analyzing networking opportunities for strategic career development.

**Analysis Framework:**
1. **Specific Opportunities**: Identify concrete, actionable opportunities with each connection
2. **Strategic Insights**: Provide portfolio-level analysis of the user's positioning

**Opportunity Types:**
- Mentorship: Learning and guidance opportunities
- Collaboration: Project or initiative partnerships
- Job Opportunity: Direct or referral-based career moves
- Industry Insight: Market intelligence and trend analysis
- Skill Development: Learning and capability building

For each opportunity, provide:
- Clear description of the opportunity
- Specific action steps to pursue it
- Realistic timeframe for engagement
- Success metrics to track progress

Return JSON with specificOpportunities array and strategicInsights object.
`;

    const prompt = `
**User Profile:**
- Name: ${userProfile.name}
- Title: ${userProfile.title}
- Background: ${userProfile.summary}
- Skills: ${userProfile.skills.join(', ')}
${careerObjective ? `- Career Goal: ${careerObjective}` : ''}

**Discovered Connections:**
${connections.map(conn => `
- ${conn.name} (${conn.title} at ${conn.company})
  Career Relevance: ${conn.careerRelevance}
  Relationship Evidence: ${conn.relationshipToFWB}
`).join('\n')}

Analyze specific opportunities and strategic insights for this networking portfolio.
`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const cleanedResponse = responseText.replace(/```json|```/g, '').trim();
      const analysis = JSON.parse(cleanedResponse);
      
      return analysis;

    } catch (error) {
      console.error('Error generating detailed opportunity analysis:', error);
      return {
        specificOpportunities: [],
        strategicInsights: {
          portfolioStrengths: [],
          marketPositioning: 'Analysis unavailable',
          competitiveAdvantages: [],
          developmentAreas: [],
        },
      };
    }
  }

  /**
   * Default template fallbacks
   */
  private getDefaultIntroRequest(
    connection: DiscoveredConnection,
    fwbContact: { name: string; company: string },
    userProfile: UserProfile
  ): string {
    return `Hi ${fwbContact.name},

I hope you're doing well! I've been following your work at ${fwbContact.company} and came across ${connection.name} in my research. Given their role as ${connection.title} at ${connection.company}, I think there could be great mutual value in connecting.

As ${userProfile.title}, I'm particularly interested in ${connection.careerRelevance.toLowerCase()}. Would you be comfortable making an introduction?

I'd be happy to share more context about my background and how I might be helpful to ${connection.name} as well.

Best regards,
${userProfile.name}`;
  }

  private getDefaultFollowUp(connection: DiscoveredConnection, userProfile: UserProfile): string {
    return `Hi ${connection.name},

Thank you for connecting! I'm ${userProfile.title} and was introduced by our mutual connection. I'm particularly interested in your experience with ${connection.careerRelevance.toLowerCase()}.

I'd love to learn more about your work at ${connection.company} and share some of my own experiences that might be relevant to your current initiatives.

Would you be open to a brief coffee chat or call in the coming weeks?

Best regards,
${userProfile.name}`;
  }

  private getDefaultLinkedInMessage(connection: DiscoveredConnection, userProfile: UserProfile): string {
    return `Hi ${connection.name}, I'm ${userProfile.title} and came across your profile through our shared connection. Your experience at ${connection.company} really caught my attention, particularly your work in ${connection.title.toLowerCase()}. I'd love to connect and potentially exchange insights about the industry. Looking forward to connecting!`;
  }

  /**
   * Clear the cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

export { 
  CareerAlignmentAnalyzer, 
  type CareerAlignment, 
  type ConnectionWithAlignment, 
  type AlignmentAnalysisResult 
};