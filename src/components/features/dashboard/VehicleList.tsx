"use client";

import { useState } from "react";
import VehicleEditForm from "@/components/features/dashboard/VehicleEditForm";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { deleteVehicle } from "@/lib/actions/garage";
import EmptyState, { CarIcon } from "@/components/ui/EmptyState";

interface Car {
    id: string;
    make: string;
    model: string;
    plate: string | null;
}

interface VehicleListProps {
    cars: Car[];
}

export default function VehicleList({ cars }: VehicleListProps) {
    const [editingCar, setEditingCar] = useState<Car | null>(null);
    const [deleteCarId, setDeleteCarId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    async function confirmDelete(carId: string) {
        setDeleteError(null);
        const result = await deleteVehicle(carId);
        if (!result.success) {
            setDeleteError(result.error || "Erreur lors de la suppression du véhicule");
        }
    }

    if (cars.length === 0) {
        return (
            <EmptyState
                icon={<CarIcon />}
                title="Aucun véhicule"
                description="Ajoutez votre premier véhicule pour faciliter vos prochaines réservations."
            />
        );
    }

    return (
        <>
            {deleteError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                    {deleteError}
                </div>
            )}
            <div className="space-y-3">
                {cars.map((car) => (
                    <div
                        key={car.id}
                        className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 group hover:border-blue-100 transition-colors"
                    >
                        <div>
                            <h3 className="font-semibold text-slate-800">
                                {car.make} {car.model}
                            </h3>
                            {car.plate && (
                                <p className="text-sm text-slate-500 font-mono tracking-wider">
                                    {car.plate}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            {/* Edit button */}
                            <button
                                type="button"
                                onClick={() => setEditingCar(car)}
                                className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                title="Modifier"
                                aria-label={`Modifier ${car.make} ${car.model}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            </button>

                            {/* Delete button */}
                            <button
                                type="button"
                                onClick={() => setDeleteCarId(car.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Supprimer"
                                aria-label={`Supprimer ${car.make} ${car.model}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit modal */}
            {editingCar && (
                <VehicleEditForm
                    car={editingCar}
                    onClose={() => setEditingCar(null)}
                />
            )}

            <ConfirmDialog
                isOpen={!!deleteCarId}
                onConfirm={() => {
                    confirmDelete(deleteCarId!);
                    setDeleteCarId(null);
                }}
                onCancel={() => setDeleteCarId(null)}
                title="Supprimer le véhicule"
                message="Voulez-vous vraiment supprimer ce véhicule ?"
                confirmLabel="Supprimer"
                variant="danger"
            />
        </>
    );
}
