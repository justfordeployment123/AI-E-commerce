const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ts_token');
}

function getCartId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ts_cart_id');
}

type FetchOptions = RequestInit & { auth?: boolean };

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { auth = false, headers: extraHeaders = {}, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const cartId = getCartId();
  if (cartId) headers['x-cart-id'] = cartId;

  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body?.message ?? res.statusText);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    apiFetch<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  me: () => apiFetch<User>('/users/me', { auth: true }),

  updateProfile: (data: { name?: string; phone?: string; address?: string; city?: string }) =>
    apiFetch<User>('/users/me', { method: 'PATCH', auth: true, body: JSON.stringify(data) }),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  list: (params?: {
    category?: string; brand?: string; condition?: string;
    search?: string; page?: number; limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.brand) q.set('brand', params.brand);
    if (params?.condition) q.set('condition', params.condition);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiFetch<{ items: Product[]; total: number; page: number; pages: number }>(
      `/products?${q}`,
    );
  },

  bySlug: (slug: string) => apiFetch<Product>(`/products/${slug}`),
};

// ── Cart ─────────────────────────────────────────────────────────────────────
export const cartApi = {
  get: () => apiFetch<CartItem[]>('/cart'),

  add: (item: Omit<CartItem, 'quantity'> & { quantity: number }) =>
    apiFetch<CartItem[]>('/cart/items', { method: 'POST', body: JSON.stringify(item) }),

  update: (productId: string, quantity: number) =>
    apiFetch<CartItem[]>(`/cart/items/${productId}`, {
      method: 'PATCH', body: JSON.stringify({ quantity }),
    }),

  remove: (productId: string) =>
    apiFetch<CartItem[]>(`/cart/items/${productId}`, { method: 'DELETE' }),

  clear: () => apiFetch<void>('/cart', { method: 'DELETE' }),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  create: (data: CreateOrderPayload) =>
    apiFetch<Order>('/orders', { method: 'POST', auth: true, body: JSON.stringify(data) }),

  myOrders: () => apiFetch<Order[]>('/orders/my', { auth: true }),
};

// ── Uploads ───────────────────────────────────────────────────────────────────
export const uploadsApi = {
  image: async (file: File): Promise<{ filePath: string; presignedUrl: string }> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ts_token') : null;
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/uploads/image`, { method: 'POST', headers, body: formData });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(body?.message ?? res.statusText);
    }
    return res.json();
  },
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
}

export const storesApi = {
  list: () => apiFetch<Store[]>('/stores'),
};

// ── Trade-ins ─────────────────────────────────────────────────────────────────
export const tradeInsApi = {
  submit: (data: TradeInPayload) =>
    apiFetch<TradeIn>('/trade-ins', { method: 'POST', auth: true, body: JSON.stringify(data) }),

  my: () => apiFetch<TradeIn[]>('/trade-ins/my', { auth: true }),

  myById: (id: string) => apiFetch<TradeInDetail>(`/trade-ins/my/${id}`, { auth: true }),

  acceptCounter: (id: string) =>
    apiFetch<TradeIn>(`/trade-ins/my/${id}/accept-counter`, { method: 'POST', auth: true }),

  declineCounter: (id: string) =>
    apiFetch<TradeIn>(`/trade-ins/my/${id}/decline-counter`, { method: 'POST', auth: true }),

  aiPrice: (data: {
    model: string; brand: string; category: string;
    condition: string; specs: Record<string, string>;
    answers: Record<string, string>; images?: string[];
  }) => apiFetch<{ price: number; aiUsed: boolean }>('/trade-ins/ai-price', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ── Repairs ───────────────────────────────────────────────────────────────────
export const repairsApi = {
  submit: (data: RepairPayload) =>
    apiFetch<Repair>('/repairs', { method: 'POST', auth: true, body: JSON.stringify(data) }),

  my: () => apiFetch<Repair[]>('/repairs/my', { auth: true }),
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  role: string;
  createdAt: string;
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
  rating: number;
  reviewCount: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  slug: string;
  image?: string;
}

export interface CreateOrderPayload {
  items: { productId: string; quantity: number }[];
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    postcode: string;
    country: string;
  };
  paymentMethod?: string;
  notes?: string;
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
  items: {
    id: string;
    quantity: number;
    price: number;
    product: { id: string; name: string; slug: string; images: string[]; condition: string };
  }[];
}

export interface TradeIn {
  id: string;
  reference: string;
  category: string;
  brand: string;
  model: string;
  condition: string;
  offerPrice: number;
  counterOffer?: number;
  status: string;
  fulfillment: string;
  createdAt: string;
}

export interface TradeInDetail extends TradeIn {
  specs: Record<string, string>;
  answers: Record<string, string>;
  adminNotes?: string;
  images: string[];
  contact: Record<string, string>;
  storeId?: string;
  updatedAt: string;
}

export interface Repair {
  id: string;
  reference: string;
  deviceType: string;
  brand: string;
  model: string;
  issue: string;
  status: string;
  quote?: number;
  createdAt: string;
}

export interface TradeInPayload {
  category: string;
  brand: string;
  model: string;
  specs: Record<string, string>;
  condition: string;
  answers: Record<string, string>;
  fulfillment: string;
  offerPrice: number;
  images: string[];
  storeId?: string;
  contact: { name: string; email: string; phone: string; address?: string; postcode?: string };
}

export interface RepairPayload {
  deviceType: string;
  brand: string;
  model: string;
  issue: string;
  issueNotes?: string;
  fulfillment: string;
  images: string[];
  contact: { name: string; email: string; phone: string; address?: string; postcode?: string };
}
