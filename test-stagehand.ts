import { Stagehand } from "@browserbasehq/stagehand";
import StagehandConfig from "./stagehand.config";
import { z } from "zod";

const LocationSchema = z.object({
  location: z.string().optional(),
});

async function testLinkedInScraping(profileUrl: string) {
  let stagehand: Stagehand | null = null;
  
  try {
    console.log(`🚀 Testing Stagehand LinkedIn scraping for: ${profileUrl}`);
    
    stagehand = new Stagehand(StagehandConfig);
    await stagehand.init();
    
    const page = stagehand.page;
    
    console.log("📡 Navigating to LinkedIn profile...");
    await page.goto(profileUrl, { waitUntil: 'networkidle0' });
    
    // Check if we need to sign in
    const needsSignIn = await page.evaluate(() => {
      return document.body.innerText.toLowerCase().includes('sign in') ||
             document.body.innerText.toLowerCase().includes('join now') ||
             document.URL.includes('/authwall');
    });
    
    if (needsSignIn) {
      console.log("🔒 Profile requires authentication - this is expected");
      return null;
    }
    
    console.log("🎯 Attempting to extract location...");
    
    // Try primary extraction method
    try {
      const locationData = await page.extract({
        instruction: "Extract the person's current location or city. Look for location information near their name, in their profile details, or in their current position section. Return just the location string like 'San Francisco, CA' or 'London, UK'.",
        schema: LocationSchema,
        useTextExtract: false,
      });
      
      if (locationData.location && locationData.location.trim()) {
        console.log(`✅ Successfully extracted location: "${locationData.location}"`);
        return locationData.location;
      }
    } catch (extractError) {
      console.log("⚠️ Primary extraction failed, trying observe method...");
    }
    
    // Fallback: Try observe method
    try {
      const locationElements = await page.observe({
        instruction: "Find any element that contains the person's current location, city, or geographical information",
        onlyVisible: true,
        returnAction: false,
      });

      if (locationElements && locationElements.length > 0) {
        const locationText = await page.evaluate((selector) => {
          const element = document.querySelector(selector);
          return element ? element.textContent?.trim() : null;
        }, locationElements[0].selector);

        if (locationText && locationText.toLowerCase() !== 'unknown') {
          console.log(`✅ Found location via observe: "${locationText}"`);
          return locationText;
        }
      }
    } catch (observeError) {
      console.log("⚠️ Observe method also failed");
    }
    
    console.log("❌ No location found on profile");
    return null;
    
  } catch (error: any) {
    console.error("💥 Error during scraping:", error.message);
    return null;
  } finally {
    if (stagehand) {
      try {
        await stagehand.close();
        console.log("🔒 Stagehand closed successfully");
      } catch (closeError) {
        console.error("⚠️ Error closing Stagehand:", closeError);
      }
    }
  }
}

// Test with a sample LinkedIn profile (use a public profile URL)
async function main() {
  console.log("🧪 Stagehand LinkedIn Scraping Test");
  console.log("=====================================");
  
  // You can replace this with any public LinkedIn profile URL for testing
  const testUrl = process.argv[2] || "https://linkedin.com/in/example";
  
  if (testUrl === "https://linkedin.com/in/example") {
    console.log("ℹ️ Usage: npm run test-stagehand https://linkedin.com/in/your-test-profile");
    console.log("ℹ️ Using default example URL (will likely fail)");
  }
  
  const result = await testLinkedInScraping(testUrl);
  
  if (result) {
    console.log(`🎉 Test completed successfully! Location: "${result}"`);
  } else {
    console.log("🤷 Test completed but no location was extracted");
  }
}

if (require.main === module) {
  main().catch(console.error);
} 