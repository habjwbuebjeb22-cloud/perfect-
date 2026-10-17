/**
 * Quran Data and Authentic Uthmanic Hafs Text for Mutqin
 * Includes curated Surahs with word-by-word annotations, Tajweed rules, and verified reference recitations.
 */

export interface TajweedRuleOccurrence {
  ruleId: string;
  ruleName: string;
  category: 'nun_sakinah' | 'meem_sakinah' | 'madd' | 'qalqalah' | 'tafkheem_tarqeeq' | 'makhaarij' | 'waqf' | 'ghunnah';
  severity: 'jali' | 'khafi';
  letters: string;
  targetHarakat?: number; // For madd or ghunnah (e.g. 2, 4, 6)
  descriptionAr: string;
  howToPronounceAr: string[];
}

export interface QuranWord {
  index: number; // 1-based index in the ayah
  uthmani: string; // الرسم العثماني
  simple: string; // نص مبسط بدون تشكيل معقد للبحث والمقارنة
  audioOffsetMs?: number; // Offset in reference audio
  rules: TajweedRuleOccurrence[];
  waqfSign?: 'م' | 'لا' | 'ج' | 'صلى' | 'قلى' | 'سكتة';
}

export interface QuranAyah {
  number: number;
  textUthmani: string;
  words: QuranWord[];
  audioUrl: string; // Authentic reference recitation (Mishary Alafasy / Minshawi)
  translationAr?: string;
  permissibleWaqfPositions?: number[]; // Word indices where stopping is valid
}

export interface QuranSurah {
  id: number;
  nameAr: string;
  nameEn: string;
  type: 'مكية' | 'مدنية';
  totalAyahs: number;
  ayahs: QuranAyah[];
}

export interface PreloadedRecitationSample {
  id: string;
  titleAr: string;
  surahId: number;
  ayahNumber: number;
  type: 'perfect' | 'has_errors' | 'unverified';
  descriptionAr: string;
  intendedErrors?: {
    wordIndex: number;
    ruleName: string;
    description: string;
  }[];
  audioToneSequence?: { freq: number; duration: number }[]; // Audio synthesizer fallback
}

export function toArabicNumerals(n: number): string {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return n.toString().replace(/\d/g, d => digits[parseInt(d, 10)]);
}

