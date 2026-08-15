# 해밀리움(Haemileum) 개발자 안내서 (Developer Guide)

온보딩 및 개발자 간 코드 공유와 협업을 위한 기술 아키텍처, 디렉터리 구조, 실행 및 개발 가이드 문서입니다.

---

## 1. 프로젝트 개요 (Overview)

- **프로젝트명**: 해밀리움 (Haemileum)
- **주요 기능**: 학생/교사/학부모/관리를 위한 종합 인터랙티브 교육 플랫폼 (마을/시뮬레이션, 오디오북/전자책, 감정케어, 루틴/미션 관리, 안심 귀가 서비스 등)
- **저장소 위치**: `c:\haemileum`

---

## 2. 기술 스택 (Tech Stack)

### Frontend
- **Framework**: [Next.js 16.2](https://nextjs.org/) (App Router 기반)
- **Core**: React 19, TypeScript 5
- **Styling**: Tailwind CSS v4, PostCSS
- **Interactive & Media**:
  - **Phaser 4**: 2D/3D 게임 및 인터랙티브 마을/시뮬레이션 구현
  - **edge-tts-universal**: 음성 합성 (TTS) 지원
  - **pdfjs-dist**: PDF/전자책 뷰어 지원

### Database & Backend
- **Database**: MySQL 8.4 (로컬 Standalone 인스턴스, 데이터 경로: `c:\haemileum\mysql-data`)
- **Management Scripts**: PowerShell 기반 DB 실행/중지 관리 (`start-mysql.ps1`, `stop-mysql.ps1`)
- **Backend Service**: Next.js API Routes (`frontend/app/api`) 및 확장 백엔드 디렉터리 (`backend/`)

---

## 3. 디렉터리 구조 (Directory Structure)

```
haemileum/
├── frontend/                  # Next.js 프론트엔드 애플리케이션
│   ├── app/                   # Next.js App Router (페이지 및 API 엔드포인트)
│   │   ├── admin/             # 관리자 페이지
│   │   ├── api/               # API 엔드포인트 (백엔드 로직)
│   │   ├── audiobook/         # 오디오북 서비스
│   │   ├── ebook/             # 전자책 서비스
│   │   ├── emotion/           # 감정 케어 / 기분 기록
│   │   ├── mission/           # 미션 관리
│   │   ├── parent/            # 학부모 전용 페이지
│   │   ├── routine/           # 학생 루틴 관리
│   │   ├── safe-return/       # 안심 귀가 서비스
│   │   ├── simulation/        # 인터랙티브 시뮬레이션
│   │   ├── student/           # 학생 메인 / 마이페이지
│   │   ├── teacher/           # 교사 페이지
│   │   ├── village/           # 마을 만들기 및 3D/2D 맵
│   │   ├── workshop/          # 워크숍 / 주머니 아이템
│   │   ├── globals.css        # 전역 스타일 및 Tailwind CSS 설정
│   │   └── page.tsx           # 서비스 메인 랜딩 페이지
│   ├── src/                   # 재사용 가능한 소스 코드
│   │   ├── components/        # UI 공통 컴포넌트
│   │   └── utils/             # 공통 유틸리티 함수
│   └── package.json           # 의존성 및 스크립트 설정 (포트 3001 지정)
├── mysql-data/                # 로컬 MySQL 8.4 데이터 저장 디렉터리
├── docs/                      # 3D 캐릭터 애니메이션/디자인 제안서 및 획일 문서
├── DesignSystem/              # 디자인 시스템 자산 및 가이드
├── KnowledgeBase/             # 지식 베이스 및 문서 자료
├── PitchDeck/                 # 투자 및 비즈니스 발표 자료
├── start-mysql.ps1            # MySQL DB 서버 시작 스크립트
├── stop-mysql.ps1             # MySQL DB 서버 종료 스크립트
└── DEVELOPER_GUIDE.md         # (본 문서) 개발자 안내서
```

---

## 4. 개발 환경 구축 및 실행 방법 (Getting Started)

### 4.1. 사전 요구사항 (Prerequisites)
- **Node.js**: v20 이상 권장
- **Package Manager**: `npm` (또는 `pnpm`, `yarn`)
- **MySQL Client**: MySQL Server 8.4 (PowerShell 스크립트를 통한 실행)

### 4.2. 데이터베이스 실행
로컬 개발 환경에서는 루트 디렉터리의 PowerShell 스크립트를 통해 MySQL 서버를 구동할 수 있습니다.

```powershell
# MySQL DB 시작
powershell -ExecutionPolicy Bypass -File .\start-mysql.ps1

# MySQL DB 종료
powershell -ExecutionPolicy Bypass -File .\stop-mysql.ps1
```

### 4.3. 프론트엔드 개발 서버 실행
```bash
# 1. 프론트엔드 디렉터리로 이동
cd frontend

# 2. 패키지 의존성 설치 (최초 1회 또는 업데이트 시)
npm install

# 3. 개발 서버 실행 (기본 포트: 3001)
npm run dev
```

서버 실행 후 브라우저에서 **`http://localhost:3001`** 에 접속하여 개발 및 테스트를 진행할 수 있습니다.

---

## 5. 주요 서비스 모듈 안내

1. **마을/시뮬레이션 (`app/village`, `app/simulation`)**:
   - Phaser 엔진을 활용하여 학생들이 참여할 수 있는 인터랙티브한 2D/3D 공간을 구성합니다.
2. **전자책 및 오디오북 (`app/ebook`, `app/audiobook`)**:
   - `pdfjs-dist`를 통한 교재/도서 뷰어 기능 및 `edge-tts-universal`을 활용한 음성 듣기 기능을 제공합니다.
3. **루틴 & 미션 관리 (`app/routine`, `app/mission`)**:
   - 학생의 일일 습관 형성 및 미션 수행 현황을 체크하는 모듈입니다.
4. **안심 귀가 서비스 (`app/safe-return`)**:
   - 학부모 및 교사가 학생의 위치 및 안전 귀가 상태를 확인할 수 있는 서비스입니다.

---

## 6. 코드 스타일 및 개발 규칙 (Coding Standards)

- **TypeScript 작성**: 모든 Component 및 Utility 함수에는 명확한 Type 정의를 작성합니다.
- **컴포넌트 구조**: `app/` 디렉터리에는 라우팅 기반 페이지 컴포넌트를 두고, 재사용성이 높은 pure UI 컴포넌트는 `src/components/`에 위치시킵니다.
- **포트 지정**: 본 프로젝트의 프론트엔드 개발 서버는 다른 서비스와의 포트 충돌 방지를 위해 **`3001`번 포트**를 기본 사용합니다.
- **커밋 및 문서화**: 새로운 기능 추가 시 `docs/` 또는 관련 디렉터리에 가이드를 추가하거나 주석을 명확하게 작성합니다.
