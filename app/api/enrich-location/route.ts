import { NextResponse } from 'next/server';
import { findLocationForConnection } from '@/lib/gemini';
import { Connection } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const connection = (await request.json()) as Connection;

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection data is required.' },
        { status: 400 }
      );
    }

    const location = await findLocationForConnection(connection);

    return NextResponse.json({ location });
  } catch (error: any) {
    console.error('Error in enrich-location API:', error);
    return NextResponse.json(
      { error: 'Failed to enrich location.' },
      { status: 500 }
    );
  }
} 