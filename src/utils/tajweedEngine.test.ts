/**
 * Comprehensive Unit Tests for Mutqin Tajweed & Recitation Verification Engine
 * Run with node:test
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeArabicText,
  detectTashkeelDifference,
  detectLetterSubstitution,
  evaluateMaddCompliance,
  analyzeRecitationLocally
} from './tajweedEngine.ts';
import { SURAHS_DATA } from '../data/quranData.ts';

const fatihahSurah = SURAHS_DATA.find((s) => s.id === 1)!;
const fatihahAyah7 = fatihahSurah.ayahs.find((a) => a.number === 7)!; // "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ"
const ikhlasSurah = SURAHS_DATA.find((s) => s.id === 112)!;
const ikhlasAyah1 = ikhlasSurah.ayahs.find((a) => a.number === 1)!; // "قُلْ هُوَ ٱللَّهُ أَحَدٌ"
const nasSurah = SURAHS_DATA.find((s) => s.id === 114)!;
const nasAyah1 = nasSurah.ayahs.find((a) => a.number === 1)!; // "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ"

test('1. Normalization cleans Arabic text correctly', () => {
  const normalized = normalizeArabicText('صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ');
  assert.equal(normalized, 'صراط الذين انعمت');
});

test('2. Empty or silent recording returns unable_to_evaluate and overallScore: null (Never 100%!)', () => {
  const result = analyzeRecitationLocally(fatihahAyah7, '', 'intermediate', {
    durationMs: 0,
    rmsVolume: 0.001,
    snrDb: 5,
    silenceIntervals: [],
    isSilent: true,
    isNoisy: true,
    clarityGrade: 'unreliable'
  });

  assert.equal(result.evaluationStatus, 'unable_to_evaluate');
  assert.equal(result.overallScore, null, 'Must never give 100% or any number for empty/silent input');
  assert.match(result.generalAdviceAr, /تعذّر تقييم/);
});

test('3. Noisy recording returns unable_to_evaluate with null score', () => {
  const result = analyzeRecitationLocally(fatihahAyah7, 'صراط الذين', 'intermediate', {
    durationMs: 600,
    rmsVolume: 0.02,
    snrDb: 6, // Low SNR (high noise)
    silenceIntervals: [],
    isSilent: false,
    isNoisy: true,
    clarityGrade: 'noisy'
  });

  assert.equal(result.evaluationStatus, 'unable_to_evaluate');
  assert.equal(result.overallScore, null, 'Must not invent score for noisy cut-off recording');
});

test('4. Detects deliberate Harakah error (أنعمتُ بالضم بدل أنعمتَ) as Lahn Jali', () => {
  const textWithFatalVowelError = 'صراط الذين أنعمتُ عليهم غير المغضوب عليهم ولا الضالين';
  const result = analyzeRecitationLocally(fatihahAyah7, textWithFatalVowelError, 'intermediate', {
    durationMs: 4200,
    rmsVolume: 0.05,
    snrDb: 24,
    silenceIntervals: [],
    isSilent: false,
    isNoisy: false,
    clarityGrade: 'excellent'
  });

  assert.equal(result.jaliErrorsCount, 1, 'Must detect 1 Jali error in vowel');
  assert.notEqual(result.overallScore, 100, 'Score must never be 100% with deliberate vowel error');
  assert.ok(result.overallScore! <= 82, 'Overall score must be penalized');
  assert.ok(result.scoresBreakdown.pronunciationScore <= 70, 'Pronunciation score must drop due to Jali error');
  assert.equal(result.evaluationStatus, 'needs_human_review');

  const word3 = result.wordsEvaluation.find((w) => w.wordIndex === 3);
  assert.equal(word3?.status, 'error');
  assert.equal(word3?.severity, 'jali');
  assert.match(word3?.explanationAr || '', /(ال)?لحن.*(ال)?جلي/);
  assert.match(word3?.phoneticDifference || '', /أنعمتُ|ضم/);
});

test('5. Detects deliberate letter substitution (الذين -> الزين, الصراط -> السراط) as Lahn Jali', () => {
  const textWithSubstitutions = 'السراط الزين أنعمت عليهم غير المغضوب عليهم ولا الضالين';
  const result = analyzeRecitationLocally(fatihahAyah7, textWithSubstitutions, 'intermediate', {
    durationMs: 4500,
    rmsVolume: 0.05,
    snrDb: 22,
    silenceIntervals: [],
    isSilent: false,
    isNoisy: false,
    clarityGrade: 'excellent'
  });

  assert.ok(result.jaliErrorsCount >= 2, 'Must detect at least 2 letter substitution errors');
  assert.ok(result.overallScore! < 70, 'Score must be heavily penalized for 2 Jali errors');
  assert.equal(result.evaluationStatus, 'needs_human_review');

  const word2 = result.wordsEvaluation.find((w) => w.wordIndex === 2); // الذين vs الزين
  assert.equal(word2?.status, 'error');
  assert.equal(word2?.severity, 'jali');
});

test('6. Detects Madd Lazim duration shortfall (قصر مد الضالين إلى حركتين بدل 6) as Lahn Khafi', () => {
  // Word 9 is "ٱلضَّآلِّينَ" which requires Madd Lazim (6 Harakat)
  const text = 'صراط الذين أنعمت عليهم غير المغضوب عليهم ولا الضالين';
  const result = analyzeRecitationLocally(fatihahAyah7, text, 'intermediate', {
    durationMs: 3800,
    rmsVolume: 0.06,
    snrDb: 25,
    silenceIntervals: [],
    vowelSustainedDurations: [
      { wordIndex: 9, durationMs: 420, estimatedHarakat: 1.5 } // Short duration (1.5 instead of 6 harakat!)
    ],
    isSilent: false,
    isNoisy: false,
    clarityGrade: 'excellent'
  });

  assert.equal(result.khafiErrorsCount, 1, 'Must detect Madd shortfall as Khafi error');
  assert.ok(result.scoresBreakdown.tajweedScore <= 82, 'Tajweed score must be reduced');
  assert.notEqual(result.overallScore, 100, 'Overall score cannot be 100% when Madd is cut short');

  const word9 = result.wordsEvaluation.find((w) => w.wordIndex === 9);
  assert.equal(word9?.status, 'warning');
  assert.equal(word9?.severity, 'khafi');
  assert.match(word9?.explanationAr || '', /قِصر في زمن المد/);
});

test('7. Detects missing Qalqalah on Al-Ikhlas (أحدْ دون قلقلة)', () => {
  const result = analyzeRecitationLocally(ikhlasAyah1, 'قل هو الله أحدْ', 'intermediate', {
    durationMs: 2800,
    rmsVolume: 0.05,
    snrDb: 23,
    silenceIntervals: [],
    isSilent: false,
    isNoisy: false,
    clarityGrade: 'excellent'
  });

  assert.equal(result.khafiErrorsCount, 1, 'Must detect missing Qalqalah');
  assert.notEqual(result.overallScore, 100);
  const word4 = result.wordsEvaluation.find((w) => w.wordIndex === 4);
  assert.equal(word4?.status, 'warning');
  assert.equal(word4?.severity, 'khafi');
});

test('8. Detects cut Ghunnah on An-Nas (ٱلنَّاسِ بحركة واحدة بدل حركتين)', () => {
  const result = analyzeRecitationLocally(nasAyah1, 'قل أعوذ برب الناس', 'intermediate', {
    durationMs: 3100,
    rmsVolume: 0.05,
    snrDb: 24,
    silenceIntervals: [],
    vowelSustainedDurations: [
      { wordIndex: 4, durationMs: 250, estimatedHarakat: 0.9 } // Cut Ghunnah (0.9 harakat instead of 2!)
    ],
    isSilent: false,
    isNoisy: false,
    clarityGrade: 'excellent'
  });

  assert.equal(result.khafiErrorsCount, 1, 'Must detect cut Ghunnah');
  const word4 = result.wordsEvaluation.find((w) => w.wordIndex === 4);
  assert.equal(word4?.status, 'warning');
  assert.match(word4?.explanationAr || '', /زمن الغنة/);
});

test('9. Perfect recitation with valid acoustics gives honest score (<100%) and separated 4 dimensions', () => {
  const result = analyzeRecitationLocally(fatihahAyah7, 'صراط الذين أنعمت عليهم غير المغضوب عليهم ولا الضالين', 'intermediate', {
    durationMs: 5200,
    rmsVolume: 0.06,
    snrDb: 26,
    silenceIntervals: [{ startMs: 2400, endMs: 2900, durationMs: 500 }],
    vowelSustainedDurations: [
      { wordIndex: 9, durationMs: 1680, estimatedHarakat: 6.0 } // 6 Harakat for Madd Lazim
    ],
    isSilent: false,
    isNoisy: false,
    clarityGrade: 'excellent'
  });

  assert.equal(result.jaliErrorsCount, 0);
  assert.equal(result.khafiErrorsCount, 0);
  assert.equal(result.evaluationStatus, 'evaluated');
  assert.ok(result.overallScore! >= 90 && result.overallScore! <= 95, 'Score should be high (~94%) but never a fake infallible 100%');

  // Verify the 4 separate dimensions are present and realistic:
  assert.equal(result.scoresBreakdown.wordAlignmentScore, 100, 'Word alignment is 100% because all words exist');
  assert.ok(result.scoresBreakdown.pronunciationScore >= 90, 'Pronunciation is verified');
  assert.ok(result.scoresBreakdown.tajweedScore >= 90, 'Tajweed is verified');
  assert.ok(result.scoresBreakdown.recordingConfidence >= 80, 'Confidence is high');
});
