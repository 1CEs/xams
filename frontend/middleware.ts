// middleware.ts
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the user cookie and access token cookie
  const userCookie = request.cookies.get('user')
  const accessToken = request.cookies.get('accessToken')
  
  // Check if the user is authenticated
  if (!userCookie || !userCookie.value || !accessToken || !accessToken.value) {
    // If cookies don't exist, redirect to sign-in
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

    // Check if the access token JWT is expired
    // Note: We can't verify the JWT signature on the client side,
    // but we can check if it's in valid JWT format and if it's expired
    const token = accessToken.value
    const tokenParts = token.split('.')
    
    if (tokenParts.length !== 3) {
      // Not a valid JWT format
      const url = request.nextUrl.clone()
      url.pathname = '/member/sign-in'
      return NextResponse.redirect(url)
    }

    try {
      // Decode the payload (middle part of JWT)
      const payload = JSON.parse(atob(tokenParts[1]))
      
      // Check if token is expired
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        // Token is expired, redirect to sign-in
        const url = request.nextUrl.clone()
        url.pathname = '/member/sign-in'
        return NextResponse.redirect(url)
      }
    } catch (jwtError) {
      // Error decoding JWT, redirect to sign-in
      console.error('Error decoding JWT:', jwtError)
      const url = request.nextUrl.clone()
      url.pathname = '/member/sign-in'
      return NextResponse.redirect(url)
    }
    
    // User is authenticated and token is valid, proceed with the request
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
    '/overview/:path*',  // Matches /overview and all its subpaths
  ]
}
