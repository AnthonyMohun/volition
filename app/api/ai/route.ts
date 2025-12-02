import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const lmstudioUrl = process.env.LMSTUDIO_URL || "http://127.0.0.1:1234";
    const inferPath = process.env.LMSTUDIO_INFER_PATH || "/v1/chat/completions";
    const model = process.env.LMSTUDIO_MODEL || body.model || "";

    const targetUrl = `${lmstudioUrl}${inferPath}`;

    // Prepare the request body for LM Studio
    const lmStudioBody = {
      model: model,
      messages: body.messages || [],
      temperature: body.temperature ?? 0.7,
      max_tokens: body.max_tokens || 150,
      stream: false,
    };

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(lmStudioBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LM Studio API error:", errorText);
      return NextResponse.json(
        { error: "Failed to get response from LM Studio", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in AI API route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
