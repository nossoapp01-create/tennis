import React, { useState } from 'react';
import { X, ShieldCheck, Sparkles, Plus, Minus, ShoppingBag, Flame, Pencil, Check } from 'lucide-react';
import { SneakerProduct, SizeQuantity } from '../types';
import { formatCurrency } from '../utils/currency';

interface ProductDetailModalProps {
  product: SneakerProduct | null;
  mode: 'varejo' | 'atacado';
  onClose: () => void;
  onAddToCart: (product: SneakerProduct, mode: 'varejo' | 'atacado', sizeQuantities: SizeQuantity[]) => void;
  onUpdateProductPrices?: (productId: string, wholesalePrice: number, retailPrice: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  mode,
  onClose,
  onAddToCart,
  onUpdateProductPrices,
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

  // Price editing state
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [editWholesale, setEditWholesale] = useState(product.wholesalePrice.toString());
  const [editRetail, setEditRetail] = useState(product.retailPrice.toString());
  const [priceSaveSuccess, setPriceSaveSuccess] = useState(false);

  const handleSaveDetailPrices = () => {
    const w = parseFloat(editWholesale.replace(',', '.'));
    const r = parseFloat(editRetail.replace(',', '.'));
    if (isNaN(w) || w <= 0 || isNaN(r) || r <= 0) {
      alert('Por favor, informe valores válidos maiores que zero para atacado e varejo.');
      return;
    }

    if (onUpdateProductPrices) {
      onUpdateProductPrices(product.id, w, r);
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
            className="relative w-full my-6 flex items-center justify-center cursor-zoom-in group"
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <img
              src={product.image}
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

              <div className="mt-3 flex items-baseline gap-4">
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
                  <div>
                    <span className="text-[11px] font-mono-sku text-zinc-400 block uppercase">PREÇO VAREJO</span>
                    <span className="text-2xl font-jakarta font-bold text-white tracking-tight tabular-nums">
                      {formattedRetailPrice}
                    </span>
                  </div>
                )}
              </div>

              {/* Price Edit Section */}
              {onUpdateProductPrices && (
                <div className="mt-3 pt-2.5 border-t border-white/5">
                  {!isEditingPrices ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditWholesale(product.wholesalePrice.toString());
                        setEditRetail(product.retailPrice.toString());
                        setIsEditingPrices(true);
                        setPriceSaveSuccess(false);
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-syne font-bold text-amber-400 hover:text-amber-300 transition-colors py-1 px-2 rounded-lg hover:bg-amber-400/10 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3 text-amber-400" />
                      <span>Editar Valores (Varejo Sugerido e Atacado)</span>
                    </button>
                  ) : (
                    <div className="p-3.5 mt-2 rounded-2xl bg-black/60 border border-amber-400/40 space-y-3">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                        <span className="text-[11px] font-syne font-bold text-amber-300 flex items-center gap-1.5">
                          <Pencil className="w-3.5 h-3.5 text-amber-400" />
                          Editar Preços deste Modelo
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingPrices(false)}
                          className="text-zinc-400 hover:text-white p-0.5 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono-sku text-amber-300 block mb-1 font-semibold">
                            Valor Atacado (€)
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

                      {/* Real-time Margin & Profit Preview */}
                      {(() => {
                        const w = parseFloat(editWholesale.replace(',', '.'));
                        const r = parseFloat(editRetail.replace(',', '.'));
                        if (!isNaN(w) && w > 0 && !isNaN(r) && r > 0) {
                          const margin = Math.round(((r - w) / w) * 100);
                          const profit = r - w;
                          return (
                            <div className="flex items-center justify-between text-[11px] font-mono-sku bg-white/5 px-2.5 py-1.5 rounded-lg">
                              <span className="text-zinc-400">
                                Lucro Estimado: <strong className="text-white">€ {profit.toFixed(2)}</strong>
                              </span>
                              <span className={margin >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                +{margin}% Margem
                              </span>
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
