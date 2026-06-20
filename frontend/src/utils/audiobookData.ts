export interface AudioChapter {
  number: number;
  title: string;
  startTime: number; // seconds
  duration: number; // seconds
}

export interface AudiobookData {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  narrator: string; // 성우/나레이터
  authorBio: string;
  publisher: string;
  publishDate: string;
  coverImage: string;
  duration: string; // 표시용 (예: '32분')
  totalSeconds: number;
  description: string;
  shortDescription: string;
  targetAge: string;
  category: string;
  tags: string[];
  chapters: AudioChapter[];
  isBest?: boolean;
  isFeatured?: boolean;
  curationCategory?: string; // '감성 성장', '사회성 향상', '학습 동기', '모험과 상상'
}

export const audiobooks: AudiobookData[] = [
  // ─── 기존 이북 → 오디오북 변환 (5권) ─────────────────────────
  {
    id: 'tree-life-story-audio',
    title: '나무가 들려주는 인생 이야기',
    subtitle: '시화집 : 나무, 시와 그림을 품다',
    author: '이수진',
    narrator: '김소연',
    authorBio:
      '글과 그림을 함께 쓰는 작가입니다. 자연 속에서 아이들에게 따뜻한 이야기를 전합니다. 나무, 꽃, 바람이 가르쳐 주는 삶의 지혜를 그림과 시로 표현합니다.',
    publisher: '아트앤컬쳐',
    publishDate: '2025년 3월 15일',
    coverImage: '/assets/ebook/cover_tree.png',
    duration: '32분',
    totalSeconds: 1920,
    description:
      '나무가 들려주는 인생 이야기는 아이들에게 자연의 지혜를 전하는 시화집입니다. 계절마다 변하는 나무의 모습을 통해 삶의 의미를 이야기합니다. 봄에 피어나는 새싹처럼 희망을, 여름의 푸른 잎처럼 성장을, 가을의 단풍처럼 변화의 아름다움을, 겨울의 앙상한 가지처럼 인내를 배울 수 있습니다. 따뜻한 성우의 목소리와 잔잔한 배경 음악이 아이의 감성을 풍요롭게 합니다.',
    shortDescription: '나무의 사계절을 통해 삶의 지혜를 배우는 따뜻한 시화 오디오북',
    targetAge: '7~12세',
    category: '시화집',
    tags: ['자연', '시', '그림', '인생', '지혜', '오디오북'],
    chapters: [
      { number: 1, title: '봄 — 새싹이 인사해요', startTime: 0, duration: 360 },
      { number: 2, title: '여름 — 초록 잎의 노래', startTime: 360, duration: 420 },
      { number: 3, title: '가을 — 단풍이 춤추어요', startTime: 780, duration: 390 },
      { number: 4, title: '겨울 — 나무의 겨울잠', startTime: 1170, duration: 380 },
      { number: 5, title: '다시 봄 — 새로운 시작', startTime: 1550, duration: 370 },
    ],
    isBest: true,
    curationCategory: '감성 성장',
  },
  {
    id: 'rabbit-forest-audio',
    title: '토끼의 마법 숲 탐험',
    subtitle: '용기를 배우는 동화',
    author: '김하늘',
    narrator: '박은혜',
    authorBio:
      '아이들의 상상력을 키워주는 동화 작가입니다. 10년간 아이들과 함께하며 수많은 동화를 써왔습니다.',
    publisher: '꿈나무출판',
    publishDate: '2025년 5월 20일',
    coverImage: '/assets/ebook/cover_rabbit.png',
    duration: '28분',
    totalSeconds: 1680,
    description:
      '겁이 많은 토끼 보름이가 마법의 숲에서 새로운 친구들을 만나며 용기를 찾아가는 이야기입니다. 반짝이는 버섯, 빛나는 반딧불이와 함께 숲의 비밀을 탐험하세요! 생생한 효과음과 다양한 캐릭터 음성이 숲 속 모험을 더욱 실감나게 만들어 줍니다.',
    shortDescription: '겁 많은 토끼가 마법 숲에서 용기를 찾는 모험 오디오 동화',
    targetAge: '5~9세',
    category: '동화',
    tags: ['모험', '용기', '우정', '숲', '동물', '오디오북'],
    chapters: [
      { number: 1, title: '겁쟁이 토끼 보름이', startTime: 0, duration: 320 },
      { number: 2, title: '마법 숲의 입구', startTime: 320, duration: 340 },
      { number: 3, title: '반짝이는 버섯 마을', startTime: 660, duration: 350 },
      { number: 4, title: '반딧불이 친구들', startTime: 1010, duration: 330 },
      { number: 5, title: '보름이의 용기', startTime: 1340, duration: 340 },
    ],
    isFeatured: true,
    curationCategory: '모험과 상상',
  },
  {
    id: 'dino-school-audio',
    title: '공룡 선생님의 즐거운 교실',
    subtitle: '숫자와 글자를 배워요',
    author: '박지현',
    narrator: '이정민',
    authorBio:
      '초등 교육 전문가이자 그림책 작가입니다. 아이들이 재미있게 배울 수 있는 교육 동화를 씁니다.',
    publisher: '학습나라',
    publishDate: '2025년 1월 10일',
    coverImage: '/assets/ebook/cover_dino.png',
    duration: '25분',
    totalSeconds: 1500,
    description:
      '친근한 공룡 선생님과 작은 동물 친구들이 함께 숫자와 글자를 배우는 교육 동화입니다. 놀이처럼 재미있게 기초 학습을 할 수 있어요! 따라 읽기 구간이 포함되어 아이가 직접 참여하며 학습할 수 있습니다.',
    shortDescription: '공룡 선생님과 함께하는 재미있는 참여형 학습 오디오북',
    targetAge: '4~7세',
    category: '교육',
    tags: ['교육', '숫자', '글자', '공룡', '학습', '오디오북'],
    chapters: [
      { number: 1, title: '공룡 선생님 안녕!', startTime: 0, duration: 280 },
      { number: 2, title: '하나 둘 셋, 숫자 놀이', startTime: 280, duration: 320 },
      { number: 3, title: 'ㄱ ㄴ ㄷ, 글자 놀이', startTime: 600, duration: 310 },
      { number: 4, title: '색깔 무지개', startTime: 910, duration: 300 },
      { number: 5, title: '우리 모두 잘했어요!', startTime: 1210, duration: 290 },
    ],
    isFeatured: true,
    curationCategory: '학습 동기',
  },
  {
    id: 'star-bear-audio',
    title: '별을 세는 곰',
    subtitle: '꿈꾸는 밤의 이야기',
    author: '최은별',
    narrator: '한지우',
    authorBio:
      '밤하늘과 꿈을 소재로 아이들에게 상상의 날개를 달아주는 작가입니다.',
    publisher: '별빛서재',
    publishDate: '2024년 11월 5일',
    coverImage: '/assets/ebook/cover_stars.png',
    duration: '30분',
    totalSeconds: 1800,
    description:
      '어린 아이와 친구 곰이 밤하늘의 별을 세며 우주의 신비를 경험하는 판타지 동화입니다. 별자리, 달빛, 은하수와 함께 꿈결같은 밤의 여행을 떠나보세요. 잔잔한 음악과 속삭이듯 부드러운 나레이션이 편안한 잠자리를 선물합니다.',
    shortDescription: '아이와 곰이 밤하늘의 별을 세며 떠나는 꿈결같은 오디오 여행',
    targetAge: '5~10세',
    category: '판타지',
    tags: ['별', '우주', '꿈', '밤', '판타지', '오디오북'],
    chapters: [
      { number: 1, title: '잠이 오지 않는 밤', startTime: 0, duration: 340 },
      { number: 2, title: '곰 친구를 만나다', startTime: 340, duration: 360 },
      { number: 3, title: '별자리 탐험', startTime: 700, duration: 380 },
      { number: 4, title: '은하수 건너기', startTime: 1080, duration: 370 },
      { number: 5, title: '가장 밝은 별', startTime: 1450, duration: 350 },
    ],
    curationCategory: '감성 성장',
  },
  {
    id: 'ocean-adventure-audio',
    title: '바다 속 보물찾기',
    subtitle: '신비로운 바닷속 대모험',
    author: '윤바다',
    narrator: '정하린',
    authorBio:
      '해양 생물을 사랑하는 작가이자 일러스트레이터입니다. 아이들에게 바다의 아름다움과 환경 보호를 알려줍니다.',
    publisher: '파도출판',
    publishDate: '2025년 7월 1일',
    coverImage: '/assets/ebook/cover_ocean.png',
    duration: '27분',
    totalSeconds: 1620,
    description:
      '귀여운 문어와 함께 바닷속 산호초, 보물상자, 해저 동굴을 탐험하는 모험 동화입니다. 다양한 해양 생물 친구들을 만나며 바다의 소중함을 배워요! 파도 소리와 수중 효과음이 실감나는 바닷속 세계로 안내합니다.',
    shortDescription: '귀여운 문어와 함께하는 신비로운 바닷속 오디오 모험',
    targetAge: '5~9세',
    category: '모험',
    tags: ['바다', '모험', '해양생물', '환경', '탐험', '오디오북'],
    chapters: [
      { number: 1, title: '문어 친구 뚜루', startTime: 0, duration: 300 },
      { number: 2, title: '산호초 마을', startTime: 300, duration: 330 },
      { number: 3, title: '해저 동굴의 비밀', startTime: 630, duration: 340 },
      { number: 4, title: '보물 상자를 찾아서', startTime: 970, duration: 330 },
      { number: 5, title: '진짜 보물은 우정', startTime: 1300, duration: 320 },
    ],
    curationCategory: '모험과 상상',
  },

  // ─── 오디오 전용 콘텐츠 (3권) ────────────────────────────────
  {
    id: 'emotion-friends-audio',
    title: '감정 친구들',
    subtitle: '내 마음을 알아가는 이야기',
    author: '서유리',
    narrator: '김나래',
    authorBio:
      '아동 심리 전문가이자 동화 작가입니다. 아이들이 자신의 감정을 이해하고 표현하도록 돕는 이야기를 씁니다. 다수의 교육 기관에서 감정 교육 프로그램을 운영하고 있습니다.',
    publisher: '마음출판',
    publishDate: '2025년 9월 1일',
    coverImage: '/assets/audiobook/cover_emotion.png',
    duration: '35분',
    totalSeconds: 2100,
    description:
      '기쁨이, 슬픔이, 화남이, 두려움이, 놀람이 — 다섯 감정 친구들이 아이의 하루를 함께합니다. 학교에서, 놀이터에서, 집에서 만나는 다양한 상황 속에서 자신의 감정을 알아차리고 건강하게 표현하는 방법을 배워요. 따뜻한 음악과 공감 가득한 나레이션이 아이의 마음을 토닥여 줍니다.',
    shortDescription: '다섯 감정 친구들과 함께 내 마음을 이해하는 감성 오디오북',
    targetAge: '5~10세',
    category: '감정교육',
    tags: ['감정', '사회성', '공감', '심리', '자기이해', '오디오북'],
    chapters: [
      { number: 1, title: '기쁨이를 만나요', startTime: 0, duration: 400 },
      { number: 2, title: '슬픔이의 눈물', startTime: 400, duration: 420 },
      { number: 3, title: '화남이와 심호흡', startTime: 820, duration: 440 },
      { number: 4, title: '두려움이의 용기', startTime: 1260, duration: 430 },
      { number: 5, title: '모든 감정은 소중해', startTime: 1690, duration: 410 },
    ],
    isBest: true,
    curationCategory: '사회성 향상',
  },
  {
    id: 'alphabet-train-audio',
    title: '한글 기차 여행',
    subtitle: 'ㄱ부터 ㅎ까지 신나는 한글 탐험',
    author: '민서진',
    narrator: '조은영',
    authorBio:
      '유아 한글 교육 전문가이며, 놀이와 이야기를 결합한 학습법으로 다수의 베스트셀러 교재를 집필했습니다.',
    publisher: '학습나라',
    publishDate: '2025년 8월 15일',
    coverImage: '/assets/audiobook/cover_alphabet.png',
    duration: '38분',
    totalSeconds: 2280,
    description:
      '칙칙폭폭! 한글 기차가 출발합니다. ㄱ역에서 기린을, ㄴ역에서 나비를 만나며 자음과 모음을 하나씩 배워가요. 따라 읽기 구간과 퀴즈가 포함되어 아이가 직접 참여하며 한글을 익힐 수 있습니다. 신나는 기차 효과음과 리듬감 있는 나레이션이 학습을 놀이처럼 즐겁게 만들어 줍니다.',
    shortDescription: '기차를 타고 떠나는 신나는 참여형 한글 학습 오디오북',
    targetAge: '4~7세',
    category: '교육',
    tags: ['한글', '학습', '자음', '모음', '교육', '오디오북'],
    chapters: [
      { number: 1, title: '한글 기차 출발!', startTime: 0, duration: 420 },
      { number: 2, title: 'ㄱ~ㅁ 역 탐험', startTime: 420, duration: 480 },
      { number: 3, title: 'ㅂ~ㅈ 역 탐험', startTime: 900, duration: 470 },
      { number: 4, title: 'ㅊ~ㅎ 역 탐험', startTime: 1370, duration: 460 },
      { number: 5, title: '한글 퀴즈 대회', startTime: 1830, duration: 450 },
    ],
    isFeatured: true,
    curationCategory: '학습 동기',
  },
  {
    id: 'cloud-dream-audio',
    title: '구름 위의 꿈',
    subtitle: '포근한 잠자리 동화',
    author: '한별',
    narrator: '윤서아',
    authorBio:
      '아이들의 편안한 잠자리를 위한 이야기를 쓰는 작가입니다. 부드러운 문체와 따뜻한 상상력으로 아이들을 꿈나라로 안내합니다.',
    publisher: '별빛서재',
    publishDate: '2025년 10월 1일',
    coverImage: '/assets/audiobook/cover_cloud.png',
    duration: '26분',
    totalSeconds: 1560,
    description:
      '솜사탕 같은 구름 위에서 펼쳐지는 포근한 잠자리 동화입니다. 달님의 자장가를 들으며 무지개 미끄럼틀을 타고, 별가루 이불을 덮고, 바람 요정의 이야기를 듣다 보면 어느새 꿈나라에 도착해요. ASMR 효과와 자장가 BGM이 어우러져 편안한 수면을 도와줍니다.',
    shortDescription: '구름 위에서 펼쳐지는 포근한 잠자리 오디오 동화',
    targetAge: '3~8세',
    category: '잠자리동화',
    tags: ['잠자리', '동화', '구름', '꿈', '수면', '오디오북'],
    chapters: [
      { number: 1, title: '구름 침대에 누우면', startTime: 0, duration: 380 },
      { number: 2, title: '달님의 자장가', startTime: 380, duration: 400 },
      { number: 3, title: '무지개 미끄럼틀', startTime: 780, duration: 390 },
      { number: 4, title: '꿈나라에 도착', startTime: 1170, duration: 390 },
    ],
    curationCategory: '감성 성장',
  },
];

// ─── 헬퍼 함수 ─────────────────────────────────────────────────

/** ID로 오디오북 검색 */
export function getAudiobookById(id: string): AudiobookData | undefined {
  return audiobooks.find((book) => book.id === id);
}

/** 베스트 오디오북 목록 */
export function getBestAudiobooks(): AudiobookData[] {
  return audiobooks.filter((book) => book.isBest);
}

/** 추천(Featured) 오디오북 목록 */
export function getFeaturedAudiobooks(): AudiobookData[] {
  return audiobooks.filter((book) => book.isFeatured);
}

/** 큐레이션 카테고리별 오디오북 목록 */
export function getAudiobooksByCuration(category: string): AudiobookData[] {
  return audiobooks.filter((book) => book.curationCategory === category);
}

/** 전체 큐레이션 카테고리 목록 (중복 제거) */
export function getAllCurationCategories(): string[] {
  const categories = audiobooks
    .map((book) => book.curationCategory)
    .filter((cat): cat is string => cat !== undefined);
  return [...new Set(categories)];
}

/** 초 단위를 MM:SS 형식의 문자열로 변환 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

