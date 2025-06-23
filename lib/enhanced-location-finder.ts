import { GoogleGenerativeAI } from '@google/generative-ai';
import { Connection } from './types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function findPersonalLocationForConnection(
  connection: Connection
): Promise<string | null> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro-preview-06-05',
    generationConfig: {
      temperature: 0.3, // Lower temperature for more precise results
    },
  });

  const enhancedPrompt = `You are a location intelligence expert. Find the PERSONAL/RESIDENTIAL location of ${connection['First Name']} ${connection['Last Name']}, who works as ${connection.Position} at ${connection.Company}.

CRITICAL INSTRUCTIONS:
1. ONLY return their personal/residential location where they actually live
2. DO NOT use company headquarters or office locations
3. DO NOT guess or infer locations based on company location
4. Look for specific personal indicators in public profiles

SEARCH STRATEGY:
🔍 PRIMARY SOURCES (in order of priority):
   1. LinkedIn profile location field (personal residence)
   2. Twitter/X bio location 
   3. Personal website or blog mentions
   4. Conference speaker bios with personal location
   5. News articles mentioning where they live
   6. University alumni directories with current location
   7. Personal social media posts mentioning location

🚫 EXPLICITLY AVOID:
   - Company office locations
   - Corporate headquarters
   - Business addresses
   - General "Bay Area" or "Greater [City] Area" (unless that's their specific personal location)
   - Industry hub assumptions (e.g., "tech = San Francisco")

RESPONSE FORMAT:
- If you find their PERSONAL location: Return exact format "City, State/Country" (e.g., "Austin, TX", "Toronto, Canada", "London, UK")
- If they mention "Remote" or "Working remotely from [City]": Return the city they're remote from
- If no personal location found: Return "Personal location not found"

QUALITY STANDARDS:
✅ GOOD: "Seattle, WA" (they live in Seattle)
✅ GOOD: "Austin, TX" (moved to Austin, working remotely)
✅ GOOD: "London, UK" (personal residence in London)
❌ BAD: "San Francisco, CA" (just because they work at a SF tech company)
❌ BAD: "New York, NY" (just because company has NYC office)
❌ BAD: "Cupertino, CA" (just because they work at Apple)

Remember: We want to know where ${connection['First Name']} ${connection['Last Name']} actually LIVES, not where they work.`;

  try {
    const result = await model.generateContent(enhancedPrompt);
    const responseText = result.response.text().trim();

    // Enhanced filtering to catch company headquarters
    const isInvalidResponse = (text: string): boolean => {
      const lowerText = text.toLowerCase();
      
      // Standard negative responses
      if (
        lowerText === 'personal location not found' ||
        lowerText === 'unknown' ||
        lowerText.length === 0 ||
        lowerText.includes('i cannot') ||
        lowerText.includes('unable to provide') ||
        lowerText.includes('no specific') ||
        lowerText.includes('not available')
      ) {
        return true;
      }

      // Check for company headquarters patterns
      const companyName = connection.Company?.toLowerCase() || '';
      const suspiciousPatterns = [
        'headquarters',
        'head office',
        'main office',
        'corporate office',
        'based on their company',
        'company location',
        'office location',
        companyName && lowerText.includes(companyName) // Avoid responses that reference the company name
      ];

      return suspiciousPatterns.some(pattern => 
        pattern && lowerText.includes(pattern)
      );
    };

    if (isInvalidResponse(responseText)) {
      console.log(`🔍 Personal location not found for ${connection['First Name']} ${connection['Last Name']} - AI avoided company fallback`);
      return null;
    }

    console.log(`✅ Personal location found for ${connection['First Name']} ${connection['Last Name']}: ${responseText}`);
    return responseText;

  } catch (error) {
    console.error(
      `❌ Error finding personal location for ${connection['First Name']} ${connection['Last Name']}:`,
      error
    );
    return null;
  }
}

