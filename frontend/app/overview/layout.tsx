"use client"
import Loading from "@/components/state/loading"
import HeaderSection from "@/components/overview/header-section"
import Breadcrumb from "@/components/breadcrumb"
import { useUserStore } from "@/stores/user.store"
import { Suspense } from "react"

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
        <div className="size-full pt-12 px-14">
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
    )
}
