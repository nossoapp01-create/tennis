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
    <header className="sticky top-0 z-40 w-full bg-[#131314]/90 backdrop-blur-md border-b border-white/10">
      {/* Top micro announcement bar */}
      <div className="bg-gradient-to-r from-[#1c1b1c] via-[#2a2928] to-[#1c1b1c] text-xs py-1.5 px-4 text-center border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono-sku text-[11px] tracking-wider text-zinc-300">
            VAULT STATUS: GRADE DISPONÍVEL • ENVIO BLINDADO PARA TODO O BRASIL
          </span>
        </div>
        <div className="flex items-center gap-4 text-zinc-400 text-[11px]">
          <span className="hidden md:inline font-mono-sku">ATENDIMENTO CONCIERGE VIP: 0800 LUXE-KICKS</span>
          <div className="flex items-center gap-1.5 text-amber-400 font-medium">
            <Sparkles className="w-3 h-3" />
            <span>IA MULTIMODAL ATIVA</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <a href="#" className="flex flex-col group">
            <div className="flex items-center gap-2">
              <span className="font-syne font-extrabold text-2xl md:text-3xl tracking-wider text-white group-hover:text-amber-400 transition-colors">
                KICKS<span className="text-amber-400 font-light">LUXE</span>
              </span>
              <span className="text-[10px] font-mono-sku px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                VAULT
              </span>
            </div>
            <span className="text-[9px] font-mono-sku tracking-[0.25em] text-zinc-400 uppercase -mt-1">
              HAUTE SNEAKER RESALE & B2B WHOLESALE
            </span>
          </a>

          {/* Mode Switcher: Varejo vs Atacado */}
          <div className="hidden lg:flex items-center bg-[#1c1b1c] p-1 rounded-full border border-white/10 shadow-inner">
            <button
              onClick={() => onToggleMode('varejo')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                mode === 'varejo'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Varejo Prime
            </button>
            <button
              onClick={() => onToggleMode('atacado')}
              className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${
                mode === 'atacado'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-amber-400/80 hover:text-amber-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
              Atacado B2B (10+ un)
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome, marca, silhueta ou SKU (#KL-...)"
            className="w-full bg-[#1c1b1c] border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40 transition-all font-jakarta"
          />
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Super Admin & AI Extractor Quick Button */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c1b1c] border border-amber-400/30 text-amber-300 hover:bg-amber-400/10 hover:border-amber-400 transition-all text-xs font-semibold group shadow-sm"
            title="Acesso Direto ao Super Admin e Extrator IA de PDFs"
          >
            <div className="relative">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span
                className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
                  aiStatus.geminiConnected ? 'bg-emerald-400 ring-2 ring-emerald-400/20' : 'bg-amber-500'
                }`}
              ></span>
            </div>
            <span className="hidden sm:inline font-syne tracking-wide">SUPER ADMIN IA</span>
            <span className="sm:hidden font-syne">ADMIN</span>
          </button>

          {/* Cart & B2B Manifest Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-black hover:bg-zinc-200 transition-all text-xs font-bold shadow-md"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">
              {mode === 'atacado' ? 'Manifesto B2B' : 'Carrinho'}
            </span>
            {cartCount > 0 && (
              <span className="bg-amber-500 text-black font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center -mr-1">
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
            className="w-full bg-[#1c1b1c] border border-white/10 rounded-full pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>
        <div className="flex w-full bg-[#1c1b1c] p-0.5 rounded-full border border-white/10">
          <button
            onClick={() => onToggleMode('varejo')}
            className={`flex-1 py-1 text-xs font-semibold rounded-full ${
              mode === 'varejo' ? 'bg-white text-black' : 'text-zinc-400'
            }`}
          >
            Varejo
          </button>
          <button
            onClick={() => onToggleMode('atacado')}
            className={`flex-1 py-1 text-xs font-bold rounded-full ${
              mode === 'atacado' ? 'bg-amber-400 text-black' : 'text-amber-400'
            }`}
          >
            Atacado B2B
          </button>
        </div>
      </div>
    </header>
  );
};
