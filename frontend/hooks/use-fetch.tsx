import { useEffect, useState, useCallback } from "react"
import { clientAPI } from "@/config/axios.config"
import { useTrigger } from "@/stores/trigger.store"

interface FetchResult<T> {
  data: T | null
  error: string | null
  isLoading: boolean
  mutate: () => Promise<T | null>
  refresh: () => void
}

export const useFetch = <T extends any>(url: string): FetchResult<T> => {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [refreshKey, setRefreshKey] = useState<number>(0)
  const { trigger } = useTrigger()

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await clientAPI.get<T>(url)
      setData(response.data)
      setError(null)
      return response.data
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "An error occurred")
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [url])

  // Mutate function to manually refetch data
  const mutate = useCallback(async () => {
    try {
      return await fetchData()
    } catch (error) {
      console.error("Error mutating data:", error)
      throw error
    }
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData, trigger, refreshKey])

  return { 
    data, 
    error, 
    isLoading, 
    mutate,
    // Force a refresh by incrementing the refresh key
    refresh: () => setRefreshKey(prev => prev + 1)
  }
}
