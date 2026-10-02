import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, ShieldCheck, TrendingUp, Flame, Pencil, X, Check, Upload } from 'lucide-react';
import { loadSlidesFromStorage, saveSlidesToStorage } from '../services/storage';
import { compressUploadedImage } from '../utils/imageProcessor';

export interface Slide {
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

export const INITIAL_SLIDES: Slide[] = [
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
  const [slides, setSlides] = useState<Slide[]>(() => {
    return loadSlidesFromStorage() || INITIAL_SLIDES;
  });
  const [currentSlide, setCurrentSlide] = useState(0);

  // Slide editor modal state
  const [isEditingSlides, setIsEditingSlides] = useState(false);
  const [editSlidesList, setEditSlidesList] = useState<Slide[]>(slides);
  const [activeEditIndex, setActiveEditIndex] = useState(1); // Default to Slide 2 ("segunda imagem do site")
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Sync listener if slides updated from another component
  useEffect(() => {
    const handleSync = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.slides) {
        setSlides(ce.detail.slides);
      }
    };
    window.addEventListener('kicksluxe_slides_sync', handleSync);
    return () => window.removeEventListener('kicksluxe_slides_sync', handleSync);
  }, []);

  const slide = slides[currentSlide] || slides[0] || INITIAL_SLIDES[0];

  const handleOpenEditor = (targetIdx = currentSlide) => {
    setEditSlidesList([...slides]);
    setActiveEditIndex(targetIdx);
    setIsEditingSlides(true);
    setSaveSuccess(false);
  };

  const handleSaveSlides = () => {
    setSlides(editSlidesList);
    saveSlidesToStorage(editSlidesList);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditingSlides(false);
    }, 1200);
  };

  const handleResetSlides = () => {
    setEditSlidesList(INITIAL_SLIDES);
    setSlides(INITIAL_SLIDES);
    saveSlidesToStorage(INITIAL_SLIDES);
    setIsEditingSlides(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, slideIdx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressUploadedImage(file, 1200, 800, 0.85);
    if (compressed) {
      setEditSlidesList((prev) => {
        const updated = [...prev];
        updated[slideIdx] = { ...updated[slideIdx], image: compressed };
        return updated;
      });
    }
  };

  return (
    <div className="hero-carousel-container relative w-full overflow-hidden bg-[#101011] border-b border-white/10 perspective-1000 transition-colors duration-300">
      {/* Background ambient lighting accents */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-zinc-800/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Content Left (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-2.5 md:gap-3 z-10">
            {/* Tag Pill with 3D Bevel & Highlight Shimmer */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-3d-dark w-fit text-[11px] font-mono-sku text-amber-300 highlight-shimmer shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              <span className="tracking-wider uppercase font-semibold">{slide.tag}</span>
            </div>

            {/* Headline with 3D Typography */}
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-syne font-extrabold tracking-tight text-3d-white leading-[1.12]">
                {slide.headline}
              </h1>
              <p className="text-amber-400 font-syne text-xs sm:text-sm md:text-base font-bold tracking-wide text-3d-gold">
                {slide.subheadline}
              </p>
            </div>

            {/* Description */}
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-xl font-jakarta">
              {slide.description}
            </p>

            {/* CTAs & Stats */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onExploreCatalog}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-syne font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-500/20 border-t border-amber-200/60 transition-all flex items-center gap-2 group active:scale-95 cursor-pointer"
              >
                <span className="text-3d-dark font-extrabold">{slide.ctaText}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </button>

              <button
                onClick={onOpenAdmin}
                className="px-4 py-2.5 rounded-full badge-3d-dark hover:border-white/30 text-white font-syne text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-md active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-3d-subtle">{slide.secondaryCtaText}</span>
              </button>
            </div>

            {/* Trust Metrics Pill with 3D Depth */}
            <div className="flex items-center gap-4 sm:gap-6 pt-3 border-t border-white/10 mt-1">
              <div>
                <div className="text-xl md:text-2xl font-jakarta font-extrabold text-amber-400 tracking-tight tabular-nums">
                  {slide.statNumber}
                </div>
                <div className="text-[10px] font-mono-sku text-zinc-400">
                  {slide.statLabel}
                </div>
              </div>
              <div className="h-7 w-px bg-white/10"></div>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                <span>Laudo Físico 1:1 e NF Emitida</span>
              </div>
              <div className="h-7 w-px bg-white/10 hidden sm:block"></div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
                <TrendingUp className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
                <span>Atacado Mínimo 10 Pares</span>
              </div>
            </div>
          </div>

          {/* Image Showcase Right (5 cols) with 3D Perspective & Floating Elements */}
          <div className="lg:col-span-5 relative flex items-center justify-center perspective-1000">
            {/* Visual Glass Frame with 3D Zoom Preview & Highlight Shimmer */}
            <div className="relative w-full max-w-sm h-64 sm:h-72 md:h-80 rounded-2xl overflow-hidden border border-white/20 bg-gradient-to-br from-[#212022] to-[#121213] shadow-2xl group highlight-glow-ribbon highlight-shimmer transition-transform duration-500 hover:rotate-1 hover:-translate-y-1">
              <img
                src={slide.image}
                alt={slide.headline}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-105 filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]"
              />

              {/* 3D Floating Badge */}
              <div className="absolute top-3.5 right-3.5 badge-3d-gold px-3 py-1 rounded-full flex items-center gap-1.5 text-[11px] text-amber-200 font-mono-sku shadow-xl translate-z-30">
                <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
                <span className="font-bold tracking-wider">ORIGINAL GRADE B2B</span>
              </div>

              {/* Bottom Subtle Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-end justify-between translate-z-20">
                <div>
                  <span className="text-[10px] font-mono-sku text-amber-400/90 uppercase tracking-widest font-bold">COFRE ATIVO</span>
                  <p className="text-white font-syne font-bold text-xs sm:text-sm text-3d-white">Disponível para Envio Imediato</p>
                </div>
                <span className="text-[11px] font-mono-sku text-amber-300 badge-3d-gold px-2 py-0.5 rounded font-bold">
                  REF #KL-VAULT
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Indicators & Controls */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentSlide
                    ? 'w-7 h-1.5 bg-gradient-to-r from-amber-400 to-amber-300 shadow-md shadow-amber-400/50'
                    : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleOpenEditor(currentSlide)}
              className="px-2.5 py-1 rounded-full badge-3d-dark hover:border-amber-400/50 text-[11px] font-mono-sku text-amber-300 flex items-center gap-1 transition-all active:scale-95 cursor-pointer mr-1"
              title="Editar imagens e fotos dos banners do site"
            >
              <Pencil className="w-3 h-3 text-amber-400" />
              <span>Editar Banners</span>
            </button>

            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              className="w-7 h-7 rounded-full badge-3d-dark hover:border-white/30 flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              className="w-7 h-7 rounded-full badge-3d-dark hover:border-white/30 flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer"
              aria-label="Próximo slide"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Slides Editor Modal */}
      {isEditingSlides && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#1c1b1c] border border-amber-400/30 rounded-3xl p-6 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditingSlides(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Pencil className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-syne font-bold text-lg text-white">Editar Imagens e Textos dos Banners</h3>
                <p className="text-xs text-zinc-400 font-jakarta">
                  Altere a imagem principal, a <strong>segunda imagem que mostra no site</strong> ou qualquer slide do carrossel.
                </p>
              </div>
            </div>

            {/* Slide Selector Tabs */}
            <div className="flex items-center gap-2 mt-4 pb-2 border-b border-white/10">
              {editSlidesList.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setActiveEditIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl font-mono-sku text-xs font-bold transition-all cursor-pointer ${
                    activeEditIndex === idx
                      ? 'bg-amber-400 text-black shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-zinc-300'
                  }`}
                >
                  Slide {idx + 1} {idx === 1 ? '(2ª Imagem do Site)' : ''}
                </button>
              ))}
            </div>

            {/* Active Slide Form */}
            {editSlidesList[activeEditIndex] && (
              <div className="mt-4 space-y-4 font-jakarta text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div className="sm:col-span-1">
                    <span className="text-[10px] font-mono-sku text-zinc-400 block mb-1">Preview Atual:</span>
                    <div className="w-full h-32 rounded-xl bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center p-2">
                      <img
                        src={editSlidesList[activeEditIndex].image}
                        alt="Slide Preview"
                        className="w-full h-full object-contain filter drop-shadow"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <div>
                      <label className="text-[10px] font-mono-sku text-amber-300 block mb-1 font-semibold">
                        URL da Imagem do Slide {activeEditIndex + 1} {activeEditIndex === 1 ? '(Segunda Imagem)' : ''}:
                      </label>
                      <input
                        type="text"
                        value={editSlidesList[activeEditIndex].image}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditSlidesList((prev) => {
                            const updated = [...prev];
                            updated[activeEditIndex] = { ...updated[activeEditIndex], image: val };
                            return updated;
                          });
                        }}
                        placeholder="https://exemplo.com/imagem.png"
                        className="w-full bg-[#121113] border border-amber-400/40 rounded-xl px-3 py-2 text-white font-mono-sku text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 cursor-pointer transition-colors text-[11px]">
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Carregar do Computador</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, activeEditIndex)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono-sku text-zinc-300 block mb-1 font-semibold">Tag do Topo</label>
                    <input
                      type="text"
                      value={editSlidesList[activeEditIndex].tag}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditSlidesList((prev) => {
                          const updated = [...prev];
                          updated[activeEditIndex] = { ...updated[activeEditIndex], tag: val };
                          return updated;
                        });
                      }}
                      className="w-full bg-[#121113] border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono-sku text-zinc-300 block mb-1 font-semibold">Destaque Métrico</label>
                    <input
                      type="text"
                      value={editSlidesList[activeEditIndex].statNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditSlidesList((prev) => {
                          const updated = [...prev];
                          updated[activeEditIndex] = { ...updated[activeEditIndex], statNumber: val };
                          return updated;
                        });
                      }}
                      className="w-full bg-[#121113] border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono-sku text-zinc-300 block mb-1 font-semibold">Título Principal</label>
                  <input
                    type="text"
                    value={editSlidesList[activeEditIndex].headline}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditSlidesList((prev) => {
                        const updated = [...prev];
                        updated[activeEditIndex] = { ...updated[activeEditIndex], headline: val };
                        return updated;
                      });
                    }}
                    className="w-full bg-[#121113] border border-white/15 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono-sku text-zinc-300 block mb-1 font-semibold">Subtítulo</label>
                  <input
                    type="text"
                    value={editSlidesList[activeEditIndex].subheadline}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditSlidesList((prev) => {
                        const updated = [...prev];
                        updated[activeEditIndex] = { ...updated[activeEditIndex], subheadline: val };
                        return updated;
                      });
                    }}
                    className="w-full bg-[#121113] border border-white/15 rounded-xl px-3 py-2 text-amber-300 text-xs font-semibold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono-sku text-zinc-300 block mb-1 font-semibold">Descrição</label>
                  <textarea
                    rows={2}
                    value={editSlidesList[activeEditIndex].description}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditSlidesList((prev) => {
                        const updated = [...prev];
                        updated[activeEditIndex] = { ...updated[activeEditIndex], description: val };
                        return updated;
                      });
                    }}
                    className="w-full bg-[#121113] border border-white/15 rounded-xl px-3 py-2 text-zinc-300 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleResetSlides}
                className="px-3 py-2 text-xs font-mono-sku text-zinc-400 hover:text-red-400 transition-colors"
              >
                Restaurar Padrão
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingSlides(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveSlides}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-syne font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Salvo com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Salvar Alterações do Banner</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
