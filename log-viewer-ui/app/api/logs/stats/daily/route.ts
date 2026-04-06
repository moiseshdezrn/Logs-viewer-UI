import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL || "https://localhost:7257";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      { message: "Authorization header required" },
      { status: 401 }
    );
  }

  try {
    const targetUrl = `${API_BASE_URL}/api/Log/stats/daily`;

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json"
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching daily stats:", error);
    return NextResponse.json(
      { message: "Failed to fetch daily statistics from backend" },
      { status: 500 }
    );
  }
}
