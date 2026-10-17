import React, { useState } from 'react';
import { BookOpen, Sparkles, Volume2, CheckCircle2, ChevronDown, ChevronUp, Play, ArrowLeft } from 'lucide-react';
import { TAJWEED_CATEGORIES } from '../data/quranData.ts';
import { playSyntheticQiraahTone } from '../utils/audioHelpers.ts';

interface TajweedKnowledgeHubProps {
  onStartPracticeWithRule: (ruleId: string) => void;
}

export const TajweedKnowledgeHub: React.FC<TajweedKnowledgeHubProps> = ({
  onStartPracticeWithRule
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('makhaarij');
  const [expandedSection, setExpandedSection] = useState<string | null>('makhaarij_throat');

  const makhaarijZones = [
    {
      id: 'jawf',
      title: '1. الجوف (التجويف الفموي والحلقي)',
      letters: 'حروف المد الثلاثة: الألف الساكنة المفتوح ما قبلها، والواو الساكنة المضموم ما قبلها، والياء الساكنة المكسور ما قبلها.',
      notes: 'تخرج بامتداد الصوت في الهواء دون الاعتماد على جزء محدد من الفم، وتُقدّر بحركتين في المد الطبيعي.'
    },
    {
      id: 'halq',
      title: '2. الحلق (أقصى الحلق، وسطه، وأدناه)',
      letters: 'أقصى الحلق: (ء - هـ) | وسط الحلق: (ع - ح) | أدنى الحلق: (غ - خ).',
      notes: 'هذه الحروف الستة هي حروف الإظهار الحلقي للنون الساكنة والتنوين. الحذر من خلط الحاء بالهاء أو الغين بالخاء.'
    },
    {
      id: 'lisan',
      title: '3. اللسان (عشرة مخارج لثمانية عشر حرفاً)',
      letters: 'أقصى اللسان: (ق - ك) | وسط اللسان: (ج - ش - ي) | حافتا اللسان: (ض - ل) | طرف اللسان: (ن - ر - ت - د - ط - ث - ذ - ظ - ز - س - ص).',
      notes: 'أعظم المخارج وأكثرها حروفاً. انتبه لإخراج طرف اللسان في الثاء والذال والظاء، والاستطالة في الضاد.'
    },
    {
      id: 'shafatayn',
      title: '4. الشفتان (مخرجان لأربعة أحرف)',
      letters: 'بطن الشفة السفلى مع أطراف الثنايا العليا: (ف) | بانطباق الشفتين أو انفتاحهما: (ب - م - و غير المدية).',
      notes: 'الباء والميم تخرجان بانطباق الشفتين، والواو بانضمامهما مع بقاء فرجة خفيفة.'
    },
    {
      id: 'khayshum',
      title: '5. الخيشوم (أعلى الأنف وأقصاه)',
      letters: 'مخرج الغنة المركبة في جسم النون والميم.',
      notes: 'صوت رخيم يخرج من الأنف لا عمل للسان فيه، ومقداره حركتان في المشدد والمدغم والمخفى.'
    }
  ];

  const nunRules = [
    {
      name: '1. الإظهار الحلقي',
      letters: 'ء، هـ، ع، ح، غ، خ (أخي هاك علماً حازه غير خاسر)',
      explanation: 'إخراج النون الساكنة أو التنوين من مخرجها بغير غنة ظاهرة عند ملاقاة أحد حروف الحلق الستة.',
      exampleUthmani: 'مَنْ ءَامَنَ • أَنْعَمْتَ • عَذَابٌ أَلِيمٌ'
    },
    {
      name: '2. الإدغام بغنة',
      letters: 'ي، ن، م، و (يَنْمُو)',
      explanation: 'إدخال النون الساكنة أو التنوين في الحرف الذي يليها بحيث يصيران حرفاً واحداً مشدداً مع بقاء الغنة حركتين.',
      exampleUthmani: 'مَن يَّقُولُ • مِن مَّالٍ • هُدًى لِّلْمُتَّقِينَ'
    },
    {
      name: '3. الإدغام بغير غنة',
      letters: 'ل، ر',
      explanation: 'إدغام كامل للنون الساكنة في اللام أو الراء دون أي أثر للغنة.',
      exampleUthmani: 'مِن رَّبِّهِمْ • أَن لَّوْ • غَفُورٌ رَّحِيمٌ'
    },
    {
      name: '4. الإقلاب',
      letters: 'ب (الباء فقط)',
      explanation: 'قلب النون الساكنة أو التنوين ميماً مخفاة مع الغنة حركتين عند ملاقاة الباء.',
      exampleUthmani: 'مِنۢ بَعْدِ • أَنۢبِئْهُم • سَمِيعٌۢ بَصِيرٌ'
    },
    {
      name: '5. الإخفاء الحقيقي',
      letters: '15 حرفاً مجموعة في أوائل كلمات: (صِفْ ذَا ثَنَا كَمْ جَادَ شَخْصٌ قَدْ سَمَا...)',
      explanation: 'النطق بالنون الساكنة بحالة بين الإظهار والإدغام عارية عن التشديد مع بقاء الغنة حركتين مرققة أو مفخمة.',
      exampleUthmani: 'مِن شَرِّ • أَنفُسَهُمْ • مِن قَبْلُ'
    }
  ];

  const maddRules = [
    {
      name: 'المد الطبيعي (الأصلي)',
      duration: 'حركتان (لا يزيد ولا ينقص)',
      notes: 'هو الذي لا تقوم ذات الحرف إلا به ولا يتوقف على سبب من همز أو سكون (قَالَ، يَقُولُ، قِيلَ).'
    },
    {
      name: 'المد المتصل (واجب)',
      duration: '4 إلى 5 حركات',
      notes: 'أن يأتي حرف المد وبعده همز في نفس الكلمة (جَآءَ، السَّمَآءُ، سُوٓءَ).'
    },
    {
      name: 'المد المنفصل (جائز)',
      duration: '4 إلى 5 حركات (ويجوز حركتان من طيبة النشر)',
      notes: 'أن يأتي حرف المد في آخر الكلمة وهمزة القطع في أول الكلمة التالية (إِنَّآ أَعْطَيْنَـٰكَ).'
    },
    {
      name: 'المد اللازم (واجب متفق عليه)',
      duration: '6 حركات وجوباً',
      notes: 'أن يأتي بعد حرف المد سكون أصلي لازم في كلمة أو حرف (ٱلضَّآلِّينَ، الحَآقَّةُ، الٓمٓ).'
    },
    {
      name: 'المد العارض للسكون',
      duration: 'جواز 2 أو 4 أو 6 حركات',
      notes: 'أن يأتي بعد حرف المد حرف متحرك سكن للوقف عليه (العَالَمِينَ، الرَّحِيمِ).'
    }
  ];

  const lahnDifference = [
    {
      title: 'اللحن الجلي (خطأ ظاهر)',
      desc: 'خطأ يطرأ على الألفاظ فيخل بعرف اللغة ومبنى الكلمة سواء أخل بالمعنى أم لم يخل، مثل إبدال حرف بحرف (الضاد ظاءً)، أو تغيير حركة (أنعمتُ بالضم بدل الفتح)، أو حذف حرف أو زيادته.',
      ruling: 'حرام شرعاً باتفاق القراء والعلماء إذا تعمده القارئ، وتجب العناية بالبدء بتصحيحه أولاً.'
    },
    {
      title: 'اللحن الخفي (خطأ مستور)',
      desc: 'خطأ يطرأ على الألفاظ فيخل بالكمال وحسن الأداء دون المعنى ومبنى الكلمة، مثل قصر المد المتصل عن 4 حركات، أو ترك الغنة، أو عدم إخفاء النون كما ينبغي، أو تكرير الراء زيادة عن الحد.',
      ruling: 'مكروه عند أهل الأداء، ومعيب عند المقرئين، ويسعى المتعلم للتخلص منه بالتدرج.'
    }
  ];

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6">
      {/* Knowledge Hub Header */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-950 border border-emerald-800/40 p-5 shadow-xl">
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-1">
          <BookOpen className="w-4 h-4" />
          <span>موسوعة التجويد التفاعلية — رواية حفص عن عاصم</span>
        </div>
        <h1 className="text-xl md:text-2xl font-black text-stone-100">
          تعلّم أحكام التجويد ومخارج الحروف
        </h1>
        <p className="text-xs text-stone-300 mt-1 max-w-xl leading-relaxed">
          شروحات مبسطة ومدققة لأهم أبواب التجويد، مع أمثلة قرآنية من المصحف وطريقة النطق السليم.
        </p>
      </div>

      {/* Categories Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        <button
          onClick={() => setActiveCategory('makhaarij')}
          className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
            activeCategory === 'makhaarij'
              ? 'bg-emerald-800 text-emerald-100 shadow border border-emerald-600'
              : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
          }`}
        >
          مخارج الحروف وصفاتها
        </button>

        <button
          onClick={() => setActiveCategory('nun')}
          className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
            activeCategory === 'nun'
              ? 'bg-emerald-800 text-emerald-100 shadow border border-emerald-600'
              : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
          }`}
        >
          أحكام النون والتنوين
        </button>

        <button
          onClick={() => setActiveCategory('madd')}
          className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
            activeCategory === 'madd'
              ? 'bg-emerald-800 text-emerald-100 shadow border border-emerald-600'
              : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
          }`}
        >
          أحكام المدود ومقاديرها
        </button>

        <button
          onClick={() => setActiveCategory('lahn')}
          className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
            activeCategory === 'lahn'
              ? 'bg-emerald-800 text-emerald-100 shadow border border-emerald-600'
              : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
          }`}
        >
          اللحن الجلي والخفي
        </button>
      </div>

      {/* Content Area Based on Active Category */}
      {activeCategory === 'makhaarij' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
            <h3 className="font-bold text-sm text-amber-300">
              المخارج العامة الخمسة للحروف العربية
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              المخرج هو الموضع الذي يخرج منه الحرف وينقطع عنده صوت النطق به، فيتميز به عن غيره.
            </p>
          </div>

          <div className="space-y-2.5">
            {makhaarijZones.map((zone) => (
              <div
                key={zone.id}
                className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-emerald-300">{zone.title}</h4>
                  <button
                    onClick={() => playSyntheticQiraahTone(240, 800)}
                    className="p-1 rounded bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-amber-300"
                    title="استمع لنبرة المخرج"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-stone-200 font-medium">{zone.letters}</p>
                <p className="text-[11px] text-stone-400 leading-relaxed">{zone.notes}</p>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onStartPracticeWithRule('makhaarij')}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
            >
              <span>تدرب عملياً على مخارج الحروف الآن</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeCategory === 'nun' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1.5">
            <h3 className="font-bold text-sm text-teal-300">
              أحكام النون الساكنة والتنوين الخمسة
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              للنون الساكنة والتنوين خمسة أحكام عند ملاقاة حروف الهجاء: الإظهار، الإدغام بغنة، الإدغام بغير غنة، الإقلاب، والإخفاء.
            </p>
          </div>

          <div className="space-y-3">
            {nunRules.map((rule, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-amber-300">{rule.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-950 text-stone-400 border border-stone-800">
                    حروفه: {rule.letters}
                  </span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">{rule.explanation}</p>
                <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800/80 font-quran text-base text-emerald-300 text-center">
                  {rule.exampleUthmani}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onStartPracticeWithRule('nun_sakinah')}
              className="w-full py-3 px-4 rounded-2xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
            >
              <span>تدرب عملياً على أحكام النون والتنوين</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeCategory === 'madd' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1.5">
            <h3 className="font-bold text-sm text-indigo-300">
              أحكام المدود ومقاديرها بالرواية المعتمدة
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              الحركة هي وحدة قياس زمن المد (بقدر قبض الإصبع أو بسطه بحالة وسطية معتدلة، وتساوي تقريباً 280-300 ملّي ثانية عند الترتيل).
            </p>
          </div>

          <div className="space-y-2.5">
            {maddRules.map((madd, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-stone-200">{madd.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                    {madd.duration}
                  </span>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">{madd.notes}</p>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onStartPracticeWithRule('madd')}
              className="w-full py-3 px-4 rounded-2xl bg-indigo-800 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
            >
              <span>تدرب عملياً على مقادير المدود</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeCategory === 'lahn' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1.5">
            <h3 className="font-bold text-sm text-rose-300">
              الفرق بين اللحن الجلي واللحن الخفي
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              منهج تطبيق «مُتقِن» يعتمد أولوية مطلقة للقضاء على اللحن الجلي أولاً، ثم الانتقال لمراتب الإتقان في التجويد الخفي.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lahnDifference.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2"
              >
                <h4 className="font-bold text-xs text-amber-300">{item.title}</h4>
                <p className="text-xs text-stone-300 leading-relaxed">{item.desc}</p>
                <div className="p-2.5 rounded-xl bg-stone-950 text-[11px] text-stone-400 border border-stone-800">
                  <span className="font-semibold text-stone-300">حكمه: </span>
                  {item.ruling}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
