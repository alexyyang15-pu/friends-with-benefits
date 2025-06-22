import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { location } = await req.json();

    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro-preview-06-05',
    });

    const prompt = `What are the latitude and longitude for ${location}? Please return the answer as a JSON object with "lat" and "lng" keys, like this: {"lat": 40.7128, "lng": -74.0060}. If you cannot find the coordinates, return a JSON object with null values.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    const cleanedText = responseText.replace(/^```json/, '').replace(/```$/, '');

    const coordinates = JSON.parse(cleanedText);

    if (!coordinates || coordinates.lat === null || coordinates.lng === null) {
      return NextResponse.json(
        { error: 'Could not geocode location' },
        { status: 404 }
      );
    }

    return NextResponse.json(coordinates);
  } catch (error) {
    console.error('Error in geocoding route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 