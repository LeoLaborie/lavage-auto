import { NextResponse } from 'next/server'
import { withWasherGuard } from '@/lib/auth/washerGuard'
import { prisma } from '@/lib/prisma'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const BUCKET_NAME = 'mission-photos'

type PhotoType = 'avant' | 'apres'

/**
 * POST /api/washer/missions/[bookingId]/photos
 * Uploads a before ("avant") or after ("apres") photo for a mission.
 * Requires the authenticated laveur to be the assigned laveur on the booking.
 */
export const POST = (req: Request, { params }: { params: Promise<{ bookingId: string }> }) =>
  withWasherGuard(async (req: Request, user: any, profile: any) => {
    const { bookingId } = await params

    // 1. Parse FormData
    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Corps de la requête invalide. FormData attendu.' },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File | null
    const type = formData.get('type') as string | null

    // 2. Validate type
    if (type !== 'avant' && type !== 'apres') {
      return NextResponse.json(
        { success: false, error: 'Le champ "type" doit être "avant" ou "apres".' },
        { status: 400 }
      )
    }
    const photoType = type as PhotoType

    // 3. Validate file presence
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier fourni.' },
        { status: 400 }
      )
    }

    // 4. Validate file type (must be an image)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Seuls les fichiers image sont acceptés.' },
        { status: 400 }
      )
    }

    // 5. Validate file size (<= 10 MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Le fichier dépasse la taille maximale autorisée (10 Mo).' },
        { status: 400 }
      )
    }

    // 6. Load booking and verify laveur ownership
    let booking
    try {
      booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          laveurId: true,
          status: true,
          beforePhotoUrl: true,
          afterPhotoUrl: true,
        },
      })
    } catch (err) {
      console.error('[photos/route] Prisma error fetching booking:', err)
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Mission introuvable.' },
        { status: 404 }
      )
    }

    if (booking.laveurId !== profile.userId) {
      return NextResponse.json(
        { success: false, error: 'Vous n\'êtes pas assigné à cette mission.' },
        { status: 403 }
      )
    }

    // 7. Business rule validation
    if (photoType === 'avant') {
      if (booking.beforePhotoUrl !== null) {
        return NextResponse.json(
          { success: false, error: 'La photo "Avant" a déjà été uploadée pour cette mission.' },
          { status: 409 }
        )
      }
    } else {
      // apres
      if (booking.beforePhotoUrl === null) {
        return NextResponse.json(
          { success: false, error: 'La photo "Avant" doit être uploadée avant la photo "Après".' },
          { status: 422 }
        )
      }
      if (booking.afterPhotoUrl !== null) {
        return NextResponse.json(
          { success: false, error: 'La photo "Après" a déjà été uploadée pour cette mission.' },
          { status: 409 }
        )
      }
    }

    // 8. Upload to Supabase Storage (service-role client)
    const fileBuffer = await file.arrayBuffer()
    const fileBytes = new Uint8Array(fileBuffer)
    const timestamp = Date.now()
    const storagePath = `bookings/${bookingId}/${photoType}-${timestamp}.jpg`

    const { error: uploadError } = await getSupabaseAdmin().storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBytes, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[photos/route] Supabase Storage upload error:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'upload de la photo. Veuillez réessayer.' },
        { status: 500 }
      )
    }

    // 9. Get public URL
    const { data: urlData } = getSupabaseAdmin().storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath)

    const photoUrl = urlData.publicUrl

    // 10. Update Booking in Prisma
    try {
      const updateData: Record<string, unknown> = {}

      if (photoType === 'avant') {
        updateData.beforePhotoUrl = photoUrl
        // Status transitions are handled exclusively by the dedicated status endpoint
        // (PATCH /api/washer/missions/[bookingId]/status). No auto-transition here.
      } else {
        // apres — only update afterPhotoUrl; status managed by client validation (Story 5.2)
        updateData.afterPhotoUrl = photoUrl
      }

      await prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
      })
    } catch (err) {
      console.error('[photos/route] Prisma error updating booking:', err)
      // Best-effort rollback: delete the uploaded file
      await getSupabaseAdmin().storage.from(BUCKET_NAME).remove([storagePath])
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour de la mission. Photo supprimée.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, data: { photoUrl, bookingId } },
      { status: 200 }
    )
  })(req)
