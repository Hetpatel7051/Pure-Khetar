'use client';

import { FormEvent, useMemo, useState } from 'react';
import { signOut } from 'next-auth/react';
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ContactRound,
  IndianRupee,
  Loader2,
  LogOut,
  Mail,
  MessageCircle,
  Minus,
  PackagePlus,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { FALLBACK_PRODUCT_IMAGE } from '@/lib/constants';
import { cn, formatPrice } from '@/lib/utils';

interface Item {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: string[];
  comingSoon: boolean;
  available: boolean;
  category: { name: string };
  categoryId: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  createdAt: Date | string;
}

interface OrderItem {
  id: string;
  quantity?: number;
  weightGrams?: number;
  price: number;
  product?: { name: string; images?: string[] };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  shippingAddress: unknown;
  createdAt: Date | string;
  user: { name: string; email: string; phone: string | null };
  items?: OrderItem[];
}

interface Category {
  id: string;
  name: string;
}

const ORDER_STATUSES = [
  'PENDING',
  'REQUESTED',
  'APPROVED',
  'PAYMENT_PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REJECTED',
] as const;

const CONTACT_STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM'] as const;

function getOrderBadgeStyle(status: string) {
  switch (status) {
    case 'PENDING':
    case 'REQUESTED':
    case 'PAYMENT_PENDING':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'APPROVED':
    case 'PROCESSING':
    case 'SHIPPED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    case 'DELIVERED':
      return 'border-forest/20 bg-forest text-cream';
    case 'CANCELLED':
    case 'REJECTED':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-sage/25 bg-cream text-forest';
  }
}

function getContactBadgeStyle(status: string) {
  switch (status) {
    case 'NEW':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'IN_PROGRESS':
      return 'border-sky-200 bg-sky-50 text-sky-800';
    case 'RESOLVED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    default:
      return 'border-sage/25 bg-cream text-forest/70';
  }
}

function formatShortDate(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatAddress(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    return [obj.line1, obj.address, obj.street, obj.landmark, obj.city, obj.area, obj.pincode]
      .filter((v) => typeof v === 'string' && v.trim().length > 0)
      .join(', ');
  }
  return '';
}

function toWhatsAppUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/**
 * Splits a comma-separated image string while preserving base64 data URLs
 * (which contain a comma after `;base64,`).
 */
function parseImagesInput(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  const results: string[] = [];
  for (const part of trimmed.split(',')) {
    const piece = part.trim();
    if (!piece) continue;
    if (results.length > 0 && /^data:image\/[a-zA-Z0-9+.-]+;base64$/.test(results[results.length - 1])) {
      results[results.length - 1] = `${results[results.length - 1]},${piece}`;
    } else {
      results.push(piece);
    }
  }
  return results;
}

