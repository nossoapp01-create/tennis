import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layers,
  Sparkles,
  Search,
  Filter,
  ArrowUpDown,
  ShoppingBag,
  Store,
  CheckCircle2,
  TrendingUp,
  PackageCheck,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { Header } from './components/Header';
import { HeroCarousel } from './components/HeroCarousel';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { Testimonials } from './components/Testimonials';
import { B2BCartDrawer } from './components/B2BCartDrawer';
import { SuperAdminModal } from './components/admin/SuperAdminModal';
import { Footer } from './components/Footer';
import { AmbientBackground } from './components/AmbientBackground';

import { INITIAL_PRODUCTS } from './data/initialProducts';
import { INITIAL_PARTNER_STORES } from './data/partnerStores';
import { SneakerProduct, CartItem, SizeQuantity, PartnerStore, AIModelStatus } from './types';
import {
  saveProductsToStorage,
  loadProductsFromStorage,
  saveStoresToStorage,
  loadStoresFromStorage,
  saveCartToStorage,
  loadCartFromStorage,
} from './services/storage';

export default function App() {
  // Mode: Varejo vs Atacado (10+ un)
  const [mode, setMode] = useState<'varejo' | 'atacado'>('atacado');

  // Products state (persisted or preloaded)
  const [products, setProducts] = useState<SneakerProduct[]>(() => {
    const saved = localStorage.getItem('kicksluxe_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_PRODUCTS;
  });

  // Partner stores state
  const [partnerStores, setPartnerStores] = useState<PartnerStore[]>(() => {
    const saved = localStorage.getItem('kicksluxe_stores');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_PARTNER_STORES;
  });

  // Cart / B2B Manifest state
  const [cart, setCart] = useState<CartItem[]>(() => {
    return loadCartFromStorage();
  });

  // Load larger catalog from IndexedDB on mount if available
  useEffect(() => {
    let isMounted = true;
    loadProductsFromStorage().then((saved) => {
      if (isMounted && saved && saved.length > 0) {
        if (saved.length < INITIAL_PRODUCTS.length) {
          const existingIds = new Set(saved.map((p) => p.id));
          const missing = INITIAL_PRODUCTS.filter((p) => !existingIds.has(p.id));
          setProducts([...saved, ...missing]);
        } else {
          setProducts(saved);
        }
      }
    });
    loadStoresFromStorage().then((savedStores) => {
      if (isMounted && savedStores && savedStores.length > 0) {
        setPartnerStores(savedStores);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Selected sneakers for multi-selection ordering
  const [bulkSelectedProductIds, setBulkSelectedProductIds] = useState<string[]>([]);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [selectedBrand, setSelectedBrand] = useState<string>('TODAS');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'price_asc' | 'price_desc' | 'margin_desc' | 'newest'>('popular');

  // Modals state
  const [detailProduct, setDetailProduct] = useState<SneakerProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Theme state: 'dark' (default vault) or 'light' (página clara)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('kicksluxe_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    localStorage.setItem('kicksluxe_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('theme-dark');
    } else {
      document.documentElement.classList.remove('theme-light');
      document.documentElement.classList.add('theme-dark');
    }
  }, [theme]);

  // AI Connection Status
  const [aiStatus, setAiStatus] = useState<AIModelStatus>({
    geminiConnected: true,
    geminiLatencyMs: 140,
    deepseekConnected: false,
    activeProvider: 'gemini',
  });

  const catalogRef = useRef<HTMLDivElement>(null);

  // Persist state changes safely via storage service (IndexedDB + safe localStorage backup)
  useEffect(() => {
    saveProductsToStorage(products);
  }, [products]);

  useEffect(() => {
    saveStoresToStorage(partnerStores);
  }, [partnerStores]);

  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  // Check live AI status from backend
  const checkAIStatus = async () => {
    try {
      const res = await fetch('/api/ai/status');
      if (res.ok) {
        const data = await res.json();
        setAiStatus({
          geminiConnected: data.gemini?.connected ?? true,
          geminiLatencyMs: data.gemini?.latencyMs ?? 180,
          deepseekConnected: data.deepseek?.configured ?? false,
          activeProvider: 'gemini',
        });
      }
    } catch {
      // Fallback
      setAiStatus((prev) => ({ ...prev, geminiConnected: true }));
    }
  };

  useEffect(() => {
    checkAIStatus();
  }, []);

  // Filter categories and brands
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['TODOS', ...Array.from(set)];
  }, [products]);

  const allBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.brand));
    return ['TODAS', ...Array.from(set)];
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          searchQuery === '' ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
          selectedCategory === 'TODOS' ||
          p.category.toLowerCase() === selectedCategory.toLowerCase();

        const matchesBrand =
          selectedBrand === 'TODAS' ||
          p.brand.toLowerCase() === selectedBrand.toLowerCase();

        const matchesStore =
          selectedStoreId === 'all' || p.storeId === selectedStoreId;

        return matchesSearch && matchesCategory && matchesBrand && matchesStore;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') {
          const priceA = mode === 'atacado' ? a.wholesalePrice : a.retailPrice;
          const priceB = mode === 'atacado' ? b.wholesalePrice : b.retailPrice;
          return priceA - priceB;
        }
        if (sortBy === 'price_desc') {
          const priceA = mode === 'atacado' ? a.wholesalePrice : a.retailPrice;
          const priceB = mode === 'atacado' ? b.wholesalePrice : b.retailPrice;
          return priceB - priceA;
        }
        if (sortBy === 'margin_desc') {
          return b.profitMarginPct - a.profitMarginPct;
        }
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0; // default popular
      });
  }, [products, searchQuery, selectedCategory, selectedBrand, selectedStoreId, sortBy, mode]);

  // Cart helpers
  const handleAddToCart = (
    product: SneakerProduct,
    orderMode: 'varejo' | 'atacado',
    sizeQuantities: SizeQuantity[]
  ) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id);
      const unit = orderMode === 'atacado' ? product.wholesalePrice : product.retailPrice;

      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        // Merge sizes
        const mergedMap: Record<number, number> = {};
        existing.sizeQuantities.forEach((sq) => {
          mergedMap[sq.size] = (mergedMap[sq.size] || 0) + sq.quantity;
        });
        sizeQuantities.forEach((sq) => {
          mergedMap[sq.size] = (mergedMap[sq.size] || 0) + sq.quantity;
        });

        const newSizes: SizeQuantity[] = Object.entries(mergedMap).map(([s, q]) => ({
          size: parseInt(s),
          quantity: q,
        }));

        const updated = [...prev];
        updated[existingIdx] = {
          ...existing,
          mode: orderMode,
          sizeQuantities: newSizes,
          unitPrice: unit,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            mode: orderMode,
            sizeQuantities,
            unitPrice: unit,
          },
        ];
      }
    });
  };

  const handleUpdateCartQuantity = (productId: string, size: number, newQty: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const updatedSizes = item.sizeQuantities
              .map((sq) => (sq.size === size ? { ...sq, quantity: Math.max(0, newQty) } : sq))
              .filter((sq) => sq.quantity > 0);

            return { ...item, sizeQuantities: updatedSizes };
          }
          return item;
        })
        .filter((item) => item.sizeQuantities.length > 0);
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Multi-item bulk selection helpers
  const handleToggleBulkSelect = (product: SneakerProduct) => {
    setBulkSelectedProductIds((prev) =>
      prev.includes(product.id) ? prev.filter((id) => id !== product.id) : [...prev, product.id]
    );
  };

  // Add all bulk selected to cart at once
  const handleAddAllSelectedToCart = () => {
    const selectedProds = products.filter((p) => bulkSelectedProductIds.includes(p.id));
    if (selectedProds.length === 0) return;

    selectedProds.forEach((prod) => {
      // Default 2 pairs per popular sizes for atacado, or 1 pair for varejo
      const defaultSizes: SizeQuantity[] = prod.sizes.slice(1, 6).map((s) => ({
        size: s,
        quantity: mode === 'atacado' ? 2 : 1,
      }));
      handleAddToCart(prod, mode, defaultSizes);
    });

    setBulkSelectedProductIds([]);
    setIsCartOpen(true);
  };

  // Partner stores handlers
  const handleUpdateStoreStatus = (
    storeId: string,
    newStatus: 'authorized' | 'pending_review' | 'suspended'
  ) => {
    setPartnerStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, status: newStatus } : s))
    );
  };

  const handleAddStore = (newStore: PartnerStore) => {
    setPartnerStores((prev) => [newStore, ...prev]);
  };

  const handleUpdateCreditLimit = (storeId: string, newLimit: number) => {
    setPartnerStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, creditLimit: newLimit } : s))
    );
  };

  // Products management handlers
  const handlePublishExtractedCandidates = (newProducts: SneakerProduct[]) => {
    if (!newProducts || newProducts.length === 0) return;
    setProducts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const existingSkus = new Set(prev.map((p) => (p.sku || '').toLowerCase().trim()));
      const uniqueNew = newProducts.filter(
        (p) => !existingIds.has(p.id) && (!p.sku || !existingSkus.has(p.sku.toLowerCase().trim()))
      );
      return [...uniqueNew, ...prev];
    });
  };

  const handleAddManualProduct = (newProduct: SneakerProduct) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleBulkUpdateProducts = (updatedProducts: SneakerProduct[]) => {
    if (!updatedProducts || updatedProducts.length === 0) return;
    setProducts((prev) => {
      const updateMap = new Map(updatedProducts.map((p) => [p.id, p]));
      return prev.map((p) => updateMap.get(p.id) || p);
    });
  };

  const handleImportCatalog = (imported: SneakerProduct[], mode: 'merge' | 'replace' = 'replace') => {
    if (!imported || imported.length === 0) return;
    if (mode === 'replace') {
      setProducts(imported);
    } else {
      setProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const unique = imported.filter((p) => !existingIds.has(p.id));
        return [...unique, ...prev];
      });
    }
  };

  // Total cart items count
  const cartPairsCount = cart.reduce((acc, item) => {
    return acc + item.sizeQuantities.reduce((sAcc, sq) => sAcc + sq.quantity, 0);
  }, 0);

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'theme-light bg-[#f7f7f9] text-[#18181b]' : 'theme-dark bg-[#131314] text-[#e5e2e3]'} flex flex-col font-jakarta relative overflow-x-hidden transition-colors duration-300`}>
      {/* Subtle Ambient Background Vault Glow (Leve brilho atmosférico de fundo de tela) */}
      <AmbientBackground theme={theme} />

      {/* Header */}
      <Header
        mode={mode}
        onToggleMode={setMode}
        cartCount={cartPairsCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        aiStatus={aiStatus}
        selectedStoreId={selectedStoreId}
        onSelectStore={setSelectedStoreId}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Hero Carousel */}
      <HeroCarousel
        onOpenAdmin={() => setIsAdminOpen(true)}
        onExploreCatalog={scrollToCatalog}
      />

      {/* Main Catalog Section */}
      <main ref={catalogRef} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {/* Section Heading & Mode Callout */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-sku text-amber-400 tracking-widest uppercase font-bold text-3d-subtle">
                ACERVO OFICIAL // CATALOG VAULT
              </span>
              <span className="text-[10px] font-mono-sku px-2.5 py-0.5 rounded-full badge-3d-gold text-amber-200 font-bold highlight-shimmer">
                {filteredProducts.length} MODELOS
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-syne font-extrabold text-white tracking-tight mt-1 text-3d-white">
              {mode === 'atacado'
                ? 'Grade Fechada & Lotes para Revenda de Luxo'
                : 'Catálogo de Sneakers Exclusivos no Varejo'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl font-jakarta">
              {mode === 'atacado'
                ? 'Preços diferenciados para pedidos a partir de 10 pares com margens entre 110% a 155% e nota fiscal emitida.'
                : 'Pares autênticos com laudo pericial 1:1, entrega blindada e garantia de procedência.'}
            </p>
          </div>

          {/* Wholesale Mode Tier Summary Pill */}
          {mode === 'atacado' && (
            <div className="badge-3d-dark highlight-glow-ribbon rounded-2xl p-3.5 flex items-center gap-4 text-xs font-mono-sku shadow-xl">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400 animate-pulse" />
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase">TABELA DE ATACADO</span>
                  <span className="text-white font-bold text-3d-subtle">10+ Pares Ativado</span>
                </div>
              </div>
              <div className="h-7 w-px bg-white/10"></div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase">MARGEM MÉDIA</span>
                <span className="text-emerald-400 font-extrabold text-3d-subtle">+135% Bruto</span>
              </div>
            </div>
          )}
        </div>

        {/* Filter and Category Navigation */}
        <div className="space-y-4 mb-8">
          {/* Category Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-syne font-bold transition-all whitespace-nowrap active:scale-95 ${
                  selectedCategory === cat
                    ? 'badge-3d-gold text-black shadow-lg scale-105'
                    : 'badge-3d-dark text-zinc-300 hover:text-white hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Secondary Controls: Brand, Store, Sort, and Search */}
          <div className="catalog-filter-bar bg-[#181718] p-3 sm:p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs transition-colors">
            {/* Left: Brand & Store Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-zinc-300">
                <span className="text-zinc-400 text-[11px] font-mono-sku">Marca:</span>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  {allBrands.map((b) => (
                    <option key={b} value={b} className="bg-[#1c1b1c] text-white">
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-zinc-300">
                <span className="text-zinc-400 text-[11px] font-mono-sku">Estoque:</span>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all" className="bg-[#1c1b1c] text-white">
                    Todas as Unidades
                  </option>
                  {partnerStores.map((st) => (
                    <option key={st.id} value={st.id} className="bg-[#1c1b1c] text-white">
                      {st.name} ({st.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right: Sorting Selector */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-zinc-300">
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-zinc-400 text-[11px] font-mono-sku">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="popular" className="bg-[#1c1b1c] text-white">
                    Mais Populares
                  </option>
                  <option value="price_asc" className="bg-[#1c1b1c] text-white">
                    Menor Preço
                  </option>
                  <option value="price_desc" className="bg-[#1c1b1c] text-white">
                    Maior Preço
                  </option>
                  <option value="margin_desc" className="bg-[#1c1b1c] text-white">
                    Maior Margem de Lucro B2B
                  </option>
                  <option value="newest" className="bg-[#1c1b1c] text-white">
                    Mais Recentes
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Selection Sticky Bar (Para quando fizer o pedido escolher vários ao mesmo tempo) */}
        {bulkSelectedProductIds.length > 0 && (
          <div className="sticky top-20 z-30 mb-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-black text-amber-400 font-extrabold text-xs flex items-center justify-center">
                {bulkSelectedProductIds.length}
              </span>
              <div>
                <span className="font-syne font-extrabold text-sm sm:text-base">
                  {bulkSelectedProductIds.length === 1
                    ? '1 Modelo Selecionado para Pedido Simultâneo'
                    : `${bulkSelectedProductIds.length} Modelos Selecionados para Pedido Simultâneo`}
                </span>
                <p className="text-[11px] font-mono-sku font-semibold text-black/80">
                  Clique para montar a grade completa de todos os modelos selecionados no manifesto.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkSelectedProductIds([])}
                className="px-3 py-1.5 text-xs font-semibold text-black/70 hover:text-black transition-colors"
              >
                Desmarcar
              </button>
              <button
                type="button"
                onClick={handleAddAllSelectedToCart}
                className="px-4 py-2 rounded-xl bg-black text-white hover:bg-zinc-900 font-syne font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                <span>Adicionar Grade em Lote</span>
              </button>
            </div>
          </div>
        )}

        {/* Product Grid with Hover Zoom & SKU */}
        {filteredProducts.length === 0 ? (
          <div className="bg-[#181718] border border-white/10 rounded-3xl p-12 text-center text-zinc-400 max-w-md mx-auto my-12">
            <Search className="w-10 h-10 mx-auto text-zinc-600 mb-3" />
            <h3 className="font-syne font-bold text-lg text-white">Nenhum sneaker encontrado</h3>
            <p className="text-xs font-jakarta mt-1">
              Não encontramos modelos correspondentes aos filtros aplicados. Experimente buscar por outra silhueta ou SKU.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('TODOS');
                setSelectedBrand('TODAS');
                setSelectedStoreId('all');
              }}
              className="mt-4 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                mode={mode}
                onQuickView={setDetailProduct}
                onAddToCart={handleAddToCart}
                isSelectedForBulk={bulkSelectedProductIds.includes(product.id)}
                onToggleBulkSelect={handleToggleBulkSelect}
              />
            ))}
          </div>
        )}
      </main>

      {/* Customer Testimonials Section */}
      <Testimonials />

      {/* Footer */}
      <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={detailProduct}
        mode={mode}
        onClose={() => setDetailProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* B2B Cart & Order Manifest Drawer */}
      <B2BCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        mode={mode}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      {/* Super Admin Modal with Instant Tab Switcher & AI Extractor */}
      <SuperAdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        partnerStores={partnerStores}
        onUpdateStoreStatus={handleUpdateStoreStatus}
        onAddStore={handleAddStore}
        onUpdateCreditLimit={handleUpdateCreditLimit}
        products={products}
        onPublishToCatalog={handlePublishExtractedCandidates}
        onAddProduct={handleAddManualProduct}
        onDeleteProduct={handleDeleteProduct}
        onBulkUpdateProducts={handleBulkUpdateProducts}
        onImportCatalog={handleImportCatalog}
        aiStatus={aiStatus}
        onRefreshAIStatus={checkAIStatus}
      />
    </div>
  );
}
