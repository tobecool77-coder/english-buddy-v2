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

  try {
    // Step 1: 대화 내용으로 4컷 장면 묘사 생성
    const sceneResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `Based on this English conversation between Alex (a friendly robot) and ${sName} (a Korean elementary student), create 4 comic panel scene descriptions.

Conversation:
${dialogText}

For each panel, write a short image generation prompt describing the scene visually.
Make it cute, colorful, child-friendly Korean webtoon style.
Include what the characters are doing and their expressions.

Return JSON only:
{"title":"fun title","panels":[
{"panel":1,"scene":"cute cartoon robot Alex and student in classroom, Alex asking question, both smiling, bright colors, webtoon style"},
{"panel":2,"scene":"..."},
{"panel":3,"scene":"..."},
{"panel":4,"scene":"..."}
]}` }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );

    if (!sceneResp.ok) throw new Error(`Scene gen failed: ${sceneResp.status}`);
    const sceneData = await sceneResp.json();
    const sceneText = sceneData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const scenes = JSON.parse(sceneText);

    // Step 2: 각 장면을 이미지로 생성
    const imagePromises = scenes.panels.map(async (panel) => {
      const imgResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${panel.scene}, comic panel style, cute cartoon, bright cheerful colors, no text in image` }] }],
            generationConfig: {
              responseModalities: ['IMAGE'],
              temperature: 0.7,
            },
          }),
        }
      );
      if (!imgResp.ok) {
        console.error('Image gen failed:', imgResp.status);
        return null;
      }
      const imgData = await imgResp.json();
      const imagePart = imgData.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      return imagePart ? `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` : null;
    });

    const images = await Promise.all(imagePromises);

    // 이미지와 함께 패널 데이터 반환
    const panels = scenes.panels.map((panel, i) => ({
      panel: panel.panel,
      imageData: images[i],
      scene: panel.scene,
    }));

    return res.status(200).json({
      success: true,
      comicData: {
        title: scenes.title,
        panels,
        isImageComic: true,
      }
    });

  } catch (e) {
    console.error('Comic handler error:', e.message);
    return res.status(200).json({ success: false, error: e.message });
  }
}
