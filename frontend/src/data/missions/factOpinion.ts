import { LearningMission } from "@/types/learningMission";

// M02-1 [🌱 시작] 버스 도착 시간과 느낌 구별
export const factOpinionMission: LearningMission = {
  id: "fact_opinion_bus_01",
  title: "사실일까? 생각일까?",
  subtitle: "진짜 사실과 마음의 생각을 구별하기",
  icon: "⚖️",
  skill: "fact_opinion",
  difficulty: 1, // 🌱 시작
  gradeBand: "3-4",
  lifeArea: "transport",
  location: "bus_stop",
  xp: 50,
  curriculum: {
    grade: 3,
    subject: "국어",
    unit: "사실과 의견",
    competency: "문장에서 사실과 의견 구별하기",
  },
  steps: [
    {
      stepId: "step_1",
      title: "1단계. 버스 안내 문장 구별",
      sceneSpeaker: "안내 방송",
      sceneIcon: "📢",
      sceneText: "안내 방송에서 \"23번 버스가 5분 뒤에 옵니다.\"라고 말해요.",
      question: "이 말은 사실일까요, 생각일까요?",
      choices: [
        {
          id: "c1",
          text: "사실 (눈과 귀로 확인되는 것)",
          icon: "📌",
          correct: true,
          reason: "도착 시간은 실제로 확인되는 객관적인 사실이에요.",
        },
        {
          id: "c2",
          text: "생각 (개인의 느낌과 의견)",
          icon: "💭",
          correct: false,
          reason: "개인의 기분이나 느낌이 아니라 객관적인 정보예요.",
        },
      ],
      hint: "실제로 일어난 일인지, 내 기분인지 생각해 보세요.",
      correctFeedback: "정답이에요! 실제로 일어난 일이나 정보는 '사실'이에요.",
      wrongFeedback: "다시 한번 살펴봐요. 실제로 확인할 수 있는 안내 정보는 사실이에요.",
    },
    {
      stepId: "step_2",
      title: "2단계. 한 번 더! 친구의 말 구별",
      sceneSpeaker: "친구",
      sceneIcon: "👦",
      sceneText: "옆에 서 있는 친구가 \"23번 버스가 제일 멋져요.\"라고 말해요.",
      question: "이 말은 사실일까요, 생각일까요?",
      choices: [
        {
          id: "c1",
          text: "사실 (눈과 귀로 확인되는 것)",
          icon: "📌",
          correct: false,
          reason: "멋지다는 것은 사람마다 다르게 느낄 수 있어요.",
        },
        {
          id: "c2",
          text: "생각 (개인의 느낌과 의견)",
          icon: "💭",
          correct: true,
          reason: "'멋지다'는 친구의 마음에서 나온 생각(의견)이에요.",
        },
      ],
      hint: "'멋지다'는 사람마다 다르게 생각할 수 있는 마음의 느낌이에요.",
      correctFeedback: "정말 잘했어요! 각자의 느낌이나 기분은 '생각(의견)'이에요.",
      wrongFeedback: "다시 한번 생각해 봐요. 사람마다 다르게 느낄 수 있는 것은 생각이에요.",
    },
  ],
  takeaway: "눈으로 확인되는 것은 사실, 사람마다 다른 느낌은 생각이에요.",
};

// M02-2 [🌿 도전] 식당 음식 후기에서 사실 찾기
export const factOpinionMission2: LearningMission = {
  id: "fact_opinion_food_review_02",
  title: "식당 후기에서 사실 찾기",
  subtitle: "메뉴 정보(사실)와 맛 평가(생각) 구별",
  icon: "🍔",
  skill: "fact_opinion",
  difficulty: 2, // 🌿 도전
  gradeBand: "4-5",
  lifeArea: "shopping",
  location: "fastfood",
  xp: 70,
  curriculum: {
    grade: 4,
    subject: "국어",
    unit: "사실과 의견을 구별해요",
    competency: "광고/리뷰 글에서 객관적 사실 선별",
  },
  steps: [
    {
      stepId: "step_1",
      title: "1단계. 메뉴판 설명 구별",
      sceneSpeaker: "식당 메뉴판",
      sceneIcon: "🍟",
      sceneText: "메뉴판에 \"불고기버거 세트 가격은 5,500원이며 감자튀김과 음료가 함께 나옵니다.\"라고 적혀 있어요.",
      question: "이 문장은 '사실'일까요, '생각'일까요?",
      choices: [
        {
          id: "c1",
          text: "사실 (실제 가격과 구성)",
          icon: "📌",
          correct: true,
          reason: "가격과 세트 구성은 눈으로 직접 확인할 수 있는 확실한 사실이에요.",
        },
        {
          id: "c2",
          text: "생각 (개인의 느낌)",
          icon: "💭",
          correct: false,
          reason: "기분이나 느낌이 아니라 판매 조건에 대한 객관적 사실이에요.",
        },
      ],
      hint: "실제 가격표에 적힌 내용인지 생각해 보세요.",
      correctFeedback: "정답이에요! 금액과 메뉴 구성 정보는 확실한 '사실'이에요.",
      wrongFeedback: "다시 살펴봐요. 실제로 확인할 수 있는 가격 정보는 사실이에요.",
    },
    {
      stepId: "step_2",
      title: "2단계. 한 번 더! 손님 후기 구별",
      sceneSpeaker: "어떤 손님의 리뷰",
      sceneIcon: "✍️",
      sceneText: "손님이 인터넷에 \"이 가게 감자튀김이 세상에서 가장 바삭하고 맛있어요!\"라고 적었어요.",
      question: "이 문장은 '사실'일까요, '생각(의견)'일까요?",
      choices: [
        {
          id: "c1",
          text: "사실 (모두에게 똑같은 것)",
          icon: "📌",
          correct: false,
          reason: "맛은 사람마다 다르게 느낄 수 있어요.",
        },
        {
          id: "c2",
          text: "생각 (손님 개인의 입맛과 느낌)",
          icon: "💭",
          correct: true,
          reason: "'가장 맛있다'는 손님 개인의 입맛에 따른 생각(의견)이에요.",
        },
      ],
      hint: "다른 사람에게는 조금 덜 바삭할 수도 있는지 떠올려 보세요.",
      correctFeedback: "참 잘했어요! 맛이나 평가는 사람마다 다를 수 있는 '생각'이에요.",
      wrongFeedback: "괜찮아요. 각자의 입맛과 느낌은 생각(의견)에 해당해요.",
    },
  ],
  takeaway: "상품의 가격·구성은 사실이고, 맛과 느낌은 개인의 생각이에요.",
};

