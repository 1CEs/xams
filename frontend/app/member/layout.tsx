export default function MemberLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <div className="size-full flex justify-center px-4 sm:px-8 pt-8 sm:pt-16 pb-8">
            { children }
        </div>
    )
}