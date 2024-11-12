declare type ControllerResponse<T> = {
    message: string
    code: number
    data: T
}