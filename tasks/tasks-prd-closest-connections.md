## Relevant Files

-   `app/api/find-closest-connections/route.ts` - New API route to handle the core LLM analysis for finding the 10 closest connections.
-   `app/api/find-email/route.ts` - New API route dedicated to finding a professional email for a given contact.
-   `lib/gemini.ts` - Will be updated to include the new prompt functions for closeness analysis and email discovery.
-   `lib/types.ts` - Will be updated with new types for the closest connections and their discovered data.
-   `app/page.tsx` - Will be updated to manage the state for the new results modal.
-   `components/ui/contact-details-modal.tsx` - Will be modified to include the "Find Closest Connections" button that triggers the feature.
-   `components/ui/closest-connections-modal.tsx` - New component to display the list of discovered connections, their details, and the reasons for their closeness.

### Notes

-   We will focus on robust loading and error states to ensure a smooth user experience, especially given the multiple API calls involved.
-   Prompts for the LLM will be engineered carefully to ensure accurate and well-formatted JSON responses.

## Tasks

-   [x] **1.0 Backend: Create API for Closeness Analysis**
    -   [x] 1.1 Create the file `app/api/find-closest-connections/route.ts`.
    -   [x] 1.2 Implement a `POST` handler that accepts a target `Connection` and the full `connections` list.
    -   [x] 1.3 Add a new function in `lib/gemini.ts` that contains the prompt to find the 10 closest connections.
    -   [x] 1.4 The prompt should instruct the LLM to return a JSON object with a `results` key, containing an array of 10 connections, each with a `reason` field.
    -   [x] 1.5 Call the new Gemini function from the API route and return the results.

-   [x] **2.0 Backend: Create API for Email Discovery**
    -   [x] 2.1 Create the file `app/api/find-email/route.ts`.
    -   [x] 2.2 Implement a `POST` handler that accepts a contact's `First Name`, `Last Name`, and `Company`.
    -   [x] 2.3 Add a new function in `lib/gemini.ts` with a prompt to find a professional email address.
    -   [x] 2.4 The prompt should instruct the LLM to return a JSON object with an `email` key.
    -   [x] 2.5 Call the new Gemini function from the API route and return the result.

-   [x] **3.0 Frontend: Implement "Find Closest Connections" UI Trigger**
    -   [x] 3.1 In `app/page.tsx`, add state to manage the visibility of the new `ClosestConnectionsModal` and store the currently selected contact for analysis.
    -   [x] 3.2 In `components/ui/contact-details-modal.tsx`, add a new button labeled "Find Closest Connections".
    -   [x] 3.3 When clicked, this button should close the current modal and open the `ClosestConnectionsModal`, passing the selected contact's data.

-   [x] **4.0 Frontend: Build Closest Connections Results View**
    -   [x] 4.1 Create the new file `components/ui/closest-connections-modal.tsx`.
    -   [x] 4.2 The component should accept the target `Connection` as a prop and have its own internal state for loading, errors, and the results list.
    -   [x] 4.3 On mount, it should call the `/api/find-closest-connections` API.
    -   [x] 4.4 Upon receiving the list of 10 connections, it should make parallel calls to `/api/find-email` for each one.
    -   [x] 4.5 Design a loading state to show while the analysis is running.
    -   [x] 4.6 Design the results list, displaying each connection's name, role, company, "reason", a link to their LinkedIn profile, and their discovered email with a "copy" button.
    -   [x] 4.7 Design an error state in case the analysis fails.

-   [x] **5.0 Frontend: Final Integration and State Management**
    -   [x] 5.1 Ensure the state flow between `app/page.tsx`, `ContactDetailsModal`, and `ClosestConnectionsModal` is working correctly.
    -   [x] 5.2 Add new types to `lib/types.ts` for the `ClosestConnection` (a `Connection` with a `reason` and `email` field).
    -   [ ] 5.3 Manually test the end-to-end flow to confirm all components work together as expected. 