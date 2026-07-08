import { create } from 'zustand';
import { api } from './api';

export interface CartItem {
  productoId: string;
  nombre: string;
  slug: string;
  imagen: string | null;
  precio: number;
  talla: string;
  color: string;
  cantidad: number;
  stock: number;
}

interface CartResponse {
  items: CartItem[];
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  loaded: boolean;
  fetch: () => Promise<void>;
  add: (item: { productoId: string; talla: string; color: string; cantidad: number }) => Promise<void>;
  setCantidad: (item: {
    productoId: string;
    talla: string;
    color: string;
    cantidad: number;
  }) => Promise<void>;
  reset: () => void;
}

export const useCart = create<CartState>((set) => ({
  items: [],
  subtotal: 0,
  loaded: false,

  fetch: async () => {
    const data = await api<CartResponse>('/api/cart');
    set({ items: data.items, subtotal: data.subtotal, loaded: true });
  },

  add: async (item) => {
    const data = await api<CartResponse>('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    set({ items: data.items, subtotal: data.subtotal, loaded: true });
  },

  setCantidad: async (item) => {
    const data = await api<CartResponse>('/api/cart/items', {
      method: 'PATCH',
      body: JSON.stringify(item),
    });
    set({ items: data.items, subtotal: data.subtotal, loaded: true });
  },

  reset: () => set({ items: [], subtotal: 0 }),
}));
