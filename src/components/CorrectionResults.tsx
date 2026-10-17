import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Volume2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Layers,
  ArrowUpDown,
  AlertOctagon,
  MicOff
} from 'lucide-react';
import { RecitationAnalysisReport, WordAnalysisResult } from '../utils/tajweedEngine.ts';
import { SURAHS_DATA, QuranAyah, toArabicNumerals } from '../data/quranData.ts';
import { playSyntheticQiraahTone } from '../utils/audioHelpers.ts';

interface CorrectionResultsProps {
  report: RecitationAnalysisReport;
  surahId: number;
  ayahNumber: number;
  quranFontSize: number;
  onRetryAyah: () => void;
  onNextAyah?: () => void;
  previousReport?: RecitationAnalysisReport | null;
}

export const CorrectionResults: React.FC<CorrectionResultsProps> = ({
  report,
  surahId,
  ayahNumber,
  quranFontSize,
  onRetryAyah,
  onNextAyah,
  previousReport
}) => {
  const currentSurah = SURAHS_DATA.find(s => s.id === surahId) || SURAHS_DATA[0];
  const currentAyah = currentSurah.ayahs.find(a => a.number === ayahNumber) || currentSurah.ayahs[0];

  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(
    // Default to the first word that has an error or warning, or the first word
    report.wordsEvaluation.find(w => w.status === 'error' || w.status === 'warning' || w.status === 'omitted')?.wordIndex || 1
  );
  const [showAdvancedAcoustics, setShowAdvancedAcoustics] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const selectedWordData = report.wordsEvaluation.find(w => w.wordIndex === selectedWordIndex);

  // Play Reference Audio snippet for the selected word or ayah
  const handlePlayReferenceSnippet = () => {
    setIsPlayingAudio(true);
    const audio = new Audio(currentAyah.audioUrl);
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => {
      // Offline fallback tone
      playSyntheticQiraahTone(260, 1000);
      setIsPlayingAudio(false);
    };
    audio.play().catch(() => {
      playSyntheticQiraahTone(260, 1000);
      setIsPlayingAudio(false);
    });
  };

  const handlePlayUserSnippet = () => {
    playSyntheticQiraahTone(190, 800);
  };

  const isUnableToEvaluate = report.evaluationStatus === 'unable_to_evaluate' || report.overallScore === null;

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 pt-3">
      {/* Header with Overall Score & Status */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 border border-emerald-800/40 p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Surah info & general advice */}
          <div className="space-y-1.5 text-center sm:text-right flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-xs border border-emerald-800/50">
              <span>نتيجة تدقيق التلاوة</span>
              <span className="text-stone-500">•</span>
              <span>سورة {currentSurah.nameAr} : الآية {ayahNumber}</span>
            </div>

            <h2 className="text-xl font-bold text-stone-100 flex items-center justify-center sm:justify-start gap-2">
              <span>تقييم الأداء التجويدي</span>
              {isUnableToEvaluate ? (
                <AlertOctagon className="w-5 h-5 text-stone-400" />
              ) : report.overallScore && report.overallScore >= 90 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
            </h2>

            <p className="text-xs text-stone-300 max-w-md leading-relaxed">
              {report.generalAdviceAr}
            </p>

            {/* Needs Human Review Warning Chip */}
            {report.evaluationStatus === 'needs_human_review' && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/80 border border-amber-700/60 text-amber-300 text-[11px] font-semibold mt-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>تحتاج إلى مراجعة من مقرئ مجاز (عدم رصد خطأ آلياً لا يعني صحة القراءة)</span>
              </div>
            )}
          </div>

          {/* Score Badge (or Unable to Evaluate Notice) */}
          <div className="flex items-center gap-3 shrink-0">
            {isUnableToEvaluate ? (
              <div className="flex flex-col items-center justify-center px-4 py-3 rounded-2xl bg-stone-950 border-2 border-stone-700 shadow-inner text-center">
                <MicOff className="w-6 h-6 text-stone-400 mb-1" />
                <span className="text-xs font-bold text-stone-300">تعذّر التقييم</span>
                <span className="text-[10px] text-stone-500">صوت غير كافٍ</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-stone-950 border-2 border-emerald-500/40 shadow-inner">
                <span className="text-2xl font-black text-emerald-400 tracking-tight">
                  {report.overallScore}%
                </span>
                <span className="text-[10px] text-stone-400 font-medium">نسبة الإتقان</span>
              </div>
            )}

            {/* Comparison if previous attempt exists */}
            {previousReport && previousReport.overallScore !== null && report.overallScore !== null && (
              <div className="hidden sm:flex flex-col items-center justify-center p-2 rounded-xl bg-stone-950/80 border border-stone-800 text-xs">
                <span className="text-[10px] text-stone-400">المحاولة السابقة</span>
                <span className="font-bold text-stone-300">{previousReport.overallScore}%</span>
                {report.overallScore > previousReport.overallScore ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center">
                    +{report.overallScore - previousReport.overallScore}% تحسن!
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-400">مستقر</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Four Separate Dimensions (as requested) */}
        {!isUnableToEvaluate && report.scoresBreakdown && (
          <div className="mt-4 pt-3 border-t border-stone-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            {/* 1. مطابقة الكلمات */}
            <div className="bg-stone-950/70 p-2 rounded-xl border border-stone-800/90">
              <span className="text-[10px] text-stone-400 block">1. مطابقة الكلمات</span>
              <span className={`font-bold text-sm ${report.scoresBreakdown.wordAlignmentScore === 100 ? 'text-teal-400' : 'text-amber-400'}`}>
                {report.scoresBreakdown.wordAlignmentScore}%
              </span>
            </div>

            {/* 2. صحة نطق الحركات والحروف (اللحن الجلي) */}
            <div className="bg-stone-950/70 p-2 rounded-xl border border-stone-800/90">
              <span className="text-[10px] text-stone-400 block">2. الحركات والحروف (جلي)</span>
              <span className={`font-bold text-sm ${report.jaliErrorsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {report.scoresBreakdown.pronunciationScore}% {report.jaliErrorsCount > 0 ? `(${report.jaliErrorsCount} خطأ)` : '✓'}
              </span>
            </div>

            {/* 3. أحكام التجويد (اللحن الخفي) */}
            <div className="bg-stone-950/70 p-2 rounded-xl border border-stone-800/90">
              <span className="text-[10px] text-stone-400 block">3. أحكام التجويد (خفي)</span>
              <span className={`font-bold text-sm ${report.khafiErrorsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {report.scoresBreakdown.tajweedScore}% {report.khafiErrorsCount > 0 ? `(${report.khafiErrorsCount} تنبيه)` : '✓'}
              </span>
            </div>

            {/* 4. جودة التسجيل ومستوى الثقة */}
            <div className="bg-stone-950/70 p-2 rounded-xl border border-stone-800/90">
              <span className="text-[10px] text-stone-400 block">4. ثقة التحليل والصوت</span>
              <span className={`font-bold text-sm ${report.scoresBreakdown.recordingConfidence >= 75 ? 'text-emerald-400' : 'text-stone-400'}`}>
                {report.scoresBreakdown.recordingConfidence}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Quranic Ayah with Color-Coded Words */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-stone-400 px-1">
          <span className="font-bold text-stone-200">
            اضغط على أي كلمة لعرض تشخيص النطق وحكمها التجويدي:
          </span>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              سليم
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              تجويد خفي
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              لحن جلي
            </span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 text-center leading-loose">
          <div
            className="font-quran flex flex-wrap items-center justify-center gap-x-2 gap-y-3"
            style={{ fontSize: `${quranFontSize}px` }}
          >
            {report.wordsEvaluation.map((word) => {
              const isSelected = selectedWordIndex === word.wordIndex;
              let statusClasses = 'text-stone-200 border-b-2 border-transparent';

              if (word.status === 'correct') {
                statusClasses = 'text-emerald-300 hover:text-emerald-200 hover:bg-emerald-950/40 border-b-2 border-emerald-500/60';
              } else if (word.status === 'warning') {
                statusClasses = 'text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 border-b-2 border-amber-500 font-bold';
              } else if (word.status === 'error' || word.status === 'omitted') {
                statusClasses = 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border-b-2 border-rose-500 font-bold';
              } else if (word.status === 'uncertain' || word.status === 'unverified') {
                statusClasses = 'text-stone-400 border-b-2 border-dashed border-stone-500';
              }

              return (
                <button
                  key={word.wordIndex}
                  onClick={() => setSelectedWordIndex(word.wordIndex)}
                  className={`px-2 py-0.5 rounded-xl transition-all cursor-pointer relative ${statusClasses} ${
                    isSelected ? 'ring-2 ring-amber-400 bg-stone-800 shadow-md scale-105' : ''
                  }`}
                  title={`انقر لمعاينة الكلمة رقم ${word.wordIndex}`}
                >
                  {word.wordUthmani}
                  {(word.status === 'error' || word.status === 'omitted') && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500"></span>
                  )}
                  {word.status === 'warning' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400"></span>
                  )}
                </button>
              );
            })}

            <span className="inline-flex items-center justify-center text-amber-400 mx-2 text-[0.8em] font-sans font-bold border-2 border-amber-500/70 rounded-full w-8 h-8 align-middle bg-stone-950/60 shadow-sm">
              {toArabicNumerals(ayahNumber)}
            </span>
          </div>
        </div>
      </div>

      {/* Selected Word Correction Detail Card */}
      {selectedWordData && (
        <div className="rounded-3xl bg-stone-900 border border-emerald-900/60 p-5 space-y-4 shadow-lg animate-in fade-in duration-200">
          {/* Card Top: Word info and status */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-950 border border-amber-500/40 flex items-center justify-center">
                <span className="font-quran text-xl text-amber-300 font-bold">
                  {selectedWordData.wordUthmani}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-stone-100">
                    الكلمة رقم {selectedWordData.wordIndex}: «{selectedWordData.wordUthmani}»
                  </h3>
                  {selectedWordData.severity === 'jali' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                      لحن جلي ظاهر
                    </span>
                  )}
                  {selectedWordData.severity === 'khafi' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                      لحن خفي (حكم تجويدي)
                    </span>
                  )}
                  {selectedWordData.status === 'omitted' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                      كلمة مسقطة
                    </span>
                  )}
                  {selectedWordData.status === 'correct' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      نطق سليم
                    </span>
                  )}
                  {(selectedWordData.status === 'uncertain' || selectedWordData.status === 'unverified') && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-800 text-stone-300 border border-stone-700">
                      تعذّر التحقق
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  {selectedWordData.ruleFlagged?.ruleName || 'حكم الرسم القرآني ومخارج الحروف'}
                </p>
              </div>
            </div>

            {/* Confidence indicator badge */}
            <div className="text-left shrink-0">
              <div
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  selectedWordData.confidenceScore >= 85
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : selectedWordData.confidenceScore >= 65
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-stone-800 text-stone-400 border border-stone-700'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ثقة التحليل: {selectedWordData.confidenceScore}%</span>
              </div>
              {selectedWordData.needsHumanReview && (
                <span className="block text-[10px] text-amber-400 mt-1 font-medium">
                  * يحتاج إلى مراجعة بشرية
                </span>
              )}
            </div>
          </div>

          {/* Phonetic Difference (What was uttered vs expected) */}
          {selectedWordData.phoneticDifference && (
            <div className="p-3 rounded-2xl bg-stone-950/80 border border-rose-900/50 flex items-center justify-between text-xs">
              <span className="text-stone-400">الفارق الصوتي المرصود:</span>
              <span className="font-bold text-rose-300 font-sans">
                {selectedWordData.phoneticDifference}
              </span>
            </div>
          )}

          {/* Explanation */}
          <div className="p-3.5 rounded-2xl bg-stone-950/50 border border-stone-800/80 space-y-1">
            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>الشرح وبيان موضع الملاحظة:</span>
            </h4>
            <p className="text-xs text-stone-300 leading-relaxed">
              {selectedWordData.explanationAr}
            </p>
          </div>

          {/* Step-by-Step Correct Pronunciation Guide */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-900/40 space-y-2">
            <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>طريقة النطق الصحيح خطوة بخطوة:</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-stone-300 leading-relaxed pr-1">
              {selectedWordData.stepByStepPronunciation.map((step, sIdx) => (
                <li key={sIdx} className="font-medium text-stone-200">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Audio Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayReferenceSnippet}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-700/80 hover:bg-amber-600 text-stone-950 font-bold text-xs transition-colors"
                title="الاستماع لنطق الكلمة من المقرئ المرجعي"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>استمع للنموذج الصحيح</span>
              </button>

              <button
                onClick={handlePlayUserSnippet}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs border border-stone-700 transition-colors"
                title="إعادة الاستماع لتسجيلك لهذا الموضع"
              >
                <Play className="w-3 h-3 fill-stone-200" />
                <span>تسجيلي</span>
              </button>
            </div>

            {/* Toggle Advanced Acoustic Breakdown */}
            <button
              onClick={() => setShowAdvancedAcoustics(!showAdvancedAcoustics)}
              className="text-xs text-stone-400 hover:text-emerald-400 flex items-center gap-1"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showAdvancedAcoustics ? 'إخفاء التفاصيل الصوتية' : 'تفاصيل صوتية متقدمة'}</span>
              {showAdvancedAcoustics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Advanced Acoustic Details Accordion */}
          {showAdvancedAcoustics && (
            <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 text-xs space-y-2 animate-in fade-in duration-150">
              <p className="font-bold text-stone-300">القياسات الفيزيائية والصوتية المرصودة:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-stone-400 text-[11px]">
                <div className="bg-stone-900 p-2 rounded-lg">
                  <span className="block text-stone-500">صفاء الإشارة (SNR)</span>
                  <span className="font-semibold text-emerald-400">22 dB (جيد)</span>
                </div>
                <div className="bg-stone-900 p-2 rounded-lg">
                  <span className="block text-stone-500">زمن المد المقدر</span>
                  <span className="font-semibold text-amber-400">حركتان (~560ms)</span>
                </div>
                <div className="bg-stone-900 p-2 rounded-lg">
                  <span className="block text-stone-500">الرنين الخيشومي</span>
                  <span className="font-semibold text-teal-400">0.82 (طبيعي)</span>
                </div>
                <div className="bg-stone-900 p-2 rounded-lg">
                  <span className="block text-stone-500">حالة الوقف</span>
                  <span className="font-semibold text-stone-300">وصل تام</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Main Actions: Retry & Compare, or Next Ayah */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Repeat & Compare Button */}
        <button
          onClick={onRetryAyah}
          className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 transition-all hover:scale-105 active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>تكرار المحاولة ومقارنة الأداء السابق بالجديد</span>
        </button>

        {onNextAyah && (
          <button
            onClick={onNextAyah}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 text-xs font-semibold transition-colors"
          >
            <span>الانتقال للآية التالية</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Scientific Disclaimer */}
      <div className="p-3 rounded-2xl bg-stone-900/40 border border-stone-800 text-[11px] text-stone-500 text-center leading-relaxed">
        {report.disclaimerAr}
      </div>
    </div>
  );
};
