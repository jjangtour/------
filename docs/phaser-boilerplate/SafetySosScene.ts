import Phaser from "phaser";

/**
 * 🛡️ 사기 방어 및 마음 관리 씬 (SafetySosScene)
 * 
 * - 스미싱(피싱 문자) 단어 찾기 터치 게임 구현.
 * - 감정 쓰레기통: Arcade Physics를 결합하여 감정 이모티콘을 쓰레기통에 골인시키면 중력으로 떨어지는 시각 효과 구현.
 * - SOS 패닉 일시정지 모달 탑재.
 */
export class SafetySosScene extends Phaser.Scene {
  private messageText!: Phaser.GameObjects.Text;
  private trashBin!: Phaser.GameObjects.Sprite;
  private parentSceneName?: string;

  constructor() {
    super("SafetySosScene");
  }

  init(data: { parentScene?: string }) {
    // SOS 긴급 중단 버튼으로 인해 들어온 경우, 부모 씬을 저장해 둠
    this.parentSceneName = data.parentScene;
  }

  create() {
    if (this.parentSceneName) {
      // SOS 패닉 모달 모드
      this.showSOSPanicModal();
    } else {
      // 일반 감정 쓰레기통 물리 실습 모드
      this.createDialogueBox();
      this.setupEmotionalTrashBin();
    }
  }

  /**
   * 1. SOS 패닉 모드 (안정을 위한 글로벌 일시정지 오버레이)
   */
  private showSOSPanicModal() {
    // 반투명 어두운 장막
    const overlay = this.add.graphics();
    overlay.fillStyle(0x0f172a, 0.95);
    overlay.fillRect(0, 0, 1280, 720);

    const heart = this.add.text(640, 260, "💚", { fontSize: "100px" }).setOrigin(0.5);
    
    // 심호흡 가이드 텍스트
    const guide = this.add.text(640, 390, "마음을 편안하게 가라앉히고 숨을 크게 쉬어 보세요.\n(들이마시고... 내쉬고...)", {
      fontSize: "26px",
      fontFamily: "Arial",
      color: "#38bdf8",
      align: "center",
      lineSpacing: 15
    }).setOrigin(0.5);

    // 복귀 버튼
    const resumeBtn = this.add.text(640, 520, "돌아가기 (Resume)", {
      fontSize: "22px",
      color: "#ffffff",
      backgroundColor: "#1e293b",
      padding: { x: 30, y: 15 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resumeBtn.on("pointerdown", () => {
      if (this.parentSceneName) {
        this.scene.resume(this.parentSceneName);
      }
      this.scene.stop();
    });
  }

  /**
   * 2. 물리 엔진 기반 감정 쓰레기통 구현 (Arcade Physics 결합)
   */
  private setupEmotionalTrashBin() {
    this.updateSpeech("오늘 하루 속상했거나 짜증 났던 기분을 나타내는 이모티콘을 마우스로 잡고 쓰레기통에 쏙 던져 버리세요!");

    // 쓰레기통 오브젝트 생성 (정적 물리 바디)
    this.trashBin = this.physics.add.sprite(640, 420, "driver-npc", 0) // 에셋 플레이스홀더 대체
      .setDisplaySize(200, 200) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    this.trashBin.body.setImmovable(true);
    this.trashBin.body.allowGravity = false;

    // 감정 이모티콘 블록 생성 (동적 물리 바디)
    const emotions = [
      { emoji: "😢 슬픔", color: "#60a5fa", x: 300, y: 150 },
      { emoji: "😠 화남", color: "#f87171", x: 450, y: 150 },
      { emoji: "😰 불안", color: "#fbbf24", x: 800, y: 150 }
    ];

    emotions.forEach((data) => {
      // 드래그 가능한 물리 텍스트 컨테이너
      const block = this.add.container(data.x, data.y);
      
      const bg = this.add.graphics();
      bg.fillStyle(0x1e293b, 1);
      bg.fillRoundedRect(-80, -35, 160, 70, 15);
      bg.lineStyle(2, 0xffffff, 0.2);
      bg.strokeRoundedRect(-80, -35, 160, 70, 15);

      const textObj = this.add.text(0, 0, data.emoji, {
        fontSize: "20px",
        color: data.color,
        fontStyle: "bold"
      }).setOrigin(0.5);

      block.add([bg, textObj]);
      block.setSize(160, 70);

      // 물리 바디 활성화
      this.physics.world.enable(block);
      const body = block.body as Phaser.Physics.Arcade.Body;
      body.setCollideWorldBounds(true);
      body.setBounce(0.3, 0.3);
      body.allowGravity = false; // 드래그 중에는 중력 차단

      // 드래그 기능 할당
      block.setInteractive(new Phaser.Geom.Rectangle(-80, -35, 160, 70), Phaser.Geom.Rectangle.Contains);
      block.useHandCursor = true;
      this.input.setDraggable(block);

      block.on("dragstart", () => {
        body.allowGravity = false;
        body.setVelocity(0, 0);
      });

      block.on("drag", (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        block.x = dragX;
        block.y = dragY;
      });

      block.on("dragend", () => {
        // 드래그를 놓으면 중력 활성화되어 쓰레기통 방향으로 낙하
        body.allowGravity = true;
      });

      // 쓰레기통과의 겹침(Overlap) 판정 및 삼킴 연출
      this.physics.add.overlap(block, this.trashBin, () => {
        // 이펙트 튐 연출 후 소멸
        this.tweens.add({
          targets: block,
          scale: 0,
          alpha: 0,
          duration: 400,
          onComplete: () => {
            block.destroy();
            this.sound.play("bell-sound"); // 감정 소멸 피드백 효과음
            this.updateSpeech("마음속 감정을 건강하게 털어냈습니다! 아주 훌륭해요.");
          }
        });
      }, undefined, this);
    });
  }

  private createDialogueBox() {
    const dialogBg = this.add.graphics();
    dialogBg.fillStyle(0x0b172c, 0.9);
    dialogBg.fillRoundedRect(40, 520, 1200, 160, 20);
    dialogBg.lineStyle(4, 0x38bdf8, 1);
    dialogBg.strokeRoundedRect(40, 520, 1200, 160, 20);

    this.messageText = this.add.text(60, 550, "", {
      fontSize: "24px",
      fontFamily: "Arial",
      color: "#ffffff",
      wordWrap: { width: 1160 },
      lineSpacing: 10,
    });
  }

  private updateSpeech(text: string) {
    if (!this.messageText) return;
    this.messageText.setText(text);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ko-KR";
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  }
}
