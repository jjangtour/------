import Phaser from "phaser";

/**
 * 에셋 프리로드 씬 (PreloadScene)
 * 
 * - PWA 로딩 지연을 최소화하기 위해 모든 시각/청각 리소스를 백그라운드에서 사전에 로드합니다.
 * - 학습자의 인지 과부하를 막기 위해 숫자로 된 진행률 대신 부드러운 그래픽 진행 바를 출력합니다.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    // 1. 시각적 프로그레스 바 생성 (텍스트를 배제하여 직관성 제공)
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1e293b, 0.8);
    progressBox.fillRoundedRect(340, 330, 600, 50, 15);

    // 로딩 이벤트 리스너 설정
    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x38bdf8, 1); // 해밀이음 브랜드 컬러 (스카이 블루)
      progressBar.fillRoundedRect(350, 340, 580 * value, 30, 10);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
    });

    // 2. 가상 에셋 경로 로딩 (MVP 개발 시 실 주소로 매칭)
    // 이미지 에셋
    this.load.image("bus-stop", "/assets/bus/bus-step1-stop.png");
    this.load.image("bus-inside", "/assets/bus/bus-step3-terminal.png");
    this.load.image("transit-card", "/assets/bus/transit-card.png");
    this.load.image("kiosk-bg", "/assets/kiosk/kiosk-bg.png");
    this.load.image("classroom", "/assets/classroom.png");
    
    // 캐릭터 스프라이트 시트 (표정 변화가 필요한 3D SD 대행 2D 텍스처)
    this.load.spritesheet("student-avatar", "/assets/avatar-sheet.png", { frameWidth: 256, frameHeight: 384 });
    this.load.spritesheet("driver-npc", "/assets/driver-sheet.png", { frameWidth: 256, frameHeight: 384 });

    // 사운드 에셋
    this.load.audio("bell-sound", "/assets/sounds/dingdong.mp3");
    this.load.audio("pay-sound", "/assets/sounds/card-pay.mp3");
  }

  create() {
    // 로딩이 완료되면 첫 번째 교육 미션인 BusScene으로 즉시 전환합니다.
    this.scene.start("BusScene");
  }
}
