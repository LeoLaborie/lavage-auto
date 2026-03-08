export type ServiceId = 'lavage-exterieur' | 'lavage-interieur' | 'lavage-complet' | 'lavage-premium';

export interface WashService {
    id: ServiceId;
    name: string;
    description: string;
    amountCents: number;
    estimatedDuration: number;
    features: string[];
}

export const services: WashService[] = [
    {
        id: 'lavage-exterieur',
        name: 'Lavage Extérieur',
        description: 'Nettoyage professionnel de la carrosserie, des jantes et des vitres extérieures, sans utiliser une seule goutte d\'eau.',
        amountCents: 2900, // 29€
        estimatedDuration: 30,
        features: ['Carrosserie', 'Jantes et pneus', 'Vitres extérieures', 'Séchage microfibre']
    },
    {
        id: 'lavage-interieur',
        name: 'Lavage Intérieur',
        description: 'Aspiration, dépoussiérage et nettoyage des plastiques et des vitres intérieures pour un habitacle impeccable.',
        amountCents: 3500, // 35€
        estimatedDuration: 30,
        features: ['Aspiration habitacle', 'Plastiques', 'Vitres intérieures', 'Parfum habitacle']
    },
    {
        id: 'lavage-complet',
        name: 'Lavage Complet',
        description: 'La combinaison parfaite: nettoyage intérieur et extérieur détaillé pour un véhicule qui retrouve son éclat.',
        amountCents: 5900, // 59€
        estimatedDuration: 60,
        features: ['Lavage extérieur', 'Aspiration + Plastiques', 'Toutes les vitres', 'Brillant pneus']
    },
    {
        id: 'lavage-premium',
        name: 'Lavage Premium',
        description: 'Le soin ultime. Lavage complet avec traitement lustrant et soin des cuirs/tissus pour une remise à neuf.',
        amountCents: 8900, // 89€
        estimatedDuration: 90,
        features: ['Lavage complet', 'Cire lustrante', 'Soin cuirs ou tissus', 'Désinfection']
    }
];
