import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');

  return NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    { status: 200 }
  );
}
