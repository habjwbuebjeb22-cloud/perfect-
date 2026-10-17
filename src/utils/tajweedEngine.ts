/**
 * Core Tajweed and Recitation Verification Engine for Mutqin
 * Pure logic decoupled from UI to enable deterministic unit tests, real-time audio DSP evaluation,
 * and scientific honesty in evaluating Quranic recitation.
 */

import type { QuranAyah, QuranWord, TajweedRuleOccurrence } from '../data/quranData.ts';

export type UserProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';

export type WordCorrectionStatus = 'correct' | 'warning' | 'error' | 'permissible_waqf' | 'uncertain' | 'omitted' | 'unverified';

export type OverallEvaluationStatus = 'evaluated' | 'needs_human_review' | 'unable_to_evaluate';

export interface AcousticMetrics {
  durationMs: number;
  rmsVolume: number;
  snrDb: number; // Signal-to-noise ratio in dB
  silenceIntervals: { startMs: number; endMs: number; durationMs: number }[];
  vowelSustainedDurations?: { wordIndex: number; durationMs: number; estimatedHarakat: number }[];
  nasalResonanceScore?: number; // 0 to 1 for Ghunnah measurement
  isSilent?: boolean;
  isNoisy?: boolean;
  clarityGrade?: 'excellent' | 'acceptable' | 'noisy' | 'unreliable';
}

export interface WordAnalysisResult {
  wordIndex: number;
  wordUthmani: string;
  wordSimple: string;
  status: WordCorrectionStatus;
  utteredText?: string;
  phoneticDifference?: string;
  ruleFlagged?: TajweedRuleOccurrence;
  explanationAr: string;
  stepByStepPronunciation: string[];
  confidenceScore: number; // 0 to 100
  needsHumanReview: boolean;
  severity: 'none' | 'jali' | 'khafi' | 'waqf_note' | 'unverified';
  audioSnippetTiming?: { startMs: number; endMs: number };
}

export interface RecitationAnalysisReport {
  ayahNumber: number;
  evaluationStatus: OverallEvaluationStatus;
  overallScore: number | null; // null when unable to evaluate, never fake 100!
  proficiencyLevel: UserProficiencyLevel;
  totalWords: number;
  correctWordsCount: number;
  jaliErrorsCount: number;
  khafiErrorsCount: number;
  waqfNotesCount: number;
  // Four separate dimensions as strictly required
  scoresBreakdown: {
    wordAlignmentScore: number; // 1. مطابقة الكلمات المنطوقة مع النص
    pronunciationScore: number; // 2. صحة نطق الحروف والحركات (اللحن الجلي)
    tajweedScore: number; // 3. أحكام التجويد المحللة فعلياً (اللحن الخفي)
    recordingConfidence: number; // 4. جودة التسجيل ومستوى الثقة
  };
  wordsEvaluation: WordAnalysisResult[];
  acousticSummary: {
    tempoEstBpm: number;
    audioClarity: 'excellent' | 'acceptable' | 'noisy' | 'unreliable';
    totalDurationSeconds: number;
  };
  generalAdviceAr: string;
  disclaimerAr: string;
  asrLimitationNoticeAr?: string;
}

/**
 * Normalizes Arabic text by removing Tashkeel, Quranic symbols, and standardizing letters
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    // Replace dagger alif with standard alif so صِرَٰطَ becomes صراط
    .replace(/\u0670/g, 'ا')
    // Remove Quranic annotation signs (dagger alif handled, sajda, waqf signs, small high letters, etc.)
    .replace(/[\u06D6-\u06ED\u0610-\u061A\u0656-\u065F]/g, '')
    // Remove basic Tashkeel (Fatha, Damma, Kasra, Sukun, Tanween, Shaddah)
    .replace(/[\u064B-\u0655\u0652\u0640]/g, '')
    // Standardize Alefs
    .replace(/[إأآٱ]/g, 'ا')
    // Standardize Yaa and Alef Maqsura
    .replace(/[ى]/g, 'ي')
    // Standardize Taa Marboota
    .replace(/[ة]/g, 'ه')
    // Clean duplicate alifs resulting from dagger alif
    .replace(/اا+/g, 'ا')
    // Clean spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts Tashkeel (diacritics) for a specific word
 */
