"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const practiceTips = [
  "내 마음을 말하기 전에 한 번 숨을 쉬어요.",
  "친구를 탓하기보다 부탁하는 말로 바꿔요.",
  "불편할 때는 짧고 분명하게 말해도 괜찮아요.",
];

const conversationSteps = [
  "친구에게 조심스럽게 묻기",
  "내 의견을 차분히 요청하기",
  "싫은 말은 말로 멈추기",
];

export default function SchoolTalkSimulationPage() {
  const gameRef = useRef<HTMLDivElement | null>(null);
  const phaserGameRef = useRef<import("phaser").Game | null>(null);

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return;

    let isMounted = true;

    async function startGame() {
      const Phaser = (await import("phaser")).default;

      if (!isMounted || !gameRef.current || phaserGameRef.current) return;

      class SchoolTalkScene extends Phaser.Scene {
        private messageText!: import("phaser").GameObjects.Text;
        private scoreText!: import("phaser").GameObjects.Text;
        private stepText!: import("phaser").GameObjects.Text;
        private hintText!: import("phaser").GameObjects.Text;
        private score = 0;
        private buttons: import("phaser").GameObjects.GameObject[] = [];

        constructor() {
          super("SchoolTalkScene");
        }

        create() {
          this.cameras.main.setBackgroundColor("#f7faf8");

          this.add
            .text(450, 38, "해밀이음 학교생활 대화 연습", {
              fontSize: "27px",
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
              fontSize: "22px",
              color: "#1e293b",
              fontFamily: "Arial",
              align: "center",
              fontStyle: "bold",
              lineSpacing: 8,
              wordWrap: { width: 790 },
            })
            .setOrigin(0.5);

          this.hintText = this.add
            .text(450, 515, "상대방과 나를 모두 지키는 말을 골라요.", {
              fontSize: "18px",
              color: "#475569",
              fontFamily: "Arial",
              align: "center",
              wordWrap: { width: 790 },
            })
            .setOrigin(0.5);

          this.showStep1();
        }

        clearButtons() {
          this.buttons.forEach((item) => item.destroy());
          this.buttons = [];
        }

        setStep(step: number, title: string) {
          this.stepText.setText(`${step}/3상황 · ${title}`);
        }

        updateScore(point: number) {
          this.score += point;
          this.scoreText.setText(`점수 ${this.score}점`);
        }

        showStep1() {
          this.clearButtons();
          this.setStep(1, "친구에게 물어보기");
          this.messageText.setText(
            "친구가 말없이 내 연필을 가져갔어요.\n어떻게 말하면 좋을까요?"
          );
          this.hintText.setText("먼저 확인하고, 필요한 것을 차분하게 말해요.");

          this.createButton(200, 340, "야! 왜 가져가!", "화를 크게 내요", false, () => {
            this.showFeedback(
              "화난 마음은 이해돼요. 하지만 큰소리로 말하면 친구도 놀랄 수 있어요."
            );
          });

          this.createButton(
            450,
            340,
            "혹시 내 연필\n빌려간 거야?",
            "먼저 물어봐요",
            true,
            () => {
              this.updateScore(10);
              this.showFeedback(
                "좋아요. 먼저 물어보면 오해를 줄일 수 있어요.",
                () => this.showStep2()
              );
            }
          );

          this.createButton(
            700,
            340,
            "아무 말도 안 해요",
            "참기만 해요",
            false,
            () => {
              this.showFeedback(
                "계속 참기만 하면 마음이 더 불편해질 수 있어요. 짧게 물어봐도 괜찮아요."
              );
            }
          );
        }

        showStep2() {
          this.clearButtons();
          this.setStep(2, "의견 요청하기");
          this.messageText.setText(
            "모둠 활동에서 친구가 내 의견을 듣지 않아요.\n어떻게 말하면 좋을까요?"
          );
          this.hintText.setText("비난보다 부탁하는 말이 대화를 이어가게 해요.");

          this.createButton(
            200,
            340,
            "너는 내 말을\n맨날 무시해",
            "상대를 탓해요",
            false,
            () => {
              this.showFeedback(
                "상대를 탓하면 말다툼이 커질 수 있어요. 내 부탁을 말해볼까요?"
              );
            }
          );

          this.createButton(
            450,
            340,
            "내 생각도\n한 번 들어줄래?",
            "부탁해요",
            true,
            () => {
              this.updateScore(10);
              this.showFeedback(
                "잘했어요. 내 의견을 차분하게 요청했어요.",
                () => this.showStep3()
              );
            }
          );

          this.createButton(700, 340, "그냥 혼자 할래", "대화를 멈춰요", false, () => {
            this.showFeedback(
              "혼자 하겠다고 하면 모둠 활동이 어려워질 수 있어요. 먼저 부탁해 봐요."
            );
          });
        }

        showStep3() {
          this.clearButtons();
          this.setStep(3, "불편한 말 멈추기");
          this.messageText.setText(
            "친구가 장난으로 놀리는데 내 기분이 나빠요.\n어떻게 표현하면 좋을까요?"
          );
          this.hintText.setText("몸으로 밀지 말고, 내 기분과 부탁을 말로 표현해요.");

          this.createButton(200, 340, "나도 똑같이 놀려요", "되갚아요", false, () => {
            this.showFeedback("같이 놀리면 갈등이 더 커질 수 있어요.");
          });

          this.createButton(
            450,
            340,
            "그 말은 기분이 안 좋아.\n그만해 줘.",
            "분명히 말해요",
            true,
            () => {
              this.updateScore(10);
              this.showResult(
                "좋아요. 불편한 마음을 분명하고 안전하게 표현했어요."
              );
            }
          );

          this.createButton(700, 340, "친구를 밀어요", "몸으로 표현해요", false, () => {
            this.showFeedback(
              "몸으로 표현하면 다칠 수 있어요. 말로 멈춰 달라고 해요."
            );
          });
        }

        showResult(resultMessage: string) {
          this.clearButtons();

          const finalScore = this.score;
          const selectedStudent =
            localStorage.getItem("haemileum_selected_student") || "이름 미선택";
          const resultData = {
            studentName: selectedStudent,
            mission: "학교생활 대화",
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
            `${resultMessage}\n\n학교생활 대화 미션 성공!\n최종 점수 ${finalScore}점\n결과가 저장되었습니다.`
          );
          this.hintText.setText("다시 연습하거나 기록 화면에서 결과를 확인할 수 있어요.");

          this.createButton(300, 430, "다시 연습하기", "처음부터", true, () => {
            this.score = 0;
            this.scoreText.setText("점수 0점");
            this.showStep1();
          });

          this.createButton(600, 430, "교사 화면 보기", "기록 확인", true, () => {
            window.location.href = "/teacher/dashboard";
          });
        }

        showFeedback(message: string, nextAction?: () => void) {
          this.messageText.setText(message);

          if (nextAction) {
            this.time.delayedCall(1000, () => {
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
            .rectangle(x, y, 210, 118, 0xffffff)
            .setStrokeStyle(3, 0x10b981)
            .setInteractive({ useHandCursor: true });

          const text = this.add
            .text(x, y - 16, label, {
              fontSize: "19px",
              color: "#0f172a",
              fontFamily: "Arial",
              fontStyle: "bold",
              align: "center",
              wordWrap: { width: 176 },
            })
            .setOrigin(0.5);

          const smallText = this.add
            .text(x, y + 36, caption, {
              fontSize: "14px",
              color: "#64748b",
              fontFamily: "Arial",
              align: "center",
              wordWrap: { width: 176 },
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
        height: 590,
        parent: gameRef.current,
        scene: SchoolTalkScene,
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
            <p className="text-sm font-black text-emerald-700">사회성 훈련</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">
              학교생활 대화 연습
            </h1>
            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
              친구와의 작은 갈등 상황에서 어떤 말을 고르면 좋을지 연습합니다.
              정답을 맞히는 것보다 내 마음을 안전하게 표현하는 경험이 중요합니다.
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

          <div className="rounded-lg border border-sky-200 bg-sky-50 p-5">
            <p className="text-base font-black text-sky-950">
              연습 전에 알려주세요
            </p>
            <div className="mt-3 space-y-2">
              {practiceTips.map((tip) => (
                <p
                  key={tip}
                  className="rounded-lg bg-white/70 p-3 text-sm font-bold leading-6 text-sky-900 ring-1 ring-sky-100"
                >
                  {tip}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {conversationSteps.map((step, index) => (
            <div
              key={step}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-black text-emerald-700">
                {index + 1}상황
              </p>
              <p className="mt-1 text-sm font-black text-slate-950">{step}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div
            ref={gameRef}
            className="min-h-[380px] w-full overflow-hidden rounded-lg bg-[#f7faf8]"
          />
        </div>
      </section>
    </main>
  );
}
