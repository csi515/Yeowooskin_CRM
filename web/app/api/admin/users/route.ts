import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { message: 'Not implemented / 관리자 사용자 API 준비 중' },
    { status: 501 },
  );
}
