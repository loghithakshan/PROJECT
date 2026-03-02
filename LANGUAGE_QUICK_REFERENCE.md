# Quick Reference: Language Support

## 🌍 Available Languages (150+)

### By Continent

#### 🌎 Americas (25 languages)
**North America (3):** English (en), Spanish (es-MX), French (fr-CA)
**Central America (4):** Spanish, Belize Kriol, Nahuatl, K'iche'
**South America (10):** Portuguese (pt-BR), Spanish (es-AR, es-CL), Quechua (qu), Aymara (ay), Guarani (gn), Aimara, Mapudungun, Shuar, Asháninka
**Caribbean (8):** English, Spanish, French (ht), Dutch (pap - Papiamento)

#### 🌍 Africa (25 languages)
**West Africa:** Swahili, Yoruba, Hausa, Igbo, Wolof, Bambara
**East Africa:** Swahili (sw), Amharic (am), Tigrinya
**Central Africa:** Fang, Lingala, Kikongo
**Southern Africa:** Zulu (zu), Xhosa (xh), Sotho, Tswana, Shona
**North Africa:** Arabic (ar), Tamazight, Tarifit, Tachelhit, Darija

#### 🌏 Asia-Pacific (80+ languages)
**South Asia (15):** Hindi (hi), Bengali (bn), Tamil (ta), Telugu (te), Kannada (kn), Malayalam (ml), Punjabi (pa), Marathi (mr), Gujarati (gu), Nepali (ne), Assamese, Manipuri, Odia (or), Urdu (ur), Sindhi
**East Asia (8):** Mandarin Chinese (zh), Cantonese (zh-HK), Japanese (ja), Korean (ko), Vietnamese (vi), Thai (th), Lao (lo), Burmese (my)
**Southeast Asia (8):** Indonesian (id), Malay (ms), Tagalog (tl), Thai, Lao, Khmer (km), Myanmar, Burmese
**Central Asia (4):** Kazakh (kk), Uzbek (uz), Kyrgyz (ky), Turkmen
**Pacific (15):** Samoan (sm), Tongan (to), Fijian (fj), Hawaiian (haw), Māori (mi), Niuean, Tokelauan, Tuvaluan, Kiribati, Marshallese, Palauan, Chamorro, Solomon Islander, Vanuatuan, Nauruan

#### 🏔️ Europe (35+ languages)
**Western Europe:** English (en), French (fr), German (de), Spanish (es), Portuguese (pt), Dutch (nl), Belgian French (fr-BE), Flemish
**Southern Europe:** Italian (it), Romanian (ro), Spanish, Portuguese, Greek (el)
**Northern Europe:** Swedish (sv), Norwegian (no), Danish (da), Finnish (fi), Icelandic (is), Estonian (et), Latvian (lv), Lithuanian (lt)
**Eastern Europe:** Russian (ru), Ukrainian (uk), Polish (pl), Czech (cs), Slovak (sk), Hungarian (hu), Bulgarian (bg), Serbian (sr), Croatian (hr), Slovenian (sl), Bosnian (bs), Albanian (sq), Macedonian (mk)
**Special:** Basque (eu), Catalan (ca), Galician (gl), Corsican, Occitan, Irish (ga), Welsh (cy), Scottish Gaelic (gd), Breton, Luxembourgish

#### 🌋 Middle East & Central Asia (15 languages)
**Middle East:** Arabic (ar), Hebrew (he), Persian (fa), Turkish (tr), Kurdish (ku), Uyghur (ug), Pashto (ps), Balochi, Arabic dialects
**Central Asia:** Kazakh, Uzbek, Turkmen, Kyrgyz, Tajik (tg)

---

## 🔑 Language Codes Reference

### Major Languages (Top 10)
```
zh    - Mandarin Chinese (920M speakers)
es    - Spanish (475M)
en    - English (400M+)
hi    - Hindi (345M)
ar    - Arabic (422M)
pt    - Portuguese (252M)
bn    - Bengali (265M)
ru    - Russian (258M)
ja    - Japanese (125M)
pa    - Punjabi (125M)
```

