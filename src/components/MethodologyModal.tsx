import React from 'react';
import { ShieldCheck, CheckCircle2, Clock, AlertCircle, Cpu, WifiOff, HeartHandshake, BookOpen } from 'lucide-react';

export const MethodologyModal: React.FC = () => {
  const supportedNow = [
    {
      title: 'أخطاء الحروف والنطق (اللحن الجلي)',
      status: 'مدعوم بدقة عالية',
      desc: 'إبدال الحروف المتقاربة (مثل ذ/ز، ض/د، ط/ت، ق/ك)، وحذف الحروف، أو زيادتها، وتغيير الحركات الإعرابية كحركة تاء (أنعمتَ).'
    },
    {
      title: 'مقادير أزمنة المدود (طبيعي 2، متصل ومنفصل 4-5، لازم 6)',
      status: 'مدعوم بالتحليل الصوتي',
      desc: 'قياس مدة امتداد الصوت الصائت بالميللي ثانية وتحويلها إلى حركات زمنية تقريبية مقارنة بسرعة الترتيل.'
    },
    {
      title: 'أحكام النون الساكنة والتنوين',
      status: 'مدعوم بحسب الوضوح',
      desc: 'الإظهار الحلقي، الإدغام بغنة وبغير غنة، الإقلاب، والإخفاء الحقيقي مع فحص تواجد رنين الغنة.'
    },
    {
      title: 'القلقلة (قطب جد)',
      status: 'مدعوم عند الوقف والوصل',
      desc: 'رصد حدوث اضطراب المخرج عند سكون حروف القلقلة، مع تنبيه إذا تم حبس الصوت دون قلقلة.'
    },
    {
      title: 'الوقف والابتداء وسكتات المصحف',
      status: 'مدعوم وفق الرسم',
      desc: 'التمييز بين الوقف السني على رأس الآية، والوقف الجائز والممنوع (م، لا، ج، صلى، قلى).'
    }
  ];

  const inDevelopment = [
    {
      title: 'مراتب التفخيم النسبية لأدنى حروف الاستعلاء (الخاء والغين المكسورتين)',
      status: 'قيد التطوير والتدريب',
      desc: 'التفريق الدقيق جداً بين درجات التفخيم الخمس في الحروف المكسورة يتطلب بيئة تسجيل استوديو ومراجعة بشرية.'
    },
    {
      title: 'الاختلاس وروم وإشمام القراءات',
      status: 'قيد البحث العلمي',
      desc: 'تتطلب نماذج صوتية فائقة الحساسية لا تتوفر بشكل قياسي عبر ميكروفونات الهواتف العادية.'
    }
  ];

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 border border-emerald-900/60 p-5 shadow-xl">
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>الشفافية والأمانة العلمية والتقنية</span>
        </div>
        <h1 className="text-xl md:text-2xl font-black text-stone-100">
          منهج تطبيق «مُتقِن» في التحليل والدقة
        </h1>
        <p className="text-xs text-stone-300 mt-1 max-w-xl leading-relaxed">
          انطلاقاً من قدسية القرآن الكريم وأهمية صيانة ألفاظه، يلتزم تطبيق «مُتقِن» بعدم ادعاء ما لا يمكن إثباته صوتياً بيقين، وعدم اختلاق أخطاء افتراضية.
        </p>
      </div>

      {/* 4 Core Pillars Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Offline & Device First */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <WifiOff className="w-4 h-4" />
            <span>العمل دون اتصال والخصوصية المطلقة</span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            يحتوي التطبيق على محرك تحليلي محلي يعمل 100% داخل المتصفح وجهاز المستخدم، ولا يتم رفع أي تسجيل صوتي إلى السحابة إلا بطلب وتحليل اختياري. التسجيلات لا تُخزّن افتراضياً في أي مكان.
          </p>
        </div>

        {/* Free Forever */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <HeartHandshake className="w-4 h-4" />
            <span>مجاني وخالٍ تماماً من الإعلانات</span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            التطبيق وقف تعليمي مجاني بالكامل للمستخدمين دون أي اشتراك إجباري أو ميزات مقفلة، احترماً لمهابة كتاب الله وتيسيراً لتعلمه.
          </p>
        </div>

        {/* Confidence System */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
            <Cpu className="w-4 h-4" />
            <span>نظام قياس الثقة وعدم اختلاق الأخطاء</span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            إذا لم يتوفر دليل صوتي حاسم بسبب ضوضاء أو تشويش، يمتنع النظام عن إصدار حكم جازم ويُظهر صراحة عبارة «تعذّر التأكد / يحتاج إلى مراجعة بشرية».
          </p>
        </div>

        {/* Authentic Hafs Reference */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
            <BookOpen className="w-4 h-4" />
            <span>رواية حفص عن عاصم من طريق الشاطبية</span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            النص القرآني مضبوط وفق الرسم العثماني لمصحف المدينة النبوية، والقواعد المطبقة هي أحكام التجويد المعتمدة برواية حفص عن عاصم.
          </p>
        </div>
      </div>

      {/* Feature Capability Status Matrix */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-stone-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>الأحكام المدعومة فعلياً في الإصدار الحالي</span>
        </h2>

        <div className="space-y-2">
          {supportedNow.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-stone-100">{item.title}</span>
                <p className="text-[11px] text-stone-400">{item.desc}</p>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold shrink-0 self-start sm:self-center">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* In Development Matrix */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-stone-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>ميزات تحت التطوير والبحث المستمر</span>
        </h2>

        <div className="space-y-2">
          {inDevelopment.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-stone-100">{item.title}</span>
                <p className="text-[11px] text-stone-400">{item.desc}</p>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-semibold shrink-0 self-start sm:self-center">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
