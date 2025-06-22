## Relevant Files

-   `app/api/get-target-experience/route.ts` - New API route to get a summary of a target contact's professional background.
-   `app/api/generate-intro-email/route.ts` - New API route that takes all context and generates the final email draft.
-   `lib/gemini.ts` - Will be updated with new functions for the experience summary and email generation prompts.
-   `lib/types.ts` - Will be updated with new types for the email generation flow.
-   `components/ui/closest-connections-modal.tsx` - Will be modified to include the new "shiny mail icon" button.
-   `components/ui/email-input-modals.tsx` - New component file to house the sequence of modals for user input ("Why This Person" and "What's Your Ask").
-   `components/ui/email-generation-modal.tsx` - New component to display the final generated email, with controls for editing, copying, and regenerating.
-   `app/page.tsx` - Will be updated to manage the state for the new modals and the email generation flow.

### Notes

-   We will build the UI components first, then wire them up to the backend APIs.
-   Careful state management will be crucial to pass data between the different modals and components.

## Tasks

-   [x] **1.0 Backend: Create APIs for Target Research and Email Generation**
    -   [x] 1.1 In `lib/gemini.ts`, create a new function `getExperienceSummary` that accepts a contact's details and returns an AI-generated summary of their career.
    -   [x] 1.2 Create the new API route `app/api/get-target-experience/route.ts` that calls the `getExperienceSummary` function.
    -   [x] 1.3 In `lib/gemini.ts`, create a new function `generateIntroEmail` that takes all the required context (user profile, target info, user's ask, etc.) and uses the detailed prompt to return a JSON object with `subject` and `body`.
    -   [x] 1.4 Create the new API route `app/api/generate-intro-email/route.ts` that calls the `generateIntroEmail` function.

-   [x] **2.0 Frontend: Implement UI Trigger and State Management**
    -   [x] 2.1 In `components/ui/closest-connections-modal.tsx`, add a new "shiny mail icon" button to each result item. A good choice from `lucide-react` would be the `MailForward` icon.
    -   [x] 2.2 In `app/page.tsx`, add new state variables to manage:
        -   The visibility of the user input modals.
        -   The visibility of the final email generation modal.
        -   The currently selected "closest connection" for the email flow.
        -   The user's answers for "ask" and "why".
    -   [x] 2.3 Pass the necessary state and handlers from `app/page.tsx` down to `ClosestConnectionsModal`.

-   [x] **3.0 Frontend: Build User Input Modals**
    -   [x] 3.1 Create the new file `components/ui/email-input-modals.tsx`.
    -   [x] 3.2 Build the first modal to capture the "Why This Person" input. It should have a title, a text area, and a "Next" button.
    -   [x] 3.3 Build the second modal to capture the "What's Your Ask" input. It should have a title, a text area, a "Back" button, and a "Generate Email" button.
    -   [x] 3.4 Implement the logic to show these modals in sequence and save the user's input to the state managed in `app/page.tsx`.

-   [x] **4.0 Frontend: Build Email Generation Modal**
    -   [x] 4.1 Create the new file `components/ui/email-generation-modal.tsx`.
    -   [x] 4.2 On mount, this component should trigger the full end-to-end data fetching process: first call `/api/get-target-experience`, then call `/api/generate-intro-email`.
    -   [x] 4.3 Design and implement a loading state to be displayed while the email is being generated.
    -   [x] 4.4 Design and implement the success state, displaying the `subject` and `body` in a clean, email-like format. Ensure the body is editable.
    -   [x] 4.5 Add a "Copy" button that copies the email body to the clipboard.
    -   [x] 4.6 Add a "Regenerate" button that re-triggers the `/api/generate-intro-email` API call.
    -   [x] 4.7 Design and implement an error state in case any of the API calls fail.

-   [x] **5.0 Final Integration and Testing**
    -   [x] 5.1 Ensure the state flows correctly between all the new components: from the mail icon click, through the input modals, to the final generation modal.
    -   [x] 5.2 Manually test the entire feature end-to-end to ensure it meets all requirements in the PRD.
    -   [x] 5.3 Add the new type `GeneratedEmail` (with `subject` and `body`) to `lib/types.ts`.
