import { Controller, Post, Get, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { TranslationEngineService } from './translation-engine.service';
import { TranslateRequest, TranslateResponse } from '@core/types';
import { JwtAuthGuard } from '../auth/jwt.strategy';

/**
 * Translation-Engine Controller: Multilingual Emergency Broadcasting
 * 
 * Endpoints for translating critical alerts with semantic urgency preservation
 */
@Controller('translation')
export class TranslationEngineController {
  constructor(private translationService: TranslationEngineService) {}

  /**
   * @route POST /translation/translate
   * @description Translate alert with prosody scoring + ZK fidelity proof
   * 
   * @body {
   *   "text": "URGENT: Flood warning in downtown area!",
   *   "sourceLang": "en",
   *   "targetLang": "es",
   *   "preserveUrgency": true
   * }
   * 
   * @returns { translationId, translatedText, prosodyScore, zkFidelityProofId }
   * 
   * @security
   * - Text translated on edge (TensorFlow.js) or via secure API
   * - Prosody score validates urgency preservation
   * - ZK proof certifies fidelity WITHOUT revealing text
   */
  @Post('translate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async translate(@Body() request: TranslateRequest): Promise<TranslateResponse> {
    return this.translationService.translateWithFidelity(request);
  }

  /**
   * @route GET /translation/metrics
   * @description Get translation quality metrics (system health)
   * 
   * @returns { totalTranslations, avgProsodyScore, successRate }
   */
  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMetrics() {
    return this.translationService.getMetrics();
  }

  /**
   * @route GET /translation/languages
   * @description List all 150+ supported languages with metadata
   * 
   * @returns [{
   *   "code": "en",
   *   "name": "English",
   *   "nativeName": "English",
   *   "family": "Indo-European (Germanic)",
   *   "script": "LTR",
   *   "speakers": 1500
   * }, ...]
   * 
   * @security Requires authentication to access language metadata
   */
  @Get('languages')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getSupportedLanguages() {
    return this.translationService.getSupportedLanguages();
  }

  /**
   * @route GET /translation/languages/:code
   * @description Get detailed configuration for a specific language
   * 
   * @param code Language code (ISO 639-1 or 639-3)
   * 
   * @returns {
   *   "code": "hi",
   *   "name": "Hindi",
   *   "nativeName": "हिन्दी",
   *   "family": "Indo-European (Indic)",
   *   "script": "LTR",
   *   "urgencyMarkers": ["तत्काल", "खतरा", ...],
   *   "prosodyPatterns": { "capitalLetters": 0.5, "exclamationMarks": 0.8, ... },
   *   "region": ["IN"],
   *   "speakers": 345,
   *   "official": true
   * }
   * 
   * @throws 400 if language code invalid or unsupported
   */
  @Get('languages/:code')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getLanguageDetail(@Param('code') code: string) {
    return this.translationService.validateLanguage(code);
  }

  /**
   * @route GET /translation/languages/stats
   * @description Get aggregated language coverage statistics
   * 
   * @returns {
   *   "total": 150,
   *   "byFamily": {
   *     "Indo-European (Germanic)": 6,
   *     "Indo-European (Romance)": 7,
   *     "Sino-Tibetan": 5,
   *     ...
   *   },
   *   "byScript": {
   *     "LTR": 130,
   *     "RTL": 4,
   *     "BIDIRECTIONAL": 0
   *   },
   *   "byRegion": {
   *     "IN": 15,
   *     "CN": 3,
   *     "US": 1,
   *     ...
   *   },
   *   "totalNativeSpeakers": 4000000000
   * }
   * 
   * @security Requires authentication; reveals platform language coverage
   */
  @Get('languages/stats')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getLanguageStatistics() {
    return this.translationService.getLanguageStatistics();
  }
}
