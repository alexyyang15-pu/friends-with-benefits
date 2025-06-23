# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Google API Key for Gemini AI (used by existing app features)
GEMINI_API_KEY=your_google_api_key_here

# Google API Key for Stagehand (Stagehand requires this specific variable name)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here

# Optional: BrowserBase credentials for production Stagehand usage
# BROWSERBASE_API_KEY=your_browserbase_api_key_here
# BROWSERBASE_PROJECT_ID=your_browserbase_project_id_here
```

## Setup Steps:

1. **Get your Google API key**:
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Copy the key

2. **Create `.env.local` file**:
   ```bash
   # Create the file in your project root
   touch .env.local
   ```

3. **Add your API key**:
   ```bash
   # Replace YOUR_ACTUAL_API_KEY with your real Google API key
   echo "GEMINI_API_KEY=YOUR_ACTUAL_API_KEY" >> .env.local
   echo "GOOGLE_GENERATIVE_AI_API_KEY=YOUR_ACTUAL_API_KEY" >> .env.local
   ```

4. **Restart your development server**:
   ```bash
   npm run dev
   ```

## Why Two Variables?

- `GEMINI_API_KEY` is used by your existing search and AI features
- `GOOGLE_GENERATIVE_AI_API_KEY` is specifically required by Stagehand internally for Google models
- Both variables should have the **same Google API key value**
- This is a limitation of how Stagehand handles Google model authentication

## Verification

After setup, you should see in your logs:
```
🔍 Scraping location for: [Name]
📍 Profile URL: https://linkedin.com/in/...
✅ Profile loaded successfully, starting location extraction...
```

Instead of the API key error. 