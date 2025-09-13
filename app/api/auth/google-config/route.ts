import { NextResponse } from "next/server"

export async function GET() {
  const isGoogleConfigured = !!(
    (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  )

  return NextResponse.json({ isGoogleConfigured })
}