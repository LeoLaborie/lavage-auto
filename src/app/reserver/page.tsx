'use client';

import { Suspense } from 'react';
import NavCinetique from '@/components/landing/NavCinetique';
import FooterCinetique from '@/components/landing/FooterCinetique';
import BookingWizard from '@/components/booking/BookingWizard';

export default function Reserver() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <NavCinetique />

      <main
        className="mx-auto max-w-cin px-5 pb-16 pt-10 md:px-12 md:pb-[120px] md:pt-16"
        style={{ paddingTop: 'calc(var(--nav-h) + 24px)' }}
      >
        <Suspense
          fallback={
            <div className="flex min-h-[40vh] items-center justify-center font-mono text-[11px] uppercase tracking-[0.08em] text-ink2 md:text-xs">
              Chargement…
            </div>
          }
        >
          <BookingWizard />
        </Suspense>
      </main>

      <FooterCinetique />
    </div>
  );
}
