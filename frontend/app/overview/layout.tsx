export default function OverviewLayout({
    student,
    teacher
}: Readonly<{
    student: React.ReactNode
    teacher: React.ReactNode
}>) {
    return (
        <div>
            {teacher}
        </div>
    )
}