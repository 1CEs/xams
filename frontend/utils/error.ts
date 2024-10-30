import { isAxiosError } from "axios"
import { toast } from "react-toastify"

export const errorHandler = (error: unknown) => {
    if(isAxiosError(error)) {
        toast.error(error.response?.data.err.message)
        return
    }
    toast.error(error as string)
}