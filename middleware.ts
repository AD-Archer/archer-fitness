import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Allow email verification, password reset, and 2FA pages even for authenticated users
    const allowedAuthPaths = [
      "/auth/verify-email",
      "/auth/reset",
      "/auth/forgot-password",
      "/auth/2fa"
    ]
    
    if (allowedAuthPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next()
    }

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (token && pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    // If user is not authenticated and trying to access protected pages, redirect to signin
    if (!token && !pathname.startsWith("/auth") && pathname !== "/") {
      const callbackUrl = encodeURIComponent(req.url)
      return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Always allow email verification, password reset, and 2FA pages
        const allowedAuthPaths = [
          "/auth/verify-email",
          "/auth/reset",
          "/auth/forgot-password",
          "/auth/2fa"
        ]
        
        if (allowedAuthPaths.some(path => pathname.startsWith(path))) {
          return true
        }
        
        // Always allow auth pages
        if (pathname.startsWith("/auth")) {
          return true
        }
        
        // Allow home page for both authenticated and unauthenticated users
        if (pathname === "/") {
          return true
        }
        
        // Require token for all other protected pages
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/ (API routes handle their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js (service worker file)
     * - manifest files
     * - static assets (images, fonts, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|json|xml|txt|css|js|woff|woff2)).*)",
  ],
}