### UN Official Languages
```
en    - English
es    - Spanish
fr    - French (fr)
ru    - Russian (ru)
zh    - Mandarin Chinese
ar    - Arabic
```

### Regional Variants
```
Portuguese:
  pt    - Portuguese (Portugal)
  pt-BR - Brazilian Portuguese

English:
  en    - English (UK/General)
  en-IN - Indian English
  en-AU - Australian English
  en-US - American English (variant)

Chinese:
  zh    - Simplified Chinese (Mainland)
  zh-CN - Simplified Chinese (China)
  zh-TW - Traditional Chinese (Taiwan)
  zh-HK - Traditional Chinese (Hong Kong)
  zh-MO - Traditional Chinese (Macau)

Spanish:
  es    - Spanish (Spain)
  es-MX - Mexican Spanish
  es-AR - Argentine Spanish
  es-CL - Chilean Spanish

Arabic:
  ar    - Modern Standard Arabic
  ar-SA - Saudi Arabic
  ar-EG - Egyptian Arabic
  ar-AE - UAE Arabic
```

---

## 📊 Script Types

### LTR (Left-to-Right) - 130 languages
Most languages including: English, Spanish, French, Russian, Chinese (romanized), Japanese, Korean, Hindi, Bengali, Thai, Vietnamese, etc.

### RTL (Right-to-Left) - 4 languages
```
ar    - Arabic
he    - Hebrew
ur    - Urdu
fa    - Persian (Farsi)
```

⚠️ **Important:** For RTL languages, ensure your UI supports bidirectional text rendering.

---

## 🚀 Quick Start Examples

### JavaScript/TypeScript
```typescript
// Check if language supported
const isSupported = await translationService.validateLanguage('hi');
// → true

// Get supported languages
const languages = await translationService.getSupportedLanguages();
// → [{ code: 'en', name: 'English', nativeName: 'English' }, ...]

// Get language stats
const stats = await translationService.getLanguageStatistics();
// → { total: 150, byFamily: {...}, byScript: {...}, ... }

// Translate with language-specifics
const result = await translationService.translateWithFidelity({
  text: "URGENT: Flood warning!",
  sourceLang: "en",
  targetLang: "hi",
  preserveUrgency: true
});
// → { translatedText: "तत्काल: बाढ़ की चेतावनी!", prosodyScore: 0.82 }
```

### cURL
```bash
# List all 150 languages
curl http://localhost:3000/translation/languages \
  -H "Authorization: Bearer $TOKEN" | jq '.[].code'

# Get Hindi language details
curl http://localhost:3000/translation/languages/hi \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Translate English to Arabic (RTL)
curl -X POST http://localhost:3000/translation/translate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "URGENT: Emergency evacuation",
    "sourceLang": "en",
    "targetLang": "ar",
    "preserveUrgency": true
  }' | jq '.'

# Get language statistics
curl http://localhost:3000/translation/languages/stats \
  -H "Authorization: Bearer $TOKEN" | jq '.total, .byScript'
```

---

## 💡 Use Cases by Language Family

### Germanic Languages
**Use for:** English, German, Dutch speakers
**Key:** Urgency = Capitalization + Exclamation marks
```
Source (en): URGENT!!!
Target (de): DRINGEND!!!
Prosody: Excellent (0.9+)
```

### Romance Languages
**Use for:** Spanish, French, Italian, Portuguese speakers
**Key:** Urgency = Exclamation marks + Capitalization
```
Source (pt): URGENTE!
Target (fr): URGENT!
Prosody: Excellent (0.85+)
```

### Sino-Tibetan Languages
**Use for:** Chinese, Japanese, Korean speakers
**Key:** Urgency = Particles + Repetition (NOT capitalization)
```
Source (ja): 緊急!!!
Target (zh): 紧急!!!
Prosody: Excellent (0.85+)
```

