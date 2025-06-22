import { NextResponse } from 'next/server';
import { Stagehand } from "@browserbasehq/stagehand";
import StagehandConfig from "@/stagehand.config";
import { z } from "zod";
import { Connection } from '@/lib/types';

const LocationSchema = z.object({
  location: z.string().optional(),
});

export async function POST(request: Request) {
  let stagehand: Stagehand | null = null;
  
  try {
    const { profileUrl, connectionData } = await request.json() as {
      profileUrl: string;
      connectionData: Connection;
    };

    if (!profileUrl) {
      return NextResponse.json(
        { error: 'Profile URL is required' },
        { status: 400 }
      );
    }

    // Initialize Stagehand
    stagehand = new Stagehand(StagehandConfig);
    await stagehand.init();
    
    const page = stagehand.page;

    // Navigate to the LinkedIn profile
    console.log(`Navigating to: ${profileUrl}`);
    await page.goto(profileUrl, { waitUntil: 'networkidle0' });

    // Wait a bit to ensure page loads completely
    await page.waitForTimeout(2000);

    // Check if we need to sign in (LinkedIn sometimes requires this)
    const needsSignIn = await page.evaluate(() => {
      return document.body.innerText.toLowerCase().includes('sign in') ||
             document.body.innerText.toLowerCase().includes('join now') ||
             document.URL.includes('/authwall');
    });

    if (needsSignIn) {
      return NextResponse.json(
        { 
          error: 'LinkedIn profile requires authentication',
          location: null,
          fallbackToAI: true 
        },
        { status: 403 }
      );
    }

    // Try to extract location using Stagehand's extract method
    try {
      const locationData = await page.extract({
        instruction: "Extract the person's current location or city. Look for location information near their name, in their profile details, or in their current position section. Return just the location string like 'San Francisco, CA' or 'London, UK'.",
        schema: LocationSchema,
        useTextExtract: false, // Use false for small extractions like location
      });

      const location = locationData.location;
      
      if (location && location.trim() && location.toLowerCase() !== 'unknown') {
        console.log(`Successfully extracted location: ${location}`);
        return NextResponse.json({ 
          location: location.trim(),
          source: 'stagehand' 
        });
      }
    } catch (extractError) {
      console.log('Stagehand extraction failed, trying alternative method:', extractError);
    }

    // Fallback: Try to find location using observe method
    try {
      const locationElements = await page.observe({
        instruction: "Find any element that contains the person's current location, city, or geographical information",
        onlyVisible: true,
        returnAction: false,
      });

      if (locationElements && locationElements.length > 0) {
        // Extract text from the first location element
        const locationText = await page.evaluate((selector) => {
          const element = document.querySelector(selector);
          return element ? element.textContent?.trim() : null;
        }, locationElements[0].selector);

        if (locationText && locationText.toLowerCase() !== 'unknown') {
          console.log(`Successfully found location via observe: ${locationText}`);
          return NextResponse.json({ 
            location: locationText,
            source: 'stagehand-observe' 
          });
        }
      }
    } catch (observeError) {
      console.log('Stagehand observe failed:', observeError);
    }

    // If we reach here, no location was found
    return NextResponse.json({ 
      location: null,
      fallbackToAI: true,
      message: 'No location found on profile' 
    });

  } catch (error: any) {
    console.error('Error in scrape-location API:', error);
    
    // Return fallback flag so the caller can try AI method
    return NextResponse.json({
      error: 'Failed to scrape location',
      location: null,
      fallbackToAI: true,
      details: error.message
    }, { status: 500 });
  } finally {
    // Always close Stagehand instance
    if (stagehand) {
      try {
        await stagehand.close();
      } catch (closeError) {
        console.error('Error closing Stagehand:', closeError);
      }
    }
  }
} 