"use client"
import Loading from "@/components/state/loading"
import HeaderSection from "@/components/overview/header-section"
import Breadcrumb from "@/components/breadcrumb"
import { useUserStore } from "@/stores/user.store"
import { Suspense } from "react"

export default function OverviewLayout({
    student,
    teacher
}: Readonly<{
    student: React.ReactNode
    teacher: React.ReactNode
}>) {
    const { user } = useUserStore()
    return (
        <div className="size-full pt-12 px-14">
            <Breadcrumb />
            <Suspense fallback={
                <Loading />
            }>
                {user?.role == 'instructor' ? teacher : user?.role == 'student' ? student : <Loading />}
            </Suspense>
        </div>
    )
}
