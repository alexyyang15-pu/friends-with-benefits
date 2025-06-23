import { AINetworkResearcher, FWBContact, DiscoveredConnection, NetworkResearchResult } from './ai-network-researcher';
import { WebSearchService } from './web-search-service';
import { UserProfile } from '@/hooks/useUserProfile';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock dependencies
jest.mock('./web-search-service');
jest.mock('@google/generative-ai');

describe('AINetworkResearcher', () => {
  let aiNetworkResearcher: AINetworkResearcher;
  let mockWebSearchService: jest.Mocked<WebSearchService>;
  let mockGenAI: jest.Mocked<GoogleGenerativeAI>;
  let mockModel: any;

  const mockFWBContact: FWBContact = {
    name: 'John Smith',
    company: 'TechCorp',
    position: 'VP of Engineering',
    linkedinUrl: 'https://linkedin.com/in/johnsmith'
  };

  const mockUserProfile: UserProfile = {
    name: 'Jane Doe',
    title: 'Product Manager',
    summary: 'Experienced product manager with 5 years in fintech',
    skills: ['Product Strategy', 'User Research', 'Data Analysis', 'Agile Development']
  };

  const mockDiscoveredConnection: DiscoveredConnection = {
    name: 'Alice Johnson',
    title: 'Senior Engineer',
    company: 'TechCorp',
    relationshipToFWB: 'Direct colleague - works in same engineering team',
    evidenceStrength: 'high',
    evidenceSources: ['https://techcorp.com/team', 'https://news.tech.com/techcorp-team'],
    careerRelevance: 'Senior engineer with product development experience relevant to user\'s PM goals',
    networkingValue: 8,
    contactMethod: 'mutual_contact'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock WebSearchService
    mockWebSearchService = {
      searchPersonAndCompany: jest.fn(),
      searchNews: jest.fn(),
      searchPressReleases: jest.fn(),
      searchCompanyTeam: jest.fn(),
      searchProfessionalEvents: jest.fn(),
      clearCache: jest.fn()
    } as any;

    (WebSearchService as jest.MockedClass<typeof WebSearchService>).mockImplementation(() => mockWebSearchService);

    // Mock GoogleGenerativeAI
    mockModel = {
      generateContent: jest.fn()
    };

    mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    } as any;

    (GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>).mockImplementation(() => mockGenAI);

    aiNetworkResearcher = new AINetworkResearcher();
  });

  describe('discoverFWBNetwork', () => {
    it('should successfully discover connections with valid inputs', async () => {
      // Mock search results
      mockWebSearchService.searchPersonAndCompany.mockResolvedValue([
        {
          title: 'TechCorp Engineering Team',
          url: 'https://techcorp.com/team',
          snippet: 'John Smith leads a team including Alice Johnson...',
          domain: 'techcorp.com',
          contentType: 'company_page',
          confidence: 'high'
        }
      ]);

      mockWebSearchService.searchNews.mockResolvedValue([]);
      mockWebSearchService.searchPressReleases.mockResolvedValue([]);
      mockWebSearchService.searchCompanyTeam.mockResolvedValue([]);
      mockWebSearchService.searchProfessionalEvents.mockResolvedValue([]);

      // Mock AI analysis response
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            connections: [mockDiscoveredConnection]
          })
        }
      });

      const result = await aiNetworkResearcher.discoverFWBNetwork(
        mockFWBContact,
        mockUserProfile,
        'Advance to senior product management roles'
      );

      expect(result.discoveredConnections).toHaveLength(1);
      expect(result.discoveredConnections[0]).toMatchObject({
        name: 'Alice Johnson',
        title: 'Senior Engineer',
        company: 'TechCorp'
      });
      expect(result.searchSummary.totalSearches).toBeGreaterThan(0);
      expect(result.researchInsights.fwbNetworkSize).toBeDefined();
    });

    it('should handle different search depths', async () => {
      mockWebSearchService.searchPersonAndCompany.mockResolvedValue([]);
      mockWebSearchService.searchNews.mockResolvedValue([]);
      mockWebSearchService.searchPressReleases.mockResolvedValue([]);
      mockWebSearchService.searchCompanyTeam.mockResolvedValue([]);
      mockWebSearchService.searchProfessionalEvents.mockResolvedValue([]);

      mockModel.generateContent.mockResolvedValue({
        response: { text: () => JSON.stringify({ connections: [] }) }
      });

      // Test shallow search
      await aiNetworkResearcher.discoverFWBNetwork(
        mockFWBContact,
        mockUserProfile,
        undefined,
        { searchDepth: 'shallow', maxConnections: 5 }
      );

      // Verify fewer search calls for shallow depth
      expect(mockWebSearchService.searchPersonAndCompany).toHaveBeenCalledWith(
        'John Smith',
        'TechCorp',
        { maxResults: 5 }
      );

      // Test deep search
      await aiNetworkResearcher.discoverFWBNetwork(
        mockFWBContact,
        mockUserProfile,
        undefined,
        { searchDepth: 'deep', maxConnections: 10 }
      );

      // Verify more comprehensive search calls for deep search
      expect(mockWebSearchService.searchPersonAndCompany).toHaveBeenCalledWith(
        'John Smith',
        'TechCorp',
        { maxResults: 15 }
      );
    });

    it('should use caching for repeated requests', async () => {
      mockWebSearchService.searchPersonAndCompany.mockResolvedValue([]);
      mockWebSearchService.searchNews.mockResolvedValue([]);
      mockWebSearchService.searchPressReleases.mockResolvedValue([]);
      mockWebSearchService.searchCompanyTeam.mockResolvedValue([]);
      mockWebSearchService.searchProfessionalEvents.mockResolvedValue([]);

      mockModel.generateContent.mockResolvedValue({
        response: { text: () => JSON.stringify({ connections: [] }) }
      });

      // First call
      const firstResult = await aiNetworkResearcher.discoverFWBNetwork(mockFWBContact, mockUserProfile);
      
      // Second call with same parameters (should use cache)
      const secondResult = await aiNetworkResearcher.discoverFWBNetwork(mockFWBContact, mockUserProfile);

      expect(firstResult).toEqual(secondResult);
      expect(mockWebSearchService.searchPersonAndCompany).toHaveBeenCalledTimes(1);
    });
  });

  describe('connection validation', () => {
    it('should validate real professional connections', async () => {
      // Mock validation response for real connection
      mockModel.generateContent
        .mockResolvedValueOnce({
          response: { text: () => JSON.stringify({ connections: [mockDiscoveredConnection] }) }
        })
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              isValid: true,
              confidence: 8,
              concerns: [],
              reasoning: 'Well-documented professional with clear role and evidence'
            })
          }
        })
        .mockResolvedValueOnce({
          response: { text: () => JSON.stringify({ connections: [mockDiscoveredConnection] }) }
        });

      mockWebSearchService.searchPersonAndCompany.mockResolvedValue([
        {
          title: 'Alice Johnson - Senior Engineer at TechCorp',
          url: 'https://techcorp.com/team/alice',
          snippet: 'Alice Johnson is a senior engineer...',
          domain: 'techcorp.com',
          contentType: 'company_page',
          confidence: 'high'
        }
      ]);

      mockWebSearchService.searchNews.mockResolvedValue([]);
      mockWebSearchService.searchPressReleases.mockResolvedValue([]);
      mockWebSearchService.searchCompanyTeam.mockResolvedValue([]);
      mockWebSearchService.searchProfessionalEvents.mockResolvedValue([]);

      const result = await aiNetworkResearcher.discoverFWBNetwork(mockFWBContact, mockUserProfile);

      expect(result.discoveredConnections).toHaveLength(1);
      expect(result.discoveredConnections[0].name).toBe('Alice Johnson');
    });

    it('should filter out invalid connections', async () => {
      const invalidConnection = {
        ...mockDiscoveredConnection,
        name: 'Generic Person',
        title: 'Employee',
        company: 'Company'
      };

      // Mock validation response for invalid connection
      mockModel.generateContent
        .mockResolvedValueOnce({
          response: { text: () => JSON.stringify({ connections: [invalidConnection] }) }
        })
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              isValid: false,
              confidence: 3,
              concerns: ['Generic name', 'Vague title'],
              reasoning: 'Appears to be generic placeholder rather than real person'
            })
          }
        })
        .mockResolvedValueOnce({
          response: { text: () => JSON.stringify({ connections: [] }) }
        });

      mockWebSearchService.searchPersonAndCompany.mockResolvedValue([]);
      mockWebSearchService.searchNews.mockResolvedValue([]);
      mockWebSearchService.searchPressReleases.mockResolvedValue([]);
      mockWebSearchService.searchCompanyTeam.mockResolvedValue([]);
      mockWebSearchService.searchProfessionalEvents.mockResolvedValue([]);

      const result = await aiNetworkResearcher.discoverFWBNetwork(mockFWBContact, mockUserProfile);

      // Should filter out the invalid connection
      expect(result.discoveredConnections).toHaveLength(0);
    });
  });

  describe('evidence aggregation', () => {
    it('should aggregate evidence from multiple sources', async () => {
      const connectionWithWeakEvidence = {
        ...mockDiscoveredConnection,
        evidenceStrength: 'low' as const,
        evidenceSources: ['https://single-source.com']
      };

      // Mock additional evidence search
      mockWebSearchService.searchPersonAndCompany
        .mockResolvedValueOnce([]) // Initial search
        .mockResolvedValueOnce([ // Additional evidence search
          {
            title: 'Alice Johnson Professional Profile',
            url: 'https://linkedin.com/in/alicejohnson',
            snippet: 'Software engineer at TechCorp',
            domain: 'linkedin.com',
            contentType: 'profile',
            confidence: 'high'
          }
        ]);

      mockWebSearchService.searchNews.mockResolvedValue([]);
      mockWebSearchService.searchPressReleases.mockResolvedValue([]);
      mockWebSearchService.searchCompanyTeam.mockResolvedValue([]);
      mockWebSearchService.searchProfessionalEvents.mockResolvedValue([]);

      mockModel.generateContent
        .mockResolvedValueOnce({
          response: { text: () => JSON.stringify({ connections: [connectionWithWeakEvidence] }) }
        })
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              isValid: true,
              confidence: 7,
              concerns: [],
              reasoning: 'Valid professional connection'
            })
          }
        })
        .mockResolvedValueOnce({
          response: { text: () => JSON.stringify({ connections: [connectionWithWeakEvidence] }) }
        });

      const result = await aiNetworkResearcher.discoverFWBNetwork(mockFWBContact, mockUserProfile);

      expect(result.discoveredConnections).toHaveLength(1);
      // Evidence should be aggregated and strengthened
      expect(result.discoveredConnections[0].evidenceSources.length).toBeGreaterThan(1);
    });
  });

  describe('fallback mechanisms', () => {
    it('should provide fallback results when main discovery fails', async () => {
      // Mock all search methods to fail
      mockWebSearchService.searchPersonAndCompany.mockRejectedValue(new Error('Search failed'));
      mockWebSearchService.searchNews.mockRejectedValue(new Error('Search failed'));
      mockWebSearchService.searchPressReleases.mockRejectedValue(new Error('Search failed'));
      mockWebSearchService.searchCompanyTeam.mockRejectedValue(new Error('Search failed'));
      mockWebSearchService.searchProfessionalEvents.mockRejectedValue(new Error('Search failed'));

      const result = await aiNetworkResearcher.discoverFWBNetwork(mockFWBContact, mockUserProfile);

      expect(result).toBeDefined();
      expect(result.searchSummary.confidenceScore).toBeLessThan(0.5); // Low confidence for fallback
      expect(result.researchInsights.fwbNetworkSize).toBe('small');
    });

    it('should generate basic connections for tech companies', async () => {
      const techFWB: FWBContact = {
        name: 'John Smith',
        company: 'TechSoft AI',
        position: 'CTO'
      };

      // Force fallback by making AI analysis fail
      mockWebSearchService.searchPersonAndCompany.mockResolvedValue([]);
      mockWebSearchService.searchNews.mockResolvedValue([]);
      mockWebSearchService.searchPressReleases.mockResolvedValue([]);
      mockWebSearchService.searchCompanyTeam.mockResolvedValue([]);
      mockWebSearchService.searchProfessionalEvents.mockResolvedValue([]);

      mockModel.generateContent.mockRejectedValue(new Error('AI analysis failed'));

      const result = await aiNetworkResearcher.discoverFWBNetwork(techFWB, mockUserProfile);

      expect(result.discoveredConnections.length).toBeGreaterThan(0);
      expect(result.discoveredConnections[0].company).toBe('TechSoft AI');
      expect(result.discoveredConnections[0].title).toContain('Engineer'); // Tech-related role
    });
  });

  describe('scoring and ranking', () => {
    it('should score and rank connections by networking value', async () => {
      const connections = [
        { ...mockDiscoveredConnection, name: 'Low Value', networkingValue: 3 },
        { ...mockDiscoveredConnection, name: 'High Value', networkingValue: 9 },
        { ...mockDiscoveredConnection, name: 'Medium Value', networkingValue: 6 }
      ];

      mockWebSearchService.searchPersonAndCompany.mockResolvedValue([]);
      mockWebSearchService.searchNews.mockResolvedValue([]);
      mockWebSearchService.searchPressReleases.mockResolvedValue([]);
      mockWebSearchService.searchCompanyTeam.mockResolvedValue([]);
      mockWebSearchService.searchProfessionalEvents.mockResolvedValue([]);

      mockModel.generateContent
        .mockResolvedValueOnce({
          response: { text: () => JSON.stringify({ connections }) }
        })
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              isValid: true,
              confidence: 8,
              concerns: [],
              reasoning: 'Valid connection'
            })
          }
        })
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              isValid: true,
              confidence: 8,
              concerns: [],
              reasoning: 'Valid connection'
            })
          }
        })
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              isValid: true,
              confidence: 8,
              concerns: [],
              reasoning: 'Valid connection'
            })
          }
        })
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              connections: [
                { ...connections[1], networkingValue: 9 }, // High Value first
                { ...connections[2], networkingValue: 6 }, // Medium Value second
                { ...connections[0], networkingValue: 3 }  // Low Value last
              ]
            })
          }
        });

      const result = await aiNetworkResearcher.discoverFWBNetwork(mockFWBContact, mockUserProfile);

      expect(result.discoveredConnections).toHaveLength(3);
      expect(result.discoveredConnections[0].name).toBe('High Value');
      expect(result.discoveredConnections[1].name).toBe('Medium Value');
      expect(result.discoveredConnections[2].name).toBe('Low Value');
    });
  });

  describe('error handling', () => {
    it('should handle Gemini API failures gracefully', async () => {
      mockWebSearchService.searchPersonAndCompany.mockResolvedValue([]);
      mockWebSearchService.searchNews.mockResolvedValue([]);
      mockWebSearchService.searchPressReleases.mockResolvedValue([]);
      mockWebSearchService.searchCompanyTeam.mockResolvedValue([]);
      mockWebSearchService.searchProfessionalEvents.mockResolvedValue([]);

      mockModel.generateContent.mockRejectedValue(new Error('Gemini API error'));

      const result = await aiNetworkResearcher.discoverFWBNetwork(mockFWBContact, mockUserProfile);

      expect(result).toBeDefined();
      expect(result.discoveredConnections).toBeDefined();
      expect(result.searchSummary.confidenceScore).toBeLessThan(1);
    });

    it('should handle invalid JSON responses', async () => {
      mockWebSearchService.searchPersonAndCompany.mockResolvedValue([]);
      mockWebSearchService.searchNews.mockResolvedValue([]);
      mockWebSearchService.searchPressReleases.mockResolvedValue([]);
      mockWebSearchService.searchCompanyTeam.mockResolvedValue([]);
      mockWebSearchService.searchProfessionalEvents.mockResolvedValue([]);

      mockModel.generateContent.mockResolvedValue({
        response: { text: () => 'Invalid JSON response' }
      });

      const result = await aiNetworkResearcher.discoverFWBNetwork(mockFWBContact, mockUserProfile);

      expect(result.discoveredConnections).toEqual([]);
    });

    it('should handle empty search results', async () => {
      mockWebSearchService.searchPersonAndCompany.mockResolvedValue([]);
      mockWebSearchService.searchNews.mockResolvedValue([]);
      mockWebSearchService.searchPressReleases.mockResolvedValue([]);
      mockWebSearchService.searchCompanyTeam.mockResolvedValue([]);
      mockWebSearchService.searchProfessionalEvents.mockResolvedValue([]);

      const result = await aiNetworkResearcher.discoverFWBNetwork(mockFWBContact, mockUserProfile);

      expect(result).toBeDefined();
      expect(result.searchSummary.sourcesAnalyzed).toBe(0);
    });
  });

  describe('research insights generation', () => {
    it('should generate appropriate research insights', async () => {
      const multipleConnections = [
        { ...mockDiscoveredConnection, name: 'Alice Johnson', company: 'TechCorp' },
        { ...mockDiscoveredConnection, name: 'Bob Smith', company: 'DataCorp' },
        { ...mockDiscoveredConnection, name: 'Carol Davis', company: 'TechCorp' }
      ];

      mockWebSearchService.searchPersonAndCompany.mockResolvedValue([]);
      mockWebSearchService.searchNews.mockResolvedValue([]);
      mockWebSearchService.searchPressReleases.mockResolvedValue([]);
      mockWebSearchService.searchCompanyTeam.mockResolvedValue([]);
      mockWebSearchService.searchProfessionalEvents.mockResolvedValue([]);

      mockModel.generateContent
        .mockResolvedValueOnce({
          response: { text: () => JSON.stringify({ connections: multipleConnections }) }
        })
        .mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              isValid: true,
              confidence: 8,
              concerns: [],
              reasoning: 'Valid connection'
            })
          }
        })
        .mockResolvedValueOnce({
          response: { text: () => JSON.stringify({ connections: multipleConnections }) }
        });

      const result = await aiNetworkResearcher.discoverFWBNetwork(mockFWBContact, mockUserProfile);

      expect(result.researchInsights.fwbNetworkSize).toBe('medium'); // 3 connections
      expect(result.researchInsights.industryConnections).toContain('TechCorp');
      expect(result.researchInsights.industryConnections).toContain('DataCorp');
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', () => {
      expect(() => aiNetworkResearcher.clearCache()).not.toThrow();
    });
  });
});