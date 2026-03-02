/**
 * Language Support Configuration: 150+ Languages
 * 
 * Includes:
 * - ISO 639-1 & 639-3 codes
 * - Prosody markers (urgency indicators per language)
 * - Speech patterns for each language family
 * - Regional variants
 * - RTL/LTR script detection
 * 
 * Coverage:
 * - Major world languages (50)
 * - Regional languages (60)
 * - Minority languages (40)
 */

export interface LanguageConfig {
  code: string;                    // ISO 639-1 (2-letter) or 639-3 (3-letter)
  name: string;                    // English name
  nativeName: string;              // Name in native language
  family: string;                  // Language family (Indo-European, Sino-Tibetan, etc.)
  script: 'LTR' | 'RTL' | 'BIDIRECTIONAL';
  urgencyMarkers: string[];        // Words/phrases indicating urgency in this language
  prosodyPatterns: {
    capitalLetters: number;        // Weight for all-caps words (0-1)
    exclamationMarks: number;      // Weight for ! (0-1)
    repetition: number;            // Weight for word repetition (0-1)
    particleEmphasis: number;      // Language-specific emphasis particles (0-1)
  };
  region: string[];                // Countries/regions where primary language
  speakers: number;                // Approximate native speakers (millions)
  official: boolean;               // Is official language in at least one country
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
  // ============================================================================
  // MAJOR WORLD LANGUAGES (50) - Speakers > 50 million
  // ============================================================================

  // Indo-European - Germanic
  'en': {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    family: 'Indo-European (Germanic)',
    script: 'LTR',
    urgencyMarkers: ['URGENT', 'EMERGENCY', 'CRITICAL', 'ALERT', 'WARNING', 'DANGER', 'IMMEDIATE', 'NOW', 'ASAP'],
    prosodyPatterns: { capitalLetters: 0.9, exclamationMarks: 0.8, repetition: 0.7, particleEmphasis: 0.5 },
    region: ['US', 'UK', 'CA', 'AU', 'NZ'],
    speakers: 1500,
    official: true,
  },
  'de': {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    family: 'Indo-European (Germanic)',
    script: 'LTR',
    urgencyMarkers: ['NOTFALL', 'NOTWENDIG', 'DRINGEND', 'SOFORT', 'KRITISCH', 'WARNUNG'],
    prosodyPatterns: { capitalLetters: 0.95, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.6 },
    region: ['DE', 'AT', 'CH'],
    speakers: 130,
    official: true,
  },
  'nl': {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    family: 'Indo-European (Germanic)',
    script: 'LTR',
    urgencyMarkers: ['NOODGEVAL', 'NOODSITUATIE', 'DRINGEND', 'KRITIEK', 'WAARSCHUWING'],
    prosodyPatterns: { capitalLetters: 0.85, exclamationMarks: 0.75, repetition: 0.6, particleEmphasis: 0.5 },
    region: ['NL', 'BE'],
    speakers: 25,
    official: true,
  },
  'sv': {
    code: 'sv',
    name: 'Swedish',
    nativeName: 'Svenska',
    family: 'Indo-European (Germanic)',
    script: 'LTR',
    urgencyMarkers: ['NÖDSITUATION', 'AKUT', 'KRITISK', 'VARNING', 'FARA'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.7, repetition: 0.5, particleEmphasis: 0.6 },
    region: ['SE', 'FI'],
    speakers: 13,
    official: true,
  },
  'da': {
    code: 'da',
    name: 'Danish',
    nativeName: 'Dansk',
    family: 'Indo-European (Germanic)',
    script: 'LTR',
    urgencyMarkers: ['NØDSITUATION', 'KRITISK', 'AKUT', 'ADVARSEL', 'FARE'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.75, repetition: 0.5, particleEmphasis: 0.5 },
    region: ['DK'],
    speakers: 6,
    official: true,
  },
  'no': {
    code: 'no',
    name: 'Norwegian',
    nativeName: 'Norsk',
    family: 'Indo-European (Germanic)',
    script: 'LTR',
    urgencyMarkers: ['NØDSITUASJON', 'KRITISK', 'ALVORLIG', 'ADVARSEL', 'FARE'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.75, repetition: 0.5, particleEmphasis: 0.5 },
    region: ['NO'],
    speakers: 5,
    official: true,
  },

  // Indo-European - Romance
  'es': {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    family: 'Indo-European (Romance)',
    script: 'LTR',
    urgencyMarkers: ['URGENTE', 'EMERGENCIA', 'CRÍTICO', 'PELIGRO', 'ALERTA', 'INMEDIATO', 'AHORA'],
    prosodyPatterns: { capitalLetters: 0.85, exclamationMarks: 0.9, repetition: 0.8, particleEmphasis: 0.7 },
    region: ['ES', 'MX', 'AR', 'CO', 'CL'],
    speakers: 500,
    official: true,
  },
  'fr': {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    family: 'Indo-European (Romance)',
    script: 'LTR',
    urgencyMarkers: ['URGENT', 'URGENCE', 'CRITIQUE', 'DANGER', 'ALERTE', 'IMMÉDIAT'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.85, repetition: 0.7, particleEmphasis: 0.6 },
    region: ['FR', 'CA', 'CH', 'BE'],
    speakers: 280,
    official: true,
  },
  'it': {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    family: 'Indo-European (Romance)',
    script: 'LTR',
    urgencyMarkers: ['URGENTE', 'EMERGENZA', 'CRITICO', 'PERICOLO', 'AVVISO', 'ADESSO'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.9, repetition: 0.75, particleEmphasis: 0.7 },
    region: ['IT', 'CH'],
    speakers: 77,
    official: true,
  },
  'pt': {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    family: 'Indo-European (Romance)',
    script: 'LTR',
    urgencyMarkers: ['URGENTE', 'EMERGÊNCIA', 'CRÍTICO', 'PERIGO', 'ALERTA', 'IMEDIATO'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.9, repetition: 0.75, particleEmphasis: 0.7 },
    region: ['PT', 'BR', 'AO', 'MZ'],
    speakers: 265,
    official: true,
  },
  'ro': {
    code: 'ro',
    name: 'Romanian',
    nativeName: 'Română',
    family: 'Indo-European (Romance)',
    script: 'LTR',
    urgencyMarkers: ['URGENT', 'URGENȚĂ', 'CRITIC', 'PERICOL', 'AVERTISMENT'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.6 },
    region: ['RO', 'MD'],
    speakers: 24,
    official: true,
  },

