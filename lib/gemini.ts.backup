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

export async function generateIntroEmail({
  userProfile,
  targetContact,
  introducerContact,
  targetContactExperience,
  reasonForIntroduction,
  ask,
  feedback,
  careerObjective,
}: {
  userProfile: any;
  targetContact: Connection;
  introducerContact: Connection;
  targetContactExperience: string;
  reasonForIntroduction: string;
  ask: string;
  feedback?: string;
  careerObjective?: string;
}): Promise<GeneratedEmail> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro-preview-06-05',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.8,
    },
  });

  const userName = userProfile?.name || 'The User';

  const systemPrompt = `
You are a master of professional networking and an expert email copywriter. Your task is to draft a compelling, authentic, and concise cold outreach email.

**Objective:**
Write an email from the user (me) directly to the target contact. The email should:
- Be addressed to the target by name.
- Clearly explain why I want to connect, what I'm interested in, and what I hope to discuss (using the provided "reason" and "ask").
- Reference my background (from my profile) if relevant.
- Be friendly, concise, and professional.
- Avoid overly formal or corporate language.
- The subject line should be clear and inviting.

**Key Principles to Follow:**
*   Tailor every element to the specific person and company.
*   Show genuine research and interest; never be generic.
*   Lead with value and connection before making the ask.
*   Make it easy for the recipient to understand your purpose.
*   Demonstrate sincerity through specificity and effort.
*   Address power dynamics appropriately: be respectful but confident.

**Structure & Content:**
*   **Subject Line:** Create a subject line based on the following rules:
    *   The primary format should be "Intro: [Your Name] to [Target's First Name]".
    *   If the user's "ask" specifically mentions an internship or job, adapt the subject line to reflect that interest. For example: "Intro: [User's Name] - Interest in [Job Title/Internship]".
*   **Opening:** Start with a friendly greeting to the target by name.
*   **The "Why":** Briefly explain why you are reaching out, referencing the provided reason.
*   **Your Background:** Briefly introduce yourself. Then, to provide more context, write a short paragraph summarizing 2-3 of your most relevant roles or experiences from your resume. Crucially, select the experiences that are most relevant to the target's own role, company, or industry.
*   **The "Ask":** Clearly and concisely state what you hope to discuss or ask of the target.
*   **Closing:** End with a polite, professional closing and your name.

**Output Format:**
Your final output MUST be a single JSON object with two keys: "subject" (a string) and "body" (a string). The body should use newline characters (\n) for paragraph breaks.
`;

  const feedbackPrompt = feedback
    ? `
**Regeneration Feedback:**
The user has requested changes to the previous version. Please incorporate the following feedback:
"${feedback}"
`
    : '';

  const prompt = `
Please draft the email based on the following context:
${feedbackPrompt}
**1. Me (the user):**
   - Name: ${userName}
   - Profile: ${JSON.stringify(userProfile, null, 2)}
   - My Career Objective: "${careerObjective || 'Not specified'}"

**2. The Target (person I want to reach):**
   - Name: ${targetContact['First Name']} ${targetContact['Last Name']}
   - Role: ${targetContact.Position} at ${targetContact.Company}
   - Professional Summary: ${targetContactExperience}

**3. The "Why" (reason for the intro, from me):**
   - "${reasonForIntroduction}"

**4. The "Ask" (what I want, from me):**
   - "${ask}"
`;

  const result = await model.generateContent([systemPrompt, prompt]);
  const responseText = result.response.text();
  return JSON.parse(responseText) as GeneratedEmail;
}

