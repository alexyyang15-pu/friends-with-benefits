import { CareerAlignmentAnalyzer, CareerAlignment, ConnectionWithAlignment, AlignmentAnalysisResult } from './career-alignment-analyzer';
import { DiscoveredConnection } from './ai-network-researcher';
import { UserProfile } from '@/hooks/useUserProfile';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock GoogleGenerativeAI
jest.mock('@google/generative-ai');

describe('CareerAlignmentAnalyzer', () => {
  let careerAlignmentAnalyzer: CareerAlignmentAnalyzer;
  let mockGenAI: jest.Mocked<GoogleGenerativeAI>;
  let mockModel: any;

  const mockUserProfile: UserProfile = {
    name: 'Jane Doe',
    title: 'Product Manager',
    summary: 'Experienced product manager with 5 years in fintech, specializing in user research and data-driven product decisions',
    skills: ['Product Strategy', 'User Research', 'Data Analysis', 'Agile Development', 'A/B Testing']
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

  const mockCareerAlignment: CareerAlignment = {
    overallScore: 85,
    alignmentFactors: {
      industryMatch: 9,
      roleRelevance: 8,
      skillsOverlap: 7,
      careerStageAlignment: 8,
      networkingPotential: 9
    },
    strategicValue: {
      shortTermBenefit: 'Could provide insights into technical product requirements',
      longTermBenefit: 'Potential pathway to senior product leadership roles',
      keyOpportunities: ['Technical mentorship', 'Product-engineering collaboration'],
      potentialChallenges: ['Different functional backgrounds']
    },
    actionableInsights: {
      approachStrategy: 'Focus on shared product development interests',
      conversationStarters: ['Product-engineering collaboration', 'Technical requirements gathering'],
      valueProposition: 'Product strategy insights for technical projects',
      timelineRecommendation: 'immediate'
    },
    confidenceLevel: 'high'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock GoogleGenerativeAI
    mockModel = {
      generateContent: jest.fn()
    };

    mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    } as any;

    (GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>).mockImplementation(() => mockGenAI);

    careerAlignmentAnalyzer = new CareerAlignmentAnalyzer();
  });

  describe('analyzeCareerAlignment', () => {
    it('should analyze career alignment for discovered connections', async () => {
      const mockConnections = [mockDiscoveredConnection];

      // Mock individual alignment analysis
      mockModel.generateContent
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              connections: [{
                ...mockDiscoveredConnection,
                careerAlignment: mockCareerAlignment
              }]
            })
          }
        })
        // Mock portfolio insights
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              overallNetworkingStrategy: 'Focus on technical product leadership connections',
              priorityTiers: {
                tier1: ['Alice Johnson'],
                tier2: [],
                tier3: []
              },
              gapAnalysis: ['Need more senior leadership connections'],
              recommendedFocusAreas: ['Technical product management', 'Engineering collaboration']
            })
          }
        })
        // Mock career trajectory analysis
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              currentPositioning: 'Mid-level product manager with strong technical focus',
              strengthAreas: ['Product Strategy', 'Data Analysis'],
              growthOpportunities: ['Technical leadership', 'Senior stakeholder management'],
              networkingGoals: ['Build technical product network', 'Access senior leadership']
            })
          }
        });

      const result = await careerAlignmentAnalyzer.analyzeCareerAlignment(
        mockConnections,
        mockUserProfile,
        'Advance to senior product management roles'
      );

      expect(result.analyzedConnections).toHaveLength(1);
      expect(result.analyzedConnections[0].careerAlignment.overallScore).toBe(85);
      expect(result.portfolioInsights.overallNetworkingStrategy).toContain('technical product leadership');
      expect(result.careerTrajectoryInsights.currentPositioning).toContain('Mid-level product manager');
    });

    it('should handle different analysis depths', async () => {
      const mockConnections = [mockDiscoveredConnection];

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            connections: [{
              ...mockDiscoveredConnection,
              careerAlignment: mockCareerAlignment
            }]
          })
        }
      });

      // Test quick analysis
      await careerAlignmentAnalyzer.analyzeCareerAlignment(
        mockConnections,
        mockUserProfile,
        undefined,
        { analysisDepth: 'quick' }
      );

      const quickCall = mockModel.generateContent.mock.calls[0][0];
      expect(quickCall).toContain('quick');

      // Test comprehensive analysis
      await careerAlignmentAnalyzer.analyzeCareerAlignment(
        mockConnections,
        mockUserProfile,
        undefined,
        { analysisDepth: 'comprehensive' }
      );

      const comprehensiveCall = mockModel.generateContent.mock.calls[3][0];
      expect(comprehensiveCall).toContain('comprehensive');
    });

    it('should use caching for repeated requests', async () => {
      const mockConnections = [mockDiscoveredConnection];

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            connections: [{
              ...mockDiscoveredConnection,
              careerAlignment: mockCareerAlignment
            }]
          })
        }
      });

      // First call
      const firstResult = await careerAlignmentAnalyzer.analyzeCareerAlignment(
        mockConnections,
        mockUserProfile
      );

      // Second call with same parameters (should use cache)
      const secondResult = await careerAlignmentAnalyzer.analyzeCareerAlignment(
        mockConnections,
        mockUserProfile
      );

      expect(firstResult).toEqual(secondResult);
      // Should only call the API once due to caching
      expect(mockModel.generateContent).toHaveBeenCalledTimes(3); // Individual + portfolio + trajectory
    });

    it('should handle different time horizons', async () => {
      const mockConnections = [mockDiscoveredConnection];

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            connections: [{
              ...mockDiscoveredConnection,
              careerAlignment: mockCareerAlignment
            }]
          })
        }
      });

      await careerAlignmentAnalyzer.analyzeCareerAlignment(
        mockConnections,
        mockUserProfile,
        undefined,
        { timeHorizon: 'short_term' }
      );

      const portfolioCall = mockModel.generateContent.mock.calls[1][0];
      expect(portfolioCall).toContain('short_term');
    });
  });

  describe('individual alignment analysis', () => {
    it('should calculate proper alignment scores', async () => {
      const mockConnections = [mockDiscoveredConnection];

      const detailedAlignment = {
        ...mockCareerAlignment,
        alignmentFactors: {
          industryMatch: 9,
          roleRelevance: 8,
          skillsOverlap: 7,
          careerStageAlignment: 8,
          networkingPotential: 9
        }
      };

      mockModel.generateContent
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              connections: [{
                ...mockDiscoveredConnection,
                careerAlignment: detailedAlignment
              }]
            })
          }
        })
        .mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              overallNetworkingStrategy: 'Strategy',
              priorityTiers: { tier1: [], tier2: [], tier3: [] },
              gapAnalysis: [],
              recommendedFocusAreas: [],
              currentPositioning: 'Position',
              strengthAreas: [],
              growthOpportunities: [],
              networkingGoals: []
            })
          }
        });

      const result = await careerAlignmentAnalyzer.analyzeCareerAlignment(mockConnections, mockUserProfile);

      const connection = result.analyzedConnections[0];
      expect(connection.careerAlignment.alignmentFactors.industryMatch).toBe(9);
      expect(connection.careerAlignment.alignmentFactors.roleRelevance).toBe(8);
      expect(connection.careerAlignment.alignmentFactors.skillsOverlap).toBe(7);
    });

    it('should generate actionable insights', async () => {
      const mockConnections = [mockDiscoveredConnection];

      mockModel.generateContent
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              connections: [{
                ...mockDiscoveredConnection,
                careerAlignment: mockCareerAlignment
              }]
            })
          }
        })
        .mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              overallNetworkingStrategy: 'Strategy',
              priorityTiers: { tier1: [], tier2: [], tier3: [] },
              gapAnalysis: [],
              recommendedFocusAreas: [],
              currentPositioning: 'Position',
              strengthAreas: [],
              growthOpportunities: [],
              networkingGoals: []
            })
          }
        });

      const result = await careerAlignmentAnalyzer.analyzeCareerAlignment(mockConnections, mockUserProfile);

      const insights = result.analyzedConnections[0].careerAlignment.actionableInsights;
      expect(insights.approachStrategy).toBeDefined();
      expect(insights.conversationStarters).toHaveLength(2);
      expect(insights.valueProposition).toBeDefined();
      expect(insights.timelineRecommendation).toBe('immediate');
    });
  });

  describe('portfolio insights generation', () => {
    it('should categorize connections into priority tiers', async () => {
      const multipleConnections = [
        { ...mockDiscoveredConnection, name: 'High Priority', networkingValue: 9 },
        { ...mockDiscoveredConnection, name: 'Medium Priority', networkingValue: 6 },
        { ...mockDiscoveredConnection, name: 'Low Priority', networkingValue: 3 }
      ];

      mockModel.generateContent
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              connections: multipleConnections.map(conn => ({
                ...conn,
                careerAlignment: mockCareerAlignment
              }))
            })
          }
        })
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              overallNetworkingStrategy: 'Multi-tier approach',
              priorityTiers: {
                tier1: ['High Priority'],
                tier2: ['Medium Priority'],
                tier3: ['Low Priority']
              },
              gapAnalysis: ['Need more C-level connections'],
              recommendedFocusAreas: ['Leadership networking', 'Industry expertise']
            })
          }
        })
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              currentPositioning: 'Position',
              strengthAreas: [],
              growthOpportunities: [],
              networkingGoals: []
            })
          }
        });

      const result = await careerAlignmentAnalyzer.analyzeCareerAlignment(multipleConnections, mockUserProfile);

      expect(result.portfolioInsights.priorityTiers.tier1).toHaveLength(1);
      expect(result.portfolioInsights.priorityTiers.tier2).toHaveLength(1);
      expect(result.portfolioInsights.priorityTiers.tier3).toHaveLength(1);
      expect(result.portfolioInsights.gapAnalysis).toContain('Need more C-level connections');
    });

    it('should provide strategic networking recommendations', async () => {
      const mockConnections = [mockDiscoveredConnection];

      mockModel.generateContent
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              connections: [{
                ...mockDiscoveredConnection,
                careerAlignment: mockCareerAlignment
              }]
            })
          }
        })
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              overallNetworkingStrategy: 'Focus on building technical product leadership network',
              priorityTiers: { tier1: ['Alice Johnson'], tier2: [], tier3: [] },
              gapAnalysis: ['Missing senior leadership connections', 'Need more cross-functional partners'],
              recommendedFocusAreas: ['Technical product management', 'Strategic partnerships', 'Leadership development']
            })
          }
        })
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              currentPositioning: 'Position',
              strengthAreas: [],
              growthOpportunities: [],
              networkingGoals: []
            })
          }
        });

      const result = await careerAlignmentAnalyzer.analyzeCareerAlignment(mockConnections, mockUserProfile);

      expect(result.portfolioInsights.overallNetworkingStrategy).toContain('technical product leadership');
      expect(result.portfolioInsights.recommendedFocusAreas).toContain('Technical product management');
      expect(result.portfolioInsights.gapAnalysis).toHaveLength(2);
    });
  });

  describe('career trajectory analysis', () => {
    it('should analyze current positioning and growth opportunities', async () => {
      const mockConnections = [mockDiscoveredConnection];

      mockModel.generateContent
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              connections: [{
                ...mockDiscoveredConnection,
                careerAlignment: mockCareerAlignment
              }]
            })
          }
        })
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              overallNetworkingStrategy: 'Strategy',
              priorityTiers: { tier1: [], tier2: [], tier3: [] },
              gapAnalysis: [],
              recommendedFocusAreas: []
            })
          }
        })
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              currentPositioning: 'Mid-level product manager with strong analytical skills and fintech expertise',
              strengthAreas: ['Product Strategy', 'Data Analysis', 'User Research'],
              growthOpportunities: ['Technical leadership', 'Senior stakeholder management', 'Strategic vision'],
              networkingGoals: ['Build executive relationships', 'Expand technical network', 'Industry thought leadership']
            })
          }
        });

      const result = await careerAlignmentAnalyzer.analyzeCareerAlignment(mockConnections, mockUserProfile);

      expect(result.careerTrajectoryInsights.currentPositioning).toContain('Mid-level product manager');
      expect(result.careerTrajectoryInsights.strengthAreas).toContain('Product Strategy');
      expect(result.careerTrajectoryInsights.growthOpportunities).toContain('Technical leadership');
      expect(result.careerTrajectoryInsights.networkingGoals).toContain('Build executive relationships');
    });
  });

  describe('generateIntroductionTemplates', () => {
    it('should generate personalized introduction templates', async () => {
      const fwbContact = {
        name: 'John Smith',
        company: 'TechCorp'
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            introductionRequest: 'Hi John, I hope you\'re doing well! I came across Alice Johnson...',
            followUpMessage: 'Hi Alice, Thank you for connecting! I\'m Jane and was introduced by John...',
            linkedInMessage: 'Hi Alice, I\'m Jane Doe and came across your profile through our shared connection...',
            emailSubject: 'Introduction to Alice Johnson - Product Management Discussion'
          })
        }
      });

      const templates = await careerAlignmentAnalyzer.generateIntroductionTemplates(
        mockDiscoveredConnection,
        fwbContact,
        mockUserProfile,
        'Advance to senior product management roles'
      );

      expect(templates.introductionRequest).toContain('Alice Johnson');
      expect(templates.followUpMessage).toContain('Jane');
      expect(templates.linkedInMessage).toContain('Jane Doe');
      expect(templates.emailSubject).toContain('Alice Johnson');
    });

    it('should provide fallback templates on error', async () => {
      const fwbContact = {
        name: 'John Smith',
        company: 'TechCorp'
      };

      mockModel.generateContent.mockRejectedValue(new Error('API Error'));

      const templates = await careerAlignmentAnalyzer.generateIntroductionTemplates(
        mockDiscoveredConnection,
        fwbContact,
        mockUserProfile
      );

      expect(templates.introductionRequest).toBeDefined();
      expect(templates.followUpMessage).toBeDefined();
      expect(templates.linkedInMessage).toBeDefined();
      expect(templates.emailSubject).toBeDefined();
    });

    it('should customize templates based on career objective', async () => {
      const fwbContact = {
        name: 'John Smith',
        company: 'TechCorp'
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            introductionRequest: 'Introduction focused on senior product management goals...',
            followUpMessage: 'Follow-up mentioning leadership aspirations...',
            linkedInMessage: 'LinkedIn message highlighting career advancement...',
            emailSubject: 'Senior Product Management Career Discussion'
          })
        }
      });

      const templates = await careerAlignmentAnalyzer.generateIntroductionTemplates(
        mockDiscoveredConnection,
        fwbContact,
        mockUserProfile,
        'Advance to senior product management roles'
      );

      expect(templates.introductionRequest).toContain('senior product management');
      expect(templates.emailSubject).toContain('Senior Product Management');
    });
  });

  describe('generateDetailedOpportunityAnalysis', () => {
    it('should identify specific opportunities with connections', async () => {
      const mockConnections = [mockDiscoveredConnection];

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            specificOpportunities: [
              {
                connectionName: 'Alice Johnson',
                opportunityType: 'mentorship',
                description: 'Technical mentorship in product-engineering collaboration',
                actionSteps: ['Schedule initial coffee chat', 'Discuss current projects', 'Establish regular check-ins'],
                timeframe: '3-6 months',
                successMetrics: ['Improved technical understanding', 'Better cross-functional relationships']
              }
            ],
            strategicInsights: {
              portfolioStrengths: ['Strong technical network', 'Cross-functional relationships'],
              marketPositioning: 'Well-positioned for technical product leadership',
              competitiveAdvantages: ['Analytical skills', 'Fintech experience'],
              developmentAreas: ['Executive presence', 'Strategic vision']
            }
          })
        }
      });

      const analysis = await careerAlignmentAnalyzer.generateDetailedOpportunityAnalysis(
        mockConnections,
        mockUserProfile,
        'Advance to senior product management roles'
      );

      expect(analysis.specificOpportunities).toHaveLength(1);
      expect(analysis.specificOpportunities[0].opportunityType).toBe('mentorship');
      expect(analysis.specificOpportunities[0].actionSteps).toHaveLength(3);
      expect(analysis.strategicInsights.portfolioStrengths).toContain('Strong technical network');
    });

    it('should handle analysis errors gracefully', async () => {
      const mockConnections = [mockDiscoveredConnection];

      mockModel.generateContent.mockRejectedValue(new Error('Analysis failed'));

      const analysis = await careerAlignmentAnalyzer.generateDetailedOpportunityAnalysis(
        mockConnections,
        mockUserProfile
      );

      expect(analysis.specificOpportunities).toEqual([]);
      expect(analysis.strategicInsights.marketPositioning).toBe('Analysis unavailable');
    });
  });

  describe('generateTargetedAlignmentReport', () => {
    it('should generate comprehensive report for single connection', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            connections: [{
              ...mockDiscoveredConnection,
              careerAlignment: {
                ...mockCareerAlignment,
                overallScore: 92,
                confidenceLevel: 'high'
              }
            }]
          })
        }
      });

      const report = await careerAlignmentAnalyzer.generateTargetedAlignmentReport(
        mockDiscoveredConnection,
        mockUserProfile,
        'Advance to senior product management roles'
      );

      expect(report.overallScore).toBe(92);
      expect(report.confidenceLevel).toBe('high');
      expect(report.actionableInsights).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle Gemini API failures gracefully', async () => {
      const mockConnections = [mockDiscoveredConnection];

      mockModel.generateContent.mockRejectedValue(new Error('Gemini API error'));

      const result = await careerAlignmentAnalyzer.analyzeCareerAlignment(mockConnections, mockUserProfile);

      expect(result).toBeDefined();
      expect(result.analyzedConnections).toHaveLength(1);
      expect(result.analyzedConnections[0].careerAlignment).toBeDefined();
    });

    it('should handle invalid JSON responses', async () => {
      const mockConnections = [mockDiscoveredConnection];

      mockModel.generateContent.mockResolvedValue({
        response: { text: () => 'Invalid JSON response' }
      });

      const result = await careerAlignmentAnalyzer.analyzeCareerAlignment(mockConnections, mockUserProfile);

      expect(result.analyzedConnections).toHaveLength(1);
      // Should use default alignment when parsing fails
      expect(result.analyzedConnections[0].careerAlignment.overallScore).toBe(50);
    });

    it('should handle empty connections array', async () => {
      const result = await careerAlignmentAnalyzer.analyzeCareerAlignment([], mockUserProfile);

      expect(result.analyzedConnections).toEqual([]);
      expect(result.portfolioInsights).toBeDefined();
      expect(result.careerTrajectoryInsights).toBeDefined();
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', () => {
      expect(() => careerAlignmentAnalyzer.clearCache()).not.toThrow();
    });
  });
});