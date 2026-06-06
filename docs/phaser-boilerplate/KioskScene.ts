import Phaser from "phaser";

/**
 * 🍔 키오스크 주문 시뮬레이터 (KioskScene)
 * 
 * - 인지 과부하 통제 지침에 맞춰 한 화면에 노출되는 선택 단추를 최대 3~4개로 제한합니다.
 * - 큼직한 가상 키오스크 패널을 중앙에 배치합니다.
 */
export class KioskScene extends Phaser.Scene {
  private messageText!: Phaser.GameObjects.Text;
  private kioskPanel!: Phaser.GameObjects.Container;

  constructor() {
    super("KioskScene");
  }

  create() {
    // 배경 배치
    this.add.image(640, 360, "kiosk-bg").setDisplaySize(1280, 720);

    // 하단 대화 및 TTS 가이드 영역 생성
    this.createDialogueBox();

    // 키오스크 본체 패널 (중앙 배치)
    this.createKioskPanel();

    this.updateSpeech("햄버거 가게에 왔습니다! 키오스크 화면에서 먹고 싶은 햄버거 메뉴를 골라 보세요.");
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

  private createKioskPanel() {
    this.kioskPanel = this.add.container(640, 260);

    // 가상 키오스크 화면 뒷배경
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0xf1f5f9, 0.95); // 밝은 회색 톤으로 키오스크 기계와 분리감 조성
    panelBg.fillRoundedRect(-300, -200, 600, 400, 25);
    panelBg.lineStyle(6, 0x475569, 1);
    panelBg.strokeRoundedRect(-300, -200, 600, 400, 25);

    const title = this.add.text(0, -160, "터치하여 주문을 시작하세요", {
      fontSize: "26px",
      color: "#0f172a",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.kioskPanel.add([panelBg, title]);

    // 1단계: 메뉴 선택 버튼 생성 (3개로 한정하여 인지 부하 차단)
    const menus = [
      { name: "🍔 햄버거 세트", key: "hamburger" },
      { name: "🥤 시원한 탄산음료", key: "drink" },
      { name: "🍦 아이스크림 디저트", key: "dessert" }
    ];

    menus.forEach((menu, idx) => {
      const btn = this.add.container(0, -70 + idx * 95);
      
      const btnBg = this.add.graphics();
      btnBg.fillStyle(0xffffff, 1);
      btnBg.fillRoundedRect(-200, -35, 400, 70, 15);
      btnBg.lineStyle(2, 0xe2e8f0, 1);
      btnBg.strokeRoundedRect(-200, -35, 400, 70, 15);

      const label = this.add.text(0, 0, menu.name, {
        fontSize: "22px",
        color: "#0f172a",
        fontStyle: "bold"
      }).setOrigin(0.5);

      btn.add([btnBg, label]);
      btn.setInteractive(new Phaser.Geom.Rectangle(-200, -35, 400, 70), Phaser.Geom.Rectangle.Contains);
      btn.useHandCursor = true;

      btn.on("pointerover", () => btnBg.lineStyle(2, 0x38bdf8, 1).strokeRoundedRect(-200, -35, 400, 70, 15));
      btn.on("pointerout", () => btnBg.lineStyle(2, 0xe2e8f0, 1).strokeRoundedRect(-200, -35, 400, 70, 15));
      
      btn.on("pointerdown", () => {
        this.selectMenu(menu.key);
      });

      this.kioskPanel.add(btn);
    });
  }

  private selectMenu(key: string) {
    if (key === "hamburger") {
      this.updateSpeech("햄버거를 선택했습니다! 다음으로 결제 버튼(💳 카드 결제)을 눌러 주문을 끝내 보세요.");
      // 2단계 (결제 화면) 분기용 UI 재생성 로직 배치부
    } else {
      this.updateSpeech("아쉽지만 오늘은 햄버거 세트 주문이 목표예요. 🍔 햄버거 세트를 선택해 볼까요?");
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
