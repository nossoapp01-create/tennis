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
  Check,
  Tag,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Percent,
  Coins
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

// Downscale and compress canvas image to ~30-45KB to prevent browser memory & storage quota issues
const compressImageCanvas = (canvas: HTMLCanvasElement, maxDimension = 640, quality = 0.72): string => {
  try {
    const width = canvas.width;
    const height = canvas.height;
    const maxSide = Math.max(width, height);
    if (maxSide <= maxDimension) {
      return canvas.toDataURL('image/jpeg', quality);
    }
    const ratio = maxDimension / maxSide;
    const targetW = Math.round(width * ratio);
    const targetH = Math.round(height * ratio);
    const downscaledCanvas = document.createElement('canvas');
    downscaledCanvas.width = targetW;
    downscaledCanvas.height = targetH;
    const ctx = downscaledCanvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvas, 0, 0, targetW, targetH);
      return downscaledCanvas.toDataURL('image/jpeg', quality);
    }
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return canvas.toDataURL('image/jpeg', 0.65);
  }
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
  const [publishToast, setPublishToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Bulk pricing states for mass updates (Todos vs Selecionados)
  const [bulkPricingTarget, setBulkPricingTarget] = useState<'selected' | 'all'>('selected');
  const [bulkWholesalePrice, setBulkWholesalePrice] = useState<string>('10');
  const [bulkRetailPrice, setBulkRetailPrice] = useState<string>('25');
  const [isAutoRetail, setIsAutoRetail] = useState<boolean>(true);
  const [autoMarkupPercent, setAutoMarkupPercent] = useState<number>(150);

  // Apply quick preset to bulk inputs
  const handleSelectPreset = (wholesale: number, retail?: number) => {
    setBulkWholesalePrice(wholesale.toString());
    if (retail !== undefined) {
      setBulkRetailPrice(retail.toString());
      setIsAutoRetail(false);
    } else {
      const calculatedRetail = Math.max(Math.round(wholesale * (1 + autoMarkupPercent / 100)), wholesale + 2);
      setBulkRetailPrice(calculatedRetail.toString());
    }
  };

  // Direct 1-click apply of a specific wholesale value (e.g. "10 €" or "1 €")
  const handleQuickApplyValue = (value: number) => {
    const wholesaleVal = value;
    const retailVal = isAutoRetail
      ? Math.max(Math.round(wholesaleVal * (1 + autoMarkupPercent / 100)), wholesaleVal + 2)
      : parseFloat(bulkRetailPrice) || Math.round(wholesaleVal * 2);

    setBulkWholesalePrice(wholesaleVal.toString());
    setBulkRetailPrice(retailVal.toString());

    let count = 0;
    setCandidates((prev) =>
      prev.map((c) => {
        const isTarget = bulkPricingTarget === 'all' || c.isSelected !== false;
        if (!isTarget) return c;
        count++;
        return {
          ...c,
          suggestedWholesalePrice: wholesaleVal,
          suggestedRetailPrice: retailVal,
          isApproved: true,
        };
      })
    );

    const targetDesc = bulkPricingTarget === 'all' ? `todos os ${candidates.length} modelos` : `${count} modelos selecionados`;
    setPublishToast({
      message: `Preço de Atacado definido como € ${wholesaleVal.toFixed(2)} (Varejo: € ${retailVal.toFixed(2)}) para ${targetDesc}!`,
      type: 'success',
    });
    setTimeout(() => setPublishToast(null), 5000);
  };

  // Generic apply from input fields
  const handleApplyBulkPricing = () => {
    const wholesaleVal = parseFloat(bulkWholesalePrice.replace(',', '.'));
    const retailVal = parseFloat(bulkRetailPrice.replace(',', '.'));

    const hasValidWholesale = !isNaN(wholesaleVal) && wholesaleVal > 0;
    const hasValidRetail = !isNaN(retailVal) && retailVal > 0;

    if (!hasValidWholesale && !hasValidRetail) {
      setPublishToast({
        message: 'Por favor, informe um valor numérico válido para o Preço de Atacado ou Varejo (ex: 10 ou 1).',
        type: 'error',
      });
      setTimeout(() => setPublishToast(null), 4000);
      return;
    }

    let affectedCount = 0;

    setCandidates((prev) =>
      prev.map((c) => {
        const isTarget = bulkPricingTarget === 'all' || c.isSelected !== false;
        if (!isTarget) return c;

        affectedCount++;
        let newWholesale = c.suggestedWholesalePrice;
        let newRetail = c.suggestedRetailPrice;

        if (hasValidWholesale) {
          newWholesale = wholesaleVal;
        }

        if (hasValidRetail) {
          newRetail = retailVal;
        } else if (hasValidWholesale && isAutoRetail) {
          newRetail = Math.max(
            Math.round(newWholesale * (1 + autoMarkupPercent / 100)),
            newWholesale + 2
          );
        }

        return {
          ...c,
          suggestedWholesalePrice: newWholesale,
          suggestedRetailPrice: newRetail,
          isApproved: true,
        };
      })
    );

    if (affectedCount === 0) {
      setPublishToast({
        message: 'Nenhum modelo foi afetado. Marque os modelos desejados ou selecione "Todos os Modelos".',
        type: 'info',
      });
      setTimeout(() => setPublishToast(null), 4500);
      return;
    }

    const targetDesc = bulkPricingTarget === 'all' ? `todos os ${candidates.length} modelos` : `${affectedCount} modelos selecionados`;
    const finalRetail = hasValidRetail
      ? retailVal
      : hasValidWholesale && isAutoRetail
      ? Math.max(Math.round(wholesaleVal * (1 + autoMarkupPercent / 100)), wholesaleVal + 2)
      : null;

    setPublishToast({
      message: `Precificação aplicada a ${targetDesc}: Atacado: € ${hasValidWholesale ? wholesaleVal.toFixed(2) : '-'} | Varejo: € ${finalRetail !== null ? finalRetail.toFixed(2) : '-'}!`,
      type: 'success',
    });
    setTimeout(() => setPublishToast(null), 5000);
  };

  // Selection toggle helpers
  const handleSelectAllCandidates = (selected: boolean) => {
    setCandidates((prev) => prev.map((c) => ({ ...c, isSelected: selected })));
  };

  const handleInvertCandidatesSelection = () => {
    setCandidates((prev) => prev.map((c) => ({ ...c, isSelected: c.isSelected === false })));
  };

  const handleApproveAllSelected = () => {
    setCandidates((prev) =>
      prev.map((c) => (c.isSelected !== false ? { ...c, isApproved: true } : c))
    );
    setPublishToast({
      message: 'Todos os modelos selecionados foram marcados como APROVADOS!',
      type: 'success',
    });
    setTimeout(() => setPublishToast(null), 4000);
  };

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
            const dataUrl = compressImageCanvas(canvas, 640, 0.72);
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
              suggestedRetailPrice: p.suggestedRetailPrice || 140,
              suggestedWholesalePrice: p.suggestedWholesalePrice || 55,
              image: base64,
              description: p.description || 'Modelo de alta performance e acabamento artesanal.',
              materials: p.materials || ['Couro Legítimo', 'Borracha Vulcanizada'],
              cushioningTech: p.cushioningTech || 'Amortecimento Anatômico',
              sizes: p.sizes || [38, 39, 40, 41, 42, 43, 44],
              targetStore: config.defaultTargetStore || 'central',
              sourcePage: item.pageNum,
              isApproved: true,
              isSelected: true,
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
      setPublishToast({
        message: 'Nenhum modelo aprovado para publicação. Marque os modelos desejados como APROVADO antes de salvar.',
        type: 'error',
      });
      setTimeout(() => setPublishToast(null), 4000);
      return;
    }

    const parseEuroPrice = (val: any, fallback: number): number => {
      if (typeof val === 'number' && !isNaN(val) && val > 0) return val;
      if (typeof val === 'string') {
        const cleaned = val.replace(/[^0-9.,]/g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        if (!isNaN(num) && num > 0) return num;
      }
      return fallback;
    };

    const products: SneakerProduct[] = approved.map((c, index) => {
      const retail = parseEuroPrice(c.suggestedRetailPrice, 140);
      const wholesale = parseEuroPrice(c.suggestedWholesalePrice, 55);
      const margin = wholesale > 0 ? Math.round(((retail - wholesale) / wholesale) * 100) : 120;

      return {
        id: `prod-ext-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        name: c.name || `Sneaker Modelo #${index + 1}`,
        sku: c.sku || `KL-${Math.floor(1000 + Math.random() * 9000)}`,
        brand: c.brand || 'Original',
        category: c.category || 'Retro Runner',
        retailPrice: retail,
        wholesalePrice: wholesale,
        minWholesaleQty: 10,
        profitMarginPct: margin,
        badge: 'NOVA GRADE IA',
        image: c.image,
        description: c.description || 'Modelo autêntico de alta rotação catalogado via IA.',
        materials: c.materials && c.materials.length > 0 ? c.materials : ['Couro Legítimo', 'Borracha Vulcanizada'],
        specs: {
          upper: `${c.materials?.join(', ') || 'Couro'} com acabamento premium`,
          midsole: 'Entressola anatômica balanceada',
          cushioning: c.cushioningTech || 'Amortecimento de alta resposta',
          authenticityProof: `Conferência 1:1 por IA com identificador #${c.sku}`,
          preservationMode: 'Armazenar em local arejado longe de umidade',
        },
        sizes: Array.isArray(c.sizes) && c.sizes.length > 0 ? c.sizes : [38, 39, 40, 41, 42, 43, 44],
        stockPerSize: { 38: 10, 39: 15, 40: 20, 41: 25, 42: 20, 43: 15, 44: 10 },
        storeId: c.targetStore || 'central',
        originSource: 'pdf_extracted',
        createdAt: new Date().toISOString(),
      };
    });

    // Publish to catalog
    onPublishToCatalog(products);

    // Remove approved candidates from pending queue
    setCandidates((prev) => prev.filter((c) => !c.isApproved));

    setPublishToast({
      message: `${products.length} modelos aprovados e publicados com sucesso no catálogo oficial da KicksLuxe em Euros (€)!`,
      type: 'success',
    });
    setTimeout(() => setPublishToast(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Action & Publish Toast */}
      {publishToast && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xl transition-all ${
            publishToast.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : publishToast.type === 'error'
              ? 'bg-red-950/80 border-red-500/50 text-red-200'
              : 'bg-zinc-900 border-white/20 text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                publishToast.type === 'success'
                  ? 'bg-emerald-500 text-black'
                  : publishToast.type === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-amber-400 text-black'
              }`}
            >
              {publishToast.type === 'success' ? '✓' : '!'}
            </div>
            <div>
              <p className="font-syne font-bold text-sm text-white">{publishToast.message}</p>
              <p className="text-xs opacity-80 font-jakarta">
                Os dados foram gravados de forma segura e sincronizados com o estoque oficial.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPublishToast(null)}
            className="px-3 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono-sku transition-colors"
          >
            Fechar
          </button>
        </div>
      )}

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

          {/* BULK PRICING TOOLBAR (Precificar Todos ou Selecionados) */}
          <div className="bg-gradient-to-br from-[#242226] via-[#1c1b1e] to-[#161517] border border-amber-400/30 rounded-2xl p-4 md:p-5 shadow-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center shadow-inner">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-syne font-bold text-sm text-white">
                      Precificação Rápida em Lote
                    </h5>
                    <span className="text-[10px] font-mono-sku px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 font-bold">
                      TODOS OU SELECIONADOS
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-jakarta mt-0.5">
                    Defina o preço de atacado e varejo para todos os pares ou apenas para os modelos marcados (ex: colocar 10 € ou 1 €).
                  </p>
                </div>
              </div>

              {/* Selection Status Badge */}
              <div className="flex items-center gap-2 text-xs font-mono-sku">
                <span className="px-3 py-1 rounded-lg bg-black/50 border border-white/10 text-zinc-300">
                  <strong className="text-amber-400">{candidates.filter((c) => c.isSelected !== false).length}</strong> de {candidates.length} selecionados
                </span>
                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  <strong className="text-emerald-400">{candidates.filter((c) => c.isApproved).length}</strong> aprovados
                </span>
              </div>
            </div>

            {/* Target Selector & Pricing Inputs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* Target Scope Switcher */}
              <div className="lg:col-span-4 space-y-1.5">
                <label className="text-[11px] font-mono-sku text-zinc-400 block uppercase">
                  Aplicar Preço Em:
                </label>
                <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setBulkPricingTarget('selected')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-syne font-bold transition-all flex items-center justify-center gap-1.5 ${
                      bulkPricingTarget === 'selected'
                        ? 'bg-amber-400 text-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Selecionados ({candidates.filter((c) => c.isSelected !== false).length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkPricingTarget('all')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-syne font-bold transition-all flex items-center justify-center gap-1.5 ${
                      bulkPricingTarget === 'all'
                        ? 'bg-amber-400 text-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Todos ({candidates.length})</span>
                  </button>
                </div>
              </div>

              {/* Wholesale and Retail Inputs */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono-sku text-amber-300 font-bold block">
                      Atacado 10+ (€):
                    </label>
                    <span className="text-[9px] font-mono-sku text-zinc-500">EX: 10 ou 1</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono-sku text-amber-400 font-bold">
                      €
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={bulkWholesalePrice}
                      onChange={(e) => setBulkWholesalePrice(e.target.value)}
                      placeholder="10"
                      className="w-full bg-black/60 border border-amber-400/40 focus:border-amber-400 rounded-xl pl-7 pr-3 py-2 text-white font-mono-sku text-sm font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono-sku text-zinc-300 block">
                      Varejo (€):
                    </label>
                    <label className="flex items-center gap-1 text-[9px] font-mono-sku text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAutoRetail}
                        onChange={(e) => setIsAutoRetail(e.target.checked)}
                        className="w-3 h-3 accent-amber-400 rounded"
                      />
                      <span>Auto (+150%)</span>
                    </label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono-sku text-zinc-400 font-bold">
                      €
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={isAutoRetail ? (parseFloat(bulkWholesalePrice) ? Math.max(Math.round(parseFloat(bulkWholesalePrice) * (1 + autoMarkupPercent / 100)), parseFloat(bulkWholesalePrice) + 2) : 25) : bulkRetailPrice}
                      disabled={isAutoRetail}
                      onChange={(e) => setBulkRetailPrice(e.target.value)}
                      placeholder="25"
                      className={`w-full bg-black/60 border rounded-xl pl-7 pr-3 py-2 text-white font-mono-sku text-sm font-bold focus:outline-none ${
                        isAutoRetail ? 'border-white/10 text-zinc-400 cursor-not-allowed opacity-80' : 'border-white/20 focus:border-white/40'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Main Apply Button */}
              <div className="lg:col-span-3 flex flex-col justify-end">
                <button
                  type="button"
                  onClick={handleApplyBulkPricing}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-syne font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all transform active:scale-95"
                >
                  <Zap className="w-4 h-4 fill-black" />
                  <span>
                    Aplicar {bulkWholesalePrice ? `€ ${bulkWholesalePrice}` : ''} aos {bulkPricingTarget === 'all' ? 'Todos' : 'Selecionados'}
                  </span>
                </button>
              </div>
            </div>

            {/* Quick 1-Click Presets & Selection Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
              {/* 1-Click Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono-sku text-zinc-400 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  Atalhos de 1-Clique:
                </span>
                {[1, 5, 10, 15, 20, 25, 35, 50, 75, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickApplyValue(val)}
                    title={`Definir atacado imediatamente como € ${val} aos ${bulkPricingTarget === 'all' ? 'todos' : 'selecionados'}`}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-sku font-bold transition-all border ${
                      parseFloat(bulkWholesalePrice) === val
                        ? 'bg-amber-400 text-black border-amber-400 shadow-sm'
                        : 'bg-black/40 text-zinc-300 border-white/10 hover:border-amber-400/50 hover:text-amber-300'
                    }`}
                  >
                    € {val}
                  </button>
                ))}
              </div>

              {/* Selection Helpers */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAllCandidates(true)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono-sku text-zinc-300 hover:text-white transition-colors"
                >
                  Marcar Todos
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAllCandidates(false)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono-sku text-zinc-400 hover:text-white transition-colors"
                >
                  Desmarcar Todos
                </button>
                <button
                  type="button"
                  onClick={handleInvertCandidatesSelection}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono-sku text-zinc-400 hover:text-white transition-colors"
                >
                  Inverter
                </button>
                <button
                  type="button"
                  onClick={handleApproveAllSelected}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[10px] font-mono-sku text-emerald-300 hover:text-emerald-200 transition-colors font-bold"
                >
                  ✓ Aprovar Selecionados
                </button>
              </div>
            </div>
          </div>

          {/* Candidates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.map((cand) => (
              <div
                key={cand.id}
                className={`border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                  cand.isSelected !== false
                    ? 'border-amber-400/60 ring-1 ring-amber-400/30 bg-[#222023] shadow-lg shadow-amber-500/5'
                    : cand.isApproved
                    ? 'border-white/20 bg-[#201f21]'
                    : 'border-white/10 bg-[#201f21] opacity-70'
                }`}
              >
                <div>
                  {/* Top Bar with Selection Checkbox and Approval Toggle */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/5">
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={cand.isSelected !== false}
                        onChange={() =>
                          setCandidates((prev) =>
                            prev.map((c) =>
                              c.id === cand.id ? { ...c, isSelected: c.isSelected === false ? true : false } : c
                            )
                          )
                        }
                        className="w-4 h-4 rounded bg-black/60 border-white/20 text-amber-400 focus:ring-amber-400 accent-amber-400 cursor-pointer"
                      />
                      <span className="font-mono-sku text-[10px] font-bold px-2 py-0.5 rounded bg-black/40 border border-white/10 text-amber-300">
                        REF: #{cand.sku}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setCandidates((prev) =>
                          prev.map((c) => (c.id === cand.id ? { ...c, isApproved: !c.isApproved } : c))
                        )
                      }
                      className={`text-[10px] font-mono-sku px-2.5 py-0.5 rounded-full border transition-colors ${
                        cand.isApproved
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold'
                          : 'bg-zinc-800 text-zinc-400 border-white/10'
                      }`}
                    >
                      {cand.isApproved ? '✓ APROVADO' : 'IGNORAR'}
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
                        <label className="text-[10px] font-mono-sku text-zinc-400 block">Preço Varejo (€):</label>
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
                        <label className="text-[10px] font-mono-sku text-amber-400 block">Atacado 10+ (€):</label>
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

                    {/* Live Margin Calculation */}
                    <div className="flex items-center justify-between px-2 py-1 bg-black/40 rounded-lg border border-white/5 text-[10px] font-mono-sku">
                      <span className="text-zinc-400">Margem Comercial B2B:</span>
                      <span className="text-emerald-400 font-bold">
                        +{cand.suggestedWholesalePrice > 0
                          ? Math.round(((cand.suggestedRetailPrice - cand.suggestedWholesalePrice) / cand.suggestedWholesalePrice) * 100)
                          : 100}%
                      </span>
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
