import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY || '';
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString()
  });
});

// 2. AI Connection Status & Diagnostics
app.get('/api/ai/status', async (req, res) => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  let geminiConnected = false;
  let geminiLatencyMs = 0;
  let geminiError: string | null = null;

  if (hasGemini) {
    const start = Date.now();
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Ping',
      });
      if (response && response.text) {
        geminiConnected = true;
        geminiLatencyMs = Date.now() - start;
      }
    } catch (err: any) {
      geminiError = err?.message || 'Erro ao conectar ao Gemini';
    }
  }

  res.json({
    gemini: {
      configured: hasGemini,
      connected: geminiConnected,
      latencyMs: geminiLatencyMs,
      error: geminiError,
      model: 'gemini-3.8-flash'
    },
    deepseek: {
      configured: Boolean(process.env.DEEPSEEK_API_KEY),
      model: 'deepseek-chat',
      endpoint: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
    }
  });
});

// 3. Test DeepSeek custom connection
app.post('/api/ai/test-deepseek', async (req, res) => {
  const apiKey = req.body.apiKey || process.env.DEEPSEEK_API_KEY;
  const baseUrl = req.body.baseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const model = req.body.model || 'deepseek-chat';

  if (!apiKey) {
    return res.status(400).json({ success: false, message: 'Chave de API do DeepSeek não informada.' });
  }

  const start = Date.now();
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Ping' }],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        success: false,
        message: `Falha ao conectar no DeepSeek (${response.status}): ${errorText}`
      });
    }

    const data = await response.json();
    const latencyMs = Date.now() - start;
    return res.json({
      success: true,
      latencyMs,
      model,
      sampleResponse: data.choices?.[0]?.message?.content || 'Conexão bem sucedida'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Erro de rede ao conectar no DeepSeek'
    });
  }
});

