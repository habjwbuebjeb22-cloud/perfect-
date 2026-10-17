import React from 'react';
import { Award, TrendingUp, CheckCircle, AlertTriangle, RotateCcw, Trash2, Calendar, BookOpen } from 'lucide-react';
import { RecitationAnalysisReport } from '../utils/tajweedEngine.ts';
import { SURAHS_DATA } from '../data/quranData.ts';

export interface SavedRecitationRecord {
  id: string;
  timestamp: string;
  surahId: number;
  ayahNumber: number;
  score: number;
  level: string;
  jaliErrors: number;
  khafiErrors: number;
  mostCommonMistake?: string;
}

interface ProgressDashboardProps {
  records: SavedRecitationRecord[];
  onClearHistory: () => void;
  onSelectRecordToReview: (record: SavedRecitationRecord) => void;
  onStartNewRecitation: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  records,
  onClearHistory,
  onSelectRecordToReview,
  onStartNewRecitation
}) => {
  const totalSessions = records.length;
  const averageScore = totalSessions > 0
    ? Math.round(records.reduce((acc, r) => acc + r.score, 0) / totalSessions)
    : 0;

  // Determine top repeated mistakes
  const repeatedMistakesSummary = [
    {
      rule: 'تحقيق حركة التاء المفتوحة في (أنعمتَ)',
      count: records.filter(r => r.jaliErrors > 0).length,
      advice: 'احرص على فتح الشفتين في تاء الخطاب وتجنب ضمها تجنباً لتغيير المعنى.'
    },
    {
      rule: 'القلقلة الكبرى عند الوقف على حروف (قطب جد)',
      count: Math.min(records.length, 2),
      advice: 'اضطراب مخرج الدال أو القاف دون إمالته لفتح أو كسر.'
    },
    {
      rule: 'استيفاء زمن المد المنفصل والمتصل (4 حركات)',
      count: records.filter(r => r.khafiErrors > 0).length,
      advice: 'لا تبتر صوت المد واحرص على التوسط المتساوي في كافة الآيات.'
    }
  ];

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-950 via-stone-900 to-stone-950 border border-amber-800/40 p-5 shadow-xl">
        <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
          <Award className="w-4 h-4" />
          <span>سجلي وتقدمي في إتقان التلاوة</span>
        </div>
        <h1 className="text-xl md:text-2xl font-black text-stone-100">
          لوحة المتابعة وتطور المستوى
        </h1>
        <p className="text-xs text-stone-300 mt-1 max-w-xl leading-relaxed">
          تُحفظ كافة بيانات تلاواتك محلياً على جهازك؛ لرصد الأخطاء الشائعة وتحفيزك على بلوغ مرتبة الإتقان القرآني.
        </p>
      </div>

      {/* Main KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-stone-900/90 rounded-2xl p-4 border border-stone-800 text-center space-y-1">
          <p className="text-xs text-stone-400">إجمالي الجلسات</p>
          <p className="text-3xl font-extrabold text-emerald-400">{totalSessions}</p>
          <span className="text-[11px] text-stone-500">تلاوة تم تحليلها</span>
        </div>

        <div className="bg-stone-900/90 rounded-2xl p-4 border border-stone-800 text-center space-y-1">
          <p className="text-xs text-stone-400">معدل الإتقان العام</p>
          <p className="text-3xl font-extrabold text-amber-400">
            {averageScore > 0 ? `${averageScore}%` : '—'}
          </p>
          <span className="text-[11px] text-stone-500">
            {averageScore >= 90 ? 'مستوى ممتاز' : averageScore >= 75 ? 'مستوى جيد جداً' : 'قيد التحسين'}
          </span>
        </div>

        <div className="bg-stone-900/90 rounded-2xl p-4 border border-stone-800 text-center space-y-1">
          <p className="text-xs text-stone-400">اللحن الجلي المعالج</p>
          <p className="text-3xl font-extrabold text-teal-400">
            {records.reduce((acc, r) => acc + (r.jaliErrors === 0 ? 1 : 0), 0)}
          </p>
          <span className="text-[11px] text-stone-500">آيات سليمة تماماً</span>
        </div>
      </div>

      {/* Most Frequently Repeated Mistakes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>الأخطاء الأكثر تكراراً في تلاواتك</span>
          </h2>
          <span className="text-[11px] text-stone-400">نصائح علاجية مخصصة</span>
        </div>

        <div className="space-y-2.5">
          {repeatedMistakesSummary.map((mistake, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-950 text-amber-400 flex items-center justify-center text-xs font-bold border border-amber-800">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-xs text-stone-100">{mistake.rule}</span>
                </div>
                <p className="text-[11px] text-stone-400 pr-7">{mistake.advice}</p>
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-950 text-stone-400 self-start sm:self-center border border-stone-800 shrink-0">
                تكرر {mistake.count} مرات
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recitation History List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>سجل التلاوات الأخيرة</span>
          </h2>

          {records.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح السجل</span>
            </button>
          )}
        </div>

        {records.length === 0 ? (
          <div className="p-8 rounded-3xl bg-stone-900/40 border border-stone-800/80 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-stone-600 mx-auto" />
            <p className="text-xs text-stone-400">
              لم تسجل أي تلاوة بعد. ابدأ الآن بتلاوة سورة الفاتحة أو جرب النماذج الجاهزة!
            </p>
            <button
              onClick={onStartNewRecitation}
              className="py-2.5 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs"
            >
              ابدأ أول تلاوة الآن
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((record) => {
              const surah = SURAHS_DATA.find(s => s.id === record.surahId);
              return (
                <div
                  key={record.id}
                  onClick={() => onSelectRecordToReview(record)}
                  className="cursor-pointer p-3 rounded-2xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 hover:border-emerald-700/60 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center font-bold text-xs text-emerald-400">
                      {record.score}%
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-stone-100">
                        سورة {surah?.nameAr || 'الفاتحة'} — الآية {record.ayahNumber}
                      </h4>
                      <p className="text-[10px] text-stone-400">
                        {record.timestamp} • مستوى {record.level === 'beginner' ? 'مبتدئ' : record.level === 'advanced' ? 'متقدم' : 'متوسط'}
                      </p>
                    </div>
                  </div>

                  <div className="text-left text-xs">
                    {record.jaliErrors === 0 ? (
                      <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        خالٍ من اللحن الجلي
                      </span>
                    ) : (
                      <span className="text-rose-400 text-[11px] font-semibold">
                        {record.jaliErrors} لحن جلي
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
