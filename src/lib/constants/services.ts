export const TIME_SLOTS = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
] as const;

export type ServiceId = 'lavage-exterieur' | 'lavage-interieur' | 'lavage-complet' | 'lavage-premium';

export interface WashService {
    id: ServiceId;
    name: string;
    description: string;
    amountCents: number;
    estimatedDuration: number;
    durationLabel: string;
    icon: string;
    isVisible: boolean;
    features: string[];
}

export const services: WashService[] = [
    {
        id: 'lavage-exterieur',
        name: 'Lavage Extérieur',
        description: 'Nettoyage professionnel de la carrosserie, des jantes et des vitres extérieures, sans utiliser une seule goutte d\'eau.',
        amountCents: 2900, // 29€
        estimatedDuration: 30,
        durationLabel: '30 min',
        icon: 'sponge',
        isVisible: true,
        features: ['Carrosserie', 'Jantes et pneus', 'Vitres extérieures', 'Séchage microfibre']
    },
    {
        id: 'lavage-interieur',
        name: 'Lavage Intérieur',
        description: 'Aspiration, dépoussiérage et nettoyage des plastiques et des vitres intérieures pour un habitacle impeccable.',
        amountCents: 3500, // 35€
        estimatedDuration: 30,
        durationLabel: '30 min',
        icon: 'vacuum', // Currently not displayed
        isVisible: false,
        features: ['Aspiration habitacle', 'Plastiques', 'Vitres intérieures', 'Parfum habitacle']
    },
    {
        id: 'lavage-complet',
        name: 'Lavage Complet',
        description: 'La combinaison parfaite: nettoyage intérieur et extérieur détaillé pour un véhicule qui retrouve son éclat.',
        amountCents: 5900, // 59€
        estimatedDuration: 60,
        durationLabel: '60 min',
        icon: 'sparkles',
        isVisible: true,
        features: ['Lavage extérieur', 'Aspiration + Plastiques', 'Toutes les vitres', 'Brillant pneus']
    },
    {
        id: 'lavage-premium',
        name: 'Lavage Premium',
        description: 'Le soin ultime. Lavage complet avec traitement lustrant et soin des cuirs/tissus pour une remise à neuf.',
        amountCents: 8900, // 89€
        estimatedDuration: 90,
        durationLabel: '90 min',
        icon: 'gem',
        isVisible: true,
        features: ['Lavage complet', 'Cire lustrante', 'Soin cuirs ou tissus', 'Désinfection']
    }
];
