import { NextRequest, NextResponse } from "next/server";

const SPEECH_SERVER_URL =
  process.env.SPEECH_SERVER_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio") as Blob | null;
    const language = (formData.get("language") as string) || "en-US";
    const useWhisper = formData.get("useWhisper") === "true";

    if (!audio) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 }
      );
    }

    // Create a new FormData for the speech server
    const serverFormData = new FormData();
    serverFormData.append("audio", audio);
    serverFormData.append("language", language);

    // Use Whisper endpoint for offline transcription (more reliable)
    const endpoint = useWhisper ? "/api/stt/whisper" : "/api/stt";

    const response = await fetch(`${SPEECH_SERVER_URL}${endpoint}`, {
      method: "POST",
      body: serverFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("STT server error:", errorText);
      return NextResponse.json(
        { error: "STT server error", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in STT API route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
