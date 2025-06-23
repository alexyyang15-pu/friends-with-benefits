import { POST } from './route';
import { NextRequest } from 'next/server';
import { AINetworkResearcher } from '@/lib/ai-network-researcher';
import { CareerAlignmentAnalyzer } from '@/lib/career-alignment-analyzer';

// Mock the dependencies
jest.mock('@/lib/ai-network-researcher');
jest.mock('@/lib/career-alignment-analyzer');

describe('/api/discover-fwb-network', () => {
  let mockAINetworkResearcher: jest.Mocked<AINetworkResearcher>;
  let mockCareerAlignmentAnalyzer: jest.Mocked<CareerAlignmentAnalyzer>;

  const mockFWBContact = {
    name: 'John Smith',
    company: 'TechCorp',
    position: 'VP of Engineering',
    linkedinUrl: 'https://linkedin.com/in/johnsmith'
  };

  const mockUserProfile = {
    name: 'Jane Doe',
    title: 'Product Manager',
    summary: 'Experienced product manager',
    skills: ['Product Strategy', 'User Research'],
    experience: [
      {
        title: 'Senior Product Manager',
        company: 'StartupCo',
        duration: '2 years'
      }
    ]
  };

  const mockNetworkDiscovery = {
    discoveredConnections: [
      {
        name: 'Alice Johnson',
        title: 'Head of Product',
        company: 'InnovateCorp',
        relationshipToFWB: 'Former colleague',
        evidenceStrength: 'high' as const,
        evidenceSources: ['Company announcement', 'LinkedIn posts'],
        careerRelevance: 'High relevance to product management career',
        networkingValue: 9,
        contactMethod: 'linkedin' as const
      }
    ],
    searchSummary: {
      totalSearches: 5,
      sourcesAnalyzed: 12,
      confidenceScore: 85
    },
    researchInsights: {
      fwbNetworkSize: 'large' as const,
      industryConnections: ['Technology', 'Product Management'],
      keyRelationshipTypes: ['Former colleagues', 'Industry peers']
    }
  };

  const mockAlignmentResults = [
    {
      connection: mockNetworkDiscovery.discoveredConnections[0],
      careerAlignment: {
        overallScore: 92,
        alignmentFactors: {
          industryMatch: 9,
          roleRelevance: 10,
          skillsOverlap: 8,
          careerStageAlignment: 9,
          networkingPotential: 9
        },
        strategicValue: {
          shortTermBenefit: 'Product management insights',
          longTermBenefit: 'Potential career mentorship',
          keyOpportunities: ['Learning about product strategy'],
          potentialChallenges: ['May be very busy']
        },
        actionableInsights: {
          approachStrategy: 'Professional connection request',
          conversationStarters: ['Discuss product management trends'],
          valueProposition: 'Share startup experiences',
          timeline: 'Reach out within 1-2 weeks',
          introductionTemplates: {
            direct: 'Hi Alice, I came across your profile...',
            warm: 'Hi Alice, John mentioned you might be interested...'
          }
        }
      }
    }
  ];

  const mockPortfolioInsights = {
    overallNetworkingStrategy: 'Focus on senior product leaders',
    topRecommendations: ['Connect with Alice Johnson'],
    careerAcceleration: {
      immediatePriorities: ['Product strategy learning'],
      mediumTermGoals: ['Build product leadership network'],
      longTermVision: 'Become VP of Product'
    },
    industryAlignment: 'Strong match with tech product management',
    analysisMetadata: {
      processingTime: 2000,
      connectionsAnalyzed: 1
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks for each test
    mockAINetworkResearcher = {
      discoverFWBNetwork: jest.fn().mockResolvedValue(mockNetworkDiscovery)
    } as any;

    mockCareerAlignmentAnalyzer = {
      analyzeIndividualAlignments: jest.fn().mockResolvedValue(mockAlignmentResults),
      generatePortfolioInsights: jest.fn().mockResolvedValue(mockPortfolioInsights)
    } as any;

    // Mock the constructors to return our mocked instances
    (AINetworkResearcher as jest.MockedClass<typeof AINetworkResearcher>).mockImplementation(() => mockAINetworkResearcher);
    (CareerAlignmentAnalyzer as jest.MockedClass<typeof CareerAlignmentAnalyzer>).mockImplementation(() => mockCareerAlignmentAnalyzer);
  });

  describe('Input Validation', () => {
    it('should return 400 for missing fwbContact', async () => {
      const request = new NextRequest('http://localhost/api/discover-fwb-network', {
        method: 'POST',
        body: JSON.stringify({
          userProfile: mockUserProfile,
          careerObjective: 'Become a VP of Product'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.details).toContain('fwbContact is required and must be an object');
    });

    it('should return 400 for invalid fwbContact fields', async () => {
      const request = new NextRequest('http://localhost/api/discover-fwb-network', {
        method: 'POST',
        body: JSON.stringify({
          fwbContact: { name: '', company: 'TechCorp' }, // missing position, empty name
          userProfile: mockUserProfile
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details).toContain('fwbContact.name is required and must be a string');
      expect(data.details).toContain('fwbContact.position is required and must be a string');
    });

    it('should return 400 for missing userProfile', async () => {
      const request = new NextRequest('http://localhost/api/discover-fwb-network', {
        method: 'POST',
        body: JSON.stringify({
          fwbContact: mockFWBContact
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details).toContain('userProfile is required and must be an object');
    });

    it('should return 400 for invalid searchDepth', async () => {
      const request = new NextRequest('http://localhost/api/discover-fwb-network', {
        method: 'POST',
        body: JSON.stringify({
          fwbContact: mockFWBContact,
          userProfile: mockUserProfile,
          searchDepth: 'invalid'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details).toContain('searchDepth must be one of: shallow, medium, deep');
    });

    it('should accept valid input with all optional fields', async () => {
      const request = new NextRequest('http://localhost/api/discover-fwb-network', {
        method: 'POST',
        body: JSON.stringify({
          fwbContact: mockFWBContact,
          userProfile: mockUserProfile,
          careerObjective: 'Become a VP of Product',
          searchDepth: 'deep'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Successful Discovery Flow', () => {
    it('should complete full discovery flow with connections found', async () => {
      const request = new NextRequest('http://localhost/api/discover-fwb-network', {
        method: 'POST',
        body: JSON.stringify({
          fwbContact: mockFWBContact,
          userProfile: mockUserProfile,
          careerObjective: 'Become a VP of Product',
          searchDepth: 'medium'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.discoveredConnections).toHaveLength(1);
      expect(data.discoveredConnections[0]).toEqual(
        expect.objectContaining({
          name: 'Alice Johnson',
          careerAlignment: expect.objectContaining({
            overallScore: 92
          }),
          networkingPriority: 92,
          introductionTemplates: expect.objectContaining({
            direct: expect.stringContaining('Hi Alice')
          })
        })
      );
      expect(data.searchSummary).toBeDefined();
      expect(data.researchInsights).toBeDefined();
      expect(data.careerAlignmentSummary).toBeDefined();
      expect(data.processingTime).toBeGreaterThan(0);
      expect(data.requestId).toMatch(/^fwb-discovery-/);
      expect(data.cached).toBe(false);
    });

    it('should return early when no connections are discovered', async () => {
      mockAINetworkResearcher.discoverFWBNetwork.mockResolvedValue({
        discoveredConnections: [],
        searchSummary: { totalSearches: 3, sourcesAnalyzed: 5, confidenceScore: 30 },
        researchInsights: {
          fwbNetworkSize: 'small',
          industryConnections: [],
          keyRelationshipTypes: []
        }
      });

      const request = new NextRequest('http://localhost/api/discover-fwb-network', {
        method: 'POST',
        body: JSON.stringify({
          fwbContact: mockFWBContact,
          userProfile: mockUserProfile
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.discoveredConnections).toHaveLength(0);
      expect(data.code).toBe('NO_CONNECTIONS_FOUND');
      expect(data.careerAlignmentSummary).toBeNull();
      
      // Should not call career alignment analyzer
      expect(mockCareerAlignmentAnalyzer.analyzeIndividualAlignments).not.toHaveBeenCalled();
      expect(mockCareerAlignmentAnalyzer.generatePortfolioInsights).not.toHaveBeenCalled();
    });

    it('should call all services with correct parameters', async () => {
      const request = new NextRequest('http://localhost/api/discover-fwb-network', {
        method: 'POST',
        body: JSON.stringify({
          fwbContact: mockFWBContact,
          userProfile: mockUserProfile,
          careerObjective: 'Test objective',
          searchDepth: 'deep'
        })
      });

      await POST(request);

      expect(mockAINetworkResearcher.discoverFWBNetwork).toHaveBeenCalledWith(
        mockFWBContact,
        mockUserProfile,
        'Test objective',
        'deep'
      );

      expect(mockCareerAlignmentAnalyzer.analyzeIndividualAlignments).toHaveBeenCalledWith(
        mockNetworkDiscovery.discoveredConnections,
        mockUserProfile,
        'Test objective',
        'comprehensive'
      );

      expect(mockCareerAlignmentAnalyzer.generatePortfolioInsights).toHaveBeenCalledWith(
        mockAlignmentResults,
        mockUserProfile,
        'Test objective'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle API key errors', async () => {
      mockAINetworkResearcher.discoverFWBNetwork.mockRejectedValue(
        new Error('API key is invalid')
      );

      const request = new NextRequest('http://localhost/api/discover-fwb-network', {
        method: 'POST',
        body: JSON.stringify({
          fwbContact: mockFWBContact,
          userProfile: mockUserProfile
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('API_KEY_ERROR');
      expect(data.error).toBe('AI service configuration error');
    });

    it('should handle rate limit errors', async () => {
      mockAINetworkResearcher.discoverFWBNetwork.mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      const request = new NextRequest('http://localhost/api/discover-fwb-network', {
        method: 'POST',
        body: JSON.stringify({
          fwbContact: mockFWBContact,
          userProfile: mockUserProfile
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.code).toBe('RATE_LIMIT_ERROR');
      expect(data.error).toBe('AI service rate limit exceeded');
    });

    it('should handle timeout errors', async () => {
      mockAINetworkResearcher.discoverFWBNetwork.mockRejectedValue(
        new Error('Request timeout')
      );

      const request = new NextRequest('http://localhost/api/discover-fwb-network', {
        method: 'POST',
        body: JSON.stringify({
          fwbContact: mockFWBContact,
          userProfile: mockUserProfile
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(504);
      expect(data.code).toBe('TIMEOUT_ERROR');
      expect(data.details).toContain('shallow search depth');
    });

    it('should handle generic errors', async () => {
      mockAINetworkResearcher.discoverFWBNetwork.mockRejectedValue(
        new Error('Something unexpected happened')
      );

      const request = new NextRequest('http://localhost/api/discover-fwb-network', {
        method: 'POST',
        body: JSON.stringify({
          fwbContact: mockFWBContact,
          userProfile: mockUserProfile
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('INTERNAL_ERROR');
      expect(data.error).toBe('Internal server error during FWB network discovery');
    });
  });

  describe('Caching', () => {
    it('should return cached results for identical requests', async () => {
      const requestBody = {
        fwbContact: mockFWBContact,
        userProfile: mockUserProfile,
        careerObjective: 'Test objective',
        searchDepth: 'medium'
      };

      const request1 = new NextRequest('http://localhost/api/discover-fwb-network', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const request2 = new NextRequest('http://localhost/api/discover-fwb-network', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      // First request - should call services
      const response1 = await POST(request1);
      const data1 = await response1.json();
      expect(data1.cached).toBe(false);

      // Second request - should return cached result
      const response2 = await POST(request2);
      const data2 = await response2.json();
      expect(data2.cached).toBe(true);

      // AI services should only be called once
      expect(mockAINetworkResearcher.discoverFWBNetwork).toHaveBeenCalledTimes(1);
      expect(mockCareerAlignmentAnalyzer.analyzeIndividualAlignments).toHaveBeenCalledTimes(1);
    });

    it('should not cache results for different requests', async () => {
      const request1 = new NextRequest('http://localhost/api/discover-fwb-network', {
        method: 'POST',
        body: JSON.stringify({
          fwbContact: mockFWBContact,
          userProfile: mockUserProfile,
          searchDepth: 'shallow'
        })
      });

      const request2 = new NextRequest('http://localhost/api/discover-fwb-network', {
        method: 'POST',
        body: JSON.stringify({
          fwbContact: mockFWBContact,
          userProfile: mockUserProfile,
          searchDepth: 'deep' // Different search depth
        })
      });

      await POST(request1);
      await POST(request2);

      // AI services should be called twice for different requests
      expect(mockAINetworkResearcher.discoverFWBNetwork).toHaveBeenCalledTimes(2);
    });
  });

  describe('Response Format', () => {
    it('should format response correctly with all required fields', async () => {
      const request = new NextRequest('http://localhost/api/discover-fwb-network', {
        method: 'POST',
        body: JSON.stringify({
          fwbContact: mockFWBContact,
          userProfile: mockUserProfile
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toEqual(
        expect.objectContaining({
          discoveredConnections: expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String),
              careerAlignment: expect.objectContaining({
                overallScore: expect.any(Number),
                alignmentFactors: expect.any(Object),
                strategicValue: expect.any(Object),
                actionableInsights: expect.any(Object)
              }),
              networkingPriority: expect.any(Number),
              introductionTemplates: expect.any(Object)
            })
          ]),
          searchSummary: expect.objectContaining({
            totalSearches: expect.any(Number),
            sourcesAnalyzed: expect.any(Number),
            confidenceScore: expect.any(Number)
          }),
          researchInsights: expect.any(Object),
          careerAlignmentSummary: expect.any(Object),
          processingTime: expect.any(Number),
          requestId: expect.stringMatching(/^fwb-discovery-/),
          cached: expect.any(Boolean),
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
        })
      );
    });
  });
}); 