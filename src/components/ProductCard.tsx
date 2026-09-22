import React, { useState } from 'react';
import { Eye, Plus, Check, ShoppingBag, Sparkles, ShieldCheck } from 'lucide-react';
import { SneakerProduct, SizeQuantity } from '../types';

interface ProductCardProps {
  product: SneakerProduct;
  mode: 'varejo' | 'atacado';
  onQuickView: (product: SneakerProduct) => void;
  onAddToCart: (product: SneakerProduct, mode: 'varejo' | 'atacado', sizeQuantities: SizeQuantity[]) => void;
  isSelectedForBulk: boolean;
  onToggleBulkSelect: (product: SneakerProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  mode,
  onQuickView,
  onAddToCart,
  isSelectedForBulk,
  onToggleBulkSelect,
}) => {
  const [selectedSize, setSelectedSize] = useState<number>(product.sizes[2] || product.sizes[0] || 40);
  const [quantity, setQuantity] = useState<number>(mode === 'atacado' ? 10 : 1);
  const [isAddedRecently, setIsAddedRecently] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, mode, [{ size: selectedSize, quantity }]);
    setIsAddedRecently(true);
    setTimeout(() => setIsAddedRecently(false), 1800);
  };

  const formattedRetailPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(product.retailPrice);

  const formattedWholesalePrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(product.wholesalePrice);

  return (
    <div
      className={`vault-card rounded-2xl overflow-hidden flex flex-col group relative transition-all duration-300 ${
        isSelectedForBulk ? 'ring-2 ring-amber-400 border-amber-400/80 bg-[#222122]' : ''
      }`}
    >
      {/* Top Bar with Badge, SKU and Multi-Select Checkbox */}
      <div className="p-3 pb-0 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          {/* Checkbox for bulk selecting multiple sneakers */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBulkSelect(product);
            }}
            className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
              isSelectedForBulk
                ? 'bg-amber-400 border-amber-400 text-black shadow-sm'
                : 'border-white/20 bg-black/40 hover:border-white/50 text-transparent'
            }`}
            title="Selecionar para pedido em lote simultâneo"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </button>

          {/* Reference SKU Code */}
          <span className="font-mono-sku text-[11px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300">
            #{product.sku}
          </span>
        </div>

        {/* Dynamic Badge */}
        {product.badge && (
          <span className="text-[10px] font-mono-sku font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30">
            {product.badge}
          </span>
        )}
      </div>

      {/* Image Container with Cinematic Zoom Effect on Hover */}
      <div
        onClick={() => onQuickView(product)}
        className="relative w-full aspect-[4/3] p-4 flex items-center justify-center cursor-pointer overflow-hidden"
      >
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)] transition-all duration-500 ease-out group-hover:scale-115 group-hover:-translate-y-2 group-hover:rotate-1"
          loading="lazy"
        />

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white text-black text-xs font-bold font-syne flex items-center gap-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver Detalhes</span>
          </button>
        </div>
      </div>

      {/* Product Information Body */}
      <div className="p-4 pt-2 flex flex-col flex-1 justify-between gap-3 border-t border-white/5">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-[11px] font-mono-sku text-zinc-400">
            <span className="uppercase text-amber-400/90 font-semibold">{product.brand}</span>
            <span>{product.category}</span>
          </div>

          {/* Product Name */}
          <h3
            onClick={() => onQuickView(product)}
            className="text-sm md:text-base font-syne font-bold text-white tracking-wide mt-1 line-clamp-1 hover:text-amber-400 cursor-pointer transition-colors"
          >
            {product.name}
          </h3>

          {/* Short description preview */}
          <p className="text-xs text-zinc-400 line-clamp-2 mt-1 font-jakarta leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing Area: Varejo vs Atacado */}
        <div className="bg-[#171617] p-2.5 rounded-xl border border-white/5">
          {mode === 'atacado' ? (
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-mono-sku text-amber-400 font-bold uppercase">
                  Atacado (10+ un):
                </span>
                <span className="text-lg font-syne font-extrabold text-amber-300">
                  {formattedWholesalePrice}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1 pt-1 border-t border-white/5">
                <span>Varejo sugerido: {formattedRetailPrice}</span>
                <span className="text-emerald-400 font-mono-sku font-semibold">
                  +{product.profitMarginPct}% margem
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-mono-sku text-zinc-400 uppercase">
                  Preço Varejo:
                </span>
                <span className="text-lg font-syne font-extrabold text-white">
                  {formattedRetailPrice}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-amber-400/80 mt-1 pt-1 border-t border-white/5">
                <span>Em até 10x sem juros</span>
                <span className="font-mono-sku">Envio Imediato</span>
              </div>
            </div>
          )}
        </div>

        {/* Size Selection Pills */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono-sku text-zinc-400 mb-1.5">
            <span>Tamanho BR:</span>
            <span className="text-white font-bold">{selectedSize}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSize(s);
                }}
                className={`w-7 h-7 text-[11px] font-mono-sku rounded flex items-center justify-center transition-all ${
                  selectedSize === s
                    ? 'bg-amber-400 text-black font-extrabold shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons: Add to Manifest or Cart */}
        <div className="flex items-center gap-2 pt-1">
          {mode === 'atacado' ? (
            <div className="flex items-center gap-2 w-full">
              <div className="flex items-center bg-black/40 border border-white/10 rounded-lg px-2 py-1">
                <span className="text-[10px] text-zinc-400 font-mono-sku mr-1.5">Qtd:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  onClick={(e) => e.stopPropagation()}
                  className="w-10 bg-transparent text-center font-mono-sku text-xs text-white focus:outline-none"
                />
              </div>

              <button
                onClick={handleAdd}
                className={`flex-1 py-2 rounded-lg font-syne text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isAddedRecently
                    ? 'bg-emerald-500 text-black'
                    : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-md shadow-amber-500/10'
                }`}
              >
                {isAddedRecently ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Adicionado</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Inserir na Grade</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className={`w-full py-2.5 rounded-lg font-syne text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                isAddedRecently
                  ? 'bg-emerald-500 text-black'
                  : 'bg-white hover:bg-zinc-200 text-black shadow-md'
              }`}
            >
              {isAddedRecently ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>No Carrinho</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Comprar Par</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