// M02-3 [🌳 성장] 도서관 안내문에서 사실과 주장 구별
export const factOpinionMission3: LearningMission = {
  id: "fact_opinion_news_article_03",
  title: "마을 도서관 안내문 구별하기",
  subtitle: "운영 규칙(사실)과 홍보 문구(주장) 구별",
  icon: "📚",
  skill: "fact_opinion",
  difficulty: 3, // 🌳 성장
  gradeBand: "5-6",
  lifeArea: "school",
  location: "school",
  xp: 90,
  curriculum: {
    grade: 5,
    subject: "국어",
    unit: "글쓴이의 관점과 의견",
    competency: "공공 안내문에서 객관적 사실과 주장 분리",
  },
  steps: [
    {
      stepId: "step_1",
      title: "1단계. 휴관일 안내 문장",
      sceneSpeaker: "도서관 게시판",
      sceneIcon: "📋",
      sceneText: "도서관 게시판에 \"마을 도서관은 매주 월요일과 공휴일에 문을 닫습니다.\"라고 적혀 있어요.",
      question: "이 문장은 무엇에 해당할까요?",
      choices: [
        {
          id: "c1",
          text: "사실 (정해진 도서관 운영 규칙)",
          icon: "📌",
          correct: true,
          reason: "휴관일은 실제로 정해진 규칙이자 변하지 않는 사실이에요.",
        },
        {
          id: "c2",
          text: "의견 (개인의 바람)",
          icon: "💭",
          correct: false,
          reason: "개인의 생각이 아니라 공식적인 규칙 사실이에요.",
        },
      ],
      hint: "달력에서 실제로 확인 가능한 운영 일정인지 보세요.",
      correctFeedback: "정답이에요! 공식적으로 정해진 운영 일자는 '사실'이에요.",
      wrongFeedback: "다시 읽어보세요. 도서관이 문을 닫는 날짜는 객관적 사실이에요.",
    },
    {
      stepId: "step_2",
      title: "2단계. 한 번 더! 도서관 표어 구별",
      sceneSpeaker: "도서관 관장님",
      sceneIcon: "🌟",
      sceneText: "관장님이 \"모든 어린이는 매일 책을 1권씩 읽어야 합니다.\"라고 말씀하셨어요.",
      question: "이 말은 '사실'일까요, '의견(주장)'일까요?",
      choices: [
        {
          id: "c1",
          text: "사실 (이미 일어난 일)",
          icon: "📌",
          correct: false,
          reason: "모든 어린이가 매일 읽고 있는 실제 사실이 아니에요.",
        },
        {
          id: "c2",
          text: "의견/주장 (그렇게 하기를 바라는 마음)",
          icon: "💡",
          correct: true,
          reason: "관장님이 어린이들에게 권하고 바라는 생각(주장)이에요.",
        },
      ],
      hint: "'~해야 합니다'는 글쓴이의 바람이나 주장을 나타내요.",
      correctFeedback: "훌륭해요! '~해야 한다'는 글쓴이나 말하는 사람의 생각(주장)이에요.",
      wrongFeedback: "다시 생각해 봐요. 무엇을 권유하거나 바라는 것은 의견(주장)이에요.",
    },
  ],
  takeaway: "정해진 규칙과 일정은 사실이고, 권유하거나 바라는 것은 의견(주장)이에요.",
};
