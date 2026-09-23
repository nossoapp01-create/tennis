import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, ShieldCheck, TrendingUp, Flame } from 'lucide-react';

interface Slide {
  id: string;
  tag: string;
  headline: string;
  subheadline: string;
  description: string;
  ctaText: string;
  secondaryCtaText: string;
  image: string;
  statNumber: string;
  statLabel: string;
  accentColor: string;
}

const SLIDES: Slide[] = [
  {
    id: 'slide-1',
    tag: 'DROP 01 // SYNDICATE EXCLUSIVE',
    headline: 'NOVA ERA DO ATACADO DE SNEAKERS DE LUXO',
    subheadline: 'GRADE FECHADA COM MARGEM DE ATÉ 145%',
    description: 'Acesso direto ao cofre com as silhuetas mais procuradas do mundo: Jordan Retro 4, New Balance 9060, Balenciaga, Louis Vuitton e Travis Scott.',
    ctaText: 'Ver Grade de Atacado',
    secondaryCtaText: 'Acessar Extrator IA',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkVxILou8VaTGlKxzIylhGH3VHkLA37a-JYD76ULbndrNn0kH_eemxvwlcrOQ6Xjtvk7bU5f_FIM5NOUQASmij68za9vULbbj2Jx4l7qjHdedr38s8A0exy_X8_yEbDnQG3jASAv1yK9KL-iHiGCSgTIbmrlCtV0srOtVc8-reAYtT8ru4mVMvy9k1MYY_j804rQSbuJtEw_fXtGo1ctCVC1KGKtsQLCxBp_2iRej-uIijYhiYhbtJ',
    statNumber: '+145%',
    statLabel: 'Margem Média no Atacado',
    accentColor: '#d4af37'
  },
  {
    id: 'slide-2',
    tag: 'TECNOLOGIA DE COFRE // AI AGENT',
    headline: 'IMPORTAÇÃO INSTANTÂNEA DE CATÁLOGOS PDF',
    subheadline: 'CADASTRO AUTOMÁTICO DE ESTOQUE COM IA MULTIMODAL',
    description: 'Arraste PDFs de fornecedores ou fotos de pares. Nosso agente extrai modelos, fotos, referências SKU e gera descrições e laudos técnicos em segundos.',
    ctaText: 'Testar Extrator IA',
    secondaryCtaText: 'Explorar Modelos',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB87dTlxJV_WeWaDHyhk8HihDhVE-VZNcasXH50LSG064gF9cH2DOZTah-VQZ4Pe7ecQXfVD-yeWtN5-zzQsMYzajSder98Z3jONQbDWUCl5lEW9JbfF_VDo3MOkYLtxXYYe6dyt5wLjkFmOFbHTOP75QPjGWryv4qc5bRQ11lMX5F0ai_VIW-SjmiWjxcAOZ8eSBNBAHOWJd8hGD-FabB9wOLnOXPJeU_ofdF-JhUf5y58H7svHrcg',
    statNumber: '100%',
    statLabel: 'Autenticação & Laudo 1:1',
    accentColor: '#60a5fa'
  },
  {
    id: 'slide-3',
    tag: 'REDE DE BOUTIQUES // LOJAS PARCEIRAS',
    headline: 'SISTEMA DE CRÉDITO E LOGÍSTICA BLINDADA',
    subheadline: 'SÃO PAULO • RIO DE JANEIRO • CURITIBA • BH',
    description: 'Gestão multi-loja com controle de cotas, limites de crédito para lojistas autorizados e envio expresso com seguro total contra roubo e extravio.',
    ctaText: 'Seja Lojista Autorizado',
    secondaryCtaText: 'Fazer Pedido em Lote',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1Uz7DSNoWkCMsSntjUUayBGvMuMfGjiZh3ZtV3zDJLEWSVwZqPvo92CIgRXGX51uLwl2tdb_IKpytr3hEeSuEgEZ9KYYCBP2TKEQEnTa10UXAulDdxYPw-Xiw9DmBG3t1SKw2Uy4SY8vSamJlsQm551M0NKVtmn3YU_Iiw_RPQzt3IBT4fTNvwnCg0fk6w2z9IG_CHMqA34kzyqimTZ6V3pRU8xy_iNoVTQMkNsQ7MfXZ148D4JjU',
    statNumber: '24h',
    statLabel: 'Despacho Expresso B2B',
    accentColor: '#10b981'
  }
];

