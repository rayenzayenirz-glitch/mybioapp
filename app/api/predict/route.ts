import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("Received /api/predict payload:", payload);

    return NextResponse.json({
      recommendation: "No antibiotic needed",
      confidence: 0.85,
    });
  } catch (error) {
    console.error("Invalid /api/predict request:", error);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
}