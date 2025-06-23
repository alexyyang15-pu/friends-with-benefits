import {
  GoogleGenerativeAI,
  GenerationConfig,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import {
  Connection,
  GeneratedEmail,
  SearchResult,
  StructuredQuery,
} from './types';

// Get your API key from https://aistudio.google.com/app/apikey
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Enhanced location function with better prompting
export async function findLocationForConnection(
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

    // Enhanced filtering to catch company headquarters and invalid responses
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
        lowerText.includes('not available') ||
        lowerText.includes('headquarters') ||
        lowerText.includes('head office') ||
        lowerText.includes('main office') ||
        lowerText.includes('corporate office') ||
        lowerText.includes('based on their company') ||
        lowerText.includes('company location') ||
        lowerText.includes('office location')
      ) {
        return true;
      }

      // Check if response references the company name (likely HQ fallback)
      const companyName = connection.Company?.toLowerCase() || '';
      if (companyName && lowerText.includes(companyName)) {
        console.log(`⚠️  Rejected location for ${connection['First Name']} ${connection['Last Name']}: appears to be company-related`);
        return true;
      }

      return false;
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

// Keep all other existing functions from the original gemini.ts
export async function getExperienceSummary(
  connection: Connection
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro-preview-06-05',
  });

  const prompt = `
    You are an expert career analyst. Based on the following professional details, please provide a concise, one-paragraph summary of this person's likely professional background and expertise. 
    Focus on their role and company. Do not use their name in the summary.

    **Name:** ${connection['First Name']} ${connection['Last Name']}
    **Company:** ${connection.Company}
    **Position:** ${connection.Position}

    Your summary should be written in a professional and objective tone.
    Example: "This individual is a seasoned software engineer at a major tech company, likely specializing in front-end development and user interface design."
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating experience summary:', error);
    return 'Could not generate a summary for this contact.';
  }
}

// Export other functions as needed...
// (keeping the file focused on the enhanced location function for now)
