// pages/api/chat.js
// Gemini proxy - API key is safe server-side, never exposed to browser

const FEW_SHOT = {
  // ── 5학년 ──────────────────────────────────────────────────
  '5-1': [
    { role:'user', parts:[{text:'Where are you from?'}] },
    { role:'model', parts:[{text:"I'm from Korea! Nice to meet you! 😊 Where are you from?"}] },
    { role:'user', parts:[{text:'I from Canada.'}] },
    { role:'model', parts:[{text:"Wow, you're from Canada! That's so cool! Is it cold there? 🍁"}] },
    { role:'user', parts:[{text:'I am from Vietnam.'}] },
    { role:'model', parts:[{text:"Vietnam! Wonderful! I'm from Korea. Where is your friend from?"}] },
  ],
  '5-2': [
    { role:'user', parts:[{text:'What are these?'}] },
    { role:'model', parts:[{text:"They are forks! Great! 🍴 What are those?"}] },
    { role:'user', parts:[{text:'These is scissors.'}] },
    { role:'model', parts:[{text:"They are scissors! Good job! ✂️ What are these over here?"}] },
    { role:'user', parts:[{text:'They are button.'}] },
    { role:'model', parts:[{text:"They are buttons! Nice! What are those on the shelf?"}] },
  ],
  '5-3': [
    { role:'user', parts:[{text:'Can I take picture?'}] },
    { role:'model', parts:[{text:"Can I take pictures? Yes, you can! 📸 Can I sit here?"}] },
    { role:'user', parts:[{text:'Yes you can.'}] },
    { role:'model', parts:[{text:"Yes, you can! 🎉 Can I bring animals here? No, you can't! Can I ride a bike?"}] },
    { role:'user', parts:[{text:'No you cant.'}] },
    { role:'model', parts:[{text:"No, you can't! Perfect! Can I borrow a pen? 🖊️"}] },
  ],
  '5-4': [
    { role:'user', parts:[{text:'Whose phone is this?'}] },
    { role:'model', parts:[{text:"It's Aladdin's! Great question! 📱 Whose pencil case is this?"}] },
    { role:'user', parts:[{text:"It Jasmine."}] },
    { role:'model', parts:[{text:"It's Jasmine's! Well done! Whose textbook is that?"}] },
    { role:'user', parts:[{text:"It's mine."}] },
    { role:'model', parts:[{text:"It's mine! 🎒 Whose bottle is that on the desk?"}] },
  ],
  '5-5': [
    { role:'user', parts:[{text:"Let's go shopping."}] },
    { role:'model', parts:[{text:"Sounds good! 🛍️ Let's go to the movies! How about you?"}] },
    { role:'user', parts:[{text:"Sorry I busy."}] },
    { role:'model', parts:[{text:"Sorry, but I'm busy! Good try! 😅 Let's play a board game! What do you think?"}] },
    { role:'user', parts:[{text:"Sound good."}] },
    { role:'model', parts:[{text:"Sounds good! 🎲 Let's read comic books! Do you like reading?"}] },
  ],
  '5-6': [
    { role:'user', parts:[{text:"I'll go beach."}] },
    { role:'model', parts:[{text:"I'll go to the beach! 🏖️ That sounds so fun! What will you do there?"}] },
    { role:'user', parts:[{text:"I will visit grandpa."}] },
    { role:'model', parts:[{text:"I'll visit my grandpa! How sweet! 👴 Will you eat delicious food together?"}] },
    { role:'user', parts:[{text:"I'll learn taekwondo."}] },
    { role:'model', parts:[{text:"Wow, taekwondo! That's awesome! 🥋 What else will you do this summer?"}] },
  ],
  '5-7': [
    { role:'user', parts:[{text:"I visit grandma yesterday."}] },
    { role:'model', parts:[{text:"I visited my grandma! How nice! 👵 What did you do with her?"}] },
    { role:'user', parts:[{text:"I play basketball."}] },
    { role:'model', parts:[{text:"I played basketball! 🏀 Great! Did you win the game?"}] },
    { role:'user', parts:[{text:"I went festival."}] },
    { role:'model', parts:[{text:"I went to a festival! 🎉 How exciting! What did you eat there?"}] },
  ],
  '5-8': [
    { role:'user', parts:[{text:"I like fruit salad."}] },
    { role:'model', parts:[{text:"I'd like a fruit salad! 🥗 Good choice! What would you like to drink?"}] },
    { role:'user', parts:[{text:"I'd like cheese pizza."}] },
    { role:'model', parts:[{text:"I'd like a cheese pizza! 🍕 Yummy! What would your friend like?"}] },
    { role:'user', parts:[{text:"What you like?"}] },
    { role:'model', parts:[{text:"What would you like? I'd like tomato spaghetti! 🍝 How about you?"}] },
  ],
  '5-9': [
    { role:'user', parts:[{text:"How much shoes?"}] },
    { role:'model', parts:[{text:"How much are the shoes? They are thirty thousand won! 👟 How much are the gloves?"}] },
    { role:'user', parts:[{text:"They are ten thousand."}] },
    { role:'model', parts:[{text:"They are ten thousand won! Good! 💰 How much are the pants?"}] },
    { role:'user', parts:[{text:"How much are socks?"}] },
    { role:'model', parts:[{text:"How much are the socks? They are twenty thousand won! 🧦 What about the glasses?"}] },
  ],
  '5-10': [
    { role:'user', parts:[{text:"I get up seven."}] },
    { role:'model', parts:[{text:"I get up at 7! ⏰ Early bird! What time do you study English?"}] },
    { role:'user', parts:[{text:"I study English 3:30."}] },
    { role:'model', parts:[{text:"I study English at 3:30! 📚 Great! What time do you go to bed?"}] },
    { role:'user', parts:[{text:"I go bed at ten."}] },
    { role:'model', parts:[{text:"I go to bed at 10! 😴 Good night! What time do you eat breakfast?"}] },
  ],
  '5-11': [
    { role:'user', parts:[{text:"My favorite is math."}] },
    { role:'model', parts:[{text:"My favorite subject is math! 🔢 Cool! What are you good at?"}] },
    { role:'user', parts:[{text:"I good at drawing."}] },
    { role:'model', parts:[{text:"I'm good at drawing pictures! 🎨 Amazing! What's your favorite subject?"}] },
    { role:'user', parts:[{text:"My subject is science."}] },
    { role:'model', parts:[{text:"My favorite subject is science! 🔬 Wow! Are you good at it?"}] },
  ],
  '5-12': [
    { role:'user', parts:[{text:"I want be scientist."}] },
    { role:'model', parts:[{text:"I want to be a scientist! 🔭 Amazing! Why do you want to be a scientist?"}] },
    { role:'user', parts:[{text:"I want to be soccer player."}] },
    { role:'model', parts:[{text:"I want to be a soccer player! ⚽ Do you practice every day?"}] },
    { role:'user', parts:[{text:"What you want to be?"}] },
    { role:'model', parts:[{text:"What do you want to be? I want to be a travel writer! ✈️ How about you?"}] },
  ],
  // ── 6학년 ──────────────────────────────────────────────────
  '6-1': [
    { role:'user', parts:[{text:"I in sixth grade."}] },
    { role:'model', parts:[{text:"I'm in the sixth grade! 🏫 Great! What class are you in?"}] },
    { role:'user', parts:[{text:"sixth"}] },
    { role:'model', parts:[{text:"Try saying: I'm in the sixth grade! What grade are you in?"}] },
    { role:'user', parts:[{text:"I'm in the fifth grade."}] },
    { role:'model', parts:[{text:"I'm in the fifth grade! Wonderful! What grade is your friend in?"}] },
  ],
  '6-2': [
    { role:'user', parts:[{text:"I like spring."}] },
    { role:'model', parts:[{text:"I like spring too! 🌸 What can you do in spring?"}] },
    { role:'user', parts:[{text:"I can go field trip."}] },
    { role:'model', parts:[{text:"I can go on field trips! 🌿 Nice! What season do you like?"}] },
    { role:'user', parts:[{text:"I like winter I can make snowman."}] },
    { role:'model', parts:[{text:"I like winter! I can make a snowman! ⛄ That sounds so fun! Do you like snow?"}] },
  ],
  '6-3': [
    { role:'user', parts:[{text:"It's on April."}] },
    { role:'model', parts:[{text:"It's on April 22nd! 🎂 When is your birthday?"}] },
    { role:'user', parts:[{text:"My birthday March 5th."}] },
    { role:'model', parts:[{text:"It's on March 5th! 🎉 Great! When is Sports Day at your school?"}] },
    { role:'user', parts:[{text:"It's on May 15."}] },
    { role:'model', parts:[{text:"It's on May 15th! 🏃 Cool! When is the school festival?"}] },
  ],
  '6-4': [
    { role:'user', parts:[{text:"Because I have math test."}] },
    { role:'model', parts:[{text:"Oh, because you have a math test! 😟 Why are you happy today?"}] },
    { role:'user', parts:[{text:"I sad because dog sick."}] },
    { role:'model', parts:[{text:"I'm sad because my dog is sick! 🐶 Poor thing! Why are you happy?"}] },
    { role:'user', parts:[{text:"Because I got black belt."}] },
    { role:'model', parts:[{text:"Because I got a black belt! 🥋 Wow, amazing! Why are you excited?"}] },
  ],
  '6-5': [
    { role:'user', parts:[{text:"Go straight and turn left."}] },
    { role:'model', parts:[{text:"Go straight one block and turn left! 🗺️ Great! Where is the bank?"}] },
    { role:'user', parts:[{text:"It next to hospital."}] },
    { role:'model', parts:[{text:"It's next to the hospital! Good! 🏥 Where is the bus stop?"}] },
    { role:'user', parts:[{text:"Where is library?"}] },
    { role:'model', parts:[{text:"Where is the library? Go straight two blocks and turn left at the bank! 📚"}] },
  ],
  '6-6': [
    { role:'user', parts:[{text:"She have long hair."}] },
    { role:'model', parts:[{text:"She has long brown hair! 👧 What does he look like?"}] },
    { role:'user', parts:[{text:"He wearing blue shirt."}] },
    { role:'model', parts:[{text:"He is wearing a blue shirt! 👕 Nice! What does she look like?"}] },
    { role:'user', parts:[{text:"She has short black hair."}] },
    { role:'model', parts:[{text:"She has short black hair! ✨ Great description! What is she wearing?"}] },
  ],
  '6-7': [
    { role:'user', parts:[{text:"Can you come party?"}] },
    { role:'model', parts:[{text:"Can you come to the party? 🎉 It's on Saturday! Can you come?"}] },
    { role:'user', parts:[{text:"It's on September."}] },
    { role:'model', parts:[{text:"It's on September 29th! 📅 Great! When is your school festival?"}] },
    { role:'user', parts:[{text:"I can come."}] },
    { role:'model', parts:[{text:"Great, you can come! 🎊 What will you bring to the party?"}] },
  ],
  '6-8': [
    { role:'user', parts:[{text:"Train is bigger than car."}] },
    { role:'model', parts:[{text:"The train is bigger than the car! 🚂 What is faster than a bike?"}] },
    { role:'user', parts:[{text:"Basketball more big."}] },
    { role:'model', parts:[{text:"The basketball is bigger! Good try! 🏀 What is heavier than a baseball?"}] },
    { role:'user', parts:[{text:"Elephant is heavier than dog."}] },
    { role:'model', parts:[{text:"The elephant is heavier than the dog! 🐘 Great! What is taller than a tree?"}] },
  ],
  '6-9': [
    { role:'user', parts:[{text:"I going to go camping."}] },
    { role:'model', parts:[{text:"I'm going to go camping! ⛺ Fun! What are you going to eat there?"}] },
    { role:'user', parts:[{text:"We going watch basketball."}] },
    { role:'model', parts:[{text:"We're going to watch basketball! 🏀 Exciting! What are you going to wear?"}] },
    { role:'user', parts:[{text:"I'm going to visit my grandpa."}] },
    { role:'model', parts:[{text:"I'm going to visit my grandpa! 👴 So sweet! What are you going to do together?"}] },
  ],
  '6-10': [
    { role:'user', parts:[{text:"I eat vegetable every day."}] },
    { role:'model', parts:[{text:"I eat vegetables every day! 🥦 So healthy! How often do you exercise?"}] },
    { role:'user', parts:[{text:"I exercise once week."}] },
    { role:'model', parts:[{text:"I exercise once a week. You should exercise more! 💪 How often do you brush your teeth?"}] },
    { role:'user', parts:[{text:"I brush teeth three times."}] },
    { role:'model', parts:[{text:"I brush my teeth three times a day! 🦷 Excellent habit! How often do you eat breakfast?"}] },
  ],
  '6-11': [
    { role:'user', parts:[{text:"Yes I know. It Korean game."}] },
    { role:'model', parts:[{text:"Yes! It's a Korean game! 🎯 Do you know anything about boomerangs?"}] },
    { role:'user', parts:[{text:"No I don't know."}] },
    { role:'model', parts:[{text:"No, I don't! That's okay! 😊 Do you know anything about nón lá?"}] },
    { role:'user', parts:[{text:"Do you know anything about saris?"}] },
    { role:'model', parts:[{text:"Yes, I do! They're Indian dresses! 🪱 Do you know anything about yakgwa?"}] },
  ],
  '6-12': [
    { role:'user', parts:[{text:"She won car race."}] },
    { role:'model', parts:[{text:"She won the car race! 🏆 Amazing! What did he do?"}] },
    { role:'user', parts:[{text:"He clean park."}] },
    { role:'model', parts:[{text:"He cleaned the park! 🌿 Great job! What did Amy make?"}] },
    { role:'user', parts:[{text:"She made birdhouse."}] },
    { role:'model', parts:[{text:"She made a nice birdhouse! 🐦 How creative! What did they take?"}] },
  ],
};

