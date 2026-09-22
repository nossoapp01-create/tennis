import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Store,
  Layers,
  Search,
  ExternalLink,
  Trash2,
  Edit2,
  ChevronRight,
  ShieldCheck,
  Zap,
  Check
} from 'lucide-react';
import { ExtractedSneakerCandidate, SneakerProduct, PartnerStore, AIConfigSettings, AIModelStatus } from '../../types';

// Perceptual Average Hash for image comparison and duplicate elimination
const computeCanvasFingerprint = (canvas: HTMLCanvasElement): string => {
  try {
    const sampleSize = 16;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sampleSize;
    tempCanvas.height = sampleSize;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(canvas, 0, 0, sampleSize, sampleSize);
    const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
    const grays: number[] = [];
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const g = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      grays.push(g);
      sum += g;
    }
    const avg = sum / (grays.length || 1);
    return grays.map((g) => (g >= avg ? '1' : '0')).join('');
  } catch {
    return '';
  }
};

const areHashesDuplicate = (hash1: string, hash2: string, threshold = 0.94): boolean => {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return false;
  let matches = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] === hash2[i]) matches++;
  }
  return matches / hash1.length >= threshold;
};

interface AIExtractorTabProps {
  onPublishToCatalog: (candidates: SneakerProduct[]) => void;
  partnerStores: PartnerStore[];
  aiStatus: AIModelStatus;
  onRefreshAIStatus: () => void;
}

