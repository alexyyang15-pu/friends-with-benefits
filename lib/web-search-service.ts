import { GoogleGenerativeAI } from '@google/generative-ai';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  contentType: 'news' | 'press_release' | 'company_page' | 'professional_bio' | 'article' | 'unknown';
  publishDate?: string;
  confidence: 'high' | 'medium' | 'low';
  source?: string;
}

interface WebSearchOptions {
  dateRange?: 'day' | 'week' | 'month' | 'year';
  siteRestrict?: string[];
  excludeSites?: string[];
  maxResults?: number;
  sortBy?: 'relevance' | 'date';
  language?: string;
}

interface ProcessedSearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  contentType: 'news' | 'press_release' | 'company_page' | 'professional_bio' | 'article' | 'unknown';
  publishDate?: string;
  confidence: 'high' | 'medium' | 'low';
}

class WebSearchService {
  private genAI: GoogleGenerativeAI;
  private cache = new Map<string, { results: ProcessedSearchResult[]; timestamp: number }>();
  private cacheTimeout = 1000 * 60 * 60; // 1 hour cache

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    
    if (!apiKey) {
      throw new Error('Gemini API key is required. Please set GEMINI_API_KEY environment variable.');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Search for articles, press releases, and professional content related to a person or company
   */
  async searchPersonAndCompany(
    personName: string,
    companyName: string,
    options: WebSearchOptions = {}
  ): Promise<ProcessedSearchResult[]> {
    const cacheKey = `person_company_${personName}_${companyName}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.results;
    }

    const searchQuery = `Find recent news articles, press releases, and professional information about "${personName}" from "${companyName}". Include any mentions of their work, announcements, interviews, or professional activities.`;
    
    try {
      const results = await this.executeGeminiSearch(searchQuery, {
        ...options,
        searchType: 'person_company',
        personName,
        companyName
      });
      
      // Cache results
      this.cache.set(cacheKey, { results, timestamp: Date.now() });
      
      return results;
    } catch (error) {
      console.error(`Error searching for ${personName} at ${companyName}:`, error);
      return [];
    }
  }

  /**
   * Search for news articles mentioning a person
   */
  async searchNews(
    personName: string,
    companyName?: string,
    options: WebSearchOptions = {}
  ): Promise<ProcessedSearchResult[]> {
    const cacheKey = `news_${personName}_${companyName || 'no_company'}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.results;
    }

    const companyContext = companyName ? ` from "${companyName}"` : '';
    const searchQuery = `Find recent news articles about "${personName}"${companyContext}. Focus on business news, technology publications, and major news outlets like TechCrunch, Bloomberg, Reuters, WSJ, Fortune, Forbes, and Business Insider.`;
    
    try {
      const results = await this.executeGeminiSearch(searchQuery, {
        ...options,
        searchType: 'news',
        personName,
        companyName
      });
      
      // Filter to prioritize news content
      const newsResults = results.filter(r => 
        r.contentType === 'news' || 
        r.contentType === 'article' ||
        r.domain.includes('techcrunch') ||
        r.domain.includes('bloomberg') ||
        r.domain.includes('reuters') ||
        r.domain.includes('wsj') ||
        r.domain.includes('fortune') ||
        r.domain.includes('forbes')
      );
      
      // Cache results
      this.cache.set(cacheKey, { results: newsResults, timestamp: Date.now() });
      
      return newsResults;
    } catch (error) {
      console.error(`Error searching news for ${personName}:`, error);
      return [];
    }
  }