function buildSystemPrompt(lessonKey, lessonTitle, round) {
  const isFree = lessonKey === 'FREE';
  if (isFree) {
    return `You are "Alex", a cheerful English chatbot for Korean elementary students (grades 5-6).
FREE TALKING MODE — talk about anything the student wants!
STRICT RULES:
1. Use ONLY simple words (elementary level, max 800 word vocabulary)
2. Maximum 10 words per sentence
3. ALWAYS end your response with ONE question
4. Be warm, fun, and encouraging
5. If the student says "bye", "그만", or "stop" → say goodbye warmly
6. Profanity detected → respond: "I cannot understand that. Please try again! 😊"
7. Never use Korean in your response`;
  }
  return `You are "Alex", a cheerful English chatbot for Korean elementary students (grades 5-6).
TODAY'S LESSON: "${lessonTitle}" | ROUND: ${round}
STRICT RULES:
1. Use ONLY simple words (elementary level, max 800 word vocabulary)
2. Maximum 10 words per sentence
3. ALWAYS end your response with ONE question related to the lesson
4. If the student makes a grammar error, use the correct form naturally in your reply
5. Add encouragement: "Great!", "Wow!", "Nice!", "Perfect!"
6. ${round === 1 ? 'Be very gentle and supportive — this is their first try.' : 'Student practiced before — be slightly more expansive and encourage detail.'}
7. Stay focused on the lesson topic
8. Profanity detected → respond: "I cannot understand that. Please try again! 😊"
9. Never use Korean in your response`;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { conversationHistory, lessonKey, lessonTitle, round } = req.body;

  if (!conversationHistory || !lessonKey) {
    return res.status(400).json({ success: false, text: 'Missing required fields' });
  }

  try {
    const systemPrompt = buildSystemPrompt(lessonKey, lessonTitle, round);
    const fewShots = FEW_SHOT[lessonKey] || [];

    // Build full message array: system injection + few-shot + conversation
    const messages = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: "Got it! I'm Alex, ready to help students practice English! 😊" }] },
      ...fewShots,
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
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 150,
            topP: 0.9,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return res.status(200).json({ success: false, text: "Sorry, can you try again? 😊" });
    }

    const data = await response.json();

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text.trim();
      return res.status(200).json({ success: true, text });
    }

    // Blocked by safety filter
    if (data.candidates?.[0]?.finishReason === 'SAFETY') {
      return res.status(200).json({ success: true, text: "I cannot understand that. Please try again! 😊" });
    }

    return res.status(200).json({ success: false, text: "Sorry, can you try again? 😊" });

  } catch (e) {
    console.error('Chat handler error:', e);
    return res.status(200).json({ success: false, text: "Sorry, there was a problem! Please try again. 😊" });
  }
}