interface HeroCarouselProps {
  onOpenAdmin: () => void;
  onExploreCatalog: () => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ onOpenAdmin, onExploreCatalog }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[currentSlide];

  return (
    <div className="hero-carousel-container relative w-full overflow-hidden bg-[#101011] border-b border-white/10 perspective-1000 transition-colors duration-300">
      {/* Background ambient lighting accents */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-zinc-800/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Content Left (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4 z-10">
            {/* Tag Pill with 3D Bevel & Highlight Shimmer */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full badge-3d-dark w-fit text-xs font-mono-sku text-amber-300 highlight-shimmer shadow-lg">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span className="tracking-wider uppercase font-semibold">{slide.tag}</span>
            </div>

            {/* Headline with 3D Typography */}
            <div className="flex flex-col gap-1.5">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-syne font-extrabold tracking-tight text-3d-white leading-[1.08]">
                {slide.headline}
              </h1>
              <p className="text-amber-400 font-syne text-sm sm:text-base md:text-lg font-bold tracking-wide text-3d-gold">
                {slide.subheadline}
              </p>
            </div>

            {/* Description */}
            <p className="text-zinc-300 text-sm md:text-base leading-relaxed max-w-xl font-jakarta">
              {slide.description}
            </p>

            {/* CTAs & Stats */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onExploreCatalog}
                className="px-6 py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-syne font-bold text-sm tracking-wide shadow-xl shadow-amber-500/25 border-t border-amber-200/60 transition-all flex items-center gap-2 group active:scale-95"
              >
                <span className="text-3d-dark font-extrabold">{slide.ctaText}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </button>

              <button
                onClick={onOpenAdmin}
                className="px-5 py-3.5 rounded-full badge-3d-dark hover:border-white/30 text-white font-syne text-sm font-semibold transition-all flex items-center gap-2 shadow-lg active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-3d-subtle">{slide.secondaryCtaText}</span>
              </button>
            </div>

            {/* Trust Metrics Pill with 3D Depth */}
            <div className="flex items-center gap-6 pt-4 border-t border-white/10 mt-2">
              <div>
                <div className="text-2xl md:text-3xl font-syne font-extrabold text-3d-gold tracking-tight">
                  {slide.statNumber}
                </div>
                <div className="text-[11px] font-mono-sku text-zinc-400">
                  {slide.statLabel}
                </div>
              </div>
              <div className="h-8 w-px bg-white/10"></div>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <ShieldCheck className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                <span>Laudo Físico 1:1 e NF Emitida</span>
              </div>
              <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
                <TrendingUp className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
                <span>Atacado Mínimo 10 Pares</span>
              </div>
            </div>
          </div>

          {/* Image Showcase Right (5 cols) with 3D Perspective & Floating Elements */}
          <div className="lg:col-span-5 relative flex items-center justify-center perspective-1000">
            {/* Visual Glass Frame with 3D Zoom Preview & Highlight Shimmer */}
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden border border-white/20 bg-gradient-to-br from-[#212022] to-[#121213] shadow-2xl group highlight-glow-ribbon highlight-shimmer transition-transform duration-500 hover:rotate-1 hover:-translate-y-2">
              <img
                src={slide.image}
                alt={slide.headline}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-110 filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
              />

              {/* 3D Floating Badge */}
              <div className="absolute top-4 right-4 badge-3d-gold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs text-amber-200 font-mono-sku shadow-xl translate-z-30">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="font-bold tracking-wider">ORIGINAL GRADE B2B</span>
              </div>

              {/* Bottom Subtle Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-end justify-between translate-z-20">
                <div>
                  <span className="text-[11px] font-mono-sku text-amber-400/90 uppercase tracking-widest font-bold">COFRE ATIVO</span>
                  <p className="text-white font-syne font-bold text-sm text-3d-white">Disponível para Envio Imediato</p>
                </div>
                <span className="text-xs font-mono-sku text-amber-300 badge-3d-gold px-2.5 py-1 rounded font-bold">
                  REF #KL-VAULT
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Indicators & Controls */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            {SLIDES.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentSlide
                    ? 'w-8 h-2 bg-gradient-to-r from-amber-400 to-amber-300 shadow-lg shadow-amber-400/50'
                    : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
              className="w-8 h-8 rounded-full badge-3d-dark hover:border-white/30 flex items-center justify-center text-white transition-all active:scale-95"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)}
              className="w-8 h-8 rounded-full badge-3d-dark hover:border-white/30 flex items-center justify-center text-white transition-all active:scale-95"
              aria-label="Próximo slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
