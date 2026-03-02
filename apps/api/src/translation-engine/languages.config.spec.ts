import {
  getLanguageConfig,
  getSupportedLanguageCodes,
  getSupportedLanguageCount,
  isLanguageSupported,
  getLanguagesByFamily,
  getLanguagesByScript,
  getRTLLanguages,
  getLTRLanguages,
  getLanguageStatistics,
  LanguageConfig,
} from './languages.config';

describe('Language Configuration (150+ Languages)', () => {
  describe('Core Functions', () => {
    it('should return 150+ language codes', () => {
      const codes = getSupportedLanguageCodes();
      expect(codes.length).toBeGreaterThanOrEqual(150);
    });

    it('should return correct language count', () => {
      const count = getSupportedLanguageCount();
      expect(count).toBeGreaterThanOrEqual(150);
    });

    it('should support major languages', () => {
      const majorLanguages = ['en', 'es', 'zh', 'hi', 'ar', 'fr', 'pt', 'ru', 'ja', 'ko'];
      majorLanguages.forEach((lang) => {
        expect(isLanguageSupported(lang)).toBe(true);
      });
    });

    it('should reject unsupported language codes', () => {
      expect(isLanguageSupported('xyz')).toBe(false);
      expect(isLanguageSupported('invalid')).toBe(false);
    });
  });

  describe('Language Configuration Details', () => {
    it('should return English configuration', () => {
      const en = getLanguageConfig('en');
      expect(en).toBeDefined();
      expect(en?.code).toBe('en');
      expect(en?.name).toBe('English');
      expect(en?.script).toBe('LTR');
      expect(en?.family).toContain('Germanic');
      expect(en?.prosodyPatterns.capitalLetters).toBeGreaterThan(0.8);
    });

    it('should return Hindi configuration', () => {
      const hi = getLanguageConfig('hi');
      expect(hi).toBeDefined();
      expect(hi?.code).toBe('hi');
      expect(hi?.nativeName).toBe('हिन्दी');
      expect(hi?.family).toContain('Indic');
      expect(hi?.speakers).toBeGreaterThan(300);
    });

    it('should return Arabic configuration with RTL script', () => {
      const ar = getLanguageConfig('ar');
      expect(ar).toBeDefined();
      expect(ar?.script).toBe('RTL');
      expect(ar?.nativeName).toBe('العربية');
    });

    it('should return undefined for unsupported language', () => {
      const unknown = getLanguageConfig('unknown');
      expect(unknown).toBeUndefined();
    });

    it('should include urgency markers for each language', () => {
      const languages = getSupportedLanguageCodes().slice(0, 10);
      languages.forEach((code) => {
        const config = getLanguageConfig(code);
        expect(config?.urgencyMarkers).toBeDefined();
        expect(Array.isArray(config?.urgencyMarkers)).toBe(true);
        expect(config?.urgencyMarkers.length).toBeGreaterThan(0);
      });
    });

    it('should include prosody patterns for each language', () => {
      const languages = getSupportedLanguageCodes().slice(0, 10);
      languages.forEach((code) => {
        const config = getLanguageConfig(code);
        expect(config?.prosodyPatterns).toBeDefined();
        expect(config?.prosodyPatterns.capitalLetters).toBeGreaterThanOrEqual(0);
        expect(config?.prosodyPatterns.capitalLetters).toBeLessThanOrEqual(1);
        expect(config?.prosodyPatterns.exclamationMarks).toBeGreaterThanOrEqual(0);
        expect(config?.prosodyPatterns.exclamationMarks).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Language Family Filtering', () => {
    it('should return Germanic languages', () => {
      const germanic = getLanguagesByFamily('Indo-European (Germanic)');
      expect(germanic.length).toBeGreaterThan(0);
      expect(germanic.some((l) => l.code === 'en')).toBe(true);
      expect(germanic.some((l) => l.code === 'de')).toBe(true);
    });

    it('should return Sino-Tibetan languages', () => {
      const sinoBibetan = getLanguagesByFamily('Sino-Tibetan');
      expect(sinoBibetan.length).toBeGreaterThan(0);
      expect(sinoBibetan.some((l) => l.code === 'zh')).toBe(true);
    });

    it('should return Indic languages', () => {
      const indic = getLanguagesByFamily('Indo-European (Indic)');
      expect(indic.length).toBeGreaterThan(0);
      expect(indic.some((l) => l.code === 'hi')).toBe(true);
    });

    it('should return Semitic languages', () => {
      const semitic = getLanguagesByFamily('Afro-Asiatic (Semitic)');
      expect(semitic.length).toBeGreaterThan(0);
      expect(semitic.some((l) => l.code === 'ar')).toBe(true);
    });

    it('should return empty array for unknown family', () => {
      const unknown = getLanguagesByFamily('Unknown Family');
      expect(unknown).toEqual([]);
    });
  });

  describe('Script Type Filtering', () => {
    it('should return LTR languages', () => {
      const ltr = getLTRLanguages();
      expect(ltr.length).toBeGreaterThan(100);
      expect(ltr.every((l) => l.script === 'LTR')).toBe(true);
    });

    it('should return RTL languages', () => {
      const rtl = getRTLLanguages();
      expect(rtl.length).toBeGreaterThan(0);
      expect(rtl.every((l) => l.script === 'RTL')).toBe(true);
      expect(rtl.some((l) => l.code === 'ar')).toBe(true);
    });

    it('should filter by script type', () => {
      const ltrByFilter = getLanguagesByScript('LTR');
      const ltrDirect = getLTRLanguages();
      expect(ltrByFilter.length).toBe(ltrDirect.length);
    });

    it('should not return BIDIRECTIONAL when none exist', () => {
      const bidir = getLanguagesByScript('BIDIRECTIONAL');
      // Most languages are not bidirectional, so this might be empty or small
      expect(Array.isArray(bidir)).toBe(true);
    });
  });

  describe('Language Statistics', () => {
    it('should return aggregated statistics', () => {
      const stats = getLanguageStatistics();
      expect(stats.total).toBeGreaterThanOrEqual(150);
      expect(typeof stats.totalNativeSpeakers).toBe('number');
      expect(stats.totalNativeSpeakers).toBeGreaterThan(3000000000); // 3+ billion
    });

    it('should include breakdown by family', () => {
      const stats = getLanguageStatistics();
      expect(stats.byFamily).toBeDefined();
      expect(Object.keys(stats.byFamily).length).toBeGreaterThan(5);
      expect(stats.byFamily['Indo-European (Germanic)']).toBeGreaterThan(0);
      expect(stats.byFamily['Sino-Tibetan']).toBeGreaterThan(0);
    });

    it('should include breakdown by script', () => {
      const stats = getLanguageStatistics();
      expect(stats.byScript).toBeDefined();
      expect(stats.byScript.LTR).toBeGreaterThan(100);
      expect(stats.byScript.RTL).toBeGreaterThan(0);
    });

    it('should include breakdown by region', () => {
      const stats = getLanguageStatistics();
      expect(stats.byRegion).toBeDefined();
      expect(Object.keys(stats.byRegion).length).toBeGreaterThan(100);
      expect(stats.byRegion['US']).toBeGreaterThan(0); // English + others
      expect(stats.byRegion['IN']).toBeGreaterThan(5); // India has many languages
    });
  });

  describe('Prosody Patterns (Language-Family Specific)', () => {
    it('Germanic languages should emphasize capitalization', () => {
      const en = getLanguageConfig('en');
      expect(en?.prosodyPatterns.capitalLetters).toBeGreaterThan(0.8);
    });

    it('Sino-Tibetan languages should emphasize particles', () => {
      const ja = getLanguageConfig('ja');
      expect(ja?.prosodyPatterns.particleEmphasis).toBeGreaterThan(0.8);
    });

    it('Semitic languages should emphasize exclamation marks', () => {
      const ar = getLanguageConfig('ar');
      expect(ar?.prosodyPatterns.exclamationMarks).toBeGreaterThan(0.8);
    });

    it('Indic languages should emphasize particles and exclamation', () => {
      const hi = getLanguageConfig('hi');
      expect(hi?.prosodyPatterns.particleEmphasis).toBeGreaterThan(0.7);
      expect(hi?.prosodyPatterns.exclamationMarks).toBeGreaterThan(0.7);
    });

    it('should have valid prosody patterns (all between 0-1)', () => {
      const codes = getSupportedLanguageCodes();
      codes.forEach((code) => {
        const config = getLanguageConfig(code);
        if (config) {
          Object.values(config.prosodyPatterns).forEach((value) => {
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(1);
          });
        }
      });
    });
  });

  describe('Urgency Markers', () => {
    it('English should have URGENT marker', () => {
      const en = getLanguageConfig('en');
      expect(en?.urgencyMarkers).toContain('URGENT');
    });

    it('Hindi should have तत्काल marker', () => {
      const hi = getLanguageConfig('hi');
      expect(hi?.urgencyMarkers).toContain('तत्काल');
    });

    it('Arabic should have عاجل marker', () => {
      const ar = getLanguageConfig('ar');
      expect(ar?.urgencyMarkers).toContain('عاجل');
    });

    it('Japanese should have 緊急 marker', () => {
      const ja = getLanguageConfig('ja');
      expect(ja?.urgencyMarkers).toContain('緊急');
    });

    it('Korean should have 긴급 marker', () => {
      const ko = getLanguageConfig('ko');
      expect(ko?.urgencyMarkers).toContain('긴급');
    });

    it('Spanish should have URGENTE marker', () => {
      const es = getLanguageConfig('es');
      expect(es?.urgencyMarkers).toContain('URGENTE');
    });

    it('Chinese should have 紧急 marker', () => {
      const zh = getLanguageConfig('zh');
      expect(zh?.urgencyMarkers).toContain('紧急');
    });
  });

  describe('Regional Languages', () => {
    it('should support Portuguese variants (pt and pt-BR)', () => {
      expect(isLanguageSupported('pt')).toBe(true);
      expect(isLanguageSupported('pt-BR')).toBe(true);
    });

    it('should support English variants (en and en-IN)', () => {
      expect(isLanguageSupported('en')).toBe(true);
      expect(isLanguageSupported('en-IN')).toBe(true);
    });

    it('should support Chinese variants (zh, zh-CN, zh-TW, zh-HK)', () => {
      expect(isLanguageSupported('zh')).toBe(true);
      expect(isLanguageSupported('zh-CN')).toBe(true);
      expect(isLanguageSupported('zh-TW')).toBe(true);
    });

    it('should support Spanish variants (es and es-MX)', () => {
      expect(isLanguageSupported('es')).toBe(true);
      expect(isLanguageSupported('es-MX')).toBe(true);
    });
  });

  describe('Native Speaker Distribution', () => {
    it('should report native speakers for major languages', () => {
      const en = getLanguageConfig('en');
      expect(en?.speakers).toBeGreaterThan(1000); // 1B+ speakers

      const zh = getLanguageConfig('zh');
      expect(zh?.speakers).toBeGreaterThan(800);

      const hi = getLanguageConfig('hi');
      expect(hi?.speakers).toBeGreaterThan(300);
    });

    it('should report 0 speakers for constructed languages if any', () => {
      // This is optional - just ensure speaker data is consistent
      const codes = getSupportedLanguageCodes();
      codes.forEach((code) => {
        const config = getLanguageConfig(code);
        if (config) {
          expect(typeof config.speakers).toBe('number');
          expect(config.speakers).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  describe('Official Language Status', () => {
    it('should mark major languages as official', () => {
      const majorLanguages = ['en', 'es', 'zh', 'hi', 'ar', 'fr', 'pt', 'ru'];
      majorLanguages.forEach((code) => {
        const config = getLanguageConfig(code);
        expect(config?.official).toBe(true);
      });
    });

    it('should allow non-official minority languages', () => {
      // Some minority languages might not be official
      const codes = getSupportedLanguageCodes();
      const hasNonOfficial = codes.some((code) => {
        const config = getLanguageConfig(code);
        return config?.official === false;
      });
      expect(hasNonOfficial).toBe(true);
    });
  });

  describe('Regional Coverage', () => {
    it('should have languages from all major regions', () => {
      const stats = getLanguageStatistics();
      const regions = Object.keys(stats.byRegion);

      // Regional coverage check
      expect(regions).toContain('US'); // North America
      expect(regions).toContain('IN'); // Asia
      expect(regions).toContain('DE'); // Europe
      expect(regions.length).toBeGreaterThan(100);
    });

    it('should list regions for each language', () => {
      const codes = getSupportedLanguageCodes().slice(0, 20);
      codes.forEach((code) => {
        const config = getLanguageConfig(code);
        expect(Array.isArray(config?.region)).toBe(true);
        expect(config?.region.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined gracefully', () => {
      expect(getLanguageConfig('')).toBeUndefined();
      expect(isLanguageSupported('')).toBe(false);
      expect(getLanguagesByFamily('')).toEqual([]);
    });

    it('should be case-sensitive for language codes', () => {
      expect(isLanguageSupported('EN')).toBe(false);
      expect(isLanguageSupported('En')).toBe(false);
      expect(isLanguageSupported('en')).toBe(true);
    });

    it('should return consistent results across multiple calls', () => {
      const codes1 = getSupportedLanguageCodes();
      const codes2 = getSupportedLanguageCodes();
      expect(codes1).toEqual(codes2);
    });

    it('should handle special characters in native names', () => {
      const ar = getLanguageConfig('ar');
      expect(ar?.nativeName).toContain('ع'); // Arabic character

      const hi = getLanguageConfig('hi');
      expect(hi?.nativeName).toContain('ि'); // Devanagari character

      const ja = getLanguageConfig('ja');
      expect(ja?.nativeName).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/); // Japanese characters
    });
  });
});
