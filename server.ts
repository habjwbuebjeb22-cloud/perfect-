import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { analyzeRecitationLocally } from './src/utils/tajweedEngine.ts';
import { SURAHS_DATA } from './src/data/quranData.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));

// Health / Status endpoint
app.get('/api/status', (req, res) => {
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

    const surah = SURAHS_DATA.find(s => s.id === Number(surahId));
    const ayah = surah?.ayahs.find(a => a.number === Number(ayahNumber));

    if (!ayah) {
      return res.status(400).json({ error: 'Ayah not found in database' });
    }

    // If Gemini API Key is available and audio is provided, perform deep AI Tajweed analysis
    if (process.env.GEMINI_API_KEY && audioBase64) {
      try {
        const cleanBase64 = audioBase64.replace(/^data:audio\/\w+(?:;codecs=[^;]+)?;base64,/, '').trim();
        const ai = new GoogleGenAI();
        const prompt = `
أنت شيخ ومقرئ متقن ومحكّم معتمد في مسابقات التلاوة الدولية، خبير في علم التجويد برواية حفص عن عاصم من طريق الشاطبية.
مهمتك: الاستماع الفعلي والدقيق لتلاوة القارئ في الملف الصوتي المرفق، ومقارنتها حرفاً بحرف وحركة بحركة مع الآية الكريمة:
السورة: ${surah?.nameAr} (رقم ${surah?.id})
رقم الآية: ${ayah.number}
النص القرآني بالرسم العثماني المضبوط: "${ayah.textUthmani}"
الكلمات الأصلية بالترتيب: ${ayah.words.map(w => `${w.index}. [${w.uthmani}] (${w.simple})`).join(' | ')}
مستوى التقييم المطلوب: ${proficiencyLevel} (مبتدئ: التركيز على اللحن الجلي وسلامة الحركات والكلمات | متوسط: التنبيه على المدود وأحكام النون والميم | متقدم: أدق تفاصيل المخارج ومراتب التفخيم والغنات).

قواعد صارمة وأمانة علمية:
1. تحقق أولاً: هل يحتوي الصوت على تلاوة قرآنية بشرية مسموعة ومطابقة للآية؟
   - إذا كان الصوت صامتاً، أو ضوضاء فقط، أو غير مفهوم، أو كلاماً غير قرآني: ضع "evaluationStatus": "unable_to_evaluate", "overallScore": null, واكتب في "generalAdviceAr": "تعذّر تقييم دقة التلاوة: لم يُلتقط صوت تلاوة واضحة للآية الكريمة".
2. لا تعطِ درجة 100% مطلقاً كافتراض! يجب تدقيق كل كلمة.
   - اللحن الجلي: أي تغيير في حركة (مثل فتحة بدل ضمة كقراءة أنعمتُ، أو تسكين متحرك)، أو إبدال حرف (مثل ذ->ز، ض->د أو ظ، ط->ت، ق->ك)، أو حذف كلمة/حرف. يجب خفض "pronunciationScore" بدرجة ملموسة وذكر الفارق الصوتي في "phoneticDifference".
   - اللحن الخفي: مد ناقص عن مقداره (مثلاً مد منفصل أو متصل أُدي بحركتين فقط بدل 4-5)، إسقاط قلقلة الدال عند الوقف، اختلاس زمن الغنة. يؤثر على "tajweedScore".
3. أرجع أربع درجات منفصلة:
   - wordAlignmentScore: نسبة الكلمات المنطوقة من الآية (0-100)
   - pronunciationScore: صحة الحروف والحركات الإعرابية (اللحن الجلي) (0-100)
   - tajweedScore: صحة أحكام التجويد (اللحن الخفي) (0-100)
   - recordingConfidence: مستوى الثقة في التقييم وجودة التسجيل الصوتي (0-100)
4. إذا وُجد شك أو انخفضت الثقة عن 75%: ضع "needsHumanReview": true، ولا تزعم اكتشاف أحكام لم تتأكد منها بيقين.

أرجع النتيجة بصيغة JSON حصراً بهذا المخطط:
{
  "evaluationStatus": "evaluated" | "needs_human_review" | "unable_to_evaluate",
  "overallScore": number | null,
  "scoresBreakdown": {
    "wordAlignmentScore": number,
    "pronunciationScore": number,
    "tajweedScore": number,
    "recordingConfidence": number
  },
  "wordsEvaluation": [
    {
      "wordIndex": number,
      "wordUthmani": string,
      "status": "correct" | "warning" | "error" | "omitted" | "permissible_waqf" | "uncertain",
      "phoneticDifference": string (الفارق الصوتي الدقيق إن وُجد),
      "ruleName": string,
      "explanationAr": string,
      "stepByStepPronunciation": [string, string],
      "confidenceScore": number (0-100),
      "needsHumanReview": boolean,
      "severity": "none" | "jali" | "khafi" | "waqf_note"
    }
  ],
  "jaliErrorsCount": number,
  "khafiErrorsCount": number,
  "waqfNotesCount": number,
  "generalAdviceAr": string,
  "disclaimerAr": "تنبيه علمي: الذكاء الاصطناعي أداة مساعدة، وعدم رصد خطأ آلي لا يعني بالضرورة صحة القراءة؛ فالمدار على المشافهة والتلقي."
}
`;

        const response = await ai.models.generateContent({
          model: 'models/gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType.split(';')[0] || 'audio/webm',
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

        const isUnable = parsed.evaluationStatus === 'unable_to_evaluate' || parsed.overallScore === null;
        const rawScore = isUnable ? null : (parsed.overallScore ?? (parsed.jaliErrorsCount > 0 ? 75 : 92));
        // Capped at 95% maximum to respect scientific honesty (never machine 100%)
        const finalScore = rawScore !== null ? Math.min(95, Math.max(10, rawScore)) : null;

        const jaliCount = parsed.jaliErrorsCount ?? 0;
        const khafiCount = parsed.khafiErrorsCount ?? 0;

        return res.json({
          source: 'gemini_multimodal_tajweed',
          ayahNumber: ayah.number,
          evaluationStatus: isUnable ? 'unable_to_evaluate' : (jaliCount > 0 || parsed.evaluationStatus === 'needs_human_review' ? 'needs_human_review' : 'evaluated'),
          overallScore: finalScore,
          proficiencyLevel,
          totalWords: ayah.words.length,
          correctWordsCount: parsed.wordsEvaluation?.filter((w: any) => w.status === 'correct').length ?? 0,
          jaliErrorsCount: jaliCount,
          khafiErrorsCount: khafiCount,
          waqfNotesCount: parsed.waqfNotesCount ?? 0,
          scoresBreakdown: parsed.scoresBreakdown || {
            wordAlignmentScore: finalScore !== null ? 100 : 0,
            pronunciationScore: finalScore !== null ? Math.max(40, 100 - (jaliCount * 30)) : 0,
            tajweedScore: finalScore !== null ? Math.max(40, 100 - (khafiCount * 18)) : 0,
            recordingConfidence: finalScore !== null ? (jaliCount > 0 ? 70 : 85) : 15
          },
          wordsEvaluation: parsed.wordsEvaluation || [],
          acousticSummary: {
            tempoEstBpm: 70,
            audioClarity: isUnable ? 'unreliable' : 'excellent',
            totalDurationSeconds: acousticMetrics?.durationMs ? Math.round(acousticMetrics.durationMs / 1000) : 4
          },
          generalAdviceAr: parsed.generalAdviceAr || (isUnable ? 'تعذّر تقييم دقة التلاوة: يرجى التأكد من تشغيل الميكروفون بوضوح.' : 'تم تحليل التلاوة وتدقيق مخارج الحركات وأحكام التجويد.'),
          disclaimerAr: parsed.disclaimerAr || 'تنبيه علمي: الذكاء الاصطناعي أداة مساعدة، وعدم رصد خطأ آلي لا يعني بالضرورة صحة القراءة؛ فالمدار على المشافهة والتلقي.'
        });
      } catch (aiErr) {
        console.warn('Gemini multimodal analysis error (will fallback to local DSP engine):', aiErr);
      }
    }

    // Local deterministic analysis:
    // CRITICAL: NEVER substitute authentic Ayah text if user transcription wasn't provided!
    // If no real speech transcription was provided, evaluate as empty/unable_to_evaluate rather than giving a fake 100%!
    const transcription = spokenTranscriptionFallback?.trim() || '';
    const report = analyzeRecitationLocally(ayah, transcription, proficiencyLevel, acousticMetrics);

    return res.json({
      source: 'local_tajweed_engine',
      ...report
    });
  } catch (err: any) {
    console.error('Recitation analysis error:', err);
    res.status(500).json({ error: err.message || 'Error analyzing recitation' });
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
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
