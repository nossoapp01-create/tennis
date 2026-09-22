export interface SneakerProduct {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: 'High-Top' | 'Low-Top' | 'Retro Runner' | 'Chunky Luxury' | 'Chuteiras / Futebol' | 'Slides / Mule' | 'Corrida & Performance' | 'Kids' | string;
  retailPrice: number;
  wholesalePrice: number;
  minWholesaleQty: number;
  profitMarginPct: number;
  badge?: string;
  image: string;
  description: string;
  materials?: string[];
  specs?: {
    upper?: string;
    midsole?: string;
    cushioning?: string;
    authenticityProof?: string;
    preservationMode?: string;
  };
  sizes: number[];
  stockPerSize?: Record<number, number>;
  storeId: string;
  originSource: 'curated' | 'pdf_extracted' | 'manual' | 'ai_generated';
  createdAt: string;
}

export interface SizeQuantity {
  size: number;
  quantity: number;
}

export interface CartItem {
  product: SneakerProduct;
  mode: 'varejo' | 'atacado';
  sizeQuantities: SizeQuantity[];
  unitPrice: number;
}

export interface PartnerStore {
  id: string;
  name: string;
  owner: string;
  cnpj: string;
  city: string;
  state: string;
  status: 'authorized' | 'pending_review' | 'suspended';
  creditLimit: number;
  allocatedStockCount: number;
  tier: 'Tier 1 - Master Partner' | 'Tier 2 - Boutique Prime' | 'Tier 3 - Lojista Credenciado';
  whatsapp: string;
  joinedDate: string;
}

export interface AIModelStatus {
  geminiConnected: boolean;
  geminiLatencyMs?: number;
  deepseekConnected: boolean;
  deepseekLatencyMs?: number;
  deepseekModelName?: string;
  activeProvider: 'gemini' | 'deepseek';
}

export interface AIConfigSettings {
  preferredProvider: 'gemini' | 'deepseek';
  geminiModel: string;
  deepseekApiKey: string;
  deepseekBaseUrl: string;
  deepseekModel: string;
  autoEnrichWithResearch: boolean;
  defaultTargetStore: string;
}

export interface ExtractedSneakerCandidate {
  id: string;
  name: string;
  brand: string;
  category: string;
  sku: string;
  suggestedRetailPrice: number;
  suggestedWholesalePrice: number;
  image: string;
  description: string;
  materials: string[];
  cushioningTech: string;
  sizes: number[];
  targetStore: string;
  sourcePage?: number;
  isApproved: boolean;
  isSelected?: boolean;
  isEnriching?: boolean;
}
