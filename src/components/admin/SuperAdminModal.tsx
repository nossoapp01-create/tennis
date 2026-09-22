import React, { useState } from 'react';
import { X, Sparkles, Store, Layers, ShieldCheck, Zap, Activity } from 'lucide-react';
import { PartnerStoresTab } from './PartnerStoresTab';
import { AIExtractorTab } from './AIExtractorTab';
import { InventoryManagementTab } from './InventoryManagementTab';
import { PartnerStore, SneakerProduct, AIModelStatus } from '../../types';

interface SuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerStores: PartnerStore[];
  onUpdateStoreStatus: (storeId: string, newStatus: 'authorized' | 'pending_review' | 'suspended') => void;
  onAddStore: (store: PartnerStore) => void;
  onUpdateCreditLimit: (storeId: string, newLimit: number) => void;
  products: SneakerProduct[];
  onPublishToCatalog: (candidates: SneakerProduct[]) => void;
  onAddProduct: (product: SneakerProduct) => void;
  onDeleteProduct: (productId: string) => void;
  aiStatus: AIModelStatus;
  onRefreshAIStatus: () => void;
}

export const SuperAdminModal: React.FC<SuperAdminModalProps> = ({
  isOpen,
  onClose,
  partnerStores,
  onUpdateStoreStatus,
  onAddStore,
  onUpdateCreditLimit,
  products,
  onPublishToCatalog,
  onAddProduct,
  onDeleteProduct,
  aiStatus,
  onRefreshAIStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'stores' | 'extractor' | 'inventory'>('extractor');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-6xl bg-[#141314] border border-white/15 rounded-3xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Super Admin Top Header */}
        <div className="p-5 md:px-8 border-b border-white/10 bg-[#1b1a1c] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-syne font-extrabold text-xl text-white">
                SUPER ADMIN VAULT
              </span>
              <span className="text-[10px] font-mono-sku px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold">
                ROOT PRIVILEGES
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-jakarta mt-0.5">
              Controle central de homologação de lojas parceiras, grades de estoque e IA Multimodal de extração.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Live AI Status Indicators */}
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-3 py-1 text-xs font-mono-sku">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <span
                  className={`w-2 h-2 rounded-full ${
                    aiStatus.geminiConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                ></span>
                <span className="text-[11px]">Gemini 3.8 Flash</span>
                {aiStatus.geminiLatencyMs ? (
                  <span className="text-[10px] text-zinc-500">({aiStatus.geminiLatencyMs}ms)</span>
                ) : null}
              </div>

              <div className="h-3 w-px bg-white/10"></div>

              <div className="flex items-center gap-1.5 text-zinc-400">
                <span className="text-[11px]">DeepSeek Proxy</span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-colors"
              aria-label="Fechar Super Admin"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Instant Switcher Navigation Bar (Barra de Navegação com Alternância Instantânea) */}
        <div className="bg-[#181718] px-5 md:px-8 border-b border-white/10 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('extractor')}
            className={`py-3.5 px-4 text-xs font-syne font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'extractor'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Agente IA: Extrator de PDF & Imagens</span>
          </button>

          <button
            onClick={() => setActiveTab('stores')}
            className={`py-3.5 px-4 text-xs font-syne font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'stores'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Lojas Parceiras & Autorizações</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-white">
              {partnerStores.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3.5 px-4 text-xs font-syne font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Gerenciador de Estoque & Modelos</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-white">
              {products.length}
            </span>
          </button>
        </div>

        {/* Tab Body View */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-[#141314]">
          {activeTab === 'extractor' && (
            <AIExtractorTab
              onPublishToCatalog={onPublishToCatalog}
              partnerStores={partnerStores}
              aiStatus={aiStatus}
              onRefreshAIStatus={onRefreshAIStatus}
            />
          )}

          {activeTab === 'stores' && (
            <PartnerStoresTab
              stores={partnerStores}
              onUpdateStoreStatus={onUpdateStoreStatus}
              onAddStore={onAddStore}
              onUpdateCreditLimit={onUpdateCreditLimit}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryManagementTab
              products={products}
              partnerStores={partnerStores}
              onAddProduct={onAddProduct}
              onDeleteProduct={onDeleteProduct}
            />
          )}
        </div>
      </div>
    </div>
  );
};
