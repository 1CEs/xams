export class TooManyRequestError extends Error {
    constructor(message: string, options?: ErrorOptions){
        super(message, options)
    }
}