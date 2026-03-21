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

  // Step 1: 대화 → 4컷 장면 묘사 JSON 생성
  const prompt = `Based on this English conversation between Alex and ${sName}, create 4 comic panel descriptions.

Conversation:
${dialogText}

Return JSON only, no markdown:
{"title":"fun short title","panels":[
{"panel":1,"alexSays":"quote max 8 words","studentSays":"quote max 8 words","imagePrompt":"cute cartoon friendly robot Alex and Korean elementary student ${sName} in classroom, Alex asking a question, bright cheerful colors, Korean webtoon style, no text"},
{"panel":2,"alexSays":"quote","studentSays":"quote","imagePrompt":"scene description based on conversation"},
{"panel":3,"alexSays":"quote","studentSays":"quote","imagePrompt":"scene description based on conversation"},
{"panel":4,"alexSays":"Great job!","studentSays":"Thank you!","imagePrompt":"cute cartoon robot Alex and student ${sName} high-fiving, big smiles, celebration, bright colors, Korean webtoon style, no text"}
]}`;

  try {
    // Scene JSON 생성
    const sceneResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 800,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );

    if (!sceneResp.ok) throw new Error(`Scene API error: ${sceneResp.status}`);
    const sceneData = await sceneResp.json();
    const raw = sceneData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const scenes = JSON.parse(raw);

    // Step 2: Imagen 4로 각 패널 이미지 생성
    const panels = await Promise.all(scenes.panels.map(async (panel) => {
      try {
        const imgResp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instances: [{ prompt: panel.imagePrompt }],
              parameters: {
                sampleCount: 1,
                aspectRatio: '1:1',
              },
            }),
          }
        );

        if (!imgResp.ok) {
          const errText = await imgResp.text();
          console.warn(`Imagen failed ${imgResp.status}:`, errText.slice(0, 200));
          return panel;
        }

        const imgData = await imgResp.json();
        const b64 = imgData.predictions?.[0]?.bytesBase64Encoded;
        const mimeType = imgData.predictions?.[0]?.mimeType || 'image/png';
        if (b64) panel.imageData = `data:${mimeType};base64,${b64}`;
        return panel;

      } catch(e) {
        console.warn('Imagen error:', e.message);
        return panel;
      }
    }));

    const hasImages = panels.some(p => p.imageData);
    return res.status(200).json({
      success: true,
      comicData: { title: scenes.title, panels, isImageComic: hasImages }
    });

  } catch(e) {
    console.error('Comic handler error:', e.message);
    // Fallback: 실제 대화 내용으로 텍스트 패널
    const aiTurns = slice.filter(t => t.speaker === 'AI');
    const stTurns = slice.filter(t => t.speaker === 'STUDENT');
    const panels = [0,1,2,3].map(i => ({
      panel: i+1,
      setting: ['classroom','playground','park','classroom'][i],
      alexSays: (aiTurns[i]?.text || 'Good job!').slice(0, 50),
      studentSays: (stTurns[i]?.text || 'Thank you!').slice(0, 50),
      alexEmotion: 'happy',
      studentEmotion: 'happy',
    }));
    return res.status(200).json({
      success: true,
      comicData: { title: `${sName}'s English Practice`, panels, isImageComic: false }
    });
  }
}
