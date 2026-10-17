
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { build as viteBuild, createServer as createViteServer } from 'vite';
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
    model: 'gemini-2.5-flash'
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

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
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
      ? ayahs.find((item: any, index: number) => {
          const number =
            typeof item === 'object'
              ? item.numberInSurah ?? item.number ?? item.id
              : index + 1;

          return Number(number) === Number(ayahNumber);
        })
      : undefined;

    const targetAyah =
      typeof ayah === 'string'
        ? ayah
        : ayah?.text ?? ayah?.arabic ?? ayah?.content ?? '';

    const cleanBase64 = String(audioBase64).replace(
      /^data:[^,]*,/,
      ''
    );

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
أنت معلّم قرآن كريم متخصص في تصحيح التلاوة والتجويد.

السورة: ${surahId}
رقم الآية: ${ayahNumber}
النص المرجعي: ${targetAyah || 'غير متوفر'}
مستوى المتعلم: ${proficiencyLevel || 'مبتدئ'}
التفريغ المساعد: ${spokenTranscriptionFallback || 'غير متوفر'}
المقاييس الصوتية: ${JSON.stringify(acousticMetrics ?? {})}

حلل التسجيل الصوتي الفعلي وقارنه بالنص المرجعي إذا توفر.
لا تخترع أخطاء، ولا تجزم بخطأ لا يمكن سماعه بوضوح.
قيّم النطق والتلاوة والتجويد، وقدّم نصيحة تعليمية بالعربية.

أعد JSON فقط بهذا الشكل:
{
  "score": 0,
  "errors": [],
  "words": [],
  "advice": "نصيحة باللغة العربية"
}

score رقم من 0 إلى 100.
errors وwords مصفوفتان.
`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: String(mimeType || 'audio/webm')
                  .split(';')[0],
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

    if (!result.text) {
      return res.status(502).json({
        error: 'لم يرجع الذكاء الاصطناعي نتيجة للتحليل.'
      });
    }

    let analysis: any;

    try {
      analysis = JSON.parse(result.text);
    } catch {
      console.error('Invalid Gemini JSON response:', result.text);

      return res.status(502).json({
        error: 'تعذّر قراءة نتيجة تحليل التلاوة.'
      });
    }

    return res.json({
      score: Number(analysis.score ?? 0),
      errors: Array.isArray(analysis.errors)
        ? analysis.errors
        : [],
      words: Array.isArray(analysis.words)
        ? analysis.words
        : [],
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
  const projectRoot = process.cwd();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      configFile: path.resolve(projectRoot, 'vite.config.ts'),
      root: projectRoot,
      server: { middlewareMode: true },
      appType: 'spa'
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(projectRoot, 'dist');
    const indexPath = path.join(distPath, 'index.html');

    console.log('Project directory:', projectRoot);
    console.log('Web build directory:', distPath);

    // بناء الواجهة تلقائياً إذا كانت مفقودة
    if (!fs.existsSync(indexPath)) {
      console.log('dist/index.html is missing. Starting Vite build...');

      await viteBuild({
        configFile: path.resolve(projectRoot, 'vite.config.ts'),
        root: projectRoot,
        logLevel: 'info'
      });
    }

    // لا يبدأ السيرفر بواجهة غير موجودة
    if (!fs.existsSync(indexPath)) {
      throw new Error(
        `Build failed: index.html was not created at ${indexPath}`
      );
    }

    app.use(express.static(distPath));

    app.get('*', (_req, res) => {
      res.sendFile(indexPath);
    });

    console.log('Web interface found:', indexPath);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
