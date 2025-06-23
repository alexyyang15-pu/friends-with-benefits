import { config as loadEnv } from 'dotenv';
import { Stagehand } from "@browserbasehq/stagehand";
import StagehandConfig from "./stagehand.config";
import { z } from "zod";
import { Connection } from "./lib/types";

// Load environment variables
loadEnv({ path: '.env.local' });

// Enhanced location schema with more details
const LocationSchema = z.object({
  currentLocation: z.string().describe("The person's current geographic location (city, state/country)"),
  confidence: z.enum(['high', 'medium', 'low']).describe("Confidence level of the location data"),
  source: z.string().optional().describe("Where on the profile this location was found"),
  profileAccessible: z.boolean().describe("Whether the profile was accessible without authentication issues")
});

export class EnhancedLinkedInScraper {
  private stagehand: Stagehand | null = null;
  private isAuthenticated: boolean = false;
  private sessionStartTime: number = 0;
  private profilesProcessed: number = 0;
  private maxProfilesPerSession: number = 50; // Prevent overuse

  async init(): Promise<void> {
    console.log('🚀 Initializing Enhanced LinkedIn Scraper with Browserbase...');
    
    if (!process.env.BROWSERBASE_API_KEY) {
      throw new Error('BROWSERBASE_API_KEY is required for the enhanced scraper');
    }

    this.stagehand = new Stagehand(StagehandConfig);
    await this.stagehand.init();
    this.sessionStartTime = Date.now();
    
    console.log('✅ Enhanced scraper initialized with Browserbase session');
  }

