'use client';

import Image from 'next/image';
import { BLUR_DATA_URL } from '@/lib/constants';
import { HeroContent } from './HeroContent';
import { HeroStatsBar } from './HeroStatsBar';

/**
 * Site-wide hero shell.
 * - min-height = 100svh so the sky is always visible above the navbar
 * - Navbar is transparent so the photo bleeds behind it
 * - Content starts below navbar height using pt-[96px]
 * - Soft cream gradient behind the left content area; right photo stays clear
 */
export function HeroSection() {
  return (
    <section className="relative flex min-h-screen w-full items-center overflow-hidden bg-cream">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/farm/farmPic.jpeg"
          alt="Pure Khetar farm at Kamana, Gujarat"
          fill
          priority
          quality={95}
          sizes="100vw"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          className="object-cover object-center brightness-[0.78] contrast-[1.04] saturate-[0.92]"
        />
      </div>

      {/* ── Overlays ─────────────────────────────────────────────────── */}
      {/* Left-side cream gradient extended smoothly across the wider boundary */}
      <div
        aria-hidden
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, rgba(250,246,236,0.85) 0%, rgba(250,246,236,0.65) 38%, rgba(250,246,236,0.25) 55%, transparent 72%)',
        }}
      />
      {/* Bottom vignette so the stats bar floats over clearly */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-32 z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(250,246,236,0.9) 0%, rgba(250,246,236,0.28) 24%, transparent 48%)',
        }}
      />
      {/* Subtle noise grain */}
      <div
        aria-hidden
        className="absolute inset-0 z-10 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ── Hero Content ──────────────────────────────────────────────── */}
      {/* Aligned to the wide Voltweb container scale (matching the Navbar) */}
      <div className="relative z-20 w-full max-w-[1720px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-20 pt-[96px] pb-32">
        <HeroContent />
      </div>

      {/* ── Stats row ────────────────────────────────────────────────── */}
      <HeroStatsBar />
    </section>
  );
}