## Feature: User Profile Upload and Analysis

## 1.0 Product Requirements

### 1.1 Overview
The application will be enhanced to allow users to upload a personal document (resume or LinkedIn profile PDF). The system will parse this document to create a structured user profile, including their work experience, skills, and education. This profile will then be used as context to provide more relevant and personalized results for the "Closest Connections" feature.

### 1.2 Goals
-   Provide a simple interface for users to upload their resume/profile.
-   Automate the extraction of key professional information from the uploaded document.
-   Persist the user's profile on the client-side for ease of use.
-   Significantly improve the relevance of the "Closest Connections" analysis by incorporating the user's own background.
-   Provide clear feedback to the user that their profile has been uploaded and is being used.

### 1.3 Functional Requirements
-   A new file upload component will be added to the main page.
-   The uploader will accept PDF files.
-   A new API endpoint (`/api/parse-document`) will handle parsing the PDF and extracting structured data using an LLM.
-   A new custom hook (`useUserProfile`) will manage storing and retrieving the user profile from `localStorage`.
-   The "Find Closest Connections" feature will be updated to send the user's profile along with the target contact.
-   The underlying LLM prompt for the closeness analysis will be updated to leverage the user's profile for a richer, more contextual search.

## 2.0 Implementation Plan

### Relevant Files
-   `tasks/tasks-prd-user-profile.md`: This document.
-   `app/api/parse-document/route.ts`: New API route for parsing the uploaded document.
-   `hooks/useUserProfile.ts`: New custom hook for managing user profile state.
-   `lib/gemini.ts`: Will be updated with a new function to extract profile data from text.
-   `app/page.tsx`: Will be updated to include the new upload UI and integrate the `useUserProfile` hook.
-   `components/ui/closest-connections-modal.tsx`: Will be updated to pass the user profile to its API call.
-   `app/api/find-closest-connections/route.ts`: Will be updated to accept the user profile data.
-   `package.json`: Will be updated to include a PDF parsing library.

### Tasks

-   [x] **1.0 Backend: Document Parsing API**
    -   [x] 1.1 Add a PDF parsing library (`pdf-parse`) to the project dependencies.
    -   [x] 1.2 Create the new API route file `app/api/parse-document/route.ts`.
    -   [x] 1.3 Implement a `POST` handler that accepts `multipart/form-data`.
    -   [x] 1.4 The handler should read the uploaded PDF file, extract its text content, and delete the temporary file.
    -   [x] 1.5 Create a new function in `lib/gemini.ts` called `extractProfileFromText` that takes the extracted text and returns a structured JSON object representing the user's profile (e.g., summary, experience, skills).
    -   [x] 1.6 Call the `extractProfileFromText` function from the API route and return the structured profile data.

-   [x] **2.0 Frontend: User Profile State Management**
    -   [x] 2.1 Create the new file `hooks/useUserProfile.ts`.
    -   [x] 2.2 Implement a custom hook that manages the user profile in a `useState` variable, initialized from `localStorage`.
    -   [x] 2.3 The hook should use an `useEffect` to save any changes to the profile back to `localStorage`.
    -   [x] 2.4 The hook should expose the profile, a setter function, and a function to clear the profile.

-   [x] **3.0 Frontend: UI for Profile Upload**
    -   [x] 3.1 In `app/page.tsx`, integrate the `useUserProfile` hook.
    -   [x] 3.2 Create a new component, `UserProfileUploader`, that contains the file input and handles the upload logic.
    -   [x] 3.3 The component should show a loading state while the document is being parsed.
    -   [x] 3.4 On successful upload, it should call the setter from the `useUserProfile` hook to save the profile.
    -   [x] 3.5 In `app/page.tsx`, conditionally render the `UserProfileUploader` or a summary of the uploaded profile (e.g., "Welcome, [User Name], [User Title]").

-   [x] **4.0 Integration: Enhance Closest Connections**
    -   [x] 4.1 In `app/api/find-closest-connections/route.ts`, update the `POST` handler to accept an optional `userProfile` object in its body.
    -   [x] 4.2 Update the `findClosestConnections` function in `lib/gemini.ts` to accept the `userProfile`. Modify the prompt to use this data to find connections that are more relevant to the *user*.
    -   [x] 4.3 In `components/ui/closest-connections-modal.tsx`, get the `userProfile` (you'll need to pass it as a prop from `app/page.tsx`).
    -   [x] 4.4 Include the `userProfile` in the body of the `fetch` request to `/api/find-closest-connections`.
    -   [ ] 4.5 Manually test the end-to-end flow. 