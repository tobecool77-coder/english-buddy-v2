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

  // Step 1: 대화 → 4컷 장면 JSON 생성
  const prompt = `Based on this English conversation between Alex and ${sName}, create 4 comic panel descriptions.

Conversation:
${dialogText}

Return JSON only, no markdown:
{"title":"short fun title","panels":[{"panel":1,"setting":"classroom","alexSays":"quote max 8 words","studentSays":"quote max 8 words","alexEmotion":"happy","studentEmotion":"happy","imagePrompt":"cute cartoon robot and Korean student in classroom, both smiling, bright colors"},{"panel":2,"setting":"playground","alexSays":"quote","studentSays":"quote","alexEmotion":"excited","studentEmotion":"thinking","imagePrompt":"scene description"},{"panel":3,"setting":"park","alexSays":"quote","studentSays":"quote","alexEmotion":"proud","studentEmotion":"happy","imagePrompt":"scene description"},{"panel":4,"setting":"classroom","alexSays":"Great job!","studentSays":"Thank you!","alexEmotion":"excited","studentEmotion":"happy","imagePrompt":"cute cartoon robot and student waving goodbye, cheerful"}]}`;

  try {
    const sceneResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );

    if (!sceneResp.ok) throw new Error(`Scene API error: ${sceneResp.status}`);
    const sceneData = await sceneResp.json();
    const raw = sceneData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const comicData = JSON.parse(raw.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim());

    // Step 2: 각 패널 이미지 생성 시도
    const panels = await Promise.all(comicData.panels.map(async (panel) => {
      try {
        const imgResp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: `${panel.imagePrompt}, Korean webtoon style, cute, colorful, child-friendly, no text in image` }] }],
              generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
            }),
          }
        );
        if (!imgResp.ok) {
          console.warn(`Image gen failed: ${imgResp.status}`);
          return panel; // 이미지 없이 텍스트 패널로 fallback
        }
        const imgData = await imgResp.json();
        const imagePart = imgData.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imagePart) {
          panel.imageData = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }
        return panel;
      } catch(e) {
        console.warn('Image gen error:', e.message);
        return panel;
      }
    }));

    return res.status(200).json({
      success: true,
      comicData: { ...comicData, panels, isImageComic: panels.some(p => p.imageData) }
    });

  } catch(e) {
    console.error('Comic handler error:', e.message);
    // Fallback: 실제 대화 내용으로 텍스트 패널
    const panels = [0,1,2,3].map(i => {
      const aiTurns = slice.filter(t => t.speaker === 'AI');
      const stTurns = slice.filter(t => t.speaker === 'STUDENT');
      return {
        panel: i+1,
        setting: ['classroom','playground','park','classroom'][i],
        alexSays: (aiTurns[i]?.text || 'Good job!').slice(0,50),
        studentSays: (stTurns[i]?.text || 'Thank you!').slice(0,50),
        alexEmotion: 'happy', studentEmotion: 'happy',
      };
    });
    return res.status(200).json({
      success: true,
      comicData: { title: `${sName}'s English Practice`, panels, isImageComic: false }
    });
  }
}
