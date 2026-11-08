import { AIRecommendations, GeminiInputPayload } from '../types';
import { generateDeterministicRecommendations } from '../utils/fallbackGenerator';

export interface RecommendationResponse {
  recommendations: AIRecommendations;
  isAiGenerated: boolean;
  errorMessage?: string;
}

export async function fetchAIRecommendations(
  payload: GeminiInputPayload
): Promise<RecommendationResponse> {
  const fallback = generateDeterministicRecommendations(payload);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000); // 18s timeout

    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      console.warn('API /api/recommendations error:', errorJson);
      return {
        recommendations: fallback,
        isAiGenerated: false,
        errorMessage: errorJson.error || `Server error (${response.status})`,
      };
    }

    const result = await response.json();
    if (result && result.success && result.data) {
      const data: AIRecommendations = result.data;

      // Validate structure
      if (
        Array.isArray(data.stock_explanations) &&
        Array.isArray(data.slow_hour_promotions) &&
        Array.isArray(data.low_margin_warnings) &&
        typeof data.general_insight === 'string'
      ) {
        // Enforce that recommended_portions matches deterministic payload
        const inputMap = new Map<string, number>();
        payload.stock_recommendations.forEach(s => {
          inputMap.set(`${s.hour}__${s.menu}`, s.recommended_portions);
        });

        const verifiedStockExplanations = data.stock_explanations.map(item => {
          const expectedPortions = inputMap.get(`${item.hour}__${item.menu}`);
          return {
            ...item,
            recommended_portions:
              expectedPortions !== undefined ? expectedPortions : item.recommended_portions,
          };
        });

        return {
          recommendations: {
            ...data,
            stock_explanations: verifiedStockExplanations,
          },
          isAiGenerated: true,
        };
      }
    }

    // Invalid format
    return {
      recommendations: fallback,
      isAiGenerated: false,
      errorMessage: 'Format data AI tidak sesuai skema.',
    };
  } catch (err: any) {
    console.warn('Fetch error for recommendations:', err);
    const isTimeout = err.name === 'AbortError';
    return {
      recommendations: fallback,
      isAiGenerated: false,
      errorMessage: isTimeout
        ? 'Permintaan ke AI melebihi batas waktu (timeout).'
        : `Koneksi ke server gagal: ${err.message || 'Error jaringan'}`,
    };
  }
}
