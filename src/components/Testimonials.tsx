import React from 'react';
import { Star, ShieldCheck, Quote, Store, Award } from 'lucide-react';

interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  location: string;
  image: string;
  rating: number;
  highlight: string;
  quote: string;
  purchasedVolume: string;
  averageMargin: string;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'test-1',
    name: 'Rodrigo Alencar',
    role: 'Sócio & Diretor de Compras',
    location: 'Concept Store Jardins • São Paulo, SP',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCp_gog1pCDnxG5g4VCMek0fT8zYMl6iNt9h_d2riCIVTJwsUj5UsuomUJasg4oKeawTW6-T_ZhxQl-xsOEIMN14ljym7EaOGf3E78l3CSKfbJlqTiUHOi4m7hC-8dtmsKz2bGyI-4eF2zvyYxGwpVHgc4HRLvN-Ex_FqtSLul8Xv_ArqUKxdzQXxp-YMyXN1jDJGD-dTaHUf7QgpCf3cKYgo4LUCwnvw0oIbrdV5mwCruD02n89jBb',
    rating: 5,
    highlight: 'Giro semanal acelerado e margem real de 135%',
    quote: 'A consistência das grades de Jordan 4 e Balenciaga da KicksLuxe é surreal. Compramos em lotes de 40 a 60 pares todo mês e o esgotamento no balcão acontece em menos de 10 dias. O laudo de autenticidade 1:1 e as notas fiscais emitidas trazem total segurança jurídica para nossa operação.',
    purchasedVolume: '480+ pares faturados',
    averageMargin: '135% de lucro bruto'
  },
  {
    id: 'test-2',
    name: 'Camila Silveira',
    role: 'Fundadora & Curadora de Estilo',
    location: 'Atelier Silveira • Leblon, Rio de Janeiro, RJ',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDD5gUsRPVjOZhHKPG0LE-Xhm9AKrb0SGSF_NrgmpByiLAKxwa7m_SdmsHYjF43D4rJ44ecDE_qM9-H-7TOgSxaCjHX9Qwl9e-khTn2ZPJw28CJEWQWYJvoVXpdT4FqMN_6xqoktj1oaRAKK11cliC12q7SItg1zwqE0jusadDQQUYjhiwvYa1ehLGfM1QMU_HgOQ8uPSmd0CpAliwrrid9x3KKz_0a8Ks8UfMUyWs0Y1YMHCopjCtM',
    rating: 5,
    highlight: 'Abastecimento impecável e entrega blindada em 24h',
    quote: 'Nossa clientela na Zona Sul do Rio é extremamente exigente quanto ao acabamento das peças e procedência. O suporte de crédito B2B e a qualidade dos modelos como o LV Trainer e New Balance 9060 colocaram nosso atelier em outro patamar de faturamento no varejo de luxo.',
    purchasedVolume: '320+ pares faturados',
    averageMargin: '142% de lucro bruto'
  },
  {
    id: 'test-3',
    name: 'Guilherme Fontes',
    role: 'Head de Operações & Sneaker Vault',
    location: 'Batel Vault Kicks • Curitiba, PR',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZ1HyQNYg2Hteo1tsK2JQcDa4XaB9Fg2QpUCzu6WmengoUi84rwHQJnbF7L-fGYxwomAwRB6chQ6WJw6eMZe_tHDFDOhnHt-aA_-KlUvgtozYD_AdtL8sKuk-Q766FZZHF9BDxJxWpM4XliQvl-PqBerwV7aJk-sO_3xEIwZj4fPOZliFibEXgGJRw6s4tr6SicJiWjC0mQt1CS65rv9-ag4MQYhoCEFPoGsRopeeZ1wAIg6a61A8q',
    rating: 5,
    highlight: 'O Extrator de PDF com IA economizou 3 semanas de trabalho',
    quote: 'Quando recebemos os catálogos imensos de mais de 80 páginas em PDF de lotes fechados, o Agente de IA do Super Admin extraiu todas as fotos, SKU e já estruturou nossa grade completa com preços em minutos. Nunca vi nada parecido no ecossistema de revenda no Brasil.',
    purchasedVolume: '620+ pares faturados',
    averageMargin: '128% de lucro bruto'
  }
];

export const Testimonials: React.FC = () => {
  return (
    <section className="testimonials-section w-full bg-[#121112] py-16 px-4 sm:px-6 lg:px-8 border-t border-b border-white/10 relative overflow-hidden transition-colors duration-300">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono-sku text-amber-400 mb-3">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>REDE DE REVENDEDORES HOMOLOGADOS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-syne font-extrabold text-white tracking-tight">
            DEPOIMENTOS DE PARCEIROS & LOJISTAS B2B
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-2 font-jakarta">
            Conheça as histórias reais de boutiques e revendedores que escalaram seu faturamento com nossa infraestrutura de atacado e IA.
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.id}
              className="vault-card rounded-2xl p-6 flex flex-col justify-between relative group hover:border-amber-400/40"
            >
              <div>
                {/* Rating & Highlight */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono-sku px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    VERIFICADO B2B
                  </span>
                </div>

                {/* Highlight Title */}
                <h4 className="text-sm font-syne font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                  "{item.highlight}"
                </h4>

                {/* Quote Content */}
                <p className="text-xs text-zinc-300 font-jakarta leading-relaxed italic">
                  "{item.quote}"
                </p>
              </div>

              {/* Author & Metrics */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-full object-cover border border-amber-400/40"
                  />
                  <div>
                    <h5 className="text-xs font-syne font-bold text-white">{item.name}</h5>
                    <p className="text-[11px] text-zinc-400 font-jakarta">{item.role}</p>
                    <p className="text-[10px] text-amber-400/80 font-mono-sku flex items-center gap-1 mt-0.5">
                      <Store className="w-2.5 h-2.5" />
                      {item.location}
                    </p>
                  </div>
                </div>

                {/* Metrics Pill */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[10px] font-mono-sku bg-black/40 p-2 rounded-lg border border-white/5">
                  <div>
                    <span className="text-zinc-500 block">VOLUME COMPRADO</span>
                    <span className="text-zinc-200 font-bold">{item.purchasedVolume}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">MARGEM MÉDIA</span>
                    <span className="text-emerald-400 font-bold">{item.averageMargin}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
