import Link from "next/link";

export const metadata = {
  title: "개인정보 처리방침 - 해밀이음",
  description: "해밀이음 서비스의 개인정보 처리방침 안내입니다.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-5 sm:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 p-8 sm:p-12">
        <div className="mb-10 border-b border-slate-200 pb-8">
          <Link href="/parent/dashboard" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition mb-6 inline-block">
            ← 대시보드로 돌아가기
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-sky-100 text-sky-700 font-bold text-xs px-3 py-1 rounded-full">공교육 에듀테크 가이드라인 준수</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">개인정보 처리방침</h1>
          <p className="text-slate-500 mt-2 font-medium">시행일: 2026년 6월 8일</p>
        </div>

        <div className="space-y-10 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">1️⃣</span> 총칙
            </h2>
            <p>
              '해밀이음'은 「개인정보 보호법」 등 관련 법령을 준수하며, 경계선 지능 학생(만 14세 미만 아동 포함)의 권리와 개인정보를 보호하기 위해 최선을 다하고 있습니다.
              본 방침은 공교육 에듀테크 개인정보보호 가이드라인을 바탕으로 작성되었습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">2️⃣</span> 수집하는 개인정보 항목 및 목적
            </h2>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
              <ul className="list-disc pl-5 space-y-3">
                <li><strong className="text-slate-900">수집 항목:</strong> 학생 이름(닉네임), 실시간 위치 정보(GPS), 감정 상태(마음 일기 내용), 미션 수행 결과(활동 점수 및 체류 시간)</li>
                <li><strong className="text-slate-900">수집 목적:</strong> 학생의 안전한 이동(안심 귀가 동행) 모니터링, 보호자 연계 지도, 학생 맞춤형 난이도 조절 및 활동 기록 제공</li>
                <li><strong className="text-slate-900">보유 기간:</strong> 회원 탈퇴(또는 기기 내 로컬 데이터 초기화) 시 지체 없이 파기</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">3️⃣</span> 만 14세 미만 아동의 개인정보 보호 및 법정대리인의 권리
            </h2>
            <p className="mb-3">
              해밀이음은 만 14세 미만 아동의 개인정보를 수집할 때 <strong>반드시 법정대리인(보호자)의 명시적인 동의</strong>를 받습니다. 초기 서비스 진입 시 법정대리인이 직접 확인하고 동의해야만 기능(위치 공유 등)이 활성화됩니다.
            </p>
            <p>
              법정대리인은 언제든지 아동의 개인정보 열람, 정정, 삭제, 처리 정지 및 동의 철회를 요구할 수 있으며, 시스템의 초기화 메뉴(`localStorage.clear`)를 통해 즉각적인 파기가 가능합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">4️⃣</span> 민감정보(위치 및 정서 데이터)의 안전성 확보 조치
            </h2>
            <p>
              학생의 실시간 위치 정보와 감정 기록은 매우 민감한 정보로 취급됩니다. 본 서비스는 현재 사용자 기기 내 저장소(Local Storage)를 기본으로 활용하여 서버 집중 보관으로 인한 대규모 유출 위험을 원천 차단하고 있으며, 보호자 화면과의 동기화 시 암호화된 통신을 사용합니다.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 text-center">
          <Link href="/parent/dashboard" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-xl transition inline-block">
            확인 및 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
