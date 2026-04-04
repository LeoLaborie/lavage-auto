'use client';

import { Suspense } from 'react';
import Header from '@/components/Header';
import BookingWizard from '@/components/booking/BookingWizard';

export default function Reserver() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <Header currentPage="booking" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
          <BookingWizard />
        </Suspense>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; {new Date().getFullYear()} Nealkar. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}