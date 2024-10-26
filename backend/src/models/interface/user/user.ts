import { ObjectId, Document } from "mongoose"

export interface IUser extends Document {
    _id:            ObjectId
    email:          string
    username:       string
    password:       string
    bio?:           string
    profile_url:    string
    role:           string
    info: {
        first_name:     string
        last_name:      string
        birth:          Date
    }
    refresh_token:  string
}