### Semitic Languages
**Use for:** Arabic, Hebrew speakers
**Key:** Urgency = Exclamation marks + Repetition
**Script:** RTL (Right-to-Left)
```
Source (ar): عاجل!!!
Target (he): דחוף!!!
Prosody: Excellent (0.85+)
```

### Indic Languages
**Use for:** Hindi, Bengali, Tamil, Telugu, Kannada speakers
**Key:** Urgency = Particles + Exclamation marks + Repetition
```
Source (hi): तत्काल!!!
Target (ta): அவசரம்!!!
Prosody: Excellent (0.85+)
```

---

## ⚡ Optimization Tips

### For High-Volume Translation
1. **Cache language configs** - Languages don't change often
2. **Batch translations** - Group multiple translations in one request
3. **Use regional variants smartly** - pt-BR different from pt (Portugal)
4. **Pre-validate language codes** - Check support before heavy processing

### For UI/UX
1. **Display native names** - Use `nativeName` field for speakers
   ```
   Instead: "English"
   Better: "English" or "English" with flag
   Best: Let users see 中文, हिन्दी, العربية in their own script
   ```

2. **RTL support** - Detect RTL languages and apply `dir="rtl"` to containers
   ```html
   <div dir="ltr">English text</div>
   <div dir="rtl">نص عربي</div>
   ```

3. **Language selector optimization**
   ```typescript
   // Group by family/region instead of alphabetical
   {
     "Indo-European (Germanic)": [
       { code: "en", name: "English", speakers: 1500 },
       { code: "de", name: "German", speakers: 131 }
     ],
     "Indo-European (Romance)": [...]
   }
   ```

### For Mobile Apps
1. **Lazy load language configs** - Don't load all 150 at startup
2. **Cache responses** - Store language list locally
3. **Offline fallback** - Have essential languages (en, es, hi, ar, zh) cached
4. **Network optimization** - Compress language metadata (140 languages ≈ 50KB gzipped)

---

## 🧪 Testing Language Support

### Test Multiple Families
```bash
# Test Germanic
curl ... -d '{"sourceLang":"en", "targetLang":"de"}'

# Test Romance
curl ... -d '{"sourceLang":"es", "targetLang":"pt-BR"}'

# Test Sino-Tibetan
curl ... -d '{"sourceLang":"zh", "targetLang":"ja"}'

# Test Semitic (RTL)
curl ... -d '{"sourceLang":"ar", "targetLang":"he"}'

# Test Indic
curl ... -d '{"sourceLang":"hi", "targetLang":"ta"}'
```

### Verify Urgency Preservation
```javascript
// Test phrase in different languages
const phrases = {
  en: "URGENT: Flood warning!",
  es: "URGENTE: ¡Advertencia de inundación!",
  hi: "तत्काल: बाढ़ की चेतावनी!",
  ar: "عاجل: تحذير الفيضانات!",
  ja: "緊急: 浜辺での洪水警告!"
};

// All should have prosodyScore > 0.80
```

---

## 🐛 Troubleshooting

### Language Not Recognized
```
Error: "Unsupported language code: xyz"
Solution: Check language code format:
- Correct: "en", "pt-BR", "zh-TW"
- Incorrect: "ENG", "português-BR", "chinese"
```

### RTL Text Appearing LTR
```
Issue: Arabic/Hebrew text reversed in UI
Solution: Add dir="rtl" to parent container
<div dir="rtl">
  {arabicText}
</div>
```

### Prosody Score Too Low
```
Issue: Translation lost urgency (score < 0.6)
Problem: Source language' urgency patterns didn't translate well
Solution 1: Use language family rules differently
Solution 2: Try back-translation to verify
Solution 3: Check if target language has formal speech patterns
```

