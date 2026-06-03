"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";

export default function KioskSimulationPage() {
  const gameRef = useRef<HTMLDivElement | null>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return;

    class KioskScene extends Phaser.Scene {
      private titleText!: Phaser.GameObjects.Text;
      private messageText!: Phaser.GameObjects.Text;
      private scoreText!: Phaser.GameObjects.Text;
      private step = 1;
      private score = 0;
      private buttons: Phaser.GameObjects.GameObject[] = [];

      constructor() {
        super("KioskScene");
      }

      create() {
        this.cameras.main.setBackgroundColor("#f8fafc");

        this.titleText = this.add
          .text(400, 50, "해밀이음 키오스크 시뮬레이션", {
            fontSize: "28px",
            color: "#1e293b",
            fontFamily: "Arial",
          })
          .setOrigin(0.5);

        this.scoreText = this.add
          .text(400, 95, "점수: 0점", {
            fontSize: "18px",
            color: "#2563eb",
            fontFamily: "Arial",
          })
          .setOrigin(0.5);

        this.messageText = this.add
          .text(400, 145, "", {
            fontSize: "20px",
            color: "#334155",
            fontFamily: "Arial",
            align: "center",
          })
          .setOrigin(0.5);

        this.showStep1();
      }

      clearButtons() {
        this.buttons.forEach((item) => item.destroy());
        this.buttons = [];
      }

      updateScore(point: number) {
        this.score += point;
        this.scoreText.setText(`점수: ${this.score}점`);
      }

      showStep1() {
        this.clearButtons();
        this.step = 1;

        this.messageText.setText(
          "1단계: 먹고 싶은 메뉴를 선택하세요.\n음식점 키오스크에서는 음식 메뉴를 골라야 합니다."
        );

        this.createButton(250, 270, "햄버거", true, () => {
          this.updateScore(10);
          this.showFeedback("정답입니다. 햄버거를 선택했습니다.", () =>
            this.showStep2()
          );
        });

        this.createButton(400, 270, "운동화", false, () => {
          this.showFeedback("다시 생각해 봅시다. 운동화는 음식이 아닙니다.");
        });

        this.createButton(550, 270, "연필", false, () => {
          this.showFeedback("다시 생각해 봅시다. 연필은 음식이 아닙니다.");
        });
      }

      showStep2() {
        this.clearButtons();
        this.step = 2;

        this.messageText.setText(
          "2단계: 결제 방법을 선택하세요.\n키오스크에서 주문 후 결제 방법을 골라야 합니다."
        );

        this.createButton(250, 270, "카드 결제", true, () => {
          this.updateScore(10);
          this.showFeedback("정답입니다. 카드 결제를 선택했습니다.", () =>
            this.showStep3()
          );
        });

        this.createButton(400, 270, "집에 가기", false, () => {
          this.showFeedback("아직 주문이 끝나지 않았습니다. 결제가 필요합니다.");
        });

        this.createButton(550, 270, "다시 줄서기", false, () => {
          this.showFeedback("결제 단계에서는 결제 방법을 선택해야 합니다.");
        });
      }

      showStep3() {
        this.clearButtons();
        this.step = 3;

        this.messageText.setText(
          "3단계: 영수증을 받을지 선택하세요.\n필요하면 영수증을 받을 수 있습니다."
        );

        this.createButton(300, 270, "영수증 받기", true, () => {
          this.updateScore(10);
          this.showResult("영수증을 받고 주문을 완료했습니다.");
        });

        this.createButton(500, 270, "영수증 안 받기", true, () => {
          this.updateScore(10);
          this.showResult("영수증 없이 주문을 완료했습니다.");
        });
      }

      showResult(resultMessage: string) {
        this.clearButtons();

        const finalScore = this.score;
        const selectedStudent =
          localStorage.getItem("haemileum_selected_student") || "이름 미선택";

        const resultData = {
          studentName: selectedStudent,
          mission: "키오스크 주문 연습",
          score: finalScore,
          status: "완료",
          emotion: "안정",
          completedAt: new Date().toLocaleString("ko-KR"),
        };

        const savedResults = JSON.parse(
          localStorage.getItem("haemileum_results") || "[]"
        );

        savedResults.push(resultData);

        localStorage.setItem("haemileum_results", JSON.stringify(savedResults));

        this.messageText.setText(
          `${resultMessage}\n\n키오스크 주문 미션 성공!\n최종 점수: ${finalScore}점\n\n결과가 저장되었습니다.`
        );

        this.createButton(300, 360, "다시 연습하기", true, () => {
          this.score = 0;
          this.scoreText.setText("점수: 0점");
          this.showStep1();
        });

        this.createButton(500, 360, "교사 화면 확인", true, () => {
          window.location.href = "/teacher/dashboard";
        });
      }

      showFeedback(message: string, nextAction?: () => void) {
        this.messageText.setText(message);

        if (nextAction) {
          this.time.delayedCall(800, () => {
            nextAction();
          });
        }
      }

      createButton(
        x: number,
        y: number,
        label: string,
        isCorrect: boolean,
        action: () => void
      ) {
        const button = this.add
          .rectangle(x, y, 150, 75, 0xffffff)
          .setStrokeStyle(2, 0x2563eb)
          .setInteractive({ useHandCursor: true });

        const text = this.add
          .text(x, y, label, {
            fontSize: "19px",
            color: "#1e293b",
            fontFamily: "Arial",
          })
          .setOrigin(0.5);

        button.on("pointerover", () => {
          button.setFillStyle(0xdbeafe);
        });

        button.on("pointerout", () => {
          button.setFillStyle(0xffffff);
        });

        button.on("pointerdown", () => {
          button.setFillStyle(isCorrect ? 0xbbf7d0 : 0xfecaca);
          action();
        });

        this.buttons.push(button);
        this.buttons.push(text);
      }
    }

    phaserGameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      width: 800,
      height: 500,
      parent: gameRef.current,
      scene: KioskScene,
      backgroundColor: "#f8fafc",
    });

    return () => {
      phaserGameRef.current?.destroy(true);
      phaserGameRef.current = null;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-sm font-semibold text-blue-700">
            [이] 일상 시뮬레이션
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            키오스크 주문 연습
          </h1>
          <p className="mt-3 text-slate-600">
            학생이 안전한 환경에서 음식 주문 절차를 반복 연습하는 샘플
            화면입니다.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div ref={gameRef} />
        </div>
      </section>
    </main>
  );
}