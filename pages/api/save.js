// pages/api/save.js
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Sheet header definitions
const HEADERS = {
  session: ['세션ID','저장시각','학년','반','번호','이름','단원코드','단원명','회차','전체턴수','학생턴수','완료여부','완료율(%)','평균반응지연(ms)','평균WPM','WPM등급','스캐폴딩횟수','세션시작','세션종료','총소요시간(초)'],
  turns:   ['세션ID','학년','반','번호','이름','단원코드','회차','턴번호','화자','발화내용','타임스탬프','반응지연(ms)','발화시간(ms)','단어수','WPM','WPM등급'],
  compare: ['학생ID','학년','반','번호','이름','단원코드','단원명','날짜','2회차_평균WPM','2회차_평균반응지연(ms)','2회차_완료여부'],
  freetalk:['세션ID','저장시각','학년','반','번호','이름','주제첫문장','프리토킹_전체턴','프리토킹_학생턴','평균WPM','평균반응지연(ms)','자기수정횟수','총소요시간(초)'],
};

async function getOrCreateSheet(doc, title, headers) {
  let sheet = doc.sheetsByTitle[title];
  if (!sheet) {
    sheet = await doc.addSheet({ title, headerValues: headers });
  }
  return sheet;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, studentInfo, sessionSummary, turns, round, freetalkSummary } = req.body;

  // Validate environment vars
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
    console.error('Missing Google Sheets environment variables');
    return res.status(200).json({ success: false, error: 'Sheet config missing' });
  }

  try {
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
    await doc.loadInfo();

    const now = new Date().toISOString();

    if (type === 'session') {
      // ── Sheet 1: 세션요약 ─────────────────────────────────
      const s1 = await getOrCreateSheet(doc, '세션요약', HEADERS.session);
      await s1.addRow([
        sessionSummary.sessionId, now,
        studentInfo.grade, studentInfo.classNum, studentInfo.number, studentInfo.name,
        sessionSummary.lessonKey, sessionSummary.lessonTitle, round,
        sessionSummary.totalTurns, sessionSummary.studentTurns,
        sessionSummary.completed ? '완료' : '미완료',
        sessionSummary.completionRate,
        sessionSummary.avgLatencyMs, sessionSummary.avgWpm, sessionSummary.wpmGrade,
        sessionSummary.scaffoldCount,
        sessionSummary.startTime, sessionSummary.endTime, sessionSummary.durationSec,
      ]);

      // ── Sheet 2: 턴별로그 ─────────────────────────────────
      const s2 = await getOrCreateSheet(doc, '턴별로그', HEADERS.turns);
      for (const t of (turns || [])) {
        await s2.addRow([
          sessionSummary.sessionId,
          studentInfo.grade, studentInfo.classNum, studentInfo.number, studentInfo.name,
          sessionSummary.lessonKey, round,
          t.turnNumber, t.speaker, t.text, t.timestamp,
          t.latencyMs ?? '', t.durationMs ?? '', t.wordCount ?? '', t.wpm ?? '', t.wpmGrade ?? '',
        ]);
      }

      // ── Sheet 3: 유창성비교 (Round 2만) ──────────────────
      if (round === 2) {
        const s3 = await getOrCreateSheet(doc, '유창성비교', HEADERS.compare);
        await s3.addRow([
          `${studentInfo.grade}-${studentInfo.classNum}-${studentInfo.number}-${studentInfo.name}`,
          studentInfo.grade, studentInfo.classNum, studentInfo.number, studentInfo.name,
          sessionSummary.lessonKey, sessionSummary.lessonTitle,
          now.slice(0, 10),
          sessionSummary.avgWpm, sessionSummary.avgLatencyMs,
          sessionSummary.completed ? '완료' : '미완료',
        ]);
      }
    }

    if (type === 'freetalk') {
      // ── Sheet 4: 프리토킹분석 ─────────────────────────────
      const s4 = await getOrCreateSheet(doc, '프리토킹분석', HEADERS.freetalk);
      await s4.addRow([
        freetalkSummary.sessionId, now,
        studentInfo.grade, studentInfo.classNum, studentInfo.number, studentInfo.name,
        freetalkSummary.firstStudentText,
        freetalkSummary.totalTurns, freetalkSummary.studentTurns,
        freetalkSummary.avgWpm, freetalkSummary.avgLatencyMs,
        freetalkSummary.selfCorrections, freetalkSummary.durationSec,
      ]);

      // Also log free-talk turns in Sheet 2
      const s2 = await getOrCreateSheet(doc, '턴별로그', HEADERS.turns);
      for (const t of (turns || [])) {
        await s2.addRow([
          freetalkSummary.sessionId,
          studentInfo.grade, studentInfo.classNum, studentInfo.number, studentInfo.name,
          'FREE', 'free',
          t.turnNumber, t.speaker, t.text, t.timestamp,
          t.latencyMs ?? '', t.durationMs ?? '', t.wordCount ?? '', t.wpm ?? '', t.wpmGrade ?? '',
        ]);
      }
    }

    return res.status(200).json({ success: true });

  } catch (e) {
    console.error('Save handler error:', e);
    // Don't break the student session — just log failure
    return res.status(200).json({ success: false, error: e.message });
  }
}
