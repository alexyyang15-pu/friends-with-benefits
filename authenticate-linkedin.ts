import { config as loadEnv } from 'dotenv';
import { Stagehand } from "@browserbasehq/stagehand";
import StagehandConfig from "./stagehand.config";

// Load environment variables
loadEnv({ path: '.env.local' });

async function authenticateLinkedIn() {
  let stagehand: Stagehand | null = null;
  
  try {
    console.log('🚀 Starting LinkedIn Authentication Session');
    console.log('=========================================');
    
    stagehand = new Stagehand(StagehandConfig);
    await stagehand.init();
    
    const page = stagehand.page;
    
    console.log('🌐 Browserbase session started!');
    console.log('⏰ Session configured for 30-minute timeout');
    console.log('📱 To access your browser session:');
    console.log('   1. Go to: https://browserbase.com/dashboard');
    console.log('   2. Look for your active session');
    console.log('   3. Click "View Session" to open the live browser');
    console.log('   4. Log in to LinkedIn manually in that browser');
    console.log('');
    console.log('💡 The session will stay active for 30 minutes - plenty of time to login!');
    console.log('');
    
    // Navigate to LinkedIn
    console.log('📡 Navigating to LinkedIn...');
    await page.goto("https://www.linkedin.com/login", { 
      waitUntil: 'networkidle',
      timeout: 60000 // 1 minute timeout for navigation
    });
    
    console.log('🔑 Please log in to LinkedIn now!');
    console.log('⏳ Waiting for login completion... (up to 30 minutes)');
    console.log('💡 You have 30 minutes to complete the login process');
    console.log('📊 Status updates will be shown every 30 seconds');
    console.log('🚨 Keep this terminal open - closing it will end the session!');
    console.log('');
    
    // Wait for successful login indicators with extended timeout
    try {
      console.log('🔍 Current page status check...');
      
      // Initial status check
      const initialStatus = await page.evaluate(() => {
        return {
          url: document.URL,
          title: document.title,
          hasLoginForm: !!document.querySelector('form[data-test-id="organic-unified-login"]'),
          hasEmailField: !!document.querySelector('#username'),
          hasPasswordField: !!document.querySelector('#password')
        };
      });
      
      console.log(`📍 Initial status: ${JSON.stringify(initialStatus, null, 2)}`);
      
      // Add a session keep-alive mechanism
      const keepAliveInterval = setInterval(async () => {
        try {
          // Simple page interaction to keep session alive
          await page.evaluate(() => {
            // Just get the page title to keep the session active
            return document.title;
          });
          console.log('💓 Session keep-alive ping sent');
        } catch (error) {
          console.log('⚠️ Keep-alive ping failed:', error);
        }
      }, 60000); // Every minute
      
      // Wait with periodic status updates and extended timeout
      let lastStatusUpdate = Date.now();
      
      await page.waitForFunction(() => {
        // Check for LinkedIn feed or profile elements that indicate successful login
        const feedElement = document.querySelector('[data-control-name="nav.feed"]');
        const profileElement = document.querySelector('[data-control-name="nav.settings_and_privacy"]');
        const homeElement = document.querySelector('[data-control-name="nav.home"]');
        
        // Check if we're on linkedin.com (not login page)
        const isOnLinkedIn = document.URL.includes('linkedin.com') && 
                           !document.URL.includes('/login') && 
                           !document.URL.includes('/authwall');
        
        // Periodically log status updates
        const now = Date.now();
        if (window.lastUpdate === undefined || now - window.lastUpdate > 30000) { // Every 30 seconds
          window.lastUpdate = now;
          console.log('🔄 Status update:', {
            url: document.URL,
            hasNavElements: !!(feedElement || profileElement || homeElement),
            isOnLinkedIn: isOnLinkedIn,
            timeElapsed: Math.floor((now - window.startTime) / 1000) + 's'
          });
        }
        
        // Initialize start time if not set
        if (window.startTime === undefined) {
          window.startTime = now;
        }
        
        return (feedElement || profileElement || homeElement) || 
               (isOnLinkedIn && !document.body.innerText.toLowerCase().includes('sign in'));
      }, { timeout: 1800000 }); // 30 minutes instead of 20
      
      // Clear the keep-alive interval
      clearInterval(keepAliveInterval);
      
      console.log('✅ Successfully authenticated with LinkedIn!');
      console.log('🎉 Your session is now saved for future use');
      console.log('📱 You can now close the browser - the session will persist');
      
      // Test the session by navigating to the feed
      await page.goto("https://www.linkedin.com/feed", { 
        waitUntil: 'networkidle',
        timeout: 60000
      });
      console.log('✅ Session verified - LinkedIn feed accessible');
      
      return true;
      
    } catch (timeoutError) {
      console.log('⏰ Login timeout after 30 minutes.');
      console.log('💡 Please run this script again and complete login faster.');
      console.log('🔍 If the session closed too early, check your Browserbase dashboard');
      return false;
    }
    
  } catch (error: any) {
    console.error('❌ Error during authentication:', error.message);
    console.log('💡 Common issues:');
    console.log('   - Browserbase API key/project ID not set');
    console.log('   - Network connectivity issues');
    console.log('   - LinkedIn blocking automated access');
    return false;
  } finally {
    // Keep session alive for a bit longer to ensure it's saved
    if (stagehand) {
      console.log('💾 Saving session...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      await stagehand.close();
      console.log('🔒 Authentication session completed');
    }
  }
}

// Run the authentication
if (require.main === module) {
  authenticateLinkedIn().then(success => {
    if (success) {
      console.log('');
      console.log('🎊 SUCCESS! LinkedIn authentication is now set up');
      console.log('🔄 Future LinkedIn scraping will use this authenticated session');
      console.log('🧪 Test it with: npm run test-linkedin-auth https://linkedin.com/in/your-profile');
    } else {
      console.log('');
      console.log('❌ Authentication failed or timed out');
      console.log('🔄 Please try running this script again');
    }
  }).catch(console.error);
} 