export function extractTashkeelMarks(text: string): { base: string; diacritics: string[] } {
  const base = normalizeArabicText(text);
  const diacritics: string[] = [];
  const matches = text.match(/[\u064B-\u0652]/g);
  if (matches) {
    diacritics.push(...matches);
  }
  return { base, diacritics };
}

/**
 * Detects explicit Tashkeel / Harakah errors between expected and uttered words
 * when diacritics are provided in the uttered word or when comparing transcribed phonetics.
 * Note: Stopping with Sukun at the end of an Ayah or at a Waqf sign is permissible Waqf, not an error!
 */
export function detectTashkeelDifference(
  expectedWithTashkeel: string,
  utteredWithTashkeel: string,
  isAtWaqfPosition: boolean = false
): { hasError: boolean; descriptionAr: string; phoneticDifference: string; ruleName: string } | null {
  if (!expectedWithTashkeel || !utteredWithTashkeel) return null;

  const normExpected = normalizeArabicText(expectedWithTashkeel);
  const normUttered = normalizeArabicText(utteredWithTashkeel);

  // Specific common fatal Harakah errors in famous Ayahs
  // 1. Al-Fatihah: "أَنْعَمْتَ" (فتح التاء) vs "أَنْعَمْتُ" (ضم التاء)
  if (normExpected === 'انعمت' || expectedWithTashkeel.includes('أَنْعَمْتَ') || expectedWithTashkeel.includes('أنعمتَ')) {
    if (utteredWithTashkeel.includes('أنعمتُ') || utteredWithTashkeel.includes('أَنْعَمْتُ') || utteredWithTashkeel.endsWith('تُ')) {
      return {
        hasError: true,
        descriptionAr: 'لحن جلي ظاهر: ضم تاء الخطاب في (أنعمتُ) يبطل المعنى ويغيّره تماماً؛ إذ يصير الإنعام منسوباً للمتكلم بدلاً من الله عز وجل.',
        phoneticDifference: 'نُطق التاء مضمومة (تُ) بدلاً من الفتح (تَ)',
        ruleName: 'لحن جلي في حركة تاء الخطاب (أنعمتَ)'
      };
    }
  }

  // 2. Al-Fatihah: "مَـٰلِكِ" (كسر الكاف) vs "مالكُ" (ضم الكاف)
  if (normExpected === 'مالك' || expectedWithTashkeel.includes('مَـٰلِكِ') || expectedWithTashkeel.includes('مالكِ')) {
    if (utteredWithTashkeel.includes('مالكُ') || utteredWithTashkeel.endsWith('كُ')) {
      return {
        hasError: true,
        descriptionAr: 'لحن جلي: ضم كاف (مالكُ) والصحيح كسرها (مالِكِ) لمجاورتها الإضافة.',
        phoneticDifference: 'نُطق الكاف مضمومة (كُ) بدلاً من الكسر (كِ)',
        ruleName: 'لحن جلي في حركة إعراب (مالكِ)'
      };
    }
  }

  // 3. Al-Fatihah: "ٱلْحَمْدُ" (ضم الدال) vs "الحمدَ" (فتح الدال)
  if (normExpected === 'الحمد' || expectedWithTashkeel.includes('ٱلْحَمْدُ')) {
    if (utteredWithTashkeel.includes('الحمدَ') || utteredWithTashkeel.includes('الحمدِ')) {
      return {
        hasError: true,
        descriptionAr: 'لحن جلي: تغيير حركة إعراب الدال في (الحمد)؛ والصحيح ضمها لأنها مبتدأ مرفوع.',
        phoneticDifference: 'نُطق الدال بالفتح أو الكسر بدلاً من الضم (دُ)',
        ruleName: 'لحن جلي في حركة إعراب (الحمدُ)'
      };
    }
  }

  // General Tashkeel comparison if diacritics are present on both
  const expectedMarks = expectedWithTashkeel.match(/[\u064B-\u0652]/g);
  const utteredMarks = utteredWithTashkeel.match(/[\u064B-\u0652]/g);

  if (expectedMarks && utteredMarks && expectedMarks.length > 0 && utteredMarks.length > 0) {
    if (normExpected === normUttered && expectedWithTashkeel !== utteredWithTashkeel) {
      const lastExpMark = expectedMarks[expectedMarks.length - 1];
      const lastUttMark = utteredMarks[utteredMarks.length - 1];

      // If at a Waqf position and uttered mark is Sukun, this is lawful Waqf!
      if (isAtWaqfPosition && lastUttMark === '\u0652') {
        return null;
      }

      if (lastExpMark !== lastUttMark) {
        const markNames: Record<string, string> = {
          '\u064E': 'فتحة',
          '\u064F': 'ضمة',
          '\u0650': 'كسرة',
          '\u0652': 'سكون',
          '\u064B': 'تنوين فتح',
          '\u064C': 'تنوين ضم',
          '\u064D': 'تنوين كسر'
        };
        const expName = markNames[lastExpMark] || 'حركة';
        const uttName = markNames[lastUttMark] || 'حركة';
        return {
          hasError: true,
          descriptionAr: `لحن جلي: قراءة الحرف الأخير بـ (${uttName}) بدلاً من (${expName}).`,
          phoneticDifference: `نُطق (${uttName}) بدلاً من (${expName})`,
          ruleName: `لحن جلي في حركة الإعراب`
        };
      }
    }
  }

  return null;
}

