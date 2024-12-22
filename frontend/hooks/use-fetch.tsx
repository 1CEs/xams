import { useEffect, useState } from "react"
import { clientAPI } from "@/config/axios.config"
import { useTrigger } from "@/stores/trigger.store"

interface FetchResult<T> {
  data: T | null
  error: string | null
  isLoading: boolean
}

export const useFetch = <T extends any>(url: string): FetchResult<T> => {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { trigger } = useTrigger()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await clientAPI.get<T>(url)
        setData(response.data)
        setError(null)
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [url, trigger])

  return { data, error, isLoading }
}
