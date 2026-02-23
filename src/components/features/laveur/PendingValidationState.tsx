import { AppleEmoji } from '@/components/AppleEmoji'
import Link from 'next/link'

export default function PendingValidationState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="bg-yellow-100 p-4 rounded-full mb-6">
                <AppleEmoji name="hourglass_flowing_sand" className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Compte en attente de validation
            </h2>
            <p className="text-gray-600 max-w-md mb-8">
                Votre profil de Laveur a bien été créé. Notre équipe est en train de vérifier vos informations (SIRET, etc.).
                Vous serez notifié dès que votre compte sera validé pour commencer à accepter des missions.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 inline-flex items-center gap-3 text-sm text-gray-700">
                <AppleEmoji name="information_source" className="w-5 h-5 flex-shrink-0" />
                <p className="text-left">
                    Cette vérification prend généralement entre 24h et 48h ouvrées.
                </p>
            </div>
            <div className="mt-8">
                <Link
                    href="/dashboard"
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                >
                    Retour à l'accueil
                </Link>
            </div>
        </div>
    )
}
