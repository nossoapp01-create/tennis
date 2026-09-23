import React from 'react';
import { ShieldCheck, Sparkles, ShoppingBag, SlidersHorizontal, Search, Store, Layers } from 'lucide-react';
import { AIModelStatus } from '../types';

interface HeaderProps {
  mode: 'varejo' | 'atacado';
  onToggleMode: (mode: 'varejo' | 'atacado') => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  aiStatus: AIModelStatus;
  selectedStoreId: string;
  onSelectStore: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onToggleMode,
  cartCount,
  onOpenCart,
  onOpenAdmin,
  searchQuery,
  onSearchChange,
  aiStatus,
  selectedStoreId,
  onSelectStore,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#131314]/92 backdrop-blur-lg border-b border-white/10 shadow-2xl">
      {/* Top micro announcement bar with 3D Depth */}
      <div className="bg-gradient-to-r from-[#171617] via-[#242322] to-[#171617] text-xs py-1.5 px-4 text-center border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono-sku text-[11px] tracking-wider text-zinc-300">
            VAULT STATUS: GRADE DISPONÍVEL • ENVIO BLINDADO PARA TODO O BRASIL
          </span>
        </div>
        <div className="flex items-center gap-4 text-zinc-400 text-[11px]">
          <span className="hidden md:inline font-mono-sku">ATENDIMENTO CONCIERGE VIP: 0800 LUXE-KICKS</span>
          <div className="flex items-center gap-1.5 text-amber-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="font-mono-sku font-semibold text-3d-subtle">IA MULTIMODAL ATIVA</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Logo and Brand with 3D Typography */}
        <div className="flex items-center gap-6">
          <a href="#" className="flex flex-col group">
            <div className="flex items-center gap-2">
              <span className="font-syne font-extrabold text-2xl md:text-3xl tracking-wider text-3d-white group-hover:text-amber-400 transition-colors">
                KICKS<span className="text-3d-gold font-light">LUXE</span>
              </span>
              <span className="text-[10px] font-mono-sku px-2 py-0.5 rounded badge-3d-gold text-amber-200 font-bold tracking-widest highlight-shimmer">
                VAULT
              </span>
            </div>
            <span className="text-[9px] font-mono-sku tracking-[0.25em] text-zinc-400 uppercase -mt-1 font-semibold">
              HAUTE SNEAKER RESALE & B2B WHOLESALE
            </span>
          </a>

          {/* Mode Switcher with 3D Bevels */}
          <div className="hidden lg:flex items-center bg-[#171618] p-1 rounded-full border border-white/10 shadow-inner">
            <button
              onClick={() => onToggleMode('varejo')}
              className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all active:scale-95 ${
                mode === 'varejo'
                  ? 'bg-gradient-to-r from-zinc-100 to-white text-black shadow-md font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Varejo Prime
            </button>
            <button
              onClick={() => onToggleMode('atacado')}
              className={`px-4 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 active:scale-95 ${
                mode === 'atacado'
                  ? 'badge-3d-gold text-black shadow-lg shadow-amber-500/20'
                  : 'text-amber-400/80 hover:text-amber-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
              <span>Atacado B2B (10+ un)</span>
            </button>
          </div>
        </div>

        {/* Search Bar with 3D Inset */}
        <div className="hidden md:flex flex-1 max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar modelo, marca, cor ou código SKU..."
            className="w-full bg-[#181719] border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 shadow-inner transition-all"
          />
        </div>

        {/* Right Action Icons: Super Admin & Cart */}
        <div className="flex items-center gap-3">
          {/* Super Admin Modal Trigger with Highlight Shimmer */}
          <button
            onClick={onOpenAdmin}
            className="relative px-3.5 py-1.5 rounded-full badge-3d-dark hover:border-amber-400/40 text-xs font-bold text-amber-300 flex items-center gap-2 transition-all highlight-shimmer shadow-lg active:scale-95"
            title="Acessar painel do Super Admin com Extrator IA e Gestão de Lojas"
          >
            <div className="relative">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span
                className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                  aiStatus.geminiConnected || aiStatus.deepseekConnected
                    ? 'bg-emerald-400'
                    : 'bg-amber-400 animate-ping'
                }`}
              ></span>
            </div>
            <span className="hidden sm:inline font-syne tracking-wide text-3d-subtle">SUPER ADMIN IA</span>
            <span className="sm:hidden font-syne">ADMIN</span>
          </button>

          {/* Cart & B2B Manifest Button with 3D Pop */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-white via-zinc-100 to-zinc-200 text-black hover:from-zinc-100 hover:to-white transition-all text-xs font-bold shadow-xl border-t border-white active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline font-syne font-bold">
              {mode === 'atacado' ? 'Manifesto B2B' : 'Carrinho'}
            </span>
            {cartCount > 0 && (
              <span className="badge-3d-gold text-black font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center -mr-1 shadow-md">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile search & mode toggle */}
      <div className="md:hidden px-4 pb-3 flex flex-col gap-2">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar modelo ou SKU..."
            className="w-full bg-[#181719] border border-white/10 rounded-full pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>
        <div className="flex w-full bg-[#181719] p-0.5 rounded-full border border-white/10">
          <button
            onClick={() => onToggleMode('varejo')}
            className={`flex-1 py-1 text-xs font-semibold rounded-full ${
              mode === 'varejo' ? 'bg-white text-black font-bold shadow' : 'text-zinc-400'
            }`}
          >
            Varejo
          </button>
          <button
            onClick={() => onToggleMode('atacado')}
            className={`flex-1 py-1 text-xs font-bold rounded-full ${
              mode === 'atacado' ? 'badge-3d-gold text-black shadow' : 'text-amber-400'
            }`}
          >
            Atacado B2B
          </button>
        </div>
      </div>
    </header>
  );
};