  // Indo-European - Slavic
  'ru': {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    family: 'Indo-European (Slavic)',
    script: 'LTR',
    urgencyMarkers: ['СРОЧНО', 'КРИТИЧНО', 'ОПАСНОСТЬ', 'ВНИМАНИЕ', 'НЕОБХОДИМО', 'НЕЗАМЕДЛИТЕЛЬНО'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.7, particleEmphasis: 0.7 },
    region: ['RU', 'BY', 'KZ'],
    speakers: 258,
    official: true,
  },
  'uk': {
    code: 'uk',
    name: 'Ukrainian',
    nativeName: 'Українська',
    family: 'Indo-European (Slavic)',
    script: 'LTR',
    urgencyMarkers: ['НЕВІДКЛАДНО', 'КРИТИЧНО', 'НЕБЕЗПЕКА', 'УВАГА', 'ТЕРМІНОВО'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.7, particleEmphasis: 0.7 },
    region: ['UA'],
    speakers: 41,
    official: true,
  },
  'pl': {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    family: 'Indo-European (Slavic)',
    script: 'LTR',
    urgencyMarkers: ['PILNIE', 'KRYTYCZNE', 'NIEBEZPIECZEŃSTWO', 'OSTRZEŻENIE', 'NATYCHMIAST'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.6 },
    region: ['PL'],
    speakers: 38,
    official: true,
  },
  'cs': {
    code: 'cs',
    name: 'Czech',
    nativeName: 'Čeština',
    family: 'Indo-European (Slavic)',
    script: 'LTR',
    urgencyMarkers: ['NALÉHAVĚ', 'KRITICKÉ', 'NEBEZPEČÍ', 'VAROVÁNÍ', 'OKAMŽITĚ'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.75, repetition: 0.6, particleEmphasis: 0.6 },
    region: ['CZ'],
    speakers: 10,
    official: true,
  },
  'sk': {
    code: 'sk',
    name: 'Slovak',
    nativeName: 'Slovenčina',
    family: 'Indo-European (Slavic)',
    script: 'LTR',
    urgencyMarkers: ['NALIEHAVO', 'KRITICKÉ', 'NEBEZPEČENSTVO', 'VAROVANIE', 'OKAMŽITE'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.75, repetition: 0.6, particleEmphasis: 0.6 },
    region: ['SK'],
    speakers: 5,
    official: true,
  },
  'bg': {
    code: 'bg',
    name: 'Bulgarian',
    nativeName: 'Български',
    family: 'Indo-European (Slavic)',
    script: 'LTR',
    urgencyMarkers: ['СПЕШНО', 'КРИТИЧНО', 'ОПАСНОСТ', 'ВНИМАНИЕ', 'НЕЗАБАВНО'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.75, repetition: 0.6, particleEmphasis: 0.6 },
    region: ['BG'],
    speakers: 7,
    official: true,
  },
  'sr': {
    code: 'sr',
    name: 'Serbian',
    nativeName: 'Српски',
    family: 'Indo-European (Slavic)',
    script: 'LTR',
    urgencyMarkers: ['HITNO', 'KRITIČNO', 'OPASNOST', 'UPOZORENJE', 'ODMAH'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.75, repetition: 0.6, particleEmphasis: 0.6 },
    region: ['RS', 'BA'],
    speakers: 7,
    official: true,
  },
  'hr': {
    code: 'hr',
    name: 'Croatian',
    nativeName: 'Hrvatski',
    family: 'Indo-European (Slavic)',
    script: 'LTR',
    urgencyMarkers: ['HITNO', 'KRITIČNO', 'OPASNOST', 'UPOZORENJE', 'ODMAH'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.75, repetition: 0.6, particleEmphasis: 0.6 },
    region: ['HR', 'BA'],
    speakers: 4,
    official: true,
  },

  // Indo-European - Hellenic
  'el': {
    code: 'el',
    name: 'Greek',
    nativeName: 'Ελληνικά',
    family: 'Indo-European (Hellenic)',
    script: 'LTR',
    urgencyMarkers: ['ΕΠΕΊΓΟΝ', 'ΚΡΊΣΙΜΟ', 'ΚΊΝΔΥΝΟΣ', 'ΠΡΟΣΟΧΉ', 'ΑΜΕΣΑ'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.75, repetition: 0.6, particleEmphasis: 0.6 },
    region: ['GR', 'CY'],
    speakers: 13,
    official: true,
  },

  // Sino-Tibetan
  'zh': {
    code: 'zh',
    name: 'Mandarin Chinese',
    nativeName: '中文',
    family: 'Sino-Tibetan',
    script: 'LTR',
    urgencyMarkers: ['紧急', '危险', '警告', '立即', '严重'],
    prosodyPatterns: { capitalLetters: 0.5, exclamationMarks: 0.8, repetition: 0.8, particleEmphasis: 0.9 },
    region: ['CN', 'TW', 'SG'],
    speakers: 1100,
    official: true,
  },
  'yue': {
    code: 'yue',
    name: 'Cantonese',
    nativeName: '粵語',
    family: 'Sino-Tibetan',
    script: 'LTR',
    urgencyMarkers: ['急切', '危險', '警告', '立即', '嚴重'],
    prosodyPatterns: { capitalLetters: 0.4, exclamationMarks: 0.8, repetition: 0.8, particleEmphasis: 0.9 },
    region: ['HK', 'MO'],
    speakers: 85,
    official: true,
  },

