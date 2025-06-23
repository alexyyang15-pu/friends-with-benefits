import { config as loadEnv } from 'dotenv';
import { Stagehand } from "@browserbasehq/stagehand";
import StagehandConfig from "./stagehand.config";

// Load environment variables
loadEnv({ path: '.env.local' });

async function testBrowserbaseSession() {
  let stagehand: Stagehand | null = null;
  
  try {
    console.log('🧪 Testing Browserbase Session Configuration');
    console.log('============================================');
    
    // Check environment variables
    console.log('🔧 Configuration Check:');
    console.log(`   API Key: ${process.env.BROWSERBASE_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Project ID: ${process.env.BROWSERBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Gemini API Key: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log('');
    
    if (!process.env.BROWSERBASE_API_KEY || !process.env.BROWSERBASE_PROJECT_ID) {
      console.log('❌ Missing required Browserbase credentials in .env.local');
      return false;
    }
    
    console.log('🚀 Starting Browserbase session...');
    stagehand = new Stagehand(StagehandConfig);
    await stagehand.init();
    
    const page = stagehand.page;
    
    console.log('✅ Session initialized successfully!');
    console.log('📱 Session details:');
    console.log(`   Environment: ${StagehandConfig.env}`);
    console.log(`   Navigation Timeout: ${StagehandConfig.defaultNavigationTimeout}ms`);
    console.log(`   Default Timeout: ${StagehandConfig.defaultTimeout}ms`);
    if (StagehandConfig.pageTimeout) {
      console.log(`   Page Timeout: ${StagehandConfig.pageTimeout}ms`);
    }
    console.log('');
    
    console.log('🌐 Navigating to test page...');
    await page.goto("https://httpbin.org/delay/1", { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ Navigation successful!');
    
    // Test session persistence with a timer
    console.log('⏰ Testing session persistence...');
    console.log('   This will keep the session alive for 2 minutes to test stability');
    
    const startTime = Date.now();
    const testDuration = 120000; // 2 minutes
    
    const testInterval = setInterval(async () => {
      try {
        const elapsed = Date.now() - startTime;
        const remaining = testDuration - elapsed;
        
        if (remaining <= 0) {
          clearInterval(testInterval);
          console.log('✅ Session persistence test completed successfully!');
          return;
        }
        
        // Simple page interaction to test session is still alive
        const title = await page.evaluate(() => document.title);
        console.log(`💓 Session alive - ${Math.floor(remaining / 1000)}s remaining (Title: "${title}")`);
        
      } catch (error) {
        clearInterval(testInterval);
        console.log('❌ Session lost during persistence test:', error);
        throw error;
      }
    }, 15000); // Check every 15 seconds
    
    // Wait for the test to complete
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (Date.now() - startTime >= testDuration) {
          clearInterval(checkInterval);
          clearInterval(testInterval);
          resolve(true);
        }
      }, 1000);
    });
    
    console.log('🎉 All tests passed! Your Browserbase session configuration is working correctly.');
    console.log('💡 You should now be able to run the LinkedIn authentication with extended timeout.');
    
    return true;
    
  } catch (error: any) {
    console.error('❌ Session test failed:', error.message);
    console.log('💡 Common issues:');
    console.log('   - Invalid Browserbase API credentials');
    console.log('   - Network connectivity problems');
    console.log('   - Browserbase service issues');
    return false;
  } finally {
    if (stagehand) {
      console.log('🔒 Closing test session...');
      await stagehand.close();
    }
  }
}

// Run the test
if (require.main === module) {
  testBrowserbaseSession().then(success => {
    if (success) {
      console.log('');
      console.log('✅ Test completed successfully!');
      console.log('🚀 You can now run: npm run authenticate-linkedin');
    } else {
      console.log('');
      console.log('❌ Test failed - please fix the issues above before continuing');
    }
  }).catch(console.error);
}

export { testBrowserbaseSession }; 