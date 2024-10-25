import HeaderSection from "@/components/overview/header-section"
import { Suspense } from "react"

export default function OverviewLayout({
    student,
    teacher
}: Readonly<{
    student: React.ReactNode
    teacher: React.ReactNode
}>) {
    return (
        <div className="size-full p-18">
            <Suspense fallback={<div>Loading</div>}>
                <HeaderSection content="Your Course" buttonContent="New Course"/>
                {teacher}
            </Suspense>
        </div>
    )
}