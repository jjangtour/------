import Phaser from "phaser";
import { PreloadScene } from "./PreloadScene";
import { BusScene } from "./BusScene";
import { KioskScene } from "./KioskScene";
import { ChatRoleplayScene } from "./ChatRoleplayScene";
import { SafetySosScene } from "./SafetySosScene";

/**
 * 해밀이음 2D 시뮬레이션 게임 메인 설정 파일
 * 
 * - 모바일 태블릿 환경(PWA)에 최적화된 16:9 비율 (1280x720) 해상도로 설정합니다.
 * - 물리 작용(드래그 앤 드롭, 감정 쓰레기통 중력)을 위해 Arcade Physics를 활성화합니다.
 */
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: "#0c0f1d",
  parent: "phaser-game-container", // React 컴포넌트의 부모 Div ID와 매칭
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 300 }, // 감정 쓰레기통의 이모티콘 낙하 연출용 중력 설정
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT, // 부모 컨테이너 크기에 자동으로 맞춤 (반응형 대응)
    autoCenter: Phaser.Scale.CENTER_BOTH, // 브라우저 화면 중앙 정렬
  },
  // 등록할 씬 (PreloadScene이 가장 먼저 로드됨)
  scene: [
    PreloadScene,
    BusScene,
    KioskScene,
    ChatRoleplayScene,
    SafetySosScene
  ]
};

// React 컴포넌트에서 Phaser 게임 인스턴스를 초기화하기 위한 팩토리 함수
export const initGame = (): Phaser.Game => {
  return new Phaser.Game(gameConfig);
};
