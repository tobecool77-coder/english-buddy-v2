// pages/api/chat.js

const LESSON_INFO = {
  '6-1':  { expr: 'What grade are you in? / I\'m in the [ordinal] grade.', questions: ['What grade are you in?'], alexAnswers: ["I'm in the fifth grade.", "I'm in the fourth grade.", "I'm in the sixth grade.", "I'm in the third grade."] },
  '6-2':  { expr: 'What season do you like? / I like [season].', questions: ['What season do you like?'], alexAnswers: ["I like spring.", "I like summer.", "I like fall.", "I like winter."] },
  '6-3':  { expr: 'When is your birthday? / It\'s on [month] [day].', questions: ['When is your birthday?'], alexAnswers: ["My birthday is on March 10th.", "My birthday is on June 5th.", "My birthday is on November 20th.", "My birthday is on August 3rd."] },
  '6-4':  { expr: 'Why are you happy? / Because [reason].', questions: ['Why are you happy?', 'Why are you excited?'], alexAnswers: ["Because I got a perfect score.", "Because I got new shoes.", "Because it's sunny today.", "Because I watched a fun movie."] },
  '6-5':  { expr: 'Where is [place]? / Go straight. Turn left/right.', questions: ['Where is the library?', 'Where is the school?'], alexAnswers: ["Go straight and turn left.", "It's next to the bank.", "Go straight two blocks and turn right.", "It's across from the school."] },
  '6-6':  { expr: 'What does she look like? / She has [hair]. She is wearing [clothes].', questions: ['What does she look like?', 'What does he look like?'], alexAnswers: ["She has short black hair.", "He has curly brown hair.", "She is wearing a red jacket.", "He is tall and has glasses."] },
  '6-7':  { expr: 'Can you come to [event]? / Sure, I can! / Sorry, I can\'t.', questions: ['Can you come to my party?', 'When is the festival?'], alexAnswers: ["Sure, I can come!", "Sorry, I can't come.", "It's on September 29th.", "It's on October 5th."] },
  '6-8':  { expr: '[A] is [adj]-er than [B].', questions: ['What is bigger than a dog?', 'What is faster than a bike?'], alexAnswers: ["The elephant is bigger than the dog.", "The cheetah is faster than the horse.", "The mountain is taller than the building.", "The rock is heavier than the ball."] },
  '6-9':  { expr: 'What are you going to do? / I\'m going to [verb].', questions: ['What are you going to do?', 'What are you going to do this weekend?'], alexAnswers: ["I'm going to go camping.", "I'm going to visit my grandma.", "I'm going to play soccer.", "I'm going to read a book."] },
  '6-10': { expr: 'How often do you [verb]? / I [verb] [frequency].', questions: ['How often do you eat vegetables?', 'How often do you exercise?'], alexAnswers: ["I eat vegetables every day.", "I exercise twice a week.", "I brush my teeth three times a day.", "I drink milk once a day."] },
  '6-11': { expr: 'Do you know anything about [topic]? / Yes! It\'s [description].', questions: ['Do you know anything about Tuho?', 'Do you know anything about Yut?'], alexAnswers: ["Yes! It's a Korean arrow-throwing game.", "No, I don't know.", "Yes! It's an Australian flying toy.", "Yes! It's a traditional Korean game."] },
  '6-12': { expr: 'We made a class album. / I made [object].', questions: ['What did you make?', 'What did you put in the album?'], alexAnswers: ["I made a photo book.", "I drew some pictures.", "I wrote a poem.", "I made a short video."] },
};

