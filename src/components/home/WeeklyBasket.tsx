'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Minus, Plus, Sprout } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { CONTACT, FALLBACK_PRODUCT_IMAGE, SITE } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import { formatWeight, WEIGHT_STEP_GRAMS } from '@/lib/weight';
import type { ProductSummary } from '@/types/product';

interface WeeklyBasketProps {
  products: ProductSummary[];
}

export function WeeklyBasket({ products }: WeeklyBasketProps) {
  const basketProducts = products.filter((product) =>
    ['natural-ringan', 'natural-deti', 'fresh-fulawar'].includes(product.slug),
  );
  const selected = basketProducts.length >= 3 ? basketProducts.slice(0, 3) : [];
  const [dailyGrams, setDailyGrams] = useState(1000);
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  const allocationEntries = selected.map((product, index) => {
    const fallback = index === 0 ? 500 : index === 1 ? 500 : 0;
    return { product, grams: allocations[product.id] ?? fallback };
  });

  const allocatedGrams = allocationEntries.reduce((sum, item) => sum + item.grams, 0);
  const subtotalPerWeek = useMemo(() => {
    return allocationEntries.reduce((sum, item) => sum + item.product.price * (item.grams / 1000) * 7, 0);
  }, [allocationEntries]);
  const discounted = Math.round(subtotalPerWeek * 0.95 * 100) / 100;
  const discount = subtotalPerWeek - discounted;

  const setAllocation = (productId: string, grams: number) => {
    setAllocations((current) => ({ ...current, [productId]: Math.max(0, grams) }));
  };

  const requestBasket = () => {
    const items = allocationEntries
      .filter((item) => item.grams > 0)
      .map((item) => `${item.product.name}: ${formatWeight(item.grams)} per day`)
      .join('\n');
    const message = `Hello ${SITE.name}! I would like to request a 7-day weekly vegetable basket.\n\nDaily quantity: ${formatWeight(dailyGrams)}\n${items}\n\n7 deliveries\nSubtotal: ${formatPrice(subtotalPerWeek)}\n5% basket discount: -${formatPrice(discount)}\nEstimated weekly total: ${formatPrice(discounted)}\n\nPlease contact me to confirm delivery. Phone: ${CONTACT.phoneDisplay}`;
    window.open(`https://wa.me/${CONTACT.phoneE164}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  if (selected.length < 3) return null;

  return (
    <section
      className="w-full overflow-hidden rounded-[2rem] border border-sage/15 bg-white p-4 shadow-card sm:p-8"
      aria-labelledby="weekly-basket-heading"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:gap-8">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-terracotta sm:mb-4">
            <Sprout className="h-4 w-4 shrink-0" /> Farm-to-home weekly basket
          </div>
          <h2 id="weekly-basket-heading" className="font-serif text-2xl font-bold leading-tight text-forest sm:text-4xl">
            Fresh vegetables, delivered for 7 days
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-forest/65">
            Choose at least 1 kg for each delivery and split it between three fresh seasonal vegetables. Receive 5% off the complete 7-day plan.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sage/20 bg-cream p-3.5 sm:mt-6 sm:p-4">
            <div>
              <p className="text-xs font-semibold text-forest/50">Daily basket quantity</p>
              <p className="mt-0.5 font-serif text-lg font-bold text-forest sm:mt-1 sm:text-xl">{formatWeight(dailyGrams)}</p>
            </div>
            <div
              className="inline-flex shrink-0 items-center rounded-full border border-sage/25 bg-white"
              role="group"
              aria-label="Daily basket quantity"
            >
              <button
                type="button"
                onClick={() => setDailyGrams((grams) => Math.max(1000, grams - WEIGHT_STEP_GRAMS))}
                disabled={dailyGrams <= 1000}
                className="flex h-9 w-9 items-center justify-center rounded-full text-forest disabled:opacity-30 sm:h-11 sm:w-11"
                aria-label="Decrease daily quantity"
              >
                <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <span className="w-12 text-center text-xs font-bold text-forest sm:w-16">{formatWeight(dailyGrams)}</span>
              <button
                type="button"
                onClick={() => setDailyGrams((grams) => grams + WEIGHT_STEP_GRAMS)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-forest sm:h-11 sm:w-11"
                aria-label="Increase daily quantity"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2.5 sm:space-y-3">
            {allocationEntries.map(({ product, grams }) => (
              <div
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-sage/15 p-2.5 sm:flex-nowrap sm:gap-3 sm:p-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream sm:h-14 sm:w-14">
                    <SmartImage
                      src={product.images[0] ?? FALLBACK_PRODUCT_IMAGE}
                      alt={product.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-forest">{product.name}</p>
                    <p className="text-xs text-forest/50">{formatPrice(product.price)} / kg</p>
                  </div>
                </div>
                <div className="ml-auto inline-flex shrink-0 items-center rounded-full border border-sage/20 bg-cream">
                  <button
                    type="button"
                    onClick={() => setAllocation(product.id, Math.max(0, grams - WEIGHT_STEP_GRAMS))}
                    className="flex h-8 w-8 items-center justify-center text-forest sm:h-10 sm:w-10"
                    aria-label={`Decrease ${product.name}`}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-12 text-center text-xs font-bold text-forest sm:w-14">{formatWeight(grams)}</span>
                  <button
                    type="button"
                    onClick={() => setAllocation(product.id, grams + WEIGHT_STEP_GRAMS)}
                    className="flex h-8 w-8 items-center justify-center text-forest sm:h-10 sm:w-10"
                    aria-label={`Increase ${product.name}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded-[1.75rem] bg-forest p-5 text-cream shadow-natural-lg sm:p-6">
          <div className="flex items-center gap-2 text-sm font-bold">
            <CalendarDays className="h-4 w-4 shrink-0 text-marigold" /> 7-day plan summary
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-cream/70">Deliveries</dt>
              <dd>7 days</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-cream/70">Daily quantity</dt>
              <dd>{formatWeight(dailyGrams)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-cream/70">Allocated now</dt>
              <dd>{formatWeight(allocatedGrams)}</dd>
            </div>
            <div className="flex justify-between gap-2 border-t border-white/15 pt-3">
              <dt className="text-cream/70">7-day subtotal</dt>
              <dd>{formatPrice(subtotalPerWeek)}</dd>
            </div>
            <div className="flex justify-between gap-2 text-marigold">
              <dt>Weekly basket discount</dt>
              <dd>-{formatPrice(discount)}</dd>
            </div>
            <div className="flex justify-between gap-2 border-t border-white/15 pt-3 text-lg">
              <dt className="font-bold">Estimated total</dt>
              <dd className="font-serif text-xl font-bold">{formatPrice(discounted)}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={requestBasket}
            disabled={allocatedGrams !== dailyGrams}
            className="mt-6 min-h-12 w-full rounded-full bg-marigold px-5 text-sm font-bold text-forest transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Request weekly basket
          </button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-cream/60">
            Split the daily quantity exactly: the allocation counter currently totals {formatWeight(allocatedGrams)}.
          </p>
        </div>
      </div>
    </section>
  );
}