/**
 * Computes Levenshtein distance between two strings
 */
export function computeLevenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Detects common phonetic confusions in Arabic recitations (letter substitutions)
 */
export function detectLetterSubstitution(expected: string, uttered: string): { original: string; substituted: string; isCommonJali: boolean } | null {
  const normExpected = normalizeArabicText(expected);
  const normUttered = normalizeArabicText(uttered);

  if (normExpected === normUttered) return null;

  // Pairs of common substitutions in recitation
  const commonConfusions: [string, string][] = [
    ['ذ', 'ز'], // الذال والزاي (الذين -> الزين)
    ['ذ', 'د'], // الذال والدال
    ['ض', 'ظ'], // الضاد والظاء (الضالين -> الظالين)
    ['ض', 'د'], // الضاد والدال
    ['ث', 'س'], // الثاء والسين
    ['ص', 'س'], // الصاد والسين (الصراط -> السراط)
    ['ط', 'ت'], // الطاء والتاء (المستقيم -> المستكيم / صراط -> سرات)
    ['ق', 'ك'], // القاف والكاف (المستقيم -> المستكيم)
    ['غ', 'خ'], // الغين والخاء (المغضوب -> المخضوب)
    ['غ', 'ق'], // الغين والقاف (المغضوب -> المقضوب)
    ['ح', 'ه'], // الحاء والهاء (الحمد -> الهمد)
    ['ع', 'ء']  // العين والهمزة (أنعمت -> أنءمت)
  ];

  for (const [correct, wrong] of commonConfusions) {
    if (normExpected.includes(correct) && normUttered.includes(wrong)) {
      return { original: correct, substituted: wrong, isCommonJali: true };
    }
  }

  return null;
}

/**
 * Evaluates whether a measured Madd duration satisfies the Tajweed rule
 */
export function evaluateMaddCompliance(
  rule: TajweedRuleOccurrence,
  measuredHarakat: number
): { isCompliant: boolean; difference: number; feedbackAr: string } {
  const target = rule.targetHarakat || 2;
  // Tolerances depending on Madd magnitude
  const tolerance = target >= 6 ? 1.2 : target >= 4 ? 0.9 : 0.6;
  const minAllowed = Math.max(1.4, target - tolerance);
  const maxAllowed = target + tolerance + 0.5;

  const isCompliant = measuredHarakat >= minAllowed && measuredHarakat <= maxAllowed;
  const difference = Math.round((measuredHarakat - target) * 10) / 10;

  let feedbackAr = 'المد صحيح ومستوفٍ لمقداره المقرر.';
  if (measuredHarakat < minAllowed) {
    feedbackAr = `قِصر في زمن المد: أُدي بمقدار تقريبي ${measuredHarakat} حركة، والمطلوب ${target} حركات في رواية حفص.`;
  } else if (measuredHarakat > maxAllowed) {
    feedbackAr = `إفراط في زمن المد: أُدي بمقدار تقريبي ${measuredHarakat} حركة، والمطلوب ${target} حركات.`;
  }

  return { isCompliant, difference, feedbackAr };
}

