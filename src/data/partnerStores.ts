import { PartnerStore } from '../types';

export const INITIAL_PARTNER_STORES: PartnerStore[] = [
  {
    id: 'central',
    name: 'Cofre Central KicksLuxe (Matriz Logística)',
    owner: 'Matheus Valença (Diretoria Comercial)',
    cnpj: '48.912.834/0001-90',
    city: 'São Paulo',
    state: 'SP',
    status: 'authorized',
    creditLimit: 2500000,
    allocatedStockCount: 1480,
    tier: 'Tier 1 - Master Partner',
    whatsapp: '+55 11 98721-9000',
    joinedDate: '2023-01-15'
  },
  {
    id: 'sp_jardins',
    name: 'Concept Store Jardins',
    owner: 'Rodrigo Alencar',
    cnpj: '32.184.992/0001-44',
    city: 'São Paulo',
    state: 'SP',
    status: 'authorized',
    creditLimit: 380000,
    allocatedStockCount: 142,
    tier: 'Tier 1 - Master Partner',
    whatsapp: '+55 11 99123-4567',
    joinedDate: '2023-05-20'
  },
  {
    id: 'rj_leblon',
    name: 'Atelier Silveira',
    owner: 'Camila Silveira',
    cnpj: '28.901.344/0001-12',
    city: 'Rio de Janeiro',
    state: 'RJ',
    status: 'authorized',
    creditLimit: 320000,
    allocatedStockCount: 98,
    tier: 'Tier 2 - Boutique Prime',
    whatsapp: '+55 21 98877-6655',
    joinedDate: '2023-08-11'
  },
  {
    id: 'curitiba_batel',
    name: 'Batel Vault Kicks',
    owner: 'Guilherme Fontes',
    cnpj: '19.456.789/0001-80',
    city: 'Curitiba',
    state: 'PR',
    status: 'authorized',
    creditLimit: 450000,
    allocatedStockCount: 185,
    tier: 'Tier 1 - Master Partner',
    whatsapp: '+55 41 99988-1122',
    joinedDate: '2023-03-01'
  },
  {
    id: 'bh_lourdes',
    name: 'Lourdes Prime Sneakers',
    owner: 'Felipe Meirelles',
    cnpj: '35.678.901/0001-23',
    city: 'Belo Horizonte',
    state: 'MG',
    status: 'authorized',
    creditLimit: 280000,
    allocatedStockCount: 76,
    tier: 'Tier 2 - Boutique Prime',
    whatsapp: '+55 31 98765-4321',
    joinedDate: '2023-11-04'
  },
  {
    id: 'barueri_alpha',
    name: 'Alphaville Exclusive Drops',
    owner: 'Bruna Mantovani',
    cnpj: '42.333.111/0001-77',
    city: 'Barueri',
    state: 'SP',
    status: 'pending_review',
    creditLimit: 150000,
    allocatedStockCount: 0,
    tier: 'Tier 3 - Lojista Credenciado',
    whatsapp: '+55 11 97654-3210',
    joinedDate: '2025-01-10'
  }
];
