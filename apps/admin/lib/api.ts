const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ts_admin_token');
}

export function setToken(t: string) {
  localStorage.setItem('ts_admin_token', t);
}

export function clearToken() {
  localStorage.removeItem('ts_admin_token');
}

type FetchOptions = RequestInit & { auth?: boolean };

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { auth = true, headers: extra = {}, ...rest } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extra as Record<string, string>),
  };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body?.message ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Admin / Dashboard + Analytics ─────────────────────────────────────────────
export const adminApi = {
  dashboard: () => apiFetch<DashboardData>('/admin/dashboard'),
  analytics: () => apiFetch<AnalyticsData>('/admin/analytics'),
};

// ── Device Catalog ────────────────────────────────────────────────────────────
export const deviceCatalogApi = {
  list: (params?: { category?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    return apiFetch<DeviceCatalogItem[]>(`/device-catalog?${q}`, { auth: false });
  },
  create: (data: Omit<DeviceCatalogItem, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiFetch<DeviceCatalogItem>('/device-catalog', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Omit<DeviceCatalogItem, 'id' | 'createdAt' | 'updatedAt'>>) =>
    apiFetch<DeviceCatalogItem>(`/device-catalog/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) =>
    apiFetch<void>(`/device-catalog/${id}`, { method: 'DELETE' }),
};

// ── Stores ────────────────────────────────────────────────────────────────────
export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  phone?: string;
  openingHours?: string;
  isActive: boolean;
  createdAt: string;
}

export const storesApi = {
  list: () => apiFetch<Store[]>('/stores/all'),
  create: (data: Omit<Store, 'id' | 'createdAt'>) =>
    apiFetch<Store>('/stores', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Omit<Store, 'id' | 'createdAt'>>) =>
    apiFetch<Store>(`/stores/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/stores/${id}`, { method: 'DELETE' }),
};

// ── Pricing Config ────────────────────────────────────────────────────────────
export const pricingConfigApi = {
  list: () => apiFetch<{ key: string; value: number; label: string }[]>('/pricing-config'),
  upsert: (key: string, value: number, label: string) =>
    apiFetch<{ key: string; value: number; label: string }>(`/pricing-config/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value, label }),
    }),
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ user: AdminUser; token: string }>('/auth/login', {
      auth: false,
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => apiFetch<AdminUser>('/users/me'),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  list: (params?: { category?: string; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    q.set('limit', String(params?.limit ?? 100));
    return apiFetch<{ items: Product[]; total: number; page: number; pages: number }>(`/products?${q}`, { auth: false });
  },

  create: (data: CreateProductPayload) =>
    apiFetch<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<CreateProductPayload>) =>
    apiFetch<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  remove: (id: string) =>
    apiFetch<void>(`/products/${id}`, { method: 'DELETE' }),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    q.set('limit', String(params?.limit ?? 100));
    return apiFetch<{ items: Order[]; total: number; page: number; pages: number }>(`/orders?${q}`);
  },

  ship: (id: string, trackingNumber: string) =>
    apiFetch<Order>(`/orders/${id}/ship`, { method: 'POST', body: JSON.stringify({ trackingNumber }) }),

  deliver: (id: string) =>
    apiFetch<Order>(`/orders/${id}/deliver`, { method: 'POST' }),

  cancel: (id: string) =>
    apiFetch<Order>(`/orders/${id}/cancel`, { method: 'POST' }),
};

// ── Trade-ins ─────────────────────────────────────────────────────────────────
export const tradeInsApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    q.set('limit', String(params?.limit ?? 100));
    return apiFetch<{ items: TradeIn[]; total: number }>(`/trade-ins?${q}`);
  },

  getById: (id: string) => apiFetch<TradeIn>(`/trade-ins/${id}`),

  approve: (id: string, adminNotes?: string) =>
    apiFetch<TradeIn>(`/trade-ins/${id}/approve`, { method: 'POST', body: JSON.stringify({ adminNotes }) }),

  reject: (id: string, adminNotes?: string) =>
    apiFetch<TradeIn>(`/trade-ins/${id}/reject`, { method: 'POST', body: JSON.stringify({ adminNotes }) }),

  counterOffer: (id: string, counterOffer: number, adminNotes?: string) =>
    apiFetch<TradeIn>(`/trade-ins/${id}/counter-offer`, { method: 'POST', body: JSON.stringify({ counterOffer, adminNotes }) }),

  complete: (id: string) =>
    apiFetch<TradeIn>(`/trade-ins/${id}/complete`, { method: 'POST' }),
};

