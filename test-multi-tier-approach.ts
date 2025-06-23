/**
 * Test the multi-tier LinkedIn location scraping approach
 * Tier 1: Public profile access (no auth)
 * Tier 2: Authenticated scraping 
 * Tier 3: AI fallback
 */

const TEST_PROFILE = {
  'First Name': 'Alex',
  'Last Name': 'Yang',
  'URL': 'https://linkedin.com/in/alexyang-ba'
};

async function testMultiTierApproach() {
  console.log('🧪 Testing Multi-Tier LinkedIn Location Scraping');
  console.log('==============================================');
  console.log('📋 Approach: Public → Authenticated → AI Fallback\n');

  try {
    console.log('📍 Test Profile:', TEST_PROFILE['First Name'], TEST_PROFILE['Last Name']);
    console.log('🔗 URL:', TEST_PROFILE.URL);
    console.log('\n🚀 Starting multi-tier location extraction...\n');

    // Call the scrape-location API which now has multi-tier logic
    const response = await fetch('http://localhost:3000/api/scrape-location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profileUrl: TEST_PROFILE.URL,
        connectionData: TEST_PROFILE,
        batchMode: false
      }),
    });

    const result = await response.json();
    
    console.log(`📊 API Response Status: ${response.status}`);
    console.log('📋 Response Data:');
    console.log(JSON.stringify(result, null, 2));

    // Analyze the result
    if (response.ok && result.location) {
      console.log('\n✅ SUCCESS!');
      console.log(`📍 Location Found: "${result.location}"`);
      console.log(`🔍 Method Used: ${result.method || 'unknown'}`);
      console.log(`📊 Confidence: ${result.confidence || 'unknown'}`);
      console.log(`🎯 Source: ${result.source || 'unknown'}`);
    } else if (result.fallbackToAI) {
      console.log('\n🔄 FALLBACK TO AI REQUIRED');
      console.log('💡 Both public and authenticated scraping failed');
      console.log('🤖 Should trigger AI-based location enrichment');
      
      if (result.authenticationNeeded) {
        console.log('🔑 LinkedIn authentication required for better results');
      }
    } else if (result.authenticationNeeded) {
      console.log('\n🔑 AUTHENTICATION REQUIRED');
      console.log('💡 Run: npm run auth-linkedin to authenticate');
    } else {
      console.log('\n❌ UNEXPECTED RESULT');
      console.log('⚠️ API returned an unexpected response format');
    }

    // Test session status
    console.log('\n📊 Checking session status...');
    const statusResponse = await fetch('http://localhost:3000/api/scrape-location', {
      method: 'GET'
    });
    const statusData = await statusResponse.json();
    
    console.log('🔍 Session Info:');
    console.log(`  Active: ${statusData.sessionActive}`);
    console.log(`  Age: ${statusData.sessionAge}s`);
    console.log(`  Max Age: ${statusData.maxAge}s`);
    console.log(`  Approach: ${statusData.approach}`);

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Make sure your Next.js server is running: npm run dev');
    }
  }
}

async function testBatchMode() {
  console.log('\n\n🎯 Testing Batch Mode');
  console.log('=====================');

  const testConnections = [
    {
      'First Name': 'Alex',
      'Last Name': 'Yang', 
      'URL': 'https://linkedin.com/in/alexyang-ba'
    },
    {
      'First Name': 'Jane',
      'Last Name': 'Smith',
      'URL': 'https://linkedin.com/in/janesmith'
    }
  ];

  try {
    const response = await fetch('http://localhost:3000/api/scrape-location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        batchMode: true,
        connections: testConnections
      }),
    });

    const result = await response.json();
    
    console.log(`📊 Batch API Response Status: ${response.status}`);
    console.log(`📋 Processed: ${result.processed || 0} profiles`);
    
    if (result.connections) {
      result.connections.forEach((conn: any, index: number) => {
        console.log(`\n${index + 1}. ${conn['First Name']} ${conn['Last Name']}`);
        console.log(`   Location: ${conn.location || 'not found'}`);
        console.log(`   Source: ${conn.locationSource || 'unknown'}`);
      });
    }

  } catch (error: any) {
    console.error('❌ Batch test failed:', error.message);
  }
}

if (require.main === module) {
  testMultiTierApproach()
    .then(() => testBatchMode())
    .catch(console.error);
} 