// pages/api/comic.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { conversationHistory, studentName } = req.body;
  if (!conversationHistory || conversationHistory.length === 0) {
    return res.status(400).json({ success: false });
  }

  const sName = studentName || 'Student';

  // 대화 내용 최대 8턴
  const slice = conversationHistory.slice(0, 8);
  const dialogText = slice.map(t =>
    `${t.speaker === 'AI' ? 'Alex' : sName}: ${t.text}`
  ).join('\n');

  // 대화가 너무 짧으면 패딩
  const hasEnough = slice.length >= 4;

  const prompt = `Create a 4-panel comic strip from this English conversation between Alex (a robot) and ${sName} (a student).

Conversation:
${dialogText}

IMPORTANT: Use the EXACT words from the conversation above for speech bubbles.
Each speech bubble must be under 8 words.
If the conversation is short, repeat or paraphrase the key expressions.

Return ONLY this JSON, nothing else, no markdown:
{"title":"[5 words max]","panels":[{"panel":1,"setting":"classroom","alexSays":"[from conversation]","studentSays":"[from conversation]","alexEmotion":"happy","studentEmotion":"happy"},{"panel":2,"setting":"classroom","alexSays":"[from conversation]","studentSays":"[from conversation]","alexEmotion":"excited","studentEmotion":"thinking"},{"panel":3,"setting":"classroom","alexSays":"[from conversation]","studentSays":"[from conversation]","alexEmotion":"proud","studentEmotion":"happy"},{"panel":4,"setting":"classroom","alexSays":"See you next time!","studentSays":"Bye Alex!","alexEmotion":"excited","studentEmotion":"happy"}]}

setting must be one of: classroom, playground, cafeteria, library, park
emotion must be one of: happy, excited, thinking, surprised, proud, shy, laughing`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
        }),
      }
    );

    if (!response.ok) {
      console.error('Comic API error:', response.status);
      return res.status(200).json({ success: false });
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let comicData;
    try {
      comicData = JSON.parse(clean);
    } catch(e) {
      // JSON 잘린 경우: 완성된 panel만 추출
      const matches = clean.match(/\{"panel":\d[^}]+\}/g) || [];
      const panels = [];
      for (const m of matches) {
        try { panels.push(JSON.parse(m)); } catch(e2) {}
      }
      if (panels.length >= 2) {
        while (panels.length < 4) {
          panels.push({
            panel: panels.length + 1,
            setting: 'classroom',
            alexSays: slice[panels.length * 2]?.text?.slice(0, 40) || 'Good job!',
            studentSays: slice[panels.length * 2 + 1]?.text?.slice(0, 40) || 'Thank you!',
            alexEmotion: 'happy',
            studentEmotion: 'happy',
          });
        }
        comicData = { title: `${sName}'s English Practice`, panels: panels.slice(0, 4) };
      } else {
        throw e;
      }
    }

    return res.status(200).json({ success: true, comicData });

  } catch (e) {
    console.error('Comic handler error:', e);
    // 실제 대화 내용으로 fallback 만들기
    const panels = [];
    for (let i = 0; i < 4; i++) {
      const aiTurn = slice.find((t, idx) => t.speaker === 'AI' && idx >= i * 2);
      const stTurn = slice.find((t, idx) => t.speaker === 'STUDENT' && idx >= i * 2);
      panels.push({
        panel: i + 1,
        setting: 'classroom',
        alexSays: (aiTurn?.text || 'Let\'s practice!').slice(0, 50),
        studentSays: (stTurn?.text || 'Okay!').slice(0, 50),
        alexEmotion: 'happy',
        studentEmotion: 'happy',
      });
    }
    return res.status(200).json({
      success: true,
      comicData: { title: `${sName}'s English Practice`, panels }
    });
  }
}
