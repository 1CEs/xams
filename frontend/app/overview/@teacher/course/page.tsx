"use client"

import { useFetch } from "@/hooks/use-fetch"
import { useSearchParams } from "next/navigation"

export default function CoursePage() {
    const params = useSearchParams()
    const _id = params.get('id')
    const { data, error, isLoading } = useFetch("/course")
    return (
        <div>
            Course Page {_id}
        </div>
    )
}