# PRD: Warm Contacts Feature

## 1. Introduction/Overview

This document outlines the requirements for a "Warm Contacts" feature. The goal is to allow users to personally curate a list of "warm" connections—people they are comfortable asking for introductions. This feature will enhance the app's utility by providing a persistent, personalized list of key contacts directly on the main search page.

## 2. Goals

-   To provide users with a way to bookmark or save important connections.
-   To create a persistent list of these "warm contacts" that is saved across sessions.
-   To display this list in a dedicated "Your fwb" section for easy access.
-   To design an intuitive and engaging UI for adding and viewing these contacts.

## 3. User Stories

-   As a user, I want to mark a connection as "warm" so that I can easily find them again later.
-   As a user, I want my list of warm contacts to be saved if I refresh the page so that I don't lose my selections.
-   As a user, I want to see all my warm contacts in a dedicated section on the page so I can quickly review my key people.
-   As a user, I want a clear and satisfying animation when I mark someone as a warm contact so the interface feels responsive and fun.

## 4. Functional Requirements

1.  **Toggle Functionality:**
    -   Each person in the search results list must have a toggle control next to their name.
    -   When a user clicks the toggle to the "on" state, the corresponding connection shall be designated a "warm contact."
    -   The toggle should feature a visually appealing "lock-in-place" animation to provide clear user feedback.
    -   Clicking the toggle again should remove the person from the "warm contacts" list.

2.  **Persistence:**
    -   The list of warm contacts must be saved in the browser's local storage. This will ensure the list persists even if the user refreshes the page.
    -   The unique identifier for a contact will be their LinkedIn profile URL (`URL` field from the CSV).
    -   When a new `Connections.csv` is uploaded, the list of warm contacts should be checked against the new data. If a warm contact from local storage is present in the new file, they should remain on the warm contacts list.

3.  **"Your fwb" Section:**
    -   A new section titled "Your fwb" shall be displayed on the main page.
    -   This section will appear below the search bar but above the main search results.
    -   It will display a list of all connections that have been marked as warm contacts.
    -   The display format for each person in this list should be identical to the format in the main search results (including name, title, company, LinkedIn icon, and the reason popup).
    -   If no contacts are marked as warm, this section should be hidden entirely.

4.  **Data Integrity:**
    -   Adding a person to the "Your fwb" list should not remove them from the main search results list for the current search. They must appear in both places.

## 5. Non-Goals (Out of Scope)

-   This feature will not, at this time, include functionality for exporting the "Your fwb" list.
-   This feature will not involve a backend database. All persistence will be handled on the client-side via local storage.
-   The "Your fwb" list will not be re-orderable or manually sortable in this version.

## 6. Design Considerations

-   The toggle should be a custom-designed switch component. Its animation should be smooth and satisfying, providing a clear visual cue of the "locked-in" state.
-   The "Your fwb" section should be visually distinct but stylistically consistent with the rest of the page.

## 7. Success Metrics

-   Feature adoption will be measured by the number of unique users who add at least one person to their "Your fwb" list.
-   User engagement will be tracked by the average number of warm contacts saved per user.

## 8. Open Questions

-   Should there be a limit to the number of people a user can add to their "Your fwb" list? For now, we will assume no limit.
-   How should the "Your fwb" list be ordered? For now, we will order it by when the person was added, with the most recent additions appearing first. 