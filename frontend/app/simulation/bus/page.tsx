"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const practiceTips = [
  "출발하기 전에 목적지를 먼저 확인해요.",
  "버스 번호와 방향을 천천히 비교해요.",
  "방송을 듣고 내릴 정류장을 고르면 돼요.",
];

const busSteps = [
  "목적지 확인하기",
  "버스 번호 고르기",
  "내릴 정류장 선택하기",
];

export default function BusSimulationPage() {
  const gameRef = useRef<HTMLDivElement | null>(null);
  const phaserGameRef = useRef<import("phaser").Game | null>(null);

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return;

    let isMounted = true;

    async function startGame() {
      const Phaser = (await import("phaser")).default;

      if (!isMounted || !gameRef.current || phaserGameRef.current) return;

      class BusScene extends Phaser.Scene {
        private messageText!: import("phaser").GameObjects.Text;
        private scoreText!: import("phaser").GameObjects.Text;
        private stepText!: import("phaser").GameObjects.Text;
        private hintText!: import("phaser").GameObjects.Text;
        private score = 0;
        private buttons: import("phaser").GameObjects.GameObject[] = [];

        constructor() {
          super("BusScene");
        }

        create() {
          this.cameras.main.setBackgroundColor("#f7faf8");

          this.add
            .text(450, 38, "해밀이음 버스 타기 연습", {
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
              fontSize: "23px",
              color: "#1e293b",
              fontFamily: "Arial",
              align: "center",
              fontStyle: "bold",
              lineSpacing: 8,
              wordWrap: { width: 780 },
            })
            .setOrigin(0.5);

          this.hintText = this.add
            .text(450, 500, "목적지, 번호, 내릴 곳을 하나씩 확인해요.", {
              fontSize: "18px",
              color: "#475569",
              fontFamily: "Arial",
              align: "center",
              wordWrap: { width: 780 },
            })
            .setOrigin(0.5);

          this.showStep1();
        }

        clearButtons() {
          this.buttons.forEach((item) => item.destroy());
          this.buttons = [];
        }

        setStep(step: number, title: string) {
          this.stepText.setText(`${step}/3단계 · ${title}`);
        }

        updateScore(point: number) {
          this.score += point;
          this.scoreText.setText(`점수 ${this.score}점`);
        }

        showStep1() {
          this.clearButtons();
          this.setStep(1, "목적지 확인");
          this.messageText.setText(
            "오늘은 도서관에 가려고 해요.\n어디로 가야 하는지 먼저 골라볼까요?"
          );
          this.hintText.setText("오늘 가려는 장소 이름을 찾아요.");

          this.createButton(210, 330, "도서관", "책을 빌리는 곳", true, () => {
            this.updateScore(10);
            this.showFeedback("맞아요. 오늘의 목적지는 도서관이에요.", () =>
              this.showStep2()
            );
          });

          this.createButton(450, 330, "영화관", "영화를 보는 곳", false, () => {
            this.showFeedback("영화관이 아니라 도서관에 가는 상황이에요.");
          });

          this.createButton(690, 330, "운동장", "운동하는 곳", false, () => {
            this.showFeedback("운동장이 아니라 책을 빌리는 도서관으로 가야 해요.");
          });
        }

        showStep2() {
          this.clearButtons();
          this.setStep(2, "버스 번호 선택");
          this.messageText.setText(
            "도서관에 가는 버스는 12번이에요.\n정류장에서 어떤 버스를 타야 할까요?"
          );
          this.hintText.setText("버스 앞 번호를 보고 12번을 찾아요.");

          this.createButton(210, 330, "7번 버스", "시장 방향", false, () => {
            this.showFeedback("7번 버스는 도서관 방향이 아니에요.");
          });

          this.createButton(450, 330, "12번 버스", "도서관 방향", true, () => {
            this.updateScore(10);
            this.showFeedback("잘했어요. 12번 버스를 타면 돼요.", () =>
              this.showStep3()
            );
          });

          this.createButton(690, 330, "31번 버스", "터미널 방향", false, () => {
            this.showFeedback("31번 버스는 다른 방향으로 가요.");
          });
        }

        showStep3() {
          this.clearButtons();
          this.setStep(3, "내릴 곳 선택");
          this.messageText.setText(
            "버스 안내 방송이 나와요.\n'다음 정류장은 도서관 앞입니다.' 어디에서 내려야 할까요?"
          );
          this.hintText.setText("목적지 이름이 들리면 내릴 준비를 해요.");

          this.createButton(210, 330, "시장 입구", "아직 전 정류장", false, () => {
            this.showFeedback("아직 도서관이 아니에요. 조금 더 가야 해요.");
          });

          this.createButton(450, 330, "도서관 앞", "내릴 정류장", true, () => {
            this.updateScore(10);
            this.showResult("좋아요. 도서관 앞 정류장에서 안전하게 내렸어요.");
          });

          this.createButton(690, 330, "종점", "너무 멀어요", false, () => {
            this.showFeedback("종점까지 가면 지나칠 수 있어요. 도서관 앞에서 내려요.");
          });
        }

        showResult(resultMessage: string) {
          this.clearButtons();

          const finalScore = this.score;
          const selectedStudent =
            localStorage.getItem("haemileum_selected_student") || "이름 미선택";
          const resultData = {
            studentName: selectedStudent,
            mission: "버스 타기",
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
            `${resultMessage}\n\n버스 타기 미션 성공!\n최종 점수 ${finalScore}점\n결과가 저장되었습니다.`
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
        scene: BusScene,
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
              버스 타기 연습
            </h1>
            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
              도서관에 가는 상황을 단계별로 연습합니다. 목적지, 버스 번호,
              내릴 정류장을 차례대로 확인하며 안전한 이동 절차를 익힙니다.
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
          {busSteps.map((step, index) => (
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
