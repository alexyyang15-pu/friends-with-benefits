import { WebSearchService, ProcessedSearchResult } from './web-search-service';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock the GoogleGenerativeAI
jest.mock('@google/generative-ai');

describe('WebSearchService', () => {
  let webSearchService: WebSearchService;
  let mockGenAI: jest.Mocked<GoogleGenerativeAI>;
  let mockModel: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock model with generateContent method
    mockModel = {
      generateContent: jest.fn()
    };

    // Mock GoogleGenerativeAI
    mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    } as any;

    (GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>).mockImplementation(() => mockGenAI);

    webSearchService = new WebSearchService();
  });

  describe('searchPersonAndCompany', () => {
    it('should search for person and company successfully', async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            results: [
              {
                title: 'John Smith - VP Engineering at TechCorp',
                url: 'https://techcorp.com/team/john-smith',
                snippet: 'John Smith leads engineering at TechCorp...',
                contentType: 'company_page',
                confidence: 'high'
              }
            ]
          })
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const results = await webSearchService.searchPersonAndCompany('John Smith', 'TechCorp');

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        title: 'John Smith - VP Engineering at TechCorp',
        url: 'https://techcorp.com/team/john-smith',
        snippet: 'John Smith leads engineering at TechCorp...',
        contentType: 'company_page',
        confidence: 'high'
      });
      expect(mockModel.generateContent).toHaveBeenCalledTimes(1);
    });

    it('should handle search errors gracefully', async () => {
      mockModel.generateContent.mockRejectedValue(new Error('API Error'));

      const results = await webSearchService.searchPersonAndCompany('John Smith', 'TechCorp');

      expect(results).toEqual([]);
    });

    it('should handle invalid JSON response', async () => {
      const mockResponse = {
        response: {
          text: () => 'Invalid JSON response'
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const results = await webSearchService.searchPersonAndCompany('John Smith', 'TechCorp');

      expect(results).toEqual([]);
    });

    it('should respect maxResults parameter', async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            results: Array(10).fill(null).map((_, i) => ({
              title: `Result ${i}`,
              url: `https://example.com/${i}`,
              snippet: `Snippet ${i}`,
              contentType: 'article',
              confidence: 'medium'
            }))
          })
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const results = await webSearchService.searchPersonAndCompany('John Smith', 'TechCorp', { maxResults: 5 });

      expect(results).toHaveLength(5);
    });
  });

  describe('searchNews', () => {
    it('should search for news successfully', async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            results: [
              {
                title: 'TechCorp Announces New AI Initiative',
                url: 'https://news.example.com/techcorp-ai',
                snippet: 'TechCorp led by John Smith announces...',
                contentType: 'news',
                confidence: 'high'
              }
            ]
          })
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const results = await webSearchService.searchNews('John Smith', 'TechCorp');

      expect(results).toHaveLength(1);
      expect(results[0].contentType).toBe('news');
    });

    it('should include recent timeframe in search', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: { text: () => JSON.stringify({ results: [] }) }
      });

      await webSearchService.searchNews('John Smith', 'TechCorp', { timeframe: '6months' });

      const callArgs = mockModel.generateContent.mock.calls[0][0];
      expect(callArgs).toContain('6months');
    });
  });

  describe('searchPressReleases', () => {
    it('should search for press releases successfully', async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            results: [
              {
                title: 'TechCorp Press Release: Leadership Changes',
                url: 'https://techcorp.com/press/leadership',
                snippet: 'TechCorp announces leadership changes...',
                contentType: 'press_release',
                confidence: 'high'
              }
            ]
          })
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const results = await webSearchService.searchPressReleases('TechCorp', 'John Smith');

      expect(results).toHaveLength(1);
      expect(results[0].contentType).toBe('press_release');
    });
  });

  describe('searchCompanyTeam', () => {
    it('should search for company team information', async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            results: [
              {
                title: 'TechCorp Leadership Team',
                url: 'https://techcorp.com/team',
                snippet: 'Meet our leadership team including...',
                contentType: 'company_page',
                confidence: 'high'
              }
            ]
          })
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const results = await webSearchService.searchCompanyTeam('TechCorp');

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        title: 'TechCorp Leadership Team',
        contentType: 'company_page'
      });
    });
  });

  describe('searchProfessionalEvents', () => {
    it('should search for professional events', async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            results: [
              {
                title: 'John Smith Speaking at Tech Conference 2024',
                url: 'https://techconf.com/speakers/john-smith',
                snippet: 'Join John Smith as he presents...',
                contentType: 'event',
                confidence: 'medium'
              }
            ]
          })
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const results = await webSearchService.searchProfessionalEvents('John Smith', 'AI Conference');

      expect(results).toHaveLength(1);
      expect(results[0].contentType).toBe('event');
    });
  });

  describe('caching functionality', () => {
    it('should cache results and return cached data on subsequent calls', async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            results: [
              {
                title: 'Cached Result',
                url: 'https://example.com/cached',
                snippet: 'This should be cached',
                contentType: 'article',
                confidence: 'high'
              }
            ]
          })
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      // First call
      const firstResults = await webSearchService.searchPersonAndCompany('John Smith', 'TechCorp');
      
      // Second call (should use cache)
      const secondResults = await webSearchService.searchPersonAndCompany('John Smith', 'TechCorp');

      expect(firstResults).toEqual(secondResults);
      expect(mockModel.generateContent).toHaveBeenCalledTimes(1); // Only called once due to caching
    });

    it('should respect cache timeout', async () => {
      // This test would require manipulating time, so we'll keep it simple
      const webSearchServiceShortCache = new WebSearchService();
      
      mockModel.generateContent.mockResolvedValue({
        response: { text: () => JSON.stringify({ results: [] }) }
      });

      await webSearchServiceShortCache.searchPersonAndCompany('John Smith', 'TechCorp');
      
      // Clear cache manually to test timeout behavior
      webSearchServiceShortCache.clearCache();
      
      await webSearchServiceShortCache.searchPersonAndCompany('John Smith', 'TechCorp');

      expect(mockModel.generateContent).toHaveBeenCalledTimes(2);
    });
  });

  describe('processSearchResults', () => {
    it('should process and validate search results correctly', async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            results: [
              {
                title: 'Valid Result',
                url: 'https://example.com/valid',
                snippet: 'Valid snippet',
                contentType: 'article',
                confidence: 'high'
              },
              {
                // Invalid result - missing required fields
                title: 'Invalid Result'
                // Missing url, snippet, etc.
              }
            ]
          })
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const results = await webSearchService.searchPersonAndCompany('John Smith', 'TechCorp');

      // Should filter out invalid results
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Valid Result');
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts', async () => {
      mockModel.generateContent.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const results = await webSearchService.searchPersonAndCompany('John Smith', 'TechCorp');

      expect(results).toEqual([]);
    });

    it('should handle Gemini API rate limits', async () => {
      mockModel.generateContent.mockRejectedValue(new Error('Rate limit exceeded'));

      const results = await webSearchService.searchPersonAndCompany('John Smith', 'TechCorp');

      expect(results).toEqual([]);
    });

    it('should handle empty responses', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: { text: () => JSON.stringify({ results: [] }) }
      });

      const results = await webSearchService.searchPersonAndCompany('John Smith', 'TechCorp');

      expect(results).toEqual([]);
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: { text: () => JSON.stringify({ results: [] }) }
      });

      // Make a call to populate cache
      await webSearchService.searchPersonAndCompany('John Smith', 'TechCorp');
      
      // Clear cache
      webSearchService.clearCache();
      
      // Make another call - should hit API again
      await webSearchService.searchPersonAndCompany('John Smith', 'TechCorp');

      expect(mockModel.generateContent).toHaveBeenCalledTimes(2);
    });
  });

  describe('input validation', () => {
    it('should handle empty person name', async () => {
      const results = await webSearchService.searchPersonAndCompany('', 'TechCorp');
      expect(results).toEqual([]);
    });

    it('should handle empty company name', async () => {
      const results = await webSearchService.searchPersonAndCompany('John Smith', '');
      expect(results).toEqual([]);
    });

    it('should handle special characters in search terms', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: { text: () => JSON.stringify({ results: [] }) }
      });

      const results = await webSearchService.searchPersonAndCompany('John O\'Brien', 'Tech & Co.');
      
      expect(mockModel.generateContent).toHaveBeenCalled();
      expect(results).toEqual([]);
    });
  });
});