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

  try {
    // Pick up to 8 turns for comic (4 exchanges)
    const slice = conversationHistory.slice(0, 8);
    const dialogText = slice.map(t => `${t.speaker === 'AI' ? 'Alex' : studentName || 'Student'}: ${t.text}`).join('\n');

    const prompt = `Create a fun 4-panel comic strip from this English conversation between Alex (a robot) and a student.
Conversation:
${dialogText}

Respond ONLY with valid JSON. No markdown, no explanation, no backticks.
Use this EXACT format:
{"title":"short fun title max 5 words","panels":[{"panel":1,"background":"classroom","alexSays":"max 8 words","studentSays":"max 8 words","alexMood":"happy","studentMood":"happy"},{"panel":2,"background":"playground","alexSays":"max 8 words","studentSays":"max 8 words","alexMood":"excited","studentMood":"thinking"},{"panel":3,"background":"classroom","alexSays":"max 8 words","studentSays":"max 8 words","alexMood":"happy","studentMood":"happy"},{"panel":4,"background":"park","alexSays":"Great job today!","studentSays":"Thank you Alex!","alexMood":"excited","studentMood":"happy"}]}

Rules:
- Use actual dialogue from the conversation above
- Keep all text under 8 words
- backgrounds must be one of: classroom, playground, home, park
- moods must be one of: happy, excited, thinking, surprised, proud`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
        }),
      }
    );

    if (!response.ok) {
      console.error('Comic API error:', response.status);
      return res.status(200).json({ success: false });
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Strip any accidental markdown fences
    const clean = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const comicData = JSON.parse(clean);
    return res.status(200).json({ success: true, comicData });

  } catch (e) {
    console.error('Comic handler error:', e);
    // Return a fallback comic so the session can continue
    return res.status(200).json({
      success: true,
      comicData: {
        title: 'My English Practice',
        panels: [
          { panel:1, background:'classroom', alexSays:'Hello! How are you?', studentSays:'I am fine!', alexMood:'happy', studentMood:'happy' },
          { panel:2, background:'classroom', alexSays:'Great! Let\'s practice!', studentSays:'Okay! I am ready!', alexMood:'excited', studentMood:'happy' },
          { panel:3, background:'classroom', alexSays:'You speak so well!', studentSays:'Thank you Alex!', alexMood:'proud', studentMood:'happy' },
          { panel:4, background:'classroom', alexSays:'Great job today!', studentSays:'See you next time!', alexMood:'excited', studentMood:'happy' },
        ]
      }
    });
  }
}
