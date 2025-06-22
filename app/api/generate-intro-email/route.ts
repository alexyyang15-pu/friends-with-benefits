import { NextResponse, NextRequest } from 'next/server';
import { generateIntroEmail } from '../../../lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userProfile,
      targetContact,
      introducerContact,
      targetContactExperience,
      reasonForIntroduction,
      ask,
      feedback,
      careerObjective,
    } = body;

    if (
      !userProfile ||
      typeof userProfile !== 'object' ||
      !targetContact ||
      typeof targetContact !== 'object' ||
      !introducerContact ||
      typeof introducerContact !== 'object' ||
      !targetContactExperience ||
      !reasonForIntroduction ||
      !ask
    ) {
      return NextResponse.json(
        {
          error:
            'Missing or invalid required fields in request body. Ensure profile, target, and introducer are valid objects.',
        },
        { status: 400 }
      );
    }

    const email = await generateIntroEmail({
      userProfile,
      targetContact,
      introducerContact,
      targetContactExperience,
      reasonForIntroduction,
      ask,
      feedback,
      careerObjective,
    });

    return NextResponse.json(email);
  } catch (error) {
    console.error('Error in /api/generate-intro-email:', error);
    return NextResponse.json(
      { error: 'Failed to generate intro email' },
      { status: 500 }
    );
  }
} 