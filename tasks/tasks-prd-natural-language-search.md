## Relevant Files

- `app/api/search/route.ts` - New API route handler for processing search queries.
- `app/api/search/route.test.ts` - Unit tests for the search API route.
- `lib/gemini.ts` - New utility file to encapsulate the Gemini API integration logic.
- `lib/gemini.test.ts` - Unit tests for the Gemini utility functions.
- `app/page.tsx` - The main page component; will be modified to call the search API and display results.
- `app/page.test.tsx` - Unit tests for the new search functionality in the main page component.

### Notes

- Unit tests should typically be placed alongside the code files they are testing.
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [x] 1.0 Setup Backend API for Natural Language Search
  - [x] 1.1 Create a new API route file at `app/api/search/route.ts`.
  - [x] 1.2 Implement a `POST` handler that receives the user's `query` and the `connections` list in the request body.
  - [x] 1.3 Define TypeScript interfaces for the request body and the expected API response.
  - [x] 1.4 Add basic error handling for invalid requests.
- [ ] 2.0 Integrate Gemini API for Query Processing
  - [x] 2.1 Create a new utility file at `lib/gemini.ts`.
  - [x] 2.2 Add the Google Generative AI SDK to the project (`npm install @google/generative-ai`).
  - [x] 2.3 Implement a function that takes a natural language query and constructs a prompt for the Gemini API to convert it into structured JSON criteria.
  - [x] 2.4 Securely manage the Gemini API key using environment variables (`.env.local`).
  - [x] 2.5 Call this function from the `/api/search` route.
- [x] 3.0 Implement Search and Ranking Logic on the Backend
  - [x] 3.1 In the `/api/search` route, take the structured criteria from Gemini and filter the `connections` list.
  - [x] 3.2 Implement a function to handle semantic matching (e.g., "big tech" matches "Google").
  - [x] 3.3 Create a ranking function that scores each connection based on how well it matches the query criteria.
  - [x] 3.4 Implement fallback logic to return the next best results if no exact matches are found.
  - [x] 3.5 Return the sorted and ranked list of connections from the API endpoint.
- [x] 4.0 Connect Frontend to Search API
  - [x] 4.1 In `app/page.tsx`, create a new state to store the search results.
  - [x] 4.2 Modify the search button's `onClick` handler to call the `/api/search` endpoint with the user's query and the `connections` state.
  - [x] 4.3 Implement loading and error states for the API call (e.g., set `isProcessing` to true during the fetch).
- [x] 5.0 Display Ranked Search Results in the UI
  - [x] 5.1 In `app/page.tsx`, replace the `filteredConnections` logic with the new state that holds results from the API.
  - [x] 5.2 Update the component that renders the connection list to display the ranked search results.
  - [x] 5.3 Implement a visual cue (e.g., highlighting) to show why a specific result was returned.
  - [x] 5.4 Add a message to the UI to inform the user when the search is in progress or if no results were found. 