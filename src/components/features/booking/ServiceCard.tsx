import React from 'react';
import { WashService, ServiceId } from '@/lib/constants/services';

import { formatCurrency } from '@/lib/format';

interface ServiceCardProps {
    service: WashService;
    isSelected: boolean;
    onSelect: (id: ServiceId) => void;
}

export function ServiceCard({ service, isSelected, onSelect }: ServiceCardProps) {
    const priceFormatted = formatCurrency(service.amountCents);

    return (
        <button
            type="button"
            onClick={() => onSelect(service.id)}
            className={`w-full text-left relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-200 ${isSelected
                ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-1 ring-indigo-600'
                : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                }`}
        >
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-900">{service.name}</h3>
                <span className="text-xl flex-shrink-0 font-extrabold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
                    {priceFormatted}
                </span>
            </div>

            <p className="text-slate-600 mb-6 min-h-[48px]">
                {service.description}
            </p>

            <ul className="space-y-2">
                {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-slate-700">
                        <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                    </li>
                ))}
            </ul>

            {isSelected && (
                <div className="absolute -top-3 -right-3 bg-indigo-600 text-white p-1 rounded-full shadow-md">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}
        </button>
    );
}
