export interface BookChapter {
  number: number;
  title: string;
  page: number;
}

export interface BookData {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  authorBio: string;
  publisher: string;
  publishDate: string;
  isbn: string;
  coverImage: string;
  pdfPath: string;
  description: string;
  shortDescription: string;
  targetAge: string;
  pages: number;
  category: string;
  tags: string[];
  chapters: BookChapter[];
  copyrightInfo: {
    publisher: string;
    publishDate: string;
    isbn: string;
    copyright: string;
    address: string;
    contact: string;
    note: string;
  };
  isBest?: boolean;
  isFeatured?: boolean;
}

export const books: BookData[] = [
  {
    id: 'tree-life-story',
    title: '나무가 들려주는 인생 이야기',
    subtitle: '시화집 : 나무, 시와 그림을 품다',
    author: '이수진',
    authorBio:
      '글과 그림을 함께 쓰는 작가입니다. 자연 속에서 아이들에게 따뜻한 이야기를 전합니다. 나무, 꽃, 바람이 가르쳐 주는 삶의 지혜를 그림과 시로 표현합니다.',
    publisher: '아트앤컬쳐',
    publishDate: '2025년 3월 15일',
    isbn: '979-11-XXXXX-XX-X',
    coverImage: '/assets/ebook/cover_tree.png',
    pdfPath: '/assets/ebook/tree-life-story.pdf',
    description:
      '나무가 들려주는 인생 이야기는 아이들에게 자연의 지혜를 전하는 시화집입니다. 계절마다 변하는 나무의 모습을 통해 삶의 의미를 이야기합니다. 봄에 피어나는 새싹처럼 희망을, 여름의 푸른 잎처럼 성장을, 가을의 단풍처럼 변화의 아름다움을, 겨울의 앙상한 가지처럼 인내를 배울 수 있습니다.',
    shortDescription: '나무의 사계절을 통해 삶의 지혜를 배우는 따뜻한 시화집',
    targetAge: '7~12세',
    pages: 48,
    category: '시화집',
    tags: ['자연', '시', '그림', '인생', '지혜'],
    chapters: [
      { number: 1, title: '봄 — 새싹이 인사해요', page: 5 },
      { number: 2, title: '여름 — 초록 잎의 노래', page: 13 },
      { number: 3, title: '가을 — 단풍이 춤추어요', page: 23 },
      { number: 4, title: '겨울 — 나무의 겨울잠', page: 33 },
      { number: 5, title: '다시 봄 — 새로운 시작', page: 43 },
    ],
    copyrightInfo: {
      publisher: '아트앤컬쳐',
      publishDate: '2025년 3월 15일 초판 1쇄 발행',
      isbn: '979-11-XXXXX-XX-X',
      copyright: '© 2025 이수진 & 아트앤컬쳐. All rights reserved.',
      address: '서울특별시 종로구 삼청로 OO',
      contact: 'art@artculture.kr | 02-XXXX-XXXX',
      note: '이 책의 무단 복제·전재·배포를 금합니다.',
    },
    isBest: true,
    isFeatured: true,
  },
  {
    id: 'rabbit-forest',
    title: '토끼의 마법 숲 탐험',
    subtitle: '용기를 배우는 동화',
    author: '김하늘',
    authorBio:
      '아이들의 상상력을 키워주는 동화 작가입니다. 10년간 아이들과 함께하며 수많은 동화를 써왔습니다.',
    publisher: '꿈나무출판',
    publishDate: '2025년 5월 20일',
    isbn: '979-11-XXXXX-XX-X',
    coverImage: '/assets/ebook/cover_rabbit.png',
    pdfPath: '/assets/ebook/rabbit-forest.pdf',
    description:
      '겁이 많은 토끼 보름이가 마법의 숲에서 새로운 친구들을 만나며 용기를 찾아가는 이야기입니다. 반짝이는 버섯, 빛나는 반딧불이와 함께 숲의 비밀을 탐험하세요!',
    shortDescription: '겁 많은 토끼가 마법 숲에서 용기를 찾아가는 모험 동화',
    targetAge: '5~9세',
    pages: 36,
    category: '동화',
    tags: ['모험', '용기', '우정', '숲', '동물'],
    chapters: [
      { number: 1, title: '겁쟁이 토끼 보름이', page: 3 },
      { number: 2, title: '마법 숲의 입구', page: 9 },
      { number: 3, title: '반짝이는 버섯 마을', page: 15 },
      { number: 4, title: '반딧불이 친구들', page: 21 },
      { number: 5, title: '보름이의 용기', page: 29 },
    ],
    copyrightInfo: {
      publisher: '꿈나무출판',
      publishDate: '2025년 5월 20일 초판 1쇄 발행',
      isbn: '979-11-XXXXX-XX-X',
      copyright: '© 2025 김하늘 & 꿈나무출판. All rights reserved.',
      address: '서울특별시 마포구 합정동 OO',
      contact: 'dream@dreampub.kr | 02-XXXX-XXXX',
      note: '이 책의 무단 복제·전재·배포를 금합니다.',
    },
    isFeatured: true,
  },
  {
    id: 'dino-school',
    title: '공룡 선생님의 즐거운 교실',
    subtitle: '숫자와 글자를 배워요',
    author: '박지현',
    authorBio:
      '초등 교육 전문가이자 그림책 작가입니다. 아이들이 재미있게 배울 수 있는 교육 동화를 씁니다.',
    publisher: '학습나라',
    publishDate: '2025년 1월 10일',
    isbn: '979-11-XXXXX-XX-X',
    coverImage: '/assets/ebook/cover_dino.png',
    pdfPath: '/assets/ebook/dino-school.pdf',
    description:
      '친근한 공룡 선생님과 작은 동물 친구들이 함께 숫자와 글자를 배우는 교육 동화입니다. 놀이처럼 재미있게 기초 학습을 할 수 있어요!',
    shortDescription: '공룡 선생님과 함께하는 재미있는 숫자·글자 학습 동화',
    targetAge: '4~7세',
    pages: 32,
    category: '교육',
    tags: ['교육', '숫자', '글자', '공룡', '학습'],
    chapters: [
      { number: 1, title: '공룡 선생님 안녕!', page: 3 },
      { number: 2, title: '하나 둘 셋, 숫자 놀이', page: 9 },
      { number: 3, title: 'ㄱ ㄴ ㄷ, 글자 놀이', page: 15 },
      { number: 4, title: '색깔 무지개', page: 23 },
      { number: 5, title: '우리 모두 잘했어요!', page: 29 },
    ],
    copyrightInfo: {
      publisher: '학습나라',
      publishDate: '2025년 1월 10일 초판 1쇄 발행',
      isbn: '979-11-XXXXX-XX-X',
      copyright: '© 2025 박지현 & 학습나라. All rights reserved.',
      address: '경기도 성남시 분당구 OO',
      contact: 'learn@learnnara.kr | 031-XXXX-XXXX',
      note: '이 책의 무단 복제·전재·배포를 금합니다.',
    },
    isFeatured: true,
  },
  {
    id: 'star-bear',
    title: '별을 세는 곰',
    subtitle: '꿈꾸는 밤의 이야기',
    author: '최은별',
    authorBio:
      '밤하늘과 꿈을 소재로 아이들에게 상상의 날개를 달아주는 작가입니다.',
    publisher: '별빛서재',
    publishDate: '2024년 11월 5일',
    isbn: '979-11-XXXXX-XX-X',
    coverImage: '/assets/ebook/cover_stars.png',
    pdfPath: '/assets/ebook/star-bear.pdf',
    description:
      '어린 아이와 친구 곰이 밤하늘의 별을 세며 우주의 신비를 경험하는 판타지 동화입니다. 별자리, 달빛, 은하수와 함께 꿈결같은 밤의 여행을 떠나보세요.',
    shortDescription: '아이와 곰이 밤하늘의 별을 세며 떠나는 꿈결같은 여행',
    targetAge: '5~10세',
    pages: 40,
    category: '판타지',
    tags: ['별', '우주', '꿈', '밤', '판타지'],
    chapters: [
      { number: 1, title: '잠이 오지 않는 밤', page: 3 },
      { number: 2, title: '곰 친구를 만나다', page: 9 },
      { number: 3, title: '별자리 탐험', page: 17 },
      { number: 4, title: '은하수 건너기', page: 27 },
      { number: 5, title: '가장 밝은 별', page: 35 },
    ],
    copyrightInfo: {
      publisher: '별빛서재',
      publishDate: '2024년 11월 5일 초판 1쇄 발행',
      isbn: '979-11-XXXXX-XX-X',
      copyright: '© 2024 최은별 & 별빛서재. All rights reserved.',
      address: '서울특별시 강남구 역삼동 OO',
      contact: 'star@starbook.kr | 02-XXXX-XXXX',
      note: '이 책의 무단 복제·전재·배포를 금합니다.',
    },
  },
  {
    id: 'ocean-adventure',
    title: '바다 속 보물찾기',
    subtitle: '신비로운 바닷속 대모험',
    author: '윤바다',
    authorBio:
      '해양 생물을 사랑하는 작가이자 일러스트레이터입니다. 아이들에게 바다의 아름다움과 환경 보호를 알려줍니다.',
    publisher: '파도출판',
    publishDate: '2025년 7월 1일',
    isbn: '979-11-XXXXX-XX-X',
    coverImage: '/assets/ebook/cover_ocean.png',
    pdfPath: '/assets/ebook/ocean-adventure.pdf',
    description:
      '귀여운 문어와 함께 바닷속 산호초, 보물상자, 해저 동굴을 탐험하는 모험 동화입니다. 다양한 해양 생물 친구들을 만나며 바다의 소중함을 배워요!',
    shortDescription: '귀여운 문어와 함께하는 신비로운 바닷속 보물찾기 모험',
    targetAge: '5~9세',
    pages: 36,
    category: '모험',
    tags: ['바다', '모험', '해양생물', '환경', '탐험'],
    chapters: [
      { number: 1, title: '문어 친구 뚜루', page: 3 },
      { number: 2, title: '산호초 마을', page: 9 },
      { number: 3, title: '해저 동굴의 비밀', page: 15 },
      { number: 4, title: '보물 상자를 찾아서', page: 23 },
      { number: 5, title: '진짜 보물은 우정', page: 31 },
    ],
    copyrightInfo: {
      publisher: '파도출판',
      publishDate: '2025년 7월 1일 초판 1쇄 발행',
      isbn: '979-11-XXXXX-XX-X',
      copyright: '© 2025 윤바다 & 파도출판. All rights reserved.',
      address: '부산광역시 해운대구 OO',
      contact: 'wave@wavepub.kr | 051-XXXX-XXXX',
      note: '이 책의 무단 복제·전재·배포를 금합니다.',
    },
  },
];

export function getBookById(id: string): BookData | undefined {
  return books.find((book) => book.id === id);
}

export function getBestBooks(): BookData[] {
  return books.filter((book) => book.isBest);
}

export function getFeaturedBooks(): BookData[] {
  return books.filter((book) => book.isFeatured);
}
