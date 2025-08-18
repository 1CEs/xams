"use client"
import Loading from "@/components/state/loading"
import HeaderSection from "@/components/overview/header-section"
import Breadcrumb from "@/components/breadcrumb"
import { useUserStore } from "@/stores/user.store"
import { Suspense } from "react"
import SessionMonitor from "@/components/auth/session-monitor"

export default function OverviewLayout({
    admin,
    student,
    teacher
}: Readonly<{
    admin: React.ReactNode
    student: React.ReactNode
    teacher: React.ReactNode
}>) {
    const { user } = useUserStore()
    console.log(user)
    return (
        <div className="size-full pt-8 sm:pt-10 md:pt-12 px-3 sm:px-6 md:px-10 lg:px-14">
            <div className="max-w-7xl mx-auto">
                <Breadcrumb />
                <Suspense fallback={
                    <Loading />
                }>
                    {   
                        user?.role == 'admin' ? admin : 
                        user?.role == 'instructor' ? teacher : 
                        user?.role == 'student' ? student : 
                        <Loading />
                    }
                </Suspense>
            </div>
            
            {/* Session Monitor with Idle Timeout - Only show for authenticated users */}
            {user && <SessionMonitor warningTimeMinutes={5} checkIntervalSeconds={30} idleTimeoutHours={1} />}
        </div>
    )
}
