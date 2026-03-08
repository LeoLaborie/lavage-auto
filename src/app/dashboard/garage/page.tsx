import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import VehicleForm from "@/components/features/dashboard/VehicleForm";
import { deleteVehicle } from "@/lib/actions/garage";
import { redirect } from "next/navigation";

export default async function GaragePage() {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { authId: authUser.id },
        select: {
            id: true,
            cars: {
                select: {
                    id: true,
                    make: true,
                    model: true,
                    plate: true,
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!user) {
        return (
            <div className="p-8 text-center text-slate-600">
                Erreur: Profil utilisateur non trouvé.
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold text-slate-900">Mon Garage</h1>
                <p className="text-slate-500">Gérez vos véhicules pour réserver plus rapidement.</p>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Registration Form */}
                <div>
                    <VehicleForm />
                </div>

                {/* Vehicle List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-slate-800">Mes véhicules ({user.cars.length})</h2>
                    {user.cars.length === 0 ? (
                        <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 font-medium">
                            Aucun véhicule enregistré.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {user.cars.map((car) => (
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

                                    <form action={async () => { await deleteVehicle(car.id); }}>
                                        <button
                                            type="submit"
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Supprimer"
                                            onClick={(e) => {
                                                if (!confirm("Voulez-vous vraiment supprimer ce véhicule ?")) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </form>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
