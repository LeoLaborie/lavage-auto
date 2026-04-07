import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Generates a 1-hour signed URL for a private Supabase storage file.
 *
 * @param rawUrl - The raw storage URL stored in the DB (full path or storage URL)
 * @param supabase - An authenticated Supabase client instance
 * @param bucket - The storage bucket name (default: 'mission-photos')
 * @returns The signed URL, or the rawUrl as fallback if signing fails, or null if rawUrl is null
 */
export async function getSignedPhotoUrl(
    rawUrl: string | null,
    supabase: SupabaseClient,
    bucket = 'mission-photos'
): Promise<string | null> {
    if (!rawUrl) return null
    try {
        const path = rawUrl.split(`/${bucket}/`)[1]
        if (!path) return rawUrl // Not a storage URL — return as-is
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, 3600)
        if (error || !data) {
            console.error('[getSignedPhotoUrl] Failed to generate signed URL:', error)
            return rawUrl // Fallback: never fail the page for a photo
        }
        return data.signedUrl
    } catch {
        return rawUrl
    }
}
