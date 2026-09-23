import React, { useState, useRef } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  ShieldCheck,
  Tag,
  Zap,
  CheckSquare,
  Square,
  Coins,
  Check,
  Download,
  Upload,
  FileCode,
  Info,
  Copy,
  ExternalLink,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { SneakerProduct, PartnerStore } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface InventoryManagementTabProps {
  products: SneakerProduct[];
  partnerStores: PartnerStore[];
  onAddProduct: (product: SneakerProduct) => void;
  onDeleteProduct: (productId: string) => void;
  onBulkUpdateProducts?: (updated: SneakerProduct[]) => void;
  onImportCatalog?: (products: SneakerProduct[], mode?: 'merge' | 'replace') => void;
}

export const InventoryManagementTab: React.FC<InventoryManagementTabProps> = ({
  products,
  partnerStores,
  onAddProduct,
  onDeleteProduct,
  onBulkUpdateProducts,
  onImportCatalog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStore, setFilterStore] = useState('all');

  // Bulk selection and repricing states
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [bulkPricingTarget, setBulkPricingTarget] = useState<'selected' | 'all'>('selected');
  const [bulkWholesalePrice, setBulkWholesalePrice] = useState<string>('10');
  const [bulkRetailPrice, setBulkRetailPrice] = useState<string>('25');
  const [isAutoRetail, setIsAutoRetail] = useState<boolean>(true);
  const [autoMarkupPercent, setAutoMarkupPercent] = useState<number>(150);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Vercel Sync & Export/Import states
  const [showVercelModal, setShowVercelModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export catalog as clean JSON file
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kicksluxe_catalogo_${products.length}_modelos_EUR.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setFeedbackToast({
      message: `Catálogo com ${products.length} modelos baixado em JSON com sucesso!`,
      type: 'success',
    });
  };

  // Export initialProducts.ts ready to be saved in git repository for Vercel
  const handleExportTypeScriptFile = () => {
    const tsContent = `import { SneakerProduct } from '../types';\n\nexport const INITIAL_PRODUCTS: SneakerProduct[] = ${JSON.stringify(
      products,
      null,
      2
    )};\n`;

    const blob = new Blob([tsContent], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'initialProducts.ts';
    link.click();
    URL.revokeObjectURL(url);
    setFeedbackToast({
      message: `Arquivo "initialProducts.ts" com ${products.length} modelos gerado! Basta substituir em src/data/ e fazer deploy na Vercel.`,
      type: 'success',
    });
  };

  // Copy TypeScript code to clipboard
  const handleCopyTypeScriptCode = () => {
    const tsContent = `import { SneakerProduct } from '../types';\n\nexport const INITIAL_PRODUCTS: SneakerProduct[] = ${JSON.stringify(
      products,
      null,
      2
    )};\n`;
    navigator.clipboard.writeText(tsContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
    setFeedbackToast({
      message: `Código TypeScript copiado! Cole no arquivo src/data/initialProducts.ts para enviar à Vercel.`,
      type: 'success',
    });
  };

  // Import JSON from file input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (onImportCatalog) {
            onImportCatalog(parsed, 'replace');
          }
          setFeedbackToast({
            message: `Sucesso! ${parsed.length} produtos importados e sincronizados no catálogo!`,
            type: 'success',
          });
        } else {
          setFeedbackToast({
            message: 'O arquivo JSON não contém uma lista válida de produtos.',
            type: 'error',
          });
        }
      } catch (err: any) {
        setFeedbackToast({
          message: `Erro ao ler arquivo JSON: ${err.message}`,
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [newProd, setNewProd] = useState<Partial<SneakerProduct>>({
    name: '',
    sku: `KL-${Math.floor(1000 + Math.random() * 9000)}`,
    brand: 'Jordan',
    category: 'High-Top',
    retailPrice: 140,
    wholesalePrice: 55,
    minWholesaleQty: 10,
    badge: 'GRADE DISPONÍVEL',
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
    description: 'Silhueta de alta performance confeccionada em couro premium com amortecimento pneumático responsivo.',
    materials: ['Couro Bovino 100%', 'Entressola PU', 'Solado de Borracha'],
    sizes: [38, 39, 40, 41, 42, 43, 44],
    storeId: 'central',
  });

  const brands = Array.from(new Set(products.map((p) => p.brand)));
  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBrand = filterBrand === 'all' || p.brand === filterBrand;
    const matchCategory = filterCategory === 'all' || p.category === filterCategory;
    const matchStore = filterStore === 'all' || p.storeId === filterStore;
    return matchSearch && matchBrand && matchCategory && matchStore;
  });

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedProductIds(new Set(filtered.map((p) => p.id)));
    } else {
      setSelectedProductIds(new Set());
    }
  };

  const handleQuickApplyValue = (val: number) => {
    const wholesaleVal = val;
    const retailVal = isAutoRetail
      ? Math.max(Math.round(wholesaleVal * (1 + autoMarkupPercent / 100)), wholesaleVal + 2)
      : parseFloat(bulkRetailPrice) || Math.round(wholesaleVal * 2);

    setBulkWholesalePrice(wholesaleVal.toString());
    setBulkRetailPrice(retailVal.toString());

    const targetProducts =
      bulkPricingTarget === 'all'
        ? filtered
        : filtered.filter((p) => selectedProductIds.has(p.id));

    if (targetProducts.length === 0) {
      setFeedbackToast({
        message: 'Nenhum produto selecionado. Marque os produtos ou selecione "Filtrados".',
        type: 'info',
      });
      setTimeout(() => setFeedbackToast(null), 4000);
      return;
    }

    const updated = targetProducts.map((p) => {
      const margin = Math.round(((retailVal - wholesaleVal) / wholesaleVal) * 100);
      return {
        ...p,
        wholesalePrice: wholesaleVal,
        retailPrice: retailVal,
        profitMarginPct: margin,
      };
    });

    if (onBulkUpdateProducts) {
      onBulkUpdateProducts(updated);
    }

    setFeedbackToast({
      message: `Preço de Atacado definido como € ${wholesaleVal.toFixed(2)} para ${targetProducts.length} produtos!`,
      type: 'success',
    });
    setTimeout(() => setFeedbackToast(null), 4500);
  };

  const handleApplyBulkPricing = () => {
    const wholesaleVal = parseFloat(bulkWholesalePrice.replace(',', '.'));
    const retailVal = parseFloat(bulkRetailPrice.replace(',', '.'));

    const hasValidWholesale = !isNaN(wholesaleVal) && wholesaleVal > 0;
    const hasValidRetail = !isNaN(retailVal) && retailVal > 0;

    if (!hasValidWholesale && !hasValidRetail) {
      setFeedbackToast({
        message: 'Por favor, informe um valor válido para o Preço de Atacado ou Varejo (ex: 10 ou 1).',
        type: 'error',
      });
      setTimeout(() => setFeedbackToast(null), 4000);
      return;
    }

    const targetProducts =
      bulkPricingTarget === 'all'
        ? filtered
        : filtered.filter((p) => selectedProductIds.has(p.id));

    if (targetProducts.length === 0) {
      setFeedbackToast({
        message: 'Nenhum produto selecionado. Selecione itens na tabela ou altere para "Filtrados".',
        type: 'info',
      });
      setTimeout(() => setFeedbackToast(null), 4000);
      return;
    }

    const updated = targetProducts.map((p) => {
      const newWholesale = hasValidWholesale ? wholesaleVal : p.wholesalePrice;
      let newRetail = p.retailPrice;

      if (hasValidRetail) {
        newRetail = retailVal;
      } else if (hasValidWholesale && isAutoRetail) {
        newRetail = Math.max(Math.round(newWholesale * (1 + autoMarkupPercent / 100)), newWholesale + 2);
      }

      const margin = Math.round(((newRetail - newWholesale) / newWholesale) * 100);
      return {
        ...p,
        wholesalePrice: newWholesale,
        retailPrice: newRetail,
        profitMarginPct: margin,
      };
    });

    if (onBulkUpdateProducts) {
      onBulkUpdateProducts(updated);
    }

    setFeedbackToast({
      message: `Precificação em lote atualizada para ${targetProducts.length} produtos com sucesso!`,
      type: 'success',
    });
    setTimeout(() => setFeedbackToast(null), 4500);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.sku) return;

    const retail = newProd.retailPrice || 140;
    const wholesale = newProd.wholesalePrice || 55;
    const margin = Math.round(((retail - wholesale) / wholesale) * 100);

    const created: SneakerProduct = {
      id: `prod-${Date.now()}`,
      name: newProd.name || '',
      sku: newProd.sku || `KL-${Date.now().toString().slice(-4)}`,
      brand: newProd.brand || 'Original',
      category: newProd.category || 'Retro Runner',
      retailPrice: retail,
      wholesalePrice: wholesale,
      minWholesaleQty: 10,
      profitMarginPct: margin,
      badge: newProd.badge || 'GRADE DISPONÍVEL',
      image: newProd.image || 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
      description: newProd.description || '',
      materials: newProd.materials || ['Couro', 'Borracha'],
      sizes: newProd.sizes || [38, 39, 40, 41, 42, 43, 44],
      storeId: newProd.storeId || 'central',
      originSource: 'manual',
      createdAt: new Date().toISOString(),
    };

    onAddProduct(created);
    setShowAddModal(false);
  };

  const isAllFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selectedProductIds.has(p.id));

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedbackToast && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-jakarta shadow-lg transition-all ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : feedbackToast.type === 'error'
              ? 'bg-red-500/15 border-red-500/40 text-red-300'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{feedbackToast.message}</span>
          </div>
          <button
            onClick={() => setFeedbackToast(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hidden File Input for Catalog Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        className="hidden"
      />

      {/* Top Banner and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#1e1d1f] p-4 rounded-2xl border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-syne font-bold text-base text-white">
              Inventário Central & Estoque por Unidade
            </h3>
            <span className="text-[10px] font-mono-sku px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 font-bold">
              TODOS EM EUROS (€)
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-jakarta mt-0.5">
            Total de <strong className="text-amber-400 font-mono-sku">{products.length}</strong> modelos cadastrados no catálogo KicksLuxe.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Vercel sync info button */}
          <button
            type="button"
            onClick={() => setShowVercelModal(true)}
            className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 font-syne font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            title="Entenda por que a Vercel tem 18 produtos e como sincronizar todos os 66 produtos"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>Sincronizar Vercel</span>
          </button>

          {/* Export JSON */}
          <button
            type="button"
            onClick={handleExportJSON}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-syne font-bold text-xs flex items-center gap-1.5 transition-all"
            title="Baixar backup do catálogo completo em arquivo JSON"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Exportar JSON</span>
          </button>

          {/* Import JSON */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-syne font-bold text-xs flex items-center gap-1.5 transition-all"
            title="Importar catálogo de arquivo JSON com 1 clique"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Importar JSON</span>
          </button>

          {/* Manual Add Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-syne font-bold text-xs flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cadastrar Manual</span>
          </button>
        </div>
      </div>

      {/* BULK PRICING TOOLBAR FOR INVENTORY */}
      <div className="bg-gradient-to-br from-[#242226] via-[#1c1b1e] to-[#161517] border border-amber-400/30 rounded-2xl p-4 md:p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center shadow-inner">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h5 className="font-syne font-bold text-sm text-white">
                  Precificação em Lote do Estoque
                </h5>
                <span className="text-[10px] font-mono-sku px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 font-bold">
                  TODOS OU SELECIONADOS
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-jakarta mt-0.5">
                Defina o valor de atacado ou varejo em Euros (€) para múltiplos modelos simultaneamente (ex: colocar 10 € ou 1 €).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono-sku">
            <span className="px-3 py-1 rounded-lg bg-black/50 border border-white/10 text-zinc-300">
              <strong className="text-amber-400">{selectedProductIds.size}</strong> selecionados
            </span>
            <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400">
              {filtered.length} filtrados
            </span>
          </div>
        </div>

        {/* Target and Inputs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
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
                <span>Selecionados ({selectedProductIds.size})</span>
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
                <span>Filtrados ({filtered.length})</span>
              </button>
            </div>
          </div>

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
                  value={
                    isAutoRetail
                      ? parseFloat(bulkWholesalePrice)
                        ? Math.max(
                            Math.round(parseFloat(bulkWholesalePrice) * (1 + autoMarkupPercent / 100)),
                            parseFloat(bulkWholesalePrice) + 2
                          )
                        : 25
                      : bulkRetailPrice
                  }
                  disabled={isAutoRetail}
                  onChange={(e) => setBulkRetailPrice(e.target.value)}
                  placeholder="25"
                  className={`w-full bg-black/60 border rounded-xl pl-7 pr-3 py-2 text-white font-mono-sku text-sm font-bold focus:outline-none ${
                    isAutoRetail
                      ? 'border-white/10 text-zinc-400 cursor-not-allowed opacity-80'
                      : 'border-white/20 focus:border-white/40'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col justify-end">
            <button
              type="button"
              onClick={handleApplyBulkPricing}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-syne font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all transform active:scale-95"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>
                Aplicar {bulkWholesalePrice ? `€ ${bulkWholesalePrice}` : ''} aos{' '}
                {bulkPricingTarget === 'all' ? 'Filtrados' : 'Selecionados'}
              </span>
            </button>
          </div>
        </div>

        {/* 1-Click Presets & Selection Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
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
                title={`Definir atacado imediatamente como € ${val} aos ${
                  bulkPricingTarget === 'all' ? 'filtrados' : 'selecionados'
                }`}
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectAllFiltered(true)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono-sku text-zinc-300 hover:text-white transition-colors"
            >
              Marcar Todos ({filtered.length})
            </button>
            <button
              type="button"
              onClick={() => handleSelectAllFiltered(false)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono-sku text-zinc-400 hover:text-white transition-colors"
            >
              Desmarcar Todos
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar: Brand, Category, Store and Search */}
      <div className="bg-[#181718] p-4 rounded-2xl border border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-jakarta">
        <div>
          <label className="text-[10px] font-mono-sku text-zinc-400 block mb-1">Filtrar por Busca:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nome, SKU ou marca..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono-sku text-zinc-400 block mb-1">Marca / Silhueta:</label>
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">Todas as Marcas ({brands.length})</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-mono-sku text-zinc-400 block mb-1">Categoria:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">Todas as Categorias ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-mono-sku text-zinc-400 block mb-1">Unidade / Loja:</label>
          <select
            value={filterStore}
            onChange={(e) => setFilterStore(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">Todas as Unidades</option>
            {partnerStores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-[#181718] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-jakarta">
            <thead className="bg-[#121112] text-zinc-400 uppercase font-mono-sku text-[10px] border-b border-white/10">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={(e) => handleSelectAllFiltered(e.target.checked)}
                    className="w-4 h-4 rounded bg-black/60 border-white/20 text-amber-400 focus:ring-amber-400 accent-amber-400 cursor-pointer"
                    title="Selecionar todos os produtos visíveis"
                  />
                </th>
                <th className="p-3.5">Modelo & SKU</th>
                <th className="p-3.5">Marca / Categoria</th>
                <th className="p-3.5">Varejo Sugerido</th>
                <th className="p-3.5">Atacado (10+ un)</th>
                <th className="p-3.5">Margem B2B</th>
                <th className="p-3.5">Origem</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {filtered.map((prod) => {
                const isSelected = selectedProductIds.has(prod.id);
                return (
                  <tr
                    key={prod.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-amber-400/5 hover:bg-amber-400/10' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectProduct(prod.id)}
                        className="w-4 h-4 rounded bg-black/60 border-white/20 text-amber-400 focus:ring-amber-400 accent-amber-400 cursor-pointer"
                      />
                    </td>

                    <td className="p-3.5 flex items-center gap-3">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-lg bg-black/40 p-1 object-contain border border-white/5"
                      />
                      <div>
                        <span className="font-mono-sku text-[10px] text-amber-400 font-bold block">
                          #{prod.sku}
                        </span>
                        <span className="font-syne font-bold text-white text-xs">{prod.name}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-white block">{prod.brand}</span>
                      <span className="text-zinc-500 text-[11px] font-mono-sku">{prod.category}</span>
                    </td>

                    <td className="p-3.5 font-mono-sku font-semibold text-white">
                      {formatCurrency(prod.retailPrice)}
                    </td>

                    <td className="p-3.5 font-mono-sku font-bold text-amber-300">
                      {formatCurrency(prod.wholesalePrice)}
                    </td>

                    <td className="p-3.5 font-mono-sku">
                      <span className="text-emerald-400 font-bold">+{prod.profitMarginPct}%</span>
                    </td>

                    <td className="p-3.5">
                      <span className="text-[10px] font-mono-sku px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
                        {prod.originSource === 'pdf_extracted'
                          ? 'Catálogo PDF'
                          : prod.originSource === 'curated'
                          ? 'Curadoria Central'
                          : 'Manual'}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => onDeleteProduct(prod.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Excluir produto do catálogo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Product Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#1c1b1c] border border-white/15 rounded-3xl p-6 shadow-2xl text-white">
            <h3 className="text-lg font-syne font-bold mb-1">Cadastrar Tênis Manualmente</h3>
            <p className="text-xs text-zinc-400 font-jakarta mb-4">
              Preencha os dados do tênis para cadastro direto no estoque da KicksLuxe.
            </p>

            <form onSubmit={handleCreate} className="space-y-3 font-jakarta text-xs">
              <div>
                <label className="block text-zinc-300 mb-1 font-semibold">Nome do Modelo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Air Jordan 4 Retro Military Blue"
                  value={newProd.name}
                  onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">Referência / SKU</label>
                  <input
                    type="text"
                    required
                    value={newProd.sku}
                    onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-mono-sku focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">Marca</label>
                  <input
                    type="text"
                    required
                    value={newProd.brand}
                    onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">Preço Varejo (€)</label>
                  <input
                    type="number"
                    value={newProd.retailPrice}
                    onChange={(e) => setNewProd({ ...newProd, retailPrice: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-mono-sku"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">Preço Atacado (€)</label>
                  <input
                    type="number"
                    value={newProd.wholesalePrice}
                    onChange={(e) => setNewProd({ ...newProd, wholesalePrice: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-mono-sku"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-semibold">URL da Imagem</label>
                <input
                  type="text"
                  value={newProd.image}
                  onChange={(e) => setNewProd({ ...newProd, image: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-semibold">Descrição do Sapato</label>
                <textarea
                  rows={2}
                  value={newProd.description}
                  onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-syne font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-syne font-bold"
                >
                  Salvar Tênis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vercel Catalog Synchronization Explanation Modal */}
      {showVercelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            className="w-full max-w-2xl bg-[#1a191c] border border-blue-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-zinc-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-syne font-bold text-base text-white">
                    Sincronização com a Vercel
                  </h4>
                  <p className="text-xs text-zinc-400 font-jakarta">
                    Entenda por que aqui há {products.length} modelos e na Vercel inicial há 18
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowVercelModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-jakarta leading-relaxed">
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-blue-200 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-blue-300">
                  <Info className="w-4 h-4 shrink-0" />
                  Como funciona o armazenamento:
                </p>
                <p>
                  Quando a IA extrai modelos de PDFs no seu navegador, eles são salvos no banco local deste dispositivo (<strong className="text-white">IndexedDB / LocalStorage</strong>). A Vercel hospeda o código estático do Git, e lê o arquivo base <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300">src/data/initialProducts.ts</code> (que continha os 18 modelos iniciais).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <span className="text-[10px] font-mono-sku uppercase text-amber-400 font-bold block">
                    Método 1 • Permanente na Vercel (Recomendado)
                  </span>
                  <p className="text-zinc-300 text-[11px]">
                    Substitua o arquivo <code className="text-amber-300">src/data/initialProducts.ts</code> do seu repositório com todos os {products.length} modelos atuais. Todos os visitantes da Vercel verão os {products.length} modelos em Euros!
                  </p>
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleExportTypeScriptFile}
                      className="w-full py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-syne font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar initialProducts.ts</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyTypeScriptCode}
                      className="w-full py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-[11px] font-mono-sku flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedCode ? 'Código Copiado!' : 'Copiar Código TS'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <span className="text-[10px] font-mono-sku uppercase text-emerald-400 font-bold block">
                    Método 2 • Imediato no Navegador da Vercel
                  </span>
                  <p className="text-zinc-300 text-[11px]">
                    Baixe o backup JSON agora. Ao abrir seu link na Vercel, acesse o SuperAdmin &gt; Inventário e clique em <strong className="text-emerald-300">"Importar JSON"</strong> para carregar todos os modelos instantaneamente.
                  </p>
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleExportJSON}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-syne font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Catálogo (.JSON)</span>
                    </button>
                    <label className="w-full py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-[11px] font-mono-sku flex items-center justify-center gap-1.5 cursor-pointer text-center">
                      <Upload className="w-3 h-3 text-emerald-400" />
                      <span>Importar Backup (.JSON)</span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        accept=".json"
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowVercelModal(false)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-syne font-semibold text-xs"
              >
                Entendido, Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
