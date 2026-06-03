"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";

export default function SchoolTalkSimulationPage() {
  const gameRef = useRef<HTMLDivElement | null>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return;

    class SchoolTalkScene extends Phaser.Scene {
      private messageText!: Phaser.GameObjects.Text;
      private scoreText!: Phaser.GameObjects.Text;
      private score = 0;
      private buttons: Phaser.GameObjects.GameObject[] = [];

      constructor() {
        super("SchoolTalkScene");
      }

      create() {
        this.cameras.main.setBackgroundColor("#f8fafc");

        this.add
          .text(400, 45, "해밀이음 학교생활 대화 시뮬레이션", {
            fontSize: "25px",
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
            fontSize: "19px",
            color: "#334155",
            fontFamily: "Arial",
            align: "center",
            wordWrap: { width: 720 },
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
          "상황 1: 친구가 내 연필을 말없이 가져갔습니다.\n어떻게 말하는 것이 좋을까요?"
        );

        this.createButton(220, 285, "야! 너 왜 훔쳐갔어!", false, () => {
          this.showFeedback(
            "상대방이 놀라거나 화날 수 있습니다. 먼저 차분하게 말해봅시다."
          );
        });

        this.createButton(400, 285, "내 연필을 쓸 때는 먼저 물어봐 줘.", true, () => {
          this.updateScore(10);
          this.showFeedback(
            "좋습니다. 내 마음을 차분하게 표현했습니다.",
            () => this.showStep2()
          );
        });

        this.createButton(580, 285, "아무 말도 하지 않는다", false, () => {
          this.showFeedback(
            "불편한 상황을 계속 참으면 마음이 힘들 수 있습니다. 부드럽게 표현해봅시다."
          );
        });
      }

      showStep2() {
        this.clearButtons();

        this.messageText.setText(
          "상황 2: 조별 활동에서 친구가 내 의견을 듣지 않습니다.\n어떻게 말하면 좋을까요?"
        );

        this.createButton(220, 285, "너는 항상 내 말을 무시해!", false, () => {
          this.showFeedback(
            "상대방을 비난하면 갈등이 커질 수 있습니다. 내 의견을 차분히 요청해봅시다."
          );
        });

        this.createButton(400, 285, "내 생각도 한 번 들어줄래?", true, () => {
          this.updateScore(10);
          this.showFeedback(
            "좋습니다. 상대를 공격하지 않고 내 의견을 요청했습니다.",
            () => this.showStep3()
          );
        });

        this.createButton(580, 285, "그냥 혼자 한다", false, () => {
          this.showFeedback(
            "조별 활동에서는 함께 이야기하는 연습이 필요합니다."
          );
        });
      }

      showStep3() {
        this.clearButtons();

        this.messageText.setText(
          "상황 3: 친구가 장난으로 놀렸는데 기분이 나쁩니다.\n어떻게 표현하면 좋을까요?"
        );

        this.createButton(220, 285, "나도 똑같이 놀린다", false, () => {
          this.showFeedback(
            "같이 놀리면 갈등이 더 커질 수 있습니다."
          );
        });

        this.createButton(400, 285, "그 말은 내가 기분이 안 좋아. 그만해 줘.", true, () => {
          this.updateScore(10);
          this.showResult("좋습니다. 불편한 감정을 분명하게 표현했습니다.");
        });

        this.createButton(580, 285, "친구를 밀친다", false, () => {
          this.showFeedback(
            "몸으로 표현하면 위험할 수 있습니다. 말로 표현하는 연습이 필요합니다."
          );
        });
      }

      showResult(resultMessage: string) {
        this.clearButtons();

        const finalScore = this.score;

        const selectedStudent =
          localStorage.getItem("haemileum_selected_student") || "이름 미선택";

        const selectedMission =
          localStorage.getItem("haemileum_selected_mission") ||
          "학교생활 대화 연습";

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
          `${resultMessage}\n\n학교생활 대화 미션 성공!\n최종 점수: ${finalScore}점\n\n결과가 저장되었습니다.`
        );

        this.createButton(300, 365, "다시 연습하기", true, () => {
          this.score = 0;
          this.scoreText.setText("점수: 0점");
          this.showStep1();
        });

        this.createButton(500, 365, "교사 화면 확인", true, () => {
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
        isCorrect: boolean,
        action: () => void
      ) {
        const button = this.add
          .rectangle(x, y, 170, 88, 0xffffff)
          .setStrokeStyle(2, 0x2563eb)
          .setInteractive({ useHandCursor: true });

        const text = this.add
          .text(x, y, label, {
            fontSize: "15px",
            color: "#1e293b",
            fontFamily: "Arial",
            align: "center",
            wordWrap: { width: 145 },
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
      height: 520,
      parent: gameRef.current,
      scene: SchoolTalkScene,
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
            [밀] 사회성 훈련
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            학교생활 대화 연습
          </h1>
          <p className="mt-3 text-slate-600">
            학생이 친구와의 갈등 상황에서 적절한 표현을 선택하고,
            자기표현과 권리 보호 대화를 반복 연습하는 화면입니다.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div ref={gameRef} />
        </div>
      </section>
    </main>
  );
}