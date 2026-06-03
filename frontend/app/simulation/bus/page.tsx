"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";

export default function BusSimulationPage() {
  const gameRef = useRef<HTMLDivElement | null>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return;

    class BusScene extends Phaser.Scene {
      private messageText!: Phaser.GameObjects.Text;
      private scoreText!: Phaser.GameObjects.Text;
      private score = 0;
      private buttons: Phaser.GameObjects.GameObject[] = [];

      constructor() {
        super("BusScene");
      }

      create() {
        this.cameras.main.setBackgroundColor("#f8fafc");

        this.add
          .text(400, 45, "해밀이음 대중교통 이용 시뮬레이션", {
            fontSize: "26px",
            color: "#1e293b",
            fontFamily: "Arial",
          })
          .setOrigin(0.5);

        this.scoreText = this.add
          .text(400, 90, "점수: 0점", {
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

        this.messageText.setText(
          "1단계: 목적지를 확인하세요.\n오늘은 도서관에 가야 합니다. 어디로 가야 할까요?"
        );

        this.createButton(230, 270, "도서관", true, () => {
          this.updateScore(10);
          this.showFeedback("정답입니다. 목적지는 도서관입니다.", () =>
            this.showStep2()
          );
        });

        this.createButton(400, 270, "영화관", false, () => {
          this.showFeedback("다시 생각해 봅시다. 오늘의 목적지는 도서관입니다.");
        });

        this.createButton(570, 270, "놀이공원", false, () => {
          this.showFeedback("다시 생각해 봅시다. 놀이공원에 가는 상황이 아닙니다.");
        });
      }

      showStep2() {
        this.clearButtons();

        this.messageText.setText(
          "2단계: 맞는 버스 번호를 선택하세요.\n도서관에 가는 버스는 12번입니다."
        );

        this.createButton(230, 270, "7번 버스", false, () => {
          this.showFeedback("7번 버스는 도서관에 가지 않습니다.");
        });

        this.createButton(400, 270, "12번 버스", true, () => {
          this.updateScore(10);
          this.showFeedback("정답입니다. 12번 버스를 타면 됩니다.", () =>
            this.showStep3()
          );
        });

        this.createButton(570, 270, "31번 버스", false, () => {
          this.showFeedback("31번 버스는 다른 방향입니다.");
        });
      }

      showStep3() {
        this.clearButtons();

        this.messageText.setText(
          "3단계: 내려야 할 정류장을 선택하세요.\n버스 안내 방송을 듣고 내릴 곳을 골라야 합니다."
        );

        this.createButton(230, 270, "시장입구", false, () => {
          this.showFeedback("아직 도서관이 아닙니다. 조금 더 가야 합니다.");
        });

        this.createButton(400, 270, "도서관 앞", true, () => {
          this.updateScore(10);
          this.showResult("정답입니다. 도서관 앞에서 내렸습니다.");
        });

        this.createButton(570, 270, "종점", false, () => {
          this.showFeedback("종점까지 가면 지나치게 됩니다.");
        });
      }

      showResult(resultMessage: string) {
        this.clearButtons();

        const finalScore = this.score;

        const selectedStudent =
          localStorage.getItem("haemileum_selected_student") || "이름 미선택";

        const selectedMission =
          localStorage.getItem("haemileum_selected_mission") ||
          "대중교통 이용 연습";

        const resultData = {
          studentName: selectedStudent,
          mission: selectedMission,
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

        this.messageText.setText(
          `${resultMessage}\n\n대중교통 이용 미션 성공!\n최종 점수: ${finalScore}점\n\n결과가 저장되었습니다.`
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
            fontSize: "18px",
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
      scene: BusScene,
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
            대중교통 이용 연습
          </h1>
          <p className="mt-3 text-slate-600">
            학생이 목적지 확인, 버스 번호 선택, 하차 정류장 선택 절차를
            안전하게 반복 연습하는 화면입니다.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div ref={gameRef} />
        </div>
      </section>
    </main>
  );
}