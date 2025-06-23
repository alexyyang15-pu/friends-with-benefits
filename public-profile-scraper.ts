import { config as loadEnv } from 'dotenv';
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";

// Load environment variables
loadEnv({ path: '.env.local' });

// Enhanced location schema
const LocationSchema = z.object({
  currentLocation: z.string().describe("The person's current geographic location (city, state/country)"),
  confidence: z.enum(['high', 'medium', 'low']).describe("Confidence level of the location data"),
  source: z.string().optional().describe("Where on the profile this location was found"),
  profileAccessible: z.boolean().describe("Whether the profile was accessible")
});

// Enhanced Stagehand config for public profile access
const PublicProfileConfig = {
  env: process.env.BROWSERBASE_API_KEY ? "BROWSERBASE" : "LOCAL" as const,
  ...(process.env.BROWSERBASE_API_KEY && {
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    browserbaseOptions: {
      keepAlive: true,
      recordSession: true,
      enableLiveView: true,
    },
  }),
  modelName: "google/gemini-2.0-flash",
  modelClientOptions: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  // Enhanced browser options to mimic real Safari/Chrome browser
  browserOptions: {
    headless: !process.env.BROWSERBASE_API_KEY, // Non-headless for BrowserBase
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      
      // CRITICAL: Mimic real browser more convincingly
      '--window-size=1920,1080',
      '--start-maximized',
      
      // Remove automation indicators
      '--disable-blink-features=AutomationControlled',
      '--exclude-switches=enable-automation',
      '--disable-extensions-except',
      '--disable-plugins-discovery',
      '--disable-default-apps',
      '--no-default-browser-check',
      '--no-first-run',
      
      // Enhanced stealth measures
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor,TranslateUI',
      '--disable-ipc-flooding-protection',
      '--disable-hang-monitor',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-field-trial-config',
      '--disable-back-forward-cache',
      '--disable-component-extensions-with-background-pages',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-domain-reliability',
      
      // Real browser user agent (latest Chrome)
      '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    ],
  },
  // Longer timeouts for public access
  defaultNavigationTimeout: 60000,
  defaultTimeout: 30000,
  enableCaching: true,
  debugMode: false,
  // Slower interactions to mimic human behavior
  slowMo: 1500,
};

export class PublicProfileScraper {
  private stagehand: Stagehand | null = null;

  async init(): Promise<void> {
    console.log('🌐 Initializing Public Profile Scraper (no authentication required)...');
    
    this.stagehand = new Stagehand(PublicProfileConfig);
    await this.stagehand.init();
    
    console.log('✅ Public profile scraper initialized');
  }

