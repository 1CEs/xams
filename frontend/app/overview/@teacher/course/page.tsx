"use client"

import { useSearchParams } from "next/navigation"

export default function CoursePage() {
    const params = useSearchParams()
    const _id = params.get('id')
    return (
        <div>
            Course Page {_id}
        </div>
    )
}