import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Helper to initialize GoogleGenAI securely on the server
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// POST /api/recommendations
app.post('/api/recommendations', async (req: Request, res: Response): Promise<void> => {
  const payload = req.body;

  if (!payload || !payload.summary || !payload.stock_recommendations) {
    res.status(400).json({ error: 'Payload analisis tidak lengkap.' });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Return flag indicating AI API key is not configured so client can use deterministic fallback
    res.status(503).json({
      error: 'GEMINI_API_KEY belum dikonfigurasi pada server.',
      useFallback: true,
    });
    return;
  }

  try {
    const systemInstruction = `Kamu adalah konsultan bisnis untuk UMKM kedai kopi kecil di Indonesia. Tugasmu adalah menjelaskan hasil analisis penjualan yang sudah dihitung oleh sistem dan memberikan rekomendasi bisnis praktis. Semua angka yang diberikan oleh sistem merupakan sumber kebenaran. Jangan menghitung ulang, mengubah, atau menciptakan angka. Jangan membuat asumsi faktual yang tidak tersedia di input. Berikan saran yang sederhana, realistis, dan dapat diterapkan oleh kedai kopi kecil dengan 1-3 karyawan. Selalu keluarkan JSON sesuai schema.`;

    const promptText = `Berikut adalah data hasil analisis penjualan deterministik untuk kedai kopi:
${JSON.stringify(payload, null, 2)}

Buat rekomendasi dalam format JSON sesuai ketentuan:
1. stock_explanations: Jelaskan alasan persiapan untuk setiap kombinasi jam dan menu di stock_recommendations. Nilai "recommended_portions", "hour", dan "menu" WAJIB SAMA PERSIS DENGAN INPUT.
2. slow_hour_promotions: Berikan usulan promo kreatif untuk jam sepi di slow_hours. Gunakan target_menu yang benar-benar ada di daftar menu.
3. low_margin_warnings: Berikan peringatan ramah dan solusi praktis untuk menu di low_margin_menus.
4. general_insight: Rangkuman strategi operasional singkat dalam 1-2 kalimat.`;

    let rawText = '';
    let lastError: any = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, 1500));
        }

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptText,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  stock_explanations: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        hour: { type: Type.STRING },
                        menu: { type: Type.STRING },
                        recommended_portions: { type: Type.INTEGER },
                        explanation: { type: Type.STRING },
                      },
                      required: ['hour', 'menu', 'recommended_portions', 'explanation'],
                    },
                  },
                  slow_hour_promotions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        hour: { type: Type.STRING },
                        promotion_name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        target_menu: { type: Type.STRING },
                        reason: { type: Type.STRING },
                      },
                      required: ['hour', 'promotion_name', 'description', 'target_menu', 'reason'],
                    },
                  },
                  low_margin_warnings: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        menu: { type: Type.STRING },
                        warning: { type: Type.STRING },
                        suggestion: { type: Type.STRING },
                      },
                      required: ['menu', 'warning', 'suggestion'],
                    },
                  },
                  general_insight: { type: Type.STRING },
                },
                required: [
                  'stock_explanations',
                  'slow_hour_promotions',
                  'low_margin_warnings',
                  'general_insight',
                ],
              },
            },
          });

          rawText = (response.text || '').trim();
          if (rawText) break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Gemini attempt ${attempt + 1} error:`, err.message || err);
          if (err.message && err.message.includes('503')) {
            continue;
          }
          break;
        }
      }

    if (!rawText) {
      throw lastError || new Error('Tidak menerima respons dari model Gemini.');
    }

    const aiResult = JSON.parse(rawText);

    // CRITICAL VALIDATION: Ensure numbers match deterministic code input
    const inputStockMap = new Map<string, number>();
    for (const item of payload.stock_recommendations) {
      inputStockMap.set(`${item.hour}__${item.menu}`, item.recommended_portions);
    }

    if (Array.isArray(aiResult.stock_explanations)) {
      aiResult.stock_explanations = aiResult.stock_explanations.map((item: any) => {
        const expectedPortions = inputStockMap.get(`${item.hour}__${item.menu}`);
        return {
          ...item,
          recommended_portions: expectedPortions !== undefined ? expectedPortions : item.recommended_portions,
        };
      });
    }

    res.json({
      success: true,
      data: aiResult,
    });
  } catch (error: any) {
    console.error('Error memanggil Gemini API:', error);
    res.status(500).json({
      error: `Gagal memproses rekomendasi AI: ${error.message || 'Error tidak diketahui'}`,
      useFallback: true,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StokPas server running on port ${PORT} (production: ${isProduction})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
