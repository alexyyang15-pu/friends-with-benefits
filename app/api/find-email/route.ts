import { NextResponse } from 'next/server';
import { findEmail } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { firstName, lastName, company } = await req.json();

    if (!firstName || !lastName || !company) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, company' },
        { status: 400 }
      );
    }

    const email = await findEmail(firstName, lastName, company);

    return NextResponse.json({ email });
  } catch (error) {
    console.error('Error in find-email route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 