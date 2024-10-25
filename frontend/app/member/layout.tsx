export default function MemberLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <div className="size-full flex justify-center pt-16">
            { children }
        </div>
    )
}