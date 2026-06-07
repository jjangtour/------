'use client';
import { useState } from 'react';
import Link from 'next/link';

interface World {
  id: string;
  icon: string;
  name: string;
  color: string;
  ringColor: string;
  missions: string[];
  goal: string;
  href: string;
}

const worlds: World[] = [
  {
    id: 'bus',
    icon: '🚌',
    name: '버스정류장 월드',
    color: 'bg-sky-50 border-sky-200 hover:border-sky-400',
    ringColor: 'ring-sky-400',
    missions: ['버스 번호 확인하기', '교통카드 찍기', '하차벨 누르기'],
    goal: '대중교통 이용 능력',
    href: '/simulation/bus',
  },
  {
    id: 'kiosk',
    icon: '🍔',
    name: '햄버거 가게 월드',
    color: 'bg-orange-50 border-orange-200 hover:border-orange-400',
    ringColor: 'ring-orange-400',
    missions: ['메뉴 고르기', '키오스크 주문하기', '카드 결제하기'],
    goal: '주문과 결제',
    href: '/simulation/kiosk',
  },
  {
    id: 'atm',
    icon: '🏦',
    name: '해밀이음 은행 월드',
    color: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
    ringColor: 'ring-emerald-400',
    missions: ['ATM 출금하기', '입금하기', '비밀번호 가리기'],
    goal: '금융 생활 기초',
    href: '/simulation/atm',
  },
  {
    id: 'store',
    icon: '🏪',
    name: '편의점 월드',
    color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
    ringColor: 'ring-purple-400',
    missions: ['물건 고르기', '계산하기', '봉투 요청하기'],
    goal: '소비 생활',
    href: '/simulation/town',
  },
  {
    id: 'safety',
    icon: '🛡️',
    name: '안전 골목 월드',
    color: 'bg-red-50 border-red-200 hover:border-red-400',
    ringColor: 'ring-red-400',
    missions: ['길 잃었을 때 도움 요청', '낯선 사람 대처', 'SOS 카드 사용'],
    goal: '생활 안전',
    href: '/simulation/safety-sos',
  },
  {
    id: 'school',
    icon: '🏫',
    name: '학교생활 월드',
    color: 'bg-amber-50 border-amber-200 hover:border-amber-400',
    ringColor: 'ring-amber-400',
    missions: ['친구와 말하기', '선생님께 도움 요청', '감정 표현하기'],
    goal: '사회성 및 의사소통',
    href: '/simulation/school-talk',
  },
];

export default function WorldMapSection() {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedWorld = worlds.find((w) => w.id === selected);

  return (
    <section id="missions" className="bg-stone-50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <p className="text-sm font-black uppercase tracking-widest text-emerald-600">
            생활 자립 미션 월드맵
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            생활 속 어려운 순간을
            <br />
            하나씩 연습합니다
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base font-semibold text-slate-500">
            장소를 클릭하면 어떤 미션을 연습하는지 확인할 수 있어요
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {worlds.map((world) => (
            <button
              key={world.id}
              onClick={() => setSelected(selected === world.id ? null : world.id)}
              className={`rounded-2xl border-2 p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${world.color} ${
                selected === world.id
                  ? `ring-2 ring-offset-2 ${world.ringColor} scale-[1.02] shadow-md`
                  : ''
              }`}
            >
              <span className="text-4xl">{world.icon}</span>
              <h3 className="mt-3 text-sm font-black leading-tight text-slate-800">
                {world.name}
              </h3>
              <p className="mt-1 text-xs font-bold text-slate-500">{world.goal}</p>
            </button>
          ))}
        </div>

        {selectedWorld && (
          <div
            className={`mt-6 rounded-2xl border-2 p-6 transition-all duration-300 ${selectedWorld.color}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedWorld.icon}</span>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {selectedWorld.name}에 도착했어요.
                    </h3>
                    <p className="text-sm font-bold text-emerald-700">
                      학습 목표: {selectedWorld.goal}
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {selectedWorld.missions.map((mission, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">
                        {i + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-700">{mission}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link
                href={selectedWorld.href}
                className="shrink-0 self-start rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-800 transition-colors"
              >
                미션 시작 →
              </Link>
            </div>
          </div>
        )}

        {!selected && (
          <p className="mt-6 text-center text-sm font-bold text-slate-400">
            ↑ 장소를 클릭해 미션을 확인해보세요
          </p>
        )}
      </div>
    </section>
  );
}
