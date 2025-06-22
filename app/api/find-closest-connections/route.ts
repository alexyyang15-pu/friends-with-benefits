import { NextResponse } from 'next/server';
import { Connection, ClosestConnection } from '@/lib/types';
import { findClosestConnections } from '@/lib/gemini';
import { UserProfile } from '@/hooks/useUserProfile';

export async function POST(req: Request) {
  try {
    const {
      targetContact,
      connections,
      userProfile,
      careerObjective,
    }: {
      targetContact: Connection;
      connections: Connection[];
      userProfile: UserProfile | null;
      careerObjective: string | null;
    } = await req.json();

    if (!targetContact || !connections || connections.length === 0) {
      return NextResponse.json(
        { error: 'Missing targetContact or connections' },
        { status: 400 }
      );
    }

    const results = await findClosestConnections(
      targetContact,
      connections,
      userProfile,
      careerObjective
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in find-closest-connections route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 