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
  ChevronDown,
  CreditCard
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
import { formatCurrency } from './utils/currency';

export default function App() {
  // Mode: Varejo vs Atacado (10+ un)
  const [mode, setMode] = useState<'varejo' | 'atacado'>('atacado');

  // Products state (persisted or preloaded)
  const [products, setProducts] = useState<SneakerProduct[]>(() => {
    try {
      const saved = localStorage.getItem('kicksluxe_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: SneakerProduct) => ({
            ...p,
            retailPrice: typeof p.retailPrice === 'number' ? p.retailPrice : 45,
            wholesalePrice: typeof p.wholesalePrice === 'number' ? p.wholesalePrice : 25,
            volumeWholesalePrice: p.volumeWholesalePrice ?? 20,
            volumeWholesaleQty: p.volumeWholesaleQty ?? 50,
            profitMarginPct:
              p.profitMarginPct ||
              Math.round(
                (((p.retailPrice || 45) - (p.wholesalePrice || 25)) / (p.wholesalePrice || 25)) * 100
              ),
          }));
        }
      }
    } catch {}
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

  // Load catalog and stores from storage on mount without overriding user changes
  useEffect(() => {
    let isMounted = true;
    loadProductsFromStorage().then((saved) => {
      if (isMounted && saved && saved.length > 0) {
        setProducts(saved);
      } else if (isMounted) {
        saveProductsToStorage(INITIAL_PRODUCTS);
        setProducts(INITIAL_PRODUCTS);
      }
    });

    loadStoresFromStorage().then((savedStores) => {
      if (isMounted && savedStores && savedStores.length > 0) {
        setPartnerStores(savedStores);
      }
    });

    // Real-time synchronization listener for catalog updates
    const handleSync = (e: Event) => {
      if (!isMounted) return;
      const ce = e as CustomEvent;
      if (ce.detail?.products && Array.isArray(ce.detail.products) && ce.detail.products.length > 0) {
        setProducts(ce.detail.products);
      }
    };
    window.addEventListener('kicksluxe_catalog_sync', handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener('kicksluxe_catalog_sync', handleSync);
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

  // Calculate total stock units available for a product
  const getProductStock = (product: SneakerProduct): number => {
    if (product.stockPerSize) {
      return Object.values(product.stockPerSize).reduce((acc, qty) => acc + (Number(qty) || 0), 0);
    }
    return product.sizes && product.sizes.length > 0 ? 50 : 0;
  };

  // Filter categories: ONLY show categories that actually have in-stock products with valid images
  const allCategories = useMemo(() => {
    const validCategories = new Set<string>();
    products.forEach((p) => {
      const hasValidImage = Boolean(p.image && p.image.trim().length > 10 && !p.image.includes('placeholder'));
      const inStock = getProductStock(p) > 0;
      if (hasValidImage && inStock && p.category && p.category.trim()) {
        validCategories.add(p.category.trim());
      }
    });
    return ['TODOS', ...Array.from(validCategories)];
  }, [products]);

  const allBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (getProductStock(p) > 0 && p.brand && p.brand.trim()) {
        set.add(p.brand.trim());
      }
    });
    return ['TODAS', ...Array.from(set)];
  }, [products]);

  // Filter and sort products: Only show products IN STOCK with valid images
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Must be in stock (> 0 pairs)
        const inStock = getProductStock(p) > 0;
        if (!inStock) return false;

        // Must have valid image
        if (!p.image || p.image.trim().length < 5) return false;

        const matchesSearch =
          searchQuery === '' ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
          selectedCategory === 'TODOS' ||
          p.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim();

        const matchesBrand =
          selectedBrand === 'TODAS' ||
          p.brand.toLowerCase().trim() === selectedBrand.toLowerCase().trim();

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
      const existingSkus = new Set(prev.map((p) => (p.sku || '').toLowerCase().trim()));
      const preparedNew = newProducts.map((p, idx) => {
        let finalSku = p.sku || `KL-${Math.floor(1000 + Math.random() * 9000)}`;
        if (existingSkus.has(finalSku.toLowerCase().trim())) {
          finalSku = `${finalSku}-${Math.floor(10 + Math.random() * 90)}`;
        }
        existingSkus.add(finalSku.toLowerCase().trim());
        return {
          ...p,
          id: p.id || `prod-ext-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          sku: finalSku,
          createdAt: p.createdAt || new Date().toISOString(),
        };
      });

      const updated = [...preparedNew, ...prev];
      saveProductsToStorage(updated);
      return updated;
    });
  };

  const handleAddManualProduct = (newProduct: SneakerProduct) => {
    setProducts((prev) => {
      const updated = [newProduct, ...prev];
      saveProductsToStorage(updated);
      return updated;
    });
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      saveProductsToStorage(updated);
      return updated;
    });
  };

  const handleUpdateProduct = (updatedProduct: SneakerProduct) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
      saveProductsToStorage(updated);
      return updated;
    });
    if (detailProduct && detailProduct.id === updatedProduct.id) {
      setDetailProduct(updatedProduct);
    }
  };

  const handleBulkSetWholesalePriceAll = (wholesaleVal: number, retailVal?: number) => {
    setProducts((prev) => {
      const updated = prev.map((p) => {
        const r = retailVal ?? (p.retailPrice > wholesaleVal ? p.retailPrice : Math.round(wholesaleVal * 1.8));
        const margin = Math.round(((r - wholesaleVal) / wholesaleVal) * 100);
        return {
          ...p,
          wholesalePrice: wholesaleVal,
          retailPrice: r,
          profitMarginPct: margin,
        };
      });
      saveProductsToStorage(updated);
      return updated;
    });
  };

  const handleBulkUpdateProducts = (updatedProducts: SneakerProduct[]) => {
    if (!updatedProducts || updatedProducts.length === 0) return;
    setProducts((prev) => {
      const updateMap = new Map(updatedProducts.map((p) => [p.id, p]));
      const updated = prev.map((p) => updateMap.get(p.id) || p);
      saveProductsToStorage(updated);
      return updated;
    });
  };

  const handleUpdateProductPrices = (
    productId: string,
    wholesalePrice: number,
    retailPrice: number,
    volumeWholesalePrice?: number,
    volumeWholesaleQty?: number
  ) => {
    const margin = Math.round(((retailPrice - wholesalePrice) / wholesalePrice) * 100);
    setProducts((prev) => {
      const updated = prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              wholesalePrice,
              retailPrice,
              volumeWholesalePrice: volumeWholesalePrice !== undefined ? volumeWholesalePrice : (p.volumeWholesalePrice ?? 20),
              volumeWholesaleQty: volumeWholesaleQty !== undefined ? volumeWholesaleQty : (p.volumeWholesaleQty ?? 50),
              profitMarginPct: margin,
            }
          : p
      );
      saveProductsToStorage(updated);
      return updated;
    });
    if (detailProduct && detailProduct.id === productId) {
      setDetailProduct((prev) =>
        prev
          ? {
              ...prev,
              wholesalePrice,
              retailPrice,
              volumeWholesalePrice: volumeWholesalePrice !== undefined ? volumeWholesalePrice : (prev.volumeWholesalePrice ?? 20),
              volumeWholesaleQty: volumeWholesaleQty !== undefined ? volumeWholesaleQty : (prev.volumeWholesaleQty ?? 50),
              profitMarginPct: margin,
            }
          : null
      );
    }
  };

  const handleImportCatalog = (imported: SneakerProduct[], mode: 'merge' | 'replace' = 'replace') => {
    if (!imported || imported.length === 0) return;
    if (mode === 'replace') {
      saveProductsToStorage(imported);
      setProducts(imported);
    } else {
      setProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const unique = imported.filter((p) => !existingIds.has(p.id));
        const merged = [...unique, ...prev];
        saveProductsToStorage(merged);
        return merged;
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

  // Dynamically compute wholesale pricing overview from current catalog products
  const catalogPricingSummary = useMemo(() => {
    if (!products || products.length === 0) {
      return {
        minWholesale: 25,
        maxWholesale: 25,
        minRetail: 45,
        maxRetail: 45,
        volumeWholesale: 20,
        volumeQty: 50,
        marginStandard: 80,
        marginVolume: 125,
        isUniformWholesale: true,
        isUniformRetail: true,
      };
    }
    const wholesalePrices = products.map((p) => p.wholesalePrice || 25);
    const retailPrices = products.map((p) => p.retailPrice || 45);
    const volumePrices = products.map((p) => p.volumeWholesalePrice ?? 20);
    const volumeQtys = products.map((p) => p.volumeWholesaleQty ?? 50);

    const minW = Math.min(...wholesalePrices);
    const maxW = Math.max(...wholesalePrices);
    const minR = Math.min(...retailPrices);
    const maxR = Math.max(...retailPrices);
    const volP = volumePrices[0] ?? 20;
    const volQ = volumeQtys[0] ?? 50;

    const marginStandard = minW > 0 ? Math.round(((minR - minW) / minW) * 100) : 80;
    const marginVolume = volP > 0 ? Math.round(((minR - volP) / volP) * 100) : 125;

    return {
      minWholesale: minW,
      maxWholesale: maxW,
      minRetail: minR,
      maxRetail: maxR,
      volumeWholesale: volP,
      volumeQty: volQ,
      marginStandard,
      marginVolume,
      isUniformWholesale: minW === maxW,
      isUniformRetail: minR === maxR,
    };
  }, [products]);

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
                ? 'Preços diferenciados para pedidos a partir de 10 pares com margens entre 80% a 155% e nota fiscal emitida.'
                : 'Pares autênticos com laudo pericial 1:1, entrega blindada e garantia de procedência.'}
            </p>
          </div>

          {/* Wholesale Mode Tier Summary Pill */}
          {mode === 'atacado' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="badge-3d-dark highlight-glow-ribbon rounded-2xl p-3.5 flex items-center gap-4 text-xs font-mono-sku shadow-xl">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400 animate-pulse" />
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">ATACADO 10+ UN</span>
                    <span className="text-amber-300 font-bold text-3d-subtle">
                      {catalogPricingSummary.isUniformWholesale
                        ? formatCurrency(catalogPricingSummary.minWholesale)
                        : `A partir de ${formatCurrency(catalogPricingSummary.minWholesale)}`}
                      {' '}/ par
                    </span>
                  </div>
                </div>
                <div className="h-7 w-px bg-white/10"></div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-bounce" />
                  <div>
                    <span className="text-emerald-400 block text-[10px] uppercase font-bold">
                      🔥 +{catalogPricingSummary.volumeQty} SORTIDOS
                    </span>
                    <span className="text-emerald-300 font-extrabold text-3d-subtle">
                      {formatCurrency(catalogPricingSummary.volumeWholesale)} / par (Auto)
                    </span>
                  </div>
                </div>
                <div className="h-7 w-px bg-white/10"></div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase">LUCRO NA REVENDA</span>
                  <span className="text-emerald-400 font-extrabold text-3d-subtle">
                    +{catalogPricingSummary.marginStandard}% {catalogPricingSummary.marginStandard !== catalogPricingSummary.marginVolume ? `a +${catalogPricingSummary.marginVolume}%` : ''}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Retail Mode Tier Summary Pill */}
          {mode === 'varejo' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="badge-3d-dark highlight-glow-ribbon rounded-2xl p-3.5 flex items-center gap-4 text-xs font-mono-sku shadow-xl">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-400 animate-pulse" />
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">PREÇO VAREJO</span>
                    <span className="text-white font-bold text-3d-subtle">
                      {catalogPricingSummary.isUniformRetail
                        ? formatCurrency(catalogPricingSummary.minRetail)
                        : `A partir de ${formatCurrency(catalogPricingSummary.minRetail)}`}
                      {' '}/ par
                    </span>
                  </div>
                </div>
                <div className="h-7 w-px bg-white/10"></div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-amber-400 block text-[10px] uppercase font-bold">
                      PARCELAMENTO
                    </span>
                    <span className="text-amber-300 font-extrabold text-3d-subtle">
                      3x de {formatCurrency(Math.round((catalogPricingSummary.minRetail / 3) * 100) / 100)} s/ juros
                    </span>
                  </div>
                </div>
                <div className="h-7 w-px bg-white/10"></div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase">À VISTA (PIX / TED)</span>
                  <span className="text-emerald-400 font-extrabold text-3d-subtle">
                    {formatCurrency(Math.round((catalogPricingSummary.minRetail * 0.95) * 100) / 100)} (5% OFF)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wholesale Assorted Volume Incentive Bar */}
        {mode === 'atacado' && (
          <div className="mb-6 bg-gradient-to-r from-emerald-950/60 via-[#18231c] to-teal-950/50 border border-emerald-500/40 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-syne font-extrabold text-sm text-white">
                    Desconto Automático por Volume: Compre +{catalogPricingSummary.volumeQty} Pares Sortidos a {formatCurrency(catalogPricingSummary.volumeWholesale)} cada!
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-black font-mono-sku font-black text-[10px] tracking-wide">
                    PARES 100% SORTIDOS
                  </span>
                </div>
                <p className="text-xs text-emerald-200/80 font-jakarta mt-1">
                  Exemplo: Valor público de venda a <strong>{formatCurrency(catalogPricingSummary.minRetail)}</strong>. Atacado padrão sai a <strong>{catalogPricingSummary.isUniformWholesale ? formatCurrency(catalogPricingSummary.minWholesale) : `a partir de ${formatCurrency(catalogPricingSummary.minWholesale)}`}</strong>. Atingindo <strong>{catalogPricingSummary.volumeQty} pares sortidos</strong> (qualquer modelo e numeração misturados), o sistema aplica <strong>automaticamente {formatCurrency(catalogPricingSummary.volumeWholesale)}</strong> em cada par no seu pedido!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-syne font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                <span>Ver Manifesto ({cartPairsCount} pares)</span>
              </button>
            </div>
          </div>
        )}

        {/* Retail Mode Value & Wholesale Switcher Banner */}
        {mode === 'varejo' && (
          <div className="mb-6 bg-gradient-to-r from-amber-950/50 via-[#1f1a14] to-yellow-950/40 border border-amber-500/40 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0 shadow-inner">
                <TrendingUp className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-syne font-extrabold text-sm text-white">
                    Valores Especiais no Varejo: Pares a {catalogPricingSummary.isUniformRetail ? formatCurrency(catalogPricingSummary.minRetail) : `a partir de ${formatCurrency(catalogPricingSummary.minRetail)}`} em até 3x sem juros ou 5% OFF à vista!
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black font-mono-sku font-black text-[10px] tracking-wide">
                    ENVIO EXPRESSO 24H
                  </span>
                </div>
                <p className="text-xs text-amber-200/80 font-jakarta mt-1">
                  Pares autênticos com laudo pericial 1:1 e entrega blindada. Para pedidos a partir de <strong>10 pares sortidos</strong> (revenda e boutiques), mude para a modalidade <strong>Atacado</strong> e compre por <strong>{catalogPricingSummary.isUniformWholesale ? formatCurrency(catalogPricingSummary.minWholesale) : `a partir de ${formatCurrency(catalogPricingSummary.minWholesale)}`} / par</strong> com margem de até <strong>+{catalogPricingSummary.marginVolume}%</strong>!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
              <button
                type="button"
                onClick={() => setMode('atacado')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-syne font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                <span>Ver Preços de Atacado ({catalogPricingSummary.isUniformWholesale ? formatCurrency(catalogPricingSummary.minWholesale) : `a partir de ${formatCurrency(catalogPricingSummary.minWholesale)}`})</span>
              </button>
            </div>
          </div>
        )}

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
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4.5">
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

      {/* Floating cart button (only when items exist) */}
      {cartPairsCount > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-300/40"
          aria-label="Abrir carrinho"
        >
          <ShoppingBag className="w-5 h-5 text-black" />
          <span className="text-xs font-syne font-bold uppercase tracking-wider">
            {cartPairsCount} {cartPairsCount === 1 ? 'par' : 'pares'}
          </span>
        </button>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={detailProduct}
        mode={mode}
        onClose={() => setDetailProduct(null)}
        onAddToCart={handleAddToCart}
        onUpdateProductPrices={handleUpdateProductPrices}
        onUpdateProduct={handleUpdateProduct}
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
        onUpdateProductPrices={handleUpdateProductPrices}
        onUpdateProduct={handleUpdateProduct}
        onBulkSetWholesalePriceAll={handleBulkSetWholesalePriceAll}
        onImportCatalog={handleImportCatalog}
        aiStatus={aiStatus}
        onRefreshAIStatus={checkAIStatus}
      />
    </div>
  );
}
