import React, { useState } from 'react';
import { X, ShieldCheck, Check, Sparkles, Plus, Minus, Layers, AlertCircle, ShoppingBag } from 'lucide-react';
import { SneakerProduct, SizeQuantity } from '../types';

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

  const formattedRetailPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(product.retailPrice);

  const formattedWholesalePrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(product.wholesalePrice);

  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(totalPrice);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-[#181718] border border-white/15 rounded-3xl overflow-hidden shadow-2xl my-8 text-zinc-100 flex flex-col md:flex-row max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 flex items-center justify-center text-white transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Image with Interactive Zoom */}
        <div className="md:w-1/2 p-6 md:p-8 bg-gradient-to-b from-[#212021] to-[#141415] flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-white/10 relative overflow-hidden">
          {/* Top Badges */}
          <div className="w-full flex items-center justify-between z-10">
            <span className="font-mono-sku text-xs px-2.5 py-1 rounded bg-black/60 border border-white/10 text-amber-400 font-bold">
              REF: #{product.sku}
            </span>
            <span className="text-xs font-mono-sku px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>COFRE CERTIFICADO</span>
            </span>
          </div>

          {/* Interactive Zoomable Image Area */}
          <div
            className="relative w-full my-6 flex items-center justify-center cursor-zoom-in group"
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <img
              src={product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              className={`max-h-72 object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)] transition-all duration-500 ${
                isZoomed ? 'scale-150 cursor-zoom-out' : 'group-hover:scale-115'
              }`}
            />
            <div className="absolute bottom-1 right-2 text-[10px] font-mono-sku text-zinc-400 bg-black/50 px-2 py-0.5 rounded">
              {isZoomed ? 'Clique para reduzir' : 'Clique para zoom 150%'}
            </div>
          </div>

          {/* Key Quick Highlights */}
          <div className="w-full grid grid-cols-2 gap-2 text-xs font-mono-sku">
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
              <span className="text-zinc-400 text-[10px] block">SILHUETA / MARCA</span>
              <span className="text-white font-bold">{product.brand}</span>
            </div>
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
              <span className="text-zinc-400 text-[10px] block">CATEGORIA</span>
              <span className="text-amber-400 font-bold">{product.category}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Complete Description & Batch Size Matrix */}
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Header Title & Pricing */}
            <div className="border-b border-white/10 pb-4">
              <span className="text-xs font-mono-sku text-amber-400 tracking-wider uppercase font-semibold">
                {product.brand} // {product.category}
              </span>
              <h2 className="text-xl md:text-2xl font-syne font-bold text-white mt-1">
                {product.name}
              </h2>

              <div className="mt-3 flex items-baseline gap-4">
                {mode === 'atacado' ? (
                  <>
                    <div>
                      <span className="text-[11px] font-mono-sku text-zinc-400 block">PREÇO ATACADO (10+ UN)</span>
                      <span className="text-2xl font-syne font-extrabold text-amber-400">
                        {formattedWholesalePrice}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-mono-sku text-zinc-400 block">SUGESTÃO VAREJO</span>
                      <span className="text-sm font-syne text-zinc-300 line-through">
                        {formattedRetailPrice}
                      </span>
                    </div>
                    <span className="text-xs font-mono-sku font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      +{product.profitMarginPct}% Lucro
                    </span>
                  </>
                ) : (
                  <div>
                    <span className="text-[11px] font-mono-sku text-zinc-400 block">PREÇO VAREJO</span>
                    <span className="text-2xl font-syne font-extrabold text-white">
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
                    activeTab === 'specs' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Descrição & Especificações
                </button>
                <button
                  onClick={() => setActiveTab('materials')}
                  className={`pb-2 transition-colors ${
                    activeTab === 'materials' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Materiais & Conservação
                </button>
                <button
                  onClick={() => setActiveTab('authenticity')}
                  className={`pb-2 transition-colors ${
                    activeTab === 'authenticity' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-zinc-400 hover:text-white'
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
                      <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-1.5 text-[11px]">
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
                          className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-200 text-[11px]"
                        >
                          {mat}
                        </span>
                      ))}
                    </div>
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-[11px]">
                      <strong className="text-amber-400 block mb-1">Guia de Preservação do Sneaker:</strong>
                      <p>{product.specs?.preservationMode || 'Armazenar em temperatura ambiente na caixa original com saquinho dessecante. Limpeza apenas a seco ou pano ligeiramente umedecido.'}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'authenticity' && (
                  <div className="bg-black/20 p-3 rounded-xl border border-emerald-500/20 space-y-2 text-[11px]">
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

            {/* Batch Grade Size Matrix (Grade de Tamanhos para Atacado e Varejo) */}
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
                          ? 'bg-amber-400/10 border-amber-400/50'
                          : 'bg-black/30 border-white/5 text-zinc-400'
                      }`}
                    >
                      <span className="font-mono-sku text-xs font-bold text-white">{s}</span>
                      <div className="flex items-center gap-1 my-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(s, -1)}
                          className="w-4 h-4 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="font-mono-sku text-xs font-extrabold text-amber-300 w-4 text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(s, 1)}
                          className="w-4 h-4 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
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
              <span className="text-[10px] font-mono-sku text-zinc-400 uppercase block">Subtotal</span>
              <span className="text-xl font-syne font-extrabold text-white">
                {formattedTotal}
              </span>
            </div>

            <button
              onClick={handleAddAndClose}
              className="flex-1 py-3 px-6 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-syne font-bold text-xs tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {mode === 'atacado' ? `Adicionar ${totalPairsSelected} Pares ao Manifesto` : 'Adicionar ao Carrinho'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
