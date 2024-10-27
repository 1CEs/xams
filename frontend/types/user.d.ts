type UserSignUpPayload = {
    username: string
    email: string
    password: string
    info: {
        first_name: string
        last_name: string
        birth: Date
    }
    profile_url: string
    role: string
}

type UserResponse = {
    _id: string
    username: string
    email: string
    role: string
    refresh_token: string
    access_token: string
}