export async function getStructuredQuery(
  query: string
): Promise<StructuredQuery> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro-preview-06-05',
  });

  const prompt = `
    You are a search expert. Your task is to analyze a user's search query and convert it into a structured JSON object.

    The user's search query is: "${query}"

    Please extract the following fields:
    - roles: A list of job titles or roles mentioned.
    - companies: A list of company names mentioned.
    - industries: A list of industries mentioned (e.g., "fintech", "healthcare").
    - keywords: Any other important keywords or locations.
    - searchDirective: A one-sentence, highly specific instruction for a recruitment assistant to follow. This should capture the core intent, including what to include and what to strictly exclude.

    If a field is not mentioned, omit it from the JSON object.
    Your final output should be ONLY the JSON object, with no other text or markdown formatting.

    Example 1:
    Query: "tech entrepreneurs"
    Output:
    {
      "roles": ["entrepreneur", "founder", "CEO"],
      "industries": ["tech"],
      "searchDirective": "Find founders and operators of technology companies, and strictly exclude investors or financiers."
    }

    Example 2:
    Query: "people that work in tech"
    Output:
    {
      "industries": ["tech"],
      "searchDirective": "Find anyone working in the technology industry, including entrepreneurs, investors, engineers, and other related roles."
    }
  `;
  const result = await model.generateContent(prompt);
  const response = await result.response;

  // The model can sometimes return the JSON wrapped in markdown.
  const cleanedText = response
    .text()
    .trim()
    .replace(/^```json/, '')
    .replace(/```$/, '');

  return JSON.parse(cleanedText) as StructuredQuery;
}

export async function getEnhancedSearchResults(
  query: string,
  connections: Connection[],
  searchDirective?: string
): Promise<SearchResult[]> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro-preview-06-05',
  });

  const generationConfig: GenerationConfig = {
    responseMimeType: 'application/json',
    temperature: 0.3,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];

  const connectionsWithLocation = connections.map((c) => ({
    ...c,
    location: c.location || 'Unknown',
  }));

  const systemPrompt = `
You are an expert system for searching and analyzing a user's professional network from a provided JSON list of connections. Your task is to perform a deep contextual analysis based on the user's query and return a ranked list of all relevant results.

**Instructions:**
1.  **Analyze the User's Query:** Understand the user's intent. They might be looking for people based on their role, industry, company, seniority, location, or a combination of these. Your interpretation should be broad to cast a wide net.
    ${
      searchDirective
        ? `\n**Search Directive:** Follow this specific instruction: "${searchDirective}"\n`
        : ''
    }
2.  **Filter and Rank Connections:** Go through the entire list of connections and identify every connection that is potentially relevant to the user's query. It is better to include a moderately relevant connection than to exclude a potentially good one. You MUST rank the results in descending order of relevance.
3.  **Infer Context:** The user's query might be abstract. You need to infer context. For example:
    *   If the user asks for "VCs," you should identify people with titles like "Investor," "Partner," "Analyst" at firms that are venture capital funds, even if the word "VC" isn't in their title.
    *   If the user specifies a location (e.g., "in London"), you must filter by the 'location' field.
4.  **Provide a Reason:** For each result you return, you MUST provide a brief, insightful "reason" (a string, 1-2 sentences) explaining *why* that person is a relevant match for the query.
5.  **Return ALL Relevant Results:** Your final output must be a JSON object with a single key, "results," which contains an array of ALL the filtered connection objects you found, ranked by relevance. Each connection object in the array must be complete and include your generated "reason". Do not arbitrarily limit the number of results.

**Example Input Data Format:**
A JSON array of connection objects, where each object looks like:
{ "First Name": "Jane", "Last Name": "Doe", "Company": "Tech Innovations Inc.", "Position": "Software Engineer", "location": "San Francisco, CA" }

**Example User Query:** "founders in the fintech space"

**Example Output:**
{
  "results": [
    {
      "First Name": "John",
      "Last Name": "Smith",
      "Company": "PayUp",
      "Position": "Co-founder & CEO",
      "location": "New York, NY",
      "reason": "John is the co-founder of PayUp, a well-known company in the financial technology sector."
    }
  ]
}
`;

  const prompt = `
User Query: "${query}"

Connections List:
${JSON.stringify(connectionsWithLocation, null, 2)}
`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: {
      role: 'system',
      parts: [
        {
          text: systemPrompt,
        },
      ],
    },
    generationConfig,
    safetySettings,
  });

  const responseText = result.response.text();
  const parsedResponse = JSON.parse(responseText);
  return parsedResponse.results || [];
}

