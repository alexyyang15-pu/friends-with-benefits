# PRD: Natural Language Search for LinkedIn Connections

## 1. Introduction/Overview

This document outlines the requirements for a new Natural Language Search feature. Currently, users can upload their LinkedIn connections but lack an efficient way to search through them. This feature will introduce an intelligent search bar that allows users to find connections using conversational queries, making it easier and faster to locate the right people within their network.

The primary goal is to transform the raw list of connections into a searchable, intelligent database, moving beyond simple keyword matching to a more intuitive, semantic search experience.

## 2. Goals

*   **Enable Semantic Search:** Allow users to search their connections using natural, conversational language.
*   **Improve Discovery:** Help users find relevant connections even when they don't know the exact name, title, or company.
*   **Ranked Results:** Provide a ranked list of connections based on their relevance to the user's query, showing the best matches first.
*   **Intuitive UI:** Implement a user-friendly search interface that clearly presents results and the reasons for their relevance.

## 3. User Stories

*   **As a user,** I want to search for "VCs in New York" so that I can easily find potential investors in my network.
*   **As a user,** I want to search for "Product Managers at Google" to quickly find contacts at a specific company for networking purposes.
*   **As a user,** I want to search for "founders I connected with in 2023" so I can find people I met during a specific time period.
*   **As a user with no exact matches,** I want to see the "next best" or most closely related results so I can still find relevant people in my network.

## 4. Functional Requirements

1.  **Search Input:** The system must provide a text input field where users can type their natural language search queries.
2.  **Query Processing:** The system must use the Gemini API to parse the user's query into structured search criteria (e.g., `{role: "Product Manager", company: "Google"}`).
3.  **Connection Filtering:** The system must filter the uploaded list of LinkedIn connections based on the parsed criteria from the query.
4.  **Semantic Matching:** The search logic must handle queries that don't perfectly match connection data (e.g., a search for "big tech" should match connections at "Google," "Meta," "Amazon," etc.).
5.  **Relevance Ranking:** Search results must be ranked by relevance. Exact matches for all criteria should appear first. Partial matches should be ranked lower.
6.  **Fallback Results:** If no perfect matches are found, the system must display the next most relevant connections (e.g., a Product Manager at another large tech company if none are found at Google).
7.  **Result Display:** Each search result must clearly display the connection's First Name, Last Name, Company, and Position.
8.  **Result Justification:** The UI should provide a subtle visual cue (like highlighting) to indicate *why* a result was returned (e.g., highlighting the "Position" field that matched the query).
9.  **API Integration:** The frontend will trigger a search by calling a dedicated backend API endpoint (e.g., `/api/search`) which handles the interaction with the Gemini API.

## 5. Non-Goals (Out of Scope)

*   Auto-complete or search suggestions in the input field.
*   Advanced UI filters to refine results after the initial search.
*   Saving of user search history.
*   Support for languages other than English in V1.

## 6. Design Considerations

*   Results should be displayed in a clean, scrollable list of cards.
*   A loading indicator should be visible within the search bar or results area while the search is being processed.
*   The design should be simple and intuitive, focusing the user's attention on the search input and the results.

## 7. Technical Considerations

*   The backend will utilize the provided Gemini API for all natural language processing tasks.
*   To perform a search, the frontend will send the user's query and the entire list of connections to the `/api/search` endpoint.
*   The API call should be triggered on a form submission (e.g., pressing Enter or clicking a search button), not on every keystroke, to manage API usage effectively.

## 8. Success Metrics

*   **Result Relevance:** High user satisfaction with the quality and relevance of search results, measured via user feedback.
*   **Search Success Rate:** A high percentage of searches that return at least one relevant result.
*   **Time to Find:** A measurable reduction in the time it takes for a user to locate a specific connection compared to manual scrolling.

## 9. Open Questions

*   How should we handle pagination for queries that return a very large number of results?
*   What is the rate limit for the Gemini API? Do we need to implement client-side debouncing or server-side caching to manage it? 