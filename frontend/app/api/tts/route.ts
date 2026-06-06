import { NextRequest, NextResponse } from "next/server";
import { EdgeTTS } from "edge-tts-universal";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");
  const gender = searchParams.get("gender") || "female"; // 기본값: 여성
  
  if (!text) {
    return new NextResponse("Text is required", { status: 400 });
  }

  // 환경 변수에서 구글 API 키 확인 (공식 Google Cloud TTS API 연동용)
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      // 성별에 따른 구글 Neural2 음성 모델 결정
      const googleVoiceName = gender === "male" ? "ko-KR-Neural2-C" : "ko-KR-Neural2-A";
      const googleGender = gender === "male" ? "MALE" : "FEMALE";

      // 공식 Google Cloud Text-to-Speech API 호출
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: { text },
            voice: {
              languageCode: "ko-KR",
              name: googleVoiceName, 
              ssmlGender: googleGender,
            },
            audioConfig: {
              audioEncoding: "MP3",
              speakingRate: 0.85, // 경계선 지능 아동을 위해 0.85배속으로 조금 천천히 설정
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.audioContent) {
          const audioBuffer = Buffer.from(data.audioContent, "base64");
          return new NextResponse(audioBuffer, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=3600, s-maxage=3600",
            },
          });
        }
      }
      console.warn("공식 Google Cloud TTS API 호출 실패. Microsoft Edge TTS로 대체합니다.");
    } catch (e) {
      console.error("공식 Google Cloud TTS API 에러:", e);
    }
  }

  try {
    // API 키가 없거나 실패했을 때 기본값: Microsoft Edge 온라인 서비스 연동
    // -15% 속도로 조금 차분하게 읽도록 설정하여 경계선 지능 아동들의 인지 학습에 부합하도록 최적화
    const voiceName = gender === "male" ? "ko-KR-InJoonNeural" : "ko-KR-SunHiNeural";
    const tts = new EdgeTTS(text, voiceName, { rate: "-15%" });
    const result = await tts.synthesize();
    const arrayBuffer = await result.audio.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Edge TTS Synthesis Error:", error);
    return new NextResponse("Error generating voice", { status: 500 });
  }
}
