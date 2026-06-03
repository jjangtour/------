"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import Phaser from "phaser";

export default function KioskSimulationPage() {
  const gameRef = useRef<HTMLDivElement | null>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return;

    class KioskScene extends Phaser.Scene {
      private messageText!: Phaser.GameObjects.Text;
      private score = 0;

      constructor() {
        super("KioskScene");
      }

      create() {
        this.cameras.main.setBackgroundColor("#f8fafc");

        this.add.text(400, 50, "해밀이음 키오스크 시뮬레이션", {
          fontSize: "28px",
          color: "#1e293b",
          fontFamily: "Arial",
        }).setOrigin(0.5);

        this.add.text(400, 100, "상황: 햄버거 가게에서 음식을 주문해 봅시다.", {
          fontSize: "18px",
          color: "#475569",
          fontFamily: "Arial",
        }).setOrigin(0.5);

        this.messageText = this.add.text(400, 160, "1단계: 먹고 싶은 메뉴를 선택하세요.", {
          fontSize: "20px",
          color: "#2563eb",
          fontFamily: "Arial",
        }).setOrigin(0.5);

        this.createButton(250, 260, "햄버거", true);
        this.createButton(400, 260, "운동화", false);
        this.createButton(550, 260, "연필", false);

        this.add.text(400, 400, "정답을 고르면 다음 단계로 넘어갑니다.", {
          fontSize: "16px",
          color: "#64748b",
          fontFamily: "Arial",
        }).setOrigin(0.5);
      }

      createButton(x: number, y: number, label: string, isCorrect: boolean) {
        const button = this.add.rectangle(x, y, 120, 70, 0xffffff)
          .setStrokeStyle(2, 0x2563eb)
          .setInteractive({ useHandCursor: true });

        const text = this.add.text(x, y, label, {
          fontSize: "20px",
          color: "#1e293b",
          fontFamily: "Arial",
        }).setOrigin(0.5);

        button.on("pointerover", () => {
          button.setFillStyle(0xdbeafe);
        });

        button.on("pointerout", () => {
          button.setFillStyle(0xffffff);
        });

        button.on("pointerdown", () => {
          if (this.isAnswered) {
            this.messageText.setText("이미 정답을 선택했습니다. 다음 단계로 넘어가세요.");
            return;
          }

          if (isCorrect) {
            this.isAnswered = true;
            this.score += 10;
            this.messageText.setText(`정답입니다! 점수: ${this.score}점`);
            button.setFillStyle(0xbbf7d0);
          } else {
            this.messageText.setText("다시 생각해 봅시다. 음식 메뉴를 골라야 해요.");
            button.setFillStyle(0xfecaca);
          }
        });

        return { button, text };
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
          <p className="text-sm font-semibold text-blue-700">[이] 일상 시뮬레이션</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            키오스크 주문 연습
          </h1>
          <p className="mt-3 text-slate-600">
            학생이 안전한 환경에서 음식 주문 절차를 반복 연습하는 샘플 화면입니다.
          </p>
          <Link
            href="/simulation/kiosk"
            className="mt-6 inline-flex rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-800"
          >
            학생으로 시작하기
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div ref={gameRef} />
        </div>
      </section>
    </main>
  );
}