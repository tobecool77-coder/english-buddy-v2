// pages/api/chat.js

// ── 단원별 핵심 표현 & 대화 패턴 ──────────────────────────────────────────
// few-shot을 별도 배열로 쓰지 않고, system prompt 안의 예시 대화로 완전히 통합
// Alex는 항상 "학생 캐릭터"처럼 답함 — AI / chatbot 발언 절대 금지

const LESSON_META = {
  '5-1': {
    topic: 'countries and origins',
    keyExpression: 'Where are you from? / I\'m from [country].',
    example: `Alex: Where are you from?
Student: I'm from Korea.
Alex: Oh nice! I'm from Canada. Where is your friend from?
Student: She is from Japan.
Alex: Japan! Cool. Is she good at origami?`,
  },
  '5-2': {
    topic: 'identifying objects (these/those)',
    keyExpression: 'What are these? / They are [objects].',
    example: `Alex: Look at my desk. What are these?
Student: They are pencils.
Alex: Right! And what are those over there?
Student: Those are scissors.
Alex: Yes! Are they yours?`,
  },
  '5-3': {
    topic: 'asking permission (Can I ...?)',
    keyExpression: 'Can I [verb]? / Yes, you can. / No, you can\'t.',
    example: `Alex: Can I borrow your eraser?
Student: Yes, you can.
Alex: Thanks! Can I sit here?
Student: No, you can't.
Alex: Oh, is someone sitting there?`,
  },
  '5-4': {
    topic: 'possessives (Whose ... is this?)',
    keyExpression: 'Whose [noun] is this? / It\'s [name]\'s.',
    example: `Alex: Whose pencil case is this?
Student: It's Mia's.
Alex: Oh, it's Mia's. Whose bag is that?
Student: It's mine.
Alex: Lucky! It looks cool.`,
  },
  '5-5': {
    topic: 'making suggestions (Let\'s ...)',
    keyExpression: 'Let\'s [verb]! / Sounds good! / Sorry, but I\'m busy.',
    example: `Alex: Let's go to the park!
Student: Sounds good!
Alex: Let's play basketball there.
Student: Sorry, but I'm busy today.
Alex: That's okay. What are you doing?`,
  },
  '5-6': {
    topic: 'future plans (will)',
    keyExpression: 'What will you do this summer? / I\'ll [verb].',
    example: `Alex: What will you do this summer?
Student: I'll go to the beach.
Alex: Nice! I'll visit my grandpa. Will you swim at the beach?
Student: Yes, I will.
Alex: Sounds fun! Will you eat seafood there?`,
  },
  '5-7': {
    topic: 'past tense (went, visited, played)',
    keyExpression: 'What did you do? / I [past verb] ...',
    example: `Alex: What did you do last weekend?
Student: I went to a festival.
Alex: Cool! I visited my grandma. What did you eat at the festival?
Student: I ate tteokbokki.
Alex: Yum! Did you play any games there?`,
  },
  '5-8': {
    topic: 'ordering food (would like)',
    keyExpression: 'What would you like? / I\'d like [food].',
    example: `Alex: What would you like to eat?
Student: I'd like a hamburger.
Alex: Sounds good! I'd like pizza. What would you like to drink?
Student: I'd like orange juice.
Alex: Me too! Do you like spicy food?`,
  },
  '5-9': {
    topic: 'prices and shopping',
    keyExpression: 'How much are [item]? / They are [price] won.',
    example: `Alex: How much are these shoes?
Student: They are fifty thousand won.
Alex: Wow, that's expensive! How much are those gloves?
Student: They are ten thousand won.
Alex: That's cheap! Do you like shopping?`,
  },
  '5-10': {
    topic: 'daily schedule and time',
    keyExpression: 'What time do you [verb]? / I [verb] at [time].',
    example: `Alex: What time do you get up?
Student: I get up at 7.
Alex: Early! I get up at 7:30. What time do you eat breakfast?
Student: I eat breakfast at 7:30.
Alex: Same as me! What time do you go to school?`,
  },
  '5-11': {
    topic: 'favorite subject and skills',
    keyExpression: 'My favorite subject is [subject]. / I\'m good at [noun/verb-ing].',
    example: `Alex: What's your favorite subject?
Student: My favorite subject is science.
Alex: Cool! Mine is PE. Are you good at science experiments?
Student: Yes, I'm good at it.
Alex: Impressive! What are you good at in PE?`,
  },
  '5-12': {
    topic: 'future jobs and dreams',
    keyExpression: 'What do you want to be? / I want to be a [job].',
    example: `Alex: What do you want to be?
Student: I want to be a doctor.
Alex: That's great! I want to be a pilot. Why do you want to be a doctor?
Student: Because I want to help sick people.
Alex: That's really kind. Do you like science?`,
  },
  '6-1': {
    topic: 'school grade',
    keyExpression: 'What grade are you in? / I\'m in the [ordinal] grade.',
    example: `Alex: What grade are you in?
Student: I'm in the sixth grade.
Alex: Oh, I'm in the fifth grade. Now ask me!
Student: What grade are you in?
Alex: I'm in the fifth grade. What grade is your friend in?
Student: She is in the sixth grade.
Alex: Same as you! What grade are you in?`,
  },
  '6-2': {
    topic: 'seasons and activities',
    keyExpression: 'What season do you like? / I like [season]. I can [activity].',
    example: `Alex: What season do you like?
Student: I like winter.
Alex: I like spring! In spring, I can go on picnics. What can you do in winter?
Student: I can make a snowman.
Alex: Fun! Can you ski in winter?`,
  },
  '6-3': {
    topic: 'dates and birthdays',
    keyExpression: 'When is your birthday? / It\'s on [month] [day].',
    example: `Alex: When is your birthday?
Student: It's on June 5th.
Alex: Cool! Mine is on March 10th. When is Children's Day?
Student: It's on May 5th.
Alex: Right! Do you get presents on your birthday?`,
  },
  '6-4': {
    topic: 'emotions and reasons (because)',
    keyExpression: 'Why are you [emotion]? / Because [reason].',
    example: `Alex: Why are you happy today?
Student: Because I got a perfect score on my test.
Alex: That's awesome! I'm excited because I got new sneakers. Why are you tired?
Student: Because I played soccer all day.
Alex: That sounds exhausting! Are you good at soccer?`,
  },
  '6-5': {
    topic: 'giving directions',
    keyExpression: 'Where is [place]? / Go straight. Turn left/right.',
    example: `Alex: Where is the library?
Student: Go straight one block and turn left.
Alex: Got it! Where is the post office?
Student: It's next to the bank.
Alex: Thanks! Is it far from here?`,
  },
  '6-6': {
    topic: 'describing appearance',
    keyExpression: 'What does [he/she] look like? / [He/She] has [hair]. [He/She] is wearing [clothes].',
    example: `Alex: What does your best friend look like?
Student: She has long black hair.
Alex: My friend has short brown hair. What is she wearing today?
Student: She is wearing a blue jacket.
Alex: Nice! Is she tall or short?`,
  },
  '6-7': {
    topic: 'invitations and schedules',
    keyExpression: 'Can you come to [event]? / It\'s on [date]. / Sure, I can come!',
    example: `Alex: Can you come to my birthday party?
Student: Sure, I can come! When is it?
Alex: It's on Saturday, July 10th. Can you bring a friend?
Student: Yes, I can.
Alex: Great! Do you like birthday parties?`,
  },
  '6-8': {
    topic: 'comparatives (bigger, taller, faster)',
    keyExpression: '[A] is [adjective]-er than [B].',
    example: `Alex: Is an elephant bigger than a horse?
Student: Yes, an elephant is bigger than a horse.
Alex: Right! Is a cheetah faster than a lion?
Student: Yes, a cheetah is faster than a lion.
Alex: Cool! What animal do you think is the strongest?`,
  },
  '6-9': {
    topic: 'future plans (going to)',
    keyExpression: 'What are you going to do? / I\'m going to [verb].',
    example: `Alex: What are you going to do this weekend?
Student: I'm going to go camping.
Alex: Fun! I'm going to visit my cousin. Are you going to cook outside?
Student: Yes, I'm going to make ramen.
Alex: Yum! Who are you going with?`,
  },
  '6-10': {
    topic: 'frequency adverbs and healthy habits',
    keyExpression: 'How often do you [verb]? / I [verb] [frequency].',
    example: `Alex: How often do you eat vegetables?
Student: I eat vegetables every day.
Alex: Healthy! I eat vegetables twice a week. How often do you exercise?
Student: I exercise three times a week.
Alex: Nice! What kind of exercise do you do?`,
  },
  '6-11': {
    topic: 'traditional games and culture',
    keyExpression: 'Do you know anything about [topic]? / Yes! It\'s [description]. / No, I don\'t.',
    example: `Alex: Do you know anything about Tuho?
Student: Yes! It's a Korean arrow-throwing game.
Alex: Right! Do you know anything about boomerangs?
Student: No, I don't know.
Alex: That's okay! It's an Australian flying toy. Do you want to try Tuho?`,
  },
  '6-12': {
    topic: 'past achievements (made, wrote, drew)',
    keyExpression: 'We made a class album. / I made [object]. / She drew [object].',
    example: `Alex: We made a class album! What did you make?
Student: I made a poster.
Alex: Nice! I drew some pictures. Now ask me!
Student: What did you make?
Alex: I made a photo book. What did your friend make?
Student: She made a video.
Alex: Cool! What did you put in your album?`,
  },
};

