import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    // Clear the accessToken cookie by setting maxAge to 0
    response.cookies.set('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, 
    });

    return response;
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}