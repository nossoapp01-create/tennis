import React, { useState, useEffect } from 'react';
import { X, Trash2, ShoppingBag, Send, FileText, Download, CheckCircle2, ShieldCheck, Sparkles, TrendingUp, ArrowLeft } from 'lucide-react';
import { CartItem } from '../types';
import { formatCurrency } from '../utils/currency';

interface B2BCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  mode: 'varejo' | 'atacado';
  onUpdateQuantity: (productId: string, size: number, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const B2BCartDrawer: React.FC<B2BCartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  mode,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Total pairs across all cart items
  const totalPairs = cart.reduce((acc, item) => {
    return acc + item.sizeQuantities.reduce((sAcc, sq) => sAcc + sq.quantity, 0);
  }, 0);

  // Total raw retail and wholesale values
  const totalRetailValue = cart.reduce((acc, item) => {
    const pairsCount = item.sizeQuantities.reduce((sAcc, sq) => sAcc + sq.quantity, 0);
    return acc + pairsCount * item.product.retailPrice;
  }, 0);

  // Target volume threshold (e.g. 50 or 100 pares sortidos)
  const primaryVolumeQty = cart.length > 0
    ? (cart[0].product.volumeWholesaleQty || 50)
    : 50;

  const sampleWholesalePrice = cart.length > 0 ? (cart[0].product.wholesalePrice || 25) : 25;
  const sampleVolumePrice = cart.length > 0 ? (cart[0].product.volumeWholesalePrice ?? 20) : 20;

  // Helper to determine the unit price of an item given the total assorted pairs in cart
  const getItemUnitPrice = (item: CartItem): number => {
    if (mode === 'varejo') {
      return item.product.retailPrice;
    }
    const volumeQty = item.product.volumeWholesaleQty || 50;
    // When total assorted pairs in the cart reach or exceed the volume threshold:
    if (totalPairs >= volumeQty) {
      return item.product.volumeWholesalePrice ?? 20;
    }
    return item.product.wholesalePrice;
  };

  const isItemVolumeActive = (item: CartItem): boolean => {
    return mode === 'atacado' && totalPairs >= (item.product.volumeWholesaleQty || 50);
  };

  const isAnyVolumeActive = mode === 'atacado' && totalPairs >= primaryVolumeQty;

  // Total effective billed value
  const totalEffectiveWholesaleValue = cart.reduce((acc, item) => {
    const pairsCount = item.sizeQuantities.reduce((sAcc, sq) => sAcc + sq.quantity, 0);
    const unitPrice = getItemUnitPrice(item);
    return acc + pairsCount * unitPrice;
  }, 0);

  // Format currency helper in Euros
  const fmt = (val: number) => formatCurrency(val);

  // Wholesale tiered discount status badge
  let tierBadge = 'Abaixo do Mínimo de Atacado';
  if (totalPairs >= primaryVolumeQty) {
    tierBadge = `Mega Lote ${primaryVolumeQty}+ Sortidos Ativado (${fmt(sampleVolumePrice)}/par)`;
  } else if (totalPairs >= 10) {
    tierBadge = `Atacado Padrão 10+ Ativado (${fmt(sampleWholesalePrice)}/par)`;
  } else {
    tierBadge = `Faltam ${Math.max(0, 10 - totalPairs)} pares para ativar atacado`;
  }

  const effectiveTotal =
    mode === 'atacado'
      ? totalEffectiveWholesaleValue
      : totalRetailValue;

  const estimatedProfit = totalRetailValue - effectiveTotal;

  // Export CSV Manifest
  const handleExportCSV = () => {
    let csv = 'Referencia_SKU,Modelo,Marca,Categoria,Tamanho,Quantidade,Preco_Unitario,Subtotal,Faixa_Preco\n';
    cart.forEach((item) => {
      item.sizeQuantities.forEach((sq) => {
        if (sq.quantity > 0) {
          const unit = getItemUnitPrice(item);
          const isVol = isItemVolumeActive(item);
          const faixa = mode === 'varejo' ? 'Varejo' : isVol ? `Mega Lote ${item.product.volumeWholesaleQty || 50}+ Sortidos` : 'Atacado 10+';
          csv += `"${item.product.sku}","${item.product.name}","${item.product.brand}","${item.product.category}",${sq.size},${sq.quantity},${unit},${unit * sq.quantity},"${faixa}"\n`;
        }
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Manifesto_KicksLuxe_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Checkout via WhatsApp
  const handleWhatsAppCheckout = () => {
    let text = `*SOLICITAÇÃO DE PEDIDO // KICKSLUXE VAULT*\n`;
    text += `*Modalidade:* ${mode === 'atacado' ? 'ATACADO B2B' : 'VAREJO PRIME'}\n`;
    text += `*Data:* ${new Date().toLocaleDateString('pt-BR')}\n`;
    text += `*Total de Pares:* ${totalPairs} un (Sortidos)\n`;
    if (mode === 'atacado' && isAnyVolumeActive) {
      text += `*Status de Preço:* MEGA LOTE ${primaryVolumeQty}+ SORTIDOS APLICADO (€20/par)\n`;
    }
    text += `\n*--- ITENS E GRADES DO MANIFESTO ---*\n`;

    cart.forEach((item, idx) => {
      const sizesSummary = item.sizeQuantities
        .filter((sq) => sq.quantity > 0)
        .map((sq) => `Tam ${sq.size}: ${sq.quantity} un`)
        .join(', ');

      const unit = getItemUnitPrice(item);
      const isVol = isItemVolumeActive(item);
      text += `${idx + 1}. [REF #${item.product.sku}] ${item.product.name}\n   Grade: ${sizesSummary}\n   Unitário: ${fmt(unit)}${isVol ? ` (Mega Lote ${item.product.volumeWholesaleQty || 50}+ Sortidos)` : ''}\n\n`;
    });

    text += `*VALOR TOTAL A FATURAR:* ${fmt(effectiveTotal)}\n`;
    if (mode === 'atacado') {
      text += `*LUCRO BRUTO ESTIMADO NA REVENDA:* ${fmt(estimatedProfit)}\n`;
    }
    text += `*Solicito reserva de estoque e dados bancários/faturamento.*`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/5511987219000?text=${encoded}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <div
        className="b2b-cart-drawer w-full max-w-xl bg-[#171617] h-full shadow-2xl border-l border-white/10 flex flex-col justify-between transition-colors duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#1f1e1f]">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="font-syne font-bold text-lg text-white">
                {mode === 'atacado' ? 'Manifesto de Pedido em Lote B2B' : 'Carrinho de Compras'}
              </h2>
            </div>
            <p className="text-[11px] font-mono-sku text-zinc-400 mt-0.5">
              {totalPairs} {totalPairs === 1 ? 'par selecionado' : 'pares selecionados'} no pedido
            </p>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-[11px] font-mono-sku text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
              >
                Limpar Grade
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:text-amber-400 font-syne font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              title="Fechar Manifesto (ESC)"
            >
              <X className="w-4 h-4 text-amber-400" />
              <span>Fechar</span>
            </button>
          </div>
        </div>

        {/* Tier Discount Progress Bar (Atacado) */}
        {mode === 'atacado' && (
          <div
            className={`px-5 py-3 border-b transition-colors ${
              totalPairs >= primaryVolumeQty
                ? 'bg-gradient-to-r from-emerald-950/40 via-[#16221c] to-emerald-950/30 border-emerald-500/30'
                : 'bg-[#131314] border-white/5'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5 font-mono-sku">
              <span className="text-zinc-300 flex items-center gap-1.5 font-semibold">
                <TrendingUp
                  className={`w-3.5 h-3.5 ${
                    totalPairs >= primaryVolumeQty ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                />
                <span>Faixa de Atacado (Pares Sortidos):</span>
              </span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  totalPairs >= primaryVolumeQty ? 'text-emerald-300' : 'text-amber-400'
                }`}
              >
                {totalPairs >= primaryVolumeQty && (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                )}
                {tierBadge}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  totalPairs >= primaryVolumeQty
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-300 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                    : 'bg-gradient-to-r from-amber-500 to-amber-300'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(5, (totalPairs / primaryVolumeQty) * 100))}%`,
                }}
              ></div>
            </div>

            <div className="flex justify-between text-[10px] font-mono-sku mt-1.5 text-zinc-400">
              <span className={totalPairs >= 10 ? 'text-amber-300 font-bold' : 'text-zinc-500'}>
                10 pares (Atacado {fmt(sampleWholesalePrice)})
              </span>
              <span
                className={
                  totalPairs >= primaryVolumeQty ? 'text-emerald-300 font-bold' : 'text-zinc-400'
                }
              >
                🔥 {primaryVolumeQty}+ sortidos ({fmt(sampleVolumePrice)}/par){' '}
                {totalPairs >= primaryVolumeQty ? '✓ Ativado' : ''}
              </span>
            </div>

            {totalPairs > 0 && totalPairs < primaryVolumeQty && (
              <p className="text-[10px] font-mono-sku text-amber-300/90 mt-1.5 bg-amber-400/10 px-2 py-1 rounded border border-amber-400/20 text-center">
                Adicione mais <strong>{primaryVolumeQty - totalPairs}</strong> pares sortidos para o
                preço de TODOS os modelos cair automaticamente para <strong>{fmt(sampleVolumePrice)}</strong> cada!
              </p>
            )}
            {totalPairs >= primaryVolumeQty && (
              <p className="text-[10px] font-mono-sku text-emerald-300 mt-1.5 bg-emerald-500/15 px-2 py-1 rounded border border-emerald-500/30 text-center font-bold">
                🎉 Desconto Máximo Ativado: Todos os {totalPairs} pares sortidos faturados a apenas {fmt(sampleVolumePrice)} cada!
              </p>
            )}
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 mb-3">
                <ShoppingBag className="w-8 h-8 stroke-1" />
              </div>
              <h3 className="font-syne font-bold text-base text-zinc-300">Seu manifesto está vazio</h3>
              <p className="text-xs font-jakarta mt-1 max-w-xs text-zinc-400">
                Selecione os modelos de tênis no catálogo para montar sua grade de atacado ou compra unitária.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-syne font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Continuar Comprando / Fechar</span>
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const itemTotalPairs = item.sizeQuantities.reduce((acc, sq) => acc + sq.quantity, 0);
              const unit = getItemUnitPrice(item);
              const isVolActive = isItemVolumeActive(item);
              const volQty = item.product.volumeWholesaleQty || 50;
              const volPrice = item.product.volumeWholesalePrice ?? 20;

              return (
                <div
                  key={item.product.id}
                  className={`border rounded-2xl p-4 flex flex-col gap-3 relative group transition-colors ${
                    isVolActive
                      ? 'bg-gradient-to-b from-[#1b231e] to-[#151c17] border-emerald-500/30'
                      : 'bg-[#1d1c1e] border-white/10'
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 object-contain bg-black/40 rounded-xl p-1.5 border border-white/5"
                      />
                      <div>
                        <span className="font-mono-sku text-[10px] text-amber-400 font-bold">
                          REF #{item.product.sku}
                        </span>
                        <h4 className="text-xs font-jakarta font-bold text-white line-clamp-1">
                          {item.product.name}
                        </h4>
                        {isVolActive ? (
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="text-xs font-mono-sku font-extrabold text-emerald-400 tabular-nums">
                              {fmt(unit)} / par
                            </span>
                            <span className="text-[10px] font-mono-sku text-zinc-500 line-through tabular-nums">
                              {fmt(item.product.wholesalePrice)}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono-sku font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              LOTE {volQty}+ SORTIDOS
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="text-[11px] font-jakarta font-semibold text-zinc-300 tabular-nums">
                              {fmt(unit)} / par
                            </span>
                            {mode === 'atacado' && (
                              <span className="text-[10px] font-mono-sku text-amber-400/80">
                                ({volQty}+ sortidos sai a {fmt(volPrice)})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                      title="Remover modelo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Size Breakdown Pills */}
                  <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                    <div className="text-[10px] font-mono-sku text-zinc-400 mb-1.5 flex justify-between">
                      <span>Grade por Tamanho:</span>
                      <span className="text-white font-bold">{itemTotalPairs} pares</span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                      {item.sizeQuantities.map((sq) => (
                        <div
                          key={sq.size}
                          className="bg-white/5 rounded p-1 text-center border border-white/5 flex flex-col items-center"
                        >
                          <span className="text-[10px] font-mono-sku text-zinc-400">Tam {sq.size}</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, sq.size, sq.quantity - 1)}
                              className="w-3.5 h-3.5 rounded bg-white/10 text-white flex items-center justify-center text-[9px] hover:bg-white/20 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-mono-sku font-bold text-amber-400">
                              {sq.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, sq.size, sq.quantity + 1)}
                              className="w-3.5 h-3.5 rounded bg-white/10 text-white flex items-center justify-center text-[9px] hover:bg-white/20 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Item Subtotal */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                    <span className="text-zinc-400 font-jakarta">Subtotal deste modelo:</span>
                    <span className="font-jakarta font-bold text-white tabular-nums">{fmt(itemTotalPairs * unit)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer with Financial Summary & Checkout */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-white/10 bg-[#1a191a] space-y-3">
            {/* Calculation summary */}
            <div className="space-y-1.5 text-xs font-mono-sku">
              <div className="flex justify-between text-zinc-400">
                <span>Total de Pares no Pedido:</span>
                <span className="text-white font-bold">{totalPairs} un (Sortidos)</span>
              </div>

              {mode === 'atacado' && (
                <>
                  <div className="flex justify-between text-zinc-400">
                    <span>Valor em Tabela Varejo:</span>
                    <span className="text-zinc-400 line-through tabular-nums">{fmt(totalRetailValue)}</span>
                  </div>
                  {isAnyVolumeActive && (
                    <div className="flex justify-between text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                      <span className="font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Desconto Mega Lote ({primaryVolumeQty}+ sortidos a {fmt(sampleVolumePrice)}):</span>
                      </span>
                      <span className="font-bold tabular-nums">
                        -{fmt(
                          cart.reduce((acc, item) => {
                            const cnt = item.sizeQuantities.reduce((sAcc, sq) => sAcc + sq.quantity, 0);
                            const diff = item.product.wholesalePrice - (item.product.volumeWholesalePrice ?? 20);
                            return acc + (diff > 0 ? cnt * diff : 0);
                          }, 0)
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                    <span className="font-bold">Lucro Líquido Estimado na Revenda:</span>
                    <span className="font-bold tabular-nums">+{fmt(estimatedProfit)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-base font-jakarta font-bold text-white pt-2 border-t border-white/10">
                <span>Total a Faturar:</span>
                <span className="text-amber-400 text-xl font-bold tabular-nums">{fmt(effectiveTotal)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-syne font-semibold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Exportar CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppCheckout}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-syne font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-98"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar p/ Concierge</span>
                </button>
              </div>

              {/* Botão para Fechar / Continuar Comprando */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 hover:border-amber-400/40 border border-white/15 text-xs font-syne font-bold text-zinc-200 hover:text-white flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer"
              >
                <X className="w-4 h-4 text-amber-400" />
                <span>Fechar / Continuar Comprando</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
