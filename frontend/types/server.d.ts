type ServerResponse<T extends any> = {
    message: string
    data: T
    code: number
} 