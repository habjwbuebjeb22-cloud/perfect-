
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { analyzeRecitationLocally } from './src/utils/tajweedEngine.ts';
import { SURAHS_DATA } from './src/data/quranData.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT
  ? parseInt(process.env.PORT, 10)
  : 3000;

app.use(express.json({ limit: '50mb' }));

// Health / Status endpoint
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'ok',
    aiEnabled: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-2.5-flash',
    supportedRulesCount: 12,
    rules: [
      'أخطاء الحروف والنطق والمخارج',
      'همزات الوصل والقطع',
      'الحركات والتشديد والكسرات',
      'أحكام المدود ومقاديرها (2-4-5-6)',
      'أحكام النون الساكنة والتنوين (إظهار، إدغام، إقلاب، إخفاء)',
      'أحكام الميم الساكنة',
      'الغنة ومقاديرها',
      'القلقلة (قطب جد)',
      'التفخيم والترقيق',
      'اللام الشمسية والقمرية',
      'الوقف والابتداء',
      'اللحن الجلي والخفي'
    ]
  });
});

// Tajweed Recitation Analysis endpoint
app.post('/api/analyze-recitation', async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType = 'audio/webm',
      surahId = 1,
      ayahNumber = 1,
      proficiencyLevel = 'intermediate',
      spokenTranscriptionFallback = '',
      acousticMetrics
    } = req.body;

    const surah = SURAHS_DATA.find(
      s => s.id === Number(surahId)
    );

    const ayah = surah?.ayahs.find(
      a => a.number === Number(ayahNumber)
    );

    if (!ayah) {
      return res.status(400).json({
        error: 'Ayah not found in database'
      });
    }

    // AI-powered audio analysis
    if (process.env.GEMINI_API_KEY && audioBase64) {
      try {
        const cleanBase64 = String(audioBase64)
          .replace(/^data:audio\/[^;]+;base64,/, '')
          .trim();

        if (!cleanBase64) {
          throw new Error('بيانات التسجيل الصوتي فارغة');
        }

        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY
        });

        const prompt = `
أنت خبير في علم التجويد برواية حفص عن عاصم من طريق الشاطبية.
استمع إلى التسجيل الصوتي الفعلي وقارنه بالآية التالية:

السورة: ${surah?.nameAr} (رقم ${surah?.id})
رقم الآية: ${ayah.number}
النص القرآني: "${ayah.textUthmani}"
الكلمات بالترتيب: ${ayah.words.map(
  w => `${w.index}. [${w.uthmani}] (${w.simple})`
).join(' | ')}
مستوى القارئ: ${proficiencyLevel}

التزم بالأمانة العلمية:
1. إذا كان الصوت صامتاً أو غير واضح أو لا يحتوي على تلاوة يمكن تقييمها، أرجع:
   evaluationStatus = "unable_to_evaluate"
   overallScore = null
2. لا تفترض أن القراءة صحيحة لمجرد أن التسجيل يحتوي على صوت.
3. قيّم مطابقة الكلمات، ومخارج الحروف والحركات، وأحكام التجويد.
4. عند الشك، استخدم "uncertain" واطلب مراجعة بشرية.
5. لا تدّعِ اكتشاف خطأ صوتي إلا إذا كان مسموعاً بوضوح.
6. لا تعطِ درجة كاملة 100 افتراضياً.

أرجع JSON فقط وفق المخطط التالي:
{
  "evaluationStatus": "evaluated",
  "overallScore": 0,
  "scoresBreakdown": {
    "wordAlignmentScore": 0,
    "pronunciationScore": 0,
    "tajweedScore": 0,
    "recordingConfidence": 0
  },
  "wordsEvaluation": [
    {
      "wordIndex": 1,
      "wordUthmani": "",
      "status": "correct",
      "phoneticDifference": "",
      "ruleName": "",
      "explanationAr": "",
      "stepByStepPronunciation": [],
      "confidenceScore": 0,
      "needsHumanReview": false,
      "severity": "none"
    }
  ],
  "jaliErrorsCount": 0,
  "khafiErrorsCount": 0,
  "waqfNotesCount": 0,
  "generalAdviceAr": "",
  "disclaimerAr": "تنبيه علمي: الذكاء الاصطناعي أداة مساعدة، وعدم رصد خطأ آلي لا يعني بالضرورة صحة القراءة؛ فالمدار على المشافهة والتلقي."
}

حالات الكلمات المسموحة:
correct, warning, error, omitted, permissible_waqf, uncertain

درجات الخطأ المسموحة:
none, jali, khafi, waqf_note

إذا لم تكن متأكداً من التقييم، لا تخترع أخطاء أو درجات.
`;

        const response = await ai.models.generateContent({
          // يجب أن يكون اسم النموذج متاحاً في حساب Gemini
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: String(mimeType).split(';')[0] || 'audio/webm',
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

        const responseText = response.text || '';
        const parsed = JSON.parse(responseText);

        const isUnable =
          parsed.evaluationStatus === 'unable_to_evaluate' ||
          parsed.overallScore === null;

        const rawScore = isUnable
          ? null
          : Number(parsed.overallScore ?? 0);

        const finalScore = rawScore !== null && Number.isFinite(rawScore)
          ? Math.min(95, Math.max(0, rawScore))
          : null;

        const jaliCount = parsed.jaliErrorsCount ?? 0;
        const khafiCount = parsed.khafiErrorsCount ?? 0;

        return res.json({
          source: 'gemini_multimodal_tajweed',
          ayahNumber: ayah.number,
          evaluationStatus: isUnable
            ? 'unable_to_evaluate'
            : (
                jaliCount > 0 ||
                parsed.evaluationStatus === 'needs_human_review'
              )
              ? 'needs_human_review'
              : 'evaluated',
          overallScore: finalScore,
          proficiencyLevel,
          totalWords: ayah.words.length,
          correctWordsCount:
            parsed.wordsEvaluation?.filter(
              (w: any) => w.status === 'correct'
            ).length ?? 0,
          jaliErrorsCount: jaliCount,
          khafiErrorsCount: khafiCount,
          waqfNotesCount: parsed.waqfNotesCount ?? 0,
          scoresBreakdown: parsed.scoresBreakdown ?? null,
          wordsEvaluation: parsed.wordsEvaluation ?? [],
          acousticSummary: {
            tempoEstBpm: null,
            audioClarity: isUnable ? 'unreliable' : 'unverified',
            totalDurationSeconds: acousticMetrics?.durationMs
              ? Math.round(acousticMetrics.durationMs / 1000)
              : null
          },
          generalAdviceAr: parsed.generalAdviceAr ||
            'يرجى مراجعة التلاوة مع قارئ متقن.',
          disclaimerAr: parsed.disclaimerAr ||
            'تنبيه علمي: الذكاء الاصطناعي أداة مساعدة، وعدم رصد خطأ آلي لا يعني بالضرورة صحة القراءة؛ فالمدار على المشافهة والتلقي.'
        });
      } catch (aiErr) {
        console.error('Gemini audio analysis failed:', aiErr);
      }
    }

    // Local fallback: evaluates only the provided transcription.
    const transcription =
      typeof spokenTranscriptionFallback === 'string'
        ? spokenTranscriptionFallback.trim()
        : '';

    const report = analyzeRecitationLocally(
      ayah,
      transcription,
      proficiencyLevel,
      acousticMetrics
    );

    return res.json({
      source: 'local_tajweed_engine',
      ...report
    });
  } catch (err: any) {
    console.error('Recitation analysis error:', err);

    return res.status(500).json({
      error: err?.message || 'Error analyzing recitation'
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
    app.use(express.static(path.resolve(__dirname, 'dist')));

    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