// Enhanced version with fallback strategies
export async function findLocationWithFallbackStrategies(
  connection: Connection
): Promise<{ location: string | null; source: string; confidence: 'high' | 'medium' | 'low' }> {
  
  // Strategy 1: Personal location search
  console.log(`🎯 Strategy 1: Searching for personal location of ${connection['First Name']} ${connection['Last Name']}`);
  const personalLocation = await findPersonalLocationForConnection(connection);
  
  if (personalLocation) {
    return {
      location: personalLocation,
      source: 'personal-profile',
      confidence: 'high'
    };
  }

  // Strategy 2: Industry hub intelligence (but only for specific roles/companies)
  console.log(`🎯 Strategy 2: Industry-based location intelligence`);
  const industryLocation = await findIndustrySpecificLocation(connection);
  
  if (industryLocation) {
    return {
      location: industryLocation,
      source: 'industry-intelligence',
      confidence: 'medium'
    };
  }

  // Strategy 3: Network analysis (check if other connections from same company have location data)
  console.log(`🎯 Strategy 3: Network-based location analysis`);
  // This would require access to other connections, so we'll skip for now
  
  return {
    location: null,
    source: 'no-source',
    confidence: 'low'
  };
}

async function findIndustrySpecificLocation(connection: Connection): Promise<string | null> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro-preview-06-05',
  });

  const prompt = `Analyze this professional profile for industry-specific location patterns:

Name: ${connection['First Name']} ${connection['Last Name']}
Company: ${connection.Company}
Position: ${connection.Position}

ONLY consider these specific scenarios for location inference:
1. Startup founders in specific ecosystems (e.g., YC-backed startups often in SF)
2. Entertainment industry professionals (often LA/NYC)
3. Financial services (often NYC/London/Hong Kong)
4. Government/Policy roles (often DC)
5. Academic/Research positions (university towns)

STRICT RULES:
- Only suggest a location if there's a >80% probability based on industry/role specifics
- Do NOT suggest general tech hubs for regular tech workers
- Do NOT use company headquarters
- Be very conservative with suggestions

Response format:
- If confident industry pattern exists: "City, State/Country"  
- If no clear pattern: "No industry pattern"

Example good responses:
- "Los Angeles, CA" (for movie studio executive)
- "Washington, DC" (for federal government role)
- "No industry pattern" (for regular software engineer)`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    if (responseText === "No industry pattern" || responseText.toLowerCase().includes('no industry')) {
      return null;
    }
    
    console.log(`🎯 Industry pattern detected for ${connection['First Name']} ${connection['Last Name']}: ${responseText}`);
    return responseText;
    
  } catch (error) {
    console.error('Error in industry-specific location analysis:', error);
    return null;
  }
}

// Test function to validate the enhanced AI
export async function testEnhancedLocationFinder() {
  console.log('🧪 Testing Enhanced Personal Location Finder');
  console.log('===========================================');

  const testConnections: Connection[] = [
    {
      'First Name': 'Elon',
      'Last Name': 'Musk',
      'Company': 'Tesla',
      'Position': 'CEO',
      'URL': 'https://linkedin.com/in/elonmusk'
    },
    {
      'First Name': 'Brian',
      'Last Name': 'Chesky',
      'Company': 'Airbnb',
      'Position': 'Co-founder & CEO',
      'URL': 'https://linkedin.com/in/bchesky'
    },
    {
      'First Name': 'John',
      'Last Name': 'Smith',
      'Company': 'Random Tech Company',
      'Position': 'Software Engineer',
      'URL': 'https://linkedin.com/in/johnsmith'
    }
  ];

  for (const connection of testConnections) {
    console.log(`\n👤 Testing: ${connection['First Name']} ${connection['Last Name']}`);
    console.log(`   Company: ${connection.Company}, Role: ${connection.Position}`);
    
    const result = await findLocationWithFallbackStrategies(connection);
    
    console.log(`   📍 Location: ${result.location || 'Not found'}`);
    console.log(`   🔍 Source: ${result.source}`);
    console.log(`   📊 Confidence: ${result.confidence}`);
    
    // Small delay to be respectful
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log('\n✅ Enhanced location finder testing complete!');
  console.log('💡 Key improvements:');
  console.log('   • Focuses on personal/residential locations');
  console.log('   • Avoids company headquarters fallback');
  console.log('   • Uses industry intelligence only when highly confident');
  console.log('   • Provides confidence levels and sources');
}

if (require.main === module) {
  testEnhancedLocationFinder().catch(console.error);
}