export const SURAHS_DATA: QuranSurah[] = [
  {
    id: 1,
    nameAr: "الفاتحة",
    nameEn: "Al-Fatihah",
    type: "مكية",
    totalAyahs: 7,
    ayahs: [
      {
        number: 1,
        textUthmani: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/001001.mp3",
        words: [
          {
            index: 1,
            uthmani: "بِسْمِ",
            simple: "بسم",
            rules: [
              {
                ruleId: "tarqeeq_baa",
                ruleName: "ترقيق الباء والسين",
                category: "tafkheem_tarqeeq",
                severity: "khafi",
                letters: "ب س",
                descriptionAr: "ترقيق الباء والكسرة الخالصة مع صفير السين وهمسها بدون تفخيم.",
                howToPronounceAr: ["خفض الفك السفلي عند نطق الكسرة", "جريان النفس في حرف السين (صفير وهمس)"]
              }
            ]
          },
          {
            index: 2,
            uthmani: "ٱللَّهِ",
            simple: "الله",
            rules: [
              {
                ruleId: "tarqeeq_lam_lafz_jalalah",
                ruleName: "ترقيق لام لفظ الجلالة",
                category: "tafkheem_tarqeeq",
                severity: "jali",
                letters: "ل",
                descriptionAr: "تُرَقَّق لام لفظ الجلالة إذا سُبقت بكسر (بِسمِ اللَّه). تفخيمها هنا لحن جلي.",
                howToPronounceAr: ["عدم رفع أقصى اللسان عند نطق اللام المرققة", "نطق اللام بابتسامة فموية لطيفة"]
              }
            ]
          },
          {
            index: 3,
            uthmani: "ٱلرَّحْمَـٰنِ",
            simple: "الرحمن",
            rules: [
              {
                ruleId: "idgham_shamsi_ra",
                ruleName: "إدغام شمسي وتفخيم الراء المشددة",
                category: "tafkheem_tarqeeq",
                severity: "jali",
                letters: "ر",
                descriptionAr: "إدغام لام التعريف في الراء مع تفخيم الراء المفتوحة المشددة بدون تكرير زائد.",
                howToPronounceAr: ["إلصاق طرف اللسان بأصول الثنايا العليا دون حبس التكرير كلياً ودون زيادة ارتعاده"]
              }
            ]
          },
          {
            index: 4,
            uthmani: "ٱلرَّحِيمِ",
            simple: "الرحيم",
            rules: [
              {
                ruleId: "madd_arid_lisukun",
                ruleName: "مد عارض للسكون",
                category: "madd",
                severity: "khafi",
                letters: "ي",
                targetHarakat: 4,
                descriptionAr: "مد الياء عند الوقف على رأس الآية بمقدار حركتين أو 4 (وهو الأشهر) أو 6 حركات.",
                howToPronounceAr: ["إشباع مد الياء حركتين أو 4 حركات مع السكون المحض على الميم دون قلقلتها"]
              }
            ]
          }
        ]
      },
      {
        number: 2,
        textUthmani: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/001002.mp3",
        words: [
          {
            index: 1,
            uthmani: "ٱلْحَمْدُ",
            simple: "الحمد",
            rules: [
              {
                ruleId: "izhar_qamari",
                ruleName: "إظهار قمري (اللام) وبيان الضمة في الدال",
                category: "makhaarij",
                severity: "jali",
                letters: "ل د",
                descriptionAr: "إظهار اللام القمرية وتحقيق مخرج الحاء من وسط الحلق وإتمام ضمة الدال.",
                howToPronounceAr: ["بيان مخرج الحاء بدون خلطها بالهاء أو الخاء", "ضم الشفتين تماماً عند حرف الدال (الحمدُ) دون تسكينها"]
              }
            ]
          },
          {
            index: 2,
            uthmani: "لِلَّهِ",
            simple: "لله",
            rules: [
              {
                ruleId: "tarqeeq_lam",
                ruleName: "ترقيق لام لفظ الجلالة المسبوقة بكسر",
                category: "tafkheem_tarqeeq",
                severity: "jali",
                letters: "ل",
                descriptionAr: "ترقيق اللام ترقيقاً تاماً لسبقها بلام الجر المكسورة.",
                howToPronounceAr: ["استفال اللسان وترقيق الصوت"]
              }
            ]
          },
          {
            index: 3,
            uthmani: "رَبِّ",
            simple: "رب",
            rules: [
              {
                ruleId: "tafkheem_ra_kasrat_baa",
                ruleName: "تفخيم الراء وتشديد الباء المكسورة",
                category: "tafkheem_tarqeeq",
                severity: "jali",
                letters: "ر ب",
                descriptionAr: "تفخيم الراء المفتوحة وإعطاء الباء المشددة نبرة الشدة مع كسرها بوضوح.",
                howToPronounceAr: ["تصعيد الصوت في الراء ثم إطباق الشفتين في الباء مع تحقيق الكسر"]
              }
            ]
          },
          {
            index: 4,
            uthmani: "ٱلْعَـٰلَمِينَ",
            simple: "العالمين",
            rules: [
              {
                ruleId: "madd_arid_lisukun",
                ruleName: "مد عارض للسكون (الياء)",
                category: "madd",
                severity: "khafi",
                letters: "ي",
                targetHarakat: 4,
                descriptionAr: "يمد 2 أو 4 أو 6 حركات عند الوقف مع إظهار النون بالتوسط.",
                howToPronounceAr: ["مد الصوت بالياء بالتساوي مع بقية رؤوس الآيات"]
              }
            ]
          }
        ]
      },
      {
        number: 3,
        textUthmani: "ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/001003.mp3",
        words: [
          { index: 1, uthmani: "ٱلرَّحْمَـٰنِ", simple: "الرحمن", rules: [] },
          {
            index: 2,
            uthmani: "ٱلرَّحِيمِ",
            simple: "الرحيم",
            rules: [
              {
                ruleId: "madd_arid_lisukun",
                ruleName: "مد عارض للسكون",
                category: "madd",
                severity: "khafi",
                letters: "ي",
                targetHarakat: 4,
                descriptionAr: "مد عارض للسكون مقداره 4 حركات توسطاً.",
                howToPronounceAr: ["توسط المد 4 حركات"]
              }
            ]
          }
        ]
      },
      {
        number: 4,
        textUthmani: "مَـٰلِكِ يَوْمِ ٱلدِّينِ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/001004.mp3",
        words: [
          {
            index: 1,
            uthmani: "مَـٰلِكِ",
            simple: "مالك",
            rules: [
              {
                ruleId: "madd_tabii_alif",
                ruleName: "مد طبيعي حركتان (الألف الخنجرية)",
                category: "madd",
                severity: "jali",
                letters: "ا",
                targetHarakat: 2,
                descriptionAr: "إثبات الألف الخنجرية حركتين في رواية حفص (مَالِكِ) وكسر اللام والكاف دون إشباع.",
                howToPronounceAr: ["مد الميم حركتين فقط بلا زيادة ولا تمطيط"]
              }
            ]
          },
          { index: 2, uthmani: "يَوْمِ", simple: "يوم", rules: [] },
          {
            index: 3,
            uthmani: "ٱلدِّينِ",
            simple: "الدين",
            rules: [
              {
                ruleId: "madd_arid_lisukun",
                ruleName: "مد عارض للسكون",
                category: "madd",
                severity: "khafi",
                letters: "ي",
                targetHarakat: 4,
                descriptionAr: "مد عارض للسكون 4 حركات.",
                howToPronounceAr: ["توسط المد بمقدار 4 حركات"]
              }
            ]
          }
        ]
      },
      {
        number: 5,
        textUthmani: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/001005.mp3",
        words: [
          {
            index: 1,
            uthmani: "إِيَّاكَ",
            simple: "إياك",
            rules: [
              {
                ruleId: "tashdeed_yaa",
                ruleName: "تحقيق همزة القطع وتشديد الياء",
                category: "makhaarij",
                severity: "jali",
                letters: "ء ي",
                descriptionAr: "تحقيق كسرة همزة القطع وتشديد الياء بنبر لطيف دون مبالغة ودون إسقاط الشدة.",
                howToPronounceAr: ["إعطاء الياء زمناً مضاعفاً مع نبر خفيف يوضح الشدة"]
              }
            ]
          },
          {
            index: 2,
            uthmani: "نَعْبُدُ",
            simple: "نعبد",
            rules: [
              {
                ruleId: "tawassut_ain",
                ruleName: "توسط العين وإتمام ضمة الدال",
                category: "makhaarij",
                severity: "jali",
                letters: "ع د",
                descriptionAr: "جريان الصوت زمناً يسيراً في العين الساكنة وإتمام ضمة الدال دون قلبها إلى فتحة أو سكون.",
                howToPronounceAr: ["إخراج العين من وسط الحلق دون خنق الصوت", "ضم الشفتين في الدال نَعبُدُ"]
              }
            ]
          },
          { index: 3, uthmani: "وَإِيَّاكَ", simple: "وإياك", rules: [] },
          {
            index: 4,
            uthmani: "نَسْتَعِينُ",
            simple: "نستعين",
            rules: [
              {
                ruleId: "madd_arid_lisukun",
                ruleName: "مد عارض للسكون وترقيق السين والتاء",
                category: "madd",
                severity: "khafi",
                letters: "ي س ت",
                targetHarakat: 4,
                descriptionAr: "ترقيق السين والتاء، وإشباع المد العارض للسكون 4 حركات.",
                howToPronounceAr: ["الحذر من تفخيم التاء لتصبح طاء", "مد الياء 4 حركات والسكون على النون"]
              }
            ]
          }
        ]
      },
      {
        number: 6,
        textUthmani: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/001006.mp3",
        words: [
          {
            index: 1,
            uthmani: "ٱهْدِنَا",
            simple: "اهدنا",
            rules: [
              {
                ruleId: "hamzat_wasl_kasr",
                ruleName: "البدء بهمزة وصل مكسورة وجريان الهاء",
                category: "makhaarij",
                severity: "jali",
                letters: "ء هـ",
                descriptionAr: "عند البدء تُكسر همزة الوصل (اِهدنا)، وبيان الهاء من أقصى الحلق مع همس ورخاوة.",
                howToPronounceAr: ["نطق همزة محققة مكسورة عند الابتداء", "جريان النفس في الهاء دون كتم الصوت"]
              }
            ]
          },
          {
            index: 2,
            uthmani: "ٱلصِّرَٰطَ",
            simple: "الصراط",
            rules: [
              {
                ruleId: "tafkheem_sad_ra_taa",
                ruleName: "تفخيم الصاد والراء والطاء (لحن جلي بالتبديل)",
                category: "tafkheem_tarqeeq",
                severity: "jali",
                letters: "ص ر ط",
                descriptionAr: "الصاد والطاء مفخمتان مطبقتان، والراء مفخمة لفتحها. الحذر من نطق الصاد سيناً أو الطاء تاءً.",
                howToPronounceAr: ["استعلاء أقصى اللسان وإطباقه في الصاد المكسورة والطاء المفتوحة"]
              }
            ]
          },
          {
            index: 3,
            uthmani: "ٱلْمُسْتَقِيمَ",
            simple: "المستقيم",
            rules: [
              {
                ruleId: "tarqeeq_taa_tafkheem_qaaf",
                ruleName: "ترقيق التاء وتفخيم القاف المكسورة (نسبياً)",
                category: "tafkheem_tarqeeq",
                severity: "jali",
                letters: "ت ق",
                descriptionAr: "التاء مرققة، فلا تُنطق طاءً لمجاورتها القاف. والقاف مفخمة في أدنى مراتب التفخيم لكسرها.",
                howToPronounceAr: ["المستـَـقِيم وليس (المسطقيم) ولا (المستكيم)"]
              }
            ]
          }
        ]
      },
      {
        number: 7,
        textUthmani: "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/001007.mp3",
        words: [
          { index: 1, uthmani: "صِرَٰطَ", simple: "صراط", rules: [] },
          {
            index: 2,
            uthmani: "ٱلَّذِينَ",
            simple: "الذين",
            rules: [
              {
                ruleId: "makhraj_dhal",
                ruleName: "مخرج الذال من طرف اللسان",
                category: "makhaarij",
                severity: "jali",
                letters: "ذ",
                descriptionAr: "إخراج طرف اللسان مع أطراف الثنايا العليا، والحذر من إبدالها زاياً (الزين).",
                howToPronounceAr: ["إخراج رأس اللسان قليلاً بين الأسنان"]
              }
            ]
          },
          {
            index: 3,
            uthmani: "أَنْعَمْتَ",
            simple: "أنعمت",
            rules: [
              {
                ruleId: "izhar_halqi_noon",
                ruleName: "إظهار حلقي (النون عند العين) وفتح التاء (لحن جلي)",
                category: "nun_sakinah",
                severity: "jali",
                letters: "ن ت",
                descriptionAr: "إظهار النون الساكنة عند العين بغير غنة زائدة. وتحقيق فتحة التاء (أنعمتَ)؛ فضمها (أنعمتُ) لحن جلي يغير المعنى.",
                howToPronounceAr: ["نطق النون بقرع اللسان وسرعة الانتقال للعين", "فتح الشفتين بنطق تاء الخطاب المفتوحة بوضوح"]
              }
            ]
          },
          {
            index: 4,
            uthmani: "عَلَيْهِمْ",
            simple: "عليهم",
            rules: [
              {
                ruleId: "izhar_shafawi_meem",
                ruleName: "إظهار شفوي للميم الساكنة وكسر الهاء",
                category: "meem_sakinah",
                severity: "jali",
                letters: "م هـ",
                descriptionAr: "كسر الهاء تحقيقاً (عليهِمْ)، وإظهار الميم الساكنة عند الغين مع إطباق الشفتين دون غنة.",
                howToPronounceAr: ["إطباق الشفتين إطباقاً معتدلاً زمناً وسطاً لبيان الميم"]
              }
            ]
          },
          {
            index: 5,
            uthmani: "غَيْرِ",
            simple: "غير",
            rules: [
              {
                ruleId: "tafkheem_ghain_tarqeeq_ra",
                ruleName: "تفخيم الغين وترقيق الراء المكسورة",
                category: "tafkheem_tarqeeq",
                severity: "khafi",
                letters: "غ ر",
                descriptionAr: "الغين مفخمة، والراء مرققة لكسرها.",
                howToPronounceAr: ["جريان الصوت في الغين بدون قلقلة", "استفال اللسان عند نطق الراء المكسورة"]
              }
            ]
          },
          {
            index: 6,
            uthmani: "ٱلْمَغْضُوبِ",
            simple: "المغضوب",
            rules: [
              {
                ruleId: "istitalat_daad",
                ruleName: "استطالة وتفخيم الضاد وإتمام الضمة",
                category: "makhaarij",
                severity: "jali",
                letters: "ض",
                descriptionAr: "الضاد حرف رخو مستعل مطبق به استطالة من إحدى حافتي اللسان. الحذر من قلبها ظاءً أو دالاً.",
                howToPronounceAr: ["ضغط حافة اللسان على الأضراس العليا مع جريان الصوت للأمام"]
              }
            ]
          },
          { index: 7, uthmani: "عَلَيْهِمْ", simple: "عليهم", rules: [] },
          { index: 8, uthmani: "وَلَا", simple: "ولا", rules: [] },
          {
            index: 9,
            uthmani: "ٱلضَّآلِّينَ",
            simple: "الضالين",
            rules: [
              {
                ruleId: "madd_lazim_kalimi_muthaqqal",
                ruleName: "مد لازم كلمي مثقل (6 حركات)",
                category: "madd",
                severity: "jali",
                letters: "ا ل",
                targetHarakat: 6,
                descriptionAr: "مد الألف 6 حركات وجوباً، يليه نبر قوي على اللام المشددة لبيان التشديد.",
                howToPronounceAr: ["مد الصوت 6 حركات كاملة دون نقصان", "نبر على اللام المشددة بعد المد"]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 112,
    nameAr: "الإخلاص",
    nameEn: "Al-Ikhlas",
    type: "مكية",
    totalAyahs: 4,
    ayahs: [
      {
        number: 1,
        textUthmani: "قُلْ هُوَ ٱللَّهُ أَحَدٌ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/112001.mp3",
        words: [
          {
            index: 1,
            uthmani: "قُلْ",
            simple: "قل",
            rules: [
              {
                ruleId: "tafkheem_qaaf_tarqeeq_lam",
                ruleName: "تفخيم القاف وترقيق اللام الساكنة",
                category: "tafkheem_tarqeeq",
                severity: "jali",
                letters: "ق ل",
                descriptionAr: "الحذر من نطق القاف كافاً (كُل) فهو لحن جلي قبيح يغير المعنى من القول إلى الأكل.",
                howToPronounceAr: ["إخراج القاف من أقصى اللسان مع الحنك اللحمي وتفخيمها"]
              }
            ]
          },
          { index: 2, uthmani: "هُوَ", simple: "هو", rules: [] },
          { index: 3, uthmani: "ٱللَّهُ", simple: "الله", rules: [] },
          {
            index: 4,
            uthmani: "أَحَدٌ",
            simple: "أحد",
            rules: [
              {
                ruleId: "qalqalah_kubra_daal",
                ruleName: "قلقلة كبرى على الدال عند الوقف",
                category: "qalqalah",
                severity: "khafi",
                letters: "د",
                descriptionAr: "قلقلة الدال عند الوقف عليها بنبرة واضحة ومحبوبة دون إمالتها إلى فتح أو كسر.",
                howToPronounceAr: ["اضطراب مخرج الدال بقوة وخروج الصوت باندفاع سريع (أحَدْ)"]
              }
            ]
          }
        ]
      },
      {
        number: 2,
        textUthmani: "ٱللَّهُ ٱلصَّمَدُ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/112002.mp3",
        words: [
          { index: 1, uthmani: "ٱللَّهُ", simple: "الله", rules: [] },
          {
            index: 2,
            uthmani: "ٱلصَّمَدُ",
            simple: "الصمد",
            rules: [
              {
                ruleId: "qalqalah_kubra_daal_samad",
                ruleName: "تفخيم الصاد وقلقلة الدال عند الوقف",
                category: "qalqalah",
                severity: "khafi",
                letters: "ص د",
                descriptionAr: "إطباق وتفخيم الصاد، وقلقلة كبرى للدال عند الوقف.",
                howToPronounceAr: ["قلقلة واضحة على حرف الدال"]
              }
            ]
          }
        ]
      },
      {
        number: 3,
        textUthmani: "لَمْ يَلِدْ وَلَمْ يُولَدْ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/112003.mp3",
        words: [
          { index: 1, uthmani: "لَمْ", simple: "لم", rules: [] },
          {
            index: 2,
            uthmani: "يَلِدْ",
            simple: "يلد",
            rules: [
              {
                ruleId: "qalqalah_sughra_daal",
                ruleName: "قلقلة صغرى على الدال الساكنة وصلاً",
                category: "qalqalah",
                severity: "khafi",
                letters: "د",
                descriptionAr: "قلقلة صغرى لأنها في وسط الكلام قبل الواو.",
                howToPronounceAr: ["قلقلة سريعة لا تقطع الكلام"]
              }
            ]
          },
          { index: 3, uthmani: "وَلَمْ", simple: "ولم", rules: [] },
          {
            index: 4,
            uthmani: "يُولَدْ",
            simple: "يولد",
            rules: [
              {
                ruleId: "qalqalah_kubra_daal_yoolad",
                ruleName: "قلقلة كبرى على الدال عند الوقف",
                category: "qalqalah",
                severity: "khafi",
                letters: "د",
                descriptionAr: "قلقلة كبرى للدال عند الوقف.",
                howToPronounceAr: ["اضطراب مخرج الدال"]
              }
            ]
          }
        ]
      },
      {
        number: 4,
        textUthmani: "وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/112004.mp3",
        words: [
          { index: 1, uthmani: "وَلَمْ", simple: "ولم", rules: [] },
          {
            index: 2,
            uthmani: "يَكُن",
            simple: "يكن",
            rules: [
              {
                ruleId: "idgham_bighair_ghunnah",
                ruleName: "إدغام بغير غنة (النون في اللام)",
                category: "nun_sakinah",
                severity: "jali",
                letters: "ن ل",
                descriptionAr: "إدغام كامل للنون الساكنة في اللام دون أي صوت للغنة (يَكُلَّه). إظهار النون هنا خطأ.",
                howToPronounceAr: ["التحول المباشر من الكاف إلى اللام المشددة دون أي غنة أنفية"]
              }
            ]
          },
          {
            index: 3,
            uthmani: "لَّهُۥ",
            simple: "له",
            rules: [
              {
                ruleId: "mad_silah_sughra",
                ruleName: "مد صلة صغرى حركتان",
                category: "madd",
                severity: "khafi",
                letters: "هـ",
                targetHarakat: 2,
                descriptionAr: "مد هاء الضمير حركتين كالواو الممدودة.",
                howToPronounceAr: ["إشباع ضمة الهاء بمقدار حركتين"]
              }
            ]
          },
          {
            index: 4,
            uthmani: "كُفُوًا",
            simple: "كفوا",
            rules: [
              {
                ruleId: "damm_faa",
                ruleName: "ضم الفاء في رواية حفص (كُـفُـوًا)",
                category: "makhaarij",
                severity: "jali",
                letters: "ف",
                descriptionAr: "في رواية حفص عن عاصم، الفاء مضمومة (كُفُوًا) وليست ساكنة (كُفْواً). تسكينها لحن جلي.",
                howToPronounceAr: ["ضم الشفتين في الفاء والواو"]
              }
            ]
          },
          {
            index: 5,
            uthmani: "أَحَدٌۢ",
            simple: "أحد",
            rules: [
              {
                ruleId: "qalqalah_kubra_daal_last",
                ruleName: "قلقلة كبرى على الدال",
                category: "qalqalah",
                severity: "khafi",
                letters: "د",
                descriptionAr: "قلقلة الدال عند الوقف.",
                howToPronounceAr: ["قلقلة كبرى واضحة"]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 114,
    nameAr: "الناس",
    nameEn: "An-Nas",
    type: "مكية",
    totalAyahs: 6,
    ayahs: [
      {
        number: 1,
        textUthmani: "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/114001.mp3",
        words: [
          { index: 1, uthmani: "قُلْ", simple: "قل", rules: [] },
          {
            index: 2,
            uthmani: "أَعُوذُ",
            simple: "أعوذ",
            rules: [
              {
                ruleId: "makhraj_dhal_aoodhu",
                ruleName: "إخراج حرف الذال من طرف اللسان",
                category: "makhaarij",
                severity: "jali",
                letters: "ذ",
                descriptionAr: "إخراج الذال من مخرجها الحقيقي (طرف اللسان) والتحذير من نطقها زاياً أو دالاً.",
                howToPronounceAr: ["عض لطيف بطرف اللسان بين الثنايا"]
              }
            ]
          },
          { index: 3, uthmani: "بِرَبِّ", simple: "برب", rules: [] },
          {
            index: 4,
            uthmani: "ٱلنَّاسِ",
            simple: "الناس",
            rules: [
              {
                ruleId: "ghunnah_noon_mushaddadah",
                ruleName: "غنة النون المشددة (حركتان أكمل ما تكون)",
                category: "ghunnah",
                severity: "jali",
                letters: "ن",
                targetHarakat: 2,
                descriptionAr: "النون المشددة حكمها الغنة بمقدار حركتين كاملتين من الخيشوم. بترها خطأ شائع.",
                howToPronounceAr: ["الوقف بالصوت في الخيشوم لمدة حركتين (النّــــاس) ثم الانتقال للمد العارض"]
              }
            ]
          }
        ]
      },
      {
        number: 2,
        textUthmani: "مَلِكِ ٱلنَّاسِ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/114002.mp3",
        words: [
          { index: 1, uthmani: "مَلِكِ", simple: "ملك", rules: [] },
          { index: 2, uthmani: "ٱلنَّاسِ", simple: "الناس", rules: [] }
        ]
      },
      {
        number: 3,
        textUthmani: "إِلَـٰهِ ٱلنَّاسِ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/114003.mp3",
        words: [
          { index: 1, uthmani: "إِلَـٰهِ", simple: "إله", rules: [] },
          { index: 2, uthmani: "ٱلنَّاسِ", simple: "الناس", rules: [] }
        ]
      },
      {
        number: 4,
        textUthmani: "مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/114004.mp3",
        words: [
          {
            index: 1,
            uthmani: "مِن",
            simple: "من",
            rules: [
              {
                ruleId: "ikhfaa_haqiqi_sheen",
                ruleName: "إخفاء حقيقي مع ترقيق الغنة عند الشين",
                category: "nun_sakinah",
                severity: "khafi",
                letters: "ن ش",
                targetHarakat: 2,
                descriptionAr: "إخفاء النون الساكنة عند الشين مع غنة مرققة حركتين دون إلصاق اللسان بسقف الحلق.",
                howToPronounceAr: ["إبقاء اللسان متجافياً قريباً من مخرج الشين وخروج الغنة من الخيشوم حركتين"]
              }
            ]
          },
          { index: 2, uthmani: "شَرِّ", simple: "شر", rules: [] },
          { index: 3, uthmani: "ٱلْوَسْوَاسِ", simple: "الوسواس", rules: [] },
          { index: 4, uthmani: "ٱلْخَنَّاسِ", simple: "الخناس", rules: [] }
        ]
      },
      {
        number: 5,
        textUthmani: "ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/114005.mp3",
        words: [
          { index: 1, uthmani: "ٱلَّذِى", simple: "الذي", rules: [] },
          { index: 2, uthmani: "يُوَسْوِسُ", simple: "يوسوس", rules: [] },
          { index: 3, uthmani: "فِى", simple: "في", rules: [] },
          { index: 4, uthmani: "صُدُورِ", simple: "صدور", rules: [] },
          { index: 5, uthmani: "ٱلنَّاسِ", simple: "الناس", rules: [] }
        ]
      },
      {
        number: 6,
        textUthmani: "مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/114006.mp3",
        words: [
          { index: 1, uthmani: "مِنَ", simple: "من", rules: [] },
          {
            index: 2,
            uthmani: "ٱلْجِنَّةِ",
            simple: "الجنة",
            rules: [
              {
                ruleId: "ghunnah_noon_jinnah",
                ruleName: "غنة النون المشددة بمقدار حركتين",
                category: "ghunnah",
                severity: "jali",
                letters: "ن",
                targetHarakat: 2,
                descriptionAr: "غنة أكمل ما تكون بمقدار حركتين.",
                howToPronounceAr: ["إعطاء النون زمناً كافياً للغنة الخيشومية"]
              }
            ]
          },
          { index: 3, uthmani: "وَٱلنَّاسِ", simple: "والناس", rules: [] }
        ]
      }
    ]
  },
  {
    id: 108,
    nameAr: "الكوثر",
    nameEn: "Al-Kawthar",
    type: "مكية",
    totalAyahs: 3,
    ayahs: [
      {
        number: 1,
        textUthmani: "إِنَّآ أَعْطَيْنَـٰكَ ٱلْكَوْثَرَ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/108001.mp3",
        words: [
          {
            index: 1,
            uthmani: "إِنَّآ",
            simple: "إنا",
            rules: [
              {
                ruleId: "ghunnah_noon_madd_munfasil",
                ruleName: "غنة النون المشددة ومد منفصل جائز (4-5 حركات)",
                category: "madd",
                severity: "jali",
                letters: "ن ا",
                targetHarakat: 4,
                descriptionAr: "غنة حركتين في النون، ثم مد الألف 4 أو 5 حركات لوقوع همزة القطع بعدها في الكلمة التالية.",
                howToPronounceAr: ["غنة النون حركتين أولاً ثم مد الصوت 4 حركات للمد المنفصل"]
              }
            ]
          },
          {
            index: 2,
            uthmani: "أَعْطَيْنَـٰكَ",
            simple: "أعطيناك",
            rules: [
              {
                ruleId: "tafkheem_taa_tarqeeq_hamzah",
                ruleName: "ترقيق الهمزة وتفخيم وإطباق الطاء",
                category: "tafkheem_tarqeeq",
                severity: "jali",
                letters: "ء ط",
                descriptionAr: "ترقيق الهمزة والعين الساكنة، وتفخيم الطاء، والحذر من تفخيم الهمزة لتصير (آعطيناك).",
                howToPronounceAr: ["أَ-عْ-طَـيْنَاك ترقيق ما قبل الطاء وتفخيم الطاء"]
              }
            ]
          },
          {
            index: 3,
            uthmani: "ٱلْكَوْثَرَ",
            simple: "الكوثر",
            rules: [
              {
                ruleId: "makhraj_thaa_tafkheem_ra",
                ruleName: "مخرج الثاء من طرف اللسان وتفخيم الراء عند الوقف",
                category: "makhaarij",
                severity: "jali",
                letters: "ث ر",
                descriptionAr: "إخراج الثاء من مخرجها دون قلبها سيناً (الكوسر لحن جلي قبيح)، وتفخيم الراء عند الوقف.",
                howToPronounceAr: ["طرف اللسان مع الثنايا لنطق الثاء، وتفخيم الراء"]
              }
            ]
          }
        ]
      },
      {
        number: 2,
        textUthmani: "فَصَلِّ لِرَبِّكَ وَٱنْحَرْ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/108002.mp3",
        words: [
          { index: 1, uthmani: "فَصَلِّ", simple: "فصل", rules: [] },
          { index: 2, uthmani: "لِرَبِّكَ", simple: "لربك", rules: [] },
          {
            index: 3,
            uthmani: "وَٱنْحَرْ",
            simple: "وانحر",
            rules: [
              {
                ruleId: "izhar_noon_halqi",
                ruleName: "إظهار حلقي للنون الساكنة عند الحاء وتفخيم الراء",
                category: "nun_sakinah",
                severity: "jali",
                letters: "ن ح ر",
                descriptionAr: "إظهار النون الساكنة بياناً تاماً بدون غنة، وتفخيم الراء الموقوف عليها لفتح ما قبلها.",
                howToPronounceAr: ["إظهار النون وتفخيم الراء"]
              }
            ]
          }
        ]
      },
      {
        number: 3,
        textUthmani: "إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ",
        audioUrl: "https://everyayah.com/data/Alafasy_128kbps/108003.mp3",
        words: [
          { index: 1, uthmani: "إِنَّ", simple: "إن", rules: [] },
          { index: 2, uthmani: "شَانِئَكَ", simple: "شانئك", rules: [] },
          { index: 3, uthmani: "هُوَ", simple: "هو", rules: [] },
          {
            index: 4,
            uthmani: "ٱلْأَبْتَرُ",
            simple: "الأبتر",
            rules: [
              {
                ruleId: "qalqalah_sughra_baa",
                ruleName: "قلقلة صغرى على الباء الساكنة وتفخيم الراء",
                category: "qalqalah",
                severity: "khafi",
                letters: "ب ر",
                descriptionAr: "قلقلة الباء باضطراب المخرج دون فتح أو كسر، وتفخيم الراء عند الوقف.",
                howToPronounceAr: ["اضطراب الشفتين عند سكون الباء"]
              }
            ]
          }
        ]
      }
    ]
  }
];

export const PRELOADED_TEST_RECITATIONS: PreloadedRecitationSample[] = [
  {
    id: "sample_fatihah_perfect",
    titleAr: "سورة الفاتحة — تلاوة مرجعية متقنة ومطابقة لأحكام التجويد",
    surahId: 1,
    ayahNumber: 7,
    type: "perfect",
    descriptionAr: "تلاوة صحيحة خالية من اللحن الجلي والخفي، تراعي مقادير المدود ومخارج الصاد والضاد والغنات.",
    intendedErrors: []
  },
  {
    id: "sample_fatihah_lahn_jali",
    titleAr: "سورة الفاتحة — خطأ جلي في حركة التاء وإبدال حرف (أنعمتُ + المستكيم)",
    surahId: 1,
    ayahNumber: 7,
    type: "has_errors",
    descriptionAr: "تحتوي هذه القراءة التجريبية على لحن جلي بتغيير حركة التاء من الفتحة إلى الضمة (أنعمتُ بدلاً من أنعمتَ)، وإبدال القاف كافاً (المستكيم).",
    intendedErrors: [
      {
        wordIndex: 3,
        ruleName: "لحن جلي في حركة تاء الخطاب",
        description: "قُرئت التاء مضمومة (أنعمتُ) والصحيح فتحها (أنعمتَ)؛ لأن هذا يغيّر المعنى التوحيدي تماماً."
      },
      {
        wordIndex: 3,
        ruleName: "لحن جلي بإبدال حرف القاف كافاً",
        description: "نطق القاف كافاً (المستكيم بدلاً من المستقيم)، مما يفسد بنية الكلمة القرآنية."
      }
    ]
  },
  {
    id: "sample_ikhlas_missing_qalqalah",
    titleAr: "سورة الإخلاص — إسقاط قلقلة الدال عند الوقف (أحدْ - الصمدْ)",
    surahId: 112,
    ayahNumber: 1,
    type: "has_errors",
    descriptionAr: "تم تسكين الدال عند رؤوس الآيات دون إبراز القلقلة الكبرى في حروف (قطب جد).",
    intendedErrors: [
      {
        wordIndex: 4,
        ruleName: "إسقاط القلقلة الكبرى عند الوقف",
        description: "انحباس الصوت في مخرج الدال دون حدوث اضطراب القلقلة المطلوب عند الوقف."
      }
    ]
  },
  {
    id: "sample_nas_cut_ghunnah",
    titleAr: "سورة الناس — اختلاس زمن الغنة في النون المشددة (الناس)",
    surahId: 114,
    ayahNumber: 1,
    type: "has_errors",
    descriptionAr: "بتر زمن غنة النون المشددة وقراءتها بحركة واحدة فقط دون إكمال الحركتين المطلوبتين.",
    intendedErrors: [
      {
        wordIndex: 4,
        ruleName: "نقص زمن الغنة في النون المشددة",
        description: "الغنة أُديت بزمن قصير (~0.8 حركة) بينما الحكم التجويدي يوجب حركتين كاملتين."
      }
    ]
  },
  {
    id: "sample_fatihah_short_madd",
    titleAr: "سورة الفاتحة — قصر المد اللازم الكلمي المثقل (الضالين)",
    surahId: 1,
    ayahNumber: 7,
    type: "has_errors",
    descriptionAr: "بتر زمن المد اللازم في (ولا الضالين) وقراءته بحركتين فقط (~400ms) بدلاً من 6 حركات مشبعة.",
    intendedErrors: [
      {
        wordIndex: 9,
        ruleName: "قِصر زمن المد اللازم الكلمي المثقل",
        description: "المطلوب 6 حركات وجوباً، بينما أُدي بحركتين فقط مما يخل بمقدار المد."
      }
    ]
  },
  {
    id: "sample_fatihah_letter_sub",
    titleAr: "سورة الفاتحة — إبدال الحروف (السراط الزين بدلاً من الصراط الذين)",
    surahId: 1,
    ayahNumber: 7,
    type: "has_errors",
    descriptionAr: "إبدال الصاد سيناً مرققة (السراط) وإبدال الذال زاياً (الزين) في موضعين متتاليين.",
    intendedErrors: [
      {
        wordIndex: 1,
        ruleName: "إبدال حرف الصاد سيناً",
        description: "ترقيق الصاد المفخمة حتى صارت سيناً (السراط)."
      },
      {
        wordIndex: 2,
        ruleName: "إبدال حرف الذال زاياً",
        description: "إخراج اللسان في الزاي أو نطق الذال زاياً (الزين) لحن جلي قبيح."
      }
    ]
  },
  {
    id: "sample_silent_noise",
    titleAr: "تسجيل تجريبي غير صالح — صامت أو مشوش للغاية (اختبار تعذّر التقييم)",
    surahId: 1,
    ayahNumber: 7,
    type: "unverified",
    descriptionAr: "تسجيل صوتي فارغ أو يحتوي على ضوضاء محيطة عالية فقط، للتأكد من عدم اختلاق درجة 100% وإظهار «تعذّر تقييم دقة التلاوة».",
    intendedErrors: []
  }
];

export const TAJWEED_CATEGORIES = [
  {
    id: 'all',
    nameAr: 'جميع الأحكام',
    badgeColor: 'bg-emerald-800 text-emerald-100',
    description: 'تحليل شامل لكافة أحكام التجويد واللحن الجلي والخفي.'
  },
  {
    id: 'makhaarij',
    nameAr: 'مخارج الحروف وصفاتها',
    badgeColor: 'bg-amber-800 text-amber-100',
    description: 'التأكد من سلامة نطق الحروف وخروجها من مخارجها الصحيحة (الحلق، اللسان، الشفتان، الخيشوم، الجوف).'
  },
  {
    id: 'nun_sakinah',
    nameAr: 'أحكام النون الساكنة والتنوين',
    badgeColor: 'bg-teal-800 text-teal-100',
    description: 'الإظهار الحلقي، الإدغام بغنة وبغير غنة، الإقلاب، والإخفاء الحقيقي.'
  },
  {
    id: 'madd',
    nameAr: 'أحكام المدود ومقاديرها',
    badgeColor: 'bg-indigo-800 text-indigo-100',
    description: 'المد الطبيعي (2)، المتصل والمنفصل (4-5)، اللازم (6)، العارض للسكون (2/4/6).'
  },
  {
    id: 'qalqalah',
    nameAr: 'أحكام القلقلة (قطب جد)',
    badgeColor: 'bg-blue-800 text-blue-100',
    description: 'القلقلة الصغرى في وسط الكلمة، والكبرى عند الوقف، والأكبر عند المشدد.'
  },
  {
    id: 'ghunnah',
    nameAr: 'الغنة والميم والنون المشددتان',
    badgeColor: 'bg-cyan-800 text-cyan-100',
    description: 'زمن الغنة (حركتان أكمل ما تكون) ومواضعها.'
  },
  {
    id: 'tafkheem_tarqeeq',
    nameAr: 'التفخيم والترقيق',
    badgeColor: 'bg-purple-800 text-purple-100',
    description: 'حروف الاستعلاء (خص ضغط قظ)، وأحكام الراء ولام لفظ الجلالة.'
  },
  {
    id: 'waqf',
    nameAr: 'الوقف والابتداء',
    badgeColor: 'bg-rose-800 text-rose-100',
    description: 'الوقف الجائز والتام والحسن مقابل الوقف القبيح الذي يخل بالمعنى.'
  }
];
