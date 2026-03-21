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
  const slice = conversationHistory.slice(0, 8);
  const dialogText = slice.map(t =>
    `${t.speaker === 'AI' ? 'Alex' : sName}: ${t.text}`
  ).join('\n');

  const prompt = `Create a 4-panel comic strip based on this conversation. Use the actual words.

Conversation:
${dialogText}

Return ONLY valid JSON. No markdown. No extra text.
Format: {"title":"short title","panels":[{"panel":1,"setting":"classroom","alexSays":"text max 8 words","studentSays":"text max 8 words","alexEmotion":"happy","studentEmotion":"happy"},{"panel":2,"setting":"playground","alexSays":"text","studentSays":"text","alexEmotion":"excited","studentEmotion":"thinking"},{"panel":3,"setting":"park","alexSays":"text","studentSays":"text","alexEmotion":"proud","studentEmotion":"happy"},{"panel":4,"setting":"classroom","alexSays":"Great job!","studentSays":"Thank you!","alexEmotion":"excited","studentEmotion":"happy"}]}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000,
            responseMimeType: "application/json",
          },
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
    const comicData = JSON.parse(clean);
    return res.status(200).json({ success: true, comicData });

  } catch (e) {
    console.error('Comic handler error:', e);
    const panels = [1,2,3,4].map(i => {
      const aiTurns = slice.filter(t => t.speaker === 'AI');
      const stTurns = slice.filter(t => t.speaker === 'STUDENT');
      return {
        panel: i,
        setting: ['classroom','playground','park','library'][i-1],
        alexSays: (aiTurns[i-1]?.text || 'Good job!').slice(0, 50),
        studentSays: (stTurns[i-1]?.text || 'Thank you!').slice(0, 50),
        alexEmotion: 'happy',
        studentEmotion: 'happy',
      };
    });
    return res.status(200).json({
      success: true,
      comicData: { title: `${sName}'s English Practice`, panels }
    });
  }
}