// ── Repairs ───────────────────────────────────────────────────────────────────
export const repairsApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    q.set('limit', String(params?.limit ?? 100));
    return apiFetch<{ items: Repair[]; total: number }>(`/repairs?${q}`);
  },

  getById: (id: string) => apiFetch<Repair>(`/repairs/${id}`),

  setQuote: (id: string, amount: number) =>
    apiFetch<Repair>(`/repairs/${id}/quote`, { method: 'POST', body: JSON.stringify({ quote: amount }) }),

  start: (id: string) =>
    apiFetch<Repair>(`/repairs/${id}/start`, { method: 'POST' }),

  complete: (id: string, adminNotes?: string) =>
    apiFetch<Repair>(`/repairs/${id}/complete`, { method: 'POST', body: JSON.stringify({ adminNotes }) }),

  cancel: (id: string) =>
    apiFetch<Repair>(`/repairs/${id}/cancel`, { method: 'POST' }),
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  brand: string;
  model: string;
  condition: string;
  price: number;
  comparePrice?: number;
  stock: number;
  images: string[];
  specs: Record<string, unknown>;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateProductPayload {
  name: string;
  category: string;
  brand: string;
  model: string;
  condition: string;
  price: number;
  comparePrice?: number;
  stock?: number;
  images?: string[];
  specs?: Record<string, unknown>;
  description?: string;
  isActive?: boolean;
}

export interface Order {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  shippingAddress: Record<string, string>;
  trackingNumber?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
  items: {
    id: string;
    quantity: number;
    price: number;
    product: { id: string; name: string; slug: string; condition: string };
  }[];
}

export interface TradeIn {
  id: string;
  reference: string;
  category: string;
  brand: string;
  model: string;
  specs?: Record<string, string>;
  condition: string;
  offerPrice: number;
  finalPrice?: number;
  counterOffer?: number;
  images: string[];
  status: string;
  fulfillment: string;
  storeId?: string;
  contact: { name: string; email: string; phone: string; address?: string; postcode?: string };
  answers: Record<string, string>;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string };
}

export interface Repair {
  id: string;
  reference: string;
  deviceType: string;
  brand: string;
  model: string;
  issue: string;
  issueNotes?: string;
  images: string[];
  status: string;
  quote?: number;
  fulfillment: string;
  contact: { name: string; email: string; phone: string; address?: string; postcode?: string };
  adminNotes?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string };
}

export interface AnalyticsData {
  summary: { totalRevenue: number; totalOrders: number; totalTradeIns: number; avgOrderValue: number };
  monthly: { month: string; year: number; orders: number; tradeIns: number; repairs: number; revenue: number }[];
  topProducts: { productId: string; name: string; category: string; units: number; revenue: number }[];
  categorySplit: { category: string; pct: number }[];
  topTradeIns: { device: string; count: number; avgOffer: number }[];
}

export interface DeviceCatalogItem {
  id: string;
  brand: string;
  model: string;
  category: string;
  storageOptions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  stats: {
    orders: { total: number; pending: number; revenue: number; revenueThisMonth: number };
    tradeIns: { total: number; pending: number };
    repairs: { total: number; pending: number };
    users: { total: number; newThisMonth: number };
  };
  recentOrders: {
    id: string;
    status: string;
    total: number;
    createdAt: string;
    user?: { id: string; name: string; email: string };
    items: { id: string; quantity: number; price: number; product: { id: string; name: string } }[];
  }[];
  breakdown: {
    orders: { status: string; count: number }[];
    tradeIns: { status: string; count: number }[];
    repairs: { status: string; count: number }[];
  };
}
