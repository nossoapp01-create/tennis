import React, { useState } from 'react';
import { Store, ShieldCheck, CheckCircle2, Clock, AlertTriangle, Plus, DollarSign, MapPin, Phone, Building2 } from 'lucide-react';
import { PartnerStore } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface PartnerStoresTabProps {
  stores: PartnerStore[];
  onUpdateStoreStatus: (storeId: string, newStatus: 'authorized' | 'pending_review' | 'suspended') => void;
  onAddStore: (store: PartnerStore) => void;
  onUpdateCreditLimit: (storeId: string, newLimit: number) => void;
}

export const PartnerStoresTab: React.FC<PartnerStoresTabProps> = ({
  stores,
  onUpdateStoreStatus,
  onAddStore,
  onUpdateCreditLimit,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStore, setNewStore] = useState<Partial<PartnerStore>>({
    name: '',
    owner: '',
    cnpj: '',
    city: '',
    state: 'SP',
    tier: 'Tier 2 - Boutique Prime',
    creditLimit: 300000,
    whatsapp: '',
    status: 'authorized'
  });

  const fmt = (val: number) => formatCurrency(val);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStore.name || !newStore.cnpj) {
      alert('Preencha os campos obrigatórios (Nome e CNPJ).');
      return;
    }

    const created: PartnerStore = {
      id: `store-${Date.now()}`,
      name: newStore.name || '',
      owner: newStore.owner || 'Gerente Responsável',
      cnpj: newStore.cnpj || '',
      city: newStore.city || 'São Paulo',
      state: newStore.state || 'SP',
      status: (newStore.status as any) || 'authorized',
      creditLimit: newStore.creditLimit || 200000,
      allocatedStockCount: 0,
      tier: (newStore.tier as any) || 'Tier 2 - Boutique Prime',
      whatsapp: newStore.whatsapp || '+55 11 99999-0000',
      joinedDate: new Date().toISOString().split('T')[0]
    };

    onAddStore(created);
    setShowAddModal(false);
    setNewStore({
      name: '',
      owner: '',
      cnpj: '',
      city: '',
      state: 'SP',
      tier: 'Tier 2 - Boutique Prime',
      creditLimit: 300000,
      whatsapp: '',
      status: 'authorized'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1e1d1f] p-4 rounded-2xl border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-400" />
            <h3 className="font-syne font-bold text-base text-white">
              Gestão de Lojas Parceiras & Autorizações B2B
            </h3>
          </div>
          <p className="text-xs text-zinc-400 font-jakarta mt-0.5">
            Autorização formal de boutiques parceiras, concessão de linhas de crédito e alocação de grades de estoque.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-syne font-bold text-xs flex items-center gap-1.5 shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Loja</span>
        </button>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((store) => (
          <div
            key={store.id}
            className="bg-[#181718] border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-400/40 transition-all group"
          >
            <div>
              {/* Store Header & Status */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono-sku px-2 py-0.5 rounded bg-white/5 border border-white/10 text-amber-300">
                  {store.tier}
                </span>

                <select
                  value={store.status}
                  onChange={(e) => onUpdateStoreStatus(store.id, e.target.value as any)}
                  className={`text-[10px] font-mono-sku font-bold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                    store.status === 'authorized'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : store.status === 'pending_review'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}
                >
                  <option value="authorized">AUTORIZADA</option>
                  <option value="pending_review">EM ANÁLISE</option>
                  <option value="suspended">SUSPENSA</option>
                </select>
              </div>

              {/* Store Title */}
              <h4 className="text-sm font-syne font-bold text-white group-hover:text-amber-300 transition-colors">
                {store.name}
              </h4>
              <p className="text-[11px] text-zinc-400 font-jakarta mt-0.5">
                Resp: {store.owner}
              </p>

              {/* Data tags */}
              <div className="mt-3 space-y-1.5 text-xs font-mono-sku text-zinc-300 bg-black/30 p-2.5 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>CNPJ: {store.cnpj}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{store.city}, {store.state}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{store.whatsapp}</span>
                </div>
              </div>
            </div>

            {/* Financial & Stock Details */}
            <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
              <div className="flex justify-between items-baseline text-xs font-mono-sku">
                <span className="text-zinc-400">Limite de Crédito B2B:</span>
                <span className="font-syne font-bold text-amber-400">
                  {fmt(store.creditLimit)}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-xs font-mono-sku">
                <span className="text-zinc-400">Pares Alocados em Estoque:</span>
                <span className="font-bold text-white">
                  {store.allocatedStockCount} pares
                </span>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const newLimit = prompt(`Novo limite de crédito para ${store.name} (R$):`, store.creditLimit.toString());
                    if (newLimit && !isNaN(Number(newLimit))) {
                      onUpdateCreditLimit(store.id, Number(newLimit));
                    }
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-syne text-[11px] font-semibold border border-white/10 transition-colors"
                >
                  Ajustar Crédito
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Adding New Partner Store */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#1c1b1c] border border-white/15 rounded-3xl p-6 shadow-2xl text-white">
            <h3 className="text-lg font-syne font-bold mb-1">Cadastrar Nova Loja Parceira</h3>
            <p className="text-xs text-zinc-400 font-jakarta mb-4">
              Insira os dados da boutique para homologação na rede de revenda KicksLuxe.
            </p>

            <form onSubmit={handleCreate} className="space-y-3 font-jakarta text-xs">
              <div>
                <label className="block text-zinc-300 mb-1 font-semibold">Nome da Boutique / Razão Social</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Concept Store Jardins"
                  value={newStore.name}
                  onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">Nome do Responsável</label>
                  <input
                    type="text"
                    placeholder="Ex: Rodrigo Alencar"
                    value={newStore.owner}
                    onChange={(e) => setNewStore({ ...newStore, owner: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">CNPJ</label>
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0001-00"
                    value={newStore.cnpj}
                    onChange={(e) => setNewStore({ ...newStore, cnpj: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">Cidade</label>
                  <input
                    type="text"
                    placeholder="São Paulo"
                    value={newStore.city}
                    onChange={(e) => setNewStore({ ...newStore, city: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">Estado (UF)</label>
                  <input
                    type="text"
                    placeholder="SP"
                    value={newStore.state}
                    onChange={(e) => setNewStore({ ...newStore, state: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">WhatsApp Comercial</label>
                  <input
                    type="text"
                    placeholder="+55 11 99999-0000"
                    value={newStore.whatsapp}
                    onChange={(e) => setNewStore({ ...newStore, whatsapp: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">Limite de Crédito Inicial (R$)</label>
                  <input
                    type="number"
                    value={newStore.creditLimit}
                    onChange={(e) => setNewStore({ ...newStore, creditLimit: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
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
                  Salvar Loja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
