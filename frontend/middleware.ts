// middleware.ts
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the user cookie
  const userCookie = request.cookies.get('user')
  
  // Check if the user is authenticated
  if (!userCookie || !userCookie.value) {
    // If the request is for a protected route, redirect to the sign-in page
    const url = request.nextUrl.clone()
    url.pathname = '/member/sign-in'
    return NextResponse.redirect(url)
  }

  try {
    // Parse the user cookie to verify it contains valid data
    const userData = JSON.parse(userCookie.value)
    
    // Check if the user data has the required fields
    if (!userData._id || !userData.role) {
      // Invalid user data, redirect to sign-in
      const url = request.nextUrl.clone()
      url.pathname = '/member/sign-in'
      return NextResponse.redirect(url)
    }
    
    // User is authenticated, proceed with the request
    return NextResponse.next()
  } catch (error) {
    // Error parsing the cookie, redirect to sign-in
    console.error('Error parsing user cookie:', error)
    const url = request.nextUrl.clone()
    url.pathname = '/member/sign-in'
    return NextResponse.redirect(url)
  }
}

export const config = {
  // Define all protected routes that require authentication
  matcher: [
    '/feedback',
    '/overview/:path*',  // Matches /overview and all its subpaths
  ]
}