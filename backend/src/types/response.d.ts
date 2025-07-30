declare type ControllerResponse<T> = {
    message: string
    code: number
    data: T
    success?: boolean
    errorType?: string
    details?: any
}