  async scrapePublicProfile(profileUrl: string): Promise<any> {
    if (!this.stagehand) {
      throw new Error('Scraper not initialized. Call init() first.');
    }

    const page = this.stagehand.page;
    
    try {
      console.log(`🔍 Accessing public profile: ${profileUrl}`);
      
      // Navigate with realistic behavior
      console.log('📡 Navigating to LinkedIn profile...');
      await page.goto(profileUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 45000 
      });
      
      // Human-like pause for page to fully render
      await page.waitForTimeout(3000 + Math.random() * 2000);
      
      // Check what kind of page we got
      const pageAnalysis = await page.evaluate(() => {
        const bodyText = document.body.innerText.toLowerCase();
        const url = document.URL;
        
        return {
          url: url,
          title: document.title,
          hasSignInButton: !!document.querySelector('a[href*="login"]'),
          hasJoinButton: !!document.querySelector('a[href*="signup"]'),
          hasProfileContent: !!document.querySelector('[data-section="summary"]') || 
                           !!document.querySelector('.pv-about-section') ||
                           !!document.querySelector('.top-card-layout__entity-info') ||
                           !!document.querySelector('.pv-top-card') ||
                           !!document.querySelector('.profile-photo-edit'),
          isAuthWall: url.includes('/authwall') || bodyText.includes('sign in to see'),
          isPublicProfile: !url.includes('/authwall') && !bodyText.includes('sign in to see'),
          hasLocationInfo: bodyText.includes('area') || bodyText.includes('city') || 
                          bodyText.includes('state') || bodyText.includes('country'),
          bodyTextSample: bodyText.substring(0, 500)
        };
      });

      console.log(`📊 Page analysis:`, {
        isPublicProfile: pageAnalysis.isPublicProfile,
        hasProfileContent: pageAnalysis.hasProfileContent,
        hasLocationInfo: pageAnalysis.hasLocationInfo,
        isAuthWall: pageAnalysis.isAuthWall,
        title: pageAnalysis.title
      });

      if (pageAnalysis.isAuthWall) {
        console.log('🚫 Hit authentication wall - profile not publicly accessible');
        return {
          currentLocation: 'Profile requires authentication',
          confidence: 'low',
          source: 'auth-wall',
          profileAccessible: false
        };
      }

      if (!pageAnalysis.isPublicProfile || !pageAnalysis.hasProfileContent) {
        console.log('⚠️ Profile content not accessible or not found');
        console.log(`Debug info: URL=${pageAnalysis.url}, Title=${pageAnalysis.title}`);
        return {
          currentLocation: 'Profile not accessible',
          confidence: 'low',
          source: 'no-content',
          profileAccessible: false
        };
      }

      console.log('✅ Public profile accessible! Extracting location...');
      
      // Try to extract location from the public profile
      const locationData = await page.extract({
        instruction: `This is a public LinkedIn profile page. Extract the person's current geographic location.

        Look for location information in:
        - The main profile header/card area
        - Below or near the person's name and headline
        - In the "About" or summary section
        - Current job location details
        - Contact info section
        
        EXPECTED LOCATION FORMATS:
        - "San Francisco, CA"
        - "New York, NY" 
        - "London, UK"
        - "Toronto, Canada"
        - "San Francisco Bay Area"
        - "Greater Boston Area"
        - "Remote"
        
        IGNORE:
        - Job titles and company names
        - Skills and experience
        - Education institutions
        - Endorsements and recommendations
        
        If you find a clear location, assess confidence:
        - HIGH: Exact city, state/country format
        - MEDIUM: Regional area or approximate location  
        - LOW: Vague or uncertain location reference
        
        If no location is visible, set currentLocation to "not found".
        Set profileAccessible to true since we can see the profile content.`,
        schema: LocationSchema,
        useTextExtract: true,
      });

      if (locationData.currentLocation && 
          locationData.currentLocation !== 'not found' && 
          locationData.currentLocation.trim()) {
        
        console.log(`✅ Location extracted from public profile: "${locationData.currentLocation}" (${locationData.confidence})`);
        return {
          ...locationData,
          profileAccessible: true,
          source: `public-profile-${locationData.confidence}`
        };
      }

      console.log('❌ No location found on public profile');
      return {
        currentLocation: 'Location not visible on public profile',
        confidence: 'low',
        source: 'public-profile-no-location',
        profileAccessible: true
      };
      
    } catch (error: any) {
      console.error(`❌ Error accessing public profile:`, error.message);
      return {
        currentLocation: 'Scraping error',
        confidence: 'low',
        source: 'error',
        profileAccessible: false
      };
    }
  }

  async close(): Promise<void> {
    if (this.stagehand) {
      await this.stagehand.close();
      console.log('🔒 Public profile scraper closed');
    }
  }
}

// Test function
async function testPublicProfileAccess() {
  const testUrl = process.argv[2] || 'https://linkedin.com/in/example';
  
  console.log('🧪 Testing Public LinkedIn Profile Access');
  console.log('=======================================');
  
  if (testUrl === 'https://linkedin.com/in/example') {
    console.log('ℹ️ Usage: npx tsx public-profile-scraper.ts https://linkedin.com/in/profile-url');
    console.log('ℹ️ Using default URL (will likely fail)');
  }

  const scraper = new PublicProfileScraper();
  
  try {
    await scraper.init();
    
    console.log('\n🔍 Testing public profile access (no authentication)...');
    const result = await scraper.scrapePublicProfile(testUrl);
    
    console.log('\n🎯 Results:');
    console.log(`📍 Location: ${result.currentLocation}`);
    console.log(`📊 Confidence: ${result.confidence}`);
    console.log(`🔍 Source: ${result.source}`);
    console.log(`✅ Profile Accessible: ${result.profileAccessible}`);
    
    if (result.profileAccessible && result.currentLocation !== 'not found') {
      console.log('\n🎉 Success! Public profile access working');
      console.log('💡 This method can be used without LinkedIn authentication');
    } else if (result.currentLocation === 'Profile requires authentication') {
      console.log('\n🔒 Profile requires authentication or is not public');
      console.log('💡 This profile may have restricted visibility settings');
    } else {
      console.log('\n🤷 Profile accessible but no location found');
      console.log('💡 User may not have location information on their public profile');
    }
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('BROWSERBASE_API_KEY')) {
      console.log('💡 For better results, consider setting up Browserbase credentials');
    }
  } finally {
    await scraper.close();
  }
}

if (require.main === module) {
  testPublicProfileAccess().catch(console.error);
} 