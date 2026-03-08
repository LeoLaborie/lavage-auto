"use client";

import { useState } from "react";
import { addVehicle } from "@/lib/actions/garage";

export default function VehicleForm() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData(event.currentTarget);
        const result = await addVehicle(formData);

        if (result.success) {
            setSuccess(true);
            (event.target as HTMLFormElement).reset();
        } else {
            setError(result.error || "Une erreur est survenue");
        }
        setLoading(false);
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Ajouter un véhicule</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="make" className="block text-sm font-medium text-slate-700 mb-1">
                        Marque *
                    </label>
                    <input
                        type="text"
                        id="make"
                        name="make"
                        required
                        placeholder="Ex: Tesla"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    />
                </div>
                <div>
                    <label htmlFor="model" className="block text-sm font-medium text-slate-700 mb-1">
                        Modèle *
                    </label>
                    <input
                        type="text"
                        id="model"
                        name="model"
                        required
                        placeholder="Ex: Model 3"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    />
                </div>
                <div>
                    <label htmlFor="plate" className="block text-sm font-medium text-slate-700 mb-1">
                        Plaque d'immatriculation (Optionnel)
                    </label>
                    <input
                        type="text"
                        id="plate"
                        name="plate"
                        placeholder="Ex: AB-123-CD"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    />
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg">
                        Véhicule ajouté avec succès !
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                    {loading ? "Chargement..." : "Enregistrer le véhicule"}
                </button>
            </form>
        </div>
    );
}
