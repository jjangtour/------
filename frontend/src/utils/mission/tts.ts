// 단일 AI 음성 전용 TTS 오디오 매니저
// 브라우저 SpeechSynthesis 중복 재생을 완전히 제거하고 오직 고품질 AI 음성(/api/tts) 단 하나만 재생합니다.

let activeAudio: HTMLAudioElement | null = null;
let activeAudioUrl: string | null = null;

export function stopTtsAudio() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio.src = "";
    } catch (e) {
      // ignore
    }
    activeAudio = null;
  }

  if (activeAudioUrl) {
    try {
      URL.revokeObjectURL(activeAudioUrl);
    } catch (e) {
      // ignore
    }
    activeAudioUrl = null;
  }

  // 혹시 브라우저에서 실행 중인 다른 음성이 있다면 완전 중단
  if (typeof window !== "undefined" && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }
  }
}

export async function playTtsAudio(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
): Promise<() => void> {
  // 1. 기존 재생 중인 모든 음성 즉시 완전 중단
  stopTtsAudio();

  if (!text || typeof window === "undefined") {
    onEnd?.();
    return () => {};
  }

  let isCancelled = false;

  const cancel = () => {
    isCancelled = true;
    stopTtsAudio();
  };

  try {
    const encodedText = encodeURIComponent(text.trim());
    const audio = new Audio(`/api/tts?text=${encodedText}`);
    activeAudio = audio;

    audio.onplay = () => {
      if (!isCancelled) {
        onStart?.();
      }
    };

    audio.onended = () => {
      if (!isCancelled) {
        activeAudio = null;
        onEnd?.();
      }
    };

    audio.onerror = (e) => {
      if (!isCancelled) {
        console.warn("TTS Audio 재생 에러:", e);
        activeAudio = null;
        onError?.();
        onEnd?.();
      }
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (!isCancelled) {
          console.warn("TTS Audio play() 실패:", err);
          activeAudio = null;
          onError?.();
          onEnd?.();
        }
      });
    }
  } catch (err) {
    if (!isCancelled) {
      console.warn("TTS Audio 생성 실패:", err);
      activeAudio = null;
      onError?.();
      onEnd?.();
    }
  }

  return cancel;
}