function detectGrammarError(text, lessonKey) {
  if (!text) return null;
  const lower = text.toLowerCase().trim();
  if (lessonKey === '6-1') {
    if (lower.match(/^i'm in (the )?(first|second|third|fourth|fifth|sixth) grade/)) return null;
    if (lower.match(/i in (the )?(first|second|third|fourth|fifth|sixth)/)) {
      const m = lower.match(/(first|second|third|fourth|fifth|sixth)/);
      return m ? `Oh, you're in the ${m[0]} grade!` : null;
    }
    if (lower.match(/i'm in a (first|second|third|fourth|fifth|sixth)/)) {
      const m = lower.match(/(first|second|third|fourth|fifth|sixth)/);
      return m ? `Oh, you're in the ${m[0]} grade!` : null;
    }
  }
  if (lessonKey === '6-2') {
    if (lower.match(/i likes? (spring|summer|fall|autumn|winter)/)) {
      const m = lower.match(/(spring|summer|fall|autumn|winter)/);
      return m ? `Oh, you like ${m[0]}!` : null;
    }
  }
  if (lessonKey === '6-9') {
    if (lower.match(/i going to|i will going/)) {
      const m = lower.match(/(?:going to|will going) (.+)/);
      return m ? `Oh, you're going to ${m[1]}!` : null;
    }
  }
  return null;
}

function getSystemInstruction(phase, lessonKey, lessonTitle) {
  if (phase === 'free') {
    return `You are Alex, a cheerful Korean elementary school student (age 11-12) chatting with a classmate in English.
You are a STUDENT, not a teacher or AI. Never say "I'm an AI" or "I'm a chatbot".

Rules:
- Write 1-2 complete sentences. Never stop mid-sentence.
- Always end with one question.
- Use simple words. React naturally: "Oh really?", "Me too!", "Cool.", "No way!"
- If student says bye/그만/stop → say a warm goodbye.
- No emoji. No Korean.`;
  }

  if (phase === 'smalltalk') {
    return `You are Alex, a cheerful Korean elementary school student (age 11-12) chatting with a classmate before English class.
You are a STUDENT, not a teacher or AI.

Rules:
- Write 1-2 complete sentences. Never stop mid-sentence.
- Always end with one simple question about daily life (food, weather, weekend, pets, etc).
- Do NOT mention any lesson or English practice yet.
- React naturally: "Oh!", "Cool.", "Me too!", "Really?"
- No emoji. No Korean.`;
  }

  // lesson
  const info = LESSON_INFO[lessonKey] || { expr: 'Practice English!', alexAnswers: ["I'm doing great!"] };
  const alexAnswer = info.alexAnswers[Math.floor(Math.random() * info.alexAnswers.length)];
  return `You are Alex, a cheerful Korean elementary school student (age 11-12) practicing English with a classmate.
You are a STUDENT, not a teacher or AI. Never say "I'm an AI" or "I'm a chatbot".

Today's lesson: "${lessonTitle}"
Key expression: ${info.expr}
Your own answer when asked: "${alexAnswer}"

Conversation pattern — follow this strictly:
1. You ask the key question.
2. Student answers.
3. You react briefly (1 word: "Oh!" / "Cool." / "Nice." / "Really?") + say "Now ask me!"
4. Student asks you.
5. You answer with: "${alexAnswer}" then ask the key question again.

Grammar correction rule:
- If student makes a grammar mistake, silently use the correct form in your reply.
- Example: Student says "I in sixth grade." → You say: "Oh, you're in the sixth grade! Now ask me!"
- Never explain the mistake. Never say "You should say..."

Rules:
- Write 1-2 complete sentences. Never stop mid-sentence.
- Always end with one question.
- Never praise with: "Great job!", "Wonderful!", "Amazing!", "Good question!"
- Short reactions only: "Oh!", "Cool.", "Nice.", "Really?", "Me too!"
- No emoji. No Korean.`;
}

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

  // ── FREE TALK ────────────────────────────────────────────────────────────
  if (phase === 'free') {
    // 최근 10턴만 사용
    const recentHistory = conversationHistory.slice(-10);
    const messages = recentHistory.map(t => ({
      role: t.speaker === 'AI' ? 'model' : 'user',
      parts: [{ text: t.text }]
    }));
    if (messages.length === 0 || messages[messages.length - 1].role === 'model') {
      messages.push({ role: 'user', parts: [{ text: '(continue)' }] });
    }
    // 직전 Alex 질문 추출 → 반복 금지
    const lastAlexText = [...recentHistory].reverse().find(t => t.speaker === 'AI')?.text || '';
    const prevQuestion = lastAlexText.match(/[^.!?]*\?/)?.[0]?.trim() || '';
    const freeSystem = `You are Alex, a cheerful Korean elementary school student (age 11-12) having a free English conversation.
You are a STUDENT, not a teacher or AI.

Rules:
- Write exactly 2 complete sentences. NEVER cut off mid-sentence.
- Always end with ONE question.
- NEVER ask: "${prevQuestion || 'nothing'}" — ask something completely different.
- Rotate topics every turn: sports → food → animals → school → hobbies → family → movies → games → travel → music → pets → back to sports.
- React like a kid: "Me too!", "No way!", "Really?", "Same here!", "Oh nice!"
- If student says bye/그만/stop → say a warm goodbye.
- No emoji. No Korean.`;
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: freeSystem }] },
            contents: messages,
            generationConfig: { temperature: 0.95, maxOutputTokens: 120, topP: 0.95 },
          }),
        }
      );
      const d = await resp.json();
      let text = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      text = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,'').trim();
      if (!text || text.length < 5 || !text.match(/[.!?]$/)) {
        const fallbacks = [
          "That sounds fun! What\'s your favorite animal?",
          "Oh nice! What do you do on weekends?",
          "Really? What\'s your favorite movie?",
          "Cool! Do you play any instruments?",
          "Same here! Where do you want to travel someday?",
        ];
        text = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      }
      return res.status(200).json({ success: true, text });
    } catch(e) {
      return res.status(200).json({ success: true, text: "That\'s cool! What\'s your favorite animal?" });
    }
  }

  // 스몰톡: 2번 후 레슨 전환
  if (phase === 'smalltalk') {
    const studentTurns = conversationHistory.filter(t => t.speaker === 'STUDENT').length;
    if (studentTurns >= 2) {
      const info = LESSON_INFO[lessonKey];
      const firstQ = info ? lessonKey === '6-1' ? 'What grade are you in?' :
                            lessonKey === '6-2' ? 'What season do you like?' :
                            lessonKey === '6-3' ? 'When is your birthday?' :
                            lessonKey === '6-4' ? 'Why are you happy today?' :
                            lessonKey === '6-5' ? 'Where is the library?' :
                            lessonKey === '6-6' ? 'What does your friend look like?' :
                            lessonKey === '6-7' ? 'Can you come to my birthday party?' :
                            lessonKey === '6-8' ? 'Is a whale bigger than a shark?' :
                            lessonKey === '6-9' ? 'What are you going to do this weekend?' :
                            lessonKey === '6-10' ? 'How often do you eat vegetables?' :
                            lessonKey === '6-11' ? 'Do you know anything about Tuho?' :
                            'What did you make for the class album?' : "Let's practice!";
      return res.status(200).json({
        success: true,
        text: `Okay! Let's practice now. ${firstQ}`
      });
    }
  }

  // ── LESSON: history 기반 코드 로직 ──────────────────────────────────────
  try {
    const info = LESSON_INFO[lessonKey];
    if (!info) return res.status(200).json({ success: true, text: "Let's practice! What did you learn?" });

    const lastAlex = [...conversationHistory].reverse().find(t => t.speaker === 'AI')?.text || '';
    const lastStudent = [...conversationHistory].reverse().find(t => t.speaker === 'STUDENT')?.text || '';
    const studentTurns = conversationHistory.filter(t => t.speaker === 'STUDENT').length;

    const correction = detectGrammarError(lastStudent, lessonKey);
    const justSaidNowAskMe = lastAlex.includes('Now ask me');

    let response;
    if (justSaidNowAskMe) {
      const myAnswer = info.alexAnswers[studentTurns % info.alexAnswers.length];
      const question = info.questions[studentTurns % info.questions.length];
      response = `${myAnswer} ${question}`;
    } else {
      const reactions = ['Oh!', 'Cool.', 'Nice.', 'Really?', 'Me too!', 'I see.'];
      const reaction = reactions[studentTurns % reactions.length];
      response = correction ? `${correction} Now ask me!` : `${reaction} Now ask me!`;
    }

    return res.status(200).json({ success: true, text: response });

  } catch (e) {
    console.error('Chat handler error:', e);
    return res.status(200).json({ success: false, text: "Sorry, please try again." });
  }
}
