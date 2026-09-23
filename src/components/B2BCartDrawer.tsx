import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, Send, FileText, Download, CheckCircle2, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
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

  const totalWholesaleValue = cart.reduce((acc, item) => {
    const pairsCount = item.sizeQuantities.reduce((sAcc, sq) => sAcc + sq.quantity, 0);
    return acc + pairsCount * item.product.wholesalePrice;
  }, 0);

  // Wholesale tiered discount rules
  let tierDiscountPercent = 0;
  let tierBadge = 'Sem Desconto Adicional';
  if (totalPairs >= 50) {
    tierDiscountPercent = 5; // extra 5% on top of wholesale
    tierBadge = 'Tier Master 50+ un (-5% Extra + Frete Blindado VIP)';
  } else if (totalPairs >= 25) {
    tierDiscountPercent = 3;
    tierBadge = 'Tier Prime 25+ un (-3% Extra)';
  } else if (totalPairs >= 10) {
    tierDiscountPercent = 0;
    tierBadge = 'Atacado Padrão 10+ un Ativado';
  } else {
    tierBadge = `Faltam ${Math.max(0, 10 - totalPairs)} pares para ativar preço de atacado`;
  }

  const effectiveTotal =
    mode === 'atacado'
      ? totalWholesaleValue * (1 - tierDiscountPercent / 100)
      : totalRetailValue;

  const estimatedProfit = totalRetailValue - effectiveTotal;

  // Format currency helper in Euros
  const fmt = (val: number) => formatCurrency(val);

  // Export CSV Manifest
  const handleExportCSV = () => {
    let csv = 'Referencia_SKU,Modelo,Marca,Categoria,Tamanho,Quantidade,Preco_Unitario,Subtotal\n';
    cart.forEach((item) => {
      item.sizeQuantities.forEach((sq) => {
        if (sq.quantity > 0) {
          const unit = mode === 'atacado' ? item.product.wholesalePrice : item.product.retailPrice;
          csv += `"${item.product.sku}","${item.product.name}","${item.product.brand}","${item.product.category}",${sq.size},${sq.quantity},${unit},${unit * sq.quantity}\n`;
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
    text += `*Total de Pares:* ${totalPairs}\n\n`;
    text += `*--- ITENS E GRADES DO MANIFESTO ---*\n`;

    cart.forEach((item, idx) => {
      const sizesSummary = item.sizeQuantities
        .filter((sq) => sq.quantity > 0)
        .map((sq) => `Tam ${sq.size}: ${sq.quantity} un`)
        .join(', ');

      const unit = mode === 'atacado' ? item.product.wholesalePrice : item.product.retailPrice;
      text += `${idx + 1}. [REF #${item.product.sku}] ${item.product.name}\n   Grade: ${sizesSummary}\n   Unitário: ${fmt(unit)}\n\n`;
    });

    text += `*VALOR TOTAL ESTIMADO:* ${fmt(effectiveTotal)}\n`;
    if (mode === 'atacado') {
      text += `*LUCRO BRUTO ESTIMADO NA REVENDA:* ${fmt(estimatedProfit)}\n`;
    }
    text += `*Solicito reserva de estoque e dados bancários/faturamento.*`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/5511987219000?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm flex justify-end">
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
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tier Discount Progress Bar (Atacado) */}
        {mode === 'atacado' && (
          <div className="bg-[#131314] px-5 py-3 border-b border-white/5">
            <div className="flex items-center justify-between text-xs mb-1.5 font-mono-sku">
              <span className="text-zinc-300 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Status de Desconto de Volume:</span>
              </span>
              <span className="text-amber-400 font-bold">{tierBadge}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalPairs / 50) * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] font-mono-sku text-zinc-500 mt-1">
              <span>10 pares (Atacado)</span>
              <span>25 pares (-3% extra)</span>
              <span>50+ pares (-5% + Frete Grátis)</span>
            </div>
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
            </div>
          ) : (
            cart.map((item) => {
              const itemTotalPairs = item.sizeQuantities.reduce((acc, sq) => acc + sq.quantity, 0);
              const unit = mode === 'atacado' ? item.product.wholesalePrice : item.product.retailPrice;

              return (
                <div
                  key={item.product.id}
                  className="bg-[#1d1c1e] border border-white/10 rounded-2xl p-4 flex flex-col gap-3 relative group"
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
                        <h4 className="text-xs font-syne font-bold text-white line-clamp-1">
                          {item.product.name}
                        </h4>
                        <span className="text-[11px] font-mono-sku text-zinc-400">
                          {fmt(unit)} / par
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-1"
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
                              className="w-3.5 h-3.5 rounded bg-white/10 text-white flex items-center justify-center text-[9px] hover:bg-white/20"
                            >
                              -
                            </button>
                            <span className="text-xs font-mono-sku font-bold text-amber-400">
                              {sq.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, sq.size, sq.quantity + 1)}
                              className="w-3.5 h-3.5 rounded bg-white/10 text-white flex items-center justify-center text-[9px] hover:bg-white/20"
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
                    <span className="font-syne font-bold text-white">{fmt(itemTotalPairs * unit)}</span>
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
                <span className="text-white font-bold">{totalPairs} un</span>
              </div>

              {mode === 'atacado' && (
                <>
                  <div className="flex justify-between text-zinc-400">
                    <span>Valor em Tabela Varejo:</span>
                    <span className="text-zinc-400 line-through">{fmt(totalRetailValue)}</span>
                  </div>
                  {tierDiscountPercent > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Desconto Adicional por Volume ({tierDiscountPercent}%):</span>
                      <span>-{fmt(totalWholesaleValue * (tierDiscountPercent / 100))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                    <span className="font-bold">Lucro Líquido Estimado na Revenda:</span>
                    <span className="font-bold">+{fmt(estimatedProfit)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-base font-syne font-extrabold text-white pt-2 border-t border-white/10">
                <span>Total a Faturar:</span>
                <span className="text-amber-400 text-xl">{fmt(effectiveTotal)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleExportCSV}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-syne font-semibold text-white flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                <span>Exportar CSV</span>
              </button>

              <button
                onClick={handleWhatsAppCheckout}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-syne font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar p/ Concierge</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
