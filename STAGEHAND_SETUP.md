# Stagehand LinkedIn Location Scraping Setup

This document explains how to set up and use the Stagehand integration for automated LinkedIn profile location scraping.

## Overview

The application now uses a **two-tier approach** for location enrichment:

1. **Stagehand Browser Automation** - Directly scrapes LinkedIn profiles using a headless browser
2. **AI Fallback** - Uses Gemini AI to infer locations when direct scraping fails

## Prerequisites

### Required Environment Variables

Create a `.env.local` file in your project root with the following:

```bash
# Required for both Stagehand and AI fallback
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: For production Stagehand usage via BrowserBase
BROWSERBASE_API_KEY=your_browserbase_api_key_here
BROWSERBASE_PROJECT_ID=your_browserbase_project_id_here
```

### Getting API Keys

1. **Gemini API Key**: 
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Copy the key to your `.env.local` file

2. **BrowserBase (Optional for Production)**:
   - Sign up at [BrowserBase](https://browserbase.com)
   - Create a project and get your API key
   - This provides more reliable browser automation in production

## How It Works

### Search Flow with Location Enrichment

1. **User searches** for connections (e.g., "VCs in New York")
2. **Results are returned** from the existing semantic search
3. **Location enrichment starts automatically** for profiles without location data
4. **For each connection**:
   - Try **Stagehand scraping** first (browser automation)
   - Fall back to **AI analysis** if scraping fails or is blocked
   - Display **real-time progress** with visual indicators

### Stagehand Configuration

The browser automation is configured in `stagehand.config.ts`:

```typescript
{
  env: "LOCAL", // Use LOCAL for dev, BROWSERBASE for production
  modelName: "google/gemini-2.0-flash",
  browserOptions: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
  },
  defaultNavigationTimeout: 30000,
  defaultTimeout: 10000,
}
```

## Usage

### Automatic Location Enrichment

Location enrichment happens automatically when you search for connections. The system will:

1. **Identify profiles** missing location data
2. **Show progress indicator** with current method (browser vs AI)
3. **Update results in real-time** as locations are found
4. **Display locations** in search results with a map pin icon

### Manual Testing

You can test the Stagehand integration directly:

```bash
# Test the scrape-location API
curl -X POST http://localhost:3000/api/scrape-location \
  -H "Content-Type: application/json" \
  -d '{"profileUrl": "https://linkedin.com/in/example"}'
```

## Error Handling & Fallbacks

### LinkedIn Authentication Walls

If LinkedIn requires authentication:
- **Stagehand will detect** the auth wall automatically  
- **Falls back to AI** method seamlessly
- **No user interruption** - process continues

### Rate Limiting Protection

- **1-second delays** between profile scrapes
- **Realistic browser headers** to avoid detection
- **Graceful degradation** to AI when blocked

### Network Issues

- **Timeouts handled gracefully** (30s navigation, 10s actions)
- **Connection errors** trigger AI fallback
- **Progress tracking** continues even with failures

## Performance Considerations

### Local Development
- **Slower but reliable** - each profile takes 3-5 seconds
- **Good for testing** small batches of connections
- **No external dependencies** beyond Gemini API

### Production (BrowserBase)
- **Faster and more reliable** - distributed browser instances
- **Better for large batches** of connections
- **Scales automatically** with demand

## Troubleshooting

### Common Issues

1. **"LinkedIn profile requires authentication"**
   - Normal behavior - AI fallback will activate
   - No action needed from user

2. **Slow performance**
   - Expected for local development
   - Consider BrowserBase for production

3. **No locations found**
   - Some profiles don't show locations publicly
   - AI will attempt to infer from company/other data

### Debug Logs

Check browser console and server logs for detailed information:
- Stagehand navigation status
- Extraction attempts and results  
- Fallback triggers and AI responses

## Security Notes

⚠️ **Important**: LinkedIn's Terms of Service prohibit automated scraping. This feature:
- Should be used **responsibly and sparingly**
- Is intended for **personal network analysis** only
- **Falls back to AI** when scraping is blocked
- **Does not store or share** scraped data beyond location strings

Consider the legal and ethical implications before deploying to production. 