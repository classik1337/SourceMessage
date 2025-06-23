import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Создаем ответ
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );

    // Удаляем куку с токеном
    response.cookies.set({
      name: 'token',
      value: '',
      maxAge: 0, // Немедленное удаление
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return response;

  } catch (error) {
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
} 