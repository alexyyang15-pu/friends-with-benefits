## Relevant Files

- `lib/gemini.ts` - Will be updated with a more complex prompt to handle contextual inference.
- `lib/gemini.test.ts` - Unit tests for the enhanced Gemini utility functions.
- `app/api/search/route.ts` - The search API handler; will be refactored to process the new data from Gemini.
- `app/api/search/route.test.ts` - Unit tests for the refactored search API route.
- `app/page.tsx` - The main page component; will be updated with the new loading animation.
- `components/ui/progress-bar.tsx` - A new component for the loading animation.

### Notes

- Unit tests should typically be placed alongside the code files they are testing.
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [ ] 1.0 Enhance Gemini Prompt for Contextual Inference
  - [ ] 1.1 Update the prompt in `lib/gemini.ts` to instruct the LLM to analyze each connection for contextual clues.
  - [ ] 1.2 The new prompt should ask the LLM to return a list of connections that match the user's query, including those that are inferred matches.
  - [ ] 1.3 The LLM should be instructed to provide a "reason" for each match.
- [x] 1.0 Enhance Gemini Prompt for Contextual Inference
  - [x] 1.1 Update the prompt in `lib/gemini.ts` to instruct the LLM to analyze each connection for contextual clues.
  - [x] 1.2 The new prompt should ask the LLM to return a list of connections that match the user's query, including those that are inferred matches.
  - [x] 1.3 The LLM should be instructed to provide a "reason" for each match.
- [x] 2.0 Refactor Backend to Process Inferred Results
  - [x] 2.1 Update the `getStructuredQuery` function to handle the new, more complex response from Gemini.
  - [x] 2.2 Refactor the search API in `app/api/search/route.ts` to rely on the results from the LLM instead of performing its own filtering and ranking.
  - [x] 2.3 Ensure the API returns the list of matched connections as determined by the LLM.
- [x] 3.0 Implement Enhanced Frontend Loading Animation
  - [x] 3.1 Create a new reusable `ProgressBar` component in `components/ui/progress-bar.tsx`.
  - [x] 3.2 This component should display an animated progress bar.
  - [x] 3.3 In `app/page.tsx`, replace the simple "Searching..." text with the new `ProgressBar` component.
  - [x] 3.4 Add a more descriptive message like "Analyzing connections..." to accompany the progress bar.
- [x] 4.0 Adapt Frontend to New API Response Structure
  - [x] 4.1 Update the `handleSearch` function in `app/page.tsx` to correctly parse the new API response.
  - [x] 4.2 Ensure the `searchResults` state is correctly updated with the data from the new response.
- [x] 5.0 Final Integration and Testing
  - [x] 5.1 Thoroughly test the new search functionality with a variety of queries to ensure accuracy and relevance.
  - [x] 5.2 Perform end-to-end testing to ensure the frontend and backend are correctly integrated.
  - [x] 5.3 Clean up any remaining console logs or placeholder code. 