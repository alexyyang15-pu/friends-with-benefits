import { NextResponse } from 'next/server';
import { extractProfileFromText } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided for analysis.' },
        { status: 400 }
      );
    }

    const userProfile = await extractProfileFromText(text);

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error analyzing profile text:', error);
    return NextResponse.json(
      { error: 'Failed to analyze profile text.' },
      { status: 500 }
    );
  }
} 