import { unstable_cache } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ProductQuery, ProductSummary } from '@/types/product';

export const PRODUCT_CACHE_TAG = 'products';
const REVALIDATE_SECONDS = 120;
export const LIVE_PRODUCT_SLUGS = [
  'natural-ringan',
  'natural-deti',
  'fresh-fulawar',
  'natural-papaya',
] as const;

const productSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  price: true,
  unit: true,
  stock: true,
  images: true,
  isChemicalFree: true,
  isFeatured: true,
  available: true,
  comingSoon: true,
  deletedAt: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ProductSelect;

function orderBy(sort: ProductQuery['sort']): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case 'price-asc':
      return { price: 'asc' };
    case 'price-desc':
      return { price: 'desc' };
    case 'name':
      return { name: 'asc' };
    default:
      return { createdAt: 'desc' };
  }
}

function normalizeQuery(query: ProductQuery = {}) {
  const category =
    typeof query.category === 'string' && query.category.trim() !== '' && query.category !== 'all'
      ? query.category.trim()
      : undefined;
  const q = typeof query.q === 'string' && query.q.trim() !== '' ? query.q.trim() : undefined;
  const sort = query.sort ?? 'newest';
  const parsedLimit = Number(query.limit);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 24;

  return { category, q, sort, limit };
}

function buildWhere(query: ProductQuery): Prisma.ProductWhereInput {
  const { category, q } = normalizeQuery(query);

  return {
    deletedAt: null,
    ...(category ? { category: { slug: category } } : {}),
    ...(q
      ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      }
      : {}),
  };
}

/**
 * Direct Prisma query for the shop catalog.
 * Avoids Next.js 15+ unstable_cache serialization issues and prevents empty-array cache poisoning.
 */
export async function getProducts(query: ProductQuery = {}): Promise<ProductSummary[]> {
  const normalized = normalizeQuery(query);

  return prisma.product.findMany({
    where: buildWhere(normalized),
    orderBy: orderBy(normalized.sort),
    take: normalized.limit,
    select: productSelect,
  });
}

const fetchCachedFeaturedProducts = unstable_cache(
  async (limit: number): Promise<ProductSummary[]> => {
    return prisma.product.findMany({
      where: { isFeatured: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: productSelect,
    });
  },
  ['products:featured:v3'],
  { revalidate: REVALIDATE_SECONDS, tags: [PRODUCT_CACHE_TAG] },
);

export async function getFeaturedProducts(limit = 4): Promise<ProductSummary[]> {
  try {
    return await fetchCachedFeaturedProducts(limit);
  } catch (error) {
    console.error('[products] Database unavailable while loading featured products', error);
    return [];
  }
}

const fetchCachedProductBySlug = unstable_cache(
  async (slug: string): Promise<ProductSummary | null> => {
    return prisma.product.findUnique({ where: { slug }, select: productSelect });
  },
  ['products:by-slug:v3'],
  { revalidate: REVALIDATE_SECONDS, tags: [PRODUCT_CACHE_TAG] },
);

export async function getProductBySlug(slug: string): Promise<ProductSummary | null> {
  try {
    return await fetchCachedProductBySlug(slug);
  } catch (error) {
    console.error(`[products] Database unavailable while loading ${slug}`, error);
    return null;
  }
}

export const getRelatedProducts = unstable_cache(
  async (productId: string, categorySlug: string, limit = 4): Promise<ProductSummary[]> =>
    prisma.product.findMany({
      where: { id: { not: productId }, deletedAt: null, category: { slug: categorySlug } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: productSelect,
    }),
  ['products:related:v3'],
  { revalidate: REVALIDATE_SECONDS, tags: [PRODUCT_CACHE_TAG] },
);

/** Live search for the navbar overlay — not cached because input is free-form. */
export async function searchProducts(q: string, limit = 6): Promise<ProductSummary[]> {
  return prisma.product.findMany({
    where: buildWhere({ q }),
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: productSelect,
  });
}

/** For sitemap.xml. */
export async function getAllProductSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return prisma.product.findMany({ where: { deletedAt: null }, select: { slug: true, updatedAt: true } });
}