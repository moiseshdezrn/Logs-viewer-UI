import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  // Respond to preflight requests.
  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = body?.email;
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // If an external auth URL is configured, proxy the login request there.
  // This keeps the browser calling the same origin (no CORS issues) while
  // forwarding credentials to the real auth service.
  const authUrl = process.env.API_BASE_URL;
  const authPath = process.env.AUTH_PATH ?? "/login";

  if (authUrl) {
    const targetUrl = new URL(authPath, authUrl).toString();

    const backendRes = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await backendRes.json().catch(() => ({}));

    return NextResponse.json(data, {
      status: backendRes.status,
      headers: CORS_HEADERS,
    });
  }

  // Fallback: return a mock response when no external auth URL is configured.
  return NextResponse.json(
    {
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      username: email.split("@")[0],
      email,
    },
    { headers: CORS_HEADERS }
  );
}
