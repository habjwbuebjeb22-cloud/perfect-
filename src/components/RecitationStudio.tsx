import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SURAHS_DATA, QuranSurah, QuranAyah, TAJWEED_CATEGORIES, PRELOADED_TEST_RECITATIONS, toArabicNumerals } from '../data/quranData.ts';
import { UserProficiencyLevel } from '../utils/tajweedEngine.ts';
import { RecitationRecorder, BrowserSpeechTranscriber, playSyntheticQiraahTone } from '../utils/audioHelpers.ts';

interface RecitationStudioProps {
  currentSurahId: number;
  currentAyahNumber: number;
  quranFontSize: number;
  proficiencyLevel: UserProficiencyLevel;
  onChangeLevel: (level: UserProficiencyLevel) => void;
  onSelectSurah: (id: number) => void;
  onSelectAyah: (number: number) => void;
  onStartAnalysis: (params: {
    audioBase64?: string;
    mimeType?: string;
    transcriptionFallback?: string;
    level: UserProficiencyLevel;
    focusCategory: string;
    acousticMetrics?: any;
    sampleId?: string;
  }) => void;
  isAnalyzing: boolean;
}

export const RecitationStudio: React.FC<RecitationStudioProps> = ({
  currentSurahId,
  currentAyahNumber,
  quranFontSize,
  proficiencyLevel,
  onChangeLevel,
  onSelectSurah,
  onSelectAyah,
  onStartAnalysis,
  isAnalyzing
}) => {
  const currentSurah = SURAHS_DATA.find(s => s.id === currentSurahId) || SURAHS_DATA[0];
  const currentAyah = currentSurah.ayahs.find(a => a.number === currentAyahNumber) || currentSurah.ayahs[0];

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBase64, setRecordedAudioBase64] = useState<string | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('audio/webm');
  const [spokenTranscription, setSpokenTranscription] = useState<string>('');
  const [selectedFocusRule, setSelectedFocusRule] = useState<string>('all');
  const [isPlayingReference, setIsPlayingReference] = useState(false);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState<'after' | 'instant'>('after');
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Audio references
  const recorderRef = useRef<RecitationRecorder | null>(null);
  const transcriberRef = useRef<BrowserSpeechTranscriber | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Stop recording timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recorderRef.current) recorderRef.current.stop();
      if (transcriberRef.current) transcriberRef.current.stop();
    };
  }, []);

  // Handle Reference Audio play/pause
  const togglePlayReference = () => {
    if (isPlayingReference) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      }
      setIsPlayingReference(false);
    } else {
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio(currentAyah.audioUrl);
        audioPlayerRef.current.onended = () => setIsPlayingReference(false);
        audioPlayerRef.current.onerror = () => {
          setIsPlayingReference(false);
          // Fallback pleasant vocal tone simulation
          playSyntheticQiraahTone(220, 1200);
        };
      } else {
        audioPlayerRef.current.src = currentAyah.audioUrl;
      }
      audioPlayerRef.current.play().then(() => {
        setIsPlayingReference(true);
      }).catch((e) => {
        console.warn('Reference audio playback blocked or failed, playing synthesis fallback:', e);
        playSyntheticQiraahTone(240, 1500);
        setIsPlayingReference(true);
        setTimeout(() => setIsPlayingReference(false), 1500);
      });
    }
  };

  // Toggle User Recorded Audio
  const togglePlayUserAudio = () => {
    if (!recordedAudioUrl) return;
    if (isPlayingUserAudio) {
      if (userAudioPlayerRef.current) {
        userAudioPlayerRef.current.pause();
        userAudioPlayerRef.current.currentTime = 0;
      }
      setIsPlayingUserAudio(false);
    } else {
      if (!userAudioPlayerRef.current) {
        userAudioPlayerRef.current = new Audio(recordedAudioUrl);
        userAudioPlayerRef.current.onended = () => setIsPlayingUserAudio(false);
      } else {
        userAudioPlayerRef.current.src = recordedAudioUrl;
      }
      userAudioPlayerRef.current.play().then(() => {
        setIsPlayingUserAudio(true);
      }).catch(() => setIsPlayingUserAudio(false));
    }
  };

  // Handle Recording Start/Stop
  const handleToggleRecord = async () => {
    if (isRecording) {
      // Stop recording
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsRecording(false);

      const transcribed = transcriberRef.current?.stop() || '';
      setSpokenTranscription(transcribed);

      if (recorderRef.current) {
        const result = await recorderRef.current.stop();
        if (result.base64) {
          setRecordedAudioBase64(result.base64);
          setRecordedMimeType(result.mimeType || 'audio/webm');
          setRecordedAcoustics(result.acousticMetrics || null);
          const url = URL.createObjectURL(result.blob);
          setRecordedAudioUrl(url);

          // If instant feedback is active, trigger analysis immediately!
          if (feedbackMode === 'instant') {
            onStartAnalysis({
              audioBase64: result.base64,
              mimeType: result.mimeType || 'audio/webm',
              transcriptionFallback: transcribed,
              level: proficiencyLevel,
              focusCategory: selectedFocusRule,
              acousticMetrics: result.acousticMetrics || { durationMs: result.durationMs, snrDb: result.snrDb }
            });
          }
        }
      }
    } else {
      // Start recording
      setRecordedAudioUrl(null);
      setRecordedAudioBase64(null);
      setSpokenTranscription('');
      setRecordingSeconds(0);

      const recorder = new RecitationRecorder();
      recorderRef.current = recorder;

      const transcriber = new BrowserSpeechTranscriber();
      transcriberRef.current = transcriber;
      transcriber.start();

      const started = await recorder.start((dataArray) => {
        // Draw real-time audio waveform on canvas
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const barWidth = (width / dataArray.length) * 2.5;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const barHeight = (dataArray[i] / 255) * height;
          // Gradient from emerald to amber
          ctx.fillStyle = dataArray[i] > 180 ? '#f59e0b' : '#10b981';
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
      });

      if (started) {
        setIsRecording(true);
        timerIntervalRef.current = setInterval(() => {
          setRecordingSeconds(s => s + 1);
        }, 1000);
      } else {
        alert('يرجى السماح بالوصول إلى الميكروفون للبدء في الاستماع للتلاوة، أو يمكنك استخدام التلاوات التجريبية المدمجة.');
      }
    }
  };

  // Ayah navigation
  const prevAyah = () => {
    if (currentAyahNumber > 1) {
      onSelectAyah(currentAyahNumber - 1);
    }
  };

  const nextAyah = () => {
    if (currentAyahNumber < currentSurah.ayahs.length) {
      onSelectAyah(currentAyahNumber + 1);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 flex flex-col justify-between">
      {/* Top Header & Surah Selector */}
      <div className="space-y-3">
        {/* Surah & Ayah Picker Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-900/90 p-2.5 rounded-2xl border border-stone-800">
          <div className="flex items-center gap-1.5 flex-1 min-w-[130px]">
            <select
              id="surah-select"
              aria-label="اختيار السورة"
              value={currentSurahId}
              onChange={(e) => {
                onSelectSurah(Number(e.target.value));
                onSelectAyah(1);
              }}
              className="bg-stone-950 border border-emerald-900/80 rounded-xl px-2 py-1 text-xs font-bold text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full"
            >
              {SURAHS_DATA.map(s => (
                <option key={s.id} value={s.id}>
                  {s.id}. سورة {s.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Ayah Stepper */}
          <div className="flex items-center gap-1">
            <button
              onClick={nextAyah}
              disabled={currentAyahNumber >= currentSurah.ayahs.length}
              aria-label="الآية التالية"
              title="الآية التالية"
              className="p-1 rounded-lg bg-stone-950 text-stone-300 hover:text-emerald-400 disabled:opacity-30 border border-stone-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-bold px-2 py-1 bg-stone-950 rounded-lg text-amber-300 border border-stone-800 whitespace-nowrap">
              آية {currentAyahNumber}/{currentSurah.ayahs.length}
            </span>
            <button
              onClick={prevAyah}
              disabled={currentAyahNumber <= 1}
              aria-label="الآية السابقة"
              title="الآية السابقة"
              className="p-1 rounded-lg bg-stone-950 text-stone-300 hover:text-emerald-400 disabled:opacity-30 border border-stone-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Tuning / Level Drawer Toggle */}
            <button
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              aria-label="إعدادات المستوى والتجويد"
              className="p-1.5 rounded-lg bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-800 text-xs flex items-center gap-1"
              title="إعدادات المستوى والتركيز"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Collapsible Tuning Options */}
        {showSettingsDrawer && (
          <div className="p-3.5 rounded-2xl bg-stone-900 border border-emerald-900/60 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Level Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1.5">
                  المستوى التعليمي:
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {(['beginner', 'intermediate', 'advanced'] as UserProficiencyLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => onChangeLevel(lvl)}
                      className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-all ${
                        proficiencyLevel === lvl
                          ? 'bg-emerald-800 text-emerald-100 border-emerald-500 font-bold'
                          : 'bg-stone-950 text-stone-400 border-stone-800 hover:bg-stone-800'
                      }`}
                    >
                      {lvl === 'beginner' && 'مبتدئ'}
                      {lvl === 'intermediate' && 'متوسط'}
                      {lvl === 'advanced' && 'متقدم'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  {proficiencyLevel === 'beginner' && 'يركز على اللحن الجلي وتبديل الحركات والحروف.'}
                  {proficiencyLevel === 'intermediate' && 'يقيس مقادير المدود وأحكام النون والتنوين.'}
                  {proficiencyLevel === 'advanced' && 'يدقق في مراتب التفخيم والغنات وأدق الملاحظات.'}
                </p>
              </div>

              {/* Tajweed Focus Category */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1.5">
                  التركيز على حكم محدد (اختياري):
                </label>
                <select
                  value={selectedFocusRule}
                  onChange={(e) => setSelectedFocusRule(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {TAJWEED_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.nameAr}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Instant vs Post Recitation Toggle */}
            <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs">
              <span className="text-stone-300">طريقة إظهار الملاحظات:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFeedbackMode('after')}
                  className={`px-2.5 py-1 rounded-md text-[11px] ${
                    feedbackMode === 'after'
                      ? 'bg-emerald-900 text-emerald-200 border border-emerald-700'
                      : 'text-stone-400 hover:bg-stone-800'
                  }`}
                >
                  بعد انتهاء التلاوة (مستحسن)
                </button>
                <button
                  onClick={() => setFeedbackMode('instant')}
                  className={`px-2.5 py-1 rounded-md text-[11px] ${
                    feedbackMode === 'instant'
                      ? 'bg-emerald-900 text-emerald-200 border border-emerald-700'
                      : 'text-stone-400 hover:bg-stone-800'
                  }`}
                >
                  مباشرة فور الوقف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* The Majestic Quranic Text Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 border border-amber-600/30 p-6 md:p-8 shadow-xl text-center">
          {/* Subtle Islamic corner ornaments */}
          <div className="absolute top-2 right-2 text-amber-500/30 text-xs select-none">۞</div>
          <div className="absolute top-2 left-2 text-amber-500/30 text-xs select-none">۞</div>
          <div className="absolute bottom-2 right-2 text-amber-500/30 text-xs select-none">۞</div>
          <div className="absolute bottom-2 left-2 text-amber-500/30 text-xs select-none">۞</div>

          {/* Surah Name Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs mb-4">
            <span>سورة {currentSurah.nameAr}</span>
            <span className="text-stone-500">•</span>
            <span className="text-amber-400">الآية {currentAyah.number}</span>
          </div>

          {/* Ayah Text in Uthmanic Font with dynamic size */}
          <div
            className="font-quran leading-loose text-stone-100 px-2 py-3 select-text tracking-wide"
            style={{ fontSize: `${quranFontSize}px` }}
          >
            {currentAyah.textUthmani}
            <span className="inline-flex items-center justify-center text-amber-400 mx-2 text-[0.8em] font-sans font-bold border-2 border-amber-500/70 rounded-full w-8 h-8 align-middle bg-stone-950/60 shadow-sm">
              {toArabicNumerals(currentAyah.number)}
            </span>
          </div>

          {/* Reference Recitation Control */}
          <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-center gap-3">
            <button
              onClick={togglePlayReference}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                isPlayingReference
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-stone-800/90 hover:bg-stone-700 text-amber-300 border border-amber-600/40'
              }`}
            >
              {isPlayingReference ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-amber-300" />}
              <span>{isPlayingReference ? 'إيقاف النموذج' : 'استمع للنموذج المرجعي الصحيح (الشيخ مشاري)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audio Waveform Canvas (when recording) */}
      <div className="h-14 w-full bg-stone-900/60 rounded-2xl border border-stone-800/80 flex items-center justify-center overflow-hidden px-4">
        {isRecording ? (
          <canvas ref={canvasRef} width={380} height={48} className="w-full h-12" />
        ) : recordedAudioUrl ? (
          <div className="flex items-center justify-between w-full text-xs text-stone-300">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              تم تسجيل التلاوة بنجاح ({recordingSeconds || '3'} ثوانٍ)
            </span>
            <button
              onClick={togglePlayUserAudio}
              className="flex items-center gap-1 bg-stone-800 hover:bg-stone-700 px-3 py-1 rounded-lg text-stone-200 border border-stone-700"
            >
              {isPlayingUserAudio ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-stone-200" />}
              <span>{isPlayingUserAudio ? 'إيقاف' : 'إعادة الاستماع لتسجيلي'}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-stone-500 text-xs">
            <Volume2 className="w-4 h-4 text-emerald-500/60" />
            <span>اضغط على الميكروفون بالأسفل وابدأ القراءة بتأنٍ وترتيل</span>
          </div>
        )}
      </div>

      {/* Main Recording & Action Controller */}
      <div className="space-y-4">
        {/* Big Mic Button */}
        <div className="flex flex-col items-center justify-center">
          <button
            onClick={handleToggleRecord}
            disabled={isAnalyzing}
            aria-label={isRecording ? 'إيقاف التسجيل وبدء التحليل' : 'بدء تسجيل تلاوتي'}
            className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all shadow-2xl ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-500 text-white scale-110 shadow-rose-900/80 ring-4 ring-rose-500/50 animate-pulse'
                : 'bg-gradient-to-tr from-emerald-700 to-emerald-500 hover:from-emerald-600 hover:to-emerald-400 text-white shadow-emerald-950/80 hover:scale-105 active:scale-95 border-2 border-emerald-400/40'
            }`}
          >
            {isRecording ? (
              <Square className="w-7 h-7 fill-white" />
            ) : (
              <Mic className="w-8 h-8 text-amber-300" />
            )}
          </button>

          <p className="mt-2 text-xs font-semibold text-stone-300">
            {isRecording ? (
              <span className="text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                جارٍ الاستماع للتلاوة... ({recordingSeconds} ث)
              </span>
            ) : (
              <span>اضغط للتسجيل الصوتي المباشر</span>
            )}
          </p>
        </div>

        {/* Trigger Analysis Button (when recording exists or fallback) */}
        {(recordedAudioBase64 || recordedAudioUrl) && (
          <div className="flex items-center justify-center gap-2 pt-1 animate-in fade-in duration-300">
            <button
              onClick={() => {
                onStartAnalysis({
                  audioBase64: recordedAudioBase64 || undefined,
                  mimeType: recordedMimeType || 'audio/webm',
                  transcriptionFallback: spokenTranscription || undefined,
                  level: proficiencyLevel,
                  focusCategory: selectedFocusRule,
                  acousticMetrics: { durationMs: recordingSeconds * 1000, snrDb: 22 }
                });
              }}
              disabled={isAnalyzing}
              className="flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-sm shadow-xl shadow-amber-950/60 transition-all hover:scale-[1.02] border border-amber-300/40 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>جارٍ تدقيق التلاوة وتحليل الأحكام...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>حلل تلاوتي واكتشف الأخطاء الآن</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Quick Preloaded Recitation Samples Launcher */}
        <div className="bg-stone-900/60 p-3 rounded-2xl border border-stone-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="font-semibold text-stone-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              أو جرّب فوراً بنموذج جاهز (دون حاجة لميكروفون):
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => {
                onStartAnalysis({
                  sampleId: 'sample_fatihah_perfect',
                  level: proficiencyLevel,
                  focusCategory: selectedFocusRule
                });
              }}
              className="p-2 rounded-xl bg-stone-950 hover:bg-stone-900 border border-emerald-900/60 text-right text-stone-300 hover:text-emerald-300 transition-colors flex items-center justify-between"
            >
              <span className="font-medium">1. قراءة متقنة 100%</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded">صحيح</span>
            </button>

            <button
              onClick={() => {
                onStartAnalysis({
                  sampleId: 'sample_fatihah_lahn_jali',
                  level: proficiencyLevel,
                  focusCategory: selectedFocusRule
                });
              }}
              className="p-2 rounded-xl bg-stone-950 hover:bg-stone-900 border border-rose-900/60 text-right text-stone-300 hover:text-rose-300 transition-colors flex items-center justify-between"
            >
              <span className="font-medium">2. لحن جلي (أنعمتُ)</span>
              <span className="text-[10px] bg-rose-950 text-rose-400 px-1.5 py-0.5 rounded">خطأ جلي</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
