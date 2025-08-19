type UserSignUpPayload = {
    username: string
    email: string
    password: string
    info: {
        first_name: string
        last_name: string
    }
    profile_url: string
    role: string
}

type UserResponse = {
    _id: string
    username: string
    email: string
    role: string
    status: {
        is_banned: boolean
        ban_until?: string
        ban_reason?: string
    }
    info: {
        first_name: string
        last_name: string
    }
    profile_url: string
}

type BanUserPayload = {
    is_banned: boolean
    ban_until?: string
    ban_reason?: string
}