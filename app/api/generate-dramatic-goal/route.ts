import { NextResponse, NextRequest } from 'next/server';
import { generateDramaticGoal } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { objective } = body;

    if (!objective) {
      return NextResponse.json(
        { error: 'Objective is required.' },
        { status: 400 }
      );
    }

    const dramaticGoal = await generateDramaticGoal(objective);

    return NextResponse.json({ dramaticGoal });
  } catch (error) {
    console.error('Error in /api/generate-dramatic-goal:', error);
    return NextResponse.json(
      { error: 'Failed to generate dramatic goal.' },
      { status: 500 }
    );
  }
} 