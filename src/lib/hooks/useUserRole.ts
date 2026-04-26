'use client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

type Role = 'CLIENT' | 'LAVEUR' | 'ADMIN' | null

export function useUserRole(user: User | null) {
  const [role, setRole] = useState<Role>(null)
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setRole(null)
      setDashboardUrl(null)
      return
    }

    let cancelled = false
    const fetchRole = async () => {
      try {
        const res = await fetch('/api/auth/role')
        if (!res.ok) return
        const data = await res.json()
        if (cancelled || !data.success || !data.data) return
        const r: Role = data.data.role ?? null
        setRole(r)
        if (r === 'CLIENT' || r === 'LAVEUR') {
          setDashboardUrl('/dashboard')
        } else if (r === 'ADMIN') {
          setDashboardUrl('/admin')
        } else {
          setDashboardUrl(null)
        }
      } catch (error) {
        console.error('useUserRole: failed to fetch role', error)
      }
    }
    fetchRole()
    return () => {
      cancelled = true
    }
  }, [user])

  return { role, dashboardUrl }
}