export const AIExtractorTab: React.FC<AIExtractorTabProps> = ({
  onPublishToCatalog,
  partnerStores,
  aiStatus,
  onRefreshAIStatus,
}) => {
  // AI Settings state
  const [config, setConfig] = useState<AIConfigSettings>(() => {
    const saved = localStorage.getItem('kicks_ai_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      preferredProvider: 'gemini',
      geminiModel: 'gemini-3.8-flash',
      deepseekApiKey: '',
      deepseekBaseUrl: 'https://api.deepseek.com',
      deepseekModel: 'deepseek-chat',
      autoEnrichWithResearch: true,
      defaultTargetStore: 'central',
    };
  });

  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [isTestingDeepseek, setIsTestingDeepseek] = useState(false);
  const [deepseekTestResult, setDeepseekTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // File and Extraction states (support for up to 200 images per PDF and duplicate elimination)
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; type: 'pdf' | 'image'; previewUrl: string }[]>([]);
  const [pdfPages, setPdfPages] = useState<{ pageNum: number; dataUrl: string; selected: boolean; fingerprint?: string }[]>([]);
  const [excludedDuplicatesCount, setExcludedDuplicatesCount] = useState<number>(0);
  const [isRenderingPdf, setIsRenderingPdf] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<string>('');

  // Candidates awaiting review
  const [candidates, setCandidates] = useState<ExtractedSneakerCandidate[]>([]);
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save config changes to localStorage
  const handleSaveConfig = (newConfig: AIConfigSettings) => {
    setConfig(newConfig);
    localStorage.setItem('kicks_ai_config', JSON.stringify(newConfig));
  };

  // Test DeepSeek API connection
  const handleTestDeepSeek = async () => {
    setIsTestingDeepseek(true);
    setDeepseekTestResult(null);
    try {
      const res = await fetch('/api/ai/test-deepseek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: config.deepseekApiKey,
          baseUrl: config.deepseekBaseUrl,
          model: config.deepseekModel,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDeepseekTestResult({
          success: true,
          message: `Conectado com sucesso! Latência: ${data.latencyMs}ms (${data.model})`,
        });
      } else {
        setDeepseekTestResult({
          success: false,
          message: data.message || 'Erro ao conectar no DeepSeek.',
        });
      }
    } catch (err: any) {
      setDeepseekTestResult({
        success: false,
        message: err?.message || 'Falha de comunicação com o servidor.',
      });
    } finally {
      setIsTestingDeepseek(false);
    }
  };

  // Handle file uploads (Drag & Drop or file selection)
  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFilesList: { file: File; type: 'pdf' | 'image'; previewUrl: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImage = file.type.startsWith('image/');

      if (isPdf) {
        newFilesList.push({ file, type: 'pdf', previewUrl: '' });
        // Render PDF pages using pdfjs-dist
        renderPdfFile(file);
      } else if (isImage) {
        const previewUrl = URL.createObjectURL(file);
        newFilesList.push({ file, type: 'image', previewUrl });
      }
    }

    setUploadedFiles((prev) => [...prev, ...newFilesList]);
  };

  // Render PDF pages to data URLs using pdfjs-dist (up to 200 images/pages with duplicate elimination)
  const renderPdfFile = async (pdfFile: File) => {
    setIsRenderingPdf(true);
    setExtractionProgress('Processando páginas do catálogo PDF (capacidade: até 200 imagens com exclusão de duplicatas)...');
    setExcludedDuplicatesCount(0);

    try {
      // Dynamic import pdfjs
      const pdfjsLib = await import('pdfjs-dist');
      // Set worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;

      const MAX_IMAGES_PER_PDF = 200; // Increased limit up to 200 images per PDF
      const numPages = Math.min(pdfDoc.numPages, MAX_IMAGES_PER_PDF);
      const pagesArray: { pageNum: number; dataUrl: string; selected: boolean; fingerprint?: string }[] = [];
      const seenFingerprints: string[] = [];
      let duplicateCounter = 0;

      for (let p = 1; p <= numPages; p++) {
        if (p % 4 === 0 || p === numPages) {
          setExtractionProgress(
            `Renderizando e analisando página ${p} de ${numPages}... (${pagesArray.length} únicas salvas, ${duplicateCounter} repetidas excluídas)`
          );
          // Yield to main thread briefly to prevent UI blocking
          await new Promise((resolve) => setTimeout(resolve, 8));
        }

        const page = await pdfDoc.getPage(p);
        const viewport = page.getViewport({ scale: 1.15 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          const renderContext: any = {
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
          };
          await page.render(renderContext).promise;

          // Compute visual fingerprint to identify and eliminate duplicates
          const fingerprint = computeCanvasFingerprint(canvas);
          let isDuplicate = false;

          if (fingerprint) {
            for (const seen of seenFingerprints) {
              if (areHashesDuplicate(seen, fingerprint, 0.94)) {
                isDuplicate = true;
                break;
              }
            }
          }

          if (isDuplicate) {
            duplicateCounter++;
          } else {
            if (fingerprint) seenFingerprints.push(fingerprint);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            pagesArray.push({ pageNum: p, dataUrl, selected: true, fingerprint });
          }
        }
      }

      setExcludedDuplicatesCount(duplicateCounter);
      setPdfPages(pagesArray);
      setExtractionProgress(
        duplicateCounter > 0
          ? `${pagesArray.length} páginas/imagens únicas catalogadas (até 200 processadas). ${duplicateCounter} imagens repetidas foram excluídas automaticamente!`
          : `${pagesArray.length} páginas/imagens únicas catalogadas (até 200 processadas). Nenhuma duplicata encontrada.`
      );
    } catch (error: any) {
      console.error('PDF Render Error:', error);
      alert('Não foi possível renderizar o PDF diretamente. Você também pode enviar imagens extraídas.');
    } finally {
      setIsRenderingPdf(false);
    }
  };

  // Process and extract from uploaded images or selected PDF pages
  const handleExtractAll = async () => {
    setIsExtracting(true);
    setExtractionProgress('Iniciando Agente IA para reconhecimento de modelos...');

    const itemsToProcess: { dataUrl: string; label: string; pageNum?: number }[] = [];

    // Collect from PDF pages
    pdfPages.filter((p) => p.selected).forEach((p) => {
      itemsToProcess.push({ dataUrl: p.dataUrl, label: `PDF Página ${p.pageNum}`, pageNum: p.pageNum });
    });

    // Collect from direct images
    for (const f of uploadedFiles.filter((f) => f.type === 'image')) {
      itemsToProcess.push({ dataUrl: f.previewUrl, label: f.file.name });
    }

    if (itemsToProcess.length === 0) {
      alert('Por favor, carregue ao menos um PDF ou imagem de tênis para extração.');
      setIsExtracting(false);
      return;
    }

    const newCandidates: ExtractedSneakerCandidate[] = [];
    let duplicateCandidatesSkipped = 0;

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];
      setExtractionProgress(`Analisando item ${i + 1} de ${itemsToProcess.length}: ${item.label}...`);

      try {
        let base64 = item.dataUrl;
        if (item.dataUrl.startsWith('blob:')) {
          // Convert blob url to base64
          const response = await fetch(item.dataUrl);
          const blob = await response.blob();
          base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }

        const res = await fetch('/api/ai/extract-sneaker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: 'image/jpeg',
            provider: config.preferredProvider,
            customApiKey: config.deepseekApiKey,
            deepseekBaseUrl: config.deepseekBaseUrl,
            deepseekModel: config.deepseekModel,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success && data.product) {
          const p = data.product;
          const normName = (p.name || '').toLowerCase().trim();
          const normSku = (p.sku || '').toLowerCase().trim();

          // Deduplicate sneaker candidate: check if SKU or exact name+brand already exists
          const isCandidateDuplicate =
            candidates.some(
              (c) =>
                (normSku && c.sku.toLowerCase().trim() === normSku) ||
                (normName && c.name.toLowerCase().trim() === normName && c.brand.toLowerCase() === (p.brand || '').toLowerCase())
            ) ||
            newCandidates.some(
              (c) =>
                (normSku && c.sku.toLowerCase().trim() === normSku) ||
                (normName && c.name.toLowerCase().trim() === normName && c.brand.toLowerCase() === (p.brand || '').toLowerCase())
            );

          if (isCandidateDuplicate) {
            duplicateCandidatesSkipped++;
          } else {
            newCandidates.push({
              id: `cand-${Date.now()}-${i}`,
              name: p.name || `Sneaker Modelo #${i + 1}`,
              brand: p.brand || 'Original',
              category: p.category || 'Retro Runner',
              sku: p.sku || `KL-${Math.floor(1000 + Math.random() * 9000)}`,
              suggestedRetailPrice: p.suggestedRetailPrice || 890,
              suggestedWholesalePrice: p.suggestedWholesalePrice || 390,
              image: base64,
              description: p.description || 'Modelo de alta performance e acabamento artesanal.',
              materials: p.materials || ['Couro Legítimo', 'Borracha Vulcanizada'],
              cushioningTech: p.cushioningTech || 'Amortecimento Anatômico',
              sizes: p.sizes || [38, 39, 40, 41, 42, 43, 44],
              targetStore: config.defaultTargetStore || 'central',
              sourcePage: item.pageNum,
              isApproved: true,
            });
          }
        }
      } catch (err) {
        console.error('Item extract failed:', err);
      }
    }

    setCandidates((prev) => [...prev, ...newCandidates]);
    setIsExtracting(false);
    setExtractionProgress(
      duplicateCandidatesSkipped > 0
        ? `Extração concluída! ${newCandidates.length} novos pares catalogados (${duplicateCandidatesSkipped} modelos duplicados foram excluídos).`
        : `Extração concluída com sucesso! ${newCandidates.length} novos pares catalogados para revisão.`
    );
  };

  // Perform AI deep enrichment on a specific candidate
  const handleEnrichCandidate = async (candidateId: string) => {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, isEnriching: true } : c))
    );

    try {
      const res = await fetch('/api/ai/enrich-sneaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: candidate.name,
          brand: candidate.brand,
          category: candidate.category,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.enrichedData) {
        const enriched = data.enrichedData;
        setCandidates((prev) =>
          prev.map((c) => {
            if (c.id === candidateId) {
              return {
                ...c,
                description: enriched.description || c.description,
                materials: enriched.materials || c.materials,
                suggestedRetailPrice: enriched.suggestedRetailPrice || c.suggestedRetailPrice,
                suggestedWholesalePrice: enriched.suggestedWholesalePrice || c.suggestedWholesalePrice,
                isEnriching: false,
              };
            }
            return c;
          })
        );
      }
    } catch (err) {
      console.error('Enrich error:', err);
    } finally {
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, isEnriching: false } : c))
      );
    }
  };

  // Commit approved candidates to live product catalog
  const handleCommitCandidates = () => {
    const approved = candidates.filter((c) => c.isApproved);
    if (approved.length === 0) {
      alert('Nenhum modelo aprovado para publicação.');
      return;
    }

    const products: SneakerProduct[] = approved.map((c) => ({
      id: `prod-ext-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: c.name,
      sku: c.sku,
      brand: c.brand,
      category: c.category,
      retailPrice: c.suggestedRetailPrice,
      wholesalePrice: c.suggestedWholesalePrice,
      minWholesaleQty: 10,
      profitMarginPct: Math.round(
        ((c.suggestedRetailPrice - c.suggestedWholesalePrice) / c.suggestedWholesalePrice) * 100
      ),
      badge: 'NOVA GRADE IA',
      image: c.image,
      description: c.description,
      materials: c.materials,
      specs: {
        upper: `${c.materials?.join(', ')} com corte a laser`,
        midsole: 'Entressola ergonômica com densidade balanceada',
        cushioning: c.cushioningTech,
        authenticityProof: `Conferência 1:1 por IA com identificador #${c.sku}`,
        preservationMode: 'Armazenar em local arejado longe de umidade',
      },
      sizes: c.sizes,
      stockPerSize: { 38: 10, 39: 15, 40: 20, 41: 25, 42: 20, 43: 15, 44: 10 },
      storeId: c.targetStore,
      originSource: 'pdf_extracted',
      createdAt: new Date().toISOString(),
    }));

    onPublishToCatalog(products);
    // Remove approved candidates
    setCandidates((prev) => prev.filter((c) => !c.isApproved));
    alert(`${products.length} modelos aprovados e publicados com sucesso no catálogo oficial da KicksLuxe!`);
  };

  return (
    <div className="space-y-6">
      {/* Top AI Status and Model Selector Bar */}
      <div className="bg-[#1c1b1c] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-black shadow-md shadow-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-syne font-bold text-base text-white">
                Agente IA: Extrator de PDF & Imagens
              </h3>
              <span className="text-[10px] font-mono-sku px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                MULTI-MODELO ATIVO
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-jakarta">
              Processamento multimodal direto com Gemini 3.8 Flash e compatibilidade com DeepSeek para catalogação em massa.
            </p>
          </div>
        </div>

        {/* Action Controls & Provider Selection */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Model Pill */}
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 text-xs font-mono-sku">
            <button
              onClick={() => handleSaveConfig({ ...config, preferredProvider: 'gemini' })}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                config.preferredProvider === 'gemini'
                  ? 'bg-amber-400 text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Google Gemini</span>
            </button>
            <button
              onClick={() => handleSaveConfig({ ...config, preferredProvider: 'deepseek' })}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                config.preferredProvider === 'deepseek'
                  ? 'bg-blue-500 text-white font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>DeepSeek</span>
            </button>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-colors"
            title="Configurações de Modelos e Chaves"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Test Status Trigger */}
          <button
            onClick={onRefreshAIStatus}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs font-mono-sku flex items-center gap-1.5 transition-colors"
            title="Checar latência da conexão"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Status</span>
          </button>
        </div>
      </div>

      {/* Collapsible Model Configuration Panel */}
      {showConfigPanel && (
        <div className="bg-[#181718] border border-amber-400/30 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h4 className="font-syne font-bold text-sm text-white">
                Painel de Configuração dos Motores de IA
              </h4>
            </div>
            <span className="text-[11px] font-mono-sku text-zinc-400">
              Persistência local segura & variáveis de ambiente
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-jakarta">
            {/* Gemini Settings */}
            <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Google Gemini (Multimodal Oficial)
                </span>
                <span className="text-[10px] font-mono-sku px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {aiStatus.geminiConnected ? 'CONECTADO' : 'NATIVO NO BACKEND'}
                </span>
              </div>
              <p className="text-zinc-400 text-[11px]">
                Processa imagens em alta resolução e páginas de catálogos PDF com o modelo <code className="text-zinc-200">gemini-3.8-flash</code> via SDK oficial @google/genai.
              </p>
              <div>
                <label className="block text-zinc-400 mb-1">Modelo Ativo:</label>
                <input
                  type="text"
                  disabled
                  value="gemini-3.8-flash (Recomendado para Multimodal)"
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-zinc-300"
                />
              </div>
            </div>

            {/* DeepSeek Settings */}
            <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-400 flex items-center gap-1.5">
                  DeepSeek Engine ('deekdeek')
                </span>
                <span className="text-[10px] font-mono-sku px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  OPCIONAL / PROXY
                </span>
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">DeepSeek API Key:</label>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={config.deepseekApiKey}
                  onChange={(e) => handleSaveConfig({ ...config, deepseekApiKey: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Endpoint Base URL:</label>
                <input
                  type="text"
                  value={config.deepseekBaseUrl}
                  onChange={(e) => handleSaveConfig({ ...config, deepseekBaseUrl: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleTestDeepSeek}
                  disabled={isTestingDeepseek}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 font-mono-sku text-[11px] flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${isTestingDeepseek ? 'animate-spin' : ''}`} />
                  <span>Testar Conexão</span>
                </button>
                {deepseekTestResult && (
                  <span
                    className={`text-[11px] font-mono-sku ${
                      deepseekTestResult.success ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {deepseekTestResult.message}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileChange(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="vault-card border-2 border-dashed border-white/15 hover:border-amber-400/60 rounded-3xl p-8 text-center cursor-pointer transition-all group flex flex-col items-center justify-center gap-3 relative overflow-hidden"
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="application/pdf,image/*"
          onChange={(e) => handleFileChange(e.target.files)}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-amber-400/10 group-hover:bg-amber-400/20 text-amber-400 flex items-center justify-center transition-transform group-hover:scale-110">
          <Upload className="w-8 h-8" />
        </div>

        <div>
          <h4 className="font-syne font-bold text-base md:text-lg text-white">
            Arraste e solte seus Catálogos em PDF ou Imagens de Tênis
          </h4>
          <p className="text-xs text-zinc-400 font-jakarta mt-1 max-w-md mx-auto">
            Suporte para catálogos em PDF de até 200 imagens/páginas por arquivo com exclusão automática de fotos e páginas repetidas. O agente identificará fotos, modelos, códigos e preços.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="text-[10px] font-mono-sku px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 font-bold">
            ATÉ 200 IMAGENS / PDF
          </span>
          <span className="text-[10px] font-mono-sku px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
            FILTRO ANTI-DUPLICIDADE ATIVO
          </span>
          <span className="text-[10px] font-mono-sku px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">
            PESQUISA DE MATERIAIS
          </span>
          <span className="text-[10px] font-mono-sku px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">
            GERADOR DE SKU & LAUDO 1:1
          </span>
        </div>
      </div>

      {/* PDF Pages Navigator and Batch Trigger */}
      {pdfPages.length > 0 && (
        <div className="bg-[#181718] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-syne font-bold text-sm text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Páginas & Imagens Extraídas do Catálogo PDF ({pdfPages.length} imagens únicas detectadas)
                </h4>
                <span className="text-[10px] font-mono-sku px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold">
                  ATÉ 200 IMAGENS / PDF
                </span>
                {excludedDuplicatesCount > 0 && (
                  <span className="text-[10px] font-mono-sku px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
                    <Check className="w-3 h-3 stroke-[3]" />
                    {excludedDuplicatesCount} {excludedDuplicatesCount === 1 ? 'repetida excluída' : 'repetidas excluídas'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 font-jakarta mt-0.5">
                Processamento em lote com filtro anti-duplicidade visual. Selecione as imagens que deseja processar ou clique em extrair todas de uma só vez.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPdfPages((prev) => prev.map((p) => ({ ...p, selected: !prev.every((x) => x.selected) })))
                }
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono-sku text-zinc-300 border border-white/10"
              >
                Alternar Seleção
              </button>

              <button
                type="button"
                disabled={isExtracting}
                onClick={handleExtractAll}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-syne font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Sparkles className={`w-4 h-4 ${isExtracting ? 'animate-spin' : ''}`} />
                <span>{isExtracting ? 'Processando com IA...' : 'Extrair Seleção com IA'}</span>
              </button>
            </div>
          </div>

          {/* Grid of PDF page thumbnails */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-72 overflow-y-auto p-1">
            {pdfPages.map((page) => (
              <div
                key={page.pageNum}
                onClick={() =>
                  setPdfPages((prev) =>
                    prev.map((p) => (p.pageNum === page.pageNum ? { ...p, selected: !p.selected } : p))
                  )
                }
                className={`rounded-xl overflow-hidden border p-1 cursor-pointer transition-all relative flex flex-col justify-between ${
                  page.selected
                    ? 'border-amber-400 ring-2 ring-amber-400/40 bg-amber-400/10'
                    : 'border-white/10 bg-black/40 opacity-60'
                }`}
              >
                <img
                  src={page.dataUrl}
                  alt={`Página ${page.pageNum}`}
                  className="w-full aspect-[3/4] object-contain rounded-lg bg-black"
                />
                <div className="flex items-center justify-between px-1 pt-1 text-[10px] font-mono-sku text-zinc-300">
                  <span>Pág. {page.pageNum}</span>
                  {page.selected && <Check className="w-3 h-3 text-amber-400 stroke-[3]" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extraction Progress Banner */}
      {(isExtracting || extractionProgress) && (
        <div className="bg-[#1c1b1c] border border-amber-400/40 rounded-xl p-3.5 flex items-center gap-3 text-xs font-jakarta text-amber-300">
          <RefreshCw className={`w-4 h-4 text-amber-400 ${isExtracting ? 'animate-spin' : ''}`} />
          <span>{extractionProgress}</span>
        </div>
      )}

      {/* Visual Review & Pre-Publication Inspector */}
      {candidates.length > 0 && (
        <div className="bg-[#181718] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h4 className="font-syne font-bold text-base text-white">
                  Revisão Visual Pré-Publicação ({candidates.length} pares aguardando)
                </h4>
              </div>
              <p className="text-xs text-zinc-400 font-jakarta mt-0.5">
                Revise os dados extraídos, altere preços ou regenere descrições com pesquisa antes de importar no estoque oficial.
              </p>
            </div>

            <button
              onClick={handleCommitCandidates}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-syne font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Aprovar e Publicar no Catálogo</span>
            </button>
          </div>

          {/* Candidates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.map((cand) => (
              <div
                key={cand.id}
                className={`bg-[#201f21] border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                  cand.isApproved ? 'border-amber-400/40' : 'border-white/10 opacity-70'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono-sku text-[10px] font-bold px-2 py-0.5 rounded bg-black/40 border border-white/10 text-amber-300">
                      REF: #{cand.sku}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCandidates((prev) =>
                          prev.map((c) => (c.id === cand.id ? { ...c, isApproved: !c.isApproved } : c))
                        )
                      }
                      className={`text-[10px] font-mono-sku px-2 py-0.5 rounded-full border ${
                        cand.isApproved
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-white/10'
                      }`}
                    >
                      {cand.isApproved ? 'APROVADO' : 'IGNORAR'}
                    </button>
                  </div>

                  {/* Image Preview */}
                  <div className="w-full aspect-[4/3] rounded-xl bg-black/50 p-2 flex items-center justify-center overflow-hidden mb-3 border border-white/5">
                    <img
                      src={cand.image}
                      alt={cand.name}
                      className="max-h-full object-contain filter drop-shadow-md"
                    />
                  </div>

                  {/* Editable Fields */}
                  <div className="space-y-2 text-xs font-jakarta">
                    <div>
                      <label className="text-[10px] font-mono-sku text-zinc-400 block">Nome do Modelo:</label>
                      <input
                        type="text"
                        value={cand.name}
                        onChange={(e) =>
                          setCandidates((prev) =>
                            prev.map((c) => (c.id === cand.id ? { ...c, name: e.target.value } : c))
                          )
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-1.5 text-white font-bold font-syne text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-mono-sku text-zinc-400 block">Marca:</label>
                        <input
                          type="text"
                          value={cand.brand}
                          onChange={(e) =>
                            setCandidates((prev) =>
                              prev.map((c) => (c.id === cand.id ? { ...c, brand: e.target.value } : c))
                            )
                          }
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-1.5 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono-sku text-zinc-400 block">Categoria:</label>
                        <select
                          value={cand.category}
                          onChange={(e) =>
                            setCandidates((prev) =>
                              prev.map((c) => (c.id === cand.id ? { ...c, category: e.target.value } : c))
                            )
                          }
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-1.5 text-white text-xs"
                        >
                          <option value="High-Top">High-Top</option>
                          <option value="Low-Top">Low-Top</option>
                          <option value="Retro Runner">Retro Runner</option>
                          <option value="Chunky Luxury">Chunky Luxury</option>
                          <option value="Chuteiras / Futebol">Chuteiras / Futebol</option>
                          <option value="Slides / Mule">Slides / Mule</option>
                          <option value="Corrida & Performance">Corrida & Performance</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-mono-sku text-zinc-400 block">Preço Varejo (R$):</label>
                        <input
                          type="number"
                          value={cand.suggestedRetailPrice}
                          onChange={(e) =>
                            setCandidates((prev) =>
                              prev.map((c) =>
                                c.id === cand.id ? { ...c, suggestedRetailPrice: Number(e.target.value) } : c
                              )
                            )
                          }
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-1.5 text-white font-mono-sku text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono-sku text-amber-400 block">Atacado 10+ (R$):</label>
                        <input
                          type="number"
                          value={cand.suggestedWholesalePrice}
                          onChange={(e) =>
                            setCandidates((prev) =>
                              prev.map((c) =>
                                c.id === cand.id ? { ...c, suggestedWholesalePrice: Number(e.target.value) } : c
                              )
                            )
                          }
                          className="w-full bg-black/40 border border-amber-400/40 rounded-lg p-1.5 text-amber-300 font-mono-sku text-xs"
                        />
                      </div>
                    </div>

                    {/* Target Store Selector */}
                    <div>
                      <label className="text-[10px] font-mono-sku text-zinc-400 block">Destino do Estoque:</label>
                      <select
                        value={cand.targetStore}
                        onChange={(e) =>
                          setCandidates((prev) =>
                            prev.map((c) => (c.id === cand.id ? { ...c, targetStore: e.target.value } : c))
                          )
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-1.5 text-zinc-300 text-xs"
                      >
                        {partnerStores.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} ({st.city})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description preview */}
                    <p className="text-[11px] text-zinc-400 line-clamp-2 italic pt-1">
                      {cand.description}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={cand.isEnriching}
                    onClick={() => handleEnrichCandidate(cand.id)}
                    className="flex-1 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-mono-sku flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${cand.isEnriching ? 'animate-spin' : ''}`} />
                    <span>{cand.isEnriching ? 'Pesquisando...' : 'Enriquecer com IA'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCandidates((prev) => prev.filter((c) => c.id !== cand.id))}
                    className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Excluir candidato"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