const SMALLTALK_TOPICS = [
  "How are you today?",
  "What did you eat for lunch?",
  "Do you have any pets?",
  "What's your favorite food?",
  "Did you play outside today?",
  "What's the weather like today?",
];

// ── System Prompt Builder ─────────────────────────────────────────────────────
function buildSystemPrompt(phase, lessonKey, lessonTitle, round) {

  // ── FREE TALK ──────────────────────────────────────────────────────────────
  if (phase === 'free') {
    return `You are playing a character named Alex — a friendly Korean elementary school student who loves talking in English.
You are NOT a chatbot or AI. Never say "I'm a chatbot", "I'm an AI", "Great question!", or anything like that.
You are just a fun kid having a conversation.

RULES:
- Max 10 simple words per sentence
- Always end with one natural question
- If the student says "bye", "그만", or "stop" → say a warm goodbye like a friend would
- Never speak Korean
- No emoji in your responses

HOW TO TALK:
- React like a real kid: "Oh really?" / "No way!" / "Me too!" / "That's so fun!"
- Share your own opinion: "I like pizza too." / "I don't like bugs."
- Keep it natural and casual`;
  }

  // ── SMALLTALK ─────────────────────────────────────────────────────────────
  if (phase === 'smalltalk') {
    const starter = SMALLTALK_TOPICS[Math.floor(Math.random() * SMALLTALK_TOPICS.length)];
    return `You are playing a character named Alex — a friendly Korean elementary school student who loves talking in English.
You are NOT a chatbot or AI. Never say "I'm a chatbot", "I'm an AI", or anything robotic.
You are just a kid chatting before class.

RULES:
- Max 8 simple words per sentence
- Always end with one simple question about daily life (food, pets, weather, hobbies)
- Do NOT mention any lesson or study topic
- Never speak Korean
- No emoji in your responses
- React like a real kid, not a teacher

EXAMPLE NATURAL REACTIONS (use these styles):
- "Oh really? That sounds yummy!"
- "Me too! I love ramen."
- "No way! That's so funny."
- "Wow. I didn't know that."

A good opening question to consider: "${starter}"`;
  }

  // ── LESSON ────────────────────────────────────────────────────────────────
  const meta = LESSON_META[lessonKey];
  if (!meta) {
    return `You are Alex, a friendly kid practicing English. Keep responses under 10 words. Always ask one question. No emoji.`;
  }

  return `You are Alex. You are a student, not a teacher, not an AI.
Respond ONLY like the examples below. Nothing else.

TODAY'S LESSON: ${meta.keyExpression}

EXAMPLE OF EXACTLY HOW YOU MUST RESPOND:
${meta.example}

HARD RULES — follow every single one:
1. Your ENTIRE response must be under 20 words total. Short and complete.
2. Always end with a question.
3. When the student answers your question → say "Now ask me!" then answer AS A STUDENT with a real answer.
   Example: Student says "I'm in the sixth grade." → You say: "I'm in the fifth grade. Now ask me!"
4. If the student made a grammar mistake, use the correct form in YOUR sentence naturally. No explanation.
   Example: Student says "I in sixth grade." → You say: "Oh, you're in the sixth grade. Now ask me!"
5. NEVER say: "Oh you", "That's great", "Wonderful", "Amazing", "Good job", "Well done", "I'm an AI", "I'm a chatbot"
6. React like a real kid: "Oh really?", "Me too!", "Cool.", "No way!", "Same here."
7. No emoji. No Korean.
8. NEVER leave a sentence unfinished. Always write complete sentences.`;
}

