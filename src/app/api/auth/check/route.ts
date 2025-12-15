import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("admin_session");

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Decode and validate session
    try {
      const sessionData = JSON.parse(
        Buffer.from(sessionCookie.value, "base64").toString()
      );

      // Check if session is not older than 7 days
      const sessionAge = Date.now() - sessionData.timestamp;
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

      if (sessionAge > maxAge) {
        return NextResponse.json(
          { authenticated: false, error: "Session expired" },
          { status: 401 }
        );
      }

      return NextResponse.json({
        authenticated: true,
        user: {
          id: sessionData.userId,
          email: sessionData.email,
        },
      });
    } catch {
      return NextResponse.json(
        { authenticated: false, error: "Invalid session" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { authenticated: false, error: "Auth check failed" },
      { status: 500 }
    );
  }
}
