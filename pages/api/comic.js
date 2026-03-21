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

  const prompt = `Make a 4-panel comic from this English conversation. Use the actual words from the dialogue.

${dialogText}

Create 4 panels. Each panel has alexSays and studentSays (max 8 words each, taken from the conversation).
Use different settings: classroom, playground, park, library.
Emotions: happy, excited, thinking, surprised, proud.`;

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
          responseSchema: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              panels: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    panel:         { type: "NUMBER" },
                    setting:       { type: "STRING" },
                    alexSays:      { type: "STRING" },
                    studentSays:   { type: "STRING" },
                    alexEmotion:   { type: "STRING" },
                    studentEmotion:{ type: "STRING" }
                  },
                  required: ["panel","setting","alexSays","studentSays","alexEmotion","studentEmotion"]
                }
              }
            },
            required: ["title","panels"]
          }
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
      // responseSchema 사용시 이미 구조화된 응답이므로 직접 사용 시도
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        comicData = JSON.parse(data.candidates[0].content.parts[0].text);
      } else {
        throw e;
      }
    }

    return res.status(200).json({ success: true, comicData });

  } catch (e) {
    console.error('Comic handler error:', e);
    // 실제 대화 내용으로 fallback
    const panels = [1,2,3,4].map(i => {
      const ai = slice.filter(t => t.speaker === 'AI')[i-1];
      const st = slice.filter(t => t.speaker === 'STUDENT')[i-1];
      return {
        panel: i,
        setting: ['classroom','playground','park','library'][i-1],
        alexSays: (ai?.text || 'Good job!').slice(0, 50),
        studentSays: (st?.text || 'Thank you!').slice(0, 50),
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
