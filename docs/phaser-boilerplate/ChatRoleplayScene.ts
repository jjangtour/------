import Phaser from "phaser";

/**
 * 💬 친구 대화 롤플레잉 씬 (ChatRoleplayScene)
 * 
 * - 눈치 코치 훈련: 대화 상황에 맞춰 친구 NPC의 표정 및 신체 언어(스프라이트 프레임)가 실시간으로 바뀝니다.
 * - 대화 선택 분기에 따라 NPC의 표정 반응 피드백이 연동됩니다.
 */
export class ChatRoleplayScene extends Phaser.Scene {
  private messageText!: Phaser.GameObjects.Text;
  private npcSprite!: Phaser.GameObjects.Sprite;

  constructor() {
    super("ChatRoleplayScene");
  }

  create() {
    // 초등학교 교실 배경 로드
    this.add.image(640, 360, "classroom").setDisplaySize(1280, 720);

    // 1. 대화창 셋업
    this.createDialogueBox();

    // 2. 친구 캐릭터(NPC) 스프라이트 생성 (중앙 배치)
    // BIF 눈치 훈련용 표정 변화를 위해 sprite sheet 프레임 이용
    this.npcSprite = this.add.sprite(640, 260, "student-avatar", 0) // 기본 프레임 0 (무표정/보통)
      .setDisplaySize(240, 360);

    this.updateSpeech("쉬는 시간, 친구 하늘이가 나를 빤히 쳐다보고 있어요. 표정이 조금 굳어 있네요. 어떻게 물어볼까요?");

    // 3. 훈련 선택지 3개 제공
    this.showDialogueChoices();
  }

  private createDialogueBox() {
    const dialogBg = this.add.graphics();
    dialogBg.fillStyle(0x0b172c, 0.9);
    dialogBg.fillRoundedRect(40, 520, 1200, 160, 20);
    dialogBg.lineStyle(4, 0x38bdf8, 1);
    dialogBg.strokeRoundedRect(40, 520, 1200, 160, 20);

    // 발화자 라벨
    this.add.text(60, 485, "하늘이 (친구)", {
      fontSize: "20px",
      fontFamily: "Arial",
      color: "#f43f5e", // 친구 캐릭터 전용 핑크빛 폰트색상으로 인지 구별성 제공
      backgroundColor: "#1e1b29",
      padding: { x: 15, y: 8 },
    });

    this.messageText = this.add.text(60, 550, "", {
      fontSize: "24px",
      fontFamily: "Arial",
      color: "#ffffff",
      wordWrap: { width: 1160 },
      lineSpacing: 10,
    });
  }

  private showDialogueChoices() {
    const choices = [
      { text: "야! 왜 째려봐? 불만 있어?", isCorrect: false },
      { text: "하늘아, 혹시 무슨 속상한 일 있어?", isCorrect: true },
      { text: "(아무 말 없이 째려보며 지나친다)", isCorrect: false }
    ];

    const buttons: Phaser.GameObjects.Container[] = [];

    choices.forEach((choice, idx) => {
      const btn = this.add.container(640, 150 + idx * 95);
      
      const bg = this.add.graphics();
      bg.fillStyle(0x0f172a, 0.9);
      bg.fillRoundedRect(-300, -35, 600, 70, 15);
      bg.lineStyle(2, 0xffffff, 0.2);
      bg.strokeRoundedRect(-300, -35, 600, 70, 15);

      const label = this.add.text(0, 0, choice.text, {
        fontSize: "20px",
        color: "#ffffff",
        fontStyle: "bold"
      }).setOrigin(0.5);

      btn.add([bg, label]);
      btn.setInteractive(new Phaser.Geom.Rectangle(-300, -35, 600, 70), Phaser.Geom.Rectangle.Contains);
      btn.useHandCursor = true;

      btn.on("pointerover", () => bg.lineStyle(2, 0x38bdf8, 1).strokeRoundedRect(-300, -35, 600, 70, 15));
      btn.on("pointerout", () => bg.lineStyle(2, 0xffffff, 0.2).strokeRoundedRect(-300, -35, 600, 70, 15));

      btn.on("pointerdown", () => {
        buttons.forEach(b => b.destroy());
        this.reactToChoice(choice.isCorrect);
      });

      buttons.push(btn);
    });
  }

  private reactToChoice(isCorrect: boolean) {
    if (isCorrect) {
      // 하늘이의 표정 스프라이트 변경: 1번 프레임(방긋 웃음/행복)
      this.npcSprite.setFrame(1); 
      this.updateSpeech("하늘이: '아! 응, 아까 빌려간 책 어떻게 돌려줄지 고민하고 있었어. 다정하게 물어봐 줘서 고마워!'");
    } else {
      // 하늘이의 표정 스프라이트 변경: 2번 프레임(속상함/화남)
      this.npcSprite.setFrame(2); 
      this.updateSpeech("하늘이: '째려본 거 아닌데... 왜 다짜고짜 화를 내고 그래? 정말 너무해!'");
      
      // 재시도 복귀 딜레이 호출
      this.time.delayedCall(3500, () => {
        this.npcSprite.setFrame(0);
        this.showDialogueChoices();
      });
    }
  }

  private updateSpeech(text: string) {
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