// ── Handler ────────────────────────────────────────────────────────────────────
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

  try {
    const systemPrompt = buildSystemPrompt(phase || 'lesson', lessonKey, lessonTitle, round);

    // few-shot은 system prompt 안의 EXAMPLE CONVERSATION으로 대체 — 별도 배열 불필요
    const messages = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: "Got it. I'm Alex, a student. Let's talk!" }] },
      ...conversationHistory.map(t => ({
        role: t.speaker === 'AI' ? 'model' : 'user',
        parts: [{ text: t.text }]
      }))
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages,
          generationConfig: { temperature: 0.5, maxOutputTokens: 200, topP: 0.9 },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_LOW_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_LOW_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return res.status(200).json({ success: false, text: "Sorry, can you try again?" });
    }

    const data = await response.json();

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      // 이모지 제거 (TTS 안전)
      let text = data.candidates[0].content.parts[0].text.trim();
      text = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
      return res.status(200).json({ success: true, text });
    }

    if (data.candidates?.[0]?.finishReason === 'SAFETY') {
      return res.status(200).json({ success: true, text: "I cannot understand that. Please try again." });
    }

    return res.status(200).json({ success: false, text: "Sorry, can you try again?" });

  } catch (e) {
    console.error('Chat handler error:', e);
    return res.status(200).json({ success: false, text: "Sorry, there was a problem! Please try again." });
  }
}
