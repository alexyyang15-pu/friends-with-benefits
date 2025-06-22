import { NextResponse, NextRequest } from 'next/server';
import { getExperienceSummary } from '../../../lib/gemini';
import { Connection } from '../../../lib/types';

export async function POST(req: NextRequest) {
  try {
    const connection = (await req.json()) as Connection;

    if (!connection) {
      return NextResponse.json(
        { error: 'Missing connection data in request body' },
        { status: 400 }
      );
    }

    const summary = await getExperienceSummary(connection);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error in /api/get-target-experience:', error);
    return NextResponse.json(
      { error: 'Failed to generate experience summary' },
      { status: 500 }
    );
  }
} 