'use client';
import { useState } from 'react';

const faqs = [
  {
    q: '특수학급뿐 아니라 일반학급의 느린학습자도 사용할 수 있나요?',
    a: '네. 해밀이음은 특수학급, 통합학급, 일반학급 내 느린학습자 모두 사용할 수 있도록 쉬운 문장과 단계형 미션으로 설계됩니다.',
  },
  {
    q: 'PC, 태블릿, 모바일에서 사용할 수 있나요?',
    a: '네. 학교와 가정 환경을 고려해 웹 기반으로 설계하고, PC와 태블릿 사용을 우선 고려합니다. 이후 모바일 사용성도 확장할 수 있습니다.',
  },
  {
    q: '학생 데이터는 어떻게 관리되나요?',
    a: '학생의 학습 기록은 교사와 보호자가 교육적 목적으로 확인할 수 있도록 설계하며, 개인정보 보호와 접근 권한 관리를 기본 원칙으로 합니다.',
  },
  {
    q: '인터넷이 느린 학교에서도 사용할 수 있나요?',
    a: '초기 버전은 2D 기반의 가벼운 화면과 단순한 인터랙션을 중심으로 설계해 학교 환경에서도 안정적으로 사용할 수 있도록 합니다.',
  },
  {
    q: '실제 교육과정과 연계할 수 있나요?',
    a: '네. 생활 자립, 사회성, 의사소통, 안전교육, 진로·직업 전 단계 활동과 연계할 수 있습니다.',
  },
  {
    q: '학생이 틀리면 어떻게 피드백하나요?',
    a: '벌점이나 실패 연출보다 "괜찮아요, 다시 확인해요"처럼 정서적으로 안전한 피드백을 제공합니다. 아이가 틀리지 않게 만드는 서비스가 아니라, 틀려도 다시 시도하며 스스로 해낼 수 있게 돕는 서비스입니다.',
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-white py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <p className="text-sm font-black uppercase tracking-widest text-emerald-600">FAQ</p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">자주 묻는 질문</h2>
          <p className="mt-4 text-base font-semibold text-slate-500">
            도입 전 궁금한 점을 미리 확인해보세요
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border-2 border-slate-100 transition-all"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left hover:bg-slate-50"
              >
                <span className="pr-4 text-base font-black text-slate-900">{faq.q}</span>
                <span
                  className={`shrink-0 text-2xl font-black text-emerald-600 transition-transform duration-200 ${
                    open === i ? 'rotate-45' : ''
                  }`}
                >
                  +
                </span>
              </button>
              {open === i && (
                <div className="border-t border-slate-100 bg-emerald-50/50 px-6 py-5">
                  <p className="text-base font-semibold leading-7 text-slate-600">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-100">
          <p className="text-base font-black text-slate-800">
            더 궁금한 점이 있으신가요?
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            실증학교 문의 및 제휴 상담을 통해 직접 답변드립니다.
          </p>
          <a
            href="#contact"
            className="mt-4 inline-flex rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-black text-white hover:bg-emerald-800 transition-colors"
          >
            문의하기 →
          </a>
        </div>
      </div>
    </section>
  );
}
