import { NextRequest, NextResponse } from "next/server";

const SPEECH_SERVER_URL =
  process.env.SPEECH_SERVER_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, language = "en" } = body;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const response = await fetch(`${SPEECH_SERVER_URL}/api/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, language }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("TTS server error:", errorText);
      return NextResponse.json(
        { error: "TTS server error", details: errorText },
        { status: response.status }
      );
    }

    // Return the audio file with proper headers
    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Error in TTS API route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
