import { NextResponse } from 'next/server';
import {
  SearchApiRequest,
  Connection,
  StructuredQuery,
  SearchResult,
} from '@/lib/types';
import { getStructuredQuery, getEnhancedSearchResults } from '@/lib/gemini';

function rankAndFilterConnections(
  connections: Connection[],
  structuredQuery: StructuredQuery
): Connection[] {
  const { keywords = [], roles = [], companies = [], industries = [] } =
    structuredQuery;

  if (
    [keywords, roles, companies, industries].every((arr) => arr.length === 0)
  ) {
    return []; // No criteria, return nothing to avoid sending all connections
  }

  const scoredConnections = connections.map((connection) => {
    let score = 0;
    const position = connection.Position.toLowerCase();
    const company = connection.Company.toLowerCase();
    const positionWords = position.split(' ');

    // Score roles: Exact match > Word match > Partial match
    roles.forEach((role) => {
      const lowerCaseRole = role.toLowerCase();
      if (position === lowerCaseRole) {
        score += 5; // Exact match
      } else if (positionWords.includes(lowerCaseRole)) {
        score += 3; // Word match
      } else if (position.includes(lowerCaseRole)) {
        score += 1; // Partial match
      }
    });

    // Score companies: Exact match > Partial match
    companies.forEach((comp) => {
      const lowerCaseComp = comp.toLowerCase();
      if (company.includes(lowerCaseComp)) {
        score += 3;
      }
    });

    // Score keywords/industries
    [...keywords, ...industries].forEach((keyword) => {
      const lowerCaseKeyword = keyword.toLowerCase();
      if (
        position.includes(lowerCaseKeyword) ||
        company.includes(lowerCaseKeyword)
      ) {
        score += 1;
      }
    });

    return { ...connection, score };
  });

  // Filter out connections with no score and sort by score descending
  return scoredConnections
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);
}

export async function POST(request: Request) {
  try {
    const body: SearchApiRequest = await request.json();
    const { query, connections } = body;

    if (!query || !connections) {
      return NextResponse.json(
        { error: 'Missing query or connections' },
        { status: 400 }
      );
    }

    // Step 1: Get structured query from the user's search term
    const structuredQuery = await getStructuredQuery(query);

    // Step 2: Rank all connections based on the structured query
    const candidateConnections = rankAndFilterConnections(
      connections,
      structuredQuery
    );

    // Step 3: Send the top 50 candidates for enhanced analysis
    const results = await getEnhancedSearchResults(
      query,
      candidateConnections.slice(0, 50),
      structuredQuery.searchDirective
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 