import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL || "https://localhost:7257";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteParams) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      { message: "Authorization header required" },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const targetUrl = `${API_BASE_URL}/api/Log/${id}`;

    console.log(`[API Route] Fetching log ${id} from: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json"
      },
      cache: 'no-store'
    });

    console.log(`[API Route] Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Route] Backend error: ${errorText}`);
      return NextResponse.json(
        { message: "Log not found" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[API Route] Successfully fetched log ${id}`);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[API Route] Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch log details from backend", error: String(error) },
      { status: 500 }
    );
  }
}
