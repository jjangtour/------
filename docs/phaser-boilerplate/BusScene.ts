import Phaser from "phaser";

/**
 * 🚌 버스 탑승 시뮬레이션 씬 (BusScene)
 * 
 * - 정류장 전광판 확인 -> 탑승문 터치 -> 교통카드 드래그 태그 -> 하차벨 클릭 과정 구현.
 * - 경계선 지능(BIF) 아동을 위해 텍스트 양을 줄이고 시각 효과를 명확히 배치합니다.
 */
export class BusScene extends Phaser.Scene {
  private messageText!: Phaser.GameObjects.Text;
  private card!: Phaser.GameObjects.Image;
  private readerArea!: Phaser.GameObjects.Zone;
  private isQuizCleared = false;
  private stepsCleared = 0;

  constructor() {
    super("BusScene");
  }

  create() {
    // 1. 16:9 캔버스 비율에 맞추어 배경 배치 (싱크 보장)
    this.add.image(640, 360, "bus-stop").setDisplaySize(1280, 720);

    // 2. 가이드 텍스트 상자 생성 (하단 배치, 인지 부하 제어 디자인)
    this.createDialogueBox();

    // 3. 글로벌 SOS 패닉 버튼 상시 노출
    this.createSOSButton();

    // 4. 첫 번째 가이드 멘트 출력 및 퀴즈 페이즈 구동
    this.showQuiz1();
  }

  /**
   * 하단 대화 상자 렌더링 함수
   * BIF 지침: 텍스트 박스 뒤의 반투명 어두운 패널은 글씨의 가독성(대비)을 대폭 높여줍니다.
   */
  private createDialogueBox() {
    const dialogBg = this.add.graphics();
    dialogBg.fillStyle(0x0b172c, 0.9);
    dialogBg.fillRoundedRect(40, 520, 1200, 160, 20);
    dialogBg.lineStyle(4, 0x38bdf8, 1); // 스카이 블루 이중 테두리 효과
    dialogBg.strokeRoundedRect(40, 520, 1200, 160, 20);

    // 가이드 발화자 네임택
    const nameTag = this.add.text(60, 485, "이음이 가이드", {
      fontSize: "20px",
      fontFamily: "Arial",
      color: "#38bdf8",
      backgroundColor: "#101c36",
      padding: { x: 15, y: 8 },
    });

    // 지시 텍스트 (줄바꿈 및 자당 출력 속도에 맞추기 위한 기본 세팅)
    this.messageText = this.add.text(60, 550, "", {
      fontSize: "24px",
      fontFamily: "Arial",
      color: "#ffffff",
      wordWrap: { width: 1160 },
      lineSpacing: 10,
    });
  }

  /**
   * 상시 SOS 버튼 생성
   * 화면 구석에 눈에 띄는 빨간 둥근 원형 버튼으로 배치하여 아동이 심리적 정지를 필요로 할 때 탭하도록 함
   */
  private createSOSButton() {
    const sosButton = this.add.circle(1220, 60, 35, 0xef4444)
      .setInteractive({ useHandCursor: true });

    this.add.text(1202, 48, "SOS", {
      fontSize: "18px",
      fontFamily: "Arial",
      color: "#ffffff",
      fontStyle: "bold"
    });

    sosButton.on("pointerdown", () => {
      // SafetySosScene의 글로벌 패닉 모달 호출 (일시 정지)
      this.scene.pause();
      this.scene.launch("SafetySosScene", { parentScene: "BusScene" });
    });
  }