  /**
   * Search for press releases from a company
   */
  async searchPressReleases(
    companyName: string,
    personName?: string,
    options: WebSearchOptions = {}
  ): Promise<ProcessedSearchResult[]> {
    const cacheKey = `press_releases_${companyName}_${personName || 'no_person'}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.results;
    }

    const personContext = personName ? ` mentioning "${personName}"` : '';
    const searchQuery = `Find official press releases and announcements from "${companyName}"${personContext}. Focus on business announcements, funding news, product launches, executive appointments, and company milestones. Look for content from PR Newswire, Business Wire, GlobeNewswire, and official company newsrooms.`;
    
    try {
      const results = await this.executeGeminiSearch(searchQuery, {
        ...options,
        searchType: 'press_releases',
        companyName,
        personName
      });
      
      // Filter to prioritize press release content
      const pressResults = results.filter(r => 
        r.contentType === 'press_release' ||
        r.domain.includes('prnewswire') ||
        r.domain.includes('businesswire') ||
        r.domain.includes('globenewswire') ||
        r.domain.includes('marketwatch') ||
        r.title.toLowerCase().includes('press release') ||
        r.title.toLowerCase().includes('announces') ||
        r.snippet.toLowerCase().includes('announced')
      );
      
      // Cache results
      this.cache.set(cacheKey, { results: pressResults, timestamp: Date.now() });
      
      return pressResults;
    } catch (error) {
      console.error(`Error searching press releases for ${companyName}:`, error);
      return [];
    }
  }

  /**
   * Search for company leadership pages and team directories
   */
  async searchCompanyTeam(
    companyName: string,
    options: WebSearchOptions = {}
  ): Promise<ProcessedSearchResult[]> {
    const cacheKey = `company_team_${companyName}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.results;
    }

    const searchQuery = `Find "${companyName}" team pages, leadership directory, executive team, management team, and company about pages. Look for official company website pages showing team members, leadership profiles, and organizational structure.`;
    
