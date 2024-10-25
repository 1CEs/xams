type UserSignUpPayload = {
    username: string
    email: string
    password: string
    info: {
        firstName: string
        lastName: string
        birth: Date
    }
    profile_url: string
    role: string
}