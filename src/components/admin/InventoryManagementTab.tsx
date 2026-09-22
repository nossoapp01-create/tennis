import React, { useState } from 'react';
import { Layers, Plus, Trash2, Edit2, Search, Filter, ShieldCheck, Tag } from 'lucide-react';
import { SneakerProduct, PartnerStore } from '../../types';

interface InventoryManagementTabProps {
  products: SneakerProduct[];
  partnerStores: PartnerStore[];
  onAddProduct: (product: SneakerProduct) => void;
  onDeleteProduct: (productId: string) => void;
}

export const InventoryManagementTab: React.FC<InventoryManagementTabProps> = ({
  products,
  partnerStores,
  onAddProduct,
  onDeleteProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStore, setFilterStore] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newProd, setNewProd] = useState<Partial<SneakerProduct>>({
    name: '',
    sku: `KL-${Math.floor(1000 + Math.random() * 9000)}`,
    brand: 'Jordan',
    category: 'High-Top',
    retailPrice: 990,
    wholesalePrice: 420,
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

  const fmt = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.sku) return;

    const retail = newProd.retailPrice || 890;
    const wholesale = newProd.wholesalePrice || 390;
    const margin = Math.round(((retail - wholesale) / wholesale) * 100);

    const created: SneakerProduct = {
      id: `prod-${Date.now()}`,
      name: newProd.name || '',
      sku: newProd.sku || `KL-${Date.now().toString().slice(-4)}`,
      brand: newProd.brand || 'Original',
      category: newProd.category || 'Retro Runner',
      retailPrice: retail,
      wholesalePrice: wholesale,
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

  return (
    <div className="space-y-6">
      {/* Top Banner and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1e1d1f] p-4 rounded-2xl border border-white/10">
        <div>
          <h3 className="font-syne font-bold text-base text-white">
            Inventário Central & Estoque por Unidade
          </h3>
          <p className="text-xs text-zinc-400 font-jakarta mt-0.5">
            Total de {products.length} modelos cadastrados no ecossistema KicksLuxe.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-syne font-bold text-xs flex items-center gap-1.5 shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Tênis Manual</span>
        </button>
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
              {filtered.map((prod) => (
                <tr key={prod.id} className="hover:bg-white/[0.02] transition-colors">
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

                  <td className="p-3.5 font-mono-sku font-semibold text-white">
                    {fmt(prod.retailPrice)}
                  </td>

                  <td className="p-3.5 font-mono-sku font-bold text-amber-300">
                    {fmt(prod.wholesalePrice)}
                  </td>

                  <td className="p-3.5 font-mono-sku">
                    <span className="text-emerald-400 font-bold">+{prod.profitMarginPct}%</span>
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

                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => onDeleteProduct(prod.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Excluir produto do catálogo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
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
                  <label className="block text-zinc-300 mb-1 font-semibold">Preço Varejo (R$)</label>
                  <input
                    type="number"
                    value={newProd.retailPrice}
                    onChange={(e) => setNewProd({ ...newProd, retailPrice: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-mono-sku"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1 font-semibold">Preço Atacado (R$)</label>
                  <input
                    type="number"
                    value={newProd.wholesalePrice}
                    onChange={(e) => setNewProd({ ...newProd, wholesalePrice: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-mono-sku"
                  />
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
    </div>
  );
};
