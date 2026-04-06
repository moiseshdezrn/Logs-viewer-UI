import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL || "https://localhost:7257";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      { message: "Authorization header required" },
      { status: 401 }
    );
  }

  try {
    const groupBy = searchParams.get("groupBy") || "day";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const params = new URLSearchParams({ groupBy });
    if (startDate) params.set("StartDate", startDate);
    if (endDate) params.set("EndDate", endDate);
    const targetUrl = `${API_BASE_URL}/api/Log/stats/timeline?${params.toString()}`;

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch timeline stats from backend" },
      { status: 500 }
    );
  }
}
