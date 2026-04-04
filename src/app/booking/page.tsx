import { services } from '@/lib/constants/services';
import { ServiceCatalog } from '@/components/features/booking/ServiceCatalog';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Réserver un lavage automobile | Nealkar',
    description: 'Sélectionnez la prestation de lavage sans eau qui correspond à vos besoins.',
};

export default function BookingServicesPage() {
    return (
        <main className="min-h-screen bg-slate-50 pt-20">
            <ServiceCatalog services={services} />
        </main>
    );
}
