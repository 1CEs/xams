export class AuthorizationError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options)
    }
}