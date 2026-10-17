
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import {
  build as viteBuild,
  createServer as createViteServer
} from 'vite';
import { GoogleGenAI } from '@google/genai';
import { SURAHS_DATA } from './src/data/quranData.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MODEL_NAME = 'gemini-3.8-flash';

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

app.get('/api/status', (_req, res) => {
  res.json({
    status: 'ok',
    aiEnabled: Boolean(process.env.GEMINI_API_KEY),
    model: MODEL_NAME
  });
});

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
      item => Number(item.id ?? item.number) === Number(surahId)
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

استمع إلى التسجيل الصوتي الفعلي وحلّل التلاوة.
قارنها بالنص المرجعي إذا كان متوفراً.
قيّم النطق والتلاوة وأحكام التجويد التي يمكن سماعها بوضوح.
لا تخترع أخطاء ولا تجزم بخطأ لا يمكن التحقق منه من الصوت.
لا تعتبر اختلاف الصوت أو اللهجة وحده خطأً في التلاوة.
اكتب نصيحة تعليمية واضحة باللغة العربية.

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
      model: MODEL_NAME,
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
      console.error(
        'Invalid Gemini JSON response:',
        result.text
      );

      return res.status(502).json({
        error: 'تعذّرت قراءة نتيجة تحليل التلاوة.'
      });
    }

    return res.json({
      score: Math.max(
        0,
        Math.min(100, Number(analysis.score) || 0)
      ),
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
  } catch (error: any) {
    console.error('Recitation analysis failed:', error);

    const status = Number(error?.status ?? error?.code);
    const message = String(error?.message ?? '');

    if (
      status === 404 ||
      message.includes('NOT_FOUND') ||
      message.includes('not available')
    ) {
      return res.status(502).json({
        error:
          'نموذج الذكاء الاصطناعي غير متاح لهذا المفتاح. تحقق من اسم النموذج وإمكانية الوصول إليه.'
      });
    }

    if (status === 429) {
      return res.status(429).json({
        error:
          'وصل الطلب إلى حد الاستخدام المسموح. حاول لاحقاً.'
      });
    }

    return res.status(500).json({
      error:
        'حدث خطأ أثناء تحليل التلاوة. راجع سجلات السيرفر لمعرفة السبب.'
    });
  }
});

async function startServer() {
  const projectRoot = process.cwd();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      configFile: path.resolve(
        projectRoot,
        'vite.config.ts'
      ),
      root: projectRoot,
      server: {
        middlewareMode: true
      },
      appType: 'spa'
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(projectRoot, 'dist');
    const indexPath = path.join(distPath, 'index.html');

    console.log('Project directory:', projectRoot);
    console.log('Web build directory:', distPath);

    if (!fs.existsSync(indexPath)) {
      console.log(
        'dist/index.html is missing. Starting Vite build...'
      );

      await viteBuild({
        configFile: path.resolve(
          projectRoot,
          'vite.config.ts'
        ),
        root: projectRoot,
        logLevel: 'info'
      });
    }

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

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