  /**
   * 1단계 퀴즈 출제 (인지 부하 통제: 3선 다지선택)
   */
  private showQuiz1() {
    this.updateSpeech("내가 타야 할 버스는 몇 분 뒤에 도착할까요? 정류장의 전광판 정보를 읽고 정답을 클릭해 봐요.");

    // 문제 선택지 생성 (화면 중앙-좌측 배치로 전광판 간섭 최소화)
    const options = ["2분 뒤 (시청 방향)", "5분 뒤 (터미널 방향)", "7분 뒤 (공원 방향)"];
    const buttons: Phaser.GameObjects.Container[] = [];

    options.forEach((text, idx) => {
      const btnContainer = this.add.container(300, 200 + idx * 90);
      
      const bg = this.add.graphics();
      bg.fillStyle(0x0f172a, 0.85);
      bg.fillRoundedRect(0, 0, 420, 70, 15);
      bg.lineStyle(2, 0xffffff, 0.3);
      bg.strokeRoundedRect(0, 0, 420, 70, 15);

      const label = this.add.text(20, 20, `${idx + 1}. ${text}`, {
        fontSize: "20px",
        fontFamily: "Arial",
        color: "#ffffff"
      });

      btnContainer.add([label]);
      btnContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, 420, 70), Phaser.Geom.Rectangle.Contains);
      btnContainer.useHandCursor = true;

      // 마우스 오버 시 하이라이트
      btnContainer.on("pointerover", () => bg.lineStyle(2, 0x38bdf8, 1).strokeRoundedRect(0, 0, 420, 70, 15));
      btnContainer.on("pointerout", () => bg.lineStyle(2, 0xffffff, 0.3).strokeRoundedRect(0, 0, 420, 70, 15));

      btnContainer.on("pointerdown", () => {
        if (idx === 0) {
          // 정답 처리
          this.updateSpeech("정답이에요! 45번 버스는 2분 뒤에 도착합니다.");
          buttons.forEach(b => b.destroy());
          
          this.time.delayedCall(2000, () => {
            this.activateBillboardAction();
          });
        } else {
          // BIF 지침: 부정 경고 대신 부드러운 유도 문장 사용
          this.updateSpeech("아쉬워요! 전광판의 '45번' 버스를 다시 한번 찾아볼까요?");
        }
      });

      buttons.push(btnContainer);
    });
  }

  /**
   * 정답을 맞춘 후 활성화되는 전광판 클릭 실습
   */
  private activateBillboardAction() {
    this.updateSpeech("정답입니다! 이제 버스 정류장 전광판(우측 상단)을 직접 터치하여 정보 카드를 띄워보세요.");

    // 우측 상단 전광판 위치에 투명 인터랙티브 존 생성 (1280x720 캔버스 내 절대좌표)
    const billboardZone = this.add.zone(920, 100, 260, 160)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    // 시각적 강조 가이드 테두리 렌더링
    const borderGlow = this.add.graphics();
    borderGlow.lineStyle(4, 0x38bdf8, 1);
    borderGlow.strokeRoundedRect(920, 100, 260, 160, 15);
    
    // 점멸(Pulsate) 애니메이션 적용
    this.tweens.add({
      targets: borderGlow,
      alpha: 0.2,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    billboardZone.on("pointerdown", () => {
      borderGlow.destroy();
      billboardZone.destroy();
      
      // 도착 정보 OpenAPI 팝업 카드 모사 렌더링
      this.showBillboardPopup();
    });
  }

  private showBillboardPopup() {
    const popupContainer = this.add.container(640, 280);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.95);
    bg.fillRoundedRect(-175, -125, 350, 250, 25);
    bg.lineStyle(3, 0x38bdf8, 1);
    bg.strokeRoundedRect(-175, -125, 350, 250, 25);

    const title = this.add.text(0, -90, "곧 도착할 버스", { fontSize: "20px", color: "#38bdf8", fontStyle: "bold" }).setOrigin(0.5);
    const busNo = this.add.text(0, -20, "45번", { fontSize: "48px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
    const desc = this.add.text(0, 40, "시청 방향 · 2분 후 도착", { fontSize: "18px", color: "#e2e8f0" }).setOrigin(0.5);
    
    // 닫기 및 진행 버튼
    const nextBtn = this.add.text(0, 95, "버스 도착 기다리기 ▼", { 
      fontSize: "18px", color: "#000000", backgroundColor: "#38bdf8", padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    popupContainer.add([bg, title, busNo, desc, nextBtn]);

    nextBtn.on("pointerdown", () => {
      popupContainer.destroy();
      // 2단계 (탑승문 터치)로 전환 준비
      this.stepsCleared = 1;
      this.scene.restart(); // 예시 골격에서는 리스타트 후 세션 변수로 분기 구현 권장
    });
  }

  // 3단계 교통카드 드래그 앤 드롭 구현을 위한 가이드 코드
  private setupDragAndDropCard() {
    // 버스 실내 배경으로 전환
    this.add.image(640, 360, "bus-inside").setDisplaySize(1280, 720);

    // 카드 단말기 접촉 판정 영역 (Zone)
    this.readerArea = this.add.zone(640, 300, 150, 150).setRectangleDropZone(150, 150);

    // 교통카드 드래그 객체 생성
    this.card = this.add.image(640, 600, "transit-card")
      .setDisplaySize(150, 90)
      .setInteractive({ draggable: true, useHandCursor: true });

    // 드래그 이벤트 리스너 등록
    this.input.on("dragstart", (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) => {
      gameObject.setTint(0x38bdf8);
    });

    this.input.on("drag", (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, dragX: number, dragY: number) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    this.input.on("dragend", (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) => {
      gameObject.clearTint();
    });

    this.input.on("drop", (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, dropZone: Phaser.GameObjects.Zone) => {
      // 카드가 단말기 영역에 닿았을 때 정답 처리
      gameObject.x = dropZone.x;
      gameObject.y = dropZone.y;
      gameObject.disableInteractive();

      // 태그음 효과음 재생
      this.sound.play("pay-sound");
      this.updateSpeech("결제 완료! 1,250원이 교통카드에서 결제되었습니다.");
    });
  }

  /**
   * 발화 TTS 스피치 래퍼 함수 (React/Next.js Speech API 연동 타겟)
   */
  private updateSpeech(text: string) {
    this.messageText.setText(text);
    
    // 브라우저 TTS Speech Utterance 실행 유도부
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ko-KR";
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  }
}