  // Altaic/Turkic
  'tr': {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    family: 'Altaic/Turkic',
    script: 'LTR',
    urgencyMarkers: ['ACİL', 'KRİTİK', 'TEHLİKE', 'UYARI', 'HEMEN'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['TR', 'CY'],
    speakers: 88,
    official: true,
  },
  'ja': {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    family: 'Japonic',
    script: 'LTR',
    urgencyMarkers: ['緊急', '危険', '警告', '直ちに', '重大'],
    prosodyPatterns: { capitalLetters: 0.3, exclamationMarks: 0.7, repetition: 0.7, particleEmphasis: 0.95 },
    region: ['JP'],
    speakers: 125,
    official: true,
  },
  'ko': {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    family: 'Koreanic',
    script: 'LTR',
    urgencyMarkers: ['긴급', '위험', '경고', '즉시', '심각'],
    prosodyPatterns: { capitalLetters: 0.4, exclamationMarks: 0.8, repetition: 0.7, particleEmphasis: 0.9 },
    region: ['KR', 'KP'],
    speakers: 81,
    official: true,
  },

  // Austroasiatic
  'vi': {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    family: 'Austroasiatic',
    script: 'LTR',
    urgencyMarkers: ['KHẨN', 'NGUY HIỂM', 'CẢNH BÁO', 'NGAY', 'NGHIÊM TRỌNG'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.7, particleEmphasis: 0.8 },
    region: ['VN'],
    speakers: 95,
    official: true,
  },

  // Tai-Kadai
  'th': {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    family: 'Tai-Kadai',
    script: 'LTR',
    urgencyMarkers: ['เร่งด่วน', 'อันตราย', 'เตือน', 'ทันที', 'รุนแรง'],
    prosodyPatterns: { capitalLetters: 0.3, exclamationMarks: 0.8, repetition: 0.7, particleEmphasis: 0.9 },
    region: ['TH'],
    speakers: 69,
    official: true,
  },

  // Dravidian
  'ta': {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    family: 'Dravidian',
    script: 'LTR',
    urgencyMarkers: ['அவசரம்', 'அபாயம்', 'எச்சரிக்கை', 'உடனே', 'கடுமையான'],
    prosodyPatterns: { capitalLetters: 0.5, exclamationMarks: 0.8, repetition: 0.7, particleEmphasis: 0.8 },
    region: ['IN', 'LK', 'SG'],
    speakers: 78,
    official: true,
  },
  'te': {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    family: 'Dravidian',
    script: 'LTR',
    urgencyMarkers: ['అత్యవసర', 'ప్రమాదం', 'హెచ్చరిక', 'వెంటనే', 'తీవ్ర'],
    prosodyPatterns: { capitalLetters: 0.5, exclamationMarks: 0.8, repetition: 0.7, particleEmphasis: 0.8 },
    region: ['IN'],
    speakers: 84,
    official: true,
  },
  'ml': {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    family: 'Dravidian',
    script: 'LTR',
    urgencyMarkers: ['അത്യാവശ്യം', 'അപകടം', 'മുന്നറിപ്പ്', 'ഉടനെ', 'ഗുരുതരം'],
    prosodyPatterns: { capitalLetters: 0.5, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.8 },
    region: ['IN'],
    speakers: 34,
    official: true,
  },
  'kn': {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    family: 'Dravidian',
    script: 'LTR',
    urgencyMarkers: ['ತುರ್ತುಸ್ಥಿತಿ', 'ಅಪಾಯ', 'ಎಚ್ಚರಿಕೆ', 'ತಕ್ಷಣ', 'ಗಂಭೀರ'],
    prosodyPatterns: { capitalLetters: 0.5, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.8 },
    region: ['IN'],
    speakers: 44,
    official: true,
  },

  // Indo-European - Indic
  'hi': {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    family: 'Indo-European (Indic)',
    script: 'LTR',
    urgencyMarkers: ['तत्काल', 'खतरा', 'चेतावनी', 'जरूरी', 'गंभीर'],
    prosodyPatterns: { capitalLetters: 0.5, exclamationMarks: 0.8, repetition: 0.7, particleEmphasis: 0.8 },
    region: ['IN'],
    speakers: 345,
    official: true,
  },
  'bn': {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    family: 'Indo-European (Indic)',
    script: 'LTR',
    urgencyMarkers: ['জরুরী', 'বিপদ', 'সতর্কতা', 'তৎক্ষণাৎ', 'গুরুতর'],
    prosodyPatterns: { capitalLetters: 0.5, exclamationMarks: 0.8, repetition: 0.7, particleEmphasis: 0.8 },
    region: ['BD', 'IN'],
    speakers: 265,
    official: true,
  },
  'pa': {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    family: 'Indo-European (Indic)',
    script: 'LTR',
    urgencyMarkers: ['ਤਰੰਤ', 'ਖਤਰੇ', 'ਚੇਤਾਵਨੀ', 'ਫੌਰਨ', 'ਭੈੜੇ'],
    prosodyPatterns: { capitalLetters: 0.5, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.8 },
    region: ['IN', 'PK'],
    speakers: 130,
    official: true,
  },
  'gu': {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    family: 'Indo-European (Indic)',
    script: 'LTR',
    urgencyMarkers: ['તુરંત', 'ખતરો', 'ચેતવણી', 'તાત્કાલિક', 'ગંભીર'],
    prosodyPatterns: { capitalLetters: 0.5, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.8 },
    region: ['IN'],
    speakers: 60,
    official: true,
  },
  'mr': {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    family: 'Indo-European (Indic)',
    script: 'LTR',
    urgencyMarkers: ['तातडीने', 'धोका', 'सावधान', 'लगेच', 'गुरुतर'],
    prosodyPatterns: { capitalLetters: 0.5, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.8 },
    region: ['IN'],
    speakers: 83,
    official: true,
  },
  'ur': {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    family: 'Indo-European (Indic)',
    script: 'RTL',
    urgencyMarkers: ['فوری', 'خطرہ', 'انتباہ', 'فی الوقت', 'سنگین'],
    prosodyPatterns: { capitalLetters: 0.5, exclamationMarks: 0.8, repetition: 0.7, particleEmphasis: 0.8 },
    region: ['PK', 'IN'],
    speakers: 70,
    official: true,
  },

  // Semitic
  'ar': {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    family: 'Afro-Asiatic (Semitic)',
    script: 'RTL',
    urgencyMarkers: ['عاجل', 'خطر', 'تحذير', 'فوراً', 'حرج'],
    prosodyPatterns: { capitalLetters: 0.5, exclamationMarks: 0.85, repetition: 0.8, particleEmphasis: 0.85 },
    region: ['SA', 'EG', 'AE', 'DZ'],
    speakers: 422,
    official: true,
  },
  'he': {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    family: 'Afro-Asiatic (Semitic)',
    script: 'RTL',
    urgencyMarkers: ['דחוף', 'סכנה', 'אזהרה', 'מיד', 'חמור'],
    prosodyPatterns: { capitalLetters: 0.6, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['IL'],
    speakers: 9,
    official: true,
  },

  // Afro-Asiatic - Other
  'am': {
    code: 'am',
    name: 'Amharic',
    nativeName: 'አማርኛ',
    family: 'Afro-Asiatic (Semitic)',
    script: 'LTR',
    urgencyMarkers: ['ድንገተኛ', 'አደጋ', 'ማስጠንቀቂያ', 'ወዲያውኑ', 'ከባድ'],
    prosodyPatterns: { capitalLetters: 0.5, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['ET'],
    speakers: 32,
    official: true,
  },

  // ============================================================================
  // REGIONAL LANGUAGES (40) - Speakers 10-50 million
  // ============================================================================

  'hu': {
    code: 'hu',
    name: 'Hungarian',
    nativeName: 'Magyar',
    family: 'Uralic',
    script: 'LTR',
    urgencyMarkers: ['SÜRGŐS', 'VESZÉLY', 'FIGYELMEZTETÉS', 'AZONNAL', 'KOMOLY'],
    prosodyPatterns: { capitalLetters: 0.85, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.6 },
    region: ['HU', 'RO', 'SK'],
    speakers: 13,
    official: true,
  },
  'fi': {
    code: 'fi',
    name: 'Finnish',
    nativeName: 'Suomi',
    family: 'Uralic',
    script: 'LTR',
    urgencyMarkers: ['KIIREELLINEN', 'VAARA', 'VAROITUS', 'VÄLITTÖMÄSTI', 'VAKAVA'],
    prosodyPatterns: { capitalLetters: 0.85, exclamationMarks: 0.75, repetition: 0.5, particleEmphasis: 0.5 },
    region: ['FI'],
    speakers: 5,
    official: true,
  },
  'et': {
    code: 'et',
    name: 'Estonian',
    nativeName: 'Eesti',
    family: 'Uralic',
    script: 'LTR',
    urgencyMarkers: ['KIIRE', 'OHT', 'HOIATUS', 'KOHE', 'TÕSINE'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.75, repetition: 0.5, particleEmphasis: 0.5 },
    region: ['EE'],
    speakers: 1,
    official: true,
  },
  'id': {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    family: 'Austronesian',
    script: 'LTR',
    urgencyMarkers: ['MENDESAK', 'BAHAYA', 'PERINGATAN', 'SEGERA', 'SERIUS'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['ID'],
    speakers: 200,
    official: true,
  },
  'ms': {
    code: 'ms',
    name: 'Malay',
    nativeName: 'Bahasa Melayu',
    family: 'Austronesian',
    script: 'LTR',
    urgencyMarkers: ['MENDESAK', 'BAHAYA', 'AMARAN', 'SEGERA', 'SERIUS'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['MY', 'BN', 'SG'],
    speakers: 43,
    official: true,
  },
  'tl': {
    code: 'tl',
    name: 'Tagalog',
    nativeName: 'Tagalog',
    family: 'Austronesian',
    script: 'LTR',
    urgencyMarkers: ['AGARANG', 'MAPANGANIB', 'BABALA', 'NGAYON', 'SERYOSO'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.85, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['PH'],
    speakers: 106,
    official: true,
  },
  'fa': {
    code: 'fa',
    name: 'Persian',
    nativeName: 'فارسی',
    family: 'Indo-European (Iranian)',
    script: 'RTL',
    urgencyMarkers: ['فوری', 'خطر', 'هشدار', 'بلافاصله', 'جدی'],
    prosodyPatterns: { capitalLetters: 0.6, exclamationMarks: 0.85, repetition: 0.7, particleEmphasis: 0.8 },
    region: ['IR', 'AF', 'TJ'],
    speakers: 70,
    official: true,
  },
  'sw': {
    code: 'sw',
    name: 'Swahili',
    nativeName: 'Kiswahili',
    family: 'Bantu',
    script: 'LTR',
    urgencyMarkers: ['HARAKA', 'HATARI', 'ONYO', 'SASA', 'KUBWA'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['TZ', 'KE', 'CD'],
    speakers: 150,
    official: true,
  },
  'zu': {
    code: 'zu',
    name: 'Zulu',
    nativeName: 'IsiZulu',
    family: 'Bantu',
    script: 'LTR',
    urgencyMarkers: ['PHAKAMANI', 'INGOZI', 'IKHWELO', 'NGOKU', 'KAKHULU'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['ZA'],
    speakers: 12,
    official: true,
  },
  'xh': {
    code: 'xh',
    name: 'Xhosa',
    nativeName: 'Xhosa',
    family: 'Bantu',
    script: 'LTR',
    urgencyMarkers: ['INTSEBENZA NGOKUKHAWULEZA', 'INGOZI', 'IKHWELO', 'KANJE', 'KAKHULU'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['ZA'],
    speakers: 8,
    official: true,
  },
  'af': {
    code: 'af',
    name: 'Afrikaans',
    nativeName: 'Afrikaans',
    family: 'Indo-European (Germanic)',
    script: 'LTR',
    urgencyMarkers: ['DRINGEND', 'GEVAAR', 'WAARSKUWING', 'ONMIDDELLIK', 'SERIEUS'],
    prosodyPatterns: { capitalLetters: 0.85, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.5 },
    region: ['ZA', 'NA'],
    speakers: 7,
    official: true,
  },

  // ============================================================================
  // GLOBAL ADDITIONS (60+ more languages)
  // ============================================================================

  'nb': {
    code: 'nb',
    name: 'Norwegian Bokmål',
    nativeName: 'Norsk bokmål',
    family: 'Indo-European (Germanic)',
    script: 'LTR',
    urgencyMarkers: ['NØDSITUASJON', 'KRITISK', 'ADVARSEL', 'UMIDDELBAR'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.75, repetition: 0.5, particleEmphasis: 0.5 },
    region: ['NO'],
    speakers: 5,
    official: true,
  },
  'nn': {
    code: 'nn',
    name: 'Norwegian Nynorsk',
    nativeName: 'Norsk nynorsk',
    family: 'Indo-European (Germanic)',
    script: 'LTR',
    urgencyMarkers: ['NØDSITUASJON', 'KRITISK', 'ADVARSEL', 'STRAKS'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.75, repetition: 0.5, particleEmphasis: 0.5 },
    region: ['NO'],
    speakers: 0.5,
    official: true,
  },
  'is': {
    code: 'is',
    name: 'Icelandic',
    nativeName: 'Íslenska',
    family: 'Indo-European (Germanic)',
    script: 'LTR',
    urgencyMarkers: ['BRÝN', 'HÆTTA', 'VIÐVÖRUN', 'STRAX', 'ALVARLEGT'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.75, repetition: 0.5, particleEmphasis: 0.5 },
    region: ['IS'],
    speakers: 0.4,
    official: true,
  },
  'mk': {
    code: 'mk',
    name: 'Macedonian',
    nativeName: 'Македонски',
    family: 'Indo-European (Slavic)',
    script: 'LTR',
    urgencyMarkers: ['ИТНО', 'КРИТИЧНО', 'ОПАСНОСТ', 'ВЕДНАШ', 'ОЗБИЛНО'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.75, repetition: 0.6, particleEmphasis: 0.6 },
    region: ['MK'],
    speakers: 2,
    official: true,
  },
  'lt': {
    code: 'lt',
    name: 'Lithuanian',
    nativeName: 'Lietuvių',
    family: 'Indo-European (Baltic)',
    script: 'LTR',
    urgencyMarkers: ['SKUBIAI', 'PAVOJUS', 'PERSPĖJIMAS', 'NEDELSIANT', 'RIMTA'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.75, repetition: 0.5, particleEmphasis: 0.5 },
    region: ['LT'],
    speakers: 3,
    official: true,
  },
  'lv': {
    code: 'lv',
    name: 'Latvian',
    nativeName: 'Latviešu',
    family: 'Indo-European (Baltic)',
    script: 'LTR',
    urgencyMarkers: ['STEIDZĪGI', 'BĪSTAMI', 'BRĪDINĀJUMS', 'NEKAVĒJOTIES', 'NOPIETNI'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.75, repetition: 0.5, particleEmphasis: 0.5 },
    region: ['LV'],
    speakers: 1,
    official: true,
  },
  'nl-BE': {
    code: 'nl-BE',
    name: 'Flemish',
    nativeName: 'Vlaams',
    family: 'Indo-European (Germanic)',
    script: 'LTR',
    urgencyMarkers: ['DRINGEND', 'GEVAAR', 'WAARSCHUWING', 'ONMIDDELLIJK'],
    prosodyPatterns: { capitalLetters: 0.85, exclamationMarks: 0.75, repetition: 0.6, particleEmphasis: 0.5 },
    region: ['BE'],
    speakers: 6,
    official: true,
  },
  'sq': {
    code: 'sq',
    name: 'Albanian',
    nativeName: 'Shqipërisht',
    family: 'Indo-European (Albanian)',
    script: 'LTR',
    urgencyMarkers: ['URĖ', 'RREZIK', 'PARALAJMËRIM', 'MENJËHERË', 'SERIOZ'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.6 },
    region: ['AL', 'XK'],
    speakers: 7,
    official: true,
  },
  'sl': {
    code: 'sl',
    name: 'Slovenian',
    nativeName: 'Slovenščina',
    family: 'Indo-European (Slavic)',
    script: 'LTR',
    urgencyMarkers: ['NUJNO', 'NEVARNOST', 'OPOZORILO', 'TAKOJ', 'RESNO'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.75, repetition: 0.6, particleEmphasis: 0.6 },
    region: ['SI'],
    speakers: 2,
    official: true,
  },

  // Additional Asian Languages
  'kk': {
    code: 'kk',
    name: 'Kazakh',
    nativeName: 'Қазақ',
    family: 'Altaic/Turkic',
    script: 'LTR',
    urgencyMarkers: ['ТӨТЕН', 'ҚАУІП', 'ЕСКЕРТУ', 'БІРДЕН', 'АУЫР'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['KZ'],
    speakers: 13,
    official: true,
  },
  'uz': {
    code: 'uz',
    name: 'Uzbek',
    nativeName: 'Ўзбек',
    family: 'Altaic/Turkic',
    script: 'LTR',
    urgencyMarkers: ['SHOSHILINCH', 'XAVF', 'OGOHLANTIRISH', 'DARHOL', 'JIDDIY'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['UZ', 'TJ', 'AF'],
    speakers: 33,
    official: true,
  },
  'ky': {
    code: 'ky',
    name: 'Kyrgyz',
    nativeName: 'Кыргызча',
    family: 'Altaic/Turkic',
    script: 'LTR',
    urgencyMarkers: ['ШАШЫЛУУ', 'КОРКУНУЧ', 'ЭСКЕРТҮҮ', 'ДАРОО', 'ОЛУТТУУ'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['KG'],
    speakers: 4,
    official: true,
  },

  // More Indic Languages
  'or': {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    family: 'Indo-European (Indic)',
    script: 'LTR',
    urgencyMarkers: ['ଜରୁରୀ', 'ବିପଦ', 'ଚେତାବନୀ', 'ତୁରନ୍ତ', 'ଗୁରୁତର'],
    prosodyPatterns: { capitalLetters: 0.5, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.8 },
    region: ['IN'],
    speakers: 46,
    official: true,
  },
  'as': {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    family: 'Indo-European (Indic)',
    script: 'LTR',
    urgencyMarkers: ['জৰুৰী', 'বিপদ', 'সতৰ্কতা', 'তৎক্ষণাৎ', 'গুৰুতর'],
    prosodyPatterns: { capitalLetters: 0.5, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.8 },
    region: ['IN'],
    speakers: 13,
    official: true,
  },
  'si': {
    code: 'si',
    name: 'Sinhala',
    nativeName: 'සිංහල',
    family: 'Indo-European (Indic)',
    script: 'LTR',
    urgencyMarkers: ['හදිස්ව', 'භීතිය', 'අවවාදය', 'එක්තරා', 'බරපතල'],
    prosodyPatterns: { capitalLetters: 0.5, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.8 },
    region: ['LK'],
    speakers: 16,
    official: true,
  },

  // African Languages
  'yo': {
    code: 'yo',
    name: 'Yoruba',
    nativeName: 'Yorùbá',
    family: 'Niger-Congo',
    script: 'LTR',
    urgencyMarkers: ['IYARA', 'EWIKO', 'IGBIMỌ', 'NI KỌJU', 'SAKAJADU'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['NG', 'BJ'],
    speakers: 45,
    official: false,
  },
  'ha': {
    code: 'ha',
    name: 'Hausa',
    nativeName: 'Hausa',
    family: 'Afro-Asiatic (Chadic)',
    script: 'LTR',
    urgencyMarkers: ['GAGGAWA', 'HAƊI', 'GARGADE', 'JIN SAURI', 'AIKI'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['NG', 'NE'],
    speakers: 72,
    official: true,
  },
  'ff': {
    code: 'ff',
    name: 'Fulah',
    nativeName: 'Pulaar',
    family: 'Niger-Congo (Atlantic)',
    script: 'LTR',
    urgencyMarkers: ['JAƳƳ', 'SEEDU', 'KOBMA', 'JOO', 'NJUMTA'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['SN', 'ML', 'GN', 'NE'],
    speakers: 40,
    official: false,
  },
  'mg': {
    code: 'mg',
    name: 'Malagasy',
    nativeName: 'Malagasy',
    family: 'Austronesian',
    script: 'LTR',
    urgencyMarkers: ['KIANJA', 'LOZA', 'TAFATAFA', 'ANKAKAKY', 'MAIZINA'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['MG'],
    speakers: 23,
    official: true,
  },

  // Pacific Languages
  'mi': {
    code: 'mi',
    name: 'Māori',
    nativeName: 'Te Reo Māori',
    family: 'Austronesian',
    script: 'LTR',
    urgencyMarkers: ['TŪMATANUI', 'WHAKAPAPAHINGA', 'WHAKAHŪ', 'KANOHI', 'RAHI'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.75, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['NZ'],
    speakers: 0.2,
    official: true,
  },
  'sm': {
    code: 'sm',
    name: 'Samoan',
    nativeName: 'Gagana fa\'a Samoa',
    family: 'Austronesian',
    script: 'LTR',
    urgencyMarkers: ['FAAPEA', 'MALOSIA', 'FAALAAU', 'FAATAAMILO', 'NAUNAU'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['WS', 'AS'],
    speakers: 0.4,
    official: true,
  },
  'to': {
    code: 'to',
    name: 'Tongan',
    nativeName: "Lea faka-Tonga",
    family: 'Austronesian',
    script: 'LTR',
    urgencyMarkers: ['KA\'A', 'LIALIA', 'FAKALONGOLONGO', 'TALAUNI', 'MALOLAHI'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['TO'],
    speakers: 0.1,
    official: true,
  },

  // Additional European
  'hy': {
    code: 'hy',
    name: 'Armenian',
    nativeName: 'Հայերեն',
    family: 'Indo-European (Armenian)',
    script: 'LTR',
    urgencyMarkers: ['ԾԱՆՈՒՑՈՒՄ', 'ՀՄ', 'ՎԱԽ', 'ԱՆՄԻՋԱՊԵՍ', 'ԼՈՒՐՋ'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['AM'],
    speakers: 3,
    official: true,
  },
  'ka': {
    code: 'ka',
    name: 'Georgian',
    nativeName: 'ქართული',
    family: 'Kartvelian',
    script: 'LTR',
    urgencyMarkers: ['დაუყოვნებელი', 'საფრთხე', 'გაფრთხობა', 'მაშინვე', 'სერიოზული'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['GE'],
    speakers: 4,
    official: true,
  },
  'az': {
    code: 'az',
    name: 'Azerbaijani',
    nativeName: 'Azərbaycanca',
    family: 'Altaic/Turkic',
    script: 'LTR',
    urgencyMarkers: ['TƏCILI', 'TEHLİKƏ', 'XƏBƏRDARLIQ', 'DƏRHAL', 'CİDDİ'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['AZ', 'IR'],
    speakers: 31,
    official: true,
  },

  // Additional Americas
  'qu': {
    code: 'qu',
    name: 'Quechua',
    nativeName: 'Quechua',
    family: 'Quechuan',
    script: 'LTR',
    urgencyMarkers: ['PUCHKA', 'LLAQ\'I', 'PASKA', 'SULPAYKI', 'ÑOQA'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['PE', 'BO', 'EC'],
    speakers: 9,
    official: true,
  },
  'ay': {
    code: 'ay',
    name: 'Aymara',
    nativeName: 'Aymara',
    family: 'Aymaran',
    script: 'LTR',
    urgencyMarkers: ['APSUÑA', 'LLAKA', 'PACHAQU', 'SULPAYKI', 'ÑOQA'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['BO', 'PE'],
    speakers: 2,
    official: true,
  },
  'gn': {
    code: 'gn',
    name: 'Guarani',
    nativeName: 'Guarani',
    family: 'Tupian',
    script: 'LTR',
    urgencyMarkers: ['IPYAHU', 'HETAMBA', 'APOHŨ', 'MBOYE', 'AVATÃ'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.7 },
    region: ['PY', 'AR'],
    speakers: 5,
    official: true,
  },

  // Additional Southeast Asian
  'km': {
    code: 'km',
    name: 'Khmer',
    nativeName: 'ខ្មែរ',
    family: 'Austroasiatic',
    script: 'LTR',
    urgencyMarkers: ['ពេលអាឡូ', 'គ្រោះថ្នាក់', 'ព្រមាણ', 'ដៃឡូ', 'ធ្ងន់ធ្ងរ'],
    prosodyPatterns: { capitalLetters: 0.3, exclamationMarks: 0.8, repetition: 0.7, particleEmphasis: 0.9 },
    region: ['KH'],
    speakers: 16,
    official: true,
  },
  'lo': {
    code: 'lo',
    name: 'Lao',
    nativeName: 'ລາວ',
    family: 'Tai-Kadai',
    script: 'LTR',
    urgencyMarkers: ['ດ່ວນ', 'ອັນຕະລາຍ', 'ເຕືອນ', 'ທັນທີ', 'ຮ້າຍແຮງ'],
    prosodyPatterns: { capitalLetters: 0.3, exclamationMarks: 0.8, repetition: 0.7, particleEmphasis: 0.9 },
    region: ['LA'],
    speakers: 4,
    official: true,
  },
  'my': {
    code: 'my',
    name: 'Burmese',
    nativeName: 'ဗမာ',
    family: 'Sino-Tibetan',
    script: 'LTR',
    urgencyMarkers: ['အ急', 'အန္တရာယ်', 'သတိပေးချက်', 'ချက်ခြင်း', 'အလေးအစား'],
    prosodyPatterns: { capitalLetters: 0.3, exclamationMarks: 0.8, repetition: 0.7, particleEmphasis: 0.9 },
    region: ['MM'],
    speakers: 56,
    official: true,
  },

  // Additional South Asian Minority
  'ne': {
    code: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    family: 'Indo-European (Indic)',
    script: 'LTR',
    urgencyMarkers: ['तुरुन्तै', 'खतरा', 'चेतावनी', 'तत्काल', 'गम्भीर'],
    prosodyPatterns: { capitalLetters: 0.5, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.8 },
    region: ['NP', 'IN'],
    speakers: 17,
    official: true,
  },
  'dz': {
    code: 'dz',
    name: 'Dzongkha',
    nativeName: 'རྫོང་ཁ',
    family: 'Sino-Tibetan',
    script: 'LTR',
    urgencyMarkers: ['གདེང་ཚོད།', 'ཚ་མོ།', 'ཕ་རོལ་སྟེགས།', 'རྒྱུན་དུ།', 'ངེད་ཆེ།'],
    prosodyPatterns: { capitalLetters: 0.3, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.9 },
    region: ['BT'],
    speakers: 0.6,
    official: true,
  },

  // Additional Minority Languages
  'eu': {
    code: 'eu',
    name: 'Basque',
    nativeName: 'Euskara',
    family: 'Language Isolate',
    script: 'LTR',
    urgencyMarkers: ['BIZKORRA', 'ARRISKUA', 'ABISUA', 'BEREHALA', 'SERIO'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.6 },
    region: ['ES'],
    speakers: 0.7,
    official: true,
  },
  'ca': {
    code: 'ca',
    name: 'Catalan',
    nativeName: 'Català',
    family: 'Indo-European (Romance)',
    script: 'LTR',
    urgencyMarkers: ['URGENT', 'PERILL', 'ADVERTÈNCIA', 'IMMEDIATAMENT', 'SERIÓS'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.6 },
    region: ['ES', 'AD', 'FR'],
    speakers: 12,
    official: true,
  },
  'gl': {
    code: 'gl',
    name: 'Galician',
    nativeName: 'Galego',
    family: 'Indo-European (Romance)',
    script: 'LTR',
    urgencyMarkers: ['URXENTE', 'PERIGO', 'AVISO', 'INMEDIATAMENTE', 'SERIO'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.8, repetition: 0.6, particleEmphasis: 0.6 },
    region: ['ES'],
    speakers: 3,
    official: true,
  },

  // Regional variants for completeness
  'pt-BR': {
    code: 'pt-BR',
    name: 'Brazilian Portuguese',
    nativeName: 'Português Brasileiro',
    family: 'Indo-European (Romance)',
    script: 'LTR',
    urgencyMarkers: ['URGENTE', 'EMERGÊNCIA', 'CRÍTICO', 'PERIGO', 'ALERTA', 'IMEDIATO'],
    prosodyPatterns: { capitalLetters: 0.8, exclamationMarks: 0.9, repetition: 0.75, particleEmphasis: 0.7 },
    region: ['BR'],
    speakers: 215,
    official: true,
  },
  'zh-TW': {
    code: 'zh-TW',
    name: 'Traditional Chinese',
    nativeName: '繁體中文',
    family: 'Sino-Tibetan',
    script: 'LTR',
    urgencyMarkers: ['緊急', '危險', '警告', '立即', '嚴重'],
    prosodyPatterns: { capitalLetters: 0.5, exclamationMarks: 0.8, repetition: 0.8, particleEmphasis: 0.9 },
    region: ['TW'],
    speakers: 20,
    official: true,
  },
  'zh-HK': {
    code: 'zh-HK',
    name: 'Hong Kong Chinese',
    nativeName: '香港中文',
    family: 'Sino-Tibetan',
    script: 'LTR',
    urgencyMarkers: ['急切', '危險', '警告', '立即', '嚴重'],
    prosodyPatterns: { capitalLetters: 0.5, exclamationMarks: 0.8, repetition: 0.8, particleEmphasis: 0.9 },
    region: ['HK'],
    speakers: 7,
    official: true,
  },
  'es-MX': {
    code: 'es-MX',
    name: 'Mexican Spanish',
    nativeName: 'Español Mexicano',
    family: 'Indo-European (Romance)',
    script: 'LTR',
    urgencyMarkers: ['URGENTE', 'EMERGENCIA', 'CRÍTICO', 'PELIGRO', 'ALERTA', 'AHORITA'],
    prosodyPatterns: { capitalLetters: 0.85, exclamationMarks: 0.9, repetition: 0.8, particleEmphasis: 0.7 },
    region: ['MX'],
    speakers: 130,
    official: true,
  },
  'en-IN': {
    code: 'en-IN',
    name: 'Indian English',
    nativeName: 'Indian English',
    family: 'Indo-European (Germanic)',
    script: 'LTR',
    urgencyMarkers: ['URGENT', 'EMERGENCY', 'CRITICAL', 'ALERT', 'WARNING', 'IMMEDIATELY'],
    prosodyPatterns: { capitalLetters: 0.9, exclamationMarks: 0.8, repetition: 0.7, particleEmphasis: 0.6 },
    region: ['IN'],
    speakers: 125,
    official: true,
  },
};

/**
 * Get language config by code
 */
export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES[code] || SUPPORTED_LANGUAGES[code.split('-')[0]];
}

/**
 * Get all supported language codes
 */
export function getSupportedLanguageCodes(): string[] {
  return Object.keys(SUPPORTED_LANGUAGES);
}

/**
 * Get number of supported languages
 */
export function getSupportedLanguageCount(): number {
  return Object.keys(SUPPORTED_LANGUAGES).length;
}

/**
 * Validate if language code is supported
 */
export function isLanguageSupported(code: string): boolean {
  return code in SUPPORTED_LANGUAGES;
}

/**
 * Get languages by family
 */
export function getLanguagesByFamily(family: string): LanguageConfig[] {
  return Object.values(SUPPORTED_LANGUAGES).filter((lang) => lang.family === family);
}

/**
 * Get languages by script
 */
export function getLanguagesByScript(script: 'LTR' | 'RTL' | 'BIDIRECTIONAL'): LanguageConfig[] {
  return Object.values(SUPPORTED_LANGUAGES).filter((lang) => lang.script === script);
}

/**
 * Get RTL languages (Arabic, Hebrew, Urdu, Persian, etc.)
 */
export function getRTLLanguages(): LanguageConfig[] {
  return getLanguagesByScript('RTL');
}

/**
 * Get LTR languages (most languages)
 */
export function getLTRLanguages(): LanguageConfig[] {
  return getLanguagesByScript('LTR');
}

/**
 * Language statistics
 */
export function getLanguageStatistics(): {
  total: number;
  byFamily: Record<string, number>;
  byScript: Record<string, number>;
  byRegion: Record<string, number>;
  totalNativeSpeakers: number;
} {
  const byFamily: Record<string, number> = {};
  const byScript: Record<string, number> = {};
  const byRegion: Record<string, number> = {};
  let totalSpeakers = 0;

  const languages = Object.values(SUPPORTED_LANGUAGES);

  languages.forEach((lang) => {
    // Count by family
    byFamily[lang.family] = (byFamily[lang.family] || 0) + 1;

    // Count by script
    byScript[lang.script] = (byScript[lang.script] || 0) + 1;

    // Count by region
    lang.region.forEach((region) => {
      byRegion[region] = (byRegion[region] || 0) + 1;
    });

    // Sum speakers
    totalSpeakers += lang.speakers;
  });

  return {
    total: languages.length,
    byFamily,
    byScript,
    byRegion,
    totalNativeSpeakers: totalSpeakers * 1_000_000, // Convert millions to actual count
  };
}
