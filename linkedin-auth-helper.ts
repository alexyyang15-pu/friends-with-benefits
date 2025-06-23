import { config } from 'dotenv';
import { Stagehand } from "@browserbasehq/stagehand";
import StagehandConfig from "./stagehand.config";
import { z } from "zod";

// Load environment variables
config({ path: '.env.local' });

// Schema for location extraction with improved authentication handling
const LocationSchema = z.object({
  currentLocation: z.string().describe("The person's current geographic location (city, state/country)"),
  confidence: z.enum(['high', 'medium', 'low']).describe("Confidence level of the location data"),
  source: z.string().optional().describe("Where on the profile this location was found")
});

export class LinkedInAuthHelper {
  private stagehand: Stagehand | null = null;
  private isAuthenticated: boolean = false;

  async init(): Promise<void> {
    console.log('🚀 Initializing LinkedIn authentication helper...');
    
    this.stagehand = new Stagehand(StagehandConfig);
    await this.stagehand.init();
    
    // Check if BrowserBase is being used
    if (process.env.BROWSERBASE_API_KEY) {
      console.log('🌐 Using BrowserBase for persistent sessions');
    } else {
      console.log('💻 Using local browser session');
    }
  }

  async ensureAuthentication(): Promise<boolean> {
    if (!this.stagehand) {
      throw new Error('Helper not initialized. Call init() first.');
    }

    const page = this.stagehand.page;
    
    try {
      console.log('🔐 Checking LinkedIn authentication status...');
      
      // Navigate to LinkedIn home page
      await page.goto("https://www.linkedin.com", { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      // Check if we're already logged in
      const isLoggedIn = await page.evaluate(() => {
        // Look for elements that indicate we're logged in
        const feedElement = document.querySelector('[data-control-name="nav.feed"]');
        const profileElement = document.querySelector('[data-control-name="nav.settings_and_privacy"]');
        const signInText = document.body.innerText.toLowerCase();
        
        return (feedElement || profileElement) && 
               !signInText.includes('sign in') && 
               !signInText.includes('join now');
      });

      if (isLoggedIn) {
        console.log('✅ Already authenticated with LinkedIn');
        this.isAuthenticated = true;
        return true;
      }

      // If not logged in, guide the user through manual authentication
      console.log('🔑 LinkedIn authentication required');
      
      if (process.env.BROWSERBASE_API_KEY) {
        console.log('📱 BrowserBase session will open for manual login');
        console.log('   1. A browser window will open in BrowserBase');
        console.log('   2. Please log in to LinkedIn manually');
        console.log('   3. The session will be saved for future use');
        
        // Navigate to login page
        await page.goto("https://www.linkedin.com/login");
        
        // Wait for user to complete login
        console.log('⏳ Waiting for login completion... (up to 10 minutes)');
        
        try {
          await page.waitForFunction(() => {
            const feedElement = document.querySelector('[data-control-name="nav.feed"]');
            const profileElement = document.querySelector('[data-control-name="nav.settings_and_privacy"]');
            return feedElement || profileElement;
          }, { timeout: 600000 }); // 10 minutes
          
          console.log('✅ Successfully authenticated with LinkedIn!');
          this.isAuthenticated = true;
          return true;
          
        } catch (timeoutError) {
          console.log('⏰ Login timeout after 10 minutes. Please try again.');
          return false;
        }
      } else {
        console.log('⚠️ Local mode detected - authentication wall encountered');
        console.log('💡 Consider setting up BrowserBase for persistent sessions');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Authentication check failed:', error);
      return false;
    }
  }

  async scrapeProfileLocation(profileUrl: string): Promise<any> {
    if (!this.stagehand) {
      throw new Error('Helper not initialized. Call init() first.');
    }

    if (!this.isAuthenticated) {
      const authSuccess = await this.ensureAuthentication();
      if (!authSuccess) {
        throw new Error('LinkedIn authentication required');
      }
    }

    const page = this.stagehand.page;
    
    try {
      console.log(`📍 Scraping location from: ${profileUrl}`);
      
      await page.goto(profileUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(5000); // Extra wait for full page load
      
      // Check if we hit an auth wall again
      const needsAuth = await page.evaluate(() => {
        return document.body.innerText.toLowerCase().includes('sign in') ||
               document.body.innerText.toLowerCase().includes('join now') ||
               document.URL.includes('/authwall');
      });

      if (needsAuth) {
        console.log('🔒 Authentication wall encountered on profile page');
        return null;
      }

      // Extract location using enhanced method
      const locationData = await page.extract({
        instruction: `Look at this LinkedIn profile and extract the person's current geographic location.

        SPECIFICALLY LOOK FOR:
        - Location text that appears in the profile header (usually under or near their name)
        - Geographic information in their current job section
        - City/state/country information in their profile summary
        
        VALID LOCATION FORMATS:
        - "San Francisco, CA" 
        - "New York, NY"
        - "London, UK"
        - "Toronto, Canada"
        - "San Francisco Bay Area"
        - "Greater Boston Area"
        
        IGNORE:
        - Job titles like "Software Engineer" or "CEO"
        - Company names like "Google" or "Microsoft" 
        - Skills, endorsements, or education
        - Anything that's not a geographic location
        
        If you find a location, assess your confidence:
        - HIGH: Clear city/state or city/country format
        - MEDIUM: Area or region (like "Bay Area")
        - LOW: Uncertain or ambiguous text
        
        If no clear location is visible, set currentLocation to "not found".`,
        schema: LocationSchema,
        useTextExtract: true,
      });

      if (locationData.currentLocation && 
          locationData.currentLocation !== 'not found' && 
          locationData.currentLocation.trim()) {
        console.log(`✅ Location extracted: "${locationData.currentLocation}" (${locationData.confidence})`);
        return locationData;
      }

      return null;
      
    } catch (error) {
      console.error('❌ Error scraping profile:', error);
      return null;
    }
  }

  async close(): Promise<void> {
    if (this.stagehand) {
      await this.stagehand.close();
      console.log('🔒 LinkedIn authentication helper closed');
    }
  }
}

// Convenience function for single profile scraping
export async function scrapeLinkedInProfile(profileUrl: string): Promise<any> {
  const helper = new LinkedInAuthHelper();
  
  try {
    await helper.init();
    const result = await helper.scrapeProfileLocation(profileUrl);
    return result;
  } finally {
    await helper.close();
  }
}

// Test function
async function testLinkedInAuth() {
  const testUrl = process.argv[2] || "https://linkedin.com/in/example";
  
  console.log("🧪 Testing LinkedIn Authentication Helper");
  console.log("=========================================");
  
  if (testUrl === "https://linkedin.com/in/example") {
    console.log("ℹ️ Usage: npm run test-linkedin-auth https://linkedin.com/in/your-test-profile");
    console.log("ℹ️ Using default example URL (may fail without real profile)");
  }
  
  const result = await scrapeLinkedInProfile(testUrl);
  
  if (result) {
    console.log(`🎉 Success! Location found: "${result.currentLocation}"`);
    console.log(`📊 Confidence: ${result.confidence}`);
    console.log(`🔍 Source: ${result.source || 'unknown'}`);
  } else {
    console.log("🤷 No location extracted");
    console.log("💡 This could be due to:");
    console.log("   - Profile requires authentication");
    console.log("   - No location information visible");
    console.log("   - Rate limiting or blocking");
  }
}

if (require.main === module) {
  testLinkedInAuth().catch(console.error);
} 