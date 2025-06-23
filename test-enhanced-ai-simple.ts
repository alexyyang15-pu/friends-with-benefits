/**
 * Simple test for enhanced AI location detection
 * Tests the enhanced prompt that avoids company headquarters fallback
 */

import { findLocationForConnection } from './lib/gemini';
import { Connection } from './lib/types';

async function testEnhancedAI() {
  console.log('🧪 Testing Enhanced AI Location Detection');
  console.log('=======================================');
  console.log('🎯 Focus: Personal locations only, no company HQ fallback\n');

  // Test cases designed to avoid company headquarters
  const testCases: Array<{connection: Connection, expectedBehavior: string}> = [
    {
      connection: {
        'First Name': 'Elon',
        'Last Name': 'Musk',
        'Company': 'Tesla',
        'Position': 'CEO',
        'URL': 'https://linkedin.com/in/elonmusk'
      },
      expectedBehavior: 'Should find his personal residence (Austin, TX), NOT Tesla HQ (Palo Alto/Austin factory)'
    },
    {
      connection: {
        'First Name': 'Brian',
        'Last Name': 'Chesky', 
        'Company': 'Airbnb',
        'Position': 'CEO',
        'URL': 'https://linkedin.com/in/bchesky'
      },
      expectedBehavior: 'Should find personal location, NOT Airbnb SF headquarters'
    },
    {
      connection: {
        'First Name': 'Unknown',
        'Last Name': 'Person',
        'Company': 'Random Startup',
        'Position': 'Engineer',
        'URL': 'https://linkedin.com/in/unknown'
      },
      expectedBehavior: 'Should return null/not found rather than guessing company location'
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const connection = testCase.connection;
    
    console.log(`Test ${i + 1}: ${connection['First Name']} ${connection['Last Name']}`);
    console.log(`Company: ${connection.Company}`);
    console.log(`Expected: ${testCase.expectedBehavior}`);
    
    try {
      const startTime = Date.now();
      const result = await findLocationForConnection(connection);
      const duration = Date.now() - startTime;
      
      if (result) {
        console.log(`✅ Result: "${result}" (${duration}ms)`);
        
        // Check if result looks like company HQ
        const companyName = connection.Company.toLowerCase();
        const resultLower = result.toLowerCase();
        
        if (resultLower.includes('headquarters') || 
            resultLower.includes('office') ||
            (companyName === 'tesla' && resultLower.includes('palo alto')) ||
            (companyName === 'airbnb' && resultLower.includes('san francisco'))) {
          console.log(`⚠️  WARNING: This might be a company location, not personal!`);
        } else {
          console.log(`🎯 GOOD: Appears to be a personal location`);
        }
      } else {
        console.log(`❌ No location found (${duration}ms)`);
        console.log(`🎯 GOOD: AI correctly avoided guessing/using company HQ`);
      }
      
    } catch (error) {
      console.log(`💥 Error: ${error.message}`);
    }
    
    console.log(''); // Empty line
    
    // Small delay between requests
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('📊 Enhanced AI Test Complete!');
  console.log('');
  console.log('🎯 Key Improvements:');
  console.log('  • Focuses on personal/residential locations');
  console.log('  • Avoids company headquarters fallback');
  console.log('  • Better filtering of company-related responses');
  console.log('  • More conservative with location guessing');
  console.log('');
  console.log('💡 Next Steps:');
  console.log('  • Use this enhanced AI in your main app');
  console.log('  • Should see higher quality location data');
  console.log('  • Fewer false positives from company HQs');
}

if (require.main === module) {
  testEnhancedAI().catch(console.error);
}
