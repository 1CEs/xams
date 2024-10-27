// middleware.js (or middleware.ts)
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the user cookie
  const userCookie = request.cookies.get('user')
  console.log(userCookie)
  if (!userCookie) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Skip all paths that should not be internationalized
  matcher: ['/overview'],
}
