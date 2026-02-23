'use client';

import React, { useState } from 'react';
import { WashService, ServiceId } from '@/lib/constants/services';
import { ServiceCard } from './ServiceCard';
import { useRouter } from 'next/navigation';

interface ServiceCatalogProps {
    services: WashService[];
}

export function ServiceCatalog({ services }: ServiceCatalogProps) {
    const [selectedId, setSelectedId] = useState<ServiceId | null>(null);
    const router = useRouter();

    const handleContinue = () => {
        if (selectedId) {
            router.push(`/booking/location?serviceId=${selectedId}`);
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                    Choisissez votre lavage
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Des prestations sur-mesure pour redonner de l'éclat à votre véhicule. Nettoyage professionnel, écologique et sans eau.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12">
                {services.map((svc) => (
                    <ServiceCard
                        key={svc.id}
                        service={svc}
                        isSelected={selectedId === svc.id}
                        onSelect={setSelectedId}
                    />
                ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:relative md:bg-transparent md:border-t-0 md:shadow-none md:p-0 flex justify-center z-10">
                <button
                    onClick={handleContinue}
                    disabled={!selectedId}
                    className={`w-full md:w-auto px-8 py-4 rounded-full text-lg font-bold transition-all duration-200 flex items-center justify-center ${selectedId
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    Continuer vers la localisation
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </div>

            {/* Spacer for mobile bottom bar */}
            <div className="h-20 md:hidden"></div>
        </div>
    );
}
