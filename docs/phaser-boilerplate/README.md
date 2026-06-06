# 🎮 해밀이음 Phaser 3 2D 시뮬레이션 개발 보일러플레이트 가이드

본 디렉토리의 파일들은 경계선 지능(BIF) 초등학생 대상의 사회성 훈련 시뮬레이션을 Phaser 3 엔진을 활용해 구축하기 위한 **TypeScript 보일러플레이트 코드**입니다.

## 📂 파일 구성
1. [MainGame.ts](file:///c:/haemileum/docs/phaser-boilerplate/MainGame.ts): Phaser 게임 인스턴스 전역 설정 및 씬(Scene) 등록부.
2. [PreloadScene.ts](file:///c:/haemileum/docs/phaser-boilerplate/PreloadScene.ts): 비주얼 프로그레스 바를 포함한 초기 에셋 프리로딩 씬.
3. [BusScene.ts](file:///c:/haemileum/docs/phaser-boilerplate/BusScene.ts): 4단계 버스 탑승 시뮬레이터 씬.
4. [KioskScene.ts](file:///c:/haemileum/docs/phaser-boilerplate/KioskScene.ts): 인지 부하 통제가 반영된 가상 키오스크 씬.
5. [ChatRoleplayScene.ts](file:///c:/haemileum/docs/phaser-boilerplate/ChatRoleplayScene.ts): 눈치 코치 감정 인지 대화 훈련 씬.
6. [SafetySosScene.ts](file:///c:/haemileum/docs/phaser-boilerplate/SafetySosScene.ts): 글로벌 SOS 패닉 모달 및 아케이드 물리 엔진 기반 감정 쓰레기통 씬.

---

## ⚙️ React / Next.js 프로젝트 연동 방법

Next.js App Router 환경에서 Phaser 3를 안전하게 로딩(클라이언트 사이드 전용)하려면 다음과 같은 리액트 컴포넌트 래퍼를 구성하는 것을 권장합니다.

### 1. 의존성 설치
```bash
npm install phaser
```

### 2. React wrapper 컴포넌트 작성 예시 (`GameContainer.tsx`)
```tsx
"use client";

import { useEffect, useRef } from "react";

export default function GameContainer() {
  const gameRef = useRef<HTMLDivElement | null>(null);
  const phaserInstance = useRef<any | null>(null);

  useEffect(() => {
    if (!gameRef.current) return;

    // Next.js (SSR) 환경 대응을 위해 클라이언트 사이드에서 동적 로드
    const initPhaser = async () => {
      const { initGame } = await import("@/phaser-boilerplate/MainGame");
      
      // Phaser 인스턴스 생성 및 Div 컨테이너 연결
      phaserInstance.current = initGame();
    };

    initPhaser();

    // 언마운트 시 리소스 클린업 소멸 처리 (메모리 누수 차단)
    return () => {
      if (phaserInstance.current) {
        phaserInstance.current.destroy(true);
        phaserInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full flex items-center justify-center p-4">
      {/* Phaser Canvas가 탑재될 타겟 Parent Div */}
      <div 
        id="phaser-game-container" 
        ref={gameRef} 
        className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
      />
    </div>
  );
}
```

---

## 💡 BIF 맞춤형 코드 작성 규칙 (UI/UX 지침)
- **텍스트 하이라이트**: 시간(`2분`), 금액(`1,250원`) 등 수치 및 중요한 행동 명사는 폰트 사이즈를 `32px` 이상으로 강조하고 개별 색상(`.setColor('#38bdf8')`)을 할당하세요.
- **부드러운 피드백**: 오답 시 "삐~" 소리나 붉은색 경고 박스는 아동에게 거부감과 스트레스를 줍니다. `BusScene.ts`의 구현 예시와 같이, 차분하고 부드러운 가이드를 음성(TTS)과 함께 순차적으로 다시 제공해 주세요.
- **경량 에셋 사용**: 모바일 태블릿 환경 로딩 속도를 위해 시각 에셋은 웹용 WebP 포맷(2D)으로, 오디오는 최적화된 MP3 포맷으로 구성하세요.