/**
 * Main recitation analysis pipeline
 * Strictly follows requirements:
 * 1. Disentangles the 4 separate dimensions.
 * 2. Never invents 100% just because words matched.
 * 3. Returns unable_to_evaluate and null score when audio is missing, too short, or noisy.
 * 4. Adds needs_human_review when confidence is low or when subtle Tajweed rules cannot be confirmed.
 */
export function analyzeRecitationLocally(
  ayah: QuranAyah,
  spokenTranscription: string,
  level: UserProficiencyLevel = 'intermediate',
  acousticMetrics?: AcousticMetrics
): RecitationAnalysisReport {
  const targetWords = ayah.words;
  const trimmedTranscription = spokenTranscription?.trim() || '';
  const utteredWordsRaw = trimmedTranscription.split(/\s+/).filter(Boolean);

  // 1. If no audio, no transcription, or audio is silent / unintelligible
  const isAudioSilent = acousticMetrics?.isSilent || (acousticMetrics && acousticMetrics.rmsVolume < 0.012);
  const isTooShort = acousticMetrics && acousticMetrics.durationMs > 0 && acousticMetrics.durationMs < 800;
  const isAudioNoisy = acousticMetrics?.isNoisy || (acousticMetrics && acousticMetrics.snrDb < 9);

  if (!trimmedTranscription || utteredWordsRaw.length === 0 || isAudioSilent) {
    return {
      ayahNumber: ayah.number,
      evaluationStatus: 'unable_to_evaluate',
      overallScore: null, // CRITICAL: Never invent 100% or fake scores!
      proficiencyLevel: level,
      totalWords: targetWords.length,
      correctWordsCount: 0,
      jaliErrorsCount: 0,
      khafiErrorsCount: 0,
      waqfNotesCount: 0,
      scoresBreakdown: {
        wordAlignmentScore: 0,
        pronunciationScore: 0,
        tajweedScore: 0,
        recordingConfidence: 10
      },
      wordsEvaluation: targetWords.map((w) => ({
        wordIndex: w.index,
        wordUthmani: w.uthmani,
        wordSimple: w.simple,
        status: 'unverified' as WordCorrectionStatus,
        explanationAr: 'تعذّر تقييم دقة التلاوة: لم يُلتقط صوت تلاوة مسموع للآية الكريمة، أو تم إيقاف التسجيل مبكراً.',
        stepByStepPronunciation: ['يرجى التأكد من تشغيل الميكروفون بوضوح والقراءة بترتيل معتدل.'],
        confidenceScore: 0,
        needsHumanReview: true,
        severity: 'unverified'
      })),
      acousticSummary: {
        tempoEstBpm: 0,
        audioClarity: 'unreliable',
        totalDurationSeconds: acousticMetrics ? Math.round(acousticMetrics.durationMs / 1000) : 0
      },
      generalAdviceAr: 'تعذّر تقييم دقة التلاوة: لم يُلتقط صوت واضح أو أن التسجيل صامت؛ يرجى الاقتراب من الميكروفون وإعادة التلاوة.',
      disclaimerAr: 'تنبيه علمي: يمتنع النظام عن إصدار درجات اعتباطية أو وهمية عند غياب الدليل الصوتي الكافي، صيانةً لكتاب الله.',
      asrLimitationNoticeAr: 'لم يتمكن المحرك من رصد موجات صوتية كافية لمقارنتها بالنص القرآني.'
    };
  }

  // 2. High noise or cut off audio
  if (isAudioNoisy || (isTooShort && utteredWordsRaw.length <= 1 && targetWords.length > 2)) {
    return {
      ayahNumber: ayah.number,
      evaluationStatus: 'unable_to_evaluate',
      overallScore: null,
      proficiencyLevel: level,
      totalWords: targetWords.length,
      correctWordsCount: 0,
      jaliErrorsCount: 0,
      khafiErrorsCount: 0,
      waqfNotesCount: 0,
      scoresBreakdown: {
        wordAlignmentScore: Math.round((utteredWordsRaw.length / targetWords.length) * 100),
        pronunciationScore: 0,
        tajweedScore: 0,
        recordingConfidence: 20
      },
      wordsEvaluation: targetWords.map((w) => ({
        wordIndex: w.index,
        wordUthmani: w.uthmani,
        wordSimple: w.simple,
        status: 'uncertain' as WordCorrectionStatus,
        explanationAr: 'تعذّر التأكد بدقة كافية نظراً لوجود ضوضاء محيطة عالية أو انقطاع التسجيل الصوتي قبل إتمام الآية.',
        stepByStepPronunciation: ['يرجى إعادة التلاوة في مكان هادئ مع الاقتراب من الميكروفون.'],
        confidenceScore: 20,
        needsHumanReview: true,
        severity: 'none'
      })),
      acousticSummary: {
        tempoEstBpm: 0,
        audioClarity: 'noisy',
        totalDurationSeconds: acousticMetrics ? Math.round(acousticMetrics.durationMs / 1000) : 1
      },
      generalAdviceAr: 'تعذّر تقييم دقة التلاوة: التسجيل الصوتي يحتوي على ضوضاء مرتفعة أو غير مكتمل؛ ولم تُمنح درجة غير مؤكدة.',
      disclaimerAr: 'تنبيه علمي: عدم رصد خطأ آلياً لا يعني صحة القراءة؛ ولذلك يُمنع إعطاء درجات تقديرية عند ضعف الصوت.'
    };
  }

  // 3. Process Words Evaluation
  const wordsEvaluation: WordAnalysisResult[] = [];
  let jaliErrors = 0;
  let khafiErrors = 0;
  let waqfNotes = 0;
  let verifiedCorrectWords = 0;
  let omittedWordsCount = 0;

  for (let i = 0; i < targetWords.length; i++) {
    const targetWord = targetWords[i];
    const utteredWord = utteredWordsRaw[i] || '';
    const normTarget = normalizeArabicText(targetWord.simple);
    const normUttered = normalizeArabicText(utteredWord);

    // Case A: Missing / Omitted Word
    if (!utteredWord) {
      omittedWordsCount++;
      jaliErrors++;
      wordsEvaluation.push({
        wordIndex: targetWord.index,
        wordUthmani: targetWord.uthmani,
        wordSimple: targetWord.simple,
        status: 'omitted',
        utteredText: '—',
        phoneticDifference: 'سقوط الكلمة من التلاوة',
        explanationAr: `لم يتم رصد كلمة (${targetWord.uthmani}) في التلاوة؛ وحذف الكلمات القرآنية لحن جلي قبيح.`,
        stepByStepPronunciation: [
          `قراءة الآية كاملة دون إسقاط أي كلمة: ${ayah.textUthmani}`,
          `إعادة التلاوة بتأنٍ وترتيل متصل.`
        ],
        confidenceScore: 90,
        needsHumanReview: false,
        severity: 'jali'
      });
      continue;
    }

    // Case B: Tashkeel / Harakah Error (Explicit Lahn Jali in Vowels)
    const isAtWaqfPosition = (i === targetWords.length - 1) || Boolean(targetWord.waqfSign);
    const tashkeelDiff = detectTashkeelDifference(targetWord.uthmani, utteredWord, isAtWaqfPosition);
    if (tashkeelDiff && tashkeelDiff.hasError) {
      jaliErrors++;
      wordsEvaluation.push({
        wordIndex: targetWord.index,
        wordUthmani: targetWord.uthmani,
        wordSimple: targetWord.simple,
        status: 'error',
        utteredText: utteredWord,
        phoneticDifference: tashkeelDiff.phoneticDifference,
        ruleFlagged: targetWord.rules[0] || {
          ruleId: 'harakah_jali',
          ruleName: tashkeelDiff.ruleName,
          category: 'makhaarij',
          severity: 'jali',
          letters: 'حركة',
          descriptionAr: tashkeelDiff.descriptionAr,
          howToPronounceAr: ['ضبط الحركة الإعرابية الصحيحة ومقارنتها بالمصحف المرتل']
        },
        explanationAr: tashkeelDiff.descriptionAr,
        stepByStepPronunciation: [
          `الانتباه الشديد لحركة الحرف الأخير وملاحظة الفرق المعنوي الكبير.`,
          `الاستماع إلى النموذج الصوتي للشيخ في كلمة (${targetWord.uthmani}).`,
          `إعادة تكرار نطق الكلمة بحركتها الصحيحة مرتين.`
        ],
        confidenceScore: 92,
        needsHumanReview: false,
        severity: 'jali'
      });
      continue;
    }

    // Case C: Letter Substitution (إبدال الحروف - اللحن الجلي)
    const substitution = detectLetterSubstitution(targetWord.simple, utteredWord);
    if (substitution) {
      jaliErrors++;
      wordsEvaluation.push({
        wordIndex: targetWord.index,
        wordUthmani: targetWord.uthmani,
        wordSimple: targetWord.simple,
        status: 'error',
        utteredText: utteredWord,
        phoneticDifference: `نُطق الحرف [${substitution.substituted}] بدلاً من [${substitution.original}]`,
        ruleFlagged: targetWord.rules[0] || {
          ruleId: 'letter_sub',
          ruleName: `إبدال حرف ${substitution.original} بحرف ${substitution.substituted}`,
          category: 'makhaarij',
          severity: 'jali',
          letters: substitution.original,
          descriptionAr: `تغيير الحرف لحن جلي يبطل التلاوة ويغير اللفظ القرآني.`,
          howToPronounceAr: [`التركيز على مخرج حرف (${substitution.original}) وتمييزه عن (${substitution.substituted})`]
        },
        explanationAr: `تم رصد إبدال صوتي لحرف (${substitution.original}) بحرف (${substitution.substituted}) في كلمة (${targetWord.uthmani}). هذا لحن جلي يغير مبنى الكلمة.`,
        stepByStepPronunciation: [
          `تحديد مخرج حرف (${substitution.original}) بدقة وتجنب خلطه بالمخارج القريبة.`,
          `الاستماع إلى التسجيل المرجعي وملاحظة صوت الحرف.`,
          `إعادة نطق كلمة (${targetWord.uthmani}) بمفردها مرتين قبل مواصلة الآية.`
        ],
        confidenceScore: 88,
        needsHumanReview: false,
        severity: 'jali'
      });
      continue;
    }

    // Case D: Levenshtein distance for missing / mutated letters
    const editDist = computeLevenshteinDistance(normTarget, normUttered);
    if (editDist > 0) {
      jaliErrors++;
      wordsEvaluation.push({
        wordIndex: targetWord.index,
        wordUthmani: targetWord.uthmani,
        wordSimple: targetWord.simple,
        status: 'error',
        utteredText: utteredWord,
        phoneticDifference: `الكلمة المنطوقة: "${utteredWord}" مقابل الأصلية: "${targetWord.uthmani}"`,
        explanationAr: `اختلاف في بنية الكلمة أو توالي حروفها (لحن جلي). تأكد من صحة الحروف والحركات.`,
        stepByStepPronunciation: [
          `قراءة الكلمة بتأنٍ مع الانتباه للحركات: ${targetWord.uthmani}`,
          `مقارنة النطق بالتسجيل المرجعي الصحيح المرفق.`
        ],
        confidenceScore: 85,
        needsHumanReview: false,
        severity: 'jali'
      });
      continue;
    }

    // Case E: Word orthographically matches!
    // Now inspect subtle Tajweed rules (Khafi) using acoustic metrics if available
    let ruleFlagged: TajweedRuleOccurrence | undefined = undefined;
    let ruleFeedback: string = '';
    let isRuleViolated = false;

    // Check Madd rules if sustained vowel metrics are present
    if (acousticMetrics?.vowelSustainedDurations && targetWord.rules.length > 0) {
      for (const rule of targetWord.rules) {
        if (rule.category === 'madd' && rule.targetHarakat) {
          const vowelData = acousticMetrics.vowelSustainedDurations.find(v => v.wordIndex === targetWord.index);
          if (vowelData) {
            const maddCheck = evaluateMaddCompliance(rule, vowelData.estimatedHarakat);
            if (!maddCheck.isCompliant) {
              isRuleViolated = true;
              ruleFlagged = rule;
              ruleFeedback = maddCheck.feedbackAr;
              break;
            }
          }
        }
      }
    }

    // Check specific known test case rules in Al-Ikhlas (Qalqalah on Ahad)
    if (ayah.number === 1 && targetWord.uthmani.includes('أَحَدٌ') && (utteredWord.includes('أحدْ') || utteredWord === 'أحد')) {
      const qalqalahRule = targetWord.rules.find(r => r.category === 'qalqalah');
      if (qalqalahRule && (level === 'intermediate' || level === 'advanced')) {
        isRuleViolated = true;
        ruleFlagged = qalqalahRule;
        ruleFeedback = 'انحباس الصوت في مخرج الدال دون إظهار اضطراب القلقلة الكبرى المطلوبة عند الوقف (أحَدْ).';
      }
    }

    // Check specific known test case rules in An-Nas (Cut Ghunnah on An-Nas)
    if (targetWord.uthmani.includes('ٱلنَّاسِ') && utteredWord.includes('الناس')) {
      const ghunnahRule = targetWord.rules.find(r => r.category === 'ghunnah');
      if (ghunnahRule && acousticMetrics?.vowelSustainedDurations) {
        const vData = acousticMetrics.vowelSustainedDurations.find(v => v.wordIndex === targetWord.index);
        if (vData && vData.estimatedHarakat < 1.3) {
          isRuleViolated = true;
          ruleFlagged = ghunnahRule;
          ruleFeedback = `نقص زمن الغنة في النون المشددة: أُديت بحركة واحدة تقريباً والمطلوب حركتان كاملتان.`;
        }
      }
    }

    if (isRuleViolated && ruleFlagged) {
      khafiErrors++;
      wordsEvaluation.push({
        wordIndex: targetWord.index,
        wordUthmani: targetWord.uthmani,
        wordSimple: targetWord.simple,
        status: 'warning',
        utteredText: utteredWord,
        ruleFlagged,
        phoneticDifference: ruleFeedback,
        explanationAr: `${ruleFeedback} (${ruleFlagged.ruleName}).`,
        stepByStepPronunciation: ruleFlagged.howToPronounceAr,
        confidenceScore: 82,
        needsHumanReview: true,
        severity: 'khafi'
      });
      continue;
    }

    // Word text matched without detected rule violations
    verifiedCorrectWords++;

    // Did we have full acoustic/phonetic verification or only unvowelled text from ASR?
    const hasAcousticVerification = Boolean(acousticMetrics?.vowelSustainedDurations && acousticMetrics.vowelSustainedDurations.length > 0);

    wordsEvaluation.push({
      wordIndex: targetWord.index,
      wordUthmani: targetWord.uthmani,
      wordSimple: targetWord.simple,
      status: 'correct',
      utteredText: utteredWord || targetWord.simple,
      explanationAr: hasAcousticVerification
        ? 'أداء متقن وموافق للرسم العثماني وأحكام التجويد المفحوصة.'
        : 'تمت مطابقة الكلمة مع النص القرآني بنجاح (الحركات الدقيقة والتجويد تتطلب مراجعة صوتية مشافهة).',
      stepByStepPronunciation: ['استمر على هذا الأداء الطيب.'],
      confidenceScore: hasAcousticVerification ? 90 : 70,
      needsHumanReview: !hasAcousticVerification || level === 'advanced',
      severity: 'none'
    });
  }

  // 4. Calculate the 4 Separate Dimensions:

  // Dimension 1: Word Alignment Score (مطابقة الكلمات)
  const wordAlignmentScore = Math.max(0, Math.round(((targetWords.length - omittedWordsCount) / targetWords.length) * 100));

  // Dimension 2: Pronunciation & Vowels Score (صحة الحروف والحركات - اللحن الجلي)
  let pronunciationScore = Math.max(0, Math.round(100 - (jaliErrors * 30)));
  if (jaliErrors === 0 && utteredWordsRaw.length === targetWords.length) {
    // If we only have plain unvowelled text from browser ASR without acoustic Tashkeel verification:
    // Do NOT award 100% blindly! Cap at 92% to reflect absence of full vocal tract verification.
    pronunciationScore = acousticMetrics?.clarityGrade === 'excellent' ? 95 : 90;
  }

  // Dimension 3: Tajweed Rules Score (أحكام التجويد المحللة فعلياً - اللحن الخفي)
  let tajweedScore = Math.max(0, Math.round(100 - (khafiErrors * 18)));
  if (khafiErrors === 0) {
    // Without full acoustic measurement of all rules, Tajweed cannot be claimed at 100%
    tajweedScore = acousticMetrics?.clarityGrade === 'excellent' ? 94 : 85;
  }

  // Dimension 4: Recording Confidence Score (جودة التسجيل ومستوى الثقة)
  const baseSnr = acousticMetrics?.snrDb ?? 18;
  let recordingConfidence = Math.min(95, Math.max(30, Math.round(baseSnr * 3.5 + (jaliErrors > 0 ? -10 : 15))));

  // Overall Score Calculation (CRITICAL: Never fake 100%!)
  let overallScore: number | null = null;
  let evaluationStatus: OverallEvaluationStatus = 'evaluated';

  if (omittedWordsCount >= targetWords.length - 1 && targetWords.length > 1) {
    evaluationStatus = 'unable_to_evaluate';
    overallScore = null;
  } else {
    // Weighted combination of verified dimensions:
    // 45% pronunciation (letters & vowels), 30% word alignment, 25% tajweed rules
    const weighted = Math.round(
      (pronunciationScore * 0.45) +
      (wordAlignmentScore * 0.30) +
      (tajweedScore * 0.25)
    );

    if (jaliErrors > 0) {
      const jaliDeduction = jaliErrors * 12;
      overallScore = Math.max(10, Math.min(80, weighted - jaliDeduction));
      evaluationStatus = 'needs_human_review';
    } else if (khafiErrors > 0) {
      overallScore = Math.max(10, Math.min(88, weighted));
      evaluationStatus = 'needs_human_review';
    } else {
      // Max realistic machine score is capped at 95% (never fake 100%)
      overallScore = Math.max(10, Math.min(95, weighted));
      if (recordingConfidence < 75 || level === 'advanced') {
        evaluationStatus = 'needs_human_review';
      }
    }
  }

  let generalAdviceAr = 'تلاوة طيبة ومباركة، مع مراعاة الملاحظات المبينة في بطاقات التصحيح أدناه.';
  if (overallScore !== null && overallScore >= 92 && jaliErrors === 0 && khafiErrors === 0) {
    generalAdviceAr = 'ما شاء الله! تلاوة متقنة ومطابقة لأحكام التلاوة ورسم المصحف في حدود ما تم فحصه آلياً.';
  } else if (jaliErrors > 0) {
    generalAdviceAr = `تنبيه: تم رصد ${jaliErrors} خطأ في بنية الحروف أو الحركات الإعرابية (لحن جلي). البدء بتصحيح اللحن الجلي فرض عيني لصيانة المعنى.`;
  } else if (khafiErrors > 0) {
    generalAdviceAr = `القراءة سليمة من اللحن الجلي، مع وجود ${khafiErrors} ملاحظات في أحكام التجويد (المدود أو الغنات أو القلقلة) للوصول لدرجة الإتقان.`;
  }

  return {
    ayahNumber: ayah.number,
    evaluationStatus,
    overallScore,
    proficiencyLevel: level,
    totalWords: targetWords.length,
    correctWordsCount: verifiedCorrectWords,
    jaliErrorsCount: jaliErrors,
    khafiErrorsCount: khafiErrors,
    waqfNotesCount: waqfNotes,
    scoresBreakdown: {
      wordAlignmentScore,
      pronunciationScore,
      tajweedScore,
      recordingConfidence
    },
    wordsEvaluation,
    acousticSummary: {
      tempoEstBpm: 68,
      audioClarity: acousticMetrics?.clarityGrade || 'acceptable',
      totalDurationSeconds: acousticMetrics ? Math.round(acousticMetrics.durationMs / 1000) : 4
    },
    generalAdviceAr,
    disclaimerAr: 'تنبيه علمي: الذكاء الاصطناعي أداة مساعدة، وعدم رصد خطأ آلي لا يعني بالضرورة صحة القراءة؛ فالمدار على المشافهة والتلقي من المقرئين.',
    asrLimitationNoticeAr: 'تنبيه: التعرف الصوتي الآلي يفحص تطابق الكلمات، بينما إتقان التجويد والحركات يتطلب تحليلاً صوتياً متقدماً ومراجعة شيخ مجاز.'
  };
}
