import React from 'react';
import { ShieldCheck, Sparkles, Lock, ArrowUpRight, Store } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  return (
    <footer className="w-full bg-[#0d0c0d] border-t border-white/10 text-zinc-400 font-jakarta text-xs transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="font-syne font-extrabold text-2xl text-white tracking-wider">
                KICKS<span className="text-amber-400 font-light">LUXE</span>
              </span>
              <span className="text-[10px] font-mono-sku px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                VAULT
              </span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-xs">
              Ecossistema exclusivo de revenda e atacado de sneakers raros e silhuetas de alta estirpe com autenticação pericial 1:1 e nota fiscal emitida.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 font-mono-sku text-[11px] pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>COFRE BLINDADO • ENVIO PARA TODA A EUROPA</span>
            </div>
          </div>

          {/* Col 2: Atacado & B2B */}
          <div className="space-y-2">
            <h4 className="font-syne font-bold text-white text-sm mb-3">ATACADO & BOUTIQUES</h4>
            <ul className="space-y-2 text-zinc-400">
              <li><a href="#" className="hover:text-amber-400 transition-colors">Tabela de Grade Fechada</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Condições de Faturamento B2B</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Homologação de Lojas Parceiras</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Seguro e Despacho Expresso 24h</a></li>
            </ul>
          </div>

          {/* Col 3: Categorias em Destaque */}
          <div className="space-y-2">
            <h4 className="font-syne font-bold text-white text-sm mb-3">SILHUETAS PRINCIPAIS</h4>
            <ul className="space-y-2 text-zinc-400">
              <li><a href="#" className="hover:text-amber-400 transition-colors">Air Jordan 4 Retro (UNC, Cement, Black Cat)</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">New Balance 9060 & 2002R Rain Cloud</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Balenciaga 3XL & Couture Runners</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Louis Vuitton Trainer & Virgil Abloh AF1</a></li>
            </ul>
          </div>

          {/* Col 4: Super Admin & IA */}
          <div className="space-y-3">
            <h4 className="font-syne font-bold text-white text-sm mb-3">TECNOLOGIA & VAULT</h4>
            <p className="text-zinc-400 text-xs">
              Mecanismo automatizado de extração de catálogos PDF com IA Multimodal Gemini e DeepSeek.
            </p>
            <button
              onClick={onOpenAdmin}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400/20 to-amber-500/20 border border-amber-400/40 text-amber-300 font-syne font-bold text-xs flex items-center justify-center gap-2 hover:bg-amber-400/30 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Acessar Painel Super Admin</span>
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono-sku text-zinc-400">
          <div>
            © {new Date().getFullYear()} KICKSLUXE VAULT S.A. TODOS OS DIREITOS RESERVADOS. CNPJ 48.912.834/0001-90.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-zinc-400">
              <Lock className="w-3 h-3 text-emerald-400" />
              CONEXÃO TLS 1.3 CRIPTOGRAFADA
            </span>
            <span className="text-zinc-400">TERMOS DE REVISTA B2B</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
