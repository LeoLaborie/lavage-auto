import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import VehicleForm from "@/components/features/dashboard/VehicleForm";
import VehicleList from "@/components/features/dashboard/VehicleList";
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

                {/* Vehicle List with Edit/Delete */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-slate-800">Mes véhicules ({user.cars.length})</h2>
                    <VehicleList cars={user.cars} />
                </div>
            </div>
        </div>
    );
}
