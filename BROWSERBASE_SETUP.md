# BrowserBase Setup for LinkedIn Authentication

This guide will help you set up BrowserBase for persistent LinkedIn sessions, eliminating the need to repeatedly authenticate when scraping LinkedIn profiles.

## 🚀 Quick Setup

### Step 1: Get BrowserBase Account
1. Visit [https://browserbase.com](https://browserbase.com)
2. Sign up for a free account
3. Create a new project
4. Copy your **API Key** and **Project ID** from the dashboard

### Step 2: Update Environment Variables
Add your BrowserBase credentials to `.env.local`:

```bash
# Add these lines to your .env.local file:
BROWSERBASE_API_KEY=bb_live_xxxxxxxxxxxxxxxxxxxxx
BROWSERBASE_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Step 3: Test the Setup
```bash
# Test with a real LinkedIn profile URL
npm run test-linkedin-auth https://linkedin.com/in/your-profile-url
```

## 🔄 How It Works

### Initial Authentication (One-time)
1. **First Run**: BrowserBase opens a remote browser session
2. **Manual Login**: You log into LinkedIn manually in that session
3. **Session Saved**: BrowserBase saves the authenticated state
4. **Future Runs**: All subsequent runs reuse the authenticated session

### Persistent Sessions
- **Duration**: Sessions can persist for weeks or months
- **Automatic**: No need to re-authenticate for each scrape
- **Reliable**: Much more stable than local browser sessions
- **Scalable**: Can handle multiple concurrent sessions

## 🛠️ Configuration

Your project automatically detects BrowserBase credentials and switches modes:

```typescript
// Automatic detection in stagehand.config.ts
const useBrowserBase = process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID;

const config = {
  env: useBrowserBase ? "BROWSERBASE" : "LOCAL",
  // ... rest of config
};
```

## 🔍 Testing & Troubleshooting

### Test Authentication
```bash
# Test with default URL
npm run test-linkedin-auth

# Test with specific profile
npm run test-linkedin-auth https://linkedin.com/in/example-profile
```

### Expected Output (Success)
```
🔧 Stagehand configured for: BROWSERBASE mode
🌐 BrowserBase Project ID: your-project-id
🚀 Initializing LinkedIn authentication helper...
🌐 Using BrowserBase for persistent sessions
🔐 Checking LinkedIn authentication status...
✅ Already authenticated with LinkedIn!
📍 Scraping location from: https://linkedin.com/in/example
✅ Location extracted: "San Francisco, CA" (high)
🎉 Success! Location found: "San Francisco, CA"
```

### Expected Output (First Time)
```
🔧 Stagehand configured for: BROWSERBASE mode
🚀 Initializing LinkedIn authentication helper...
🌐 Using BrowserBase for persistent sessions
🔐 Checking LinkedIn authentication status...
🔑 LinkedIn authentication required
📱 BrowserBase session will open for manual login
   1. A browser window will open in BrowserBase
   2. Please log in to LinkedIn manually
   3. The session will be saved for future use
⏳ Waiting for login completion... (up to 3 minutes)
✅ Successfully authenticated with LinkedIn!
```

### Common Issues

#### 1. "BROWSERBASE mode but authentication timeout"
- **Cause**: Didn't complete LinkedIn login within 3 minutes
- **Solution**: Run the test again and complete login faster

#### 2. "LOCAL mode detected"
- **Cause**: BrowserBase credentials not set or incorrect
- **Solution**: Double-check your `.env.local` file

#### 3. "LinkedIn authentication required" on subsequent runs
- **Cause**: Session expired or was terminated
- **Solution**: Re-run authentication script to establish new session

## 🔐 Security & Best Practices

### LinkedIn Terms of Service
⚠️ **Important**: Use responsibly and in compliance with LinkedIn's Terms of Service
- Only scrape your own network connections
- Implement reasonable delays between requests
- Respect rate limits
- Don't share or store personal data beyond location strings

### BrowserBase Security
- Sessions are isolated and secure
- No credentials stored locally
- Automatic session cleanup after inactivity
- Enterprise-grade infrastructure

## 🚦 Integration with Your App

Your existing scraping API (`/api/scrape-location`) now automatically:

1. **Uses BrowserBase** if credentials are available
2. **Handles Authentication** transparently
3. **Maintains Sessions** across requests
4. **Falls back to AI** if scraping fails
5. **Provides Clear Feedback** on status

### Example API Response (Success)
```json
{
  "location": "San Francisco, CA",
  "source": "stagehand-browserbase",
  "confidence": "high"
}
```

### Example API Response (Auth Required)
```json
{
  "error": "LinkedIn authentication required",
  "location": null,
  "fallbackToAI": true
}
```

## 📊 Monitoring & Analytics

BrowserBase provides:
- **Session Inspector**: View real-time browser sessions
- **Session Replay**: Review past automation runs
- **Analytics**: Track success rates and performance
- **Logs**: Detailed debugging information

## 💰 Pricing

BrowserBase offers:
- **Free Tier**: Great for testing and small-scale use
- **Pay-as-you-go**: Scale as needed
- **Enterprise**: For production applications

Check [browserbase.com/pricing](https://browserbase.com/pricing) for current rates.

## 🔗 Useful Links

- [BrowserBase Dashboard](https://browserbase.com/dashboard)
- [BrowserBase Documentation](https://docs.browserbase.com)
- [Stagehand Documentation](https://docs.stagehand.dev)
- [LinkedIn Data Export](https://www.linkedin.com/settings/data-export-page)

## 🆘 Support

If you encounter issues:
1. Check the [troubleshooting section](#testing--troubleshooting) above
2. Review BrowserBase session logs in the dashboard
3. Test with a different LinkedIn profile URL
4. Ensure your LinkedIn account is in good standing 