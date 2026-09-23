import React, { useState, useRef } from 'react';
import { Eye, Plus, Check, ShoppingBag, Sparkles, ShieldCheck, Flame } from 'lucide-react';
import { SneakerProduct, SizeQuantity } from '../types';
import { formatCurrency } from '../utils/currency';

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
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D Tilt & Glare States
  const [tilt, setTilt] = useState({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
    isHovered: false,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Smooth 3D tilt angles between -7deg and +7deg
    const rotateX = -((y - centerY) / centerY) * 7.5;
    const rotateY = ((x - centerX) / centerX) * 7.5;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ rotateX, rotateY, glareX, glareY, isHovered: true });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, isHovered: false });
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, mode, [{ size: selectedSize, quantity }]);
    setIsAddedRecently(true);
    setTimeout(() => setIsAddedRecently(false), 1800);
  };

  const formattedRetailPrice = formatCurrency(product.retailPrice);
  const formattedWholesalePrice = formatCurrency(product.wholesalePrice);

  const isHighPriority =
    product.badge?.includes('BEST-SELLER') ||
    product.badge?.includes('HYPE') ||
    product.badge?.includes('GRAIL') ||
    product.badge?.includes('ICÔNICO') ||
    product.badge?.includes('ALTA DEMANDA') ||
    product.badge?.includes('PASSARELA');

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: tilt.isHovered
          ? `perspective(1100px) rotateX(${tilt.rotateX.toFixed(2)}deg) rotateY(${tilt.rotateY.toFixed(2)}deg) translate3d(0, -8px, 0)`
          : 'perspective(1100px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)',
        ['--mouse-x' as any]: `${tilt.glareX}%`,
        ['--mouse-y' as any]: `${tilt.glareY}%`,
      }}
      className={`vault-card rounded-2xl overflow-hidden flex flex-col group relative preserve-3d will-change-transform ${
        isHighPriority ? 'highlight-glow-ribbon' : ''
      } ${
        isSelectedForBulk ? 'ring-2 ring-amber-400 border-amber-400/80 bg-[#222122] shadow-[0_0_30px_rgba(212,175,55,0.25)]' : ''
      }`}
    >
      {/* Dynamic Cursor Light Glare Overlay */}
      <div className="card-sheen-glare" />

      {/* Top Bar with Badge, SKU and Multi-Select Checkbox */}
      <div className="p-3 pb-0 flex items-center justify-between z-10 translate-z-20">
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
          <span className="font-mono-sku text-[11px] font-bold px-2 py-0.5 rounded badge-3d-dark text-zinc-300">
            #{product.sku}
          </span>
        </div>

        {/* Dynamic 3D Badge with Highlight Shimmer */}
        {product.badge && (
          <span
            className={`text-[10px] font-mono-sku font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all ${
              isHighPriority
                ? 'badge-3d-gold text-amber-200 highlight-shimmer'
                : 'badge-3d-dark text-amber-400/90'
            }`}
          >
            {isHighPriority && <Flame className="w-3 h-3 text-amber-400 animate-pulse" />}
            <span>{product.badge}</span>
          </span>
        )}
      </div>

      {/* 3D Image Container with Cinematic Pop & Real-time Drop Shadow */}
      <div
        onClick={() => onQuickView(product)}
        className="relative w-full aspect-[4/3] p-4 flex items-center justify-center cursor-pointer overflow-visible preserve-3d"
      >
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="img-3d-pop w-full h-full object-contain filter drop-shadow-[0_14px_22px_rgba(0,0,0,0.85)]"
          loading="lazy"
        />

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-bold font-syne flex items-center gap-1.5 shadow-2xl transform translate-y-3 group-hover:translate-y-0 transition-all active:scale-95"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="text-3d-dark">Inspecionar em 3D</span>
          </button>
        </div>
      </div>

      {/* Product Information Body with 3D Typography */}
      <div className="p-4 pt-2 flex flex-col flex-1 justify-between gap-3 border-t border-white/5 translate-z-20">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-[11px] font-mono-sku text-zinc-400">
            <span className="uppercase text-amber-400/90 font-semibold tracking-wider">{product.brand}</span>
            <span className="text-zinc-500">{product.category}</span>
          </div>

          {/* Product Name with 3D Depth */}
          <h3
            onClick={() => onQuickView(product)}
            className="text-sm md:text-base font-syne font-extrabold text-white tracking-wide mt-1 line-clamp-1 hover:text-amber-300 cursor-pointer transition-colors text-3d-white"
          >
            {product.name}
          </h3>

          {/* Short description preview */}
          <p className="text-xs text-zinc-400 line-clamp-2 mt-1 font-jakarta leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing Area: Varejo vs Atacado with 3D Gold Accent */}
        <div className="bg-[#181719] p-3 rounded-xl border border-white/10 shadow-inner">
          {mode === 'atacado' ? (
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-mono-sku text-amber-400 font-bold uppercase tracking-wider">
                  Atacado (10+ un):
                </span>
                <span className="text-xl font-syne font-extrabold text-3d-gold">
                  {formattedWholesalePrice}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1.5 pt-1.5 border-t border-white/5">
                <span>Varejo sugerido: {formattedRetailPrice}</span>
                <span className="text-emerald-400 font-mono-sku font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  +{product.profitMarginPct}% margem
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-mono-sku text-zinc-400 uppercase tracking-wider">
                  Preço Varejo:
                </span>
                <span className="text-xl font-syne font-extrabold text-3d-white">
                  {formattedRetailPrice}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-amber-400/90 mt-1.5 pt-1.5 border-t border-white/5 font-mono-sku">
                <span>Em até 10x sem juros</span>
                <span className="text-amber-300 font-bold">Envio Imediato</span>
              </div>
            </div>
          )}
        </div>

        {/* Size Selection Pills with 3D Bevel */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono-sku text-zinc-400 mb-1.5">
            <span>Grade Europeia / BR:</span>
            <span className="text-amber-300 font-bold text-3d-subtle">Tam {selectedSize}</span>
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
                    ? 'badge-3d-gold text-black font-extrabold shadow-md scale-105'
                    : 'badge-3d-dark text-zinc-300 hover:text-white hover:border-white/20'
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
              <div className="flex items-center bg-black/60 border border-white/10 rounded-lg px-2 py-1 badge-3d-dark">
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
                className={`flex-1 py-2.5 rounded-lg font-syne text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-98 ${
                  isAddedRecently
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-lg shadow-amber-500/20 border-t border-amber-200/50'
                }`}
              >
                {isAddedRecently ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Adicionado</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Inserir na Grade</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className={`w-full py-2.5 rounded-lg font-syne text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-98 ${
                isAddedRecently
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-zinc-100 to-white hover:from-white hover:to-zinc-200 text-black shadow-lg border-t border-white/80'
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
