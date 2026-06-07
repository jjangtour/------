'use client';
import { useState } from 'react';
import Image from 'next/image';

interface Step {
  id: number;
  scene: string;
  question: string;
  choices: string[];
  correct: string;
  successMsg: string;
  failMsg: string;
  image: string;
}

const steps: Step[] = [
  {
    id: 1,
    scene: '도윤이가 버스정류장에 도착했어요.',
    question: '집에 가려면 몇 번 버스를 타야 할까요?',
    choices: ['23번 버스', '32번 버스'],
    correct: '23번 버스',
    successMsg: '좋아요! 버스 번호를 잘 확인했어요. ✓',
    failMsg: '괜찮아요. 다시 버스 번호를 볼까요?',
    image: '/assets/bus/bus-step1-stop.png',
  },
  {
    id: 2,
    scene: '버스가 왔어요!',
    question: '버스에 타려면 무엇을 먼저 해야 할까요?',
    choices: ['교통카드를 찍어요', '그냥 들어가요'],
    correct: '교통카드를 찍어요',
    successMsg: '맞아요! 카드를 찍고 천천히 들어가요. ✓',
    failMsg: '교통카드를 먼저 찍어야 해요. 다시 해볼까요?',
    image: '/assets/bus/bus-step2-arriving.png',
  },
  {
    id: 3,
    scene: '버스가 달리고 있어요. 내릴 곳이 가까워졌어요.',
    question: '이제 무엇을 해야 할까요?',
    choices: ['하차벨을 눌러요', '운전기사님을 불러요'],
    correct: '하차벨을 눌러요',
    successMsg: '완벽해요! 하차벨을 눌러 내릴 준비를 해요. ✓',
    failMsg: '하차벨을 눌러요. 기사님을 부르지 않아도 돼요.',
    image: '/assets/bus/bus-step4-bell.png',
  },
];

export default function DemoSection() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const step = steps[currentStep];
  const isCorrect = answer === step?.correct;

  const handleChoice = (choice: string) => {
    if (answer) return;
    setAnswer(choice);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
      setAnswer(null);
    } else {
      setComplete(true);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswer(null);
    setComplete(false);
  };

  return (
    <section id="demo" className="bg-gradient-to-b from-emerald-950 to-emerald-800 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <p className="text-sm font-black uppercase tracking-widest text-emerald-300">
            미니 체험존
          </p>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            해밀이음 마을을 직접 걸어보세요
          </h2>
          <p className="mt-4 text-base font-semibold text-emerald-200">
            버스 미션 체험 — 도윤이와 함께 버스를 타봐요
          </p>
        </div>

        <div className="mx-auto max-w-sm">
          {/* Phone frame */}
          <div className="rounded-[2.5rem] bg-slate-800 p-3 shadow-2xl ring-1 ring-white/10">
            <div className="overflow-hidden rounded-[2rem] bg-white">
              {/* Notch */}
              <div className="flex h-7 items-center justify-center bg-slate-900">
                <div className="h-1.5 w-16 rounded-full bg-slate-600"></div>
              </div>

              {complete ? (
                <div className="flex min-h-[480px] flex-col items-center justify-center bg-emerald-50 p-8 text-center">
                  <div className="text-6xl">🎉</div>
                  <h3 className="mt-4 text-xl font-black text-emerald-800">미션 완료!</h3>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                    도윤이가 혼자 버스를 탔어요.
                    <br />
                    정말 잘했어요!
                  </p>
                  <div className="mt-6 rounded-xl bg-white px-4 py-3 ring-1 ring-emerald-200 text-left">
                    <p className="text-xs font-black text-slate-500">이음이의 말</p>
                    <p className="mt-1 text-sm font-bold text-emerald-700">
                      &ldquo;훌륭해요! 앞으로도 이렇게 할 수 있어요.&rdquo;
                    </p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="mt-6 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-black text-white hover:bg-emerald-800"
                  >
                    다시 해보기
                  </button>
                </div>
              ) : (
                <div className="min-h-[480px]">
                  {/* Progress bar */}
                  <div className="flex gap-1 px-4 pt-3">
                    {steps.map((s, i) => (
                      <div
                        key={s.id}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          i < currentStep
                            ? 'bg-emerald-500'
                            : i === currentStep
                            ? 'bg-emerald-400'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Step number */}
                  <p className="px-4 pt-2 text-xs font-bold text-slate-400">
                    단계 {currentStep + 1} / {steps.length}
                  </p>

                  {/* Scene image */}
                  <div className="relative mx-4 mt-2 h-36 overflow-hidden rounded-xl bg-slate-100">
                    <Image
                      src={step.image}
                      alt={step.scene}
                      fill
                      className="object-cover"
                      sizes="320px"
                    />
                  </div>

                  {/* Scene & question */}
                  <div className="px-4 pt-3">
                    <p className="text-xs font-bold text-slate-400">{step.scene}</p>
                    <p className="mt-2 text-base font-black text-slate-900">{step.question}</p>
                  </div>

                  {/* Choices */}
                  <div className="space-y-2 px-4 pt-4">
                    {step.choices.map((choice) => {
                      const chosen = answer === choice;
                      const correct = choice === step.correct;

                      let cls =
                        'w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-bold transition-all ';
                      if (!answer) {
                        cls +=
                          'border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50 active:scale-95';
                      } else if (chosen && correct) {
                        cls += 'border-emerald-500 bg-emerald-50 text-emerald-800';
                      } else if (chosen && !correct) {
                        cls += 'border-orange-400 bg-orange-50 text-orange-800';
                      } else if (!chosen && correct) {
                        cls += 'border-emerald-300 bg-emerald-50/60 text-emerald-700';
                      } else {
                        cls += 'border-slate-200 bg-white opacity-40';
                      }

                      return (
                        <button
                          key={choice}
                          onClick={() => handleChoice(choice)}
                          disabled={!!answer}
                          className={cls}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>

                  {/* Ieumi feedback */}
                  {answer && (
                    <div
                      className={`mx-4 mt-3 flex items-center gap-3 rounded-xl p-3 ${
                        isCorrect ? 'bg-emerald-50' : 'bg-orange-50'
                      }`}
                    >
                      <span className="text-xl">🤖</span>
                      <div>
                        <p
                          className={`text-xs font-black ${
                            isCorrect ? 'text-emerald-600' : 'text-orange-600'
                          }`}
                        >
                          이음이
                        </p>
                        <p
                          className={`text-sm font-bold ${
                            isCorrect ? 'text-emerald-800' : 'text-orange-800'
                          }`}
                        >
                          {isCorrect ? step.successMsg : step.failMsg}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Next button */}
                  {answer && (
                    <div className="px-4 pb-4 pt-3">
                      <button
                        onClick={handleNext}
                        className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-black text-white hover:bg-emerald-800 transition-colors"
                      >
                        {currentStep < steps.length - 1 ? '다음 단계 →' : '미션 완료!'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-sm font-bold text-emerald-300">
            교사와 학부모가 서비스의 핵심을 바로 이해할 수 있어요
          </p>
        </div>
      </div>
    </section>
  );
}
