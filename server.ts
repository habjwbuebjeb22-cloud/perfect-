
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { SURAHS_DATA } from './src/data/quranData.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: '50mb' }));

// فحص حالة السيرفر
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'ok',
    aiEnabled: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-2.5-flash',
    message: 'Mutqin server is running'
  });
});

// تحليل التلاوة
app.post('/api/analyze-recitation', async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType,
      surahId,
      ayahNumber,
      proficiencyLevel,
      spokenTranscriptionFallback,
      acousticMetrics
    } = req.body ?? {};

    if (!audioBase64) {
      return res.status(400).json({
        error: 'لم يصل التسجيل الصوتي إلى السيرفر.'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'مفتاح Gemini غير مضبوط في إعدادات الاستضافة.'
      });
    }

    const surahs = SURAHS_DATA as any[];
    const surah = surahs.find(
      (item) => Number(item.id ?? item.number) === Number(surahId)
    );

    const ayahs = surah?.ayahs ?? surah?.verses ?? [];
    const ayah = Array.isArray(ayahs)
      ? ayahs.find(
          (item: any, index: number) =>
            Number(
              typeof item === 'object'
                ? item.numberInSurah ?? item.number ?? item.id
                : index + 1
            ) === Number(ayahNumber)
        )
      : undefined;

    const targetAyah =
      typeof ayah === 'string'
        ? ayah
        : ayah?.text ?? ayah?.arabic ?? ayah?.content ?? '';

    const cleanBase64 = String(audioBase64).replace(
      /^data:[^,]*,/,
      ''
    );

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const prompt = `
أنت معلّم قرآن كريم متخصص في التجويد وتصحيح التلاوة العربية.

رقم السورة: ${surahId}
رقم الآية: ${ayahNumber}
نص الآية المرجعي إن توفر: ${targetAyah || 'غير متوفر'}
مستوى المتعلم: ${proficiencyLevel || 'مبتدئ'}
التفريغ النصي المساعد إن توفر: ${spokenTranscriptionFallback || 'غير متوفر'}
المقاييس الصوتية المساعدة إن توفرت: ${JSON.stringify(acousticMetrics ?? {})}

استمع إلى التسجيل الصوتي نفسه، وقارنه بالنص المرجعي إن توفر.
لا تخترع أخطاء لا تستطيع سماعها بوضوح.
قيّم النطق والتلاوة والتجويد بإنصاف، وميّز بين الخطأ المؤكد وما لا يمكن الجزم به.
أعد النتيجة بصيغة JSON فقط، بالشكل التالي:
{
  "score": 0,
  "errors": [],
  "words": [],
  "advice": "نصيحة قصيرة باللغة العربية"
}

اجعل score رقماً من 0 إلى 100.
واجعل errors وwords مصفوفتين.
كل معلومة للمستخدم يجب أن تكون باللغة العربية.
`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: String(mimeType || 'audio/webm').split(';')[0],
                data: cleanBase64
              }
            },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = result.text;

    if (!responseText) {
      return res.status(502).json({
        error: 'لم يرجع نموذج الذكاء الاصطناعي نتيجة.'
      });
    }

    let analysis: any;

    try {
      analysis = JSON.parse(responseText);
    } catch {
      console.error('Gemini returned invalid JSON:', responseText);
      return res.status(502).json({
        error: 'تعذّر قراءة نتيجة تحليل التلاوة.'
      });
    }

    return res.json({
      score: Number(analysis.score ?? 0),
      errors: Array.isArray(analysis.errors) ? analysis.errors : [],
      words: Array.isArray(analysis.words) ? analysis.words : [],
      advice: String(analysis.advice ?? ''),
      surahId,
      ayahNumber
    });
  } catch (error) {
    console.error('Recitation analysis failed:', error);

    return res.status(500).json({
      error: 'حدث خطأ أثناء تحليل التلاوة. حاول مرة أخرى.'
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });

    app.use(vite.middlewares);
  } else {
    // البحث عن مجلد dist في أكثر من مسار محتمل
    const possibleDistPaths = [
      path.resolve(process.cwd(), 'dist'),
      path.resolve(process.cwd(), '../dist'),
      path.resolve(process.cwd(), '../../dist'),
      path.resolve(process.cwd(), 'src/dist')
    ];

    const distPath = possibleDistPaths.find((folder) =>
      fs.existsSync(path.join(folder, 'index.html'))
    );

    console.log('Current working directory:', process.cwd());
    console.log('Checked dist paths:', possibleDistPaths);
    console.log('Found dist directory:', distPath || 'NOT FOUND');

    if (distPath) {
      app.use(express.static(distPath));

      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      app.get('*', (req, res) => {
        res.status(503).json({
          error: 'ملفات الواجهة غير موجودة.',
          workingDirectory: process.cwd(),
          checkedPaths: possibleDistPaths,
          hint: 'تأكد من نجاح أمر npm run build وإنشاء dist/index.html.'
        });
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
