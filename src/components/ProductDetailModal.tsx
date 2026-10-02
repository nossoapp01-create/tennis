import React, { useState } from 'react';
import { X, ShieldCheck, Sparkles, Plus, Minus, ShoppingBag, Flame, Pencil, Check, Upload, TrendingUp, CreditCard } from 'lucide-react';
import { SneakerProduct, SizeQuantity } from '../types';
import { formatCurrency } from '../utils/currency';
import { compressUploadedImage } from '../utils/imageProcessor';

interface ProductDetailModalProps {
  product: SneakerProduct | null;
  mode: 'varejo' | 'atacado';
  onClose: () => void;
  onAddToCart: (product: SneakerProduct, mode: 'varejo' | 'atacado', sizeQuantities: SizeQuantity[]) => void;
  onUpdateProductPrices?: (
    productId: string,
    wholesalePrice: number,
    retailPrice: number,
    volumeWholesalePrice?: number,
    volumeWholesaleQty?: number
  ) => void;
  onUpdateProduct?: (product: SneakerProduct) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  mode,
  onClose,
  onAddToCart,
  onUpdateProductPrices,
  onUpdateProduct,
}) => {
  if (!product) return null;

  // Track quantities across all sizes for bulk ordering
  const [sizeQuantities, setSizeQuantities] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    product.sizes.forEach((s, idx) => {
      // default 2 pairs for first 5 sizes if atacado, or 1 for size 40 if varejo
      if (mode === 'atacado') {
        initial[s] = idx < 5 ? 2 : 0;
      } else {
        initial[s] = s === 40 ? 1 : 0;
      }
    });
    return initial;
  });

  const [activeTab, setActiveTab] = useState<'specs' | 'materials' | 'authenticity'>('specs');
  const [isZoomed, setIsZoomed] = useState(false);
  const [activePhoto, setActivePhoto] = useState<'main' | 'secondary'>('main');

  // Price & Details editing state
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [editName, setEditName] = useState(product.name);
  const [editImage, setEditImage] = useState(product.image);
  const [editSecondaryImage, setEditSecondaryImage] = useState(product.secondaryImage || '');
  const [editWholesale, setEditWholesale] = useState(product.wholesalePrice.toString());
  const [editRetail, setEditRetail] = useState(product.retailPrice.toString());
  const [editVolumePrice, setEditVolumePrice] = useState((product.volumeWholesalePrice ?? 20).toString());
  const [editVolumeQty, setEditVolumeQty] = useState(product.volumeWholesaleQty ?? 50);
  const [priceSaveSuccess, setPriceSaveSuccess] = useState(false);

  const handleDetailImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'primary' | 'secondary') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressUploadedImage(file, 1000, 1000, 0.85);
    if (compressed) {
      if (field === 'primary') setEditImage(compressed);
      else setEditSecondaryImage(compressed);
    }
  };

  const handleSaveDetailPrices = () => {
    const w = parseFloat(editWholesale.replace(',', '.'));
    const r = parseFloat(editRetail.replace(',', '.'));
    const volP = parseFloat(editVolumePrice.replace(',', '.'));
    if (isNaN(w) || w <= 0 || isNaN(r) || r <= 0) {
      alert('Por favor, informe valores válidos maiores que zero para atacado e varejo.');
      return;
    }

    const validVolPrice = !isNaN(volP) && volP > 0 ? volP : 20;
    const margin = Math.round(((r - w) / w) * 100);

    const updatedProd: SneakerProduct = {
      ...product,
      name: editName.trim() || product.name,
      image: editImage.trim() || product.image,
      secondaryImage: editSecondaryImage.trim() || undefined,
      wholesalePrice: w,
      retailPrice: r,
      volumeWholesalePrice: validVolPrice,
      volumeWholesaleQty: editVolumeQty,
      profitMarginPct: margin,
    };

    if (onUpdateProduct) {
      onUpdateProduct(updatedProd);
    }
    if (onUpdateProductPrices) {
      onUpdateProductPrices(product.id, w, r, validVolPrice, editVolumeQty);
    }
    setIsEditingPrices(false);
    setPriceSaveSuccess(true);
    setTimeout(() => setPriceSaveSuccess(false), 3000);
  };

  const updateQuantity = (size: number, delta: number) => {
    setSizeQuantities((prev) => {
      const current = prev[size] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [size]: next };
    });
  };

  const totalPairsSelected = Object.values(sizeQuantities).reduce((acc, q) => acc + q, 0);

  const unitPrice = mode === 'atacado' ? product.wholesalePrice : product.retailPrice;
  const totalPrice = totalPairsSelected * unitPrice;

  const handleAddAndClose = () => {
    const selectedList: SizeQuantity[] = Object.entries(sizeQuantities)
      .map(([s, q]) => ({ size: parseInt(s), quantity: q }))
      .filter((item) => item.quantity > 0);

    if (selectedList.length === 0) {
      alert('Selecione ao menos 1 par em algum tamanho.');
      return;
    }

    onAddToCart(product, mode, selectedList);
    onClose();
  };

  const formattedRetailPrice = formatCurrency(product.retailPrice);
  const formattedWholesalePrice = formatCurrency(product.wholesalePrice);
  const formattedTotal = formatCurrency(totalPrice);

  const isHighPriority =
    product.badge?.includes('BEST-SELLER') ||
    product.badge?.includes('HYPE') ||
    product.badge?.includes('GRAIL') ||
    product.badge?.includes('ICÔNICO') ||
    product.badge?.includes('ALTA DEMANDA') ||
    product.badge?.includes('PASSARELA');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto perspective-1000">
      <div
        className="product-modal-container relative w-full max-w-4xl bg-[#181719] border border-white/20 rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] my-8 text-zinc-100 flex flex-col md:flex-row max-h-[90vh] highlight-glow-ribbon transition-colors duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full badge-3d-dark hover:border-white/40 flex items-center justify-center text-white transition-all active:scale-95 shadow-lg"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Image with 3D Depth and Interactive Zoom */}
        <div className="product-modal-left md:w-1/2 p-6 md:p-8 bg-gradient-to-b from-[#222123] to-[#131314] flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-white/10 relative overflow-hidden preserve-3d transition-colors duration-300">
          {/* Top Badges */}
          <div className="w-full flex items-center justify-between z-10">
            <span className="font-mono-sku text-xs px-3 py-1 rounded badge-3d-dark text-amber-400 font-bold">
              REF: #{product.sku}
            </span>
            <span className="text-xs font-mono-sku px-3 py-1 rounded-full badge-3d-gold text-amber-200 flex items-center gap-1.5 shadow-md">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">COFRE CERTIFICADO</span>
            </span>
          </div>

          {/* Interactive Zoomable 3D Image Area */}
          <div
            className="relative w-full my-4 flex items-center justify-center cursor-zoom-in group"
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <img
              src={
                activePhoto === 'secondary' && (product.secondaryImage || editSecondaryImage)
                  ? (product.secondaryImage || editSecondaryImage)
                  : (product.image || editImage)
              }
              alt={product.name}
              referrerPolicy="no-referrer"
              className={`max-h-72 object-contain filter drop-shadow-[0_24px_40px_rgba(0,0,0,0.95)] transition-all duration-500 ${
                isZoomed ? 'scale-150 rotate-2 cursor-zoom-out' : 'group-hover:scale-115 group-hover:-translate-y-2 group-hover:rotate-1'
              }`}
            />
            <div className="absolute bottom-1 right-2 text-[10px] font-mono-sku text-zinc-300 badge-3d-dark px-2.5 py-1 rounded shadow">
              {isZoomed ? 'Clique para reduzir' : 'Clique para zoom 3D'}
            </div>
          </div>

          {/* Photo Switcher: 1ª Foto (Principal) e 2ª Foto (Ângulo 2) */}
          <div className="w-full flex items-center justify-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setActivePhoto('main')}
              className={`px-3 py-1 rounded-xl text-[10px] font-mono-sku font-bold transition-all cursor-pointer ${
                activePhoto === 'main'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
              }`}
            >
              Foto 1 (Principal)
            </button>
            <button
              type="button"
              onClick={() => setActivePhoto('secondary')}
              className={`px-3 py-1 rounded-xl text-[10px] font-mono-sku font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activePhoto === 'secondary'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
              }`}
            >
              <span>Foto 2 (Ângulo 2)</span>
              {product.secondaryImage && <span className="text-[9px] text-emerald-400 font-bold">●</span>}
            </button>
          </div>

          {/* Key Quick Highlights with 3D Bevel */}
          <div className="w-full grid grid-cols-2 gap-2 text-xs font-mono-sku">
            <div className="badge-3d-dark p-2.5 rounded-xl">
              <span className="text-zinc-400 text-[10px] block uppercase font-semibold">SILHUETA / MARCA</span>
              <span className="text-white font-bold text-3d-subtle">{product.brand}</span>
            </div>
            <div className="badge-3d-dark p-2.5 rounded-xl">
              <span className="text-zinc-400 text-[10px] block uppercase font-semibold">CATEGORIA</span>
              <span className="text-amber-400 font-bold text-3d-gold">{product.category}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Complete Description & Batch Size Matrix */}
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Header Title & Pricing with 3D Typography */}
            <div className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-sku text-amber-400 tracking-wider uppercase font-bold">
                  {product.brand} // {product.category}
                </span>
                {isHighPriority && (
                  <span className="text-[10px] font-mono-sku px-2 py-0.5 rounded-full badge-3d-gold text-amber-200 font-bold flex items-center gap-1 highlight-shimmer">
                    <Flame className="w-3 h-3 text-amber-400" />
                    DESTAQUE
                  </span>
                )}
              </div>
              <h2 className="text-xl md:text-2xl font-jakarta font-bold text-white mt-1 tracking-tight">
                {product.name}
              </h2>

              <div className="mt-3 space-y-2">
                <div className="flex items-baseline gap-4 flex-wrap">
                  {mode === 'atacado' ? (
                    <>
                      <div>
                        <span className="text-[11px] font-mono-sku text-zinc-400 block font-semibold uppercase">PREÇO ATACADO (10+ UN)</span>
                        <span className="text-2xl font-jakarta font-bold text-amber-400 tracking-tight tabular-nums">
                          {formattedWholesalePrice}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-mono-sku text-zinc-400 block uppercase">SUGESTÃO VAREJO</span>
                        <span className="text-sm font-jakarta text-zinc-400 line-through tabular-nums">
                          {formattedRetailPrice}
                        </span>
                      </div>
                      <span className="text-xs font-mono-sku font-bold px-2.5 py-1 rounded badge-3d-dark text-emerald-400">
                        +{product.profitMarginPct}% Lucro
                      </span>
                    </>
                  ) : (
                    <div className="flex items-center gap-4 bg-[#141416] px-4 py-3 rounded-2xl border border-amber-400/30 shadow-[0_4px_20px_rgba(245,158,11,0.12)]">
                      <div>
                        <span className="text-xs font-mono-sku text-zinc-400 block uppercase font-bold tracking-wider">
                          CONSUMIDOR FINAL
                        </span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-3xl sm:text-4xl font-syne font-black text-amber-300 tracking-tight tabular-nums drop-shadow-md">
                            {formatCurrency(product.retailPrice || 45)}
                          </span>
                          <span className="text-xs font-mono-sku text-zinc-400 font-semibold">/ par</span>
                        </div>
                      </div>
                      <span className="ml-auto px-3.5 py-1.5 rounded-full badge-3d-gold text-black font-syne font-extrabold text-xs shadow-md">
                        Preço Oficial
                      </span>
                    </div>
                  )}
                </div>

                {mode === 'atacado' && (
                  <div className="bg-gradient-to-r from-emerald-500/15 via-[#18261e] to-teal-500/10 p-2.5 rounded-xl border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-inner">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 flex-shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-syne font-extrabold text-white">
                            Lote {product.volumeWholesaleQty || 50}+ Pares Sortidos:
                          </span>
                          <span className="text-sm font-mono-sku font-black text-emerald-300 tabular-nums">
                            € {(product.volumeWholesalePrice ?? 20).toFixed(2)} / par
                          </span>
                        </div>
                        <p className="text-[10px] font-mono-sku text-emerald-300/80">
                          Ao montar sua grade com {product.volumeWholesaleQty || 50}+ pares sortidos de qualquer modelo, o preço entra automaticamente a € {(product.volumeWholesalePrice ?? 20).toFixed(2)}!
                        </p>
                      </div>
                    </div>
                    <span className="self-start sm:self-center px-2 py-0.5 rounded bg-emerald-400 text-black font-mono-sku font-extrabold text-[10px] tracking-wide whitespace-nowrap shadow-sm">
                      AUTOMÁTICO
                    </span>
                  </div>
                )}
              </div>

              {/* Price & Details Edit Section */}
              {(onUpdateProductPrices || onUpdateProduct) && (
                <div className="mt-3 pt-2.5 border-t border-white/5">
                  {!isEditingPrices ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditName(product.name);
                        setEditImage(product.image);
                        setEditSecondaryImage(product.secondaryImage || '');
                        setEditWholesale(product.wholesalePrice.toString());
                        setEditRetail(product.retailPrice.toString());
                        setEditVolumePrice((product.volumeWholesalePrice ?? 20).toString());
                        setEditVolumeQty(product.volumeWholesaleQty ?? 50);
                        setIsEditingPrices(true);
                        setPriceSaveSuccess(false);
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-syne font-bold text-amber-400 hover:text-amber-300 transition-colors py-1 px-2 rounded-lg hover:bg-amber-400/10 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3 text-amber-400" />
                      <span>Editar Valores e Fotos deste Modelo</span>
                    </button>
                  ) : (
                    <div className="p-3.5 mt-2 rounded-2xl bg-black/60 border border-amber-400/40 space-y-3">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                        <span className="text-[11px] font-syne font-bold text-amber-300 flex items-center gap-1.5">
                          <Pencil className="w-3.5 h-3.5 text-amber-400" />
                          Editar Dados, Fotos e Preços deste Modelo
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingPrices(false)}
                          className="text-zinc-400 hover:text-white p-0.5 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Name Field */}
                      <div>
                        <label className="text-[10px] font-mono-sku text-zinc-300 block mb-1 font-semibold">
                          Nome do Modelo
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-[#181719] border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white font-syne font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {/* Image URLs & Upload: 1st and 2nd Image */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-mono-sku text-amber-300 block font-semibold">
                              Foto 1 (Principal)
                            </label>
                            <label className="text-[10px] font-mono-sku text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/10 transition-colors">
                              <Upload className="w-2.5 h-2.5" />
                              <span>Upload Foto 1</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleDetailImageUpload(e, 'primary')}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                              {editImage ? (
                                <img src={editImage} alt="Foto 1" className="w-full h-full object-contain" />
                              ) : (
                                <span className="text-[9px] text-zinc-600">Sem foto</span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={editImage}
                              onChange={(e) => setEditImage(e.target.value)}
                              placeholder="https://exemplo.com/foto1.png"
                              className="w-full bg-[#181719] border border-amber-400/40 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono-sku focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-mono-sku text-emerald-300 block font-semibold">
                              Foto 2 (Segunda Imagem / Ângulo 2)
                            </label>
                            <label className="text-[10px] font-mono-sku text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 transition-colors">
                              <Upload className="w-2.5 h-2.5" />
                              <span>Upload Foto 2</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleDetailImageUpload(e, 'secondary')}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-black/60 border border-emerald-500/20 flex items-center justify-center overflow-hidden shrink-0">
                              {editSecondaryImage ? (
                                <img src={editSecondaryImage} alt="Foto 2" className="w-full h-full object-contain" />
                              ) : (
                                <span className="text-[9px] text-zinc-600">Sem 2ª</span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={editSecondaryImage}
                              onChange={(e) => setEditSecondaryImage(e.target.value)}
                              placeholder="https://exemplo.com/foto2.png"
                              className="w-full bg-[#181719] border border-emerald-400/40 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono-sku focus:outline-none focus:border-emerald-400"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono-sku text-amber-300 block mb-1 font-semibold">
                            Valor Atacado 10+ (€)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={editWholesale}
                            onChange={(e) => setEditWholesale(e.target.value)}
                            className="w-full bg-[#181719] border border-amber-400/50 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono-sku font-bold focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-mono-sku text-zinc-300 block mb-1 font-semibold">
                            Varejo Sugerido (€)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            value={editRetail}
                            onChange={(e) => setEditRetail(e.target.value)}
                            className="w-full bg-[#181719] border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono-sku font-bold focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* Volume Wholesale Tier Input */}
                      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-2.5 rounded-xl border border-emerald-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-mono-sku text-emerald-300 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span>Lote de Volume Sortido:</span>
                          </label>
                          <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-emerald-500/30">
                            <button
                              type="button"
                              onClick={() => setEditVolumeQty(50)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono-sku font-bold transition-all cursor-pointer ${
                                editVolumeQty === 50 ? 'bg-emerald-400 text-black' : 'text-zinc-400 hover:text-emerald-300'
                              }`}
                            >
                              +50 pares
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditVolumeQty(100)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono-sku font-bold transition-all cursor-pointer ${
                                editVolumeQty === 100 ? 'bg-emerald-400 text-black' : 'text-zinc-400 hover:text-emerald-300'
                              }`}
                            >
                              +100 pares
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono-sku text-emerald-400 font-bold">€</span>
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              value={editVolumePrice}
                              onChange={(e) => setEditVolumePrice(e.target.value)}
                              placeholder="20"
                              className="w-full bg-[#181719] border border-emerald-500/50 rounded-lg pl-6 pr-2.5 py-1.5 text-xs text-emerald-300 font-mono-sku font-bold focus:outline-none focus:border-emerald-400"
                            />
                          </div>
                          <span className="text-[10px] font-mono-sku text-emerald-300/80">
                            sai <strong>€{editVolumePrice || '20'}</strong> em <strong>{editVolumeQty}+</strong> sortidos
                          </span>
                        </div>
                      </div>

                      {/* Real-time Margin & Profit Preview */}
                      {(() => {
                        const w = parseFloat(editWholesale.replace(',', '.'));
                        const r = parseFloat(editRetail.replace(',', '.'));
                        const v = parseFloat(editVolumePrice.replace(',', '.'));
                        if (!isNaN(w) && w > 0 && !isNaN(r) && r > 0) {
                          const margin10 = Math.round(((r - w) / w) * 100);
                          const profit10 = r - w;
                          const profitVol = !isNaN(v) && v > 0 ? r - v : null;
                          const marginVol = !isNaN(v) && v > 0 ? Math.round(((r - v) / v) * 100) : null;

                          return (
                            <div className="space-y-1 text-[10px] font-mono-sku bg-white/5 p-2 rounded-lg">
                              <div className="flex items-center justify-between text-zinc-300">
                                <span>No Atacado 10+: Lucro de <strong>€ {profit10.toFixed(2)}/par</strong></span>
                                <span className={margin10 >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                  +{margin10}% Margem
                                </span>
                              </div>
                              {profitVol !== null && (
                                <div className="flex items-center justify-between text-emerald-300 pt-1 border-t border-white/5">
                                  <span>No Lote {editVolumeQty}+: Lucro de <strong>€ {profitVol.toFixed(2)}/par</strong></span>
                                  <span className="text-emerald-400 font-bold">
                                    +{marginVol}% Margem
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsEditingPrices(false)}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-300 text-xs font-semibold cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveDetailPrices}
                          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Salvar Preços</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {priceSaveSuccess && (
                    <span className="text-[11px] font-mono-sku text-emerald-400 block mt-1 font-semibold">
                      ✓ Preços atualizados com sucesso!
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tabs for Technical Specs, Materials, and Authenticity */}
            <div className="mt-4">
              <div className="flex border-b border-white/10 gap-4 text-xs font-syne font-semibold">
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`pb-2 transition-colors ${
                    activeTab === 'specs' ? 'text-amber-400 border-b-2 border-amber-400 text-3d-subtle' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Descrição & Especificações
                </button>
                <button
                  onClick={() => setActiveTab('materials')}
                  className={`pb-2 transition-colors ${
                    activeTab === 'materials' ? 'text-amber-400 border-b-2 border-amber-400 text-3d-subtle' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Materiais & Conservação
                </button>
                <button
                  onClick={() => setActiveTab('authenticity')}
                  className={`pb-2 transition-colors ${
                    activeTab === 'authenticity' ? 'text-amber-400 border-b-2 border-amber-400 text-3d-subtle' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Laudo 1:1 de Autenticidade
                </button>
              </div>

              {/* Tab Contents */}
              <div className="py-3 text-xs text-zinc-300 font-jakarta leading-relaxed">
                {activeTab === 'specs' && (
                  <div className="space-y-2.5">
                    <p>{product.description}</p>
                    {product.specs && (
                      <div className="badge-3d-dark p-3 rounded-xl space-y-1.5 text-[11px]">
                        <div>
                          <strong className="text-white">Cabedal (Upper):</strong> {product.specs.upper || 'Couro e mesh premium de alta durabilidade.'}
                        </div>
                        <div>
                          <strong className="text-white">Entressola:</strong> {product.specs.midsole || 'Poliuretano com composto estabilizador.'}
                        </div>
                        <div>
                          <strong className="text-white">Amortecimento:</strong> {product.specs.cushioning || 'Câmara pneumática responsiva com absorção de impacto.'}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'materials' && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {product.materials?.map((mat, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-full badge-3d-dark text-zinc-200 text-[11px]"
                        >
                          {mat}
                        </span>
                      ))}
                    </div>
                    <div className="badge-3d-dark p-3 rounded-xl text-[11px]">
                      <strong className="text-amber-400 block mb-1">Guia de Preservação do Sneaker:</strong>
                      <p>{product.specs?.preservationMode || 'Armazenar em temperatura ambiente na caixa original com saquinho dessecante. Limpeza apenas a seco ou pano ligeiramente umedecido.'}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'authenticity' && (
                  <div className="badge-3d-dark p-3 rounded-xl space-y-2 text-[11px]">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold font-syne">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Certificação de Autenticidade Garantida</span>
                    </div>
                    <p className="text-zinc-300">
                      {product.specs?.authenticityProof || 'Cada par passa por inspeção minuciosa com verificação UV de costuras, precisão milimétrica de logos, conferência de código serial e emissão de certificado digital.'}
                    </p>
                    <div className="text-[10px] font-mono-sku text-zinc-400 pt-1 border-t border-white/5">
                      IDENTIFICADOR ÚNICO DO LOTE: VAULT-{product.sku}-B2B
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Batch Grade Size Matrix with 3D Bevel Buttons */}
            <div className="mt-2 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-syne font-bold text-white">
                  {mode === 'atacado' ? 'Montar Grade de Atacado (Pares por Tamanho):' : 'Selecione a Quantidade:'}
                </span>
                <span className="text-[11px] font-mono-sku text-amber-400 font-bold">
                  Total selecionado: {totalPairsSelected} {totalPairsSelected === 1 ? 'par' : 'pares'}
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {product.sizes.map((s) => {
                  const qty = sizeQuantities[s] || 0;
                  return (
                    <div
                      key={s}
                      className={`p-1.5 rounded-lg border flex flex-col items-center justify-between transition-all ${
                        qty > 0
                          ? 'badge-3d-gold'
                          : 'badge-3d-dark text-zinc-400'
                      }`}
                    >
                      <span className={`font-mono-sku text-xs font-bold ${qty > 0 ? 'text-black' : 'text-white'}`}>{s}</span>
                      <div className="flex items-center gap-1 my-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(s, -1)}
                          className="w-4 h-4 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white active:scale-90"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className={`font-mono-sku text-xs font-extrabold w-4 text-center ${qty > 0 ? 'text-black' : 'text-amber-300'}`}>
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(s, 1)}
                          className="w-4 h-4 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white active:scale-90"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Confirmation Bar */}
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono-sku text-zinc-400 uppercase block font-semibold">Subtotal</span>
              <span className="text-xl font-syne font-extrabold text-3d-gold">
                {formattedTotal}
              </span>
            </div>

            <button
              onClick={handleAddAndClose}
              className="flex-1 py-3 px-6 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-syne font-bold text-xs tracking-wider shadow-xl shadow-amber-500/20 border-t border-amber-200/60 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="text-3d-dark font-extrabold">
                {mode === 'atacado' ? `Adicionar ${totalPairsSelected} Pares ao Manifesto` : 'Adicionar ao Carrinho'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
