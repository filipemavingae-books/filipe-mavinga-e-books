import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Filipe Mavinga E-books",
  })
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  })
}
