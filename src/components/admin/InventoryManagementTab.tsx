import React, { useState, useRef } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  ShieldCheck,
  Tag,
  Zap,
  CheckSquare,
  Square,
  Coins,
  Check,
  Download,
  Upload,
  FileCode,
  Info,
  Copy,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  Pencil,
  X,
  Percent,
  TrendingUp,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import { SneakerProduct, PartnerStore } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { compressUploadedImage } from '../../utils/imageProcessor';

interface InventoryManagementTabProps {
  products: SneakerProduct[];
  partnerStores: PartnerStore[];
  onAddProduct: (product: SneakerProduct) => void;
  onDeleteProduct: (productId: string) => void;
  onBulkUpdateProducts?: (updated: SneakerProduct[]) => void;
  onUpdateProductPrices?: (
    productId: string,
    wholesalePrice: number,
    retailPrice: number,
    volumeWholesalePrice?: number,
    volumeWholesaleQty?: number
  ) => void;
  onUpdateProduct?: (product: SneakerProduct) => void;
  onBulkSetWholesalePriceAll?: (wholesalePrice: number, retailPrice?: number) => void;
  onImportCatalog?: (products: SneakerProduct[], mode?: 'merge' | 'replace') => void;
}

export const InventoryManagementTab: React.FC<InventoryManagementTabProps> = ({
  products,
  partnerStores,
  onAddProduct,
  onDeleteProduct,
  onBulkUpdateProducts,
  onUpdateProductPrices,
  onUpdateProduct,
  onBulkSetWholesalePriceAll,
  onImportCatalog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStore, setFilterStore] = useState('all');

  // Single Product Price Editing State
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [inlineWholesale, setInlineWholesale] = useState<string>('');
  const [inlineRetail, setInlineRetail] = useState<string>('');

  // Dedicated Price Edit Modal State (with image URLs)
  const [priceModalProduct, setPriceModalProduct] = useState<SneakerProduct | null>(null);
  const [modalImage, setModalImage] = useState<string>('');
  const [modalSecondaryImage, setModalSecondaryImage] = useState<string>('');
  const [modalWholesale, setModalWholesale] = useState<string>('');
  const [modalRetail, setModalRetail] = useState<string>('');
  const [modalVolumePrice, setModalVolumePrice] = useState<string>('20');
  const [modalVolumeQty, setModalVolumeQty] = useState<number>(50);

  // Dedicated Complete Product Edit Modal State
  const [editModalProduct, setEditModalProduct] = useState<SneakerProduct | null>(null);
  const [fullEditName, setFullEditName] = useState<string>('');
  const [fullEditSku, setFullEditSku] = useState<string>('');
  const [fullEditBrand, setFullEditBrand] = useState<string>('');
  const [fullEditCategory, setFullEditCategory] = useState<string>('');
  const [fullEditImage, setFullEditImage] = useState<string>('');
  const [fullEditSecondaryImage, setFullEditSecondaryImage] = useState<string>('');
  const [fullEditRetail, setFullEditRetail] = useState<string>('');
  const [fullEditWholesale, setFullEditWholesale] = useState<string>('');
  const [fullEditVolumePrice, setFullEditVolumePrice] = useState<string>('20');
  const [fullEditVolumeQty, setFullEditVolumeQty] = useState<number>(50);
  const [fullEditBadge, setFullEditBadge] = useState<string>('');
  const [fullEditDescription, setFullEditDescription] = useState<string>('');

  // Bulk selection and repricing states
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [bulkPricingTarget, setBulkPricingTarget] = useState<'selected' | 'all'>('all');
  const [bulkWholesalePrice, setBulkWholesalePrice] = useState<string>('25');
  const [bulkVolumeQty, setBulkVolumeQty] = useState<number>(50); // 50 ou 100 pares
  const [bulkVolumePrice, setBulkVolumePrice] = useState<string>('20');
  const [bulkRetailPrice, setBulkRetailPrice] = useState<string>('45');
  const [isAutoRetail, setIsAutoRetail] = useState<boolean>(false);
  const [autoMarkupPercent, setAutoMarkupPercent] = useState<number>(80);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Vercel Sync & Export/Import states
  const [showVercelModal, setShowVercelModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export catalog as clean JSON file
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kicksluxe_catalogo_${products.length}_modelos_EUR.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setFeedbackToast({
      message: `Catálogo com ${products.length} modelos baixado em JSON com sucesso!`,
      type: 'success',
    });
  };

  // Export initialProducts.ts ready to be saved in git repository for Vercel
  const handleExportTypeScriptFile = () => {
    const tsContent = `import { SneakerProduct } from '../types';\n\nexport const INITIAL_PRODUCTS: SneakerProduct[] = ${JSON.stringify(
      products,
      null,
      2
    )};\n`;

    const blob = new Blob([tsContent], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'initialProducts.ts';
    link.click();
    URL.revokeObjectURL(url);
    setFeedbackToast({
      message: `Arquivo "initialProducts.ts" com ${products.length} modelos gerado! Basta substituir em src/data/ e fazer deploy na Vercel.`,
      type: 'success',
    });
  };

  // Copy TypeScript code to clipboard
  const handleCopyTypeScriptCode = () => {
    const tsContent = `import { SneakerProduct } from '../types';\n\nexport const INITIAL_PRODUCTS: SneakerProduct[] = ${JSON.stringify(
      products,
      null,
      2
    )};\n`;
    navigator.clipboard.writeText(tsContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
    setFeedbackToast({
      message: `Código TypeScript copiado! Cole no arquivo src/data/initialProducts.ts para enviar à Vercel.`,
      type: 'success',
    });
  };

  // Import JSON from file input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (onImportCatalog) {
            onImportCatalog(parsed, 'replace');
          }
          setFeedbackToast({
            message: `Sucesso! ${parsed.length} produtos importados e sincronizados no catálogo!`,
            type: 'success',
          });
        } else {
          setFeedbackToast({
            message: 'O arquivo JSON não contém uma lista válida de produtos.',
            type: 'error',
          });
        }
      } catch (err: any) {
        setFeedbackToast({
          message: `Erro ao ler arquivo JSON: ${err.message}`,
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [newProd, setNewProd] = useState<Partial<SneakerProduct>>({
    name: '',
    sku: `KL-${Math.floor(1000 + Math.random() * 9000)}`,
    brand: 'Jordan',
    category: 'High-Top',
    retailPrice: 45,
    wholesalePrice: 25,
    volumeWholesalePrice: 20,
    volumeWholesaleQty: 50,
    minWholesaleQty: 10,
    badge: 'GRADE DISPONÍVEL',
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
    description: 'Silhueta de alta performance confeccionada em couro premium com amortecimento pneumático responsivo.',
    materials: ['Couro Bovino 100%', 'Entressola PU', 'Solado de Borracha'],
    sizes: [38, 39, 40, 41, 42, 43, 44],
    storeId: 'central',
  });

  const brands = Array.from(new Set(products.map((p) => p.brand)));
  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBrand = filterBrand === 'all' || p.brand === filterBrand;
    const matchCategory = filterCategory === 'all' || p.category === filterCategory;
    const matchStore = filterStore === 'all' || p.storeId === filterStore;
    return matchSearch && matchBrand && matchCategory && matchStore;
  });

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedProductIds(new Set(filtered.map((p) => p.id)));
    } else {
      setSelectedProductIds(new Set());
    }
  };

  // Single Product Price Handlers
  const handleStartInlineEdit = (prod: SneakerProduct) => {
    setEditingRowId(prod.id);
    setInlineWholesale(prod.wholesalePrice.toString());
    setInlineRetail(prod.retailPrice.toString());
  };

  const handleSaveInlineEdit = (prod: SneakerProduct) => {
    const wholesaleNum = parseFloat(inlineWholesale.replace(',', '.'));
    const retailNum = parseFloat(inlineRetail.replace(',', '.'));
    if (isNaN(wholesaleNum) || wholesaleNum <= 0 || isNaN(retailNum) || retailNum <= 0) {
      setFeedbackToast({
        message: 'Preços inválidos! Informe valores numéricos positivos para atacado e varejo.',
        type: 'error',
      });
      setTimeout(() => setFeedbackToast(null), 3500);
      return;
    }

    const margin = Math.round(((retailNum - wholesaleNum) / wholesaleNum) * 100);
    const updatedProd: SneakerProduct = {
      ...prod,
      wholesalePrice: wholesaleNum,
      retailPrice: retailNum,
      profitMarginPct: margin,
    };

    if (onUpdateProduct) {
      onUpdateProduct(updatedProd);
    }
    if (onBulkUpdateProducts) {
      onBulkUpdateProducts([updatedProd]);
    }
    if (onUpdateProductPrices) {
      onUpdateProductPrices(prod.id, wholesaleNum, retailNum);
    }

    setEditingRowId(null);
    setFeedbackToast({
      message: `Preços atualizados para "${prod.name}" com sucesso! Atacado: € ${wholesaleNum.toFixed(2)}`,
      type: 'success',
    });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleOpenPriceModal = (prod: SneakerProduct) => {
    setPriceModalProduct(prod);
    setModalImage(prod.image);
    setModalSecondaryImage(prod.secondaryImage || '');
    setModalWholesale(prod.wholesalePrice.toString());
    setModalRetail(prod.retailPrice.toString());
    setModalVolumePrice((prod.volumeWholesalePrice ?? 20).toString());
    setModalVolumeQty(prod.volumeWholesaleQty ?? 50);
  };

  const handlePriceModalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'primary' | 'secondary') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressUploadedImage(file, 1000, 1000, 0.85);
    if (compressed) {
      if (field === 'primary') setModalImage(compressed);
      else setModalSecondaryImage(compressed);
    }
  };

  const handleSavePriceModal = () => {
    if (!priceModalProduct) return;
    const wholesaleNum = parseFloat(modalWholesale.replace(',', '.'));
    const retailNum = parseFloat(modalRetail.replace(',', '.'));
    const volumePriceNum = parseFloat(modalVolumePrice.replace(',', '.'));
    const volumeQtyNum = modalVolumeQty || 50;

    if (isNaN(wholesaleNum) || wholesaleNum <= 0 || isNaN(retailNum) || retailNum <= 0) {
      setFeedbackToast({
        message: 'Informe valores numéricos válidos maiores que zero.',
        type: 'error',
      });
      setTimeout(() => setFeedbackToast(null), 3500);
      return;
    }

    const validVolumePrice = !isNaN(volumePriceNum) && volumePriceNum > 0 ? volumePriceNum : 20;
    const margin = Math.round(((retailNum - wholesaleNum) / wholesaleNum) * 100);

    const updatedProd: SneakerProduct = {
      ...priceModalProduct,
      image: modalImage.trim() || priceModalProduct.image,
      secondaryImage: modalSecondaryImage.trim() || undefined,
      wholesalePrice: wholesaleNum,
      retailPrice: retailNum,
      volumeWholesalePrice: validVolumePrice,
      volumeWholesaleQty: volumeQtyNum,
      profitMarginPct: margin,
    };

    if (onUpdateProduct) {
      onUpdateProduct(updatedProd);
    }
    if (onBulkUpdateProducts) {
      onBulkUpdateProducts([updatedProd]);
    }
    if (onUpdateProductPrices) {
      onUpdateProductPrices(
        priceModalProduct.id,
        wholesaleNum,
        retailNum,
        validVolumePrice,
        volumeQtyNum
      );
    }

    const prodName = priceModalProduct.name;
    setPriceModalProduct(null);
    setFeedbackToast({
      message: `Preços e fotos de "${prodName}" salvos com sucesso! Atacado: € ${wholesaleNum.toFixed(2)}`,
      type: 'success',
    });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // Full Product Edit Modal Handlers
  const handleOpenFullEditModal = (prod: SneakerProduct) => {
    setEditModalProduct(prod);
    setFullEditName(prod.name);
    setFullEditSku(prod.sku);
    setFullEditBrand(prod.brand);
    setFullEditCategory(prod.category);
    setFullEditImage(prod.image);
    setFullEditSecondaryImage(prod.secondaryImage || '');
    setFullEditRetail(prod.retailPrice.toString());
    setFullEditWholesale(prod.wholesalePrice.toString());
    setFullEditVolumePrice((prod.volumeWholesalePrice ?? 20).toString());
    setFullEditVolumeQty(prod.volumeWholesaleQty ?? 50);
    setFullEditBadge(prod.badge || '');
    setFullEditDescription(prod.description || '');
  };

  const handleSaveFullEditModal = () => {
    if (!editModalProduct) return;
    const w = parseFloat(fullEditWholesale.replace(',', '.'));
    const r = parseFloat(fullEditRetail.replace(',', '.'));
    const volP = parseFloat(fullEditVolumePrice.replace(',', '.'));

    if (isNaN(w) || w <= 0 || isNaN(r) || r <= 0) {
      setFeedbackToast({
        message: 'Por favor, informe valores válidos para atacado e varejo.',
        type: 'error',
      });
      setTimeout(() => setFeedbackToast(null), 3500);
      return;
    }

    const validVol = !isNaN(volP) && volP > 0 ? volP : 20;
    const margin = Math.round(((r - w) / w) * 100);

    const updated: SneakerProduct = {
      ...editModalProduct,
      name: fullEditName.trim() || editModalProduct.name,
      sku: fullEditSku.trim() || editModalProduct.sku,
      brand: fullEditBrand.trim() || editModalProduct.brand,
      category: fullEditCategory.trim() || editModalProduct.category,
      image: fullEditImage.trim() || editModalProduct.image,
      secondaryImage: fullEditSecondaryImage.trim() || undefined,
      retailPrice: r,
      wholesalePrice: w,
      volumeWholesalePrice: validVol,
      volumeWholesaleQty: fullEditVolumeQty,
      profitMarginPct: margin,
      badge: fullEditBadge.trim() || undefined,
      description: fullEditDescription.trim() || editModalProduct.description,
    };

    if (onUpdateProduct) {
      onUpdateProduct(updated);
    }
    if (onBulkUpdateProducts) {
      onBulkUpdateProducts([updated]);
    }

    const name = updated.name;
    setEditModalProduct(null);
    setFeedbackToast({
      message: `Modelo "${name}" atualizado com sucesso! Fotos e preços salvos.`,
      type: 'success',
    });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const handleFullEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'primary' | 'secondary') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressUploadedImage(file, 1000, 1000, 0.85);
    if (compressed) {
      if (field === 'primary') setFullEditImage(compressed);
      else setFullEditSecondaryImage(compressed);
    }
  };

  const handleApplyMarkupToModal = (markupPercent: number) => {
    const wholesaleNum = parseFloat(modalWholesale.replace(',', '.'));
    if (!isNaN(wholesaleNum) && wholesaleNum > 0) {
      const calculatedRetail = Math.round(wholesaleNum * (1 + markupPercent / 100));
      setModalRetail(calculatedRetail.toString());
    }
  };

  const handleApplyWholesale33ToAll = () => {
    if (onBulkSetWholesalePriceAll) {
      onBulkSetWholesalePriceAll(33);
    } else if (onBulkUpdateProducts) {
      const updated = products.map((p) => {
        const r = p.retailPrice > 33 ? p.retailPrice : 65;
        const margin = Math.round(((r - 33) / 33) * 100);
        return {
          ...p,
          wholesalePrice: 33,
          retailPrice: r,
          profitMarginPct: margin,
        };
      });
      onBulkUpdateProducts(updated);
    }
    setBulkWholesalePrice('33');
    setFeedbackToast({
      message: `Sucesso! Preço de atacado definido para € 33,00 em TODOS os ${products.length} modelos do catálogo!`,
      type: 'success',
    });
    setTimeout(() => setFeedbackToast(null), 4500);
  };

  const handleQuickApplyValue = (val: number) => {
    const wholesaleVal = val;
    const retailVal = isAutoRetail
      ? Math.max(Math.round(wholesaleVal * (1 + autoMarkupPercent / 100)), wholesaleVal + 2)
      : parseFloat(bulkRetailPrice) || Math.round(wholesaleVal * 2);
    const volumePriceVal = parseFloat(bulkVolumePrice) || Math.max(1, wholesaleVal - 5);

    setBulkWholesalePrice(wholesaleVal.toString());
    setBulkRetailPrice(retailVal.toString());

    // When target is 'all', apply to all products in catalog (or filtered if a specific search/filter is active)
    const targetProducts =
      bulkPricingTarget === 'all'
        ? (filtered.length === products.length || (!searchTerm && filterBrand === 'all' && filterCategory === 'all' && filterStore === 'all') ? products : filtered)
        : (selectedProductIds.size > 0 ? products.filter((p) => selectedProductIds.has(p.id)) : products);

    if (targetProducts.length === 0) {
      setFeedbackToast({
        message: 'Nenhum produto selecionado. Marque os produtos ou selecione "Filtrados".',
        type: 'info',
      });
      setTimeout(() => setFeedbackToast(null), 4000);
      return;
    }

    const updated = targetProducts.map((p) => {
      const margin = Math.round(((retailVal - wholesaleVal) / wholesaleVal) * 100);
      return {
        ...p,
        wholesalePrice: wholesaleVal,
        retailPrice: retailVal,
        volumeWholesalePrice: volumePriceVal,
        volumeWholesaleQty: bulkVolumeQty || 50,
        profitMarginPct: margin,
      };
    });

    if (onBulkUpdateProducts) {
      onBulkUpdateProducts(updated);
    }

    setFeedbackToast({
      message: `Preço de Atacado definido como € ${wholesaleVal.toFixed(2)} para ${targetProducts.length} produtos!`,
      type: 'success',
    });
    setTimeout(() => setFeedbackToast(null), 4500);
  };

  const handleApplyBulkPricing = () => {
    const wholesaleVal = parseFloat(bulkWholesalePrice.replace(',', '.'));
    const retailVal = parseFloat(bulkRetailPrice.replace(',', '.'));
    const volumePriceVal = parseFloat(bulkVolumePrice.replace(',', '.'));

    const hasValidWholesale = !isNaN(wholesaleVal) && wholesaleVal > 0;
    const hasValidRetail = !isNaN(retailVal) && retailVal > 0;
    const hasValidVolume = !isNaN(volumePriceVal) && volumePriceVal > 0;

    if (!hasValidWholesale && !hasValidRetail && !hasValidVolume) {
      setFeedbackToast({
        message: 'Por favor, informe um valor válido para o Preço de Atacado, Lote Volume ou Varejo.',
        type: 'error',
      });
      setTimeout(() => setFeedbackToast(null), 4000);
      return;
    }

    const targetProducts =
      bulkPricingTarget === 'all'
        ? (filtered.length === products.length || !searchTerm ? products : filtered)
        : filtered.filter((p) => selectedProductIds.has(p.id));

    if (targetProducts.length === 0) {
      setFeedbackToast({
        message: 'Nenhum produto selecionado. Selecione itens na tabela ou altere para "Filtrados".',
        type: 'info',
      });
      setTimeout(() => setFeedbackToast(null), 4000);
      return;
    }

    const updated = targetProducts.map((p) => {
      const newWholesale = hasValidWholesale ? wholesaleVal : p.wholesalePrice;
      let newRetail = p.retailPrice;

      if (hasValidRetail) {
        newRetail = retailVal;
      } else if (hasValidWholesale && isAutoRetail) {
        newRetail = Math.max(Math.round(newWholesale * (1 + autoMarkupPercent / 100)), newWholesale + 2);
      }

      const margin = Math.round(((newRetail - newWholesale) / newWholesale) * 100);
      return {
        ...p,
        wholesalePrice: newWholesale,
        retailPrice: newRetail,
        volumeWholesalePrice: hasValidVolume ? volumePriceVal : (p.volumeWholesalePrice ?? 20),
        volumeWholesaleQty: bulkVolumeQty || 50,
        profitMarginPct: margin,
      };
    });

    if (onBulkUpdateProducts) {
      onBulkUpdateProducts(updated);
    }

    setFeedbackToast({
      message: `Precificação aplicada a ${targetProducts.length} modelos! Atacado 10+: €${hasValidWholesale ? wholesaleVal : bulkWholesalePrice} | ${bulkVolumeQty}+ sortidos: €${hasValidVolume ? volumePriceVal : bulkVolumePrice} | Varejo: €${retailVal || 45}`,
      type: 'success',
    });
    setTimeout(() => setFeedbackToast(null), 4500);
  };

  const handleApplyPricingAllProducts = (
    wholesaleVal: number = 33,
    retailVal: number = 45,
    volumePriceVal: number = 25,
    volumeQty: number = 50
  ) => {
    if (onBulkSetWholesalePriceAll) {
      onBulkSetWholesalePriceAll(wholesaleVal, retailVal);
    } else if (onBulkUpdateProducts) {
      const margin = Math.round(((retailVal - wholesaleVal) / wholesaleVal) * 100);
      const updated = products.map((p) => ({
        ...p,
        wholesalePrice: wholesaleVal,
        retailPrice: retailVal,
        volumeWholesalePrice: volumePriceVal,
        volumeWholesaleQty: volumeQty,
        profitMarginPct: margin,
      }));
      onBulkUpdateProducts(updated);
    }
    setBulkWholesalePrice(wholesaleVal.toString());
    setBulkRetailPrice(retailVal.toString());
    setBulkVolumePrice(volumePriceVal.toString());
    setBulkVolumeQty(volumeQty);
    setFeedbackToast({
      message: `Todos os ${products.length} produtos atualizados com sucesso: Varejo €${retailVal}, Atacado 10+ €${wholesaleVal} e ${volumeQty}+ sortidos €${volumePriceVal}!`,
      type: 'success',
    });
    setTimeout(() => setFeedbackToast(null), 4500);
  };

  const handleApplyStandardPricingAll = (volumeQty: number = 50) => {
    const updated = products.map((p) => ({
      ...p,
      wholesalePrice: 25,
      retailPrice: 45,
      volumeWholesalePrice: 20,
      volumeWholesaleQty: volumeQty,
      profitMarginPct: 80,
    }));
    if (onBulkUpdateProducts) {
      onBulkUpdateProducts(updated);
    }
    setBulkWholesalePrice('25');
    setBulkRetailPrice('45');
    setBulkVolumePrice('20');
    setBulkVolumeQty(volumeQty);
    setFeedbackToast({
      message: `Todos os ${products.length} produtos atualizados com sucesso: Varejo €45, Atacado 10+ €25 e ${volumeQty}+ sortidos €20!`,
      type: 'success',
    });
    setTimeout(() => setFeedbackToast(null), 4500);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.sku) return;

    const retail = newProd.retailPrice || 45;
    const wholesale = newProd.wholesalePrice || 25;
    const volumeWholesale = newProd.volumeWholesalePrice || 20;
    const volumeQty = newProd.volumeWholesaleQty || 50;
    const margin = Math.round(((retail - wholesale) / wholesale) * 100);

    const created: SneakerProduct = {
      id: `prod-${Date.now()}`,
      name: newProd.name || '',
      sku: newProd.sku || `KL-${Date.now().toString().slice(-4)}`,
      brand: newProd.brand || 'Original',
      category: newProd.category || 'Retro Runner',
      retailPrice: retail,
      wholesalePrice: wholesale,
      volumeWholesalePrice: volumeWholesale,
      volumeWholesaleQty: volumeQty,
      minWholesaleQty: 10,
      profitMarginPct: margin,
      badge: newProd.badge || 'GRADE DISPONÍVEL',
      image: newProd.image || 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
      description: newProd.description || '',
      materials: newProd.materials || ['Couro', 'Borracha'],
      sizes: newProd.sizes || [38, 39, 40, 41, 42, 43, 44],
      storeId: newProd.storeId || 'central',
      originSource: 'manual',
      createdAt: new Date().toISOString(),
    };

    onAddProduct(created);
    setShowAddModal(false);
  };

  const isAllFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selectedProductIds.has(p.id));

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedbackToast && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-jakarta shadow-lg transition-all ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : feedbackToast.type === 'error'
              ? 'bg-red-500/15 border-red-500/40 text-red-300'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{feedbackToast.message}</span>
          </div>
          <button
            onClick={() => setFeedbackToast(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hidden File Input for Catalog Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        className="hidden"
      />

      {/* Top Banner and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#1e1d1f] p-4 rounded-2xl border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-syne font-bold text-base text-white">
              Inventário Central & Estoque por Unidade
            </h3>
            <span className="text-[10px] font-mono-sku px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 font-bold">
              TODOS EM EUROS (€)
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-jakarta mt-0.5">
            Total de <strong className="text-amber-400 font-mono-sku">{products.length}</strong> modelos cadastrados no catálogo KicksLuxe.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Vercel sync info button */}
          <button
            type="button"
            onClick={() => setShowVercelModal(true)}
            className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 font-syne font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            title="Entenda por que a Vercel tem 18 produtos e como sincronizar todos os 66 produtos"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>Sincronizar Vercel</span>
          </button>

          {/* Export JSON */}
          <button
            type="button"
            onClick={handleExportJSON}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-syne font-bold text-xs flex items-center gap-1.5 transition-all"
            title="Baixar backup do catálogo completo em arquivo JSON"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Exportar JSON</span>
          </button>

          {/* Import JSON */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-syne font-bold text-xs flex items-center gap-1.5 transition-all"
            title="Importar catálogo de arquivo JSON com 1 clique"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Importar JSON</span>
          </button>

          {/* Manual Add Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-syne font-bold text-xs flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cadastrar Manual</span>
          </button>
        </div>
      </div>

      {/* BULK PRICING TOOLBAR FOR INVENTORY */}
      <div className="bg-gradient-to-br from-[#242226] via-[#1c1b1e] to-[#161517] border border-amber-400/30 rounded-2xl p-4 md:p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center shadow-inner">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h5 className="font-syne font-bold text-sm text-white">
                  Precificação em Lote do Estoque
                </h5>
                <span className="text-[10px] font-mono-sku px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 font-bold">
                  TODOS OU SELECIONADOS
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-jakarta mt-0.5">
                Defina o valor de atacado ou varejo em Euros (€) para múltiplos modelos simultaneamente (ex: colocar 10 € ou 1 €).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono-sku">
            <span className="px-3 py-1 rounded-lg bg-black/50 border border-white/10 text-zinc-300">
              <strong className="text-amber-400">{selectedProductIds.size}</strong> selecionados
            </span>
            <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400">
              {filtered.length} filtrados
            </span>
          </div>
        </div>

        {/* Target and Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
          {/* Col 1: Aplicar Preço Em (3 cols) */}
          <div className="lg:col-span-3 space-y-1">
            <label className="text-[11px] font-mono-sku text-zinc-400 block uppercase">
              Aplicar Preço Em:
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setBulkPricingTarget('selected')}
                className={`py-2 px-2 rounded-lg text-xs font-syne font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  bulkPricingTarget === 'selected'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Sel. ({selectedProductIds.size})</span>
              </button>

              <button
                type="button"
                onClick={() => setBulkPricingTarget('all')}
                className={`py-2 px-2 rounded-lg text-xs font-syne font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  bulkPricingTarget === 'all'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Filt. ({filtered.length})</span>
              </button>
            </div>
          </div>

          {/* Col 2: Atacado 10+ (2 cols) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono-sku text-amber-300 font-bold block">
                Atacado 10+ (€):
              </label>
              <span className="text-[9px] font-mono-sku text-zinc-500">EX: 25</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono-sku text-amber-400 font-bold">
                €
              </span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={bulkWholesalePrice}
                onChange={(e) => setBulkWholesalePrice(e.target.value)}
                placeholder="25"
                className="w-full bg-black/60 border border-amber-400/40 focus:border-amber-400 rounded-xl pl-7 pr-3 py-2 text-white font-mono-sku text-sm font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Col 3: Atacado Volume Sortido (+50 ou +100 pares) (3 cols) */}
          <div className="lg:col-span-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-2 rounded-2xl border border-emerald-500/30">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono-sku text-emerald-300 font-bold flex items-center gap-1">
                <span>🔥 Lote Sortido:</span>
              </label>
              <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-emerald-500/30">
                <button
                  type="button"
                  onClick={() => setBulkVolumeQty(50)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono-sku font-extrabold transition-all cursor-pointer ${
                    bulkVolumeQty === 50
                      ? 'bg-emerald-400 text-black shadow-sm'
                      : 'text-zinc-400 hover:text-emerald-300'
                  }`}
                >
                  +50
                </button>
                <button
                  type="button"
                  onClick={() => setBulkVolumeQty(100)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono-sku font-extrabold transition-all cursor-pointer ${
                    bulkVolumeQty === 100
                      ? 'bg-emerald-400 text-black shadow-sm'
                      : 'text-zinc-400 hover:text-emerald-300'
                  }`}
                >
                  +100
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono-sku text-emerald-400 font-bold">
                  €
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={bulkVolumePrice}
                  onChange={(e) => setBulkVolumePrice(e.target.value)}
                  placeholder="20"
                  className="w-full bg-black/70 border border-emerald-500/40 focus:border-emerald-400 rounded-xl pl-6 pr-2 py-1.5 text-emerald-300 font-mono-sku text-sm font-bold focus:outline-none"
                  title={`Preço por par comprando acima de ${bulkVolumeQty} pares sortidos`}
                />
              </div>
              <span className="text-[10px] font-mono-sku text-emerald-300/80 leading-tight">
                sai <strong>€{bulkVolumePrice || '20'}</strong> em <strong>{bulkVolumeQty}+</strong>
              </span>
            </div>
          </div>

          {/* Col 4: Varejo (€) (2 cols) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono-sku text-zinc-300 block">
                Varejo (€):
              </label>
              <label className="flex items-center gap-1 text-[9px] font-mono-sku text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAutoRetail}
                  onChange={(e) => setIsAutoRetail(e.target.checked)}
                  className="w-3 h-3 accent-amber-400 rounded"
                />
                <span>Auto</span>
              </label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono-sku text-zinc-400 font-bold">
                €
              </span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={
                  isAutoRetail
                    ? parseFloat(bulkWholesalePrice)
                      ? Math.max(
                          Math.round(parseFloat(bulkWholesalePrice) * (1 + autoMarkupPercent / 100)),
                          parseFloat(bulkWholesalePrice) + 2
                        )
                      : 45
                    : bulkRetailPrice
                }
                disabled={isAutoRetail}
                onChange={(e) => setBulkRetailPrice(e.target.value)}
                placeholder="45"
                className={`w-full bg-black/60 border rounded-xl pl-7 pr-3 py-2 text-white font-mono-sku text-sm font-bold focus:outline-none ${
                  isAutoRetail
                    ? 'border-white/10 text-zinc-400 cursor-not-allowed opacity-80'
                    : 'border-white/20 focus:border-white/40'
                }`}
              />
            </div>
          </div>

          {/* Col 5: Botão Aplicar (2 cols) */}
          <div className="lg:col-span-2 flex flex-col justify-end">
            <button
              type="button"
              onClick={handleApplyBulkPricing}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-syne font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>
                Aplicar aos {bulkPricingTarget === 'all' ? 'Filtrados' : 'Selecionados'}
              </span>
            </button>
          </div>
        </div>

        {/* 1-Click Presets & Selection Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono-sku text-zinc-400 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              Atalhos de 1-Clique:
            </span>
            <button
              type="button"
              onClick={handleApplyWholesale33ToAll}
              title="Definir atacado imediatamente para € 33 em TODOS os modelos do catálogo"
              className="px-3.5 py-1.5 rounded-xl text-[11px] font-mono-sku font-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black flex items-center gap-1.5 shadow-md shadow-amber-400/25 transition-all cursor-pointer border border-amber-300 transform active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>⚡ ATACADO € 33 PARA TODOS ({products.length} MODELOS)</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPricingAllProducts(33, 45, 25, 50)}
              title="Definir todos os produtos para: Varejo €45, Atacado 10+ €33 e 50+ sortidos €25"
              className="px-3 py-1 rounded-lg text-[11px] font-mono-sku font-extrabold bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30 flex items-center gap-1 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Varejo €45 / Atacado €33 / +50 un €25 (Todos)</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyStandardPricingAll(50)}
              title="Definir todos os produtos para: Varejo €45, Atacado 10+ €25 e 50+ sortidos €20"
              className="px-3 py-1 rounded-lg text-[11px] font-mono-sku font-extrabold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/30 flex items-center gap-1 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Varejo €45 / Atacado €25 / +50 un €20 (Todos)</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyStandardPricingAll(100)}
              title="Definir todos os produtos para: Varejo €45, Atacado 10+ €25 e 100+ sortidos €20"
              className="px-3 py-1 rounded-lg text-[11px] font-mono-sku font-extrabold bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-300 border border-teal-400/40 hover:bg-teal-500/30 flex items-center gap-1 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Varejo €45 / Atacado €25 / +100 un €20 (Todos)</span>
            </button>
            {[1, 5, 10, 15, 20, 25, 30, 33, 35, 40, 50, 75, 100].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickApplyValue(val)}
                title={`Definir atacado imediatamente como € ${val} aos ${
                  bulkPricingTarget === 'all' ? 'filtrados' : 'selecionados'
                }`}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-sku font-bold transition-all border ${
                  parseFloat(bulkWholesalePrice) === val
                    ? 'bg-amber-400 text-black border-amber-400 shadow-sm'
                    : 'bg-black/40 text-zinc-300 border-white/10 hover:border-amber-400/50 hover:text-amber-300'
                }`}
              >
                € {val}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectAllFiltered(true)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono-sku text-zinc-300 hover:text-white transition-colors"
            >
              Marcar Todos ({filtered.length})
            </button>
            <button
              type="button"
              onClick={() => handleSelectAllFiltered(false)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono-sku text-zinc-400 hover:text-white transition-colors"
            >
              Desmarcar Todos
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar: Brand, Category, Store and Search */}
      <div className="bg-[#181718] p-4 rounded-2xl border border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-jakarta">
        <div>
          <label className="text-[10px] font-mono-sku text-zinc-400 block mb-1">Filtrar por Busca:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nome, SKU ou marca..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono-sku text-zinc-400 block mb-1">Marca / Silhueta:</label>
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">Todas as Marcas ({brands.length})</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-mono-sku text-zinc-400 block mb-1">Categoria:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">Todas as Categorias ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-mono-sku text-zinc-400 block mb-1">Unidade / Loja:</label>
          <select
            value={filterStore}
            onChange={(e) => setFilterStore(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">Todas as Unidades</option>
            {partnerStores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-[#181718] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-jakarta">
            <thead className="bg-[#121112] text-zinc-400 uppercase font-mono-sku text-[10px] border-b border-white/10">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={(e) => handleSelectAllFiltered(e.target.checked)}
                    className="w-4 h-4 rounded bg-black/60 border-white/20 text-amber-400 focus:ring-amber-400 accent-amber-400 cursor-pointer"
                    title="Selecionar todos os produtos visíveis"
                  />
                </th>
                <th className="p-3.5">Modelo & SKU</th>
                <th className="p-3.5">Marca / Categoria</th>
                <th className="p-3.5">Varejo Sugerido</th>
                <th className="p-3.5">Atacado (10+ un)</th>
                <th className="p-3.5">Margem B2B</th>
                <th className="p-3.5">Origem</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {filtered.map((prod) => {
                const isSelected = selectedProductIds.has(prod.id);
                return (
                  <tr
                    key={prod.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-amber-400/5 hover:bg-amber-400/10' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectProduct(prod.id)}
                        className="w-4 h-4 rounded bg-black/60 border-white/20 text-amber-400 focus:ring-amber-400 accent-amber-400 cursor-pointer"
                      />
                    </td>

                    <td className="p-3.5 flex items-center gap-3">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-lg bg-black/40 p-1 object-contain border border-white/5"
                      />
                      <div>
                        <span className="font-mono-sku text-[10px] text-amber-400 font-bold block">
                          #{prod.sku}
                        </span>
                        <span className="font-syne font-bold text-white text-xs">{prod.name}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-white block">{prod.brand}</span>
                      <span className="text-zinc-500 text-[11px] font-mono-sku">{prod.category}</span>
                    </td>

                    <td className="p-3.5 font-mono-sku">
                      {editingRowId === prod.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-500 font-bold text-xs">€</span>
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            value={inlineRetail}
                            onChange={(e) => setInlineRetail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineEdit(prod)}
                            className="w-20 px-2 py-1 bg-black/90 border border-amber-400/80 rounded text-white font-mono-sku text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none"
                            autoFocus
                            title="Editar Preço de Varejo Sugerido"
                          />
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1.5 group/price cursor-pointer hover:text-amber-300 transition-colors"
                          onClick={() => handleStartInlineEdit(prod)}
                          title="Clique para editar Varejo Sugerido"
                        >
                          <span className="font-semibold text-white group-hover/price:text-amber-300">
                            {formatCurrency(prod.retailPrice)}
                          </span>
                          <Pencil className="w-3 h-3 text-zinc-500 opacity-0 group-hover/price:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 font-mono-sku">
                      {editingRowId === prod.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-amber-500 font-bold text-xs">€</span>
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            value={inlineWholesale}
                            onChange={(e) => setInlineWholesale(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineEdit(prod)}
                            className="w-20 px-2 py-1 bg-black/90 border border-amber-400 rounded text-amber-300 font-mono-sku text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none"
                            title="Editar Preço de Atacado B2B"
                          />
                        </div>
                      ) : (
                        <div
                          className="flex flex-col group/price cursor-pointer hover:text-amber-200 transition-colors"
                          onClick={() => handleStartInlineEdit(prod)}
                          title="Clique para editar Valor de Atacado"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-amber-300">
                              {formatCurrency(prod.wholesalePrice)}
                            </span>
                            <Pencil className="w-3 h-3 text-amber-400 opacity-0 group-hover/price:opacity-100 transition-opacity" />
                          </div>
                          <span className="text-[10px] text-emerald-400 font-mono-sku font-semibold flex items-center gap-0.5">
                            <span>{prod.volumeWholesaleQty || 50}+:</span>
                            <span>{formatCurrency(prod.volumeWholesalePrice ?? 20)}</span>
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 font-mono-sku">
                      {editingRowId === prod.id ? (
                        (() => {
                          const w = parseFloat(inlineWholesale.replace(',', '.'));
                          const r = parseFloat(inlineRetail.replace(',', '.'));
                          if (!isNaN(w) && w > 0 && !isNaN(r)) {
                            const m = Math.round(((r - w) / w) * 100);
                            return (
                              <span className={m >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                +{m}%
                              </span>
                            );
                          }
                          return <span className="text-zinc-500 font-bold">--</span>;
                        })()
                      ) : (
                        <span className="text-emerald-400 font-bold">+{prod.profitMarginPct}%</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="text-[10px] font-mono-sku px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
                        {prod.originSource === 'pdf_extracted'
                          ? 'Catálogo PDF'
                          : prod.originSource === 'curated'
                          ? 'Curadoria Central'
                          : 'Manual'}
                      </span>
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      {editingRowId === prod.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveInlineEdit(prod)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
                            title="Salvar preços alterados"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Salvar</span>
                          </button>
                          <button
                            onClick={() => setEditingRowId(null)}
                            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Cancelar edição"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenFullEditModal(prod)}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-200 font-syne font-bold text-[11px] flex items-center gap-1 transition-all active:scale-95 shadow-sm cursor-pointer"
                            title="Editar dados, foto principal e segunda imagem deste modelo"
                          >
                            <SlidersHorizontal className="w-3 h-3 text-amber-400" />
                            <span>Editar Modelo & Fotos</span>
                          </button>
                          <button
                            onClick={() => handleOpenPriceModal(prod)}
                            className="px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 font-syne font-bold text-[11px] flex items-center gap-1 transition-all active:scale-95 shadow-sm cursor-pointer"
                            title="Abrir painel para editar Varejo Sugerido e Atacado"
                          >
                            <Pencil className="w-3 h-3 text-amber-400" />
                            <span>Editar Preços</span>
                          </button>
                          <button
                            onClick={() => onDeleteProduct(prod.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 cursor-pointer"
                            title="Excluir produto do catálogo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Product Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#1c1b1c] border border-white/15 rounded-3xl p-6 shadow-2xl text-white">
            <h3 className="text-lg font-syne font-bold mb-1">Cadastrar Tênis Manualmente</h3>
            <p className="text-xs text-zinc-400 font-jakarta mb-4">
              Preencha os dados do tênis para cadastro direto no estoque da KicksLuxe.
            </p>

            <form onSubmit={handleCreate} className="space-y-3 font-jakarta text-xs">
              <div>
                <label className="block text-zinc-300 mb-1 font-semibold">Nome do Modelo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Air Jordan 4 Retro Military Blue"
                  value={newProd.name}
                  onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">Referência / SKU</label>
                  <input
                    type="text"
                    required
                    value={newProd.sku}
                    onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-mono-sku focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">Marca</label>
                  <input
                    type="text"
                    required
                    value={newProd.brand}
                    onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">Preço Varejo (€)</label>
                  <input
                    type="number"
                    value={newProd.retailPrice}
                    onChange={(e) => setNewProd({ ...newProd, retailPrice: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-mono-sku"
                  />
                </div>
                <div>
                  <label className="block text-amber-300 mb-1 font-semibold">Preço Atacado 10+ (€)</label>
                  <input
                    type="number"
                    value={newProd.wholesalePrice}
                    onChange={(e) => setNewProd({ ...newProd, wholesalePrice: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-amber-400/40 rounded-xl p-2.5 text-amber-300 font-mono-sku"
                  />
                </div>
                <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-emerald-300 font-semibold text-xs flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Atacado Lote Sortido Especial</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setNewProd({ ...newProd, volumeWholesaleQty: 50 })}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono-sku font-bold cursor-pointer ${
                          (newProd.volumeWholesaleQty || 50) === 50 ? 'bg-emerald-400 text-black' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        +50 pares
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewProd({ ...newProd, volumeWholesaleQty: 100 })}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono-sku font-bold cursor-pointer ${
                          newProd.volumeWholesaleQty === 100 ? 'bg-emerald-400 text-black' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        +100 pares
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-mono-sku font-bold">€</span>
                    <input
                      type="number"
                      value={newProd.volumeWholesalePrice ?? 20}
                      onChange={(e) => setNewProd({ ...newProd, volumeWholesalePrice: Number(e.target.value) })}
                      placeholder="20"
                      className="w-24 bg-black/60 border border-emerald-500/40 rounded-lg p-1.5 text-emerald-300 font-mono-sku font-bold text-xs"
                    />
                    <span className="text-[10px] text-zinc-400 font-mono-sku">
                      Valor por par comprando acima de {newProd.volumeWholesaleQty || 50} pares sortidos
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-semibold">URL da Imagem</label>
                <input
                  type="text"
                  value={newProd.image}
                  onChange={(e) => setNewProd({ ...newProd, image: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-semibold">Descrição do Sapato</label>
                <textarea
                  rows={2}
                  value={newProd.description}
                  onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-syne font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-syne font-bold"
                >
                  Salvar Tênis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vercel Catalog Synchronization Explanation Modal */}
      {showVercelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            className="w-full max-w-2xl bg-[#1a191c] border border-blue-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-zinc-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-syne font-bold text-base text-white">
                    Sincronização com a Vercel
                  </h4>
                  <p className="text-xs text-zinc-400 font-jakarta">
                    Entenda por que aqui há {products.length} modelos e na Vercel inicial há 18
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowVercelModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-jakarta leading-relaxed">
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-blue-200 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-blue-300">
                  <Info className="w-4 h-4 shrink-0" />
                  Como funciona o armazenamento:
                </p>
                <p>
                  Quando a IA extrai modelos de PDFs no seu navegador, eles são salvos no banco local deste dispositivo (<strong className="text-white">IndexedDB / LocalStorage</strong>). A Vercel hospeda o código estático do Git, e lê o arquivo base <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300">src/data/initialProducts.ts</code> (que continha os 18 modelos iniciais).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <span className="text-[10px] font-mono-sku uppercase text-amber-400 font-bold block">
                    Método 1 • Permanente na Vercel (Recomendado)
                  </span>
                  <p className="text-zinc-300 text-[11px]">
                    Substitua o arquivo <code className="text-amber-300">src/data/initialProducts.ts</code> do seu repositório com todos os {products.length} modelos atuais. Todos os visitantes da Vercel verão os {products.length} modelos em Euros!
                  </p>
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleExportTypeScriptFile}
                      className="w-full py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-syne font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar initialProducts.ts</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyTypeScriptCode}
                      className="w-full py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-[11px] font-mono-sku flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedCode ? 'Código Copiado!' : 'Copiar Código TS'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <span className="text-[10px] font-mono-sku uppercase text-emerald-400 font-bold block">
                    Método 2 • Imediato no Navegador da Vercel
                  </span>
                  <p className="text-zinc-300 text-[11px]">
                    Baixe o backup JSON agora. Ao abrir seu link na Vercel, acesse o SuperAdmin &gt; Inventário e clique em <strong className="text-emerald-300">"Importar JSON"</strong> para carregar todos os modelos instantaneamente.
                  </p>
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleExportJSON}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-syne font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Catálogo (.JSON)</span>
                    </button>
                    <label className="w-full py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-[11px] font-mono-sku flex items-center justify-center gap-1.5 cursor-pointer text-center">
                      <Upload className="w-3 h-3 text-emerald-400" />
                      <span>Importar Backup (.JSON)</span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        accept=".json"
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowVercelModal(false)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-syne font-semibold text-xs"
              >
                Entendido, Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Price Edit Modal for Single Product */}
      {priceModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#1c1b1c] border border-amber-400/30 rounded-3xl p-6 shadow-2xl text-white relative">
            <button
              onClick={() => setPriceModalProduct(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <img
                src={priceModalProduct.image}
                alt={priceModalProduct.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-xl bg-black/50 p-1 object-contain border border-white/10 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="font-mono-sku text-[10px] text-amber-400 font-bold block">
                  #{priceModalProduct.sku} • {priceModalProduct.brand}
                </span>
                <h3 className="font-syne font-bold text-base text-white truncate">
                  {priceModalProduct.name}
                </h3>
                <span className="text-[11px] text-zinc-400 font-jakarta block">
                  Categoria: {priceModalProduct.category}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-4 font-jakarta text-xs">
              {/* Image Editor directly inside Price Modal */}
              <div className="bg-black/40 p-3.5 rounded-2xl border border-white/10 space-y-3">
                <span className="text-[10px] font-mono-sku text-amber-300 font-bold block uppercase">
                  Fotos do Modelo (1ª e 2ª Imagem):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono-sku text-zinc-300 block font-semibold">
                        Foto 1 (Principal)
                      </label>
                      <label className="text-[10px] font-mono-sku text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/10 transition-colors">
                        <Upload className="w-2.5 h-2.5" />
                        <span>Upload Foto 1</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePriceModalFileUpload(e, 'primary')}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {modalImage ? (
                          <img src={modalImage} alt="Foto 1" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[9px] text-zinc-600">Sem foto</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={modalImage}
                        onChange={(e) => setModalImage(e.target.value)}
                        placeholder="https://exemplo.com/foto1.png"
                        className="w-full bg-[#121113] border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono-sku focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono-sku text-emerald-300 block font-semibold">
                        Foto 2 (Segunda Imagem / Ângulo 2)
                      </label>
                      <label className="text-[10px] font-mono-sku text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 transition-colors">
                        <Upload className="w-2.5 h-2.5" />
                        <span>Upload Foto 2</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePriceModalFileUpload(e, 'secondary')}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-black/60 border border-emerald-500/20 flex items-center justify-center overflow-hidden shrink-0">
                        {modalSecondaryImage ? (
                          <img src={modalSecondaryImage} alt="Foto 2" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[9px] text-zinc-600">Sem 2ª</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={modalSecondaryImage}
                        onChange={(e) => setModalSecondaryImage(e.target.value)}
                        placeholder="URL da segunda imagem"
                        className="w-full bg-[#121113] border border-emerald-500/40 rounded-xl px-2.5 py-1.5 text-xs text-emerald-300 font-mono-sku focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Wholesale Price Field */}
                <div className="bg-black/30 p-3.5 rounded-2xl border border-white/10">
                  <label className="block text-amber-300 font-syne font-bold mb-1.5 flex items-center justify-between">
                    <span>Preço de Atacado B2B</span>
                    <span className="text-[10px] font-mono-sku text-zinc-400 font-normal">10+ unidades</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-amber-400 font-mono-sku font-bold">€</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={modalWholesale}
                      onChange={(e) => setModalWholesale(e.target.value)}
                      placeholder="Ex: 25.00"
                      className="w-full bg-[#121113] border border-amber-400/40 rounded-xl pl-8 pr-3 py-2 text-white font-mono-sku font-bold text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Valor faturado ao lojista no lote.
                  </p>
                </div>

                {/* Suggested Retail Price Field */}
                <div className="bg-black/30 p-3.5 rounded-2xl border border-white/10">
                  <label className="block text-zinc-200 font-syne font-bold mb-1.5 flex items-center justify-between">
                    <span>Varejo Sugerido</span>
                    <span className="text-[10px] font-mono-sku text-zinc-400 font-normal">Público Final</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-400 font-mono-sku font-bold">€</span>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={modalRetail}
                      onChange={(e) => setModalRetail(e.target.value)}
                      placeholder="Ex: 140.00"
                      className="w-full bg-[#121113] border border-white/20 rounded-xl pl-8 pr-3 py-2 text-white font-mono-sku font-bold text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Preço de revenda sugerido na loja.
                  </p>
                </div>

                {/* Volume Wholesale Tier Field */}
                <div className="sm:col-span-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-3.5 rounded-2xl border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-emerald-300 font-syne font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Preço para Lote de Volume Sortido</span>
                    </label>
                    <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-emerald-500/30">
                      <button
                        type="button"
                        onClick={() => setModalVolumeQty(50)}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-mono-sku font-bold transition-all cursor-pointer ${
                          modalVolumeQty === 50 ? 'bg-emerald-400 text-black' : 'text-zinc-400 hover:text-emerald-300'
                        }`}
                      >
                        +50 pares
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalVolumeQty(100)}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-mono-sku font-bold transition-all cursor-pointer ${
                          modalVolumeQty === 100 ? 'bg-emerald-400 text-black' : 'text-zinc-400 hover:text-emerald-300'
                        }`}
                      >
                        +100 pares
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-emerald-400 font-mono-sku font-bold">€</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={modalVolumePrice}
                        onChange={(e) => setModalVolumePrice(e.target.value)}
                        placeholder="Ex: 20.00"
                        className="w-full bg-[#121113] border border-emerald-500/40 rounded-xl pl-8 pr-3 py-2 text-emerald-300 font-mono-sku font-bold text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                      />
                    </div>
                    <p className="text-[11px] text-emerald-300/80 font-mono-sku leading-tight">
                      Ao atingir <strong>{modalVolumeQty}+</strong> pares sortidos no carrinho, o valor deste par cai automaticamente para <strong>€ {modalVolumePrice || '20'}</strong>!
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Markup Presets */}
              <div>
                <label className="block text-zinc-300 font-syne font-semibold mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>Calcular Varejo com Margem Rápida sobre Atacado:</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { label: '+80%', val: 80 },
                    { label: '+100% (2x)', val: 100 },
                    { label: '+150%', val: 150 },
                    { label: '+200% (3x)', val: 200 },
                    { label: '+250%', val: 250 },
                    { label: '+300% (4x)', val: 300 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => handleApplyMarkupToModal(preset.val)}
                      className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-amber-400/20 border border-white/10 hover:border-amber-400/40 text-[11px] font-mono-sku text-zinc-300 hover:text-amber-200 font-bold transition-all text-center cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Profitability Metrics */}
              {(() => {
                const w = parseFloat(modalWholesale.replace(',', '.'));
                const r = parseFloat(modalRetail.replace(',', '.'));
                const hasValid = !isNaN(w) && w > 0 && !isNaN(r) && r > 0;
                const profitPerPair = hasValid ? r - w : 0;
                const marginPct = hasValid ? Math.round(((r - w) / w) * 100) : 0;

                return (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-black/60 to-black/40 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono-sku uppercase text-zinc-400 block font-semibold">
                        Lucro Bruto Estimado / Par
                      </span>
                      <span className="text-base font-syne font-extrabold text-white">
                        {hasValid ? `€ ${profitPerPair.toFixed(2)}` : '--'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono-sku uppercase text-zinc-400 block font-semibold">
                        Margem Percentual B2B
                      </span>
                      <span
                        className={`text-base font-mono-sku font-extrabold ${
                          marginPct >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {hasValid ? `+${marginPct}%` : '--'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPriceModalProduct(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 font-syne font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePriceModal}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-syne font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Salvar Preços Atualizados</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Dedicated Complete Product Edit Modal */}
      {editModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#1c1b1c] border border-amber-400/40 rounded-3xl p-6 shadow-2xl text-white relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setEditModalProduct(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
              <SlidersHorizontal className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-syne font-bold text-lg text-white">Editar Modelo Completo & Fotos</h3>
                <p className="text-xs text-zinc-400 font-jakarta">
                  Altere a imagem principal, a <strong>segunda imagem</strong>, preços de atacado e dados cadastrais.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4 font-jakarta text-xs">
              {/* Photo Previews & URL Inputs for Image 1 and Image 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Photo 1: Principal */}
                <div className="bg-black/40 p-3.5 rounded-2xl border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-sku text-[11px] text-amber-300 font-bold uppercase">
                      Foto 1 (Principal)
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono-sku">Capa do Card</span>
                  </div>
                  <div className="w-full h-28 bg-[#121113] rounded-xl border border-white/10 flex items-center justify-center overflow-hidden p-2">
                    {fullEditImage ? (
                      <img
                        src={fullEditImage}
                        alt="Foto 1"
                        className="w-full h-full object-contain filter drop-shadow"
                      />
                    ) : (
                      <span className="text-zinc-600 text-xs font-mono-sku">Sem imagem</span>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-mono-sku text-zinc-300 block mb-1">URL da Imagem:</label>
                    <input
                      type="text"
                      value={fullEditImage}
                      onChange={(e) => setFullEditImage(e.target.value)}
                      placeholder="https://exemplo.com/foto1.png"
                      className="w-full bg-[#141314] border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono-sku focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 cursor-pointer text-[11px] transition-colors">
                    <Upload className="w-3 h-3 text-amber-400" />
                    <span>Upload Foto 1</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFullEditFileUpload(e, 'primary')}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Photo 2: Segunda Imagem / Ângulo 2 */}
                <div className="bg-black/40 p-3.5 rounded-2xl border border-emerald-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-sku text-[11px] text-emerald-300 font-bold uppercase">
                      Foto 2 (Segunda Imagem)
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-mono-sku">Ângulo / Detalhe</span>
                  </div>
                  <div className="w-full h-28 bg-[#121113] rounded-xl border border-white/10 flex items-center justify-center overflow-hidden p-2">
                    {fullEditSecondaryImage ? (
                      <img
                        src={fullEditSecondaryImage}
                        alt="Foto 2"
                        className="w-full h-full object-contain filter drop-shadow"
                      />
                    ) : (
                      <span className="text-zinc-600 text-xs font-mono-sku">Sem 2ª imagem</span>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-mono-sku text-zinc-300 block mb-1">URL da Segunda Imagem:</label>
                    <input
                      type="text"
                      value={fullEditSecondaryImage}
                      onChange={(e) => setFullEditSecondaryImage(e.target.value)}
                      placeholder="https://exemplo.com/foto2.png"
                      className="w-full bg-[#141314] border border-emerald-500/30 rounded-xl px-2.5 py-1.5 text-xs text-emerald-300 font-mono-sku focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 cursor-pointer text-[11px] transition-colors">
                    <Upload className="w-3 h-3 text-emerald-400" />
                    <span>Upload Foto 2</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFullEditFileUpload(e, 'secondary')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Basic Info: Name, SKU, Brand, Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono-sku text-zinc-300 block mb-1 font-semibold">Nome do Modelo</label>
                  <input
                    type="text"
                    value={fullEditName}
                    onChange={(e) => setFullEditName(e.target.value)}
                    className="w-full bg-[#141314] border border-white/20 rounded-xl px-3 py-2 text-white font-syne font-bold text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono-sku text-zinc-300 block mb-1 font-semibold">Código SKU</label>
                  <input
                    type="text"
                    value={fullEditSku}
                    onChange={(e) => setFullEditSku(e.target.value)}
                    className="w-full bg-[#141314] border border-white/20 rounded-xl px-3 py-2 text-white font-mono-sku font-bold text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono-sku text-zinc-300 block mb-1 font-semibold">Marca / Grife</label>
                  <input
                    type="text"
                    value={fullEditBrand}
                    onChange={(e) => setFullEditBrand(e.target.value)}
                    className="w-full bg-[#141314] border border-white/20 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono-sku text-zinc-300 block mb-1 font-semibold">Categoria</label>
                  <input
                    type="text"
                    value={fullEditCategory}
                    onChange={(e) => setFullEditCategory(e.target.value)}
                    className="w-full bg-[#141314] border border-white/20 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="p-3.5 bg-black/40 rounded-2xl border border-white/10 space-y-3">
                <span className="text-[10px] font-mono-sku text-amber-300 font-bold block uppercase">
                  Valores de Comercialização (€)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono-sku text-amber-300 block mb-1 font-semibold">
                      Atacado 10+ (€)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-amber-400 font-mono-sku font-bold">€</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={fullEditWholesale}
                        onChange={(e) => setFullEditWholesale(e.target.value)}
                        className="w-full bg-[#141314] border border-amber-400/50 rounded-xl pl-7 pr-2 py-1.5 text-xs text-amber-300 font-mono-sku font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono-sku text-zinc-300 block mb-1 font-semibold">
                      Varejo Sugerido (€)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-zinc-400 font-mono-sku font-bold">€</span>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        value={fullEditRetail}
                        onChange={(e) => setFullEditRetail(e.target.value)}
                        className="w-full bg-[#141314] border border-white/20 rounded-xl pl-7 pr-2 py-1.5 text-xs text-white font-mono-sku font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-mono-sku text-emerald-300 block font-semibold">
                        Lote Volume (€)
                      </label>
                      <button
                        type="button"
                        onClick={() => setFullEditVolumeQty(fullEditVolumeQty === 50 ? 100 : 50)}
                        className="text-[9px] font-mono-sku text-emerald-400 font-bold hover:underline"
                      >
                        +{fullEditVolumeQty} un
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-emerald-400 font-mono-sku font-bold">€</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={fullEditVolumePrice}
                        onChange={(e) => setFullEditVolumePrice(e.target.value)}
                        className="w-full bg-[#141314] border border-emerald-500/40 rounded-xl pl-7 pr-2 py-1.5 text-xs text-emerald-300 font-mono-sku font-bold focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Badge & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono-sku text-zinc-300 block mb-1 font-semibold">Selo / Badge</label>
                  <input
                    type="text"
                    value={fullEditBadge}
                    onChange={(e) => setFullEditBadge(e.target.value)}
                    placeholder="Ex: GRADE DISPONÍVEL, HYPE, BEST-SELLER"
                    className="w-full bg-[#141314] border border-white/20 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono-sku text-zinc-300 block mb-1 font-semibold">Descrição Rápida</label>
                  <input
                    type="text"
                    value={fullEditDescription}
                    onChange={(e) => setFullEditDescription(e.target.value)}
                    placeholder="Detalhes dos materiais e acabamento..."
                    className="w-full bg-[#141314] border border-white/20 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEditModalProduct(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveFullEditModal}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-syne font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Salvar Modelo Completo & Fotos</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
