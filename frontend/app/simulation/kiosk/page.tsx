"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const practiceTips = [
  "화면의 안내 문장을 먼저 읽어요.",
  "모르는 버튼이 나오면 잠깐 멈춰도 괜찮아요.",
  "틀려도 다시 고르면 연습이 됩니다.",
];

const missionSteps = [
  "먹고 싶은 메뉴 고르기",
  "결제 방법 선택하기",
  "영수증 받을지 정하기",
];

export default function KioskSimulationPage() {
  const gameRef = useRef<HTMLDivElement | null>(null);
  const phaserGameRef = useRef<import("phaser").Game | null>(null);

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return;

    let isMounted = true;

    async function startGame() {
      const Phaser = (await import("phaser")).default;

      if (!isMounted || !gameRef.current || phaserGameRef.current) return;

      class KioskScene extends Phaser.Scene {
      private messageText!: import("phaser").GameObjects.Text;
      private scoreText!: import("phaser").GameObjects.Text;
      private stepText!: import("phaser").GameObjects.Text;
      private hintText!: import("phaser").GameObjects.Text;
      private score = 0;
      private currentStep = 1;
      private buttons: import("phaser").GameObjects.GameObject[] = [];

      constructor() {
        super("KioskScene");
      }

      create() {
        this.cameras.main.setBackgroundColor("#f7faf8");

        this.add
          .text(450, 38, "해밀이음 키오스크 주문 연습", {
            fontSize: "28px",
            color: "#0f172a",
            fontFamily: "Arial",
            fontStyle: "bold",
          })
          .setOrigin(0.5);

        this.stepText = this.add
          .text(450, 82, "", {
            fontSize: "18px",
            color: "#047857",
            fontFamily: "Arial",
            fontStyle: "bold",
          })
          .setOrigin(0.5);

        this.scoreText = this.add
          .text(450, 112, "점수 0점", {
            fontSize: "18px",
            color: "#334155",
            fontFamily: "Arial",
            fontStyle: "bold",
          })
          .setOrigin(0.5);

        this.messageText = this.add
          .text(450, 180, "", {
            fontSize: "24px",
            color: "#1e293b",
            fontFamily: "Arial",
            align: "center",
            fontStyle: "bold",
            lineSpacing: 8,
            wordWrap: { width: 760 },
          })
          .setOrigin(0.5);

        this.hintText = this.add
          .text(450, 490, "천천히 읽고 하나씩 눌러 보세요.", {
            fontSize: "18px",
            color: "#475569",
            fontFamily: "Arial",
            align: "center",
            wordWrap: { width: 760 },
          })
          .setOrigin(0.5);

        this.showStep1();
      }

      clearButtons() {
        this.buttons.forEach((item) => item.destroy());
        this.buttons = [];
      }

      setStep(step: number, title: string) {
        this.currentStep = step;
        this.stepText.setText(`${step}/3단계 · ${title}`);
      }

      updateScore(point: number) {
        this.score += point;
        this.scoreText.setText(`점수 ${this.score}점`);
      }

      showStep1() {
        this.clearButtons();
        this.setStep(1, "메뉴 선택");
        this.messageText.setText(
          "점심으로 햄버거를 주문하려고 해요.\n어떤 메뉴 버튼을 눌러야 할까요?"
        );
        this.hintText.setText("주문하려는 음식 이름과 같은 버튼을 찾아요.");

        this.createButton(210, 330, "햄버거", "원하는 메뉴", true, () => {
          this.updateScore(10);
          this.showFeedback("좋아요. 햄버거 메뉴를 잘 골랐어요.", () =>
            this.showStep2()
          );
        });

        this.createButton(450, 330, "아이스크림", "후식 메뉴", false, () => {
          this.showFeedback(
            "아이스크림은 후식이에요. 지금은 햄버거를 주문하려고 해요."
          );
        });

        this.createButton(690, 330, "커피", "음료 메뉴", false, () => {
          this.showFeedback("커피는 음료예요. 먹고 싶은 메뉴 이름을 다시 찾아볼까요?");
        });
      }

      showStep2() {
        this.clearButtons();
        this.setStep(2, "결제 선택");
        this.messageText.setText(
          "메뉴를 골랐어요.\n이제 키오스크에서 결제 방법을 선택해야 해요."
        );
        this.hintText.setText("주문을 끝내려면 결제 버튼을 눌러야 해요.");

        this.createButton(210, 330, "카드 결제", "카드를 넣어요", true, () => {
          this.updateScore(10);
          this.showFeedback("잘했어요. 카드 결제를 선택했어요.", () =>
            this.showStep3()
          );
        });

        this.createButton(450, 330, "처음으로", "주문을 다시 시작", false, () => {
          this.showFeedback("처음으로 가면 주문을 다시 해야 해요. 결제 버튼을 찾아요.");
        });

        this.createButton(690, 330, "취소", "주문을 멈춤", false, () => {
          this.showFeedback("취소를 누르면 주문이 끝나지 않아요. 결제를 선택해요.");
        });
      }

      showStep3() {
        this.clearButtons();
        this.setStep(3, "영수증 선택");
        this.messageText.setText(
          "결제가 끝났어요.\n영수증은 받아도 되고, 받지 않아도 괜찮아요."
        );
        this.hintText.setText("둘 다 괜찮은 선택이에요. 필요한 방법을 골라요.");

        this.createButton(300, 330, "영수증 받기", "종이를 챙겨요", true, () => {
          this.updateScore(10);
          this.showResult("영수증을 받고 주문을 마쳤어요.");
        });

        this.createButton(600, 330, "받지 않기", "바로 완료해요", true, () => {
          this.updateScore(10);
          this.showResult("영수증 없이 주문을 마쳤어요.");
        });
      }

      showResult(resultMessage: string) {
        this.clearButtons();

        const finalScore = this.score;
        const selectedStudent =
          localStorage.getItem("haemileum_selected_student") || "이름 미선택";
        const resultData = {
          studentName: selectedStudent,
          mission: "키오스크 주문",
          score: finalScore,
          status: "완료",
          emotion: finalScore >= 30 ? "안정" : "보통",
          completedAt: new Date().toLocaleString("ko-KR"),
        };

        const savedResults = JSON.parse(
          localStorage.getItem("haemileum_results") || "[]"
        );

        savedResults.push(resultData);
        localStorage.setItem("haemileum_results", JSON.stringify(savedResults));
        window.dispatchEvent(new Event("storage"));

        this.stepText.setText("연습 완료");
        this.messageText.setText(
          `${resultMessage}\n\n키오스크 주문 미션 성공!\n최종 점수 ${finalScore}점\n결과가 저장되었습니다.`
        );
        this.hintText.setText("다시 연습하거나 기록 화면에서 결과를 확인할 수 있어요.");

        this.createButton(300, 405, "다시 연습하기", "처음부터", true, () => {
          this.score = 0;
          this.scoreText.setText("점수 0점");
          this.showStep1();
        });

        this.createButton(600, 405, "교사 화면 보기", "기록 확인", true, () => {
          window.location.href = "/teacher/dashboard";
        });
      }

      showFeedback(message: string, nextAction?: () => void) {
        this.messageText.setText(message);

        if (nextAction) {
          this.time.delayedCall(900, () => {
            nextAction();
          });
        }
      }

      createButton(
        x: number,
        y: number,
        label: string,
        caption: string,
        isCorrect: boolean,
        action: () => void
      ) {
        const button = this.add
          .rectangle(x, y, 190, 104, 0xffffff)
          .setStrokeStyle(3, 0x10b981)
          .setInteractive({ useHandCursor: true });

        const text = this.add
          .text(x, y - 14, label, {
            fontSize: "24px",
            color: "#0f172a",
            fontFamily: "Arial",
            fontStyle: "bold",
            align: "center",
            wordWrap: { width: 160 },
          })
          .setOrigin(0.5);

        const smallText = this.add
          .text(x, y + 26, caption, {
            fontSize: "15px",
            color: "#64748b",
            fontFamily: "Arial",
            align: "center",
            wordWrap: { width: 160 },
          })
          .setOrigin(0.5);

        button.on("pointerover", () => {
          button.setFillStyle(0xecfdf5);
        });

        button.on("pointerout", () => {
          button.setFillStyle(0xffffff);
        });

        button.on("pointerdown", () => {
          button.setFillStyle(isCorrect ? 0xbbf7d0 : 0xfecaca);
          action();
        });

        this.buttons.push(button, text, smallText);
      }
    }

      phaserGameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        width: 900,
        height: 560,
        parent: gameRef.current,
        scene: KioskScene,
        backgroundColor: "#f7faf8",
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      });
    }

    startGame();

    return () => {
      isMounted = false;
      phaserGameRef.current?.destroy(true);
      phaserGameRef.current = null;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-6 text-slate-900 sm:px-6 lg:py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-emerald-100 bg-white p-6 shadow-sm sm:p-7">
            <p className="text-sm font-black text-emerald-700">
              일상 시뮬레이션
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">
              키오스크 주문 연습
            </h1>
            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
              햄버거를 주문하는 상황을 단계별로 연습합니다. 학생이 큰 버튼을
              누르며 메뉴 선택, 결제, 영수증 선택을 차례대로 경험합니다.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/mission/select"
                className="rounded-lg bg-white px-4 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                미션 선택으로
              </Link>
              <Link
                href="/student/home"
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-black text-white hover:bg-emerald-800"
              >
                학생 홈으로
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <p className="text-base font-black text-amber-950">
              연습 전에 알려주세요
            </p>
            <div className="mt-3 space-y-2">
              {practiceTips.map((tip) => (
                <p
                  key={tip}
                  className="rounded-lg bg-white/70 p-3 text-sm font-bold leading-6 text-amber-900 ring-1 ring-amber-100"
                >
                  {tip}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {missionSteps.map((step, index) => (
            <div
              key={step}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-black text-emerald-700">
                {index + 1}단계
              </p>
              <p className="mt-1 text-sm font-black text-slate-950">{step}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div
            ref={gameRef}
            className="min-h-[360px] w-full overflow-hidden rounded-lg bg-[#f7faf8]"
          />
        </div>
      </section>
    </main>
  );
}
