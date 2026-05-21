"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { cartApi, type CartItem } from "../lib/api";
import { v4 as uuidv4 } from "uuid";

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  loading: boolean;
  addItem: (item: CartItem) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue>({
  items: [], count: 0, subtotal: 0, loading: false,
  addItem: async () => {}, updateItem: async () => {},
  removeItem: async () => {}, clearCart: async () => {},
});

function ensureCartId(): string {
  let id = localStorage.getItem("ts_cart_id");
  if (!id) { id = uuidv4(); localStorage.setItem("ts_cart_id", id); }
  return id;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureCartId();
    cartApi.get()
      .then(setItems)
      .catch(() => {
        // Redis not available — fallback to localStorage
        const raw = localStorage.getItem("ts_cart_local");
        if (raw) setItems(JSON.parse(raw));
      })
      .finally(() => setLoading(false));
  }, []);

  // Keep localStorage in sync as a fallback
  useEffect(() => {
    if (!loading) localStorage.setItem("ts_cart_local", JSON.stringify(items));
  }, [items, loading]);

  const addItem = useCallback(async (item: CartItem) => {
    try {
      const updated = await cartApi.add(item);
      setItems(updated);
    } catch {
      // Offline fallback
      setItems(prev => {
        const existing = prev.find(i => i.productId === item.productId);
        if (existing) return prev.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i);
        return [...prev, item];
      });
    }
  }, []);

  const updateItem = useCallback(async (productId: string, quantity: number) => {
    try {
      const updated = await cartApi.update(productId, quantity);
      setItems(updated);
    } catch {
      setItems(prev =>
        quantity <= 0 ? prev.filter(i => i.productId !== productId)
          : prev.map(i => i.productId === productId ? { ...i, quantity } : i)
      );
    }
  }, []);

  const removeItem = useCallback(async (productId: string) => {
    try {
      const updated = await cartApi.remove(productId);
      setItems(updated);
    } catch {
      setItems(prev => prev.filter(i => i.productId !== productId));
    }
  }, []);

  const clearCart = useCallback(async () => {
    try { await cartApi.clear(); } catch { /* offline ok */ }
    setItems([]);
  }, []);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, loading, addItem, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
