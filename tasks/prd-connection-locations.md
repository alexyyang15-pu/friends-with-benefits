# PRD: Connection Locations

## 1. Introduction/Overview

This document outlines the requirements for a new feature, "Connection Locations," which will enrich the existing LinkedIn connection data with geographical location information. The core of this feature involves creating a script to scrape the location from each connection's public LinkedIn profile.

The primary goal is to enhance the user's ability to search and filter their network by location (e.g., "VCs in New York City"), providing a powerful new dimension for finding relevant contacts.

**Warning:** The data sourcing method for this feature, direct web scraping of LinkedIn profiles, is explicitly against the LinkedIn User Agreement and carries significant risks, including the potential for the user's LinkedIn account to be temporarily or permanently restricted. The implementation must proceed with caution.

## 2. Goals

-   Implement a script to scrape location data from LinkedIn profiles using their URLs.
-   Store the scraped location data persistently on the client-side.
-   Update the AI-powered search to understand and filter by location.
-   Display location information within the contact details view in the UI.

## 3. User Stories

-   **As a user,** I want to run a process that finds the location for all my connections so that I can see where my professional network is geographically distributed.
-   **As a user,** I want to search for connections by city or country (e.g., "Product Managers at Google in London") so that I can identify contacts in specific areas.
-   **As a user,** I want to see a contact's location when I view their details so that I have more context about them.

## 4. Functional Requirements

1.  **Initiate Scraping:** The system must provide a UI element (e.g., a button) that allows the user to start the location scraping process for all imported connections.
2.  **Scraping Process:** The script must iterate through each connection that has a profile URL. For each URL, it should:
    a. Navigate to the LinkedIn profile page.
    b. Extract the location string (e.g., "San Francisco Bay Area").
    c. Handle cases where a profile is private or a location is not listed.
3.  **Data Storage:** The extracted location string must be saved and associated with the corresponding connection. This enriched connection data should be persisted in the browser's `localStorage` to avoid re-scraping on subsequent visits.
4.  **Error Handling:** If a location cannot be found for a contact, the system should store a null value and continue to the next contact without interrupting the entire process. The UI should simply not display the location for that contact.
5.  **Search Integration:** The AI-powered search functionality must be updated.
    a. The prompt sent to the Gemini API must be modified to include the new `location` field in the data for each connection.
    b. The prompt instructions should be updated to make the AI aware of the location field and its importance in filtering results.
6.  **UI - Display Location:** The `ContactDetailsModal` component must be updated to display the contact's location if it exists.
7.  **UI - Process Feedback:** The UI must provide clear feedback that the scraping process is running, as it will be a long-running task. This should include a visual indicator (e.g., progress bar, spinner) and a status message.

## 5. Non-Goals (Out of Scope)

-   The feature will not attempt to guess or infer a location if it is not explicitly stated on the user's profile.
-   The feature will not parse or standardize complex location strings (e.g., "Greater New York City Area" vs. "New York, NY"). It will store the string as-is.
-   The feature will not involve a backend server for scraping; the entire process will be managed client-side in the browser.
-   This feature will not provide real-time location updates. The data is based on a one-time scrape.

## 6. Design Considerations

-   **Triggering Scraping:** An "Enrich with Location Data" button could be placed near the top of the "Your fwb" section.
-   **Location Display:** Inside the `ContactDetailsModal`, the location should appear below the contact's company, perhaps with a small map pin icon.
-   **Progress Indication:** When scraping is active, a persistent banner or status bar at the bottom of the page could show the progress (e.g., "Processed 50/500 connections...").

## 7. Technical Considerations

-   **Scraping Library:** A browser automation library like **Puppeteer** will be required to control a headless browser instance for scraping.
-   **Authentication:** The script will need the user's LinkedIn credentials to log in. **These credentials must never be hardcoded.** They should be stored securely, for example, in a `.env.local` file that is not committed to version control. The user must be clearly warned about the security implications.
-   **Scraping Robustness:** The scraper must include mechanisms to reduce the chance of being blocked, such as:
    -   Randomized delays between page loads.
    -   A realistic User-Agent string.
-   **State Management:** The application's state management should be updated to handle the enriched connection data. The `connections` array in the main state should be updated with the new location information and synced with `localStorage`.

## 8. Success Metrics

-   The location for over 80% of connections with a public profile can be successfully retrieved and stored.
-   A user can perform a search query like "Founders in Germany" and receive a list of relevant, location-filtered results.

## 9. Open Questions

-   How should the application best guide the user to provide their LinkedIn credentials securely for the scraper to use?
-   What is the desired level of detail for the progress indicator during the scraping process? A simple percentage, or a log of which profiles are being processed? 