// 4. Multimodal Extraction from Image or PDF Page
app.post('/api/ai/extract-sneaker', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', pageText, provider = 'gemini', customApiKey } = req.body;

    if (!imageBase64 && !pageText) {
      return res.status(400).json({ error: 'Nenhuma imagem ou texto de catálogo fornecido para extração.' });
    }

    const promptText = `
Você é o Agente IA Especialista em Tênis e Sneaker Vault de Luxo da KicksLuxe.
Analise a imagem deste tênis/calçado (ou o texto do catálogo) e extraia os dados estruturados do produto.
Você DEVE identificar com precisão:
1. "name": Nome comercial do tênis (ex: "Air Jordan 4 Retro University Blue", "Adidas Campus 00s Lush Green", "Balenciaga 3XL Distressed", "Nike Shox TL Triple Black", etc.)
2. "brand": Marca oficial (ex: "Nike", "Jordan", "Adidas", "New Balance", "Balenciaga", "Louis Vuitton", "Asics", "Salomon", "Bape", "Yeezy", "On")
3. "category": Uma das categorias: "High-Top", "Low-Top", "Retro Runner", "Chunky Luxury", "Chuteiras / Futebol", "Slides / Mule", "Corrida & Performance", "Kids"
4. "suggestedRetailPrice": Preço de venda no varejo em Reais (R$), valor numérico realista de mercado (ex: 890, 1190, 1490, 1890)
5. "suggestedWholesalePrice": Preço sugerido de atacado (revenda 10+ pares), que ofereça entre 100% a 150% de margem para o lojista (geralmente entre 40% a 50% do valor de varejo, ex: se varejo for 900, atacado é 390).
6. "sku": Código de referência de estoque único (ex: "KL-" seguido de 4 dígitos ou sigla do modelo, ex: "KL-9060-GRY")
7. "description": Descrição técnica refinada em português destacando estilo, silhueta, história do modelo, materiais e apelo de revenda.
8. "materials": Lista com 3 a 5 materiais principais (ex: ["Couro Bovino 100%", "Camurça Nobre", "Entressola EVA com Cápsula de Ar", "Solado de Borracha Vulcanizada"])
9. "cushioningTech": Tecnologia de amortecimento (ex: "Nike Air", "ZoomX", "ABZORB & SBS", "Lightstrike", "EVA Injetado", "Molas Shox")
10. "authenticityProof": Detalhes de autenticidade (ex: "Costura perimétrica uniforme, código de lote na etiqueta interna, solado com gravação nítida")
11. "preservationMode": Modo ideal de conservação e cuidado com o calçado
12. "sizes": Lista de tamanhos brasileiros recomendados (ex: [38, 39, 40, 41, 42, 43, 44])

Retorne APENAS um objeto JSON com esta estrutura (sem formatação markdown envolvente):
{
  "name": "...",
  "brand": "...",
  "category": "...",
  "suggestedRetailPrice": 950,
  "suggestedWholesalePrice": 420,
  "sku": "KL-...",
  "description": "...",
  "materials": ["..."],
  "cushioningTech": "...",
  "authenticityProof": "...",
  "preservationMode": "...",
  "sizes": [38, 39, 40, 41, 42, 43, 44]
}
`;

    // If provider is deepseek and key is available, we can use deepseek text or fallback
    if (provider === 'deepseek' && (customApiKey || process.env.DEEPSEEK_API_KEY)) {
      const apiKey = customApiKey || process.env.DEEPSEEK_API_KEY;
      const baseUrl = req.body.deepseekBaseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
      const dsRes = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: req.body.deepseekModel || 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Você é um catalogador de tênis de luxo. Responda estritamente em JSON puro.' },
            { role: 'user', content: `${promptText}\n\nContexto textual fornecido: ${pageText || 'Imagem de tênis anexada.'}` }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (dsRes.ok) {
        const dsData = await dsRes.json();
        const content = dsData.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);
        return res.json({ success: true, product: parsed, provider: 'deepseek' });
      }
    }

    // Default: Gemini 3.8 Flash with multimodal support
    const ai = getAI();
    const parts: any[] = [];

    if (imageBase64) {
      // Remove data:image/...;base64, prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType,
          data: cleanBase64
        }
      });
    }

    if (pageText) {
      parts.push({ text: `Texto extraído do documento/catálogo: ${pageText}` });
    }

    parts.push({ text: promptText });

    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const rawText = geminiResponse.text?.trim() || '{}';
    let productData;
    try {
      productData = JSON.parse(rawText);
    } catch {
      // Clean possible markdown code fences
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      productData = JSON.parse(cleaned);
    }

    return res.json({
      success: true,
      product: productData,
      provider: 'gemini-3.8-flash'
    });
  } catch (error: any) {
    console.error('Extraction Error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Falha ao processar extração com Inteligência Artificial.'
    });
  }
});

// 5. Automatic Sneaker Enrichment with Deep Research
app.post('/api/ai/enrich-sneaker', async (req, res) => {
  try {
    const { name, brand, category } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome do modelo é obrigatório.' });
    }

    const ai = getAI();
    const prompt = `
Realize uma pesquisa detalhada sobre o tênis "${name}" da marca "${brand || 'Original'}".
Forneça informações precisas para cadastro de e-commerce e atacado de luxo:
1. Histórico e contexto da silhueta/colorway
2. Especificações de cabedal (upper), entressola (midsole) e solado (outsole)
3. Materiais premium utilizados
4. Tecnologia exata de amortecimento e conforto
5. Pontos-chave de conferência de autenticidade (laudo 1:1)
6. Modo de conservação e limpeza recomendado
7. Preço de mercado atual em BRL (Varejo e Atacado B2B)
8. Margem de lucro média projetada para revenda

Retorne em formato JSON estrito:
{
  "description": "...",
  "materials": ["..."],
  "specs": {
    "upper": "...",
    "midsole": "...",
    "cushioning": "...",
    "authenticityProof": "...",
    "preservationMode": "..."
  },
  "suggestedRetailPrice": 950,
  "suggestedWholesalePrice": 420,
  "profitMarginPct": 126,
  "category": "${category || 'Retro Runner'}"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({ success: true, enrichedData: parsed });
  } catch (error: any) {
    console.error('Enrichment Error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Erro ao enriquecer dados com IA.' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kicks Luxe server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
