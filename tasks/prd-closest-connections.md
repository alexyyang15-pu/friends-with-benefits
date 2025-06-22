# PRD: Closest Connections Feature

## 1. Introduction/Overview

This document outlines the requirements for the "Closest Connections" feature. This feature will allow users to select one of their "warm contacts" (fwb) and discover the 10 professional connections from their own network who are most closely related to that individual. The goal is to provide users with new, high-potential networking leads without needing to ask their warm contact for an introduction directly. The analysis of "closeness" will be powered by an LLM.

## 2. Goals

*   **Discover New Leads:** Enable users to identify and explore the 10 closest professional connections to any of their saved warm contacts.
*   **Provide Actionable Data:** For each discovered connection, provide their name, role, company, LinkedIn profile, and a professional email address.
*   **Frictionless Networking:** Remove the social friction and dependency of asking a contact "who should I meet?"
*   **AI-Powered Closeness Score:** Utilize an LLM to analyze and determine the "closeness" between the warm contact and other connections based on shared professional data.

## 3. User Stories

*   **As a user,** I want to select one of my warm contacts so that I can explore their professional network for new leads.
*   **As a user,** I want to see a list of the 10 people in my network who are most closely connected to my warm contact so I can identify high-potential individuals to reach out to.
*   **As a user,** I want to see a simple explanation of *why* two people are considered close connections (e.g., "Worked together at Google") to better contextualize my outreach.
*   **As a user,** I want to easily access the LinkedIn profile and professional email for each new connection so I can take immediate action.

## 4. Functional Requirements

1.  **Trigger Point:** A button or link labeled "Find Closest Connections" shall be added to the `ContactDetailsModal` view for each warm contact.
2.  **API Call:** Clicking this button shall trigger an asynchronous API call to a new endpoint (e.g., `/api/find-closest-connections`). The request will include the details of the selected warm contact.
3.  **Backend Analysis:** The backend will receive the request and perform the following actions:
    *   Take the target warm contact's data.
    *   Take the user's entire list of connections as the pool to search from.
    *   Send a prompt to the Gemini LLM containing the target contact and the connection pool.
4.  **LLM Closeness Prompt:** The prompt will instruct the LLM to act as a networking expert and identify the 10 connections from the pool that have the strongest professional relationship with the target contact. The criteria for "closeness" will include:
    *   Current or past employment at the same company.
    *   Attendance at the same school/university.
    *   Similar roles, skills, or keywords listed in their `Position` or `Company`.
5.  **LLM Closeness Response:** The LLM must return a JSON object containing a list of the 10 closest connections. For each connection, it must include a brief `reason` (string) explaining the basis for the close connection.
6.  **Email Discovery:** For each of the 10 connections returned by the analysis, a subsequent LLM call will be made to find their professional email address.
    *   **Prompt:** `"Based on public information, what is the most likely professional email for [Name] who works at [Company]?"`
7.  **Display View:** The results will be displayed in a new, detailed view (e.g., a new modal that replaces the contact details modal).
8.  **Result Details:** This view will list the 10 connections, and each entry must display:
    *   Full Name
    *   Position & Company
    *   A link to their LinkedIn Profile
    *   The discovered professional email (with a "copy to clipboard" button)
    *   The "reason" for their closeness.
9.  **Loading State:** A clear loading indicator must be displayed while the backend analysis is in progress.
10. **Error Handling:** If no connections are found or if an error occurs, a user-friendly message should be displayed.

## 5. Non-Goals (Out of Scope)

*   This feature **will not** scrape LinkedIn for real-time interaction data (likes, comments, etc.).
*   The initial version **will not** provide a numerical rank or score for the 10 connections.
*   The analysis is restricted to the user's existing 1st-degree connections list. It **will not** search for 2nd or 3rd-degree connections.

## 6. Design Considerations

*   A new button needs to be designed for the `ContactDetailsModal`.
*   A new modal or full-screen view is required to present the list of 10 closest connections. The design should be clean, scannable, and prioritize readability and clear calls to action.

## 7. Technical Considerations

*   A new API endpoint `/api/find-closest-connections` is required.
*   The implementation should handle multiple concurrent LLM calls efficiently to find emails after the initial analysis.
*   The main analysis prompt sent to the LLM is critical and will require careful engineering to get the best results.

## 8. Success Metrics

*   **Feature Adoption:** Percentage of users who click the "Find Closest Connections" button.
*   **Task Success Rate:** Percentage of analyses that successfully return a list of connections.

## 9. Open Questions

*   How should the UI handle cases where fewer than 10 close connections are found?
*   Should we implement caching to avoid re-running the same analysis for a contact within a short time frame to manage API costs?
*   How should we display a connection if a professional email cannot be found? 