export async function findLocationForConnection(
  connection: Connection
): Promise<string | null> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro-preview-06-05',
  });

  const prompt = `What is the current location (city and country) of ${connection['First Name']} ${connection['Last Name']}, who works at ${connection.Company}? Use information from their public LinkedIn profile or the company's website to answer. Please provide just the location as a string (e.g., "Toronto, Canada" or "New York, NY"). If you cannot find a specific city, the company's headquarters location is a good alternative. If no location can be found, return the single word "Unknown".`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Check for negative responses from the model
    if (
      responseText.toLowerCase() === 'unknown' ||
      responseText.length === 0 ||
      responseText.toLowerCase().includes('i cannot') ||
      responseText.toLowerCase().includes('unable to provide')
    ) {
      return null;
    }

    return responseText;
  } catch (error) {
    console.error(
      `Error finding location for ${connection['First Name']} ${connection['Last Name']}:`,
      error
    );
    return null;
  }
}

export async function findClosestConnections(
  targetContact: Connection,
  connections: Connection[],
  userProfile: any | null,
  careerObjective: string | null
): Promise<SearchResult[]> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro-preview-06-05',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  });

  const userProfilePrompt = userProfile
    ? `
**User's Professional Profile (for context):**
Analyze this profile to understand who the user is. This context is crucial for determining relevance.
- Name: ${userProfile.name}
- Title: ${userProfile.title}
- Summary: ${userProfile.summary}
- Key Skills: ${userProfile.skills.join(', ')}
`
    : `The user has not provided their own professional profile. Base your analysis only on the target individual and the connection pool.`;

  const careerObjectivePrompt = careerObjective
    ? `
**User's Stated Career Goal:**
"${careerObjective}"
Use this goal as a primary lens for determining relevance.`
    : `The user has not provided a specific career goal.`;

  const systemPrompt = `
You are an expert networking assistant and career strategist. Your task is to analyze a target individual, a list of other connections, and the user's own professional profile to find the 10 people from the list who would be the most valuable and relevant for the user to connect with to get an introduction to the target.

**Instructions:**
1.  **Analyze the User's Profile and Goal:** ${userProfilePrompt} ${careerObjectivePrompt}
2.  **Analyze the Target:** Carefully review the professional details of the target individual the user wants to meet.
3.  **Find the Bridge:** Go through the entire "Connection Pool" and find the 10 best people who can act as a bridge between the user and the target.
4.  **Determine Closeness and Relevance:** Identify the 10 strongest introducers based on a holistic view of these criteria (in order of importance):
    *   **Direct overlap with the Target:** Prioritize connections who have worked at the same company or attended the same school as the target.
    *   **Relevance to the User:** From that group, prioritize people who are in a similar industry, role, or share skills with the USER, keeping in mind their stated career objective. A good introduction comes from a place of mutual understanding and helps the user achieve their goal.
    *   **Seniority and Role:** Consider if the connection is in a position to have a strong relationship with the target.
5.  **Provide a Reason:** For each of the 10 results, you MUST provide a brief "reason" (a string, 1-2 sentences) explaining *why this person is a great introducer*. The reason MUST be explicitly tied to the user's background (resume) and their career goal. For example: "Given your goal of pivoting to fintech, her experience at Stripe and connection to the target makes her an ideal person for an introduction."
6.  **Return Exactly 10 Results:** Your final output must be a JSON object with a single key, "results," which contains an array of exactly 10 of the connection objects you found, ranked by their value as an introducer. Each connection object in the array must be complete and include your generated "reason".
`;

  const prompt = `
Target Individual (who the user wants to meet):
${JSON.stringify(targetContact, null, 2)}

Connection Pool (potential introducers to search from):
${JSON.stringify(
  connections.filter((c) => c.URL !== targetContact.URL),
  null,
  2
)}
`;

  const result = await model.generateContent([systemPrompt, prompt]);

  const responseText = result.response.text();
  const parsedResponse = JSON.parse(responseText);
  return parsedResponse.results || [];
}

