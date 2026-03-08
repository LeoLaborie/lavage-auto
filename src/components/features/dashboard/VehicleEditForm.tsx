"use client";

import { useState } from "react";
import { updateVehicle } from "@/lib/actions/garage";

interface Car {
    id: string;
    make: string;
    model: string;
    plate: string | null;
}

interface VehicleEditFormProps {
    car: Car;
    onClose: () => void;
}

export default function VehicleEditForm({ car, onClose }: VehicleEditFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const result = await updateVehicle(car.id, formData);

        setLoading(false);
        if (result.success) {
            setSuccess(true);
            setTimeout(() => onClose(), 800);
        } else {
            setError(result.error || "Une erreur est survenue");
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-800">Modifier le véhicule</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                        aria-label="Fermer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="edit-make" className="block text-sm font-medium text-slate-700 mb-1">
                            Marque *
                        </label>
                        <input
                            type="text"
                            id="edit-make"
                            name="make"
                            required
                            defaultValue={car.make}
                            placeholder="Ex: Tesla"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-model" className="block text-sm font-medium text-slate-700 mb-1">
                            Modèle *
                        </label>
                        <input
                            type="text"
                            id="edit-model"
                            name="model"
                            required
                            defaultValue={car.model}
                            placeholder="Ex: Model 3"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-plate" className="block text-sm font-medium text-slate-700 mb-1">
                            Plaque d'immatriculation (Optionnel)
                        </label>
                        <input
                            type="text"
                            id="edit-plate"
                            name="plate"
                            defaultValue={car.plate ?? ""}
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
                            Véhicule mis à jour avec succès.
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? "Enregistrement..." : "Enregistrer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
