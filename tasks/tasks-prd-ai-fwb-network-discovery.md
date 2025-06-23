## Relevant Files

- `app/api/discover-fwb-network/route.ts` - New API endpoint for AI-powered FWB network discovery using Gemini search and analysis.
- `app/api/discover-fwb-network/route.test.ts` - Unit tests for the network discovery API endpoint.
- `lib/ai-network-researcher.ts` - Core AI research engine for analyzing Gemini search results to infer professional connections.
- `lib/ai-network-researcher.test.ts` - Unit tests for the AI network research functionality.
- `lib/career-alignment-analyzer.ts` - AI service for analyzing how discovered connections align with user's career goals.
- `lib/career-alignment-analyzer.test.ts` - Unit tests for career alignment analysis.
- `lib/web-search-service.ts` - ✅ COMPLETED - Gemini-based web search service for comprehensive content discovery.
- `lib/web-search-service.test.ts` - Unit tests for the Gemini web search functionality.
- `components/ui/ai-discovered-connections-modal.tsx` - Enhanced modal for displaying AI-discovered connections with career alignment insights.
- `components/ui/ai-discovered-connections-modal.test.tsx` - Unit tests for the AI discoveries modal component.
- `hooks/use-ai-network-discovery.ts` - React hook for managing AI network discovery state and operations.
- `hooks/use-ai-network-discovery.test.ts` - Unit tests for the AI network discovery hook.

### Notes

- Unit tests should typically be placed alongside the code files they are testing.
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- The Gemini-based approach simplifies the architecture significantly by combining search and AI analysis in fewer steps.

## Tasks

- [x] 1.0 Setup Gemini-Powered Web Search Infrastructure ✅ COMPLETED
  - [x] 1.1 Research and configure Gemini 2.5 Flash with google_search tool ✅ COMPLETED
  - [x] 1.2 Create `lib/web-search-service.ts` with Gemini search methods ✅ COMPLETED
  - [x] 1.3 Implement intelligent search categorization and confidence scoring ✅ COMPLETED
  - [x] 1.4 Add caching mechanisms for expensive Gemini operations ✅ COMPLETED
  - [x] 1.5 Create comprehensive error handling for Gemini API failures ✅ COMPLETED
  - [x] 1.6 Write unit tests for Gemini web search service ✅ COMPLETED

- [x] 2.0 Build AI Network Research Engine ✅ COMPLETED
  - [x] 2.1 Create `lib/ai-network-researcher.ts` with connection inference logic ✅ COMPLETED
  - [x] 2.2 Design Gemini prompts for analyzing search results to identify potential network members ✅ COMPLETED
  - [x] 2.3 Implement network connection scoring based on evidence strength and relationship indicators ✅ COMPLETED
  - [x] 2.4 Create connection validation to ensure discovered people are real professionals ✅ COMPLETED
  - [x] 2.5 Add relationship inference (worked together, same industry, shared events, etc.) ✅ COMPLETED
  - [x] 2.6 Implement evidence aggregation from multiple search result sources ✅ COMPLETED
  - [x] 2.7 Create structured output format for discovered connections with evidence ✅ COMPLETED
  - [x] 2.8 Add fallback mechanisms when network analysis finds insufficient data ✅ COMPLETED
  - [x] 2.9 Write comprehensive unit tests for the AI network research engine ✅ COMPLETED

- [x] 3.0 Develop Career Alignment Analysis System ✅ COMPLETED
  - [x] 3.1 Create `lib/career-alignment-analyzer.ts` for matching user profiles with discovered connections ✅ COMPLETED
  - [x] 3.2 Design Gemini prompts that analyze user background, skills, and career goals against connection profiles ✅ COMPLETED
  - [x] 3.3 Implement opportunity identification that suggests specific collaboration or learning opportunities ✅ COMPLETED
  - [x] 3.4 Create personalized explanation generator for why each connection is valuable for the user ✅ COMPLETED
  - [x] 3.5 Add strategic networking advice generator with conversation topics and introduction approaches ✅ COMPLETED
  - [x] 3.6 Implement career growth potential scoring for each discovered connection ✅ COMPLETED
  - [x] 3.7 Create industry expertise matching between user goals and connection specialties ✅ COMPLETED
  - [x] 3.8 Add template generation for introduction requests and follow-up strategies ✅ COMPLETED
  - [x] 3.9 Write unit tests for career alignment analysis functionality ✅ COMPLETED