    try {
      const results = await this.executeGeminiSearch(searchQuery, {
        ...options,
        searchType: 'company_team',
        companyName
      });
      
      // Filter to prioritize company page content
      const teamResults = results.filter(r => 
        r.contentType === 'company_page' ||
        r.title.toLowerCase().includes('team') ||
        r.title.toLowerCase().includes('leadership') ||
        r.title.toLowerCase().includes('about') ||
        r.snippet.toLowerCase().includes('team') ||
        r.snippet.toLowerCase().includes('executive')
      );
      
      // Cache results
      this.cache.set(cacheKey, { results: teamResults, timestamp: Date.now() });
      
      return teamResults;
    } catch (error) {
      console.error(`Error searching company team for ${companyName}:`, error);
      return [];
    }
  }

  /**
   * Search for professional event listings and speaker information
   */
  async searchProfessionalEvents(
    personName: string,
    industry?: string,
    options: WebSearchOptions = {}
  ): Promise<ProcessedSearchResult[]> {
    const cacheKey = `events_${personName}_${industry || 'no_industry'}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.results;
    }

    const industryContext = industry ? ` in the ${industry} industry` : '';
    const searchQuery = `Find professional events, conferences, and speaking engagements featuring "${personName}"${industryContext}. Look for conference speaker lists, event announcements, and professional speaking appearances.`;
    
    try {
      const results = await this.executeGeminiSearch(searchQuery, {
        ...options,
        searchType: 'professional_events',
        personName,
        industry
      });
      
      // Filter to prioritize event content
      const eventResults = results.filter(r => 
        r.title.toLowerCase().includes('speaker') ||
        r.title.toLowerCase().includes('conference') ||
        r.title.toLowerCase().includes('event') ||
        r.snippet.toLowerCase().includes('speaker') ||
        r.snippet.toLowerCase().includes('conference') ||
        r.snippet.toLowerCase().includes('speaking')
      );
      
      // Cache results
      this.cache.set(cacheKey, { results: eventResults, timestamp: Date.now() });
      
      return eventResults;
    } catch (error) {
      console.error(`Error searching professional events for ${personName}:`, error);
      return [];
    }
  }

  /**
   * Execute search using Gemini with web search capabilities
   */
  private async executeGeminiSearch(
    query: string,
    options: WebSearchOptions & { searchType?: string; personName?: string; companyName?: string } = {}
  ): Promise<ProcessedSearchResult[]> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        tools: [{ googleSearch: {} }]
      });

      const prompt = this.buildGeminiPrompt(query, options);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the response to extract structured search results
      return this.parseGeminiResponse(text, options);
    } catch (error) {
      console.error(`Error executing Gemini search for "${query}":`, error);
      return [];
    }
  }

  /**
   * Build optimized prompt for Gemini web search
   */
  private buildGeminiPrompt(query: string, options: any): string {
    const dateFilter = options.dateRange ? this.getDateFilter(options.dateRange) : '';
    const maxResults = options.maxResults || 10;
    
    return `
Search the web for: ${query}

Please find and return up to ${maxResults} relevant results in the following JSON format:
{
  "results": [
    {
      "title": "Article/page title",
      "url": "https://example.com/article",
      "snippet": "Brief description or excerpt",
      "domain": "example.com",
      "contentType": "news|press_release|company_page|professional_bio|article|unknown",
      "publishDate": "YYYY-MM-DD or null if unknown",
      "confidence": "high|medium|low",
      "source": "Source publication or website name"
    }
  ]
}

Search criteria:
- Focus on recent content ${dateFilter}
- Prioritize authoritative sources (major news outlets, official company pages, press release sites)
- Include business and technology publications
- Look for professional announcements, interviews, and company news
- Categorize content type accurately
- Assess confidence based on source credibility

Content type guidelines:
- "news": Articles from news publications
- "press_release": Official announcements from PR wire services
- "company_page": Official company website pages (about, team, leadership)
- "professional_bio": Professional profiles or biographies
- "article": Blog posts, opinion pieces, industry articles
- "unknown": If type cannot be determined

Confidence guidelines:
- "high": Major news outlets, official company pages, verified press releases
- "medium": Industry publications, recognized business sources
- "low": Blogs, unverified sources, social media

Return ONLY the JSON response, no additional text.`;
  }

  /**
   * Parse Gemini response into structured search results
   */
  private parseGeminiResponse(text: string, options: any): ProcessedSearchResult[] {
    try {
      // Clean the response text to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in Gemini response');
        return [];
      }

      const jsonText = jsonMatch[0];
      const parsed = JSON.parse(jsonText);
      
      if (!parsed.results || !Array.isArray(parsed.results)) {
        console.error('Invalid response structure from Gemini');
        return [];
      }

      return parsed.results.map((item: any) => ({
        title: item.title || 'No title',
        url: item.url || '',
        snippet: item.snippet || '',
        domain: item.domain || this.extractDomainFromUrl(item.url || ''),
        contentType: this.validateContentType(item.contentType),
        publishDate: item.publishDate || undefined,
        confidence: this.validateConfidence(item.confidence),
        source: item.source || item.domain || 'Unknown'
      }));
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return [];
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomainFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Validate content type
   */
  private validateContentType(type: string): ProcessedSearchResult['contentType'] {
    const validTypes = ['news', 'press_release', 'company_page', 'professional_bio', 'article'];
    return validTypes.includes(type) ? type as ProcessedSearchResult['contentType'] : 'unknown';
  }

  /**
   * Validate confidence level
   */
  private validateConfidence(confidence: string): 'high' | 'medium' | 'low' {
    const validLevels = ['high', 'medium', 'low'];
    return validLevels.includes(confidence) ? confidence as 'high' | 'medium' | 'low' : 'low';
  }

  /**
   * Convert date range to natural language filter
   */
  private getDateFilter(dateRange: string): string {
    switch (dateRange) {
      case 'day': return 'from the last 24 hours';
      case 'week': return 'from the last week';
      case 'month': return 'from the last month';
      case 'year': return 'from the last year';
      default: return 'from recent months';
    }
  }



  /**
   * Add delay between requests to respect rate limits
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear the cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

export { WebSearchService, type ProcessedSearchResult, type WebSearchOptions }; 