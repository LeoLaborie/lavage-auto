import Link from 'next/link'
import { AppleEmoji } from '@/components/AppleEmoji'

export default function StripeCallbackPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AppleEmoji name="white_check_mark" className="w-10 h-10" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuration terminée !</h1>
                <p className="text-gray-600 mb-8">
                    Votre compte Stripe a été mis à jour. Vous pouvez maintenant retourner à votre tableau de bord pour commencer à accepter des missions.
                </p>

                <Link
                    href="/dashboard"
                    className="block w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
                >
                    Retour au tableau de bord
                </Link>
            </div>
        </div>
    )
}