export function AdminDashboard({
  products,
  contacts,
  orders,
  categories,
}: {
  products: Item[];
  contacts: Contact[];
  orders: Order[];
  categories: Category[];
}) {
  const [tab, setTab] = useState<'products' | 'contacts' | 'orders'>('products');
  const refresh = () => window.location.reload();

  const stats = useMemo(() => {
    const activeOrders = orders.filter((o) => !['CANCELLED', 'REJECTED'].includes(o.status));
    const revenue = activeOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const pendingOrders = orders.filter((o) => ['PENDING', 'REQUESTED', 'PAYMENT_PENDING'].includes(o.status)).length;
    const totalStockKg = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
    const lowStockCount = products.filter((p) => !p.comingSoon && p.stock < 15).length;
    const newContacts = contacts.filter((c) => c.status === 'NEW').length;
    return { revenue, pendingOrders, totalStockKg, lowStockCount, newContacts };
  }, [products, contacts, orders]);

  const tabs = [
    { id: 'products' as const, label: 'Vegetables', icon: Boxes, count: products.length, alert: stats.lowStockCount > 0 },
    { id: 'orders' as const, label: 'Orders', icon: ShoppingBag, count: orders.length, alert: stats.pendingOrders > 0 },
    { id: 'contacts' as const, label: 'Contacts', icon: ContactRound, count: contacts.length, alert: stats.newContacts > 0 },
  ];

  return (
    <main className="min-h-screen bg-cream pt-[84px] sm:pt-[92px]">
      {/* Top Command Bar */}
      <header className="border-b border-sage/15 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-terracotta">Kamana Farm · Live Control</p>
            </div>
            <h1 className="font-serif text-2xl font-bold text-forest">Farm Admin Dashboard</h1>
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex min-h-10 items-center gap-2 rounded-full border border-sage/25 bg-cream/60 px-4 text-xs font-bold text-forest transition hover:border-forest hover:bg-forest hover:text-cream"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* Live KPI Strip */}
        <section aria-label="Farm overview" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <div className="rounded-2xl border border-sage/15 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-forest/60">
              <span className="text-xs font-bold uppercase tracking-wider">Active Revenue</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <IndianRupee className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 font-serif text-2xl font-bold text-forest">{formatPrice(stats.revenue)}</p>
            <p className="mt-1 text-xs text-forest/55">Across {orders.length} total orders</p>
          </div>

          <button
            type="button"
            onClick={() => setTab('orders')}
            className="rounded-2xl border border-sage/15 bg-white p-4 text-left shadow-sm transition hover:border-marigold"
          >
            <div className="flex items-center justify-between text-forest/60">
              <span className="text-xs font-bold uppercase tracking-wider">Needs Action</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Clock className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <p className="font-serif text-2xl font-bold text-forest">{stats.pendingOrders}</p>
              {stats.pendingOrders > 0 && (
                <span className="rounded-full bg-marigold/30 px-2 py-0.5 text-[11px] font-bold text-forest">
                  Pending
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-forest/55">Click to review & approve</p>
          </button>

          <button
            type="button"
            onClick={() => setTab('products')}
            className="rounded-2xl border border-sage/15 bg-white p-4 text-left shadow-sm transition hover:border-forest/40"
          >
            <div className="flex items-center justify-between text-forest/60">
              <span className="text-xs font-bold uppercase tracking-wider">Harvest Stock</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-forest/10 text-forest">
                <Boxes className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 font-serif text-2xl font-bold text-forest">{stats.totalStockKg.toFixed(1)} kg</p>
            <p className="mt-1 text-xs text-forest/55">
              {stats.lowStockCount > 0 ? `${stats.lowStockCount} item low on stock` : 'All varieties stocked'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTab('contacts')}
            className="rounded-2xl border border-sage/15 bg-white p-4 text-left shadow-sm transition hover:border-terracotta/50"
          >
            <div className="flex items-center justify-between text-forest/60">
              <span className="text-xs font-bold uppercase tracking-wider">New Enquiries</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta">
                <ContactRound className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <p className="font-serif text-2xl font-bold text-forest">{stats.newContacts}</p>
              {stats.newContacts > 0 && (
                <span className="rounded-full bg-terracotta/15 px-2 py-0.5 text-[11px] font-bold text-terracotta">
                  Unread
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-forest/55">{contacts.length} total customer messages</p>
          </button>
        </section>

        {/* Main Workspace */}
        <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:pb-0" aria-label="Admin sections">
            {tabs.map(({ id, label, icon: Icon, count, alert }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    'flex min-h-12 shrink-0 items-center justify-between gap-3 rounded-2xl px-4 text-sm font-bold transition-all',
                    active
                      ? 'bg-forest text-cream shadow-md'
                      : 'border border-sage/15 bg-white text-forest hover:bg-sage/10',
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  <span
                    className={cn(
                      'flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold',
                      active
                        ? 'bg-white/20 text-cream'
                        : alert
                          ? 'bg-marigold text-forest'
                          : 'bg-cream text-forest/70',
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>

          <section className="min-w-0">
            {tab === 'products' && <Products products={products} categories={categories} refresh={refresh} />}
            {tab === 'contacts' && <Contacts contacts={contacts} refresh={refresh} />}
            {tab === 'orders' && <Orders orders={orders} refresh={refresh} />}
          </section>
        </div>
      </div>
    </main>
  );
}

function Products({
  products,
  categories,
  refresh,
}: {
  products: Item[];
  categories: Category[];
  refresh: () => void;
}) {
  const [editing, setEditing] = useState<Item | null>(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesQuery = p.name.toLowerCase().includes(query.trim().toLowerCase());
      const matchesCat = categoryFilter === 'ALL' || p.categoryId === categoryFilter;
      return matchesQuery && matchesCat;
    });
  }, [products, query, categoryFilter]);

  async function adjustStock(item: Item, delta: number) {
    const nextStock = Math.max(0, Math.round((item.stock + delta) * 100) / 100);
    setBusyId(item.id);
    await fetch(`/api/admin/products/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: item.name,
        slug: item.slug,
        price: item.price,
        stock: nextStock,
        categoryId: item.categoryId,
        available: item.available,
        comingSoon: item.comingSoon,
        images: item.images,
      }),
    });
    setBusyId(null);
    refresh();
  }

  async function handleDelete(item: Item) {
    if (!window.confirm(`Remove "${item.name}" from the shop?`)) return;
    setBusyId(item.id);
    await fetch(`/api/admin/products/${item.id}`, { method: 'DELETE' });
    setBusyId(null);
    refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-forest">Harvest & Vegetables</h2>
          <p className="text-sm text-forest/60">Adjust daily stock, update prices, or add fresh produce</p>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditing({
              id: '',
              name: '',
              slug: '',
              price: 0,
              stock: 25,
              images: [],
              comingSoon: false,
              available: true,
              category: { name: '' },
              categoryId: categories[0]?.id ?? '',
            })
          }
          className="flex min-h-11 items-center gap-2 rounded-full bg-marigold px-5 text-sm font-bold text-forest shadow-sm transition hover:brightness-95"
        >
          <PackagePlus className="h-4 w-4" /> Add Vegetable
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-sage/15 bg-white p-3.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-forest/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter vegetables by name..."
            className="min-h-10 w-full rounded-full border border-sage/20 bg-cream/60 pl-10 pr-4 text-sm text-forest outline-none focus:border-forest"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-bold transition',
              categoryFilter === 'ALL' ? 'bg-forest text-cream' : 'bg-cream text-forest hover:bg-sage/15',
            )}
          >
            All ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryFilter(c.id)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-bold transition',
                categoryFilter === c.id ? 'bg-forest text-cream' : 'bg-cream text-forest hover:bg-sage/15',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Vegetable Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const isLow = !p.comingSoon && p.stock < 15;
          const stockPercent = Math.min(100, Math.round((p.stock / 120) * 100));
          const isBusy = busyId === p.id;
          const cardImage = p.images[0] ?? FALLBACK_PRODUCT_IMAGE;

          return (
            <article
              key={p.id}
              className="flex flex-col justify-between overflow-hidden rounded-3xl border border-sage/15 bg-white shadow-sm transition hover:shadow-md"
            >
              <div>
                <div className="relative h-36 w-full bg-cream">
                  {cardImage.startsWith('data:') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cardImage} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <SmartImage
                      src={cardImage}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  )}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    {p.comingSoon ? (
                      <span className="rounded-full bg-marigold px-2.5 py-1 text-[11px] font-bold text-forest shadow-sm">
                        Coming Soon
                      </span>
                    ) : !p.available ? (
                      <span className="rounded-full bg-zinc-800/85 px-2.5 py-1 text-[11px] font-bold text-white">
                        Hidden
                      </span>
                    ) : isLow ? (
                      <span className="flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                        <AlertTriangle className="h-3 w-3" /> Low Stock
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-forest/90 px-2.5 py-1 text-[11px] font-bold text-cream shadow-sm">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    )}
                  </div>
                  {p.category?.name && (
                    <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold text-forest backdrop-blur">
                      {p.category.name}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold leading-snug text-forest">{p.name}</h3>
                    <span className="shrink-0 rounded-xl bg-cream px-2.5 py-1 font-serif text-sm font-bold text-forest">
                      ₹{p.price}/kg
                    </span>
                  </div>

                  {/* Quick Stock Meter & Stepper */}
                  <div className="mt-4 rounded-2xl border border-sage/15 bg-cream/60 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-forest/65">Available Stock</span>
                      <span className={cn('font-bold', isLow ? 'text-red-700' : 'text-forest')}>
                        {p.stock} kg
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sage/20">
                      <div
                        className={cn('h-full rounded-full transition-all', isLow ? 'bg-red-500' : 'bg-forest')}
                        style={{ width: `${stockPercent}%` }}
                      />
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-forest/55">Quick adjust:</span>
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isBusy || p.stock <= 0}
                          onClick={() => void adjustStock(p, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-sage/25 bg-white text-forest transition hover:bg-forest hover:text-cream disabled:opacity-40"
                          title="Decrease stock by 1 kg"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void adjustStock(p, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-sage/25 bg-white text-forest transition hover:bg-forest hover:text-cream disabled:opacity-40"
                          title="Increase stock by 1 kg"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void adjustStock(p, 5)}
                          className="rounded-full border border-sage/25 bg-white px-2 py-1 text-[11px] font-bold text-forest transition hover:bg-forest hover:text-cream disabled:opacity-40"
                        >
                          +5kg
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 border-t border-sage/10 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setEditing(p)}
                  className="min-h-10 flex-1 rounded-full border border-sage/25 text-xs font-bold text-forest transition hover:border-forest hover:bg-forest hover:text-cream"
                >
                  Edit Details
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void handleDelete(p)}
                  className="flex min-h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-700 transition hover:bg-red-600 hover:text-white disabled:opacity-40"
                  aria-label={`Delete ${p.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {editing && (
        <ProductModal
          product={editing}
          categories={categories}
          close={() => setEditing(null)}
          refresh={refresh}
        />
      )}
    </div>
  );
}

async function compressImageIfNeeded(file: File): Promise<File | Blob> {
  if (!file.type.startsWith('image/') || file.size <= 1.5 * 1024 * 1024) {
    return file;
  }
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_DIM = 1600;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

function ProductModal({
  product,
  categories,
  close,
  refresh,
}: {
  product: Item;
  categories: Category[];
  close: () => void;
  refresh: () => void;
}) {
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [images, setImages] = useState(product.images.join(','));
  const [imageBusy, setImageBusy] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!product.id) {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(autoSlug);
    }
  };

  async function uploadImage(file: File) {
    setImageBusy(true);
    setUploadStatus(`Preparing ${file.name}...`);
    try {
      const preparedFile = await compressImageIfNeeded(file);
      setUploadStatus(`Uploading ${file.name}...`);
      const form = new FormData();
      form.set('file', preparedFile);
      const response = await fetch('/api/admin/products/upload', { method: 'POST', body: form });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.url) {
        // Place new image at the front as primary
        setImages(data.url);
        setUploadStatus('Photo uploaded! Click "Save Vegetable" below to save changes.');
      } else {
        setUploadStatus(null);
        alert(data.error || `Image upload failed (${response.status})`);
      }
    } catch {
      setUploadStatus(null);
      alert('Network error while uploading image.');
    } finally {
      setImageBusy(false);
    }
  }

  async function generateImage(targetName: string) {
    setImageBusy(true);
    setUploadStatus('Generating image with Gemini...');
    try {
      const response = await fetch('/api/admin/products/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: targetName }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.url) {
        setImages(data.url);
        setUploadStatus('AI image generated! Click "Save Vegetable" below to save changes.');
      } else {
        setUploadStatus(null);
        alert(data.error || `AI image generation failed (${response.status})`);
      }
    } catch {
      setUploadStatus(null);
      alert('Network error while generating image.');
    } finally {
      setImageBusy(false);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      name: String(f.get('name')),
      slug: String(f.get('slug')),
      price: Number(f.get('price')),
      stock: Number(f.get('stock')),
      categoryId: String(f.get('categoryId')),
      available: f.get('available') === 'on',
      comingSoon: f.get('comingSoon') === 'on',
      images: parseImagesInput(images),
    };
    const response = await fetch(product.id ? `/api/admin/products/${product.id}` : '/api/admin/products', {
      method: product.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      close();
      refresh();
    } else {
      const result = await response.json().catch(() => null);
      alert(result?.error || 'Unable to save vegetable');
    }
  }

  const previewUrl = parseImagesInput(images)[0];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-forest/45 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-sage/15 pb-4">
          <h3 className="font-serif text-xl font-bold text-forest">{product.id ? 'Edit' : 'Add'} Vegetable</h3>
          <button type="button" onClick={close} className="rounded-full p-1.5 text-forest/60 hover:bg-cream hover:text-forest">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-forest sm:col-span-2">
            Name
            <input
              name="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="mt-1.5 min-h-11 w-full rounded-xl border border-sage/25 px-3.5 text-sm outline-none focus:border-forest"
            />
          </label>
          <label className="text-sm font-semibold text-forest sm:col-span-2">
            Slug
            <input
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="mt-1.5 min-h-11 w-full rounded-xl border border-sage/25 px-3.5 text-sm outline-none focus:border-forest"
            />
          </label>
          <label className="text-sm font-semibold text-forest">
            Price / kg (₹)
            <input
              name="price"
              type="number"
              step="0.01"
              defaultValue={product.price}
              required
              className="mt-1.5 min-h-11 w-full rounded-xl border border-sage/25 px-3.5 text-sm outline-none focus:border-forest"
            />
          </label>
          <label className="text-sm font-semibold text-forest">
            Stock (kg)
            <input
              name="stock"
              type="number"
              step="0.25"
              defaultValue={product.stock}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-sage/25 px-3.5 text-sm outline-none focus:border-forest"
            />
          </label>
          <label className="text-sm font-semibold text-forest sm:col-span-2">
            Category
            <select
              name="categoryId"
              defaultValue={product.categoryId}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-sage/25 bg-white px-3.5 text-sm outline-none focus:border-forest"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="sm:col-span-2">
            <p className="text-sm font-semibold text-forest">Product Image</p>
            {previewUrl && (
              <div className="relative mt-2 h-32 w-full overflow-hidden rounded-2xl border border-sage/20 bg-cream">
                {previewUrl.startsWith('data:') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt={name || 'Preview'} className="h-full w-full object-cover" />
                ) : (
                  <SmartImage src={previewUrl} alt={name || 'Preview'} fill sizes="400px" className="object-cover" />
                )}
              </div>
            )}
            <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
              <label
                className={cn(
                  'flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-sage/25 px-4 text-xs font-bold text-forest transition hover:bg-cream',
                  imageBusy && 'pointer-events-none opacity-50',
                )}
              >
                {imageBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {imageBusy ? 'Uploading...' : 'Upload photo'}
                <input
                  type="file"
                  accept="image/*"
                  disabled={imageBusy}
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) void uploadImage(file);
                  }}
                />
              </label>
              <button
                type="button"
                disabled={imageBusy || !name.trim()}
                onClick={() => void generateImage(name)}
                className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-marigold px-4 text-xs font-bold text-forest disabled:opacity-50"
              >
                {imageBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {imageBusy ? 'Generating...' : 'Generate with Gemini'}
              </button>
            </div>
            {uploadStatus && (
              <p className="mt-2 text-xs font-semibold text-emerald-700">{uploadStatus}</p>
            )}
            <input
              name="images"
              value={images}
              onChange={(e) => setImages(e.target.value)}
              placeholder="Image URL"
              className="mt-2.5 min-h-10 w-full rounded-xl border border-sage/25 px-3.5 text-xs outline-none focus:border-forest"
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-forest">
            <input name="available" type="checkbox" defaultChecked={product.available} className="h-4 w-4 accent-forest" />
            Available in shop
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-forest">
            <input name="comingSoon" type="checkbox" defaultChecked={product.comingSoon} className="h-4 w-4 accent-forest" />
            Coming soon
          </label>
        </div>

        <button
          disabled={imageBusy}
          className="mt-6 min-h-12 w-full rounded-full bg-forest text-sm font-bold text-cream transition hover:bg-forest-l disabled:opacity-50"
        >
          Save Vegetable
        </button>
      </form>
    </div>
  );
}

function Contacts({ contacts, refresh }: { contacts: Contact[]; refresh: () => void }) {
  const [filter, setFilter] = useState<string>('ALL');

  const filtered = useMemo(
    () => (filter === 'ALL' ? contacts : contacts.filter((c) => c.status === filter)),
    [contacts, filter],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-forest">Customer Enquiries</h2>
          <p className="text-sm text-forest/60">Reply directly via WhatsApp or email and track resolution</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', ...CONTACT_STATUSES] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-bold transition',
                filter === status ? 'bg-forest text-cream' : 'border border-sage/15 bg-white text-forest hover:bg-sage/10',
              )}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-sage/15 bg-white p-6 text-center text-sm text-forest/55">
            No messages in this view.
          </p>
        )}
        {filtered.map((c) => {
          const waHref = c.phone
            ? toWhatsAppUrl(
              c.phone,
              `Namaste ${c.name}! Thank you for reaching out to Pure Khetar regarding "${c.subject}". How can we help you today?`,
            )
            : null;

          return (
            <article key={c.id} className="rounded-3xl border border-sage/15 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-forest">{c.name}</h3>
                    <span className="text-xs font-semibold text-terracotta">· {c.subject}</span>
                    {c.createdAt && (
                      <span className="text-xs text-forest/45">· {formatShortDate(c.createdAt)}</span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-forest/60">
                    <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 hover:text-forest hover:underline">
                      <Mail className="h-3.5 w-3.5" /> {c.email}
                    </a>
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 hover:text-forest hover:underline">
                        <Phone className="h-3.5 w-3.5" /> {c.phone}
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {waHref && (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#25D366]/15 px-3.5 text-xs font-bold text-[#128C7E] transition hover:bg-[#25D366] hover:text-white"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Reply
                    </a>
                  )}
                  <select
                    defaultValue={c.status}
                    onChange={async (e) => {
                      await fetch(`/api/admin/contacts/${c.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: e.target.value }),
                      });
                      refresh();
                    }}
                    className={cn(
                      'min-h-9 rounded-full border px-3 text-xs font-bold outline-none',
                      getContactBadgeStyle(c.status),
                    )}
                  >
                    {CONTACT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="mt-3 rounded-2xl bg-cream/70 p-3.5 text-sm leading-relaxed text-forest/80">{c.message}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Orders({ orders, refresh }: { orders: Order[]; refresh: () => void }) {
  const [filter, setFilter] = useState<'ALL' | 'ACTION' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.user.name.toLowerCase().includes(q) ||
        (o.user.phone ?? '').includes(q);

      if (!matchesQuery) return false;
      if (filter === 'ACTION') return ['PENDING', 'REQUESTED', 'PAYMENT_PENDING'].includes(o.status);
      if (filter === 'ACTIVE') return ['APPROVED', 'PROCESSING', 'SHIPPED'].includes(o.status);
      if (filter === 'COMPLETED') return o.status === 'DELIVERED';
      if (filter === 'CANCELLED') return ['CANCELLED', 'REJECTED'].includes(o.status);
      return true;
    });
  }, [orders, filter, query]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-bold text-forest">Orders & Harvest Requests</h2>
        <p className="text-sm text-forest/60">Approve orders, inspect ordered vegetables, and send WhatsApp updates</p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-sage/15 bg-white p-3.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-forest/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order #, customer name, or phone..."
            className="min-h-10 w-full rounded-full border border-sage/20 bg-cream/60 pl-10 pr-4 text-sm text-forest outline-none focus:border-forest"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'ALL' as const, label: `All (${orders.length})` },
            { id: 'ACTION' as const, label: 'Needs Action' },
            { id: 'ACTIVE' as const, label: 'Approved / Active' },
            { id: 'COMPLETED' as const, label: 'Delivered' },
            { id: 'CANCELLED' as const, label: 'Cancelled' },
          ].map((tabItem) => (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => setFilter(tabItem.id)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-bold transition',
                filter === tabItem.id ? 'bg-forest text-cream' : 'bg-cream text-forest hover:bg-sage/15',
              )}
            >
              {tabItem.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-sage/15 bg-white p-6 text-center text-sm text-forest/55">
            No matching orders found.
          </p>
        )}

        {filtered.map((o) => {
          const shortCode = o.orderNumber.slice(-8);
          const isExpanded = expandedId === o.id;
          const address = formatAddress(o.shippingAddress);
          const phone = o.user.phone;
          const waHref = phone
            ? toWhatsAppUrl(
              phone,
              `Namaste ${o.user.name}! Your Pure Khetar order #${shortCode} (₹${o.totalAmount}) is currently *${o.status}*. Fresh harvest from Kamana Farm will reach you before 9 AM!`,
            )
            : null;

          return (
            <article
              key={o.id}
              className="overflow-hidden rounded-3xl border border-sage/15 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-cream px-2 py-0.5 font-mono text-xs font-bold text-forest">
                      #{shortCode}
                    </span>
                    <h3 className="font-bold text-forest">{o.user.name}</h3>
                    <span className="rounded-full bg-sage/15 px-2.5 py-0.5 text-[11px] font-bold text-forest">
                      {o.paymentMethod}
                    </span>
                    {o.createdAt && (
                      <span className="text-xs text-forest/45">{formatShortDate(o.createdAt)}</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-forest/65">
                    {phone || o.user.email} · <strong className="text-forest">{formatPrice(o.totalAmount)}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {waHref && (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#25D366]/15 px-3 text-xs font-bold text-[#128C7E] transition hover:bg-[#25D366] hover:text-white"
                      title="Send WhatsApp status update"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                  )}

                  <select
                    defaultValue={o.status}
                    onChange={async (e) => {
                      await fetch(`/api/admin/orders/${o.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: e.target.value }),
                      });
                      refresh();
                    }}
                    className={cn(
                      'min-h-9 rounded-full border px-3 text-xs font-bold outline-none',
                      getOrderBadgeStyle(o.status),
                    )}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-white text-forest">
                        {s}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : o.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-sage/20 text-forest transition hover:bg-cream"
                    aria-label={isExpanded ? 'Hide order details' : 'Show order details'}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-sage/10 bg-cream/50 px-4 py-4 text-xs text-forest sm:px-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="font-bold uppercase tracking-wider text-forest/55">Ordered Produce</p>
                      {o.items && o.items.length > 0 ? (
                        <ul className="mt-2 space-y-1.5">
                          {o.items.map((item) => {
                            const qtyLabel = item.weightGrams
                              ? `${item.weightGrams >= 1000 ? `${item.weightGrams / 1000} kg` : `${item.weightGrams} g`}`
                              : item.quantity
                                ? `${item.quantity} kg`
                                : '';
                            return (
                              <li key={item.id} className="flex justify-between rounded-xl bg-white px-3 py-2 font-medium">
                                <span>
                                  {item.product?.name ?? 'Produce item'}{' '}
                                  {qtyLabel && <span className="text-forest/55">({qtyLabel})</span>}
                                </span>
                                <span className="font-bold">{formatPrice(item.price)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="mt-1.5 text-forest/60">No line-item breakdown recorded.</p>
                      )}
                    </div>

                    <div>
                      <p className="font-bold uppercase tracking-wider text-forest/55">Customer & Delivery</p>
                      <div className="mt-2 space-y-1.5 rounded-xl bg-white p-3">
                        <p>
                          <span className="text-forest/55">Email:</span> {o.user.email}
                        </p>
                        {phone && (
                          <p>
                            <span className="text-forest/55">Phone:</span> {phone}
                          </p>
                        )}
                        {address && (
                          <p>
                            <span className="text-forest/55">Address:</span> {address}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}