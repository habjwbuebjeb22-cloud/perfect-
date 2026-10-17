import React from 'react';
import { Mic, BookOpen, Award, CheckCircle2, AlertTriangle, ShieldCheck, Play, ArrowLeft, Sparkles, Volume2 } from 'lucide-react';
import { SURAHS_DATA, PRELOADED_TEST_RECITATIONS } from '../data/quranData.ts';
import { AppTab } from './Navbar.tsx';

interface HomeScreenProps {
  onSelectTab: (tab: AppTab) => void;
  onSelectSurahAndAyah: (surahId: number, ayahNumber: number) => void;
  onLaunchPreloadedTest: (testId: string) => void;
  userStats: {
    totalSessions: number;
    averageScore: number;
    completedAyahsCount: number;
  };
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectTab,
  onSelectSurahAndAyah,
  onLaunchPreloadedTest,
  userStats
}) => {
  return (
    <div className="flex-1 p-4 md:p-6 space-y-6">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-950 border border-emerald-800/40 p-5 md:p-7 shadow-xl shadow-emerald-950/40">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-600/40 text-emerald-300 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>نظام تعليم التلاوة بالذكاء الاصطناعي — رواية حفص عن عاصم</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-stone-100 tracking-tight leading-snug">
            تطبيق <span className="text-emerald-400">«مُتقِن»</span>
            <span className="block text-base md:text-lg font-medium text-amber-300/90 mt-1">
              معلّم القرآن والتجويد الذكي
            </span>
          </h1>

          <p className="text-xs md:text-sm text-stone-300 max-w-xl leading-relaxed">
            يستمع إلى تلاوتك بدقة، ويحدد موضع الخطأ على مستوى الآية والكلمة والحرف، مع تمييز دقيق بين اللحن الجلي والخفي، وشرح مبسط لطريقة النطق الصحيح دون تشتيت أو إعلانات.
          </p>

          {/* 3 Main Action Buttons as explicitly requested */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Primary Action Button: ابدأ التلاوة */}
            <button
              onClick={() => onSelectTab('recite')}
              className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-900/60 transition-all hover:scale-[1.02] active:scale-[0.98] border border-emerald-400/30"
            >
              <Mic className="w-5 h-5 text-amber-300 animate-pulse" />
              <span>ابدأ التلاوة</span>
              <ArrowLeft className="w-4 h-4 opacity-80" />
            </button>

            {/* Action 2: تعلّم التجويد */}
            <button
              onClick={() => onSelectTab('learn')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-emerald-300 font-semibold text-sm border border-emerald-800/60 transition-all hover:scale-[1.01]"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>تعلّم التجويد</span>
            </button>

            {/* Action 3: سجلي وتقدمي */}
            <button
              onClick={() => onSelectTab('progress')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-semibold text-sm border border-amber-800/40 transition-all hover:scale-[1.01]"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>سجلي وتقدمي</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Summary Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-stone-900/90 rounded-2xl p-3 border border-stone-800 text-center">
          <p className="text-[11px] text-stone-400">التلاوات المحللة</p>
          <p className="text-xl font-bold text-emerald-400 mt-0.5">{userStats.totalSessions}</p>
        </div>
        <div className="bg-stone-900/90 rounded-2xl p-3 border border-stone-800 text-center">
          <p className="text-[11px] text-stone-400">متوسط الإتقان</p>
          <p className="text-xl font-bold text-amber-400 mt-0.5">{userStats.averageScore > 0 ? `${userStats.averageScore}%` : '—'}</p>
        </div>
        <div className="bg-stone-900/90 rounded-2xl p-3 border border-stone-800 text-center">
          <p className="text-[11px] text-stone-400">الآيات المتدرب عليها</p>
          <p className="text-xl font-bold text-teal-400 mt-0.5">{userStats.completedAyahsCount}</p>
        </div>
      </div>

      {/* Quick Surah Selection Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            اختر سورة لبدء الاستماع والتصحيح
          </h2>
          <span className="text-[11px] text-stone-400">رواية حفص عن عاصم</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SURAHS_DATA.map((surah) => (
            <div
              key={surah.id}
              onClick={() => {
                onSelectSurahAndAyah(surah.id, 1);
                onSelectTab('recite');
              }}
              className="group cursor-pointer bg-stone-900/90 hover:bg-stone-800/90 p-4 rounded-2xl border border-stone-800 hover:border-emerald-700/60 transition-all flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/50 flex items-center justify-center font-bold text-sm text-emerald-400 group-hover:bg-emerald-900 transition-colors">
                  {surah.id}
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-100 group-hover:text-emerald-300 transition-colors">
                    سورة {surah.nameAr}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {surah.totalAyahs} آيات • {surah.type}
                  </p>
                </div>
              </div>

              <div className="text-left text-xs text-stone-400 group-hover:text-emerald-400 flex items-center gap-1">
                <span>تلاوة</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instant Test Recitations (اختبر النظام فوراً بتلاوات مسجلة مسبقاً) */}
      <div className="space-y-3 bg-stone-900/60 rounded-3xl p-4 border border-stone-800/80">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-amber-400" />
              تجارب فورية: اختبر دقة التحليل على تلاوات صحيحة وأخرى بأخطاء معروفة
            </h2>
            <p className="text-[11px] text-stone-400 mt-0.5">
              انقر على أي نموذج لتشغيل التحليل الفوري ورؤية كشف الأخطاء التجويدية واللحن الجلي خطوة بخطوة
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {PRELOADED_TEST_RECITATIONS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onLaunchPreloadedTest(sample.id)}
              className="text-right p-3 rounded-xl bg-stone-950/80 hover:bg-stone-900 border border-stone-800 hover:border-amber-600/40 transition-all flex flex-col justify-between space-y-2 group"
            >
              <div className="flex items-start justify-between w-full">
                <span className="font-bold text-xs text-stone-200 group-hover:text-amber-300 transition-colors">
                  {sample.titleAr}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 mr-2 ${
                    sample.type === 'perfect'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {sample.type === 'perfect' ? 'نموذج متقن 100%' : 'يحوي أخطاء'}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 leading-snug">
                {sample.descriptionAr}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-amber-400/90 font-medium pt-1">
                <Play className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>تحليل هذا النموذج الآن</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quality & Methodology Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="p-3.5 rounded-2xl bg-stone-900/40 border border-stone-800/80 space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>عدم اختلاق أخطاء</span>
          </div>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            يُظهر التطبيق «تعذّر التأكد» عند الضوضاء، ولا يدعي خطأ في القراءة دون ثقة كافية.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-stone-900/40 border border-stone-800/80 space-y-1">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>تمييز اللحن الجلي والخفي</span>
          </div>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            فصل تعليمي بين أخطاء تبديل الحروف والحركات، وأحكام المدود والغنات الدقيقة.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-stone-900/40 border border-stone-800/80 space-y-1">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>مجاني وخصوصية كاملة</span>
          </div>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            لا تُرفع تسجيلاتك لأي خوادم خارجية دون إذنك، ويعمل محلياً دون اشتراكات إجبارية.
          </p>
        </div>
      </div>
    </div>
  );
};
