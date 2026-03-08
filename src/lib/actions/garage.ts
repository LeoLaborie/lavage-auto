"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addVehicle(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return { success: false, error: "Non authentifié" };
        }

        const make = (formData.get("make") as string || "").trim();
        const model = (formData.get("model") as string || "").trim();
        const plate = (formData.get("plate") as string || "").trim().toUpperCase();

        if (!make || !model) {
            return { success: false, error: "La marque et le modèle sont requis" };
        }

        // Find the Prisma user by authId
        const user = await prisma.user.findUnique({
            where: { authId: authUser.id },
        });

        if (!user) {
            return { success: false, error: "Utilisateur non trouvé en base" };
        }

        // Uniqueness check for plate
        if (plate) {
            const existingCar = await prisma.car.findFirst({
                where: {
                    userId: user.id,
                    plate: plate,
                },
            });

            if (existingCar) {
                return { success: false, error: "Ce véhicule (plaque) est déjà enregistré dans votre garage." };
            }
        }

        const car = await prisma.car.create({
            data: {
                userId: user.id,
                make,
                model,
                plate: plate || null,
            },
        });

        revalidatePath("/dashboard/garage");
        return { success: true, data: car };
    } catch (error) {
        console.error("Error adding vehicle:", error);
        return { success: false, error: "Erreur lors de l'ajout du véhicule" };
    }
}

export async function updateVehicle(carId: string, formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return { success: false, error: "Non authentifié" };
        }

        const make = (formData.get("make") as string || "").trim();
        const model = (formData.get("model") as string || "").trim();
        const plate = (formData.get("plate") as string || "").trim().toUpperCase();

        if (!make || !model) {
            return { success: false, error: "La marque et le modèle sont requis" };
        }

        // Find the Prisma user by authId
        const user = await prisma.user.findUnique({
            where: { authId: authUser.id },
        });

        if (!user) {
            return { success: false, error: "Utilisateur non trouvé en base" };
        }

        // Uniqueness check for plate (exclude current vehicle)
        if (plate) {
            const existingCar = await prisma.car.findFirst({
                where: {
                    userId: user.id,
                    plate: plate,
                    NOT: { id: carId },
                },
            });

            if (existingCar) {
                return { success: false, error: "Ce véhicule (plaque) est déjà enregistré dans votre garage." };
            }
        }

        const car = await prisma.car.update({
            where: {
                id: carId,
                userId: user.id, // Security: ensure user owns this car
            },
            data: {
                make,
                model,
                plate: plate || null,
            },
        });

        revalidatePath("/dashboard/garage");
        return { success: true, data: car };
    } catch (error) {
        console.error("Error updating vehicle:", error);
        return { success: false, error: "Erreur lors de la modification du véhicule" };
    }
}

export async function deleteVehicle(carId: string) {
    try {
        const supabase = await createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return { success: false, error: "Non authentifié" };
        }

        const user = await prisma.user.findUnique({
            where: { authId: authUser.id },
        });

        if (!user) {
            return { success: false, error: "Utilisateur non trouvé" };
        }

        await prisma.car.delete({
            where: {
                id: carId,
                userId: user.id, // Security check
            },
        });

        revalidatePath("/dashboard/garage");
        return { success: true };
    } catch (error) {
        console.error("Error deleting vehicle:", error);
        return { success: false, error: "Erreur lors de la suppression du véhicule" };
    }
}
