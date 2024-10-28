"use client"
import HeaderSection from "@/components/overview/header-section"
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
        <div className="size-full pt-18 px-14">
            <Suspense fallback={<div>Loading</div>}>
                <HeaderSection content="Your Course" buttonContent="New Course"/>
                {user?.role == 'instructor' ? teacher : student}
            </Suspense>
        </div>
    )
}