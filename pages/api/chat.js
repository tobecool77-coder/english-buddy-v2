// pages/api/chat.js

const LESSON_INFO = {
  '6-1':  { expr: 'What grade are you in? / I\'m in the [ordinal] grade.', alexAnswer: "I'm in the fifth grade." },
  '6-2':  { expr: 'What season do you like? / I like [season].', alexAnswer: "I like spring." },
  '6-3':  { expr: 'When is your birthday? / It\'s on [month] [day].', alexAnswer: "My birthday is on March 10th." },
  '6-4':  { expr: 'Why are you happy? / Because [reason].', alexAnswer: "Because I got a perfect score." },
  '6-5':  { expr: 'Where is [place]? / Go straight. Turn left/right.', alexAnswer: "Go straight and turn left." },
  '6-6':  { expr: 'What does she look like? / She has [hair]. She is wearing [clothes].', alexAnswer: "She has short black hair." },
  '6-7':  { expr: 'Can you come to [event]? / Sure, I can! / Sorry, I can\'t.', alexAnswer: "It's on September 29th." },
  '6-8':  { expr: '[A] is [adj]-er than [B].', alexAnswer: "The elephant is bigger than the dog." },
  '6-9':  { expr: 'What are you going to do? / I\'m going to [verb].', alexAnswer: "I'm going to go camping." },
  '6-10': { expr: 'How often do you [verb]? / I [verb] [frequency].', alexAnswer: "I eat vegetables every day." },
  '6-11': { expr: 'Do you know anything about [topic]? / Yes! It\'s [description].', alexAnswer: "Yes! It's a Korean arrow-throwing game." },
  '6-12': { expr: 'We made a class album. / I made [object].', alexAnswer: "I made a photo book." },
};

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
  const info = LESSON_INFO[lessonKey] || { expr: 'Practice English!', alexAnswer: "I'm doing great!" };
  return `You are Alex, a cheerful Korean elementary school student (age 11-12) practicing English with a classmate.
You are a STUDENT, not a teacher or AI. Never say "I'm an AI" or "I'm a chatbot".

Today's lesson: "${lessonTitle}"
Key expression: ${info.expr}
Your own answer when asked: "${info.alexAnswer}"

Conversation pattern — follow this strictly:
1. You ask the key question.
2. Student answers.
3. You react briefly (1 word: "Oh!" / "Cool." / "Nice." / "Really?") + say "Now ask me!"
4. Student asks you.
5. You answer with: "${info.alexAnswer}" then ask the key question again.

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

  try {
    const systemInstruction = getSystemInstruction(phase || 'lesson', lessonKey, lessonTitle);

    // Gemini API - systemInstruction 필드 분리 사용 (더 안정적)
    const messages = conversationHistory.map(t => ({
      role: t.speaker === 'AI' ? 'model' : 'user',
      parts: [{ text: t.text }]
    }));

    // 대화가 없으면 빈 user 메시지 추가 (Gemini 요구사항)
    if (messages.length === 0 || messages[messages.length - 1].role === 'model') {
      messages.push({ role: 'user', parts: [{ text: '(start)' }] });
    }

    const body = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: messages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 150,
        topP: 0.9,
        stopSequences: ['\n\n'],  // 불필요한 긴 출력 방지
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_LOW_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_LOW_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
      ],
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return res.status(200).json({ success: false, text: "Sorry, can you try again?" });
    }

    const data = await response.json();

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      let text = data.candidates[0].content.parts[0].text.trim();
      // 이모지 제거
      text = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
      // 불완전한 문장 체크 (마침표/물음표/느낌표로 끝나지 않으면 fallback)
      if (text.length < 5 || (!text.match(/[.!?]$/) && text.length < 20)) {
        console.warn('Incomplete response:', text);
        const info = LESSON_INFO[lessonKey];
        const fallbacks = {
          lesson: `Now ask me! ${info?.alexAnswer || "I'm doing great."}`,
          smalltalk: "Me too! What's your favorite food?",
          free: "Oh really! What else do you like?",
        };
        return res.status(200).json({ success: true, text: fallbacks[phase] || fallbacks.lesson });
      }
      return res.status(200).json({ success: true, text });
    }

    if (data.candidates?.[0]?.finishReason === 'SAFETY') {
      return res.status(200).json({ success: true, text: "I cannot understand that. Please try again." });
    }

    return res.status(200).json({ success: false, text: "Sorry, can you try again?" });

  } catch (e) {
    console.error('Chat handler error:', e);
    return res.status(200).json({ success: false, text: "Sorry, please try again." });
  }
}
