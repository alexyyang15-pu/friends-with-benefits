#!/usr/bin/env npx tsx

import { config as loadEnv } from 'dotenv';
import { Connection } from './lib/types';

// Load environment variables
loadEnv({ path: '.env.local' });

async function testEnhancedWorkflow() {
  console.log('🧪 Testing Enhanced LinkedIn Location Scraping Workflow');
  console.log('====================================================');
  
  // Check environment setup
  console.log('\n🔧 Environment Check:');
  console.log(`   BROWSERBASE_API_KEY: ${process.env.BROWSERBASE_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   BROWSERBASE_PROJECT_ID: ${process.env.BROWSERBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  
  if (!process.env.BROWSERBASE_API_KEY) {
    console.log('\n❌ BROWSERBASE_API_KEY is required for the enhanced workflow');
    console.log('💡 Please set up Browserbase credentials in .env.local');
    return;
  }

  // Test single profile scraping
  console.log('\n📍 Test 1: Single Profile Location Scraping');
  console.log('===========================================');
  
  const testProfile = process.argv[2] || 'https://linkedin.com/in/example';
  
  if (testProfile === 'https://linkedin.com/in/example') {
    console.log('ℹ️ Usage: npx tsx test-enhanced-workflow.ts https://linkedin.com/in/your-profile');
    console.log('ℹ️ Using default URL (will likely fail without real profile)');
  }

  try {
    console.log(`🔗 Testing profile: ${testProfile}`);
    
    const singleResponse = await fetch('http://localhost:3000/api/scrape-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileUrl: testProfile,
        connectionData: {
          'First Name': 'Test',
          'Last Name': 'User',
          'Email Address': 'test@example.com',
          'Company': 'Test Corp',
          'Position': 'CEO',
          'Connected On': '1/1/2024'
        }
      }),
    });

    if (singleResponse.ok) {
      const result = await singleResponse.json();
      console.log('✅ Single profile test successful!');
      console.log(`�� Location: ${result.location}`);
      console.log(`🔍 Source: ${result.source}`);
      console.log(`📊 Confidence: ${result.confidence}`);
    } else {
      const error = await singleResponse.json();
      console.log(`⚠️ Single profile test result: ${error.error}`);
      
      if (error.authenticationNeeded) {
        console.log('🔑 Authentication required - please run: npm run auth-linkedin');
      }
      
      if (error.fallbackToAI) {
        console.log('🤖 Would fall back to AI enrichment in production');
      }
    }

  } catch (error) {
    console.log('❌ Single profile test failed:', error);
    console.log('💡 Make sure the Next.js dev server is running: npm run dev');
  }

  // Test batch processing
  console.log('\n📋 Test 2: Batch Search Results Enrichment');
  console.log('==========================================');

  const mockSearchResults: Connection[] = [
    {
      'First Name': 'John',
      'Last Name': 'Doe',
      'Email Address': 'john@example.com',
      'Company': 'Example Corp',
      'Position': 'CEO',
      'Connected On': '1/1/2024',
      'URL': testProfile
    },
    {
      'First Name': 'Jane',
      'Last Name': 'Smith',
      'Email Address': 'jane@example.com',
      'Company': 'Another Corp',
      'Position': 'CTO',
      'Connected On': '1/2/2024',
      'URL': 'https://linkedin.com/in/example2'
    }
  ];

  try {
    console.log(`🎯 Testing batch enrichment with ${mockSearchResults.length} mock results`);
    
    const batchResponse = await fetch('http://localhost:3000/api/enrich-search-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchResults: mockSearchResults,
        options: {
          maxProfiles: 5,
          skipExisting: true
        }
      }),
    });

    if (batchResponse.ok) {
      const result = await batchResponse.json();
      console.log('✅ Batch enrichment test successful!');
      console.log(`📊 Stats:`, result.stats);
      console.log(`🔄 Has more: ${result.hasMore}`);
      console.log(`⏳ Remaining: ${result.remaining}`);
      
      result.searchResults.forEach((connection: any, index: number) => {
        console.log(`👤 ${index + 1}. ${connection['First Name']} ${connection['Last Name']}`);
        console.log(`   📍 Location: ${connection.location || 'Not found'}`);
        console.log(`   🔍 Source: ${connection.locationSource || 'unknown'}`);
      });
      
    } else {
      const error = await batchResponse.json();
      console.log(`⚠️ Batch test result: ${error.error}`);
      
      if (error.authenticationNeeded) {
        console.log('🔑 Authentication required for batch processing');
      }
    }

  } catch (error) {
    console.log('❌ Batch test failed:', error);
  }

  // Test session status
  console.log('\n📊 Test 3: Session Status Check');
  console.log('==============================');

  try {
    const statusResponse = await fetch('http://localhost:3000/api/scrape-location', {
      method: 'GET'
    });

    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('✅ Session status retrieved:');
      console.log(`   Active: ${status.sessionActive}`);
      console.log(`   Age: ${status.sessionAge}s`);
      console.log(`   Max Age: ${status.maxAge}s`);
    }

  } catch (error) {
    console.log('⚠️ Session status check failed:', error);
  }

  console.log('\n🎉 Enhanced workflow testing completed!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Ensure LinkedIn authentication: npm run auth-linkedin');
  console.log('   2. Test with real profile URLs');
  console.log('   3. Use the enhanced API endpoints in your search workflow');
  console.log('   4. Monitor session status and reuse for efficiency');
}

if (require.main === module) {
  testEnhancedWorkflow().catch(console.error);
}
