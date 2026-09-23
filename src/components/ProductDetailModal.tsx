import React, { useState } from 'react';
import { X, ShieldCheck, Sparkles, Plus, Minus, ShoppingBag, Flame } from 'lucide-react';
import { SneakerProduct, SizeQuantity } from '../types';
import { formatCurrency } from '../utils/currency';

interface ProductDetailModalProps {
  product: SneakerProduct | null;
  mode: 'varejo' | 'atacado';
  onClose: () => void;
  onAddToCart: (product: SneakerProduct, mode: 'varejo' | 'atacado', sizeQuantities: SizeQuantity[]) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  mode,
  onClose,
  onAddToCart,
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
        className="relative w-full max-w-4xl bg-[#181719] border border-white/20 rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] my-8 text-zinc-100 flex flex-col md:flex-row max-h-[90vh] highlight-glow-ribbon"
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
        <div className="md:w-1/2 p-6 md:p-8 bg-gradient-to-b from-[#222123] to-[#131314] flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-white/10 relative overflow-hidden preserve-3d">
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
              <h2 className="text-xl md:text-2xl font-syne font-extrabold text-white mt-1 text-3d-white">
                {product.name}
              </h2>

              <div className="mt-3 flex items-baseline gap-4">
                {mode === 'atacado' ? (
                  <>
                    <div>
                      <span className="text-[11px] font-mono-sku text-zinc-400 block font-semibold uppercase">PREÇO ATACADO (10+ UN)</span>
                      <span className="text-2xl font-syne font-extrabold text-3d-gold">
                        {formattedWholesalePrice}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-mono-sku text-zinc-400 block uppercase">SUGESTÃO VAREJO</span>
                      <span className="text-sm font-syne text-zinc-400 line-through">
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
                    <span className="text-2xl font-syne font-extrabold text-3d-white">
                      {formattedRetailPrice}
                    </span>
                  </div>
                )}
              </div>
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
