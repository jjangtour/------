# 🚀 (주)팔네트웍스 비주얼 시스템 블루프린트 V1.0
## I. 기본 원칙 및 목표 [Goal & Principle]
*   **목표:** 팔네트웍스의 기술적 전문성과 구조적 안정성을 시각화하여, '신뢰'와 '지성'을 전달하는 통일된 디자인 언어를 확립합니다. (Target: 산업 표준 제정자)
*   **핵심 감성 (Tone & Manner):** High-Tech, Precision Engineering, Structural Authority.
*   **사용 원칙:** 모든 시각 요소는 단순 장식이 아닌, 논리적 흐름(Flow)이나 구조적 관계(Relationship)를 설명하는 '정보 전달 도구'여야 합니다.

## II. 컬러 시스템 (Color Palette System)
| 역할 | 이름 | HEX Code | 용도 및 지침 | 근거 |
| :--- | :--- | :--- | :--- | :--- |
| **Primary** (주요 배경/텍스트) | Deep Navy Blue | `#0D2B5C` | 제목, 핵심 텍스트 박스 배경, 메인 로고 색상. 가장 높은 신뢰도를 담당합니다. | [Self-RAG: 검증된 지식] |
| **Secondary** (흐름/기술) | Sky Cyan | `#4A90E2` | 플로우 차트의 화살표(Flow Arrow), 미래 기술을 상징하는 연결선, 강조되는 데이터 포인트. '움직임'과 '발전'을 표현합니다. | [Self-RAG: 검증된 지식] |
| **Accent** (강조/KPI) | Gold Yellow | `#FFC300` | 가장 중요한 KPI 수치(최종 $\Delta C_{max}$), Call-to-Action 버튼, 위험 경고 표시 등 '집중'이 필요한 곳에 사용합니다. | [Self-RAG: 검증된 지식] |
| **Neutral** (배경) | Light Gray | `#F5F7FA` | 슬라이드 배경색 (가장 기본). 가독성을 최대화하며, 대비 효과를 위해 Primary/Secondary와 명확히 분리되어야 합니다. | [Self-RAG: 검증된 지식] |

## III. 타이포그래피 시스템 (Typography System)
*   **선택 폰트:** Pretendard 또는 Noto Sans KR (가독성과 전문성을 최우선으로 하는 산세리프 계열 권장).
*   **Headline (H1/제목):** Bold, 대문자 사용을 지양하고, 간결한 명료함에 집중. Primary 컬러를 사용하여 권위를 부여합니다.
    *   *예시:* 24pt - 36pt (Primary Color)
*   **Body Text (본문):** Regular Weight로 충분한 여백과 가독성을 확보합니다. Secondary/Neutral 배경 위에서 가장 잘 읽히는 크기(12~16pt)를 유지합니다.
    *   *예시:* 14pt - 18pt (Primary Color 또는 Dark Gray)

## IV. 핵심 컴포넌트 라이브러리 (Core Component Library)
이 섹션은 'ALV 증명 다이어그램' 등 정보 밀도가 높은 곳에 재사용될 **최소 단위의 디자인 요소**를 정의합니다.

### 1. [Flow Arrow] - 흐름 화살표 시스템
*   **규칙:** 모든 프로세스나 인과관계는 반드시 이 컴포넌트를 통해 연결되어야 합니다.
*   **스타일:** 직선적이고 각지며(Precision), 끝부분에 작은 사각형 마커를 붙여 '단계 완료'의 느낌을 줍니다.
*   **색상:** Secondary (`#4A90E2`) 사용. (흐름/미래)

### 2. [Data Block] - 정보 컨테이너 박스
*   **목적:** 특정 개념(예: $\Delta C$ 발생, 규제 변화 등)을 담는 '논리 단위'입니다.
*   **스타일:** 모서리를 살짝 둥글게 처리한 직사각형 (Radius 8px). 내부에는 Primary 배경과 약간 대비되는 밝은 회색(`\#EAEFFF`)을 사용합니다.
*   **구조화:** 박스 내부에 **작은 글꼴로 출처(Source Tag)**를 의무적으로 삽입하여 논리적 투명성을 확보해야 합니다. (예: [근거: Business])

### 3. [KPI Callout] - 핵심 수치 강조 컴포넌트
*   **목적:** 청중이 절대 놓쳐서는 안 되는 최종 숫자(Key Metric)를 격리합니다.
*   **스타일:** 배경을 흰색으로 설정하고, **전체 크기의 큰 폰트(H1)**로 숫자를 배치한 후, 하단에 Accent 컬러의 두꺼운 밑줄(Underline)을 그어 시선이 머무르도록 합니다.
*   **규칙:** KPI는 항상 '수치'와 '단위'를 모두 명확히 표기합니다. (예: $1.2B USD $\uparrow$)

## V. 애니메이션 및 전환 브리프 가이드라인 (Animation Guidelines)
(이것은 다음 단계에서 세부적으로 구현되지만, 원칙을 정의합니다.)
*   **핵심:** '갑작스러운 등장'보다 **'논리적 전개(Reveal)'**에 중점을 둡니다.
*   **ALV 증명 구간 (High Density):**
    1.  **Step-by-Step Reveal:** 모든 다이어그램 요소는 한 번에 보이지 않습니다. 발표자의 발언 순서에 맞춰 **① [Data Block] 등장 → ② [Flow Arrow] 연결 → ③ [KPI Callout] 수치 확정**의 3단계로 분리하여 노출되어야 합니다.
    2.  **Transition Effect:** 이전 단계가 완료되면, 그 요소(예: 박스)는 은은하게 페이드 아웃되며 다음 단계의 공간을 확보해야 합니다.