### Language Variants Confusion
```
Issue: "Should I use 'zh' or 'zh-TW'?"
Answer: 
- zh = Simplified (mainland China)
- zh-TW = Traditional (Taiwan)
- zh-HK = Traditional (Hong Kong)
Use variant if you know user's specific region
```

---

## 📚 Language Code Lookup

### By ISO 639-1 (2-letter)
```
en, es, fr, de, it, pt, ru, ja, ko, zh, ar, he, hi, bn, ta, th, vi, id, tr, pl, uk, cs, nl, sv, no, da, fi, el, hu, ro, bg, hr, sr, sk, sl, et, lv, lt, af, eo, sq, hy, eu, be, ca, cy, ga, gl, gd, ka, hu, fa, ur, ug, kk, uz, ky, tg, tt, ba, ...
```

### By Language Name
```
Arabic: ar
Bengali: bn
Chinese: zh (or zhCN/zhTW/zhHK)
English: en
French: fr
German: de
Hebrew: he
Hindi: hi
Japanese: ja
Korean: ko
Portuguese: pt (or ptBR)
Russian: ru
Spanish: es
Turkish: tr
Vietnamese: vi
```

### Lookup Table Reference
See `languages.config.ts` for complete mapping:
```typescript
import { getLanguageConfig, getSupportedLanguageCodes } from './languages.config';

// Get all codes
const allCodes = getSupportedLanguageCodes();

// Get specific language
const hindi = getLanguageConfig('hi');
```

---

## 🎯 Language Selection Strategy

### For Emergency Response Platform:
1. **Critical tier** (always available):
   - en, es, fr, ru, zh, ar, hi, pt, ja, ko
   - Covers 80% of world's population

2. **Important tier** (should have):
   - Add: de, it, pl, uk, tr, vi, id, th, bn, te, mr, ta, te, ne, ur
   - Adds regional coverage for South/Southeast Asia, Eastern Europe

3. **Comprehensive tier** (complete):
   - All 150 languages for true global coverage
   - Supports minority/indigenous languages
   - Better community trust and inclusivity

### Implementation Decision:
```typescript
// Start with critical tier
const criticalLanguages = ['en', 'es', 'fr', 'ru', 'zh', 'ar', 'hi', 'pt', 'ja', 'ko'];

// Expand based on user requests
const userRegion = getUserRegion(); // From geo-IP or user pref
const regionalLanguagePacks = {
  'Europe': ['de', 'it', 'pl', 'nl', 'sv'],
  'Asia': ['vi', 'th', 'bn', 'ta', 'te'],
  'Americas': ['pt-BR', 'es-MX'],
  'Africa': ['sw', 'yo', 'am'],
  'MiddleEast': ['ur', 'fa', 'tr']
};

// Allow users to opt-in to full 150-language support
const supportFull150 = userSettings.globalLanguageSupport;
```

---

## 🔗 Related Resources

- **Main Documentation:** [LANGUAGE_SUPPORT_API.md](LANGUAGE_SUPPORT_API.md)
- **Complete Implementation:** [COMPLETE_IMPLEMENTATION.md](COMPLETE_IMPLEMENTATION.md)
- **API Reference:** [REST_API.md](REST_API.md)
- **Language Config:** `backend/apps/api/src/translation-engine/languages.config.ts`
- **Tests:** `backend/apps/api/src/translation-engine/languages.config.spec.ts`

---

## ✅ Checklist for Implementation

- [ ] Import language functions in your service
- [ ] Validate user language input before processing
- [ ] Handle RTL languages with `dir="rtl"` in UI
- [ ] Cache language metadata for performance
- [ ] Test with at least 5 different language families
- [ ] Monitor prosody scores (should be > 0.7 for good translation)
- [ ] Display native language names to users
- [ ] Handle language variants (pt-BR vs pt)
- [ ] Provide language statistics in UI/dashboard
- [ ] Document your language support in API docs

---

**Last Updated:** 2024  
**Version:** 2.0.0  
**Status:** ✅ Complete with 150+ languages
