## Feature: Warm Intro Email Generator

## 1.0 Introduction/Overview

This document outlines the requirements for a "Warm Intro Email Generator" feature. The goal is to empower users to leverage their newly discovered "Closest Connections" by automatically generating a personalized, forwardable email. The user will provide their specific "ask" and a reason for the connection, and the system will combine this with the user's resume, the mutual connection's name, and AI-driven research on the target person to craft a compelling introductory email.

## 2.0 Goals

-   To transform the "Closest Connections" list from a static resource into an actionable tool.
-   To drastically reduce the friction and effort required for a user to request a warm introduction.
-   To increase the success rate of introduction requests by generating high-quality, personalized, and persuasive email drafts.
-   To provide a seamless and intuitive user experience for generating, customizing, and using the email draft.

## 3.0 User Stories

-   As a user, I want to click a button next to a "Closest Connection" so that I can start the process of getting an introduction to the target person.
-   As a user, I want to be prompted to enter my specific "ask" and my reason for wanting to meet the target person, so that the generated email is tailored to my goals.
-   As a user, I want the system to automatically gather context about myself (from my resume) and the target person, so that the email feels deeply personalized and well-researched.
-   As a user, I want the generated email to be editable directly in the UI, so I can make small tweaks to fit my personal voice.
-   As a user, I want to easily copy the final email content to my clipboard, so I can paste it into my email client.
-   As a user, I want a "Regenerate" button in case the first draft isn't quite right, so I can get a new version without starting over.

## 4.0 Functional Requirements

### 4.1 UI & Trigger

1.  A "shiny mail icon" button shall be displayed next to each of the 10 connections in the `ClosestConnectionsModal` results list.
2.  Clicking this mail icon will initiate the email generation flow.

### 4.2 User Input Modals

1.  Upon clicking the mail icon, a sequence of two modals shall appear.
2.  **Modal 1 ("Why This Person"):** This modal will prompt the user to answer the question, "Why do you want to meet this person?" with a text input field.
3.  **Modal 2 ("What's Your Ask"):** After the first modal, a second modal will appear, prompting the user with, "What's your specific ask?" (e.g., "a 15-minute call," "advice on X").
4.  These modals must be completed to proceed.

### 4.3 Backend & AI
1.  A new API endpoint `/api/get-target-experience` shall be created.
    -   It will accept a target contact's details (e.g., name, company, LinkedIn URL).
    -   It will use an LLM to search for and return a summary of the target's key professional experiences and achievements.
2.  A new API endpoint `/api/generate-intro-email` shall be created.
    -   It will accept the following data:
        -   User's Profile (`UserProfile`)
        -   Mutual Connection's Name (string)
        -   Target Person's Name (string)
        -   Target Person's Experience (from the new API)
        -   User's "Why This Person" answer (string)
        -   User's "What's Your Ask" answer (string)
    -   It will use the provided "Warm Intro Email Generator Prompt" to generate a complete email, including subject and body.
    -   It will return the generated email as a JSON object (e.g., `{ subject: "...", body: "..." }`).

### 4.4 Email Generation & Display

1.  After the user completes the input modals, a new "Email Generation" modal will appear.
2.  This modal will initially show a loading state while the backend APIs are working.
3.  Upon success, the modal will display the generated email in a clean, professional-looking format. A good design would be a styled container with "To:", "Subject:", and "Body" sections. The "To:" field should be pre-filled with the mutual connection's name.
4.  The email body content within this view **must** be editable. A `contentEditable` `div` or a styled `<textarea>` should be used.
5.  A "Copy to Clipboard" button shall be present to copy the entire email body.
6.  A "Regenerate" button shall be present. Clicking it will re-run the `/api/generate-intro-email` call with the exact same inputs and display the new result.
7.  An error state shall be designed in case the email generation fails.

## 5.0 Non-Goals (Out of Scope)

-   This feature will **not** send the email directly. It is a draft generator only.
-   The system will **not** track whether the email was sent or if the introduction was successful.
-   We will not be building a full-fledged rich text editor. Plain text editing is sufficient for now.

## 6.0 Design Considerations

-   The UI should be clean, modern, and guide the user step-by-step through the process.
-   The mail icon button should have a subtle hover effect to indicate interactivity.
-   Loading states should be clear and reassuring to the user.
-   The final email display should be easy to read and feel professional.

## 7.0 Success Metrics

-   Percentage of "Closest Connections" views that result in an email draft being generated.
-   User feedback on the quality and relevance of the generated emails.
-   Reduction in time-on-page for the results modal, indicating users are successfully moving to the next step (drafting).

## 8.0 Open Questions
- None at this time. 