export async function findEmail(
  firstName: string,
  lastName: string,
  company: string
): Promise<string | null> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro-preview-06-05',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const prompt = `Based on public information, what is the most likely professional email for ${firstName} ${lastName} who works at ${company}? Please return a JSON object with a single key, "email". If you cannot find it, return null for the email value.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    const parsedResponse = JSON.parse(responseText);
    return parsedResponse.email || null;
  } catch (error) {
    console.error(
      `Error finding email for ${firstName} ${lastName}:`,
      error
    );
    return null;
  }
}

export async function extractProfileFromText(
  documentText: string
): Promise<any> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro-preview-06-05',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  const systemPrompt = `
You are an expert HR analyst and a masterful copywriter. Your task is to parse the text content of a resume or professional profile and extract key information into a structured JSON object.

**Instructions:**
1.  **Extract Core Details:** Identify the user's full name and current job title.
2.  **Create a Professional Summary:** Write a concise, one-paragraph summary of the user's professional background and expertise. This should be a high-level overview.
3.  **List Key Skills:** Identify and list the top 10-15 most relevant hard and soft skills.
4.  **Detail Work Experience:** Create a list of their most recent and relevant work experiences. For each position, include the company name, job title, and the start and end dates.
5.  **Write a Dramatic Summary:** This is the most important step. Create a single, impactful, and very positively-phrased sentence that encapsulates the user's professional essence and key achievements. This should be suitable for a dramatic, typewriter-style reveal.
6.  **Return JSON Object:** Your final output must be a single JSON object with the following keys: "name", "title", "summary", "skills" (an array of strings), "experience" (an array of objects), and "dramaticSummary" (a string).

**Example Output:**
{
  "name": "Jane Doe",
  "title": "Senior Product Manager",
  "summary": "Accomplished Senior Product Manager with over 10 years of experience driving product strategy and execution in the SaaS industry. Proven ability to lead cross-functional teams to deliver innovative solutions that meet market demands and delight customers.",
  "skills": ["Product Strategy", "Roadmap Planning", "Agile Methodologies", "User Research", "Data Analysis", "Go-to-Market Strategy", "Leadership"],
  "experience": [
    {
      "company": "Innovate Corp",
      "title": "Senior Product Manager",
      "dates": "2018 - Present"
    },
    {
      "company": "Solutions Inc.",
      "title": "Product Manager",
      "dates": "2015 - 2018"
    }
  ],
  "dramaticSummary": "A visionary product leader who transforms complex challenges into elegant, market-leading solutions."
}
`;

  const prompt = `
Please extract the professional profile from the following document text:
---
${documentText}
---
`;

  const result = await model.generateContent([systemPrompt, prompt]);
  const responseText = result.response.text();
  return JSON.parse(responseText);
}

export async function generateDramaticGoal(
  objective: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro-preview-06-05',
    generationConfig: {
      temperature: 0.7,
    },
  });

  const prompt = `
    You are a masterful copywriter specializing in motivation and career coaching.
    A user has provided their career objective. Your task is to distill this objective into a single, impactful, and dramatic sentence.
    This sentence should be short, inspiring, and encapsulate the essence of their goal.

    User's Objective: "${objective}"

    Examples:
    - Objective: "I want to find a new job as a software engineer in the fintech space because I'm passionate about financial technology."
    - Dramatic Sentence: "To pioneer the future of finance through code."

    - Objective: "I'm looking to pivot from marketing into product management."
    - Dramatic Sentence: "To build the products that will define tomorrow."
    
    - Objective: "I want to network with other entrepreneurs and learn from them."
    - Dramatic Sentence: "To connect with the minds shaping the future."

    Return only the single, dramatic sentence as a string.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim().replace(/"/g, ''); // Remove quotes from the output
  } catch (error) {
    console.error('Error generating dramatic goal:', error);
    return objective; // Fallback to the original objective
  }
} 