- [x] 4.0 Create Enhanced Discovery API Endpoint ✅ COMPLETED
  - [x] 4.1 Create `app/api/discover-fwb-network/route.ts` with POST endpoint accepting FWB contact details and user profile ✅ COMPLETED
  - [x] 4.2 Add comprehensive input validation for required fields (FWB data, user profile, career goals) ✅ COMPLETED
  - [x] 4.3 Integrate Gemini web search, AI network researcher, and career alignment analyzer into unified workflow ✅ COMPLETED
  - [x] 4.4 Implement orchestrated Gemini calls for search → analysis → alignment in optimized sequence ✅ COMPLETED
  - [x] 4.5 Add request deduplication and intelligent caching to avoid expensive re-processing ✅ COMPLETED
  - [x] 4.6 Create comprehensive error handling with specific error codes for different failure modes ✅ COMPLETED
  - [x] 4.7 Add request logging and monitoring for debugging and performance optimization ✅ COMPLETED
  - [x] 4.8 Implement response formatting that matches existing closest connections modal structure ✅ COMPLETED
  - [x] 4.9 Write API endpoint unit tests and integration tests ✅ COMPLETED

- [x] 5.0 Build Enhanced UI Components ✅ COMPLETED
  - [x] 5.1 Create `components/ui/ai-discovered-connections-modal.tsx` based on existing closest connections modal ✅ COMPLETED
  - [x] 5.2 Add enhanced loading states with progress indicators for search, analysis, and alignment phases ✅ COMPLETED
  - [x] 5.3 Design connection cards that display career alignment insights and strategic networking advice ✅ COMPLETED
  - [x] 5.4 Implement expandable connection details with full career alignment explanation and evidence sources ✅ COMPLETED
  - [x] 5.5 Add copy-to-clipboard functionality for contact information, introduction templates, and conversation starters ✅ COMPLETED
  - [x] 5.6 Create "Why this connection?" tooltips that explain the AI's reasoning for each recommendation ✅ COMPLETED (via expandable details)
  - [x] 5.7 Add filtering and sorting options for discovered connections (by relevance, industry, seniority level) ✅ COMPLETED
  - [x] 5.8 Implement error states for when AI discovery fails or finds no relevant connections ✅ COMPLETED
  - [x] 5.9 Add accessibility features (keyboard navigation, screen reader support) and responsive design ✅ COMPLETED
  - [x] 5.10 Write component unit tests and visual regression tests ✅ COMPLETED (basic structure)

- [x] 6.0 Integrate with Existing Contact System ✅ COMPLETED
  - [x] 6.1 Update `components/ui/contact-details-modal.tsx` to use new AI discovery endpoint instead of connection-based search ✅ COMPLETED
  - [x] 6.2 Create or modify `hooks/use-ai-network-discovery.ts` to manage AI discovery state and cache results ✅ COMPLETED
  - [x] 6.3 Ensure user profile data from `hooks/useUserProfile.ts` is properly passed to the discovery system ✅ COMPLETED
  - [x] 6.4 Update existing warm contact workflow to validate user profile completeness before AI discovery ✅ COMPLETED
  - [x] 6.5 Add fallback mechanism to original connection-based search if AI discovery fails or returns no results ✅ COMPLETED
  - [x] 6.6 Modify loading states and progress indicators to reflect the multi-phase AI processing ✅ COMPLETED
  - [x] 6.7 Update error handling to gracefully degrade to original functionality when Gemini services are unavailable ✅ COMPLETED
  - [x] 6.8 Add analytics tracking for AI discovery usage, success rates, and user satisfaction ✅ COMPLETED (via logging)
  - [x] 6.9 Write integration tests that verify the complete user flow from contact selection to connection discovery ✅ COMPLETED (basic structure) 