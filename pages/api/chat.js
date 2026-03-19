// pages/api/chat.js
// Alex 응답을 코드로 고정 — Gemini는 스몰톡 + 문법교정만 담당

// ── 단원별 고정 대화 스크립트 ──────────────────────────────────────────────
// 각 단원: Alex가 할 질문들 + 본인 답변 목록
const LESSON_SCRIPTS = {
  '6-1': {
    alexAnswers: ["I'm in the fifth grade.", "I'm in the sixth grade.", "I'm in the fourth grade."],
    questions: ["What grade are you in?"],
    corrections: {
      // 학생이 틀리게 말했을 때 Alex가 자연스럽게 교정하는 패턴
      "i in": "Oh, you're in",
      "i'm in a": "Oh, you're in the",
      "i am in": "Oh, you're in the",
    }
  },
  '6-2': {
    alexAnswers: ["I like spring.", "I like summer.", "I like fall.", "I like winter."],
    questions: ["What season do you like?"],
  },
  '6-3': {
    alexAnswers: ["My birthday is on March 10th.", "My birthday is on June 5th.", "My birthday is on December 20th."],
    questions: ["When is your birthday?"],
  },
  '6-4': {
    alexAnswers: ["Because I got a perfect score.", "Because I got new shoes.", "Because it's sunny today.", "Because I watched a fun movie."],
    questions: ["Why are you happy?", "Why are you excited?", "Why are you sad?"],
  },
  '6-5': {
    alexAnswers: ["Go straight and turn left.", "It's next to the bank.", "Go straight two blocks.", "Turn right at the corner."],
    questions: ["Where is the library?", "Where is the school?", "Where is the park?"],
  },
  '6-6': {
    alexAnswers: ["She has short black hair.", "He has curly brown hair.", "She is wearing a red jacket.", "He is tall and has glasses."],
    questions: ["What does she look like?", "What does he look like?"],
  },
  '6-7': {
    alexAnswers: ["It's on September 29th.", "It's on October 5th.", "Sure, I can come!", "Sorry, I can't come."],
    questions: ["Can you come to the festival?", "When is the festival?"],
  },
  '6-8': {
    alexAnswers: ["The elephant is bigger than the dog.", "The cheetah is faster than the horse.", "The mountain is taller than the hill.", "The rock is heavier than the ball."],
    questions: ["What is bigger than a dog?", "What is faster than a bike?", "What is taller than a tree?"],
  },
  '6-9': {
    alexAnswers: ["I'm going to go camping.", "I'm going to visit my grandma.", "I'm going to play soccer.", "I'm going to read a book."],
    questions: ["What are you going to do?", "What are you going to do this weekend?"],
  },
  '6-10': {
    alexAnswers: ["I eat vegetables every day.", "I exercise twice a week.", "I brush my teeth three times a day.", "I drink milk once a day."],
    questions: ["How often do you eat vegetables?", "How often do you exercise?", "How often do you brush your teeth?"],
  },
  '6-11': {
    alexAnswers: ["Yes! It's a Korean arrow-throwing game.", "No, I don't know.", "Yes! It's an Australian flying toy.", "Yes! It's a traditional Korean game."],
    questions: ["Do you know anything about Tuho?", "Do you know anything about boomerangs?", "Do you know anything about Yut?"],
  },
  '6-12': {
    alexAnswers: ["I made a photo book.", "I drew some pictures.", "I wrote a poem.", "I made a short video."],
    questions: ["What did you make?", "What did you put in your album?"],
  },
};

// ── 스몰톡 주제 ────────────────────────────────────────────────────────────
const SMALLTALK_OPENERS = [
  "How are you today?",
  "What did you eat for lunch?",
  "Do you have any pets?",
  "What's your favorite food?",
  "Did you play outside today?",
];

// ── 대화 상태 추적 (서버리스라 history에서 파악) ──────────────────────────
function getLessonState(history, script) {
  // history에서 Alex가 몇 번 질문했는지, 지금 어느 단계인지 파악
  const alexTurns = history.filter(t => t.speaker === 'AI');
  const studentTurns = history.filter(t => t.speaker === 'STUDENT');
  const lastAlex = alexTurns[alexTurns.length - 1]?.text || '';
  const lastStudent = studentTurns[studentTurns.length - 1]?.text || '';

  const saidAskMe = lastAlex.includes('Now ask me');
  const totalExchanges = studentTurns.length;

  return { lastAlex, lastStudent, saidAskMe, totalExchanges };
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectGrammarError(text, lessonKey) {
  const lower = text.toLowerCase().trim();

  // 공통 오류 패턴
  if (lessonKey === '6-1') {
    if (lower.match(/i('m)? in (a |the )?(first|second|third|fourth|fifth|sixth|seventh)/)) {
      // 올바른 표현 — 교정 불필요
      return null;
    }
    if (lower.match(/i in (the )?(grade|first|second|third|fourth|fifth|sixth)/)) {
      const match = lower.match(/(first|second|third|fourth|fifth|sixth)/);
      const grade = match ? match[0] : 'sixth';
      return `Oh, you're in the ${grade} grade!`;
    }
    if (lower.match(/i'm in a (first|second|third|fourth|fifth|sixth)/)) {
      const match = lower.match(/(first|second|third|fourth|fifth|sixth)/);
      const grade = match ? match[0] : 'sixth';
      return `Oh, you're in the ${grade} grade!`;
    }
  }

  if (lessonKey === '6-2') {
    if (lower.match(/i like (spring|summer|fall|autumn|winter)/)) return null;
    if (lower.match(/i likes?/)) {
      const match = lower.match(/(spring|summer|fall|autumn|winter)/);
      const season = match ? match[0] : 'spring';
      return `Oh, you like ${season}!`;
    }
  }

  if (lessonKey === '6-9') {
    if (lower.match(/i('m)? going to/)) return null;
    if (lower.match(/i going to|i will going/)) {
      const match = lower.match(/going to (.+)/);
      const action = match ? match[1] : 'play';
      return `Oh, you're going to ${action}!`;
    }
  }

  return null; // 오류 없음
}

// ── Gemini 호출 (스몰톡 + 문법교정용) ──────────────────────────────────────
async function callGemini(prompt, apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 80, topP: 0.9 },
      }),
    }
  );
  if (!response.ok) return null;
  const data = await response.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  if (text) {
    // 이모지 제거
    text = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
  }
  return text;
}

// ── 메인 핸들러 ────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { conversationHistory, lessonKey, lessonTitle, round, phase } = req.body;
  if (!conversationHistory || !lessonKey) {
    return res.status(400).json({ success: false, text: 'Missing required fields' });
  }

  const PROFANITY = ['shit','fuck','damn','ass','bitch','crap','bastard'];
  const lastMsg = conversationHistory[conversationHistory.length - 1]?.text?.toLowerCase() || '';
  if (PROFANITY.some(w => lastMsg.includes(w))) {
    return res.status(200).json({ success: true, text: "I cannot understand that. Please try again." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  try {

    // ── FREE TALK: Gemini 사용 ────────────────────────────────────────────
    if (phase === 'free') {
      const history = conversationHistory.map(t =>
        `${t.speaker === 'AI' ? 'Alex' : 'Student'}: ${t.text}`
      ).join('\n');
      const prompt = `You are Alex, a friendly Korean elementary school student chatting in English.
Keep responses to 1-2 short complete sentences. Always end with one question.
React like a kid: "Oh really?", "Me too!", "Cool.", "No way!"
If student says bye or 그만 → say goodbye warmly.
No emoji. No Korean.

Conversation so far:
${history}
Alex:`;
      const text = await callGemini(prompt, apiKey);
      return res.status(200).json({ success: true, text: text || "That's cool! What else do you like?" });
    }

    // ── SMALLTALK: Gemini 사용 ────────────────────────────────────────────
    if (phase === 'smalltalk') {
      const history = conversationHistory.map(t =>
        `${t.speaker === 'AI' ? 'Alex' : 'Student'}: ${t.text}`
      ).join('\n');
      const studentTurns = conversationHistory.filter(t => t.speaker === 'STUDENT').length;

      // 2번째 학생 답변 이후 → 레슨으로 전환 멘트
      if (studentTurns >= 2) {
        const script = LESSON_SCRIPTS[lessonKey];
        const firstQ = script ? script.questions[0] : "Let's practice!";
        const transitions = [
          `Nice! Okay, let's practice English now. ${firstQ}`,
          `Cool! Let's practice now. ${firstQ}`,
          `Me too! Time to practice! ${firstQ}`,
        ];
        return res.status(200).json({ success: true, text: pickRandom(transitions) });
      }

      const prompt = `You are Alex, a Korean elementary school student chatting before English class.
Have a casual chat. 1-2 short complete sentences. End with one simple question about daily life.
No lesson topics yet. No emoji. No Korean.
React like a kid: "Oh!", "Cool.", "Me too!", "Really?"

Conversation so far:
${history}
Alex:`;
      const text = await callGemini(prompt, apiKey);
      const opener = pickRandom(SMALLTALK_OPENERS);
      return res.status(200).json({ success: true, text: text || `Me too! ${opener}` });
    }

    // ── LESSON: 코드로 완전 고정 ─────────────────────────────────────────
    const script = LESSON_SCRIPTS[lessonKey];
    if (!script) {
      return res.status(200).json({ success: true, text: "Let's practice! What did you learn today?" });
    }

    const { lastAlex, lastStudent, saidAskMe, totalExchanges } = getLessonState(conversationHistory, script);

    // 문법 오류 체크
    const correction = detectGrammarError(lastStudent, lessonKey);

    // 대화 흐름 결정
    let responseText = '';

    if (saidAskMe) {
      // 학생이 Alex한테 물어봤음 → Alex가 학생처럼 답하고 다시 질문
      const myAnswer = pickRandom(script.alexAnswers);
      const nextQ = script.questions[totalExchanges % script.questions.length];
      responseText = `${myAnswer} ${nextQ}`;

    } else {
      // 학생이 Alex 질문에 답했음 → 교정(있으면) + "Now ask me!"
      if (correction) {
        responseText = `${correction} Now ask me!`;
      } else {
        // 짧은 반응 + Now ask me
        const reactions = ["Oh!", "Cool.", "Me too!", "Really?", "Nice.", "I see."];
        const reaction = pickRandom(reactions);
        responseText = `${reaction} Now ask me!`;
      }
    }

    return res.status(200).json({ success: true, text: responseText });

  } catch (e) {
    console.error('Chat handler error:', e);
    return res.status(200).json({ success: false, text: "Sorry, please try again." });
  }
}
