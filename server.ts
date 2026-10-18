
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
const MODEL_NAME ='gemini-3.5-flash-lite';

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

// حالة السيرفر والذكاء الاصطناعي
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'ok',
    aiEnabled: Boolean(process.env.GEMINI_API_KEY),
    model: MODEL_NAME,
    message: process.env.GEMINI_API_KEY
      ? 'Mutqin server is running'
      : 'GEMINI_API_KEY is missing'
  });
});

// تحليل تلاوة القرآن
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

    // استخراج نص الآية إن كان موجوداً في بيانات التطبيق
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

    // إزالة بادئة data URL إذا كان التسجيل مرسلاً بهذه الصيغة
    const cleanBase64 = String(audioBase64).replace(
      /^data:[^,]*,/,
      ''
    );

    const cleanMimeType = String(mimeType || 'audio/webm')
      .split(';')[0]
      .trim();

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
أنت معلّم قرآن كريم متخصص في تعليم التلاوة والتجويد.

السورة: ${surahId ?? 'غير محددة'}
رقم الآية: ${ayahNumber ?? 'غير محدد'}
النص المرجعي للآية: ${targetAyah || 'غير متوفر'}
مستوى المتعلم: ${proficiencyLevel || 'مبتدئ'}
التفريغ النصي المساعد: ${spokenTranscriptionFallback || 'غير متوفر'}
المقاييس الصوتية: ${JSON.stringify(acousticMetrics ?? {})}

المطلوب:
1. استمع إلى التسجيل الصوتي الفعلي وحلّل ما يمكن سماعه بوضوح.
2. قارن القراءة بالنص المرجعي إذا كان متوفراً.
3. وضّح أخطاء النطق أو أحكام التجويد التي تستطيع تحديدها من التسجيل.
4. لا تخترع أخطاء، ولا تدّعِ سماع شيء غير واضح.
5. لا تعتبر المقاييس الصوتية وحدها دليلاً قاطعاً على خطأ في التلاوة.
6. إذا لم يكن التسجيل واضحاً أو تعذّر تقييم حكم معين، اذكر ذلك في النصيحة.
7. اجعل النصائح التعليمية باللغة العربية وبأسلوب بسيط ومشجع.
8. لا تمنح درجة عالية أو منخفضة بلا أساس واضح من التسجيل.

أعد النتيجة بصيغة JSON فقط، دون Markdown، وفق هذا الشكل:
{
  "score": 0,
  "errors": [],
  "words": [],
  "advice": "نصيحة باللغة العربية"
}

score: عدد صحيح من 0 إلى 100.
errors: مصفوفة بالأخطاء المسموعة بوضوح.
words: مصفوفة بملاحظات الكلمات التي تحتاج إلى تصحيح.
advice: نصيحة تعليمية باللغة العربية.
`;

    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: cleanMimeType,
                data: cleanBase64
              }
            },
            {
              text: prompt
            }
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

    const parsedScore = Number(analysis.score);

    return res.json({
      score: Number.isFinite(parsedScore)
        ? Math.max(0, Math.min(100, Math.round(parsedScore)))
        : 0,
      errors: Array.isArray(analysis.errors)
        ? analysis.errors
        : [],
      words: Array.isArray(analysis.words)
        ? analysis.words
        : [],
      advice: String(
        analysis.advice ?? 'استمر بالتدريب، وحاول القراءة بهدوء ووضوح.'
      ),
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
          'نموذج Gemini غير متاح لهذا المفتاح أو اسم النموذج غير صحيح. راجع اسم النموذج وإمكانية الوصول إليه.'
      });
    }

    if (status === 401 || status === 403) {
      return res.status(502).json({
        error:
          'مفتاح Gemini غير صالح أو لا يملك صلاحية الوصول إلى النموذج.'
      });
    }

    if (status === 429) {
      return res.status(429).json({
        error:
          'وصلت إلى حد الاستخدام المسموح لخدمة Gemini. حاول لاحقاً.'
      });
    }

    if (
      message.toLowerCase().includes('timeout') ||
      message.toLowerCase().includes('timed out')
    ) {
      return res.status(504).json({
        error: 'تأخر الرد من خدمة الذكاء الاصطناعي. حاول مجدداً.'
      });
    }

    return res.status(500).json({
      error:
        'حدث خطأ أثناء تحليل التلاوة. راجع سجلات السيرفر لمعرفة السبب.'
    });
  }
});

// تشغيل الواجهة والسيرفر
async function startServer() {
  const projectRoot = process.cwd();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      configFile: path.resolve(projectRoot, 'vite.config.ts'),
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
        configFile: path.resolve(projectRoot, 'vite.config.ts'),
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
    console.log(`Gemini model: ${MODEL_NAME}`);
    console.log(
      `Gemini API key configured: ${Boolean(process.env.GEMINI_API_KEY)}`
    );
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
