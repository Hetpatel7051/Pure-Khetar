'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { SmartImage } from '@/components/ui/SmartImage';
import { AddToCartButton } from './AddToCartButton';
import { FALLBACK_PRODUCT_IMAGE } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import { formatWeight, isWeightUnit, normalizeWeightQuantity, MIN_WEIGHT_GRAMS, WEIGHT_STEP_GRAMS } from '@/lib/weight';
import type { ProductSummary } from '@/types/product';

interface ProductCardProps {
  product: ProductSummary;
  /** Set on the first row of a page so those photos load immediately instead of lazily. */
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const href = `/products/${product.slug}`;
  const comingSoon = Boolean(product.comingSoon);
  const soldOut = product.stock <= 0 || comingSoon;
  const lowStock = !soldOut && product.stock <= 10;
  const images = product.images.length ? product.images : [FALLBACK_PRODUCT_IMAGE];
  const [activeImage, setActiveImage] = useState(0);
  const [paused, setPaused] = useState(false);
  const weightProduct = isWeightUnit(product.unit);
  const maxGrams = weightProduct ? Math.round(product.stock * 1000) : 0;
  const [quantity, setQuantity] = useState(weightProduct ? Math.min(MIN_WEIGHT_GRAMS, maxGrams) : 1);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (images.length < 2 || paused || reduceMotion) return;
    const timer = window.setInterval(() => setActiveImage((current) => (current + 1) % images.length), 3200);
    return () => window.clearInterval(timer);
  }, [images.length, paused, reduceMotion]);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-sage/15 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      {/* ── Edge-to-edge photo with zero side margins ── */}
      <div
        className="relative block aspect-[4/3] w-full overflow-hidden bg-cream"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <Link href={href} aria-label={`View ${product.name}`} className="absolute inset-0">
          <SmartImage
            src={images[activeImage]}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            className={`object-cover object-center transition-transform duration-500 group-hover:scale-105 ${soldOut ? 'grayscale' : ''}`}
          />
        </Link>

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 z-10 flex flex-wrap gap-1">
          {product.isChemicalFree && <Badge variant="natural" className="text-[10px] px-2 py-0.5 shadow-sm">Natural</Badge>}
          {lowStock && <Badge variant="accent" className="text-[10px] px-2 py-0.5 shadow-sm">Only {product.stock} left</Badge>}
          {comingSoon && <Badge variant="accent" className="text-[10px] px-2 py-0.5 shadow-sm">Coming soon</Badge>}
          {!comingSoon && soldOut && <Badge variant="danger" className="text-[10px] px-2 py-0.5 shadow-sm">Sold out</Badge>}
        </div>

        {/* Pagination Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-full bg-white/80 px-1.5 py-0.5 backdrop-blur-sm shadow-sm">
            {images.map((image, index) => (
              <button
                key={image}
                type="button"
                aria-label={`Show image ${index + 1} of ${images.length}`}
                onClick={() => setActiveImage(index)}
                className={`h-1 rounded-full transition-all ${index === activeImage ? 'w-3.5 bg-forest' : 'w-1 bg-forest/35'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Information Section ── */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-sage">{product.category.name}</p>

        <h3 className="mt-0.5 font-serif text-base font-bold leading-tight text-forest transition-colors group-hover:text-terracotta line-clamp-1">
          <Link href={href}>
            {product.name}
          </Link>
        </h3>

        <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-forest/60">
          {product.description}
        </p>

        {/* Price & Actions */}
        <div className="mt-3 border-t border-sage/10 pt-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              {comingSoon ? (
                <span className="text-xs font-semibold text-terracotta">Coming soon</span>
              ) : (
                <p className="font-serif text-lg font-bold leading-none text-forest">
                  {formatPrice(product.price)}
                  <span className="ml-1 text-[11px] font-normal text-forest/50">/ {product.unit}</span>
                </p>
              )}
            </div>

            {!comingSoon && weightProduct ? (
              <div className="flex items-center gap-2">
                <div className="inline-flex h-8 items-center rounded-full border border-sage/25 bg-cream px-1" role="group" aria-label={`Quantity of ${product.name}`}>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => normalizeWeightQuantity(q - WEIGHT_STEP_GRAMS, maxGrams))}
                    disabled={quantity <= MIN_WEIGHT_GRAMS}
                    aria-label="Decrease quantity"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-forest disabled:opacity-30 hover:bg-white"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="min-w-[3rem] text-center text-[11px] font-bold text-forest" aria-live="polite">
                    {formatWeight(quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => normalizeWeightQuantity(q + WEIGHT_STEP_GRAMS, maxGrams))}
                    disabled={quantity >= maxGrams}
                    aria-label="Increase quantity"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-forest disabled:opacity-30 hover:bg-white"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <AddToCartButton product={product} quantity={quantity} />
              </div>
            ) : !comingSoon ? (
              <AddToCartButton product={product} />
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}