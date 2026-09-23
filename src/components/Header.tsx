import React from 'react';
import { ShieldCheck, Sparkles, SlidersHorizontal, Search, Store, Layers, Sun, Moon } from 'lucide-react';
import { AIModelStatus } from '../types';

interface HeaderProps {
  mode: 'varejo' | 'atacado';
  onToggleMode: (mode: 'varejo' | 'atacado') => void;
  cartCount?: number;
  onOpenCart?: () => void;
  onOpenAdmin: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  aiStatus: AIModelStatus;
  selectedStoreId: string;
  onSelectStore: (id: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
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
  theme,
  onToggleTheme,
}) => {
  const isLight = theme === 'light';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#131314]/92 backdrop-blur-lg border-b border-white/10 shadow-2xl transition-colors duration-300">
      {/* Top micro announcement bar with 3D Depth */}
      <div className="bg-gradient-to-r from-[#171617] via-[#242322] to-[#171617] text-xs py-1.5 px-4 text-center border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono-sku text-[11px] tracking-wider text-zinc-300">
            VAULT STATUS: GRADE DISPONÍVEL • ENVIO BLINDADO PARA TODA A EUROPA
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

          {/* Mode Switcher - Ultra-Crisp High Contrast Segmented Toggle */}
          <div className={`hidden lg:flex items-center p-1 rounded-full border shadow-inner transition-colors ${
            isLight
              ? 'bg-zinc-200/90 border-zinc-300'
              : 'bg-[#0d0c0e] border-white/15 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]'
          } gap-1`}>
            <button
              onClick={() => onToggleMode('varejo')}
              className={`px-4 py-1.5 text-xs rounded-full transition-all flex items-center gap-1.5 active:scale-95 ${
                mode === 'varejo'
                  ? 'bg-gradient-to-r from-zinc-100 to-white text-zinc-950 font-black shadow-[0_2px_10px_rgba(255,255,255,0.25)] border-t border-white'
                  : isLight
                    ? 'text-zinc-700 hover:text-zinc-950 font-semibold hover:bg-black/5'
                    : 'text-zinc-300 hover:text-white font-semibold hover:bg-white/5'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                mode === 'varejo' ? 'bg-zinc-950' : isLight ? 'bg-zinc-400' : 'bg-zinc-400'
              }`} />
              <span>Varejo Prime</span>
            </button>
            <button
              onClick={() => onToggleMode('atacado')}
              className={`px-4 py-1.5 text-xs rounded-full transition-all flex items-center gap-1.5 active:scale-95 ${
                mode === 'atacado'
                  ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-zinc-950 font-black shadow-[0_2px_14px_rgba(245,158,11,0.35)] border-t border-amber-200'
                  : isLight
                    ? 'text-amber-800 hover:text-amber-950 font-bold hover:bg-black/5'
                    : 'text-amber-300 hover:text-amber-200 font-bold hover:bg-white/5'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                mode === 'atacado' ? 'bg-zinc-950' : 'bg-amber-400'
              }`} />
              <span>Atacado B2B</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono-sku font-extrabold ${
                mode === 'atacado'
                  ? 'bg-black/85 text-amber-300 shadow-sm'
                  : isLight
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-amber-400/20 text-amber-300'
              }`}>
                10+ un
              </span>
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

        {/* Right Action Icons: Theme Switcher, Super Admin & Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Mode Toggle (Página Clara / Escura) */}
          <button
            onClick={onToggleTheme}
            className="relative px-3 py-1.5 rounded-full badge-3d-dark hover:border-amber-400/50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 group"
            title={isLight ? 'Alternar para Modo Escuro (Dark Vault)' : 'Alternar para Modo Claro (Página Clara)'}
            aria-label="Alternar página clara ou escura"
          >
            {isLight ? (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-600 transition-transform group-hover:-rotate-12" />
                <span className="hidden sm:inline font-syne text-zinc-700 font-extrabold text-[11px]">Tema Escuro</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400 transition-transform group-hover:rotate-45" />
                <span className="hidden sm:inline font-syne text-zinc-200 font-extrabold text-[11px]">Página Clara</span>
              </>
            )}
          </button>

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
        </div>
      </div>

      {/* Mobile search, theme toggle & mode switcher */}
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
        <div className="flex items-center gap-2">
          <div className={`flex flex-1 p-1 rounded-full border shadow-inner gap-1 ${
            isLight
              ? 'bg-zinc-200/90 border-zinc-300'
              : 'bg-[#0d0c0e] border-white/15 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]'
          }`}>
            <button
              onClick={() => onToggleMode('varejo')}
              className={`flex-1 py-1.5 text-xs rounded-full transition-all flex items-center justify-center gap-1 active:scale-95 ${
                mode === 'varejo'
                  ? 'bg-gradient-to-r from-zinc-100 to-white text-zinc-950 font-black shadow-md border-t border-white'
                  : isLight
                    ? 'text-zinc-700 hover:text-zinc-950 font-semibold'
                    : 'text-zinc-300 hover:text-white font-semibold'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                mode === 'varejo' ? 'bg-zinc-950' : 'bg-zinc-400'
              }`} />
              <span>Varejo</span>
            </button>
            <button
              onClick={() => onToggleMode('atacado')}
              className={`flex-1 py-1.5 text-xs rounded-full transition-all flex items-center justify-center gap-1 active:scale-95 ${
                mode === 'atacado'
                  ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/30 border-t border-amber-200'
                  : isLight
                    ? 'text-amber-800 hover:text-amber-950 font-bold'
                    : 'text-amber-300 hover:text-amber-200 font-bold'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                mode === 'atacado' ? 'bg-zinc-950' : 'bg-amber-400'
              }`} />
              <span>Atacado B2B</span>
            </button>
          </div>

          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-full badge-3d-dark flex items-center justify-center text-xs"
            title="Alternar tema claro/escuro"
          >
            {isLight ? <Moon className="w-4 h-4 text-amber-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
