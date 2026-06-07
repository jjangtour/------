'use client';
import { useState } from 'react';

interface Situation {
  id: string;
  icon: string;
  label: string;
  correct: string;
  options: string[];
}

const situations: Situation[] = [
  {
    id: 'bus',
    icon: '🚌',
    label: '버스를 탈 때',
    correct: '교통카드',
    options: ['교통카드', '햄버거 쿠폰', '장난감 카드'],
  },
  {
    id: 'kiosk',
    icon: '🍔',
    label: '키오스크에서 결제할 때',
    correct: '신용카드',
    options: ['버스카드', '신용카드', '도서관 카드'],
  },
  {
    id: 'atm',
    icon: '🏧',
    label: 'ATM에서 출금할 때',
    correct: '은행카드',
    options: ['장난감 카드', '은행카드', '쿠폰'],
  },
  {
    id: 'lost',
    icon: '🆘',
    label: '길을 잃었을 때',
    correct: '도움 카드',
    options: ['아무나 따라가기', '도움 카드', '그냥 기다리기'],
  },
];

export default function ItemPocketSection() {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswer = (situationId: string, choice: string) => {
    if (answers[situationId]) return;
    setAnswers((prev) => ({ ...prev, [situationId]: choice }));
  };

  const resetAll = () => setAnswers({});
  const allAnswered = situations.every((s) => answers[s.id]);
  const correctCount = situations.filter((s) => answers[s.id] === s.correct).length;

  return (
    <section id="pocket" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <p className="text-sm font-black uppercase tracking-widest text-emerald-600">
            아이템 주머니 기능
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            상황에 맞는 도구를
            <br />
            스스로 고릅니다
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base font-semibold text-slate-500">
            버스를 탈 때는 교통카드, 햄버거를 살 때는 결제카드.
            <br />
            아래 상황을 보고 올바른 아이템을 선택해보세요!
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {situations.map((situation) => {
            const answered = !!answers[situation.id];
            const isCorrect = answers[situation.id] === situation.correct;

            return (
              <div
                key={situation.id}
                className={`rounded-2xl border-2 p-6 transition-all duration-200 ${
                  answered
                    ? isCorrect
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-orange-300 bg-orange-50'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-3xl">{situation.icon}</span>
                  <h3 className="text-base font-black text-slate-900">{situation.label}</h3>
                </div>

                {answered ? (
                  <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
                    {isCorrect ? (
                      <p className="font-black text-emerald-700">
                        ✓ 정답이에요!{' '}
                        <span className="font-bold">&ldquo;{situation.correct}&rdquo;</span>를 사용해요.
                      </p>
                    ) : (
                      <div>
                        <p className="font-black text-orange-600">
                          괜찮아요, 다시 해봐요.
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-600">
                          정답:{' '}
                          <span className="text-emerald-700">{situation.correct}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {situation.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleAnswer(situation.id, option)}
                        className="rounded-lg border-2 border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 active:scale-95"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {allAnswered && (
          <div className="mt-8 rounded-2xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-200">
            <p className="text-lg font-black text-emerald-800">
              {correctCount === situations.length
                ? '완벽해요! 모든 상황에서 올바른 도구를 골랐어요. 🎉'
                : `${correctCount}/${situations.length} 정답! 연습을 계속하면 더 잘할 수 있어요.`}
            </p>
            <button
              onClick={resetAll}
              className="mt-4 rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-black text-white hover:bg-emerald-800 transition-colors"
            >
              다시 해보기
            </button>
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h3 className="text-sm font-black text-slate-700 mb-3">아이템 주머니의 교육 효과</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              '상황 판단 능력 향상',
              '물건과 기능의 연결 이해',
              '실제 생활 전이 훈련',
              '오답을 통한 안전한 재학습',
            ].map((effect) => (
              <div
                key={effect}
                className="rounded-lg bg-white px-3 py-2 text-center text-xs font-bold text-emerald-700 ring-1 ring-emerald-200"
              >
                ✓ {effect}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