  async ensureAuthentication(): Promise<boolean> {
    if (!this.stagehand) {
      throw new Error('Scraper not initialized. Call init() first.');
    }

    if (this.isAuthenticated) {
      return true;
    }

    const page = this.stagehand.page;
    
    try {
      console.log('🔐 Checking LinkedIn authentication status...');
      
      // Navigate to LinkedIn home page
      await page.goto("https://www.linkedin.com", { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Add human-like delay
      await page.waitForTimeout(2000 + Math.random() * 1000);
      
      // Check if we're already logged in
      const isLoggedIn = await page.evaluate(() => {
        // Look for elements that indicate we're logged in
        const feedElement = document.querySelector('[data-control-name="nav.feed"]');
        const profileElement = document.querySelector('[data-control-name="nav.settings_and_privacy"]');
        const homeElement = document.querySelector('[data-control-name="nav.home"]');
        const signInText = document.body.innerText.toLowerCase();
        
        return (feedElement || profileElement || homeElement) && 
               !signInText.includes('sign in') && 
               !signInText.includes('join now') &&
               !document.URL.includes('/authwall');
      });

      if (isLoggedIn) {
        console.log('✅ Already authenticated with LinkedIn - using existing session');
        this.isAuthenticated = true;
        return true;
      }

      console.log('❌ Not authenticated - this session requires manual login first');
      console.log('💡 Please run: npm run auth-linkedin');
      return false;
      
    } catch (error) {
      console.error('❌ Authentication check failed:', error);
      return false;
    }
  }

  async scrapeLocationsFromSearchResults(connections: Connection[]): Promise<Connection[]> {
    if (!await this.ensureAuthentication()) {
      throw new Error('LinkedIn authentication required. Please run: npm run auth-linkedin');
    }

    console.log(`🎯 Starting batch location scraping for ${connections.length} connections...`);
    const results: Connection[] = [];
    const page = this.stagehand!.page;

    for (let i = 0; i < connections.length; i++) {
      const connection = connections[i];
      
      // Check session limits
      if (this.profilesProcessed >= this.maxProfilesPerSession) {
        console.log('⚠️ Reached profile limit for this session to avoid detection');
        break;
      }

      // Skip if no URL or already has good location
      if (!connection.URL || (connection.location && 
          connection.location !== 'Unknown' && 
          connection.location !== 'Send profile in a message')) {
        results.push(connection);
        continue;
      }

      try {
        console.log(`\n📍 [${i + 1}/${connections.length}] Scraping: ${connection['First Name']} ${connection['Last Name']}`);
        console.log(`🔗 URL: ${connection.URL}`);

        // Navigate to profile with random human-like delay
        const delay = 3000 + Math.random() * 2000; // 3-5 seconds
        await page.waitForTimeout(delay);

        await page.goto(connection.URL, { 
          waitUntil: 'networkidle',
          timeout: 45000 
        });

        // Additional wait for page to fully load
        await page.waitForTimeout(2000 + Math.random() * 1000);

        // Check if we hit authentication wall
        const needsAuth = await page.evaluate(() => {
          return document.body.innerText.toLowerCase().includes('sign in') ||
                 document.body.innerText.toLowerCase().includes('join now') ||
                 document.URL.includes('/authwall') ||
                 document.URL.includes('/checkpoint');
        });

        if (needsAuth) {
          console.log('🔒 Authentication wall encountered - marking as inaccessible');
          results.push({
            ...connection,
            location: 'Profile requires authentication',
            locationSource: 'authentication-blocked'
          });
          continue;
        }

        // Extract location using enhanced method
        const locationData = await page.extract({
          instruction: `Look at this LinkedIn profile and extract the person's current geographic location.

          SPECIFICALLY LOOK FOR:
          - Location text in the profile header (under/near their name)
          - Geographic information in their current job section
          - City/state/country in their profile summary
          - Location details in their "About" section
          
          VALID LOCATION FORMATS:
          - "San Francisco, CA" 
          - "New York, NY"
          - "London, UK"
          - "Toronto, Canada"
          - "San Francisco Bay Area"
          - "Greater Boston Area"
          - "Remote" or "Remote, USA"
          
          IGNORE:
          - Job titles or roles
          - Company names
          - Skills, endorsements, education
          - Anything that's clearly not a geographic location
          
          CONFIDENCE LEVELS:
          - HIGH: Clear city/state or city/country format
          - MEDIUM: Area/region or approximate location
          - LOW: Uncertain or vague location reference
          
          If no clear location is visible, set currentLocation to "not found".
          Set profileAccessible to true if you can see profile content.`,
          schema: LocationSchema,
          useTextExtract: true,
        });

        let updatedConnection = { ...connection };

        if (locationData.currentLocation && 
            locationData.currentLocation !== 'not found' && 
            locationData.currentLocation.trim()) {
          
          console.log(`✅ Location found: "${locationData.currentLocation}" (${locationData.confidence})`);
          updatedConnection = {
            ...connection,
            location: locationData.currentLocation.trim(),
            locationSource: `stagehand-${locationData.confidence}`,
            locationConfidence: locationData.confidence
          };
        } else {
          console.log('❌ No location found on profile');
          updatedConnection = {
            ...connection,
            location: 'Location not found',
            locationSource: 'stagehand-not-found'
          };
        }

        results.push(updatedConnection);
        this.profilesProcessed++;

        // Progress update
        const progress = Math.round((results.length / connections.length) * 100);
        console.log(`📊 Progress: ${results.length}/${connections.length} (${progress}%)`);

      } catch (error: any) {
        console.error(`❌ Error scraping ${connection['First Name']} ${connection['Last Name']}:`, error.message);
        
        // Add connection with error state
        results.push({
          ...connection,
          location: 'Scraping error',
          locationSource: 'error'
        });
      }

      // Intelligent delay between profiles to avoid detection
      if (i < connections.length - 1) {
        const waitTime = 2000 + Math.random() * 3000; // 2-5 seconds
        console.log(`⏱️ Waiting ${Math.round(waitTime/1000)}s before next profile...`);
        await page.waitForTimeout(waitTime);
      }
    }

    console.log(`\n🎉 Batch scraping completed!`);
    console.log(`📊 Results: ${results.length} processed, ${this.profilesProcessed} profiles scraped this session`);
    
    return results;
  }

  async close(): Promise<void> {
    if (this.stagehand) {
      const sessionDuration = Date.now() - this.sessionStartTime;
      console.log(`📊 Session stats: ${this.profilesProcessed} profiles scraped in ${Math.round(sessionDuration/1000)}s`);
      await this.stagehand.close();
      console.log('🔒 Enhanced LinkedIn scraper closed');
    }
  }
}

// Convenience function for API usage
export async function scrapeLocationsFromConnections(connections: Connection[]): Promise<Connection[]> {
  const scraper = new EnhancedLinkedInScraper();
  
  try {
    await scraper.init();
    return await scraper.scrapeLocationsFromSearchResults(connections);
  } finally {
    await scraper.close();
  }
}

// Test function
async function testEnhancedScraper() {
  const testConnections: Connection[] = [
    {
      'First Name': 'Test',
      'Last Name': 'User',
      'Email Address': 'test@example.com',
      'Company': 'Test Corp',
      'Position': 'CEO',
      'Connected On': '1/1/2024',
      'URL': process.argv[2] || 'https://linkedin.com/in/example'
    }
  ];

  console.log("🧪 Testing Enhanced LinkedIn Scraper");
  console.log("====================================");
  
  if (!process.argv[2]) {
    console.log("ℹ️ Usage: npx tsx enhanced-linkedin-scraper.ts https://linkedin.com/in/your-test-profile");
    console.log("ℹ️ Using default example URL (will likely fail)");
  }

  try {
    const results = await scrapeLocationsFromConnections(testConnections);
    
    console.log("\n🎯 Test Results:");
    results.forEach(result => {
      console.log(`👤 ${result['First Name']} ${result['Last Name']}`);
      console.log(`📍 Location: ${result.location || 'Not found'}`);
      console.log(`🔍 Source: ${result.locationSource || 'unknown'}`);
      console.log('---');
    });
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('authentication required')) {
      console.log('💡 Please run authentication first: npm run auth-linkedin');
    }
  }
}

if (require.main === module) {
  testEnhancedScraper().catch(console.error);
}
