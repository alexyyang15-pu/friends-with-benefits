# PRD: Enhanced Semantic Search with Contextual Inference

## 1. Introduction/Overview

This document outlines the requirements for a significant enhancement to the Natural Language Search feature. While the current search is functional, it relies heavily on direct matches within the `Position` and `Company` fields. This enhancement will make the search "smarter" by empowering the LLM to infer contextual information, such as a company's industry or a person's likely role, even when it's not explicitly stated.

The goal is to move from a keyword-based semantic search to a truly context-aware search, allowing users to find highly relevant connections that would otherwise be missed.

## 2. Goals

*   **Improve Search Intelligence:** Enhance the search algorithm to understand the context behind a connection's company and role, not just the literal text.
*   **Increase Result Accuracy:** Drastically improve the relevance of search results for queries that imply a specific industry or role type (e.g., "VC investor," "startup founder").
*   **Create a Seamless Experience:** Integrate these new, smarter results directly into the existing list without complicating the UI.
*   **Manage User Expectations:** Provide clear visual feedback (e.g., a progress bar) to account for a potentially longer search time.

## 3. User Stories

*   **As a user,** I want to search for "VC investors" and find partners at Andreessen Horowitz, even if their title doesn't explicitly say "Investor."
*   **As a user,** I want to search for "people in ad-tech" and find a software engineer at The Trade Desk, even if "ad-tech" is not in their job title.
*   **As a user,** I want to search for "early-stage founders" and find the CEO of a recently founded small company, inferring that they are a founder.

## 4. Functional Requirements

1.  **Contextual Query Analysis:** The backend must instruct the Gemini API to perform a deeper, context-aware analysis of the user's query and the list of connections.
2.  **Company and Role Inference:** The LLM's prompt must be updated to request that it uses its general knowledge to analyze each connection. It should infer the company's industry (e.g., identifying a company as a "VC fund") and the person's likely role based on their title and company context.
3.  **Integrated Ranking:** The ranking algorithm must be updated to seamlessly incorporate these new contextual signals. An inferred match (e.g., a "Partner" at a company the LLM identifies as a VC fund) should be scored and ranked alongside direct matches.
4.  **Seamless Result Display:** Results found through contextual inference should be displayed in the same format as all other results, with no special visual distinction.
5.  **Loading Animation:** The frontend must display a progress bar or a more descriptive loading animation (e.g., "Analyzing connections...") to keep the user informed during the potentially longer search process.

## 5. Non-Goals (Out of Scope)

*   Using any external, real-time APIs for company data lookups in this version.
*   Allowing users to manually correct or tag companies and roles.
*   Displaying the "reasoning" behind an inferred result in the UI.

## 6. Design Considerations

*   The existing loading indicator should be replaced with a more engaging progress bar animation to better manage the user's perception of wait time.
*   The transition from the search input to the loading state and then to the results should be smooth and clear.

## 7. Technical Considerations

*   The prompt sent to the Gemini API will become significantly more complex, likely involving sending the entire list of connections for analysis in a single call.
*   The overall latency of the `/api/search` endpoint will increase. The system must be designed to handle these longer response times gracefully.
*   The ranking logic will need to be refined to appropriately score and balance direct matches against these new, powerful inferred matches.

## 8. Success Metrics

*   A significant increase in relevant results for context-based queries (e.g., a search for "VCs" returning more than just people with "VC" in their title).
*   Positive user feedback on the "intelligence" and accuracy of the search feature.
*   High user retention and engagement with the search feature.

## 9. Open Questions

*   How should the ranking algorithm weigh a direct title match versus a contextually inferred match? For example, is "Venture Partner" at "Sequoia Capital" more or less relevant than "Investor" at "Bob's Investments"?
*   What is the maximum acceptable search duration for the user? Should we implement a timeout on the API request? 