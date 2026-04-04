'use client'

export function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse bg-gray-200 rounded ${className ?? ''}`} />
}

export function SkeletonLine({ className }: { className?: string }) {
    return <div className={`h-4 bg-gray-200 rounded animate-pulse ${className ?? ''}`} />
}

export function SkeletonBookingCard() {
    return (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
                <div className="flex items-center gap-2">
                    <SkeletonLine className="w-32" />
                    <SkeletonLine className="w-16" />
                </div>
                <Skeleton className="w-12 h-6" />
            </div>
            <SkeletonLine className="w-48" />
            <SkeletonLine className="w-24" />
        </div>
    )
}

export function SkeletonMissionCard() {
    return (
        <div className="p-6 space-y-3">
            <div className="flex gap-2">
                <Skeleton className="w-24 h-6 rounded-full" />
                <SkeletonLine className="w-40" />
            </div>
            <SkeletonLine className="w-64 h-5" />
            <div className="flex gap-4">
                <SkeletonLine className="w-20" />
                <SkeletonLine className="w-16" />
            </div>
        </div>
    )
}

export function SkeletonStatsCard() {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-2">
            <SkeletonLine className="w-20 h-3" />
            <Skeleton className="w-24 h-8" />
        </div>
    )
}

export function SkeletonDashboard() {
    return (
        <div>
            <Skeleton className="h-16 w-full" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <SkeletonBookingCard />
                            <div className="mt-4">
                                <SkeletonBookingCard />
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-3">
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
