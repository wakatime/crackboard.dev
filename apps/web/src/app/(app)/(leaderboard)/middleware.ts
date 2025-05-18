import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.headers.get('host') === 'crackedboard.dev') {
    return NextResponse.redirect('https://crackboard.dev/');
  }
  return NextResponse.next();
}
