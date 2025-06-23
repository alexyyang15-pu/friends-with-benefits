import { NextResponse } from 'next/server';
import { EnhancedLinkedInScraper } from '@/enhanced-linkedin-scraper';
import { Connection } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { searchResults, options = {} } = await request.json() as {
      searchResults: Connection[];
      options?: {
        maxProfiles?: number;
        skipExisting?: boolean;
        confidenceThreshold?: 'low' | 'medium' | 'high';
      };
    };

    if (!searchResults || !Array.isArray(searchResults)) {
      return NextResponse.json(
        { error: 'Search results array is required' },
        { status: 400 }
      );
    }

    console.log(`🎯 Enriching ${searchResults.length} search results with location data`);

    // Filter connections that need location enrichment
    const connectionsToEnrich = searchResults.filter(connection => {
      if (!connection.URL) return false;
      
      if (options.skipExisting && connection.location) {
        const hasGoodLocation = connection.location !== 'Unknown' && 
                               connection.location !== 'Send profile in a message' &&
                               connection.location !== 'Location not found' &&
                               connection.location !== 'Profile requires authentication';
        if (hasGoodLocation) return false;
      }
      
      return true;
    });

    console.log(`📋 ${connectionsToEnrich.length} connections need location enrichment`);

    if (connectionsToEnrich.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No connections need enrichment',
        searchResults: searchResults,
        stats: {
          total: searchResults.length,
          processed: 0,
          enriched: 0,
          errors: 0
        }
      });
    }

    // Limit batch size to prevent overloading
    const maxBatchSize = options.maxProfiles || 20;
    const batch = connectionsToEnrich.slice(0, maxBatchSize);

    if (batch.length < connectionsToEnrich.length) {
      console.log(`⚠️ Processing first ${batch.length} of ${connectionsToEnrich.length} connections to prevent overload`);
    }

    let enrichedConnections: Connection[] = [];
    let scraper: EnhancedLinkedInScraper | null = null;

    try {
      // Initialize the enhanced scraper
      scraper = new EnhancedLinkedInScraper();
      await scraper.init();

      // Process the batch
      enrichedConnections = await scraper.scrapeLocationsFromSearchResults(batch);

    } catch (error: any) {
      console.error('💥 Enrichment error:', error.message);

      if (error.message.includes('authentication required')) {
        return NextResponse.json({
          error: 'LinkedIn authentication required',
          authenticationNeeded: true,
          searchResults: searchResults,
          stats: {
            total: searchResults.length,
            processed: 0,
            enriched: 0,
            errors: batch.length
          }
        }, { status: 403 });
      }

      // Return partial results if available
      return NextResponse.json({
        error: 'Partial enrichment failure',
        searchResults: searchResults,
        stats: {
          total: searchResults.length,
          processed: 0,
          enriched: 0,
          errors: batch.length
        }
      }, { status: 500 });

    } finally {
      if (scraper) {
        await scraper.close();
      }
    }

    // Merge enriched data back into original search results
    const enrichedResults = searchResults.map(original => {
      const enriched = enrichedConnections.find(e => 
        e.URL === original.URL || 
        (e['First Name'] === original['First Name'] && e['Last Name'] === original['Last Name'])
      );
      
      if (enriched && enriched.location && enriched.location !== original.location) {
        return {
          ...original,
          location: enriched.location,
          locationSource: enriched.locationSource,
          locationConfidence: enriched.locationConfidence,
          enrichedAt: new Date().toISOString()
        };
      }
      
      return original;
    });

    // Calculate stats
    const stats = {
      total: searchResults.length,
      processed: batch.length,
      enriched: enrichedConnections.filter(c => 
        c.location && 
        c.location !== 'Location not found' && 
        c.location !== 'Profile requires authentication'
      ).length,
      errors: enrichedConnections.filter(c => 
        c.location === 'Scraping error' || 
        c.location === 'Profile requires authentication'
      ).length
    };

    console.log(`✅ Enrichment completed: ${stats.enriched}/${stats.processed} locations found`);

    return NextResponse.json({
      success: true,
      searchResults: enrichedResults,
      stats: stats,
      hasMore: connectionsToEnrich.length > batch.length,
      remaining: Math.max(0, connectionsToEnrich.length - batch.length)
    });

  } catch (error: any) {
    console.error('💥 API error:', error.message);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

// Get enrichment status and recommendations
export async function GET() {
  return NextResponse.json({
    service: 'Search Results Location Enrichment',
    features: [
      'Batch processing of search results',
      'Authenticated LinkedIn session reuse',
      'Smart filtering of connections needing enrichment',
      'Progress tracking and error handling',
      'Rate limiting to prevent detection'
    ],
    recommendations: {
      maxBatchSize: 20,
      timeBetweenBatches: '2-5 minutes',
      authenticationRequired: 'Run npm run auth-linkedin first